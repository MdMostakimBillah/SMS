/**
 * Pure mapping between localStorage keys and vault JSON file paths.
 *
 * Institution data keys look like:
 *   edutech-classes_{slug}                → {slug}/classes.json
 *   edutech-settings_{slug}_{userId}      → {slug}/users/{userId}/settings.json
 *
 * Global keys without a slug suffix (edutech_super_admin, edutech_superadmin_user)
 * are deliberately excluded — the vault holds ONE institution's data only.
 */

const DASH_PREFIX = 'edutech-'
const UNDERSCORE_PREFIX = 'edutech_'

/** Exact keys that must never enter a vault, even if their shape looks institution-like. */
const BLOCKED_KEYS = new Set(['edutech_super_admin', 'edutech_superadmin_user'])

/** Filenames/folder names: word chars, dots, dashes. Blocks '.', '..' path tricks. */
const VALID_SEGMENT = /^[\w.-]+$/

function isValidSegment(segment: string): boolean {
  return (
    segment.length > 0 &&
    segment !== '.' &&
    segment !== '..' &&
    VALID_SEGMENT.test(segment)
  )
}

export interface VaultKeyInfo {
  slug: string
  userId?: string
  base: string
}

/**
 * Parse a localStorage key into its vault components, or null when the key
 * is not institution data (global key, malformed, or blocklisted).
 */
export function parseVaultKey(key: string): VaultKeyInfo | null {
  if (BLOCKED_KEYS.has(key)) return null

  let rest: string | null = null
  if (key.startsWith(DASH_PREFIX)) rest = key.slice(DASH_PREFIX.length)
  else if (key.startsWith(UNDERSCORE_PREFIX)) rest = key.slice(UNDERSCORE_PREFIX.length)
  if (rest === null) return null

  const sep = rest.indexOf('_')
  if (sep <= 0) return null // no slug suffix → global key, not institution data

  const base = rest.slice(0, sep)
  const suffix = rest.slice(sep + 1)
  if (!base || base.includes('_')) return null // store bases use dashes only

  const parts = suffix.split('_').filter(Boolean)
  if (parts.length < 1 || parts.length > 2) return null

  const [slug, userId] = parts
  if (!isValidSegment(slug)) return null
  if (userId && !isValidSegment(userId)) return null

  return { slug, userId, base }
}

/**
 * True when the key belongs to the given institution (and optionally user).
 * Anchored on the suffix so `edutech_superadmin_user` can never match an
 * institution merely named "user".
 */
export function keyMatchesInstitution(key: string, slug: string, userId?: string | null): boolean {
  if (BLOCKED_KEYS.has(key)) return false
  if (userId && key.endsWith(`_${slug}_${userId}`)) return true
  return key.endsWith(`_${slug}`)
}

/** localStorage key → vault file path, or null for non-institution keys. */
export function keyToVaultPath(key: string): string | null {
  const info = parseVaultKey(key)
  if (!info) return null
  return info.userId
    ? `${info.slug}/users/${info.userId}/${info.base}.json`
    : `${info.slug}/${info.base}.json`
}

/**
 * Vault file path → localStorage key. When `scope` is given, paths outside
 * that institution (or another user's files) are rejected — prevents
 * cross-tenant and cross-user hydration.
 */
export function vaultPathToKey(
  path: string,
  scope?: { slug: string; userId?: string | null },
): string | null {
  const segments = path.split('/').filter(Boolean)
  if (segments.some((s) => !isValidSegment(s))) return null

  const toKey = (base: string, slug: string, userId?: string): string | null => {
    if (!isValidSegment(base)) return null
    if (scope) {
      if (slug !== scope.slug) return null
      if (userId && userId !== scope.userId) return null
    }
    return userId ? `edutech-${base}_${slug}_${userId}` : `edutech-${base}_${slug}`
  }

  // {slug}/{base}.json — institution-wide data
  if (segments.length === 2 && segments[1].endsWith('.json')) {
    const base = segments[1].slice(0, -'.json'.length)
    return toKey(base, segments[0])
  }

  // {slug}/users/{userId}/{base}.json — per-user data
  if (segments.length === 4 && segments[1] === 'users' && segments[3].endsWith('.json')) {
    const base = segments[3].slice(0, -'.json'.length)
    return toKey(base, segments[0], segments[2])
  }

  return null
}

/** Re-serialize JSON so vault files are stable and human-readable (pretty) or canonical (compact). */
export function prettifyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

export function compactJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text))
  } catch {
    return text
  }
}
