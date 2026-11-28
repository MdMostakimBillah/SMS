import { sealSecret, unsealSecret } from './secretCrypto.js'

const LOGIN_PATH_CONTEXT = 'super_admin_login_path:aes-256-gcm:v1'
const LOGIN_PATH_AAD = 'system_config:super_admin_login_path:v1'

export const LOGIN_PATH_SEGMENT_RE = /^[a-zA-Z0-9_-]{4,100}$/

export const RESERVED_LOGIN_PATHS = new Set([
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

export function resolveLoginPathMasterKey(jwtSecret: string): string {
  return (process.env.LOGIN_PATH_ENCRYPTION_KEY || '').trim() || jwtSecret
}

export function normalizeLoginPathSegment(raw: string): string {
  return raw.trim().replace(/^\/+|\/+$/g, '')
}

export function isValidLoginPathSegment(raw: string): boolean {
  const clean = normalizeLoginPathSegment(raw)
  return LOGIN_PATH_SEGMENT_RE.test(clean) && !RESERVED_LOGIN_PATHS.has(clean.toLowerCase())
}

/**
 * Seal the active Super Admin login path before storing it in PostgreSQL
 * `system_config` so DB dumps, backups, or SQL viewers never see plaintext.
 */
export function sealLoginPath(plainPath: string, jwtSecret: string): string {
  const clean = normalizeLoginPathSegment(plainPath)
  if (!isValidLoginPathSegment(clean)) {
    throw new Error('Invalid Super Admin login path format')
  }
  return sealSecret(clean, resolveLoginPathMasterKey(jwtSecret), LOGIN_PATH_CONTEXT, LOGIN_PATH_AAD)
}

/**
 * Unseal the Super Admin login path read from `system_config`.
 * Also handles safe auto-migration detection if an older deployment still had
 * an unencrypted plaintext value in the database.
 */
export function unsealLoginPath(
  storedValue: string,
  jwtSecret: string
): { path: string | null; needsMigration: boolean } {
  const trimmed = (storedValue || '').trim()
  if (!trimmed) {
    return { path: null, needsMigration: false }
  }

  const unsealed = unsealSecret(trimmed, resolveLoginPathMasterKey(jwtSecret), LOGIN_PATH_CONTEXT, LOGIN_PATH_AAD)
  if (unsealed.isSealed) {
    if (!unsealed.value || !isValidLoginPathSegment(unsealed.value)) {
      return { path: null, needsMigration: false }
    }
    return { path: normalizeLoginPathSegment(unsealed.value), needsMigration: false }
  }

  // Legacy plaintext row — return once so the route can immediately re-seal it in DB.
  const legacyClean = normalizeLoginPathSegment(trimmed)
  if (!isValidLoginPathSegment(legacyClean)) {
    return { path: null, needsMigration: false }
  }
  return { path: legacyClean, needsMigration: true }
}
