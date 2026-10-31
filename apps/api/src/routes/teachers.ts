import { Router, type Response } from 'express'
import type { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002'
}
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole, requireSchool, resolveTenantReadScope } from '../middleware/rbac.js'
import { audit } from '../audit.js'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
})

/** `?schoolId=` is honoured only for super_admin (see resolveReadScope). */
const listQuerySchema = paginationSchema.extend({
  schoolId: z.string().min(1).optional(),
})

const nullableString = z.string().nullable().optional()

/**
 * Editable fields only — `schoolId`, `id`, `createdAt` etc. are deliberately
 * absent, so Zod strips them from request bodies (mass-assignment safe) and the
 * Prisma `create`/`update` calls map every column explicitly.
 *
 * Covers every editable column of the existing Prisma `Teacher` model so the
 * full profile form (Phase 7 frontend migration) persists without data loss.
 */
const createTeacherSchema = z.object({
  nameEn: z.string().min(1, 'nameEn is required'),
  nameBn: nullableString,
  gender: nullableString,
  dob: nullableString,
  bloodGroup: nullableString,
  religion: nullableString,
  phone: nullableString,
  email: z.string().email().nullable().optional(),
  address: nullableString,
  nid: nullableString,
  emergencyPhone: nullableString,
  photo: nullableString,
  departmentId: nullableString,
  subjectIds: z.array(z.string()).optional(),
  designation: nullableString,
  qualification: nullableString,
  experience: nullableString,
  salary: z.coerce.number().nullable().optional(),
  salaryStartDate: nullableString,
  bonus: z.coerce.number().nullable().optional(),
  overtime: z.coerce.number().nullable().optional(),
  festivalBonus: z.coerce.number().nullable().optional(),
  status: z.string().min(1).optional(),
  category: nullableString,
  joiningDate: nullableString,
  inTime: nullableString,
  outTime: nullableString,
  fatherNameEn: nullableString,
  fatherNameBn: nullableString,
  fatherPhone: nullableString,
  fatherNid: nullableString,
  motherNameEn: nullableString,
  motherNameBn: nullableString,
  motherPhone: nullableString,
  guardianName: nullableString,
  guardianPhone: nullableString,
  guardianRelation: nullableString,
  parentAddress: nullableString,
  signature: nullableString,
  expertSubjects: nullableString,
  applySalaryRule: z.boolean().nullable().optional(),
})

const updateTeacherSchema = createTeacherSchema.partial()

/**
 * Phase 3/4 authorization policy (approved):
 * - READ  = school_admin + hr_admin (own school) + super_admin (global, read-only)
 * - WRITE = school_admin + hr_admin only — super_admin is explicitly excluded
 *   from create/update/delete; unknown roles are denied by requireRole.
 */
const READ_ROLES = ['school_admin', 'hr_admin', 'super_admin']
const WRITE_ROLES = ['school_admin', 'hr_admin']

/** departmentId must exist inside the caller's own school (blocks cross-tenant references). */
async function departmentInSchool(prisma: PrismaClient, departmentId: string, schoolId: string): Promise<boolean> {
  const dept = await prisma.department.findFirst({ where: { id: departmentId, schoolId }, select: { id: true } })
  return dept !== null
}

export function teacherRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(prisma, jwtSecret)

  router.get('/', auth, requireRole(...READ_ROLES), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = listQuerySchema.parse(req.query)
      const scope = resolveTenantReadScope(req, query.schoolId)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const skip = (query.page - 1) * query.pageSize

      const [teachers, total] = await Promise.all([
        prisma.teacher.findMany({
          where: scope.where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.pageSize,
        }),
        prisma.teacher.count({ where: scope.where }),
      ])

      res.json({ data: teachers, total, page: query.page, pageSize: query.pageSize })
      if (req.userRole === 'super_admin' && query.schoolId) {
        // Privileged cross-tenant read — always audited.
        audit({
          action: 'teacher.list.cross_tenant',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: query.schoolId,
          outcome: 'success',
          detail: { total },
        })
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/:id', auth, requireRole(...READ_ROLES), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const scope = resolveTenantReadScope(req)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const id = req.params.id as string
      // Tenant scope lives inside the query itself: a foreign ID yields 404,
      // never another school's data.
      const teacher = await prisma.teacher.findFirst({ where: { id, ...scope.where } })
      if (req.userRole === 'super_admin') {
        audit({
          action: 'teacher.read',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: teacher?.schoolId ?? null,
          resourceId: id,
          outcome: teacher ? 'success' : 'not_found',
        })
      }
      if (!teacher) return res.status(404).json({ error: 'Teacher not found' })
      res.json(teacher)
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string // trusted session state — never the body
      const body = createTeacherSchema.parse(req.body)

      if (body.departmentId && !(await departmentInSchool(prisma, body.departmentId, schoolId))) {
        audit({
          action: 'teacher.create',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId,
          outcome: 'denied',
          detail: { reason: 'foreign_department' },
        })
        return res.status(400).json({ error: 'Invalid departmentId' })
      }

      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { storageMode: true },
      })
      if (school?.storageMode === 'local_computer') {
        return res.status(400).json({
          error: 'Institution is in Local Computer storage mode. Operational data must be stored locally on the PC, not on the server database.',
        })
      }

      const existingTeachers = await prisma.teacher.findMany({
        where: { schoolId },
        select: { id: true },
      })
      let maxNum = 0
      for (const t of existingTeachers) {
        const match = t.id.match(/^ET(\d+)$/i)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNum) maxNum = num
        }
      }
      const newTeacherId = maxNum > 0 ? `ET${String(maxNum + 1).padStart(4, '0')}` : `ET${String(existingTeachers.length + 1).padStart(4, '0')}`

      const teacher = await prisma.teacher.create({
        data: {
          id: newTeacherId,
          schoolId,
          nameEn: body.nameEn,
          nameBn: body.nameBn ?? null,
          gender: body.gender ?? null,
          dob: body.dob ?? null,
          bloodGroup: body.bloodGroup ?? null,
          religion: body.religion ?? null,
          phone: body.phone ?? null,
          email: body.email ?? null,
          address: body.address ?? null,
          nid: body.nid ?? null,
          emergencyPhone: body.emergencyPhone ?? null,
          photo: body.photo ?? null,
          departmentId: body.departmentId ?? null,
          subjectIds: body.subjectIds ?? [],
          designation: body.designation ?? null,
          qualification: body.qualification ?? null,
          experience: body.experience ?? null,
          salary: body.salary ?? null,
          salaryStartDate: body.salaryStartDate ?? null,
          bonus: body.bonus ?? null,
          overtime: body.overtime ?? null,
          festivalBonus: body.festivalBonus ?? null,
          status: body.status || 'active',
          category: body.category ?? null,
          joiningDate: body.joiningDate ?? null,
          inTime: body.inTime ?? null,
          outTime: body.outTime ?? null,
          fatherNameEn: body.fatherNameEn ?? null,
          fatherNameBn: body.fatherNameBn ?? null,
          fatherPhone: body.fatherPhone ?? null,
          fatherNid: body.fatherNid ?? null,
          motherNameEn: body.motherNameEn ?? null,
          motherNameBn: body.motherNameBn ?? null,
          motherPhone: body.motherPhone ?? null,
          guardianName: body.guardianName ?? null,
          guardianPhone: body.guardianPhone ?? null,
          guardianRelation: body.guardianRelation ?? null,
          parentAddress: body.parentAddress ?? null,
          signature: body.signature ?? null,
          expertSubjects: body.expertSubjects ?? null,
          applySalaryRule: body.applySalaryRule ?? false,
        },
      })
      audit({ action: 'teacher.create', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: teacher.id, outcome: 'success' })
      res.status(201).json(teacher)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Teacher with this email already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.put('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const id = req.params.id as string

      const body = updateTeacherSchema.parse(req.body)
      if (body.departmentId && !(await departmentInSchool(prisma, body.departmentId, schoolId))) {
        audit({
          action: 'teacher.update',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId,
          outcome: 'denied',
          detail: { reason: 'foreign_department' },
        })
        return res.status(400).json({ error: 'Invalid departmentId' })
      }

      const data: Prisma.TeacherUpdateManyMutationInput = {}
      if (body.nameEn !== undefined) data.nameEn = body.nameEn
      if (body.nameBn !== undefined) data.nameBn = body.nameBn
      if (body.gender !== undefined) data.gender = body.gender
      if (body.dob !== undefined) data.dob = body.dob
      if (body.bloodGroup !== undefined) data.bloodGroup = body.bloodGroup
      if (body.religion !== undefined) data.religion = body.religion
      if (body.phone !== undefined) data.phone = body.phone
      if (body.email !== undefined) data.email = body.email
      if (body.address !== undefined) data.address = body.address
      if (body.nid !== undefined) data.nid = body.nid
      if (body.emergencyPhone !== undefined) data.emergencyPhone = body.emergencyPhone
      if (body.photo !== undefined) data.photo = body.photo
      if (body.departmentId !== undefined) data.departmentId = body.departmentId
      if (body.subjectIds !== undefined) data.subjectIds = body.subjectIds
      if (body.designation !== undefined) data.designation = body.designation
      if (body.qualification !== undefined) data.qualification = body.qualification
      if (body.experience !== undefined) data.experience = body.experience
      if (body.salary !== undefined) data.salary = body.salary
      if (body.salaryStartDate !== undefined) data.salaryStartDate = body.salaryStartDate
      if (body.bonus !== undefined) data.bonus = body.bonus
      if (body.overtime !== undefined) data.overtime = body.overtime
      if (body.festivalBonus !== undefined) data.festivalBonus = body.festivalBonus
      if (body.status !== undefined) data.status = body.status
      if (body.category !== undefined) data.category = body.category
      if (body.joiningDate !== undefined) data.joiningDate = body.joiningDate
      if (body.inTime !== undefined) data.inTime = body.inTime
      if (body.outTime !== undefined) data.outTime = body.outTime
      if (body.fatherNameEn !== undefined) data.fatherNameEn = body.fatherNameEn
      if (body.fatherNameBn !== undefined) data.fatherNameBn = body.fatherNameBn
      if (body.fatherPhone !== undefined) data.fatherPhone = body.fatherPhone
      if (body.fatherNid !== undefined) data.fatherNid = body.fatherNid
      if (body.motherNameEn !== undefined) data.motherNameEn = body.motherNameEn
      if (body.motherNameBn !== undefined) data.motherNameBn = body.motherNameBn
      if (body.motherPhone !== undefined) data.motherPhone = body.motherPhone
      if (body.guardianName !== undefined) data.guardianName = body.guardianName
      if (body.guardianPhone !== undefined) data.guardianPhone = body.guardianPhone
      if (body.guardianRelation !== undefined) data.guardianRelation = body.guardianRelation
      if (body.parentAddress !== undefined) data.parentAddress = body.parentAddress
      if (body.signature !== undefined) data.signature = body.signature
      if (body.expertSubjects !== undefined) data.expertSubjects = body.expertSubjects
      if (body.applySalaryRule !== undefined) data.applySalaryRule = body.applySalaryRule

      if (Object.keys(data).length > 0) {
        // Atomic tenant-scoped write: the school check and the update happen in
        // one statement, closing the find-then-write (TOCTOU) window. A foreign
        // ID matches zero rows -> 404, indistinguishable from "does not exist".
        const { count } = await prisma.teacher.updateMany({ where: { id, schoolId }, data })
        if (count === 0) {
          audit({ action: 'teacher.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
          return res.status(404).json({ error: 'Teacher not found' })
        }
      }

      const teacher = await prisma.teacher.findFirst({ where: { id, schoolId } })
      if (!teacher) {
        audit({ action: 'teacher.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Teacher not found' })
      }
      audit({ action: 'teacher.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'success' })
      res.json(teacher)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Teacher with this email already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.delete('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const id = req.params.id as string

      // Atomic tenant-scoped delete (see PUT). Cross-tenant IDs -> 404.
      const { count } = await prisma.teacher.deleteMany({ where: { id, schoolId } })
      if (count === 0) {
        audit({ action: 'teacher.delete', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Teacher not found' })
      }
      audit({ action: 'teacher.delete', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'success' })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
