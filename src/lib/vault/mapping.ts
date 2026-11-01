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
    let storeBase = base
    if (base === 'students') storeBase = 'admissions'
    else if (base === 'routines') storeBase = 'classes'
    else if (base === 'staff') storeBase = 'teachers'

    return userId ? `edutech-${storeBase}_${slug}_${userId}` : `edutech-${storeBase}_${slug}`
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

// ---------------------------------------------------------------------------
// Image mapping for Obsidian-style local vault
// ---------------------------------------------------------------------------

export type VaultImageTarget =
  | { type: 'logo'; slug: string; ext: string }
  | { type: 'banner'; slug: string; ext: string }
  | { type: 'teacher_photo'; slug: string; id: string; ext: string }
  | { type: 'teacher_signature'; slug: string; id: string; ext: string }
  | { type: 'student_photo'; slug: string; id: string; ext: string }

const VALID_IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'])

export function isBackupBundlePath(path: string): boolean {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1 && segments[0] === 'backup.json') return true
  if (segments.length === 2 && segments[1] === 'backup.json') return true
  return false
}

export function isVaultImagePath(path: string): boolean {
  return parseVaultImagePath(path) !== null
}

export function parseVaultImagePath(path: string, scopeSlug?: string): VaultImageTarget | null {
  const segments = path.split('/').filter(Boolean)
  if (segments.length < 2) return null
  const slug = segments[0]
  if (scopeSlug && slug !== scopeSlug) return null

  // Allow {slug}/images/... or direct {slug}/...
  let relSegments = segments.slice(1)
  if (relSegments[0] === 'images') {
    relSegments = relSegments.slice(1)
  }
  if (relSegments.length === 0) return null

  // Case 1: logo.{ext} or banner.{ext}
  if (relSegments.length === 1) {
    const file = relSegments[0]
    const dot = file.lastIndexOf('.')
    if (dot <= 0) return null
    const base = file.slice(0, dot)
    const ext = file.slice(dot + 1).toLowerCase()
    if (!VALID_IMAGE_EXTS.has(ext)) return null
    if (base === 'logo') return { type: 'logo', slug, ext }
    if (base === 'banner') return { type: 'banner', slug, ext }
    return null
  }

  // Case 2: teachers/{file}
  if (relSegments.length === 2 && relSegments[0] === 'teachers') {
    const file = relSegments[1]
    const dot = file.lastIndexOf('.')
    if (dot <= 0) return null
    const base = file.slice(0, dot)
    const ext = file.slice(dot + 1).toLowerCase()
    if (!VALID_IMAGE_EXTS.has(ext)) return null
    if (base.endsWith('_signature')) {
      const id = base.slice(0, -'_signature'.length)
      if (id) return { type: 'teacher_signature', slug, id, ext }
    }
    let id = base
    if (id.endsWith('_photo')) {
      id = id.slice(0, -'_photo'.length)
    }
    if (id) return { type: 'teacher_photo', slug, id, ext }
    return null
  }

  // Case 3: students/{file}
  if (relSegments.length === 2 && relSegments[0] === 'students') {
    const file = relSegments[1]
    const dot = file.lastIndexOf('.')
    if (dot <= 0) return null
    const base = file.slice(0, dot)
    const ext = file.slice(dot + 1).toLowerCase()
    if (!VALID_IMAGE_EXTS.has(ext)) return null
    let id = base
    if (id.endsWith('_photo')) {
      id = id.slice(0, -'_photo'.length)
    }
    if (id) return { type: 'student_photo', slug, id, ext }
    return null
  }

  return null
}

export function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase()
  if (e === 'png') return 'image/png'
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'webp') return 'image/webp'
  if (e === 'svg') return 'image/svg+xml'
  if (e === 'gif') return 'image/gif'
  return 'image/png'
}

export function uint8ArrayToDataUrl(data: Uint8Array, mime: string): string {
  let binary = ''
  const len = data.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i])
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64')
  return `data:${mime};base64,${base64}`
}

export function dataUrlToUint8Array(dataUrl: string): { bytes: Uint8Array; mime: string; ext: string } | null {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx === -1) return null
  const meta = dataUrl.slice(5, commaIdx)
  const [mime, encoding] = meta.split(';')
  if (encoding !== 'base64') return null
  const base64 = dataUrl.slice(commaIdx + 1)
  const binary = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  let ext = 'png'
  if (mime) {
    if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg'
    else if (mime.includes('webp')) ext = 'webp'
    else if (mime.includes('svg')) ext = 'svg'
    else if (mime.includes('gif')) ext = 'gif'
  }
  return { bytes, mime: mime || 'image/png', ext }
}

/**
 * Normalizes user-authored or external vault JSON into standard Zustand persist format:
 * { state: ..., version: number }
 *
 * Supports:
 * - Pure array of items: [ { id: "...", ... } ]
 * - Object with domain key: { "students": [...] } or { "teachers": [...] } or { "classes": [...] }
 * - Full Backup bundle format: { metadata: ..., stores: { "edutech-admissions": { ... } } }
 * - Single item object: { id: "...", nameEn: "..." }
 * - Standard Zustand persist structure: { state: ..., version: number }
 */
export function normalizeVaultJsonForStore(
  key: string,
  text: string,
  existingRaw?: string | null
): string {
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    return text // Invalid JSON — return unchanged so caller can handle
  }

  let existingState: any = {}
  let existingVersion = 0
  if (existingRaw) {
    try {
      const e = JSON.parse(existingRaw)
      if (e && typeof e === 'object') {
        existingState = e.state || e
        existingVersion = e.version || 0
      }
    } catch {
      /* ignore */
    }
  }

  // 1. If parsed is a full Backup Bundle ({ metadata, stores })
  if (parsed && parsed.stores && typeof parsed.stores === 'object') {
    const baseKey = key.split('_')[0]
    const shortName = baseKey.replace(/^edutech-/, '')
    const storeEntry =
      parsed.stores[baseKey] ??
      parsed.stores[shortName] ??
      (shortName === 'admissions' ? parsed.stores['students'] : undefined) ??
      (shortName === 'classes' ? parsed.stores['routines'] : undefined)
    if (storeEntry) {
      parsed = storeEntry
    }
  }

  // 2. Normalize by store type
  if (key.includes('admissions') || key.includes('students')) {
    let rawStudents: any[] = []
    if (Array.isArray(parsed)) {
      rawStudents = parsed
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.state?.students)) {
        rawStudents = parsed.state.students
      } else if (Array.isArray(parsed.students)) {
        rawStudents = parsed.students
      } else if (parsed.id && (parsed.nameEn || parsed.nameBn)) {
        rawStudents = [parsed]
      }
    }

    const currentYear = new Date().getFullYear()
    const today = new Date().toISOString().split('T')[0]

    const normalizedStudents = rawStudents.map((raw: any, index: number) => {
      const id = String(raw.id || `ET-${currentYear}-${String(10001 + index).padStart(5, '0')}`).trim()
      return {
        id,
        createdAt: raw.createdAt || today,
        updatedAt: raw.updatedAt || today,
        status: raw.status === 'pending' || raw.status === 'rejected' ? raw.status : 'approved',
        active: raw.active !== false,
        approvedAt: raw.approvedAt || (raw.status === 'rejected' ? undefined : today),
        approvedBy: raw.approvedBy || '',
        inactiveAt: raw.inactiveAt || undefined,
        inactiveReason: raw.inactiveReason || undefined,
        photo: typeof raw.photo === 'string' ? raw.photo : '',
        nameEn: String(raw.nameEn || raw.name || '').trim(),
        nameBn: String(raw.nameBn || '').trim(),
        dob: String(raw.dob || '').trim(),
        gender: String(raw.gender || 'male').toLowerCase(),
        bloodGroup: String(raw.bloodGroup || '').trim(),
        religion: String(raw.religion || 'Islam').trim(),
        nationality: String(raw.nationality || 'Bangladeshi').trim(),
        phone: String(raw.phone || '').trim(),
        email: String(raw.email || '').trim(),
        class: String(raw.class || raw.className || '').trim(),
        section: String(raw.section || raw.sectionName || '').trim(),
        roll: String(raw.roll || String(index + 1)).trim(),
        academicYear: String(raw.academicYear || `${currentYear}-${String(currentYear + 1).slice(-2)}`).trim(),
        previousSchool: String(raw.previousSchool || '').trim(),
        admissionDate: String(raw.admissionDate || today).trim(),
        presentAddress: String(raw.presentAddress || '').trim(),
        permanentAddress: String(raw.permanentAddress || '').trim(),
        district: String(raw.district || '').trim(),
        fatherNameEn: String(raw.fatherNameEn || raw.fatherName || '').trim(),
        fatherNameBn: String(raw.fatherNameBn || '').trim(),
        fatherOccupation: String(raw.fatherOccupation || '').trim(),
        fatherPhone: String(raw.fatherPhone || '').trim(),
        fatherNid: String(raw.fatherNid || '').trim(),
        motherNameEn: String(raw.motherNameEn || raw.motherName || '').trim(),
        motherNameBn: String(raw.motherNameBn || '').trim(),
        motherOccupation: String(raw.motherOccupation || '').trim(),
        motherPhone: String(raw.motherPhone || '').trim(),
        motherNid: String(raw.motherNid || '').trim(),
        guardianName: String(raw.guardianName || '').trim(),
        guardianRelation: String(raw.guardianRelation || '').trim(),
        guardianPhone: String(raw.guardianPhone || '').trim(),
        teacherId: String(raw.teacherId || '').trim(),
        billingDate: raw.billingDate ? String(raw.billingDate) : undefined,
      }
    })

    const finalState = {
      ...existingState,
      ...(parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})),
      students: normalizedStudents,
      serverSynced: true,
      syncing: false,
      syncError: null,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('teachers') || key.includes('staff')) {
    let rawTeachers: any[] = []
    if (Array.isArray(parsed)) {
      rawTeachers = parsed
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.state?.teachers)) {
        rawTeachers = parsed.state.teachers
      } else if (Array.isArray(parsed.teachers)) {
        rawTeachers = parsed.teachers
      } else if (parsed.id && (parsed.nameEn || parsed.nameBn)) {
        rawTeachers = [parsed]
      }
    }

    const today = new Date().toISOString().split('T')[0]
    const normalizedTeachers = rawTeachers.map((raw: any, index: number) => {
      const id = String(raw.id || `ET${String(index + 1).padStart(4, '0')}`).trim()
      return {
        id,
        nameEn: String(raw.nameEn || raw.name || '').trim(),
        nameBn: String(raw.nameBn || '').trim(),
        gender: String(raw.gender || 'male').toLowerCase(),
        phone: String(raw.phone || '').trim(),
        email: raw.email ? String(raw.email).trim() : null,
        status: raw.status || 'active',
        departmentId: String(raw.departmentId || '').trim(),
        subjectIds: Array.isArray(raw.subjectIds) ? raw.subjectIds : [],
        designation: String(raw.designation || 'Teacher').trim(),
        joiningDate: raw.joiningDate || today,
        salary: Number(raw.salary) || 0,
        qualification: String(raw.qualification || '').trim(),
        photo: typeof raw.photo === 'string' ? raw.photo : '',
        signature: typeof raw.signature === 'string' ? raw.signature : '',
        createdAt: raw.createdAt || today,
        updatedAt: raw.updatedAt || today,
      }
    })

    const parsedInner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const finalState = {
      ...existingState,
      ...parsedInner,
      teachers: normalizedTeachers,
      departments: Array.isArray(parsedInner.departments) ? parsedInner.departments : (existingState.departments || []),
      subjects: Array.isArray(parsedInner.subjects) ? parsedInner.subjects : (existingState.subjects || []),
      designations: Array.isArray(parsedInner.designations) ? parsedInner.designations : (existingState.designations || []),
      attendance: parsedInner.attendance || existingState.attendance || {},
      serverSynced: true,
      syncing: false,
      syncError: null,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('classes') || key.includes('routines')) {
    let rawClasses: any[] | null = null
    let rawRoutines: any[] | null = null

    if (Array.isArray(parsed)) {
      if (key.includes('routines') || (parsed.length > 0 && parsed[0].periodDuration !== undefined)) {
        rawRoutines = parsed
      } else {
        rawClasses = parsed
      }
    } else if (parsed && typeof parsed === 'object') {
      const inner = parsed.state || parsed
      if (Array.isArray(inner.classes)) rawClasses = inner.classes
      if (Array.isArray(inner.routines)) rawRoutines = inner.routines
    }

    const today = new Date().toISOString().split('T')[0]
    let normalizedClasses = existingState.classes || []
    if (rawClasses) {
      normalizedClasses = rawClasses.map((raw: any, index: number) => {
        const id = raw.id !== undefined && raw.id !== null ? raw.id : `CLS-${String(index + 1).padStart(2, '0')}`
        return {
          id,
          name: String(raw.name || '').trim(),
          nameBn: String(raw.nameBn || '').trim(),
          startTime: String(raw.startTime || '08:00').trim(),
          endTime: String(raw.endTime || '14:00').trim(),
          sections: Array.isArray(raw.sections)
            ? raw.sections.map((sec: any, sIdx: number) => ({
                id: String(sec.id || `SEC-${id}-${String.fromCharCode(65 + sIdx)}`).trim(),
                name: String(sec.name || String.fromCharCode(65 + sIdx)).trim(),
                seatQuantity: Number(sec.seatQuantity) || 40,
                classTeacherId: String(sec.classTeacherId || '').trim(),
                subjectIds: Array.isArray(sec.subjectIds) ? sec.subjectIds : [],
              }))
            : [],
          subjectIds: Array.isArray(raw.subjectIds) ? raw.subjectIds : [],
          createdAt: raw.createdAt || today,
          updatedAt: raw.updatedAt || today,
        }
      })
    }

    let normalizedRoutines = existingState.routines || []
    if (rawRoutines) {
      normalizedRoutines = rawRoutines.map((raw: any) => ({
        classId: String(raw.classId || '').trim(),
        sectionId: String(raw.sectionId || '').trim(),
        periodDuration: Number(raw.periodDuration) || 40,
        weekendDays: Array.isArray(raw.weekendDays) ? raw.weekendDays : [5],
        periods: Array.isArray(raw.periods) ? raw.periods : [],
      }))
    }

    const parsedInner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const finalState = {
      ...existingState,
      ...parsedInner,
      classes: normalizedClasses,
      routines: normalizedRoutines,
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  // Fallback generic handler: ensure state wrapper exists
  if (parsed && typeof parsed === 'object' && 'state' in parsed) {
    return JSON.stringify(parsed)
  }
  return JSON.stringify({ state: parsed, version: existingVersion })
}

