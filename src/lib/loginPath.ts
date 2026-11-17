/**
 * Runtime super-admin login path management.
 *
 * The active login secret is stored in localStorage so it can be rotated
 * instantly without a rebuild. Falls back to the build-time `VITE_LOGIN_PATH`
 * env var, then to `/super-admin/login`.
 *
 * SECURITY: This is an obscurity/UI-entry layer only — never an
 * authentication or authorization control. The API always authenticates at
 * `/api/auth/login`, independently of this route.
 */

const STORAGE_KEY = 'edutech_login_secret'
export const DEFAULT_LOGIN_SECRET = 'edutech-core-admin'

/**
 * Returns the active login secret path (normalized: trimmed, without leading or trailing slashes).
 * Checks localStorage first, then VITE_LOGIN_PATH env, then DEFAULT_LOGIN_SECRET.
 * Never returns empty string so route evaluation is always strict and fail-closed.
 */
export function getLoginSecret(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const cleanStored = stored.trim().replace(/^\/+|\/+$/g, '')
      if (cleanStored) return cleanStored
    }
  } catch { /* ignore */ }
  const envVal = import.meta.env.VITE_LOGIN_PATH || ''
  const cleanEnv = envVal.trim().replace(/^\/+|\/+$/g, '')
  return cleanEnv || DEFAULT_LOGIN_SECRET
}

/**
 * Validates whether an incoming path token matches the active super admin login secret.
 * Enforces strict non-empty matching (fail-closed).
 */
export function isValidLoginSecret(candidate?: string): boolean {
  if (!candidate) return false
  const active = getLoginSecret()
  const cleanCandidate = candidate.trim().replace(/^\/+|\/+$/g, '')
  return Boolean(active && cleanCandidate && active === cleanCandidate)
}

/**
 * Persist a new login secret path to localStorage. Returns the path set.
 */
export function setLoginSecret(path: string): string {
  const clean = path.trim().replace(/^\/+|\/+$/g, '')
  try {
    localStorage.setItem(STORAGE_KEY, clean)
  } catch { /* ignore */ }
  return clean
}

/**
 * Generate a new random login secret, persist it, and return it.
 * Calling this instantly invalidates the previous login URL.
 */
export function rotateLoginSecret(): string {
  const secret =
    Math.random().toString(36).slice(2) +
    Date.now().toString(36).slice(-6)
  return setLoginSecret(secret)
}

/**
 * Remove the persisted login secret, falling back to the env var or default.
 */
export function clearLoginSecret(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

/**
 * Returns the full login route: `/${secret}/login` when a secret is active,
 * otherwise `/super-admin/login`.
 */
export function getLoginRoute(): string {
  const secret = getLoginSecret()
  return secret ? `/${secret}/login` : '/super-admin/login'
}

/**
 * Returns the direct secret path: `/${secret}` when a secret is active,
 * otherwise `/super-admin/login`.
 */
export function getSecretPath(): string {
  const secret = getLoginSecret()
  return secret ? `/${secret}` : '/super-admin/login'
}
