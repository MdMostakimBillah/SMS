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
  sameSite: 'lax'
  path: string
  maxAge: number
}

export function buildCookieOptions(httpOnly: boolean, secure: boolean): CookieOptionsInput {
  return {
    httpOnly,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
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
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    let claims: SessionClaims
    try {
      claims = jwt.verify(token, jwtSecret) as SessionClaims
      if (!claims.jti || !claims.userId) throw new Error('missing claims')
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }

    try {
      const session = await prisma.session.findUnique({ where: { id: claims.jti } })
      if (!session || session.userId !== claims.userId || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
        return res.status(401).json({ error: 'Session expired or revoked' })
      }

      const user = await prisma.user.findUnique({
        where: { id: claims.userId },
        select: { id: true, role: true, schoolId: true, isActive: true },
      })
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      req.userId = user.id
      req.userRole = user.role
      req.schoolId = user.schoolId
      req.sessionId = claims.jti
      next()
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
