import type { Request, Response, NextFunction } from 'express'
import { timingSafeEqual } from 'node:crypto'
import { SESSION_COOKIE, CSRF_COOKIE, CSRF_HEADER } from './auth.js'

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Double-submit CSRF protection for cookie-based sessions.
 *
 * Non-GET requests that carry a session cookie must echo the readable
 * `edutech_csrf` cookie in the `x-csrf-token` header. Requests without a
 * session (e.g. login) are unaffected — SameSite=Lax already covers them.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next()
  }

  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies
  const sessionCookie = cookies?.[SESSION_COOKIE]
  if (!sessionCookie) {
    return next() // no session yet (login/register) — nothing to protect
  }

  const cookieToken = cookies?.[CSRF_COOKIE]
  const headerToken = req.headers[CSRF_HEADER] as string | undefined

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' })
  }
  next()
}
