import { Router, type Request, type Response } from 'express'
import type { PrismaClient, User } from '@prisma/client'
import { randomBytes, randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { hash, verify } from '@node-rs/argon2'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import {
  requireAuth,
  type AuthenticatedRequest,
  SESSION_COOKIE,
  CSRF_COOKIE,
  buildCookieOptions,
  SESSION_MAX_AGE_SECONDS,
} from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { requireTrustedOrigin } from '../middleware/origin.js'

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

const superAdminUpdateSchema = z.object({
  email: z.string().email().max(254).optional(),
  password: z.string().min(8).max(128).optional(),
  currentPassword: z.string().min(1).max(128).optional(),
})

const ARGON2_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 64 * 1024, // 64 MB
  timeCost: 3,
  parallelism: 1,
} as const

/** Precomputed hash used to equalize timing when an account does not exist. */
const DUMMY_PASSWORD_HASH = await hash(randomBytes(16), ARGON2_OPTIONS)

export interface PublicUser {
  id: string
  email: string
  name: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  avatar: string | null
}

function toPublicUser(user: User & { school?: { name: string } | null }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user.school?.name ?? null,
    avatar: user.avatar,
  }
}

function isCookieSecure(): boolean {
  return process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
}

/** Database-level email uniqueness is authoritative under concurrency (P2002). */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002'
}

export function authRouter(prisma: PrismaClient, jwtSecret: string, corsOrigin: string) {
  const router = Router()

  const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later' },
  })

  async function issueSession(res: Response, user: User): Promise<void> {
    const jti = randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
    await prisma.session.create({ data: { id: jti, userId: user.id, expiresAt } })

    const token = jwt.sign(
      { jti, userId: user.id, schoolId: user.schoolId, role: user.role },
      jwtSecret,
      { expiresIn: SESSION_MAX_AGE_SECONDS }
    )

    const secure = isCookieSecure()
    res.cookie(SESSION_COOKIE, token, buildCookieOptions(true, secure))
    res.cookie(CSRF_COOKIE, randomBytes(32).toString('hex'), buildCookieOptions(false, secure))
  }

  /** Login — server-authoritative. Never reveals whether the account exists. */
  router.post('/login', requireTrustedOrigin(corsOrigin), loginLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }
      const email = parsed.data.email.trim().toLowerCase()

      const user = await prisma.user.findUnique({
        where: { email },
        include: { school: true },
      })

      // Always run a verification to avoid a timing side channel on account existence
      const passwordValid = await verify(user?.passwordHash ?? DUMMY_PASSWORD_HASH, parsed.data.password)

      if (!user || !user.isActive || !passwordValid) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      await issueSession(res, user)
      res.json({ user: toPublicUser(user) })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      console.error('[auth] login failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /** Current session — used by the frontend to restore state after reload. */
  router.get('/me', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { school: true },
      })
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Authentication required' })
      }
      res.json({ user: toPublicUser(user) })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /** Logout — revokes the server-side session and clears cookies. */
  router.post('/logout', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await prisma.session.updateMany({
        where: { id: req.sessionId },
        data: { revokedAt: new Date() },
      })
    } catch (err) {
      console.error('[auth] logout revoke failed:', err instanceof Error ? err.message : err)
    }
    const secure = isCookieSecure()
    res.clearCookie(SESSION_COOKIE, { path: '/', secure, sameSite: 'lax', httpOnly: true })
    res.clearCookie(CSRF_COOKIE, { path: '/', secure, sameSite: 'lax' })
    res.json({ success: true })
  })

  /**
   * Self-registration is disabled: users must be provisioned by an
   * administrator. This endpoint previously accepted arbitrary role + schoolId
   * from anonymous callers (cross-tenant privilege escalation).
   */
  router.post('/register', (_req: Request, res: Response) => {
    res.status(403).json({ error: 'Registration is disabled. Contact your administrator.' })
  })

  // Only super_admin can list accounts (centralized deny-by-default check)
  router.get('/accounts', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
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

  // Get super admin email (never returns password material)
  router.get('/super-admin', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const superAdmin = await prisma.user.findFirst({ where: { role: 'super_admin' } })
      if (!superAdmin) {
        return res.status(404).json({ error: 'Super admin not configured' })
      }
      res.json({ email: superAdmin.email, hasCustomPassword: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Update super admin email/password (verifies current password first)
  router.put('/super-admin', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = superAdminUpdateSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }
      const { email, password, currentPassword } = parsed.data

      const superAdmin = await prisma.user.findFirst({ where: { role: 'super_admin' } })
      if (!superAdmin) {
        return res.status(404).json({ error: 'Super admin not configured' })
      }

      // Any credential change — password OR email — requires re-authentication
      // with the current password (verified once below).
      const wantsPassword = password !== undefined
      const wantsEmail = email !== undefined && email.toLowerCase() !== superAdmin.email
      if (wantsPassword || wantsEmail) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required' })
        }
        const valid = await verify(superAdmin.passwordHash, currentPassword)
        if (!valid) {
          return res.status(403).json({ error: 'Current password is incorrect' })
        }
      }

      // Email conflict is detected before any write (fail fast for the
      // common case) — but the pre-check alone is NOT relied upon to prevent
      // races: the database unique constraint remains authoritative inside
      // the transaction below (P2002 → 409 with full rollback).
      let target: string | null = null
      if (wantsEmail) {
        target = email!.trim().toLowerCase()
        const clash = await prisma.user.findUnique({ where: { email: target } })
        if (clash && clash.id !== superAdmin.id) {
          return res.status(409).json({ error: 'Email already in use' })
        }
      }

      // Argon2 hashing stays outside the transaction (expensive pure compute).
      const newHash = wantsPassword ? await hash(password!, ARGON2_OPTIONS) : null

      // Every credential write is one database transaction: the password
      // change, the email change and the session revocations either all
      // commit or none do. There are no non-database side effects in this
      // handler, so a conflict (409) can no longer leave a half-applied
      // credential change behind.
      try {
        await prisma.$transaction(async (tx) => {
          if (newHash) {
            await tx.user.update({ where: { id: superAdmin.id }, data: { passwordHash: newHash } })
            // Revoke every other session; the caller stays logged in
            await tx.session.updateMany({
              where: { userId: superAdmin.id, id: { not: req.sessionId ?? '' } },
              data: { revokedAt: new Date() },
            })
          }
          if (target !== null) {
            await tx.user.update({ where: { id: superAdmin.id }, data: { email: target } })
          }
        })
      } catch (err) {
        // Concurrent email claim between the pre-check and commit → the
        // unique constraint fires and the whole transaction rolls back.
        if (isUniqueViolation(err)) {
          return res.status(409).json({ error: 'Email already in use' })
        }
        throw err
      }

      res.json({ success: true })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      console.error('[auth] super-admin update failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
