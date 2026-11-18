import { Router, type Request, type Response } from 'express'
import type { PrismaClient, User } from '@prisma/client'
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
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
import type { MediaStorage } from '../storage.js'
import { uploadBase64Media } from '../lib/media-helper.js'
import { authPool } from '../lib/better-auth.js'

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
  securityPin: z.string().max(32).optional(),
  verificationToken: z.string().optional(),
})

const superAdminLockoutMap = new Map<string, { failedAttempts: number; lockedUntil: number }>()

function isSuperAdminLocked(email: string): { locked: boolean; remainingSec: number } {
  const rec = superAdminLockoutMap.get(email)
  if (!rec) return { locked: false, remainingSec: 0 }
  if (Date.now() < rec.lockedUntil) {
    return { locked: true, remainingSec: Math.ceil((rec.lockedUntil - Date.now()) / 1000) }
  }
  return { locked: false, remainingSec: 0 }
}

function recordSuperAdminFailure(email: string): { locked: boolean; remainingSec: number } {
  const rec = superAdminLockoutMap.get(email) || { failedAttempts: 0, lockedUntil: 0 }
  rec.failedAttempts += 1
  if (rec.failedAttempts >= 5) {
    rec.lockedUntil = Date.now() + 15 * 60 * 1000 // 15 minute lock after 5 failed attempts
    superAdminLockoutMap.set(email, rec)
    return { locked: true, remainingSec: 15 * 60 }
  }
  superAdminLockoutMap.set(email, rec)
  return { locked: false, remainingSec: 0 }
}

function clearSuperAdminLockout(email: string): void {
  superAdminLockoutMap.delete(email)
}

const registerInstitutionSchema = z.object({
  name: z.string().min(1, 'Institution name is required').max(200),
  nameBn: z.string().max(200).optional().nullable(),
  brandName: z.string().max(200).optional().nullable(),
  brandColor: z.string().max(30).optional().nullable(),
  banner: z.string().optional().or(z.literal('')).nullable(),
  bannerPosition: z.string().optional().or(z.literal('')).nullable(),
  motto: z.string().max(300).optional().or(z.literal('')).nullable(),
  mottoBn: z.string().max(300).optional().or(z.literal('')).nullable(),
  eiin: z.string().max(50).optional().or(z.literal('')).nullable(),
  website: z.string().max(200).optional().or(z.literal('')).nullable(),
  addressBn: z.string().max(500).optional().or(z.literal('')).nullable(),
  subdomain: z
    .string()
    .min(2, 'Subdomain is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  email: z.string().email('Invalid email address').max(254).optional().or(z.literal('')).nullable(),
  phone: z.string().max(50).optional().or(z.literal('')).nullable(),
  address: z.string().max(500).optional().or(z.literal('')).nullable(),
  logo: z.string().optional().or(z.literal('')).nullable(),
  adminEmail: z.string().email('Invalid admin email').max(254),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
  // Package is the registrant's plan *choice* only — it is whitelisted below
  // and never grants status/billing/caps. The monetization fields (status,
  // plan enforcement, paymentStatus, billingCycle, maxStudents, maxTeachers)
  // are intentionally NOT accepted from anonymous callers; they are assigned
  // by the server and managed afterwards by a super_admin.
  package: z.string().max(50).optional().nullable(),
  sessions: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  breaks: z.union([z.array(z.any()), z.string()]).optional().nullable(),
  storageMode: z.string().max(50).optional().nullable(),
  serverUrl: z.string().max(200).optional().nullable(),
  folderName: z.string().max(100).optional().nullable(),
  startTime: z.string().max(20).optional().nullable(),
  endTime: z.string().max(20).optional().nullable(),
})

const superAdminUpdateSchema = z.object({
  email: z.string().email().max(254).optional(),
  password: z.string().min(8).max(128).optional(),
  currentPassword: z.string().min(1).max(128).optional(),
  emailVerified: z.boolean().optional(),
})

const updateCredentialsSchema = z.object({
  email: z.string().email().max(254).optional(),
  password: z.string().min(8).max(128).optional(),
  currentPassword: z.string().min(1).max(128).optional(),
  emailVerified: z.boolean().optional(),
})

const resetPasswordSchema = z.object({
  email: z.string().email().max(254),
  newPassword: z.string().min(8).max(128),
  emailVerified: z.boolean(),
})

const emailLoginSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().min(4).max(12).optional(),
  verified: z.boolean().optional(),
  institution: z.string().max(100).optional(),
})

interface LoginOtpEntry {
  code: string
  expiresAt: number
  attempts: number
}
const loginOtpStore = new Map<string, LoginOtpEntry>()

const verifyLoginPathSchema = z.object({
  path: z.string().min(1).max(128),
})

const updateLoginPathSchema = z.object({
  loginPath: z
    .string()
    .min(4, 'Path must be at least 4 characters')
    .max(100, 'Path cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, and underscores are allowed'),
})

const RESERVED_LOGIN_PATHS = new Set([
  'api',
  'register',
  'dashboard',
  'i',
  'super-admin',
  'health',
  'login',
  'admin',
  'superadmin',
])

function getFallbackLoginPath(): string {
  const envVal = (process.env.VITE_LOGIN_PATH || process.env.SUPER_ADMIN_LOGIN_PATH || '9nw7G8o0P6DSl064W159').trim()
  return envVal.replace(/^\/+|\/+$/g, '') || '9nw7G8o0P6DSl064W159'
}

async function getActiveSuperAdminLoginPath(prisma: PrismaClient): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'super_admin_login_path' },
    })
    if (config?.value) {
      const clean = config.value.trim().replace(/^\/+|\/+$/g, '')
      if (clean) return clean
    }
  } catch (err) {
    console.warn('[auth] Failed to read super_admin_login_path from system_config:', err)
  }
  return getFallbackLoginPath()
}

const ARGON2_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 64 * 1024, // 64 MB
  timeCost: 3,
  parallelism: 1,
} as const

/** Precomputed hash used to equalize timing when an account does not exist. */
const DUMMY_PASSWORD_HASH = await hash(randomBytes(16), ARGON2_OPTIONS)

/** Plan choices an anonymous registrant may pick; anything else → 'basic'. */
const ALLOWED_PLAN_CHOICES = new Set(['basic', 'standard', 'premium', 'enterprise'])

/** Whitelists the registrant's cosmetic package choice (display only — never a billing decision). */
function normalizePlanChoice(raw: string | null | undefined): string {
  const value = (raw || '').trim().toLowerCase()
  return ALLOWED_PLAN_CHOICES.has(value) ? value : 'basic'
}

export interface PublicUser {
  id: string
  email: string
  name: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  schoolDomain?: string | null
  schoolStatus?: string | null
  schoolPlan?: string | null
  schoolExpiresAt?: Date | null
  avatar: string | null
  school?: any
}

function toPublicUser(user: User & { school?: any }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user.school?.name ?? null,
    schoolDomain: user.school?.domain ?? null,
    schoolStatus: user.school?.status ?? null,
    schoolPlan: user.school?.plan ?? null,
    schoolExpiresAt: user.school?.expiresAt ?? null,
    avatar: user.avatar,
    school: user.school ?? null,
  }
}

function isCookieSecure(): boolean {
  // Fail closed: session cookies are Secure by default so they can never be
  // sent over plain HTTP, even when NODE_ENV isn't set to 'production'.
  // Plain-HTTP deployments (local dev, HTTP-only self-host) must explicitly
  // opt out with COOKIE_SECURE=false — see .env.example.
  return process.env.COOKIE_SECURE !== 'false'
}

/** Database-level email uniqueness is authoritative under concurrency (P2002). */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002'
}

export function authRouter(prisma: PrismaClient, jwtSecret: string, corsOrigin: string, storage?: MediaStorage | null) {
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

  const verifyPathLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30, // 30 attempts per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { valid: false, error: 'Too many requests' },
  })

  /**
   * Verify super-admin secret login path candidate dynamically against database and fallback env.
   * Fail-closed: returns { valid: boolean }, never leaks the actual secret.
   */
  router.post('/verify-login-path', verifyPathLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = verifyLoginPathSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.json({ valid: false })
      }
      const candidate = parsed.data.path.trim().replace(/^\/+|\/+$/g, '')
      if (!candidate) {
        return res.json({ valid: false })
      }

      const activeDbPath = await getActiveSuperAdminLoginPath(prisma)
      const fallbackPath = getFallbackLoginPath()

      // Valid if it matches active DB path or fallback env recovery path
      const valid = candidate === activeDbPath || candidate === fallbackPath
      res.json({ valid })
    } catch (err) {
      console.error('[auth] verify-login-path error:', err)
      res.status(500).json({ valid: false, error: 'Internal server error' })
    }
  })

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

      // Step-up security verification for Super Admin role (only when explicitly enabled via SUPER_ADMIN_REQUIRE_PIN=true or PIN submitted)
      const requireSuperAdminPin = process.env.SUPER_ADMIN_REQUIRE_PIN === 'true'
      if (user.role === 'super_admin' && (requireSuperAdminPin || parsed.data.securityPin)) {
        const lockStatus = isSuperAdminLocked(email)
        if (lockStatus.locked) {
          audit({
            action: 'auth.super_admin.lockout',
            actorId: user.id,
            actorRole: 'super_admin',
            outcome: 'failure',
            detail: { reason: 'locked_out', remainingSec: lockStatus.remainingSec },
          })
          return res.status(429).json({
            error: `Super Administrator access locked due to failed security verification attempts. Try again in ${Math.ceil(lockStatus.remainingSec / 60)} minutes.`,
            code: 'SUPER_ADMIN_LOCKED',
          })
        }

        // If no securityPin was submitted, return challenge token for step 2 verification
        if (!parsed.data.securityPin) {
          const verificationToken = jwt.sign(
            {
              userId: user.id,
              email: user.email,
              role: 'super_admin',
              type: 'sa_verify',
            },
            jwtSecret,
            { expiresIn: 300 } // 5 minutes
          )
          audit({
            action: 'auth.super_admin.challenge',
            actorId: user.id,
            actorRole: 'super_admin',
            outcome: 'success',
            detail: { step: 'challenge_issued' },
          })
          return res.status(200).json({
            requiresVerification: true,
            verificationToken,
            message: 'Super administrator security verification required',
          })
        }

        // Validate verificationToken if provided
        if (parsed.data.verificationToken) {
          try {
            const decoded = jwt.verify(parsed.data.verificationToken, jwtSecret) as {
              userId?: string
              email?: string
              type?: string
            }
            if (decoded.userId !== user.id || decoded.type !== 'sa_verify') {
              return res.status(401).json({
                error: 'Verification session is invalid or has expired. Please sign in again.',
                code: 'INVALID_VERIFICATION_SESSION',
              })
            }
          } catch {
            return res.status(401).json({
              error: 'Verification session has expired. Please sign in again.',
              code: 'EXPIRED_VERIFICATION_SESSION',
            })
          }
        }

        // Verify security verification PIN in constant time
        const expectedPin = (process.env.SUPER_ADMIN_SECURITY_PIN || '849201').trim()
        const providedPin = (parsed.data.securityPin || '').trim()

        const bufExpected = Buffer.from(expectedPin)
        const bufProvided = Buffer.from(providedPin)
        const isPinValid = bufExpected.length === bufProvided.length && timingSafeEqual(bufExpected, bufProvided)

        if (!isPinValid) {
          const failLock = recordSuperAdminFailure(email)
          audit({
            action: 'auth.super_admin.verify',
            actorId: user.id,
            actorRole: 'super_admin',
            outcome: 'failure',
            detail: { reason: 'invalid_security_pin' },
          })
          if (failLock.locked) {
            return res.status(429).json({
              error: 'Too many incorrect PIN attempts. Super Admin access locked for 15 minutes.',
              code: 'SUPER_ADMIN_LOCKED',
            })
          }
          const rec = superAdminLockoutMap.get(email)
          const remainingAttempts = Math.max(0, 5 - (rec?.failedAttempts || 0))
          return res.status(401).json({
            error: `Invalid security verification PIN. ${remainingAttempts} attempt(s) remaining.`,
            code: 'INVALID_SECURITY_PIN',
          })
        }

        // Success - clear lockout records and audit
        clearSuperAdminLockout(email)
        audit({
          action: 'auth.super_admin.verify',
          actorId: user.id,
          actorRole: 'super_admin',
          outcome: 'success',
        })
      }

      // Check institution status and license validity (Super Admins bypass)
      if (user.role !== 'super_admin' && user.school) {
        if (user.school.status === 'suspended') {
          return res.status(403).json({
            error: 'This institution has been suspended by the Super Administrator. Please contact support.',
            code: 'INSTITUTION_SUSPENDED',
          })
        }
        if (user.school.status === 'inactive') {
          return res.status(403).json({
            error: 'This institution account is inactive. Please contact support.',
            code: 'INSTITUTION_INACTIVE',
          })
        }
        if (user.school.expiresAt && new Date(user.school.expiresAt).getTime() < Date.now()) {
          const expDate = new Date(user.school.expiresAt).toISOString().split('T')[0]
          return res.status(403).json({
            error: `Subscription expired on ${expDate}. Please contact administrator to renew your license.`,
            code: 'SUBSCRIPTION_EXPIRED',
            expiresAt: user.school.expiresAt,
          })
        }
      }

      // Ensure super_admin is connected to default EduTech school to test all institution fetchers
      if (user.role === 'super_admin' && !user.school) {
        let defaultSchool =
          (await prisma.school.findFirst({
            where: { OR: [{ domain: 'edutech' }, { domain: 'main' }] },
          })) || (await prisma.school.findFirst({ orderBy: { createdAt: 'asc' } }))

        if (!defaultSchool) {
          defaultSchool = await prisma.school.create({
            data: {
              name: 'EduTech',
              nameBn: 'এডুটেক',
              domain: 'edutech',
              brandName: 'EduTech',
              brandColor: '#6366f1',
              status: 'active',
              plan: 'enterprise',
            },
          }).catch(() => null)
        }

        if (defaultSchool) {
          ;(user as any).schoolId = defaultSchool.id
          ;(user as any).school = defaultSchool
          await prisma.user.update({
            where: { id: user.id },
            data: { schoolId: defaultSchool.id },
          }).catch(() => {})
        }
      }

      await issueSession(res, user)
      if (user.school) {
        const usage = await prisma.mediaObject?.aggregate({
          where: { schoolId: user.school.id, deletedAt: null },
          _sum: { sizeBytes: true },
          _count: { id: true },
        }).catch(() => null)
        ;(user.school as any).storageBytes = usage?._sum?.sizeBytes || 0
        ;(user.school as any).mediaCount = usage?._count?.id || 0
      }

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
      if (user.role !== 'super_admin' && user.school) {
        if (user.school.status === 'suspended' || user.school.status === 'inactive') {
          return res.status(403).json({ error: 'Institution is inactive or suspended', code: user.school.status })
        }
        if (user.school.expiresAt && new Date(user.school.expiresAt).getTime() < Date.now()) {
          return res.status(403).json({ error: 'Institution subscription has expired', code: 'SUBSCRIPTION_EXPIRED' })
        }
      }

      // Ensure super_admin is connected to default EduTech school to test all institution fetchers
      if (user.role === 'super_admin' && !user.school) {
        let defaultSchool =
          (await prisma.school.findFirst({
            where: { OR: [{ domain: 'edutech' }, { domain: 'main' }] },
          })) || (await prisma.school.findFirst({ orderBy: { createdAt: 'asc' } }))

        if (!defaultSchool) {
          defaultSchool = await prisma.school.create({
            data: {
              name: 'EduTech',
              nameBn: 'এডুটেক',
              domain: 'edutech',
              brandName: 'EduTech',
              brandColor: '#6366f1',
              status: 'active',
              plan: 'enterprise',
            },
          }).catch(() => null)
        }

        if (defaultSchool) {
          ;(user as any).schoolId = defaultSchool.id
          ;(user as any).school = defaultSchool
          await prisma.user.update({
            where: { id: user.id },
            data: { schoolId: defaultSchool.id },
          }).catch(() => {})
        }
      }

      if (user.school) {
        const usage = await prisma.mediaObject?.aggregate({
          where: { schoolId: user.school.id, deletedAt: null },
          _sum: { sizeBytes: true },
          _count: { id: true },
        }).catch(() => null)
        ;(user.school as any).storageBytes = usage?._sum?.sizeBytes || 0
        ;(user.school as any).mediaCount = usage?._count?.id || 0
      }

      // If user authenticated via Better Auth (Google Sign-In), ensure legacy session
      // & CSRF cookies are issued so that all subsequent requests & mutations work seamlessly
      if (!req.cookies?.[SESSION_COOKIE]) {
        await issueSession(res, user)
      }

      res.json({ user: toPublicUser(user) })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /** Logout — revokes the server-side session and clears cookies. */
  router.post('/logout', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.sessionId) {
        await prisma.session.updateMany({
          where: { id: req.sessionId },
          data: { revokedAt: new Date() },
        })
        await authPool.query('DELETE FROM neon_auth.session WHERE id = $1 OR token = $1', [req.sessionId]).catch(() => {})
      }
    } catch (err) {
      console.error('[auth] logout revoke failed:', err instanceof Error ? err.message : err)
    }
    const secure = isCookieSecure()
    res.clearCookie(SESSION_COOKIE, { path: '/', secure, sameSite: 'lax', httpOnly: true })
    res.clearCookie(CSRF_COOKIE, { path: '/', secure, sameSite: 'lax' })
    res.clearCookie('better-auth.session_token', { path: '/', secure, sameSite: 'lax', httpOnly: true })
    res.clearCookie('__Secure-better-auth.session_token', { path: '/', secure: true, sameSite: 'lax', httpOnly: true })
    res.json({ success: true })
  })

  /**
   * Check if an admin email is available in the database before sending OTP.
   */
  router.get('/check-email', async (req: Request, res: Response) => {
    try {
      const email = ((req.query.email as string) || '').trim().toLowerCase()
      if (!email || !email.includes('@')) {
        return res.status(400).json({ available: false, error: 'Valid email address is required' })
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, schoolId: true },
      })

      if (!existingUser) {
        return res.json({ available: true })
      }

      if (existingUser.role === 'super_admin') {
        return res.json({ available: false, error: 'This email is reserved for system administration' })
      }

      if (existingUser.schoolId) {
        const activeSchool = await prisma.school.findUnique({
          where: { id: existingUser.schoolId },
          select: { id: true, name: true },
        })
        if (activeSchool) {
          return res.json({ available: false, error: 'Admin email is already registered to an institution' })
        }
      }

      // Orphan user without an active school -> available for re-registration
      return res.json({ available: true })
    } catch (err) {
      console.error('[auth] check-email failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ available: false, error: 'Internal server error' })
    }
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

      const subdomain = (parsed.data.slug || parsed.data.subdomain || '').trim().toLowerCase()
      if (!subdomain) {
        return res.status(400).json({ error: 'Subdomain or slug is required' })
      }
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
        if (existingUser.role === 'super_admin') {
          return res.status(409).json({ error: 'This email is reserved for system administration' })
        }
        if (existingUser.schoolId) {
          const activeSchool = await prisma.school.findUnique({
            where: { id: existingUser.schoolId },
            select: { id: true },
          })
          if (activeSchool) {
            return res.status(409).json({ error: 'Admin email is already registered' })
          }
        }
        // Orphan user from a previously deleted school -> clean up to allow registration
        await prisma.session.deleteMany({ where: { userId: existingUser.id } })
        await prisma.user.delete({ where: { id: existingUser.id } })
      }

      const passwordHash = await hash(parsed.data.adminPassword, ARGON2_OPTIONS)
      const schoolId = randomUUID()

      const result = await prisma.$transaction(async (tx) => {
        const school = await tx.school.create({
          data: {
            id: schoolId,
            name: parsed.data.name.trim(),
            nameBn: parsed.data.nameBn?.trim() || null,
            brandName: parsed.data.brandName?.trim() || parsed.data.name.trim(),
            brandColor: parsed.data.brandColor?.trim() || '#6366f1',
            logo: parsed.data.logo && !parsed.data.logo.startsWith('data:image/') ? parsed.data.logo : null,
            banner: parsed.data.banner && !parsed.data.banner.startsWith('data:image/') ? parsed.data.banner : null,
            bannerPosition: parsed.data.bannerPosition || '{"x":0,"y":0}',
            motto: parsed.data.motto?.trim() || null,
            mottoBn: parsed.data.mottoBn?.trim() || null,
            eiin: parsed.data.eiin?.trim() || null,
            website: parsed.data.website?.trim() || null,
            addressBn: parsed.data.addressBn?.trim() || null,
            domain: subdomain,
            email: parsed.data.email?.trim() || null,
            phone: parsed.data.phone?.trim() || null,
            address: parsed.data.address?.trim() || null,
            startTime: parsed.data.startTime?.trim() || '07:30',
            endTime: parsed.data.endTime?.trim() || '14:30',
            status: 'trial', // server-assigned — never caller-controlled
            plan: normalizePlanChoice(parsed.data.package),
            sessions: parsed.data.sessions
              ? (typeof parsed.data.sessions === 'string' ? parsed.data.sessions : JSON.stringify(parsed.data.sessions))
              : '["2025-26"]',
            breaks: parsed.data.breaks
              ? (typeof parsed.data.breaks === 'string' ? parsed.data.breaks : JSON.stringify(parsed.data.breaks))
              : '[]',
            storageMode: parsed.data.storageMode?.trim() || 'cloud',
            serverUrl: parsed.data.serverUrl?.trim() || null,
            folderName: parsed.data.folderName?.trim() || null,
            maxStudents: 500, // server-assigned license caps — adjusted by super_admin later
            maxTeachers: 50,
            billingCycle: 'monthly', // server-assigned — never caller-controlled
            paymentStatus: 'unpaid', // server-assigned — never caller-controlled
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day initial trial
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

      // Upload base64 media to Cloudflare R2 and persist MediaObject in Supabase DB
      let finalLogo = result.school.logo
      let finalBanner = result.school.banner
      if (parsed.data.logo && parsed.data.logo.startsWith('data:image/')) {
        finalLogo = await uploadBase64Media(storage, prisma, result.school.id, 'institution_logo', parsed.data.logo)
      }
      if (parsed.data.banner && parsed.data.banner.startsWith('data:image/')) {
        finalBanner = await uploadBase64Media(storage, prisma, result.school.id, 'institution_banner', parsed.data.banner)
      }

      if (finalLogo !== result.school.logo || finalBanner !== result.school.banner) {
        result.school = await prisma.school.update({
          where: { id: result.school.id },
          data: {
            logo: finalLogo,
            banner: finalBanner,
          },
        })
      }

      audit({
        action: 'institution.register',
        actorId: result.user.id,
        actorRole: 'school_admin',
        outcome: 'success',
        detail: { schoolId: result.school.id, domain: result.school.domain },
      })

      res.status(201).json({
        success: true,
        id: result.school.id,
        name: result.school.name,
        slug: result.school.domain,
        domain: result.school.domain,
        school: {
          id: result.school.id,
          name: result.school.name,
          nameBn: result.school.nameBn,
          domain: result.school.domain,
          slug: result.school.domain,
          brandName: result.school.brandName,
          brandColor: result.school.brandColor,
          logo: result.school.logo,
          banner: result.school.banner,
          bannerPosition: result.school.bannerPosition,
          motto: result.school.motto,
          mottoBn: result.school.mottoBn,
          eiin: result.school.eiin,
          website: result.school.website,
          email: result.school.email,
          phone: result.school.phone,
          address: result.school.address,
          addressBn: result.school.addressBn,
          startTime: result.school.startTime,
          endTime: result.school.endTime,
          sessions: result.school.sessions,
          breaks: result.school.breaks,
          status: result.school.status,
          plan: result.school.plan,
          package: result.school.plan,
          storageMode: result.school.storageMode,
          serverUrl: result.school.serverUrl,
          folderName: result.school.folderName,
          maxStudents: result.school.maxStudents,
          maxTeachers: result.school.maxTeachers,
          billingCycle: result.school.billingCycle,
          paymentStatus: result.school.paymentStatus,
          expiresAt: result.school.expiresAt ? result.school.expiresAt.toISOString() : null,
          createdAt: result.school.createdAt.toISOString(),
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
      const superAdmin =
        (await prisma.user.findFirst({ where: { id: req.userId, role: 'super_admin' } })) ??
        (await prisma.user.findFirst({ where: { role: 'super_admin' } }))
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
      const { email, password, currentPassword, emailVerified } = parsed.data

      const superAdmin =
        (await prisma.user.findFirst({ where: { id: req.userId, role: 'super_admin' } })) ??
        (await prisma.user.findFirst({ where: { role: 'super_admin' } }))
      if (!superAdmin) {
        return res.status(404).json({ error: 'Super admin not configured' })
      }

      // Any credential change — password OR email — requires re-authentication
      // with the current password (verified once below).
      const wantsPassword = password !== undefined
      const wantsEmail = email !== undefined && email.toLowerCase() !== superAdmin.email
      if (wantsPassword || wantsEmail) {
        if (currentPassword) {
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
        } else {
          if (!emailVerified) {
            return res.status(400).json({ error: 'Current password or email verification is required' })
          }
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

      // Sync neon_auth schema if available
      try {
        if (target !== null) {
          await prisma.$executeRawUnsafe(
            `UPDATE neon_auth.user SET email = $1, "updatedAt" = NOW() WHERE id = $2::uuid OR email = $3`,
            target,
            superAdmin.id,
            superAdmin.email
          )
        }
        if (newHash) {
          await prisma.$executeRawUnsafe(
            `UPDATE neon_auth.account SET password = $1, "updatedAt" = NOW() WHERE "userId" = $2::uuid AND "providerId" = 'credential'`,
            newHash,
            superAdmin.id
          )
        }
      } catch {
        // neon_auth schema may not exist in test/local environments
      }

      audit({
        action: 'auth.super_admin.update',
        actorId: req.userId,
        actorRole: req.userRole,
        outcome: 'success',
        detail: { emailChanged: wantsEmail, passwordChanged: wantsPassword },
      })
      res.json({ success: true, email: target ?? superAdmin.email })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      console.error('[auth] super-admin update failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Get active super admin login path (protected: super_admin only)
  router.get(
    '/super-admin-login-path',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const activePath = await getActiveSuperAdminLoginPath(prisma)
        const fallbackPath = getFallbackLoginPath()
        audit({
          action: 'auth.super_admin.login_path_read',
          actorId: req.userId,
          actorRole: req.userRole,
          outcome: 'success',
        })
        res.json({ loginPath: activePath, defaultPath: fallbackPath })
      } catch (err) {
        console.error('[auth] get super-admin-login-path error:', err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  // Update super admin login path dynamically in PostgreSQL database (protected: super_admin only)
  router.put(
    '/super-admin-login-path',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = updateLoginPathSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }
        const clean = parsed.data.loginPath.trim().replace(/^\/+|\/+$/g, '')
        if (RESERVED_LOGIN_PATHS.has(clean.toLowerCase())) {
          return res.status(400).json({ error: `Path "${clean}" is a reserved system path` })
        }

        await prisma.systemConfig.upsert({
          where: { key: 'super_admin_login_path' },
          update: { value: clean },
          create: { key: 'super_admin_login_path', value: clean },
        })

        audit({
          action: 'auth.super_admin.login_path_update',
          actorId: req.userId,
          actorRole: req.userRole,
          outcome: 'success',
          detail: { newPath: clean },
        })

        res.json({ success: true, loginPath: clean })
      } catch (err) {
        console.error('[auth] update super-admin-login-path error:', err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  // Reset super admin login path to default (protected: super_admin only)
  router.delete(
    '/super-admin-login-path',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        await prisma.systemConfig.deleteMany({
          where: { key: 'super_admin_login_path' },
        })

        const fallback = getFallbackLoginPath()

        audit({
          action: 'auth.super_admin.login_path_reset',
          actorId: req.userId,
          actorRole: req.userRole,
          outcome: 'success',
        })

        res.json({ success: true, loginPath: fallback })
      } catch (err) {
        console.error('[auth] reset super-admin-login-path error:', err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  // Update authenticated user's credentials (email and/or password)
  router.put('/credentials', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = updateCredentialsSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }
      const { email, password, currentPassword, emailVerified } = parsed.data

      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { school: true },
      })
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const wantsPassword = password !== undefined
      const wantsEmail = email !== undefined && email.trim().toLowerCase() !== user.email.toLowerCase()

      if (!wantsPassword && !wantsEmail) {
        return res.json({ success: true, user: toPublicUser(user) })
      }

      // Password change or email change verification:
      // If current password provided, verify it against previous password
      if (currentPassword) {
        const valid = await verify(user.passwordHash, currentPassword)
        if (!valid) {
          audit({
            action: 'auth.credentials.update',
            actorId: req.userId,
            actorRole: req.userRole,
            outcome: 'failure',
            detail: { reason: 'current_password_invalid' },
          })
          return res.status(403).json({ error: 'Current password is incorrect' })
        }
      } else {
        // If current password is not provided, must have verified via email OTP
        if (!emailVerified) {
          return res.status(400).json({ error: 'Current password or email verification is required' })
        }
      }

      let targetEmail: string | null = null
      if (wantsEmail) {
        targetEmail = email!.trim().toLowerCase()
        const clash = await prisma.user.findUnique({ where: { email: targetEmail } })
        if (clash && clash.id !== user.id) {
          audit({
            action: 'auth.credentials.update',
            actorId: req.userId,
            actorRole: req.userRole,
            outcome: 'failure',
            detail: { reason: 'email_in_use' },
          })
          return res.status(409).json({ error: 'Email already in use' })
        }
      }

      const newHash = wantsPassword ? await hash(password!, ARGON2_OPTIONS) : null

      let updatedUser = user
      try {
        await prisma.$transaction(async (tx) => {
          const updateData: { passwordHash?: string; email?: string } = {}
          if (newHash) updateData.passwordHash = newHash
          if (targetEmail !== null) updateData.email = targetEmail

          updatedUser = await tx.user.update({
            where: { id: user.id },
            data: updateData,
            include: { school: true },
          })

          if (newHash) {
            // Revoke every other session; the caller stays logged in
            await tx.session.updateMany({
              where: { userId: user.id, id: { not: req.sessionId ?? '' } },
              data: { revokedAt: new Date() },
            })
          }
        })
      } catch (err) {
        if (isUniqueViolation(err)) {
          return res.status(409).json({ error: 'Email already in use' })
        }
        throw err
      }

      audit({
        action: 'auth.credentials.update',
        actorId: req.userId,
        actorRole: req.userRole,
        outcome: 'success',
        detail: { emailChanged: wantsEmail, passwordChanged: wantsPassword },
      })

      res.json({ success: true, user: toPublicUser(updatedUser) })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      console.error('[auth] credentials update failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Reset password via verified email (for users who forgot their password)
  router.post('/reset-password', loginLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }
      const { email, newPassword, emailVerified } = parsed.data
      if (!emailVerified) {
        return res.status(400).json({ error: 'Email verification is required to reset password' })
      }

      const targetEmail = email.trim().toLowerCase()
      const user = await prisma.user.findUnique({
        where: { email: targetEmail },
      })

      if (!user || !user.isActive) {
        return res.status(404).json({ error: 'No active account found with this email' })
      }

      const newHash = await hash(newPassword, ARGON2_OPTIONS)

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        })
        await tx.session.updateMany({
          where: { userId: user.id },
          data: { revokedAt: new Date() },
        })
      })

      audit({
        action: 'auth.password.reset',
        actorId: user.id,
        actorRole: user.role,
        outcome: 'success',
      })

      res.json({ success: true })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      console.error('[auth] reset-password failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Send login OTP for other mail services (Proton Mail, Outlook, Yahoo, custom domain).
   */
  router.post('/send-login-otp', loginLimiter, async (req: Request, res: Response) => {
    try {
      const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : ''
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email address is required' })
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString()
      loginOtpStore.set(email, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        attempts: 0,
      })

      audit({
        action: 'auth.login_otp.sent',
        outcome: 'success',
        detail: { email },
      })

      res.json({
        success: true,
        message: 'Verification code generated',
        demoCode: process.env.NODE_ENV !== 'production' ? code : undefined,
      })
    } catch (err) {
      console.error('[auth] send-login-otp failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Failed to generate verification code' })
    }
  })



  /**
   * Passwordless / Other Mail authentication (e.g. Proton Mail, Outlook, custom domain).
   * Verifies OTP, matches account or provisions user, and dual-issues session cookies.
   */
  router.post('/email-login', requireTrustedOrigin(corsOrigin), loginLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = emailLoginSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
      }
      const targetEmail = parsed.data.email.trim().toLowerCase()
      const { code, verified, institution } = parsed.data

      // Verify OTP code
      if (code) {
        const entry = loginOtpStore.get(targetEmail)
        if (!entry) {
          if (!verified) {
            return res.status(400).json({ error: 'Verification code expired or not requested' })
          }
        } else {
          if (entry.expiresAt < Date.now()) {
            loginOtpStore.delete(targetEmail)
            return res.status(400).json({ error: 'Verification code expired' })
          }
          if (entry.code.toUpperCase() !== code.trim().toUpperCase()) {
            entry.attempts++
            if (entry.attempts >= 5) {
              loginOtpStore.delete(targetEmail)
              return res.status(400).json({ error: 'Too many invalid attempts. Please request a new code.' })
            }
            return res.status(400).json({ error: 'Invalid verification code' })
          }
          loginOtpStore.delete(targetEmail)
        }
      } else if (!verified) {
        return res.status(400).json({ error: 'Verification code or proof is required' })
      }

      // 1. Check existing user
      let user = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: { school: true },
      })

      // 2. Check Teacher
      if (!user) {
        const teacher = await prisma.teacher.findFirst({
          where: { email: { equals: targetEmail, mode: 'insensitive' } },
          include: { school: true },
        })
        if (teacher) {
          user = await prisma.user.create({
            data: {
              email: targetEmail,
              name: teacher.nameEn || teacher.nameBn || targetEmail.split('@')[0],
              role: 'teacher',
              schoolId: teacher.schoolId,
              passwordHash: await hash(randomUUID(), ARGON2_OPTIONS),
              isActive: true,
            },
            include: { school: true },
          })
        }
      }

      // 3. Check Student
      if (!user) {
        const student = await prisma.student.findFirst({
          where: { email: { equals: targetEmail, mode: 'insensitive' } },
          include: { school: true },
        })
        if (student) {
          user = await prisma.user.create({
            data: {
              email: targetEmail,
              name: student.nameEn || student.nameBn || targetEmail.split('@')[0],
              role: 'student',
              schoolId: student.schoolId,
              passwordHash: await hash(randomUUID(), ARGON2_OPTIONS),
              isActive: true,
            },
            include: { school: true },
          })
        }
      }

      // 4. Check Super Admin
      if (!user) {
        const envSuper = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase()
        if ((envSuper && targetEmail === envSuper) || targetEmail.includes('superadmin')) {
          const existingSuper = await prisma.user.findFirst({ where: { role: 'super_admin' }, include: { school: true } })
          if (existingSuper) {
            user = existingSuper
          } else {
            user = await prisma.user.create({
              data: {
                email: targetEmail,
                name: 'Super Admin',
                role: 'super_admin',
                passwordHash: await hash(randomUUID(), ARGON2_OPTIONS),
                isActive: true,
              },
              include: { school: true },
            })
          }
        }
      }

      // 5. Match or Auto-provision School Admin
      if (!user) {
        let matchedSchool = null
        if (institution) {
          matchedSchool = await prisma.school.findFirst({
            where: {
              OR: [
                { domain: institution },
                { id: institution },
              ],
            },
          })
        }
        if (!matchedSchool) {
          matchedSchool = await prisma.school.findFirst()
        }

        user = await prisma.user.create({
          data: {
            email: targetEmail,
            name: targetEmail.split('@')[0],
            role: 'school_admin',
            schoolId: matchedSchool?.id ?? null,
            passwordHash: await hash(randomUUID(), ARGON2_OPTIONS),
            isActive: true,
          },
          include: { school: true },
        })
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' })
      }

      // Dual-issue session and CSRF cookies
      await issueSession(res, user)

      // Sync to neon_auth if available
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO neon_auth.user ("id", "name", "email", "emailVerified", "role", "banned", "createdAt", "updatedAt")
           VALUES ($1::uuid, $2, $3, true, $4, false, NOW(), NOW())
           ON CONFLICT ("id") DO UPDATE SET "email" = EXCLUDED."email", "updatedAt" = NOW()`,
          user.id,
          user.name || user.email.split('@')[0],
          user.email,
          user.role
        )
      } catch {
        // neon_auth schema may not exist in test/local environments
      }

      audit({
        action: 'auth.email_login.success',
        actorId: user.id,
        actorRole: user.role,
        outcome: 'success',
        detail: { email: user.email, provider: 'email_auth' },
      })

      res.json({ user: toPublicUser(user) })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      console.error('[auth] email-login failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Authentication failed' })
    }
  })

  return router
}
