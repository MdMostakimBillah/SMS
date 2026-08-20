import { Router, type Request, type Response } from 'express'
import type { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
})

const nullableString = z.string().nullable().optional()

const createTeacherSchema = z.object({
  nameEn: z.string().min(1, 'nameEn is required'),
  nameBn: nullableString,
  phone: nullableString,
  email: z.string().email().nullable().optional(),
  departmentId: nullableString,
  designation: nullableString,
  salary: z.coerce.number().nullable().optional(),
  status: z.string().min(1).optional(),
  joiningDate: nullableString,
  inTime: nullableString,
  outTime: nullableString,
  photo: nullableString,
})

const updateTeacherSchema = createTeacherSchema.partial()

export function teacherRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(jwtSecret)

  router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      if (!schoolId) return res.status(400).json({ error: 'Missing school context' })

      const query = paginationSchema.parse(req.query)
      const skip = (query.page - 1) * query.pageSize

      const [teachers, total] = await Promise.all([
        prisma.teacher.findMany({
          where: { schoolId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.pageSize,
        }),
        prisma.teacher.count({ where: { schoolId } }),
      ])

      res.json({ data: teachers, total, page: query.page, pageSize: query.pageSize })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      if (!schoolId) return res.status(400).json({ error: 'Missing school context' })
      const id = req.params.id as string
      const teacher = await prisma.teacher.findFirst({
        where: { id, schoolId },
      })
      if (!teacher) return res.status(404).json({ error: 'Teacher not found' })
      res.json(teacher)
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      if (!schoolId) return res.status(400).json({ error: 'Missing school context' })
      const body = createTeacherSchema.parse(req.body)

      const teacher = await prisma.teacher.create({
        data: {
          schoolId,
          nameEn: body.nameEn,
          nameBn: body.nameBn ?? null,
          phone: body.phone ?? null,
          email: body.email ?? null,
          departmentId: body.departmentId ?? null,
          designation: body.designation ?? null,
          salary: body.salary ?? null,
          status: body.status || 'active',
          joiningDate: body.joiningDate ?? null,
          inTime: body.inTime ?? null,
          outTime: body.outTime ?? null,
          photo: body.photo ?? null,
        },
      })
      res.status(201).json(teacher)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Teacher with this email already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      if (!schoolId) return res.status(400).json({ error: 'Missing school context' })
      const id = req.params.id as string
      const existing = await prisma.teacher.findFirst({ where: { id, schoolId } })
      if (!existing) return res.status(404).json({ error: 'Teacher not found' })

      const body = updateTeacherSchema.parse(req.body)
      const data: Prisma.TeacherUpdateInput = {}
      if (body.nameEn !== undefined) data.nameEn = body.nameEn
      if (body.nameBn !== undefined) data.nameBn = body.nameBn
      if (body.phone !== undefined) data.phone = body.phone
      if (body.email !== undefined) data.email = body.email
      if (body.departmentId !== undefined) data.departmentId = body.departmentId
      if (body.designation !== undefined) data.designation = body.designation
      if (body.salary !== undefined) data.salary = body.salary
      if (body.status !== undefined) data.status = body.status
      if (body.joiningDate !== undefined) data.joiningDate = body.joiningDate
      if (body.inTime !== undefined) data.inTime = body.inTime
      if (body.outTime !== undefined) data.outTime = body.outTime
      if (body.photo !== undefined) data.photo = body.photo

      const teacher = await prisma.teacher.update({ where: { id }, data })
      res.json(teacher)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Teacher with this email already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      if (!schoolId) return res.status(400).json({ error: 'Missing school context' })
      const id = req.params.id as string
      const existing = await prisma.teacher.findFirst({ where: { id, schoolId } })
      if (!existing) return res.status(404).json({ error: 'Teacher not found' })

      await prisma.teacher.delete({ where: { id } })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}