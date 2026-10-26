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
import { audit } from '../audit.js'

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

const registerInstitutionSchema = z.object({
  name: z.string().min(1, 'Institution name is required').max(200),
  nameBn: z.string().max(200).optional().nullable(),
  brandName: z.string().max(200).optional().nullable(),
  subdomain: z
    .string()
    .min(2, 'Subdomain is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase alphanumeric characters and hyphens'),
  email: z.string().email('Invalid email address').max(254).optional().or(z.literal('')).nullable(),
  phone: z.string().max(50).optional().or(z.literal('')).nullable(),
  address: z.string().max(500).optional().or(z.literal('')).nullable(),
  logo: z.string().optional().or(z.literal('')).nullable(),
  brandColor: z.string().max(30).optional().nullable(),
  adminEmail: z.string().email('Invalid admin email').max(254),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
  startTime: z.string().max(20).optional().nullable(),
  endTime: z.string().max(20).optional().nullable(),
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
  schoolDomain?: string | null
  avatar: string | null
}

function toPublicUser(user: User & { school?: { name: string; domain?: string | null } | null }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user.school?.name ?? null,
    schoolDomain: user.school?.domain ?? null,
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
   * Institution Registration — creates a new School tenant and its primary
   * School Admin user atomically in the database.
   */
  router.post('/register-institution', requireTrustedOrigin(corsOrigin), loginLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = registerInstitutionSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }

      const subdomain = parsed.data.subdomain.trim().toLowerCase()
      const adminEmail = parsed.data.adminEmail.trim().toLowerCase()

      // Check subdomain uniqueness
      const existingSchool = await prisma.school.findFirst({
        where: { domain: subdomain },
      })
      if (existingSchool) {
        return res.status(409).json({ error: 'Institution subdomain is already taken' })
      }

      // Check admin email uniqueness
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail },
      })
      if (existingUser) {
        return res.status(409).json({ error: 'Admin email is already registered' })
      }

      const passwordHash = await hash(parsed.data.adminPassword, ARGON2_OPTIONS)

      const result = await prisma.$transaction(async (tx) => {
        const school = await tx.school.create({
          data: {
            name: parsed.data.name.trim(),
            nameBn: parsed.data.nameBn?.trim() || null,
            domain: subdomain,
            email: parsed.data.email?.trim() || null,
            phone: parsed.data.phone?.trim() || null,
            address: parsed.data.address?.trim() || null,
            logo: parsed.data.logo || null,
            startTime: parsed.data.startTime?.trim() || '07:30',
            endTime: parsed.data.endTime?.trim() || '14:30',
          },
        })

        const user = await tx.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            name: `${parsed.data.name.trim()} Admin`,
            role: 'school_admin',
            schoolId: school.id,
            isActive: true,
          },
        })

        return { school, user }
      })

      audit({
        action: 'institution.register',
        actorId: result.user.id,
        actorRole: 'school_admin',
        outcome: 'success',
        detail: { schoolId: result.school.id, domain: result.school.domain },
      })

      res.status(201).json({
        success: true,
        school: {
          id: result.school.id,
          name: result.school.name,
          nameBn: result.school.nameBn,
          domain: result.school.domain,
          email: result.school.email,
          phone: result.school.phone,
          address: result.school.address,
          logo: result.school.logo,
        },
        user: toPublicUser({ ...result.user, school: result.school }),
      })
    } catch (err) {
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Subdomain or admin email already in use' })
      }
      console.error('[auth] register-institution failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
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
      audit({
        action: 'auth.accounts.list',
        actorId: req.userId,
        actorRole: req.userRole,
        outcome: 'success',
        detail: { count: users.length },
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
      audit({ action: 'auth.super_admin.read', actorId: req.userId, actorRole: req.userRole, outcome: 'success' })
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
          audit({
            action: 'auth.super_admin.update',
            actorId: req.userId,
            actorRole: req.userRole,
            outcome: 'failure',
            detail: { reason: 'current_password_invalid' },
          })
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
          audit({
            action: 'auth.super_admin.update',
            actorId: req.userId,
            actorRole: req.userRole,
            outcome: 'failure',
            detail: { reason: 'email_in_use' },
          })
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
          audit({
            action: 'auth.super_admin.update',
            actorId: req.userId,
            actorRole: req.userRole,
            outcome: 'failure',
            detail: { reason: 'email_in_use' },
          })
          return res.status(409).json({ error: 'Email already in use' })
        }
        throw err
      }

      audit({
        action: 'auth.super_admin.update',
        actorId: req.userId,
        actorRole: req.userRole,
        outcome: 'success',
        detail: { emailChanged: wantsEmail, passwordChanged: wantsPassword },
      })
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
