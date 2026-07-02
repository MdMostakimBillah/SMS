import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  schoolId: z.string().uuid(),
})

export function authRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const body = loginSchema.parse(req.body)
      const user = await prisma.user.findUnique({
        where: { email_schoolId: { email: body.email, schoolId: body.schoolId } },
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
      res.json({ token, user: { id: user.id, email: user.email, role: user.role, schoolId: user.schoolId } })
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
        schoolId: z.string().uuid(),
        role: z.enum(['super_admin', 'school_admin', 'teacher', 'student', 'hr_admin']).optional(),
      }).parse(req.body)

      const existing = await prisma.user.findUnique({
        where: { email_schoolId: { email: body.email, schoolId: body.schoolId } },
      })
      if (existing) {
        return res.status(409).json({ error: 'User already exists' })
      }
      const passwordHash = await bcrypt.hash(body.password, 12)
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          schoolId: body.schoolId,
          role: body.role || 'teacher',
        },
      })
      const token = jwt.sign(
        { userId: user.id, schoolId: user.schoolId, role: user.role },
        jwtSecret,
        { expiresIn: '24h' }
      )
      res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, schoolId: user.schoolId } })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
