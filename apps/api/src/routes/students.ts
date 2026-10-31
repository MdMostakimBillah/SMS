import { Router, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole, requireSchool, resolveTenantReadScope } from '../middleware/rbac.js'
import { audit } from '../audit.js'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(500),
  schoolId: z.string().min(1).optional(),
  class: z.string().optional(),
  section: z.string().optional(),
  academicYear: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

const nullableString = z.string().nullable().optional()

export const studentSchema = z.object({
  id: z.string().min(1).optional(),
  nameEn: z.string().min(1, 'Name is required'),
  nameBn: nullableString,
  phone: nullableString,
  email: z.string().email().nullable().optional().or(z.literal('')),
  photo: nullableString,
  class: nullableString,
  section: nullableString,
  roll: nullableString,
  academicYear: nullableString,
  dob: nullableString,
  gender: nullableString,
  bloodGroup: nullableString,
  religion: nullableString,
  nationality: nullableString,
  admissionDate: nullableString,
  previousSchool: nullableString,
  presentAddress: nullableString,
  permanentAddress: nullableString,
  status: z.string().optional().default('approved'),
  fatherNameEn: nullableString,
  fatherNameBn: nullableString,
  fatherOccupation: nullableString,
  fatherPhone: nullableString,
  fatherNid: nullableString,
  motherNameEn: nullableString,
  motherNameBn: nullableString,
  motherOccupation: nullableString,
  motherPhone: nullableString,
  motherNid: nullableString,
  guardianName: nullableString,
  guardianRelation: nullableString,
  guardianPhone: nullableString,
  district: nullableString,
  teacherId: nullableString,
  billingDate: nullableString,
  approvedAt: nullableString,
  approvedBy: nullableString,
  inactiveAt: nullableString,
  inactiveReason: nullableString,
  active: z.boolean().optional().default(true),
})

const READ_ROLES = ['school_admin', 'hr_admin', 'teacher', 'super_admin']
const WRITE_ROLES = ['school_admin', 'hr_admin', 'super_admin']

function extractStudentPayload(data: z.infer<typeof studentSchema>, schoolId: string) {
  return {
    schoolId,
    ...(data.id ? { id: data.id } : {}),
    nameEn: data.nameEn.trim(),
    nameBn: data.nameBn?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    photo: data.photo || null,
    class: data.class?.trim() || null,
    section: data.section?.trim() || null,
    roll: data.roll?.trim() || null,
    academicYear: data.academicYear?.trim() || null,
    dob: data.dob?.trim() || null,
    gender: data.gender?.trim() || null,
    bloodGroup: data.bloodGroup?.trim() || null,
    religion: data.religion?.trim() || null,
    nationality: data.nationality?.trim() || null,
    admissionDate: data.admissionDate?.trim() || new Date().toISOString().split('T')[0],
    previousSchool: data.previousSchool?.trim() || null,
    presentAddress: data.presentAddress?.trim() || null,
    permanentAddress: data.permanentAddress?.trim() || null,
    status: data.status || 'approved',
    fatherNameEn: data.fatherNameEn?.trim() || null,
    fatherNameBn: data.fatherNameBn?.trim() || null,
    fatherOccupation: data.fatherOccupation?.trim() || null,
    fatherPhone: data.fatherPhone?.trim() || null,
    fatherNid: data.fatherNid?.trim() || null,
    motherNameEn: data.motherNameEn?.trim() || null,
    motherNameBn: data.motherNameBn?.trim() || null,
    motherOccupation: data.motherOccupation?.trim() || null,
    motherPhone: data.motherPhone?.trim() || null,
    motherNid: data.motherNid?.trim() || null,
    guardianName: data.guardianName?.trim() || null,
    guardianRelation: data.guardianRelation?.trim() || null,
    guardianPhone: data.guardianPhone?.trim() || null,
    district: data.district?.trim() || null,
    teacherId: data.teacherId?.trim() || null,
    billingDate: data.billingDate?.trim() || null,
    approvedAt: data.approvedAt?.trim() || null,
    approvedBy: data.approvedBy?.trim() || null,
    inactiveAt: data.inactiveAt?.trim() || null,
    inactiveReason: data.inactiveReason?.trim() || null,
    active: data.active ?? true,
  }
}

export function studentRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(prisma, jwtSecret)

  /**
   * List students scoped to the caller's school tenant.
   */
  router.get('/', auth, requireRole(...READ_ROLES), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const q = paginationSchema.parse(req.query)
      const scope = resolveTenantReadScope(req, q.schoolId)
      if (!scope.ok) {
        return res.status(403).json({ error: 'No tenant context' })
      }

      const where: Record<string, unknown> = {
        ...scope.where,
      }

      if (q.class) {
        where.class = q.class
      }
      if (q.section) {
        where.section = q.section
      }
      if (q.academicYear) {
        where.academicYear = q.academicYear
      }
      if (q.status) {
        where.status = q.status
      }
      if (q.search) {
        where.OR = [
          { nameEn: { contains: q.search, mode: 'insensitive' } },
          { nameBn: { contains: q.search, mode: 'insensitive' } },
          { phone: { contains: q.search } },
          { email: { contains: q.search, mode: 'insensitive' } },
          { roll: { contains: q.search } },
          { id: { contains: q.search } },
        ]
      }

      const [total, students] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.findMany({
          where,
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      res.json({
        students,
        total,
        page: q.page,
        pageSize: q.pageSize,
        totalPages: Math.ceil(total / q.pageSize),
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters', details: err.errors })
      }
      console.error('[students] list failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Bulk create or update students.
   */
  router.post('/bulk', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bodySchema = z.object({
        students: z.array(studentSchema).min(1, 'At least one student required'),
      })
      const parsed = bodySchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }

      const schoolId = req.schoolId!
      const results = []

      for (const item of parsed.data.students) {
        const payload = extractStudentPayload(item, schoolId)
        if (item.id) {
          const existing = await prisma.student.findFirst({
            where: { id: item.id, schoolId },
          })
          if (existing) {
            const updated = await prisma.student.update({
              where: { id: item.id },
              data: payload,
            })
            results.push(updated)
            continue
          }
        }
        const created = await prisma.student.create({
          data: payload,
        })
        results.push(created)
      }

      audit({
        action: 'student.bulk_save',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId,
        detail: { count: results.length },
        outcome: 'success',
      })

      res.status(200).json({ students: results, count: results.length })
    } catch (err) {
      console.error('[students] bulk save failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Create a new student within the authenticated school tenant.
   */
  router.post('/', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = studentSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }

      const payload = extractStudentPayload(parsed.data, req.schoolId!)

      const student = await prisma.student.create({
        data: payload,
      })

      audit({
        action: 'student.create',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId: req.schoolId!,
        resourceId: student.id,
        outcome: 'success',
      })

      res.status(201).json({ student })
    } catch (err) {
      console.error('[students] create failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Get single student by ID.
   */
  router.get('/:id', auth, requireRole(...READ_ROLES), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const scope = resolveTenantReadScope(req)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const id = req.params.id as string
      const student = await prisma.student.findFirst({
        where: { id, ...scope.where },
      })

      if (!student) {
        return res.status(404).json({ error: 'Student not found' })
      }

      res.json({ student })
    } catch (err) {
      console.error('[students] get failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Update student by ID.
   */
  router.put('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const parsed = studentSchema.partial().safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }

      const existing = await prisma.student.findFirst({
        where: { id, schoolId: req.schoolId! },
      })
      if (!existing) {
        return res.status(404).json({ error: 'Student not found' })
      }

      const updateData: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(parsed.data)) {
        if (val !== undefined) {
          updateData[key] = typeof val === 'string' ? val.trim() : val
        }
      }

      const student = await prisma.student.update({
        where: { id },
        data: updateData,
      })

      audit({
        action: 'student.update',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId: req.schoolId!,
        resourceId: student.id,
        outcome: 'success',
      })

      res.json({ student })
    } catch (err) {
      console.error('[students] update failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Delete student by ID.
   */
  router.delete('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const existing = await prisma.student.findFirst({
        where: { id, schoolId: req.schoolId! },
      })
      if (!existing) {
        return res.status(404).json({ error: 'Student not found' })
      }

      await prisma.student.delete({ where: { id } })

      audit({
        action: 'student.delete',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId: req.schoolId!,
        resourceId: id,
        outcome: 'success',
      })

      res.json({ success: true })
    } catch (err) {
      console.error('[students] delete failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
