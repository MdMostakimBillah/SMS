import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

export function authMiddleware(jwtSecret: string) {
  return (req: Request, res: Response, next: () => void) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }
    try {
      const token = authHeader.slice(7)
      const payload = jwt.verify(token, jwtSecret) as { userId: string; schoolId: string; role: string }
      ;(req as any).userId = payload.userId
      ;(req as any).schoolId = payload.schoolId
      ;(req as any).role = payload.role
      next()
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }
}

export function teacherRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = authMiddleware(jwtSecret)

  router.get('/', auth, async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId as string
      const teachers = await prisma.teacher.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
      })
      res.json(teachers)
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/:id', auth, async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId as string
      const teacher = await prisma.teacher.findFirst({
        where: { id: req.params.id, schoolId },
      })
      if (!teacher) return res.status(404).json({ error: 'Teacher not found' })
      res.json(teacher)
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/', auth, async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId as string
      const { nameEn, nameBn, phone, email, departmentId, designation, salary, status, joiningDate, inTime, outTime, photo } = req.body
      if (!nameEn) return res.status(400).json({ error: 'nameEn is required' })

      const teacher = await prisma.teacher.create({
        data: {
          schoolId,
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

  router.put('/:id', auth, async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId as string
      const existing = await prisma.teacher.findFirst({ where: { id: req.params.id, schoolId } })
      if (!existing) return res.status(404).json({ error: 'Teacher not found' })

      const { nameEn, nameBn, phone, email, departmentId, designation, salary, status, joiningDate, inTime, outTime, photo } = req.body
      const teacher = await prisma.teacher.update({
        where: { id: req.params.id },
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

  router.delete('/:id', auth, async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId as string
      const existing = await prisma.teacher.findFirst({ where: { id: req.params.id, schoolId } })
      if (!existing) return res.status(404).json({ error: 'Teacher not found' })

      await prisma.teacher.delete({ where: { id: req.params.id } })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
