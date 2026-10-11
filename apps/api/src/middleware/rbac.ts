import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from './auth.js'

/**
 * Centralized role-based authorization (Phase 3/4).
 *
 * Roles are read exclusively from `req.userRole`, which `requireAuth` populates
 * from fresh database state on every request — never from bodies, query strings,
 * headers, or localStorage. Unknown/unmapped roles are denied (deny-by-default),
 * and the 401/403 boundary is preserved: authentication failures belong to
 * `requireAuth` (401); these helpers only ever answer 403.
 */

/** Mirrors Prisma `enum UserRole` — anything not listed here is denied outright. */
const KNOWN_ROLES = new Set(['super_admin', 'school_admin', 'teacher', 'student', 'hr_admin'])

/**
 * Allows exactly the listed roles; everything else (missing role, unknown
 * role, or any role not named) receives 403.
 *
 *   router.get('/', requireAuth(...), requireRole('school_admin', 'hr_admin'), handler)
 */
export function requireRole(...allowed: string[]) {
  const allowedSet = new Set(allowed)
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.userRole
    if (!role || !KNOWN_ROLES.has(role) || !allowedSet.has(role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

/**
 * Tenant guard for school-scoped routes (mount only where super_admin is NOT
 * part of the route's role policy). A school-scoped role without a school
 * assignment is denied: `schoolId=NULL` never implies access.
 */
export function requireSchool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.schoolId) {
    return res.status(403).json({ error: 'No tenant context' })
  }
  next()
}

export type TenantReadScope = { ok: true; where: { schoolId?: string } } | { ok: false }

/**
 * Resolves the tenant scope for reads from trusted session state only:
 * - super_admin: global read; an optional `?schoolId` narrows it.
 * - school-scoped roles: forced to the session's own school — any `?schoolId`
 *   from the client is ignored, and a NULL schoolId is denied (403).
 *
 * Shared by the teachers and departments routers so both enforce one policy.
 */
export function resolveTenantReadScope(req: AuthenticatedRequest, requested?: string): TenantReadScope {
  if (req.userRole === 'super_admin') {
    return { ok: true, where: requested ? { schoolId: requested } : {} }
  }
  if (!req.schoolId) return { ok: false }
  return { ok: true, where: { schoolId: req.schoolId } }
}
