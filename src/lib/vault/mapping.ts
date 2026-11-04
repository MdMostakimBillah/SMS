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
    else if (base === 'routines' || base === 'sections' || base === 'institution') storeBase = 'classes'
    else if (base === 'staff' || base === 'departments' || base === 'subjects' || base === 'designations') storeBase = 'teachers'
    else if (base === 'fee_structures' || base === 'payments' || base === 'waivers') storeBase = 'fees'
    else if (base === 'products' || base === 'categories' || base === 'sales') storeBase = 'store'

    return userId ? `edutech-${storeBase}_${slug}_${userId}` : `edutech-${storeBase}_${slug}`
  }

  // Root files: classes.json, teachers.json, students.json, routines.json, departments.json, etc.
  if (segments.length === 1 && segments[0].endsWith('.json') && scope?.slug) {
    const base = segments[0].slice(0, -'.json'.length)
    return toKey(base, scope.slug)
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
  let slug = segments[0]

  // Allow root images folder when scopeSlug is provided: images/logo.png, images/teachers/ET0001.png
  let relSegments = segments.slice(1)
  if (slug === 'images' && scopeSlug) {
    slug = scopeSlug
    relSegments = segments
  } else if (scopeSlug && slug !== scopeSlug) {
    return null
  }
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
  existingRaw?: string | null,
  filePath?: string
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

    const finalStudents = normalizedStudents.length > 0 ? normalizedStudents : (existingState.students || [])
    const finalState = {
      ...existingState,
      ...(parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})),
      students: finalStudents,
      serverSynced: true,
      syncing: false,
      syncError: null,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('teachers') || key.includes('staff')) {
    const isDept =
      filePath?.includes('departments') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].head !== undefined && parsed[0].salary === undefined) ||
      (parsed && typeof parsed === 'object' && parsed.departments && !parsed.teachers)

    if (isDept) {
      const rawDepts = Array.isArray(parsed)
        ? parsed
        : (parsed.departments || parsed.state?.departments || [])
      const normalizedDepts = rawDepts.map((raw: any, index: number) => ({
        id: String(raw.id || `DEP-${String(index + 1).padStart(2, '0')}`).trim(),
        name: String(raw.name || raw.nameEn || '').trim(),
        nameBn: String(raw.nameBn || '').trim(),
        head: String(raw.head || raw.headTeacherId || '').trim(),
      }))
      const finalState = {
        ...existingState,
        departments: normalizedDepts,
        serverSynced: true,
        syncing: false,
        syncError: null,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    const isSub =
      filePath?.includes('subjects') ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].code !== undefined || parsed[0].type !== undefined) && parsed[0].salary === undefined) ||
      (parsed && typeof parsed === 'object' && parsed.subjects && !parsed.teachers)

    if (isSub) {
      const rawSubs = Array.isArray(parsed)
        ? parsed
        : (parsed.subjects || parsed.state?.subjects || [])
      const normalizedSubs = rawSubs.map((raw: any, index: number) => ({
        id: String(raw.id || `SUB-${String(index + 1).padStart(2, '0')}`).trim(),
        name: String(raw.name || raw.nameEn || '').trim(),
        nameBn: String(raw.nameBn || '').trim(),
        code: String(raw.code || '').trim(),
        departmentId: String(raw.departmentId || '').trim(),
        type: raw.type === 'optional' ? 'optional' : 'mandatory',
      }))
      const finalState = {
        ...existingState,
        subjects: normalizedSubs,
        serverSynced: true,
        syncing: false,
        syncError: null,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    const isDes =
      filePath?.includes('designations') ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].title !== undefined || parsed[0].name !== undefined) && parsed[0].salary === undefined) ||
      (parsed && typeof parsed === 'object' && parsed.designations && !parsed.teachers)

    if (isDes) {
      const rawDes = Array.isArray(parsed)
        ? parsed
        : (parsed.designations || parsed.state?.designations || [])
      const today = new Date().toISOString().split('T')[0]
      const normalizedDes = rawDes.map((raw: any, index: number) => {
        const nameVal = String(raw.name || raw.title || '').trim()
        return {
          id: String(raw.id || `DES-${String(index + 1).padStart(2, '0')}`).trim(),
          name: nameVal,
          nameBn: String(raw.nameBn || '').trim(),
          title: nameVal,
          createdAt: String(raw.createdAt || today).trim(),
          updatedAt: String(raw.updatedAt || today).trim(),
        }
      })
      const finalState = {
        ...existingState,
        designations: normalizedDes,
        serverSynced: true,
        syncing: false,
        syncError: null,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

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
        ...raw,
        id,
        nameEn: String(raw.nameEn || raw.name || '').trim(),
        nameBn: String(raw.nameBn || '').trim(),
        gender: String(raw.gender || 'male').toLowerCase(),
        dob: raw.dob ? String(raw.dob) : '',
        bloodGroup: raw.bloodGroup ? String(raw.bloodGroup) : '',
        religion: raw.religion ? String(raw.religion) : '',
        phone: String(raw.phone || '').trim(),
        email: raw.email ? String(raw.email).trim() : null,
        address: raw.address ? String(raw.address) : '',
        nid: raw.nid ? String(raw.nid) : '',
        emergencyPhone: raw.emergencyPhone ? String(raw.emergencyPhone) : '',
        status: raw.status || 'active',
        category: raw.category ? String(raw.category) : 'Teacher',
        departmentId: String(raw.departmentId || '').trim(),
        subjectIds: Array.isArray(raw.subjectIds) ? raw.subjectIds : [],
        designation: String(raw.designation || 'Teacher').trim(),
        qualification: String(raw.qualification || '').trim(),
        experience: raw.experience ? String(raw.experience) : '',
        joiningDate: raw.joiningDate || today,
        salary: Number(raw.salary) || 0,
        salaryStartDate: raw.salaryStartDate ? String(raw.salaryStartDate) : undefined,
        bonus: raw.bonus != null ? Number(raw.bonus) : undefined,
        overtime: Number(raw.overtime) || 0,
        festivalBonus: raw.festivalBonus != null ? Number(raw.festivalBonus) : undefined,
        inTime: raw.inTime ? String(raw.inTime) : '',
        outTime: raw.outTime ? String(raw.outTime) : '',
        fatherNameEn: raw.fatherNameEn ? String(raw.fatherNameEn) : '',
        fatherNameBn: raw.fatherNameBn ? String(raw.fatherNameBn) : '',
        fatherPhone: raw.fatherPhone ? String(raw.fatherPhone) : '',
        fatherNid: raw.fatherNid ? String(raw.fatherNid) : '',
        motherNameEn: raw.motherNameEn ? String(raw.motherNameEn) : '',
        motherNameBn: raw.motherNameBn ? String(raw.motherNameBn) : '',
        motherPhone: raw.motherPhone ? String(raw.motherPhone) : '',
        guardianName: raw.guardianName ? String(raw.guardianName) : '',
        guardianPhone: raw.guardianPhone ? String(raw.guardianPhone) : '',
        guardianRelation: raw.guardianRelation ? String(raw.guardianRelation) : '',
        parentAddress: raw.parentAddress ? String(raw.parentAddress) : '',
        photo: typeof raw.photo === 'string' ? raw.photo : '',
        signature: typeof raw.signature === 'string' ? raw.signature : '',
        expertSubjects: raw.expertSubjects ? String(raw.expertSubjects) : undefined,
        applySalaryRule: Boolean(raw.applySalaryRule),
        createdAt: raw.createdAt || today,
        updatedAt: raw.updatedAt || today,
      }
    })

    const parsedInner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const existingDepts = existingState.departments || []
    const existingSubs = existingState.subjects || []
    const existingDes = existingState.designations || []

    const incomingDepts = Array.isArray(parsedInner.departments) && parsedInner.departments.length > 0 ? parsedInner.departments : null
    const incomingSubs = Array.isArray(parsedInner.subjects) && parsedInner.subjects.length > 0 ? parsedInner.subjects : null
    const incomingDes = Array.isArray(parsedInner.designations) && parsedInner.designations.length > 0 ? parsedInner.designations : null

    const finalDepts = incomingDepts || existingDepts
    const finalSubs = incomingSubs || existingSubs
    const finalDes = incomingDes
      ? incomingDes.map((raw: any, index: number) => {
          const nameVal = String(raw.name || raw.title || '').trim()
          return {
            id: String(raw.id || `DES-${String(index + 1).padStart(2, '0')}`).trim(),
            name: nameVal,
            nameBn: String(raw.nameBn || '').trim(),
            title: nameVal,
            createdAt: String(raw.createdAt || today).trim(),
            updatedAt: String(raw.updatedAt || today).trim(),
          }
        })
      : existingDes

    const finalTeachers = normalizedTeachers.length > 0 ? normalizedTeachers : (existingState.teachers || [])

    const finalState = {
      ...existingState,
      ...parsedInner,
      teachers: finalTeachers,
      departments: finalDepts,
      subjects: finalSubs,
      designations: finalDes,
      attendance: parsedInner.attendance || existingState.attendance || {},
      serverSynced: true,
      syncing: false,
      syncError: null,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('classes') || key.includes('routines')) {
    const isRoutine =
      filePath?.includes('routines') ||
      (Array.isArray(parsed) && (parsed.length === 0 || parsed[0].periodDuration !== undefined || parsed[0].periods !== undefined) && !filePath?.includes('classes') && !filePath?.includes('sections')) ||
      (parsed && typeof parsed === 'object' && parsed.routines && !parsed.classes)

    if (isRoutine && (filePath?.includes('routines') || !Array.isArray(parsed) || (parsed.length > 0 && parsed[0].periodDuration !== undefined))) {
      const rawRoutines = Array.isArray(parsed)
        ? parsed
        : (parsed.routines || parsed.state?.routines || [])
      const normalizedRoutines = rawRoutines.map((raw: any) => ({
        classId: String(raw.classId || '').trim(),
        sectionId: String(raw.sectionId || '').trim(),
        periodDuration: Number(raw.periodDuration) || 40,
        weekendDays: Array.isArray(raw.weekendDays) ? raw.weekendDays : [5],
        periods: Array.isArray(raw.periods) ? raw.periods : [],
      }))
      const curSession = existingState.institution?.currentSession || '2025-26'
      const finalState = {
        ...existingState,
        routines: normalizedRoutines,
        sessionRoutines: {
          ...(existingState.sessionRoutines || {}),
          [curSession]: normalizedRoutines,
        },
        serverSynced: true,
        syncing: false,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    const isSection =
      filePath?.includes('sections') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].seatQuantity !== undefined && parsed[0].startTime === undefined) ||
      (parsed && typeof parsed === 'object' && parsed.sections && !parsed.classes)

    if (isSection) {
      const rawSections = Array.isArray(parsed)
        ? parsed
        : (parsed.sections || parsed.state?.sections || [])
      const classMap = new Map<string, any[]>()
      for (const sec of rawSections) {
        const cId = String(sec.classId || '').trim()
        if (!classMap.has(cId)) classMap.set(cId, [])
        classMap.get(cId)!.push({
          id: String(sec.id || `SEC-${cId}-${sec.name || 'A'}`).trim(),
          name: String(sec.name || '').trim(),
          seatQuantity: Number(sec.seatQuantity) || 40,
          classTeacherId: String(sec.classTeacherId || '').trim(),
          subjectIds: Array.isArray(sec.subjectIds) ? sec.subjectIds : [],
        })
      }
      const updatedClasses = (existingState.classes || []).map((c: any) => {
        if (classMap.has(c.id)) {
          return { ...c, sections: classMap.get(c.id)! }
        }
        return c
      })
      const curSession = existingState.institution?.currentSession || '2025-26'
      const finalState = {
        ...existingState,
        classes: updatedClasses,
        sessionClasses: {
          ...(existingState.sessionClasses || {}),
          [curSession]: updatedClasses,
        },
        serverSynced: true,
        syncing: false,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    const isInst =
      filePath?.includes('institution') ||
      (parsed && typeof parsed === 'object' && (parsed.brandName !== undefined || parsed.nameEn !== undefined || parsed.eiin !== undefined) && !parsed.classes)

    if (isInst) {
      const inst = parsed.state?.institution || parsed.institution || parsed
      const finalState = {
        ...existingState,
        institution: {
          ...existingState.institution,
          ...inst,
        },
        serverSynced: true,
        syncing: false,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    let rawClasses: any[] | null = null
    let rawRoutines: any[] | null = null

    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && parsed[0].periodDuration !== undefined) {
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

    const finalClasses = normalizedClasses.length > 0 ? normalizedClasses : (existingState.classes || [])
    const finalRoutines = normalizedRoutines.length > 0 ? normalizedRoutines : (existingState.routines || [])

    const curSession = existingState.institution?.currentSession || '2025-26'
    const finalSessionClasses = {
      ...(existingState.sessionClasses || {}),
      [curSession]: finalClasses,
    }
    const finalSessionRoutines = {
      ...(existingState.sessionRoutines || {}),
      [curSession]: finalRoutines,
    }

    const parsedInner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const finalState = {
      ...existingState,
      ...parsedInner,
      classes: finalClasses,
      routines: finalRoutines,
      sessionClasses: finalSessionClasses,
      sessionRoutines: finalSessionRoutines,
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('fees')) {
    const isPayment =
      filePath?.includes('payments') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].paidAt !== undefined) ||
      (parsed && typeof parsed === 'object' && parsed.payments && !parsed.structures)

    if (isPayment) {
      const rawPayments = Array.isArray(parsed)
        ? parsed
        : (parsed.payments || parsed.state?.payments || [])
      const today = new Date().toISOString().split('T')[0]
      const normalizedPayments = rawPayments.map((raw: any, index: number) => ({
        id: String(raw.id || `PAY-${Date.now()}-${index}`).trim(),
        studentId: String(raw.studentId || '').trim(),
        feeStructureId: String(raw.feeStructureId || '').trim(),
        amount: Number(raw.amount) || 0,
        discount: Number(raw.discount) || 0,
        paidAt: String(raw.paidAt || today).trim(),
        method: raw.method || 'cash',
        reference: String(raw.reference || '').trim(),
        note: String(raw.note || '').trim(),
        collectedBy: String(raw.collectedBy || '').trim(),
        createdAt: String(raw.createdAt || today).trim(),
        batchId: raw.batchId ? String(raw.batchId) : undefined,
        forMonth: raw.forMonth ? String(raw.forMonth) : undefined,
      }))
      const finalState = {
        ...existingState,
        payments: normalizedPayments,
        serverSynced: true,
        syncing: false,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    const isWaiver =
      filePath?.includes('waivers') ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].mode !== undefined || parsed[0].waiverCategoryId !== undefined)) ||
      (parsed && typeof parsed === 'object' && (parsed.waiverEntries || parsed.studentWaivers) && !parsed.structures)

    if (isWaiver) {
      const rawWaivers = Array.isArray(parsed)
        ? parsed
        : (parsed.waiverEntries || parsed.waivers || parsed.state?.waiverEntries || [])
      const today = new Date().toISOString().split('T')[0]
      const normalizedWaivers = rawWaivers.map((raw: any, index: number) => ({
        id: String(raw.id || `WVR-${Date.now()}-${index}`).trim(),
        categoryId: String(raw.categoryId || raw.waiverCategoryId || '').trim(),
        studentId: String(raw.studentId || '').trim(),
        feeStructureId: String(raw.feeStructureId || '').trim(),
        mode: raw.mode === 'percent' ? 'percent' : 'amount',
        value: Number(raw.value) || 0,
        months: Array.isArray(raw.months) ? raw.months : [],
        reason: String(raw.reason || '').trim(),
        reasonBn: String(raw.reasonBn || '').trim(),
        notes: raw.notes ? String(raw.notes) : undefined,
        approvedBy: String(raw.approvedBy || '').trim(),
        createdAt: String(raw.createdAt || today).trim(),
      }))
      const finalState = {
        ...existingState,
        waiverEntries: normalizedWaivers,
        serverSynced: true,
        syncing: false,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    const isStructureOnly =
      filePath?.includes('fee_structures') ||
      filePath?.includes('structures') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].amount !== undefined && parsed[0].studentId === undefined)

    if (isStructureOnly) {
      const rawStructures = Array.isArray(parsed)
        ? parsed
        : (parsed.structures || parsed.state?.structures || [])
      const today = new Date().toISOString().split('T')[0]
      const normalizedStructures = rawStructures.map((raw: any, index: number) => ({
        id: String(raw.id || `FEE-${Date.now()}-${index}`).trim(),
        name: String(raw.name || '').trim(),
        nameBn: String(raw.nameBn || '').trim(),
        class: String(raw.class || '').trim(),
        section: raw.section ? String(raw.section).trim() : undefined,
        academicYear: String(raw.academicYear || '2025-26').trim(),
        amount: Number(raw.amount) || 0,
        description: String(raw.description || '').trim(),
        descriptionBn: String(raw.descriptionBn || '').trim(),
        isActive: raw.isActive !== false,
        type: raw.type === 'monthly' ? 'monthly' : 'onetime',
        categoryId: raw.categoryId ? String(raw.categoryId) : undefined,
        studentId: raw.studentId ? String(raw.studentId) : undefined,
        applicableMonths: Array.isArray(raw.applicableMonths) ? raw.applicableMonths : undefined,
        createdAt: String(raw.createdAt || today).trim(),
      }))
      const finalState = {
        ...existingState,
        structures: normalizedStructures,
        serverSynced: true,
        syncing: false,
      }
      return JSON.stringify({ state: finalState, version: existingVersion })
    }

    // Full fees object
    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const today = new Date().toISOString().split('T')[0]
    let structures = existingState.structures || []
    if (Array.isArray(inner.structures)) {
      structures = inner.structures.map((raw: any, index: number) => ({
        id: String(raw.id || `FEE-${Date.now()}-${index}`).trim(),
        name: String(raw.name || '').trim(),
        nameBn: String(raw.nameBn || '').trim(),
        class: String(raw.class || '').trim(),
        section: raw.section ? String(raw.section).trim() : undefined,
        academicYear: String(raw.academicYear || '2025-26').trim(),
        amount: Number(raw.amount) || 0,
        description: String(raw.description || '').trim(),
        descriptionBn: String(raw.descriptionBn || '').trim(),
        isActive: raw.isActive !== false,
        type: raw.type === 'monthly' ? 'monthly' : 'onetime',
        categoryId: raw.categoryId ? String(raw.categoryId) : undefined,
        studentId: raw.studentId ? String(raw.studentId) : undefined,
        applicableMonths: Array.isArray(raw.applicableMonths) ? raw.applicableMonths : undefined,
        createdAt: String(raw.createdAt || today).trim(),
      }))
    }
    let payments = existingState.payments || []
    if (Array.isArray(inner.payments)) {
      payments = inner.payments.map((raw: any, index: number) => ({
        id: String(raw.id || `PAY-${Date.now()}-${index}`).trim(),
        studentId: String(raw.studentId || '').trim(),
        feeStructureId: String(raw.feeStructureId || '').trim(),
        amount: Number(raw.amount) || 0,
        discount: Number(raw.discount) || 0,
        paidAt: String(raw.paidAt || today).trim(),
        method: raw.method || 'cash',
        reference: String(raw.reference || '').trim(),
        note: String(raw.note || '').trim(),
        collectedBy: String(raw.collectedBy || '').trim(),
        createdAt: String(raw.createdAt || today).trim(),
        batchId: raw.batchId ? String(raw.batchId) : undefined,
        forMonth: raw.forMonth ? String(raw.forMonth) : undefined,
      }))
    }

    const finalState = {
      ...existingState,
      ...inner,
      structures,
      payments,
      feeCategories: Array.isArray(inner.feeCategories) ? inner.feeCategories : (existingState.feeCategories || []),
      waiverCategories: Array.isArray(inner.waiverCategories) ? inner.waiverCategories : (existingState.waiverCategories || []),
      waiverEntries: Array.isArray(inner.waiverEntries) ? inner.waiverEntries : (existingState.waiverEntries || []),
      studentWaivers: Array.isArray(inner.studentWaivers) ? inner.studentWaivers : (existingState.studentWaivers || []),
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('store')) {
    const existing = (() => {
      try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    })()
    const existingState = existing.state || {}
    const existingVersion = existing.version || 1

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const products = Array.isArray(inner.products) ? inner.products : (Array.isArray(parsed) ? parsed : (existingState.products || []))
    const categories = Array.isArray(inner.categories) ? inner.categories : (existingState.categories || [])
    const sales = Array.isArray(inner.sales) ? inner.sales : (existingState.sales || [])

    const finalState = {
      ...existingState,
      ...inner,
      products,
      categories,
      sales,
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

