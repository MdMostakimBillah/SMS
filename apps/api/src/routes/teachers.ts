import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'

export function teacherRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(jwtSecret)

  router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      const teachers = await prisma.teacher.findMany({
        where: { schoolId: schoolId! },
        orderBy: { createdAt: 'desc' },
      })
      res.json(teachers)
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      const id = req.params.id as string
      const teacher = await prisma.teacher.findFirst({
        where: { id, schoolId: schoolId! },
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
      const { nameEn, nameBn, phone, email, departmentId, designation, salary, status, joiningDate, inTime, outTime, photo } = req.body
      if (!nameEn) return res.status(400).json({ error: 'nameEn is required' })

      const teacher = await prisma.teacher.create({
        data: {
          schoolId: schoolId!,
          nameEn,
          nameBn: nameBn || null,
          phone: phone || null,
          email: email || null,
          departmentId: departmentId || null,
          designation: designation || null,
          salary: salary || null,
          status: status || 'active',
          joiningDate: joiningDate || null,
          inTime: inTime || null,
          outTime: outTime || null,
          photo: photo || null,
        },
      })
      res.status(201).json(teacher)
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Teacher with this email already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      const id = req.params.id as string
      const existing = await prisma.teacher.findFirst({ where: { id, schoolId: schoolId! } })
      if (!existing) return res.status(404).json({ error: 'Teacher not found' })

      const { nameEn, nameBn, phone, email, departmentId, designation, salary, status, joiningDate, inTime, outTime, photo } = req.body
      const teacher = await prisma.teacher.update({
        where: { id },
        data: {
          ...(nameEn !== undefined && { nameEn }),
          ...(nameBn !== undefined && { nameBn }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(departmentId !== undefined && { departmentId }),
          ...(designation !== undefined && { designation }),
          ...(salary !== undefined && { salary }),
          ...(status !== undefined && { status }),
          ...(joiningDate !== undefined && { joiningDate }),
          ...(inTime !== undefined && { inTime }),
          ...(outTime !== undefined && { outTime }),
          ...(photo !== undefined && { photo }),
        },
      })
      res.json(teacher)
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Teacher with this email already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId
      const id = req.params.id as string
      const existing = await prisma.teacher.findFirst({ where: { id, schoolId: schoolId! } })
      if (!existing) return res.status(404).json({ error: 'Teacher not found' })

      await prisma.teacher.delete({ where: { id } })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
