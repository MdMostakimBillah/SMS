import type { Request, Response, NextFunction } from 'express'
import type { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  userId?: string
  userRole?: string
  schoolId?: string | null
  sessionId?: string
}

export interface SessionClaims {
  jti: string
  userId: string
  role: string
  schoolId: string | null
}

export const SESSION_COOKIE = 'edutech_sid'
export const CSRF_COOKIE = 'edutech_csrf'
export const CSRF_HEADER = 'x-csrf-token'
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60 // 24h

export interface CookieOptionsInput {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'none'
  path: string
  maxAge: number
}

export function buildCookieOptions(httpOnly: boolean, secure: boolean): CookieOptionsInput {
  return {
    httpOnly,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  }
}

/**
 * Shared session resolution used by both `requireAuth` and `optionalAuth`.
 * Verifies the signed JWT, re-checks the server-side session record
 * (revocation + expiry) and the user's active flag. Role and schoolId are
 * taken fresh from the database — never trusted from stale token claims.
 *
 * Returns a discriminated result; never throws.
 */
type SessionContext = {
  userId: string
  userRole: string
  schoolId: string | null
  sessionId: string
}

type SessionResolution = { ok: true; ctx: SessionContext } | { ok: false; status: number; message: string }

async function resolveSession(
  prisma: PrismaClient,
  jwtSecret: string,
  req: Request
): Promise<SessionResolution> {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined
  if (!token) {
    return { ok: false, status: 401, message: 'Authentication required' }
  }

  let claims: SessionClaims
  try {
    claims = jwt.verify(token, jwtSecret) as SessionClaims
    if (!claims.jti || !claims.userId) throw new Error('missing claims')
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired session' }
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: claims.jti },
      include: {
        user: {
          select: { id: true, role: true, schoolId: true, isActive: true },
        },
      },
    })
    if (!session || session.userId !== claims.userId || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return { ok: false, status: 401, message: 'Session expired or revoked' }
    }

    const user = session.user
    if (!user || !user.isActive) {
      return { ok: false, status: 401, message: 'Authentication required' }
    }

    let resolvedSchoolId = user.schoolId
    if (user.role === 'super_admin' && req.headers['x-school-id']) {
      const headerSchoolId = String(req.headers['x-school-id']).trim()
      const targetSchool = await prisma.school.findFirst({
        where: { OR: [{ id: headerSchoolId }, { domain: headerSchoolId }] },
        select: { id: true },
      })
      if (targetSchool) {
        resolvedSchoolId = targetSchool.id
      }
    }

    return {
      ok: true,
      ctx: { userId: user.id, userRole: user.role, schoolId: resolvedSchoolId, sessionId: claims.jti },
    }
  } catch {
    return { ok: false, status: 500, message: 'Internal server error' }
  }
}

/**
 * Cookie-authenticated session guard.
 *
 * Reads the HttpOnly session cookie, verifies the signed JWT, then re-checks the
 * server-side session record (revocation + expiry) and the user's active flag.
 * Role and schoolId are taken fresh from the database — never trusted from stale
 * token claims.
 */
export function requireAuth(prisma: PrismaClient, jwtSecret: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const result = await resolveSession(prisma, jwtSecret, req)
    if (!result.ok) {
      return res.status(result.status).json({ error: result.message })
    }

    req.userId = result.ctx.userId
    req.userRole = result.ctx.userRole
    req.schoolId = result.ctx.schoolId
    req.sessionId = result.ctx.sessionId
    next()
  }
}

/**
 * Optional cookie-session authentication.
 *
 * Populates `userId`/`userRole`/`schoolId`/`sessionId` when a valid session
 * cookie is present, and otherwise continues as anonymous — it never rejects.
 * Use it on routes whose response differs for authenticated owners (e.g. full
 * vs. sanitized school records) but must remain reachable without a session.
 */
export function optionalAuth(prisma: PrismaClient, jwtSecret: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const result = await resolveSession(prisma, jwtSecret, req)
    if (result.ok) {
      req.userId = result.ctx.userId
      req.userRole = result.ctx.userRole
      req.schoolId = result.ctx.schoolId
      req.sessionId = result.ctx.sessionId
    }
    next()
  }
}
