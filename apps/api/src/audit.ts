/**
 * Structured audit trail for privileged and cross-tenant access.
 *
 * Emits one single-line JSON record per event to stdout, which the container
 * log driver (json-file, with rotation) captures on staging/production.
 *
 * Deliberately schema-free: a durable, database-backed AuditLog table belongs
 * to the tenant-foundation phase (still awaiting its approval), so this module
 * adds no migration and no new dependency.
 *
 * Safety rules:
 * - Never records credentials, password material, tokens, cookies, request
 *   bodies, or query strings — only typed identifiers, outcomes and short
 *   non-secret detail flags.
 * - Must never throw: auditing is best-effort and MUST NOT be able to fail a
 *   request (the whole body runs inside try/catch).
 */

/** Outcome vocabulary. `not_found` is used where a cross-tenant id and a
 *  nonexistent id are indistinguishable by design (uniform 404). */
export type AuditOutcome = 'success' | 'denied' | 'failure' | 'not_found'

export interface AuditEvent {
  /** Dotted action name, e.g. 'auth.super_admin.update', 'teacher.delete'. */
  action: string
  /** Actor identity — server-derived (session → database), never client input. */
  actorId?: string | undefined
  actorRole?: string | undefined
  /** Tenant whose data was touched (for cross-tenant reads: the target school). */
  schoolId?: string | null | undefined
  /** Record acted upon, when one exists. */
  resourceId?: string | undefined
  outcome: AuditOutcome
  /** Short, non-secret detail flags only (booleans, counts, reason codes). */
  detail?: Record<string, string | number | boolean | null> | undefined
}

export function audit(event: AuditEvent): void {
  try {
    console.log(JSON.stringify({ audit: true, ts: new Date().toISOString(), ...event }))
  } catch {
    /* auditing is best-effort — never break the request */
  }
}
