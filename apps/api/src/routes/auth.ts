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
import type { MediaStorage } from '../storage.js'
import { uploadBase64Media } from '../lib/media-helper.js'

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

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
  package: z.string().max(50).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  plan: z.string().max(50).optional().nullable(),
  sessions: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  breaks: z.union([z.array(z.any()), z.string()]).optional().nullable(),
  storageMode: z.string().max(50).optional().nullable(),
  serverUrl: z.string().max(200).optional().nullable(),
  folderName: z.string().max(100).optional().nullable(),
  maxStudents: z.coerce.number().optional().nullable(),
  maxTeachers: z.coerce.number().optional().nullable(),
  billingCycle: z.string().max(50).optional().nullable(),
  paymentStatus: z.string().max(50).optional().nullable(),
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
  return process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
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
            status: parsed.data.status?.trim() || 'trial',
            plan: parsed.data.plan?.trim() || parsed.data.package?.toLowerCase() || 'basic',
            sessions: parsed.data.sessions
              ? (typeof parsed.data.sessions === 'string' ? parsed.data.sessions : JSON.stringify(parsed.data.sessions))
              : '["2025-26"]',
            breaks: parsed.data.breaks
              ? (typeof parsed.data.breaks === 'string' ? parsed.data.breaks : JSON.stringify(parsed.data.breaks))
              : '[]',
            storageMode: parsed.data.storageMode?.trim() || 'cloud',
            serverUrl: parsed.data.serverUrl?.trim() || null,
            folderName: parsed.data.folderName?.trim() || null,
            maxStudents: parsed.data.maxStudents || 500,
            maxTeachers: parsed.data.maxTeachers || 50,
            billingCycle: parsed.data.billingCycle?.trim() || 'monthly',
            paymentStatus: parsed.data.paymentStatus?.trim() || 'unpaid',
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
