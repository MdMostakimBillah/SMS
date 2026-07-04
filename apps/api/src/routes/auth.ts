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
        role: z.enum(['school_admin', 'teacher', 'student', 'hr_admin']).optional(),
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

  // Auth middleware for protected routes
  function requireAuth(req: Request, res: Response, next: Function) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    try {
      const token = authHeader.split(' ')[1]
      const payload = jwt.verify(token, jwtSecret) as { userId: string; role: string }
      ;(req as any).userId = payload.userId
      ;(req as any).userRole = payload.role
      next()
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }

  // Only super_admin can list accounts
  router.get('/accounts', requireAuth, async (req: Request, res: Response) => {
    if ((req as any).userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: super_admin only' })
    }
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

  // Get super admin credentials
  router.get('/super-admin', requireAuth, async (req: Request, res: Response) => {
    if ((req as any).userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    try {
      const emailConfig = await prisma.systemConfig.findUnique({ where: { key: 'super_admin_email' } })
      const passwordConfig = await prisma.systemConfig.findUnique({ where: { key: 'super_admin_password' } })
      res.json({
        email: emailConfig?.value || process.env.VITE_SUPER_ADMIN_EMAIL || 'admin@edutech.com',
        hasCustomPassword: !!passwordConfig,
      })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Update super admin credentials
  router.put('/super-admin', requireAuth, async (req: Request, res: Response) => {
    if ((req as any).userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    try {
      const body = z.object({
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
      }).parse(req.body)

      if (body.email) {
        await prisma.systemConfig.upsert({
          where: { key: 'super_admin_email' },
          update: { value: body.email },
          create: { key: 'super_admin_email', value: body.email },
        })
      }

      if (body.password) {
        const hashed = await bcrypt.hash(body.password, 12)
        await prisma.systemConfig.upsert({
          where: { key: 'super_admin_password' },
          update: { value: hashed },
          create: { key: 'super_admin_password', value: hashed },
        })
      }

      res.json({ success: true })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Verify super admin password (for login)
  router.post('/verify-super-admin', async (req: Request, res: Response) => {
    try {
      const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body)

      // Check database first
      const emailConfig = await prisma.systemConfig.findUnique({ where: { key: 'super_admin_email' } })
      const passwordConfig = await prisma.systemConfig.findUnique({ where: { key: 'super_admin_password' } })

      const storedEmail = emailConfig?.value || process.env.VITE_SUPER_ADMIN_EMAIL || 'admin@edutech.com'
      const storedPasswordHash = passwordConfig?.value

      if (body.email !== storedEmail) {
        return res.json({ valid: false })
      }

      // If custom password exists in DB, verify against it
      if (storedPasswordHash) {
        const valid = await bcrypt.compare(body.password, storedPasswordHash)
        return res.json({ valid })
      }

      // Fallback to .env password (plain text comparison for default)
      const envPassword = process.env.VITE_SUPER_ADMIN_PASSWORD || 'Admin@123456'
      res.json({ valid: body.password === envPassword })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
