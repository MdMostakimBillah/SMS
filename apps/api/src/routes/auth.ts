import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export function authRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const body = loginSchema.parse(req.body)
      const user = await prisma.user.findUnique({
        where: { email: body.email },
        include: { school: true },
      })
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
      const valid = await bcrypt.compare(body.password, user.passwordHash)
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
      const token = jwt.sign(
        { userId: user.id, schoolId: user.schoolId, role: user.role },
        jwtSecret,
        { expiresIn: '24h' }
      )
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.school?.name,
          avatar: user.avatar,
        },
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const body = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        role: z.enum(['super_admin', 'school_admin', 'teacher', 'student', 'hr_admin']).optional(),
        schoolId: z.string().uuid().optional(),
      }).parse(req.body)

      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      })
      if (existing) {
        return res.status(409).json({ error: 'User with this email already exists' })
      }
      const passwordHash = await bcrypt.hash(body.password, 12)
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          role: body.role || 'teacher',
          schoolId: body.schoolId || null,
        },
        include: { school: true },
      })
      const token = jwt.sign(
        { userId: user.id, schoolId: user.schoolId, role: user.role },
        jwtSecret,
        { expiresIn: '24h' }
      )
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.school?.name,
          avatar: user.avatar,
        },
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/accounts', async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      res.json(users)
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
