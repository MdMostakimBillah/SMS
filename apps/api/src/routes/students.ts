import { Router, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole, requireSchool, resolveTenantReadScope } from '../middleware/rbac.js'
import { audit } from '../audit.js'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
  schoolId: z.string().min(1).optional(),
  class: z.string().optional(),
  section: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

const nullableString = z.string().nullable().optional()

const studentSchema = z.object({
  nameEn: z.string().min(1, 'Name is required'),
  nameBn: nullableString,
  phone: nullableString,
  email: z.string().email().nullable().optional().or(z.literal('')),
  photo: nullableString,
  class: nullableString,
  section: nullableString,
  admissionDate: nullableString,
  status: z.string().optional().default('approved'),
  fatherNameEn: nullableString,
  fatherPhone: nullableString,
  motherNameEn: nullableString,
  motherPhone: nullableString,
  district: nullableString,
  active: z.boolean().optional().default(true),
})

const READ_ROLES = ['school_admin', 'hr_admin', 'teacher', 'super_admin']
const WRITE_ROLES = ['school_admin', 'hr_admin', 'super_admin']

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
      if (q.status) {
        where.status = q.status
      }
      if (q.search) {
        where.OR = [
          { nameEn: { contains: q.search, mode: 'insensitive' } },
          { nameBn: { contains: q.search, mode: 'insensitive' } },
          { phone: { contains: q.search } },
          { email: { contains: q.search, mode: 'insensitive' } },
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
   * Create a new student within the authenticated school tenant.
   */
  router.post('/', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = studentSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }

      const student = await prisma.student.create({
        data: {
          schoolId: req.schoolId!,
          nameEn: parsed.data.nameEn.trim(),
          nameBn: parsed.data.nameBn?.trim() || null,
          phone: parsed.data.phone?.trim() || null,
          email: parsed.data.email?.trim() || null,
          photo: parsed.data.photo || null,
          class: parsed.data.class?.trim() || null,
          section: parsed.data.section?.trim() || null,
          admissionDate: parsed.data.admissionDate?.trim() || new Date().toISOString().split('T')[0],
          status: parsed.data.status || 'approved',
          fatherNameEn: parsed.data.fatherNameEn?.trim() || null,
          fatherPhone: parsed.data.fatherPhone?.trim() || null,
          motherNameEn: parsed.data.motherNameEn?.trim() || null,
          motherPhone: parsed.data.motherPhone?.trim() || null,
          district: parsed.data.district?.trim() || null,
          active: parsed.data.active ?? true,
        },
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

      const student = await prisma.student.update({
        where: { id },
        data: {
          ...(parsed.data.nameEn !== undefined ? { nameEn: parsed.data.nameEn.trim() } : {}),
          ...(parsed.data.nameBn !== undefined ? { nameBn: parsed.data.nameBn?.trim() || null } : {}),
          ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone?.trim() || null } : {}),
          ...(parsed.data.email !== undefined ? { email: parsed.data.email?.trim() || null } : {}),
          ...(parsed.data.photo !== undefined ? { photo: parsed.data.photo } : {}),
          ...(parsed.data.class !== undefined ? { class: parsed.data.class?.trim() || null } : {}),
          ...(parsed.data.section !== undefined ? { section: parsed.data.section?.trim() || null } : {}),
          ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
          ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
        },
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
