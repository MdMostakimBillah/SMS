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
const BLOCKED_KEYS = new Set([
  'edutech_super_admin',
  'edutech_superadmin_user',
  'edutech_offline_session',
  'edutech_api_login_attempts',
  'edutech_api_lockout_until',
])

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
  if (key.endsWith(`_${slug}`)) return true
  if (key === 'edutech-classes' || key === 'edutech-teachers' || key === 'edutech-admissions' || key === 'edutech-fees' || key === 'edutech-notices') {
    return true
  }
  return false
}

/** localStorage key → vault file path, or null for non-institution keys. */
export function keyToVaultPath(key: string, fallbackSlug?: string | null): string | null {
  const info = parseVaultKey(key)
  if (info) {
    return info.userId
      ? `${info.slug}/users/${info.userId}/${info.base}.json`
      : `${info.slug}/${info.base}.json`
  }
  const effSlug = fallbackSlug || (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')) : null)
  if (effSlug && (key.startsWith('edutech-') || key.startsWith('edutech_'))) {
    const rawBase = key.replace(/^edutech[-_]/, '')
    if (isValidSegment(rawBase) && isValidSegment(effSlug)) {
      return `${effSlug}/${rawBase}.json`
    }
  }
  if (key === 'edutech-classes' || key === 'edutech_classes') {
    return effSlug ? `${effSlug}/classes.json` : 'classes.json'
  }
  if (key === 'edutech-teachers' || key === 'edutech_teachers') {
    return effSlug ? `${effSlug}/teachers.json` : 'teachers.json'
  }
  if (key === 'edutech-admissions' || key === 'edutech_admissions') {
    return effSlug ? `${effSlug}/admissions.json` : 'admissions.json'
  }
  if (key === 'edutech-fees' || key === 'edutech_fees') {
    return effSlug ? `${effSlug}/fees.json` : 'fees.json'
  }
  if (key === 'edutech-notices' || key === 'edutech_notices') {
    return effSlug ? `${effSlug}/notices.json` : 'notices.json'
  }
  if (key === 'edutech-user-accounts' || key === 'edutech_user_accounts' || key === 'edutech-accounts') {
    return effSlug ? `${effSlug}/accounts.json` : 'accounts.json'
  }
  return null
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
    else if (base === 'accounts' || base === 'user_accounts' || base === 'credentials' || base === 'user-accounts') storeBase = 'user-accounts'
    else if (base === 'routines' || base === 'sections' || base === 'institution') storeBase = 'classes'
    else if (base === 'staff' || base === 'departments' || base === 'subjects' || base === 'designations') storeBase = 'teachers'
    else if (base === 'fee_structures' || base === 'payments' || base === 'waivers') storeBase = 'fees'
    else if (base === 'products' || base === 'categories' || base === 'sales') storeBase = 'store'
    else if (base === 'vehicles' || base === 'routes' || base === 'transport_assignments' || base === 'transport') storeBase = 'transport'
    else if (base === 'rooms' || base === 'hostel_assignments' || base === 'hostel') storeBase = 'hostel'
    else if (base === 'others_income' || base === 'others-income' || base === 'others_income_categories' || base === 'others_income_assignments' || base === 'other_income') storeBase = 'others-income'
    else if (base === 'expenses' || base === 'expense_categories' || base === 'expense_entries') storeBase = 'expenses'
    else if (
      base === 'hr' ||
      base === 'hr_increments' ||
      base === 'increments' ||
      base === 'hr_bonuses' ||
      base === 'bonuses' ||
      base === 'hr_promotions' ||
      base === 'promotions' ||
      base === 'hr_funds' ||
      base === 'funds' ||
      base === 'hr_facilities' ||
      base === 'facilities' ||
      base === 'hr_teacher_facilities' ||
      base === 'teacher_facilities' ||
      base === 'hr_salary_configs' ||
      base === 'monthly_salary_configs' ||
      base === 'salary_configs' ||
      base === 'payroll' ||
      base === 'payroll_configs' ||
      base === 'hr_recommendations' ||
      base === 'recommendations'
    ) storeBase = 'hr'
    else if (
      base === 'exams' ||
      base === 'exam_configs' ||
      base === 'subject_mark_configs' ||
      base === 'student_marks' ||
      base === 'exam_routines' ||
      base === 'exam_rooms' ||
      base === 'rooms' ||
      base === 'exam_seat_plans' ||
      base === 'seat_plans' ||
      base === 'exam_invigilators' ||
      base === 'invigilators' ||
      base === 'exam_attendances' ||
      base === 'attendances' ||
      base === 'marksheet_configs' ||
      base === 'grade_scales' ||
      base === 'student_promotions' ||
      base === 'promotions' ||
      base === 'cumulative_sheets' ||
      base === 'mark_adjustments' ||
      base === 'omr_templates' ||
      base === 'omr_configs' ||
      base === 'extra_marks' ||
      base === 'extra_mark_types' ||
      base === 'working_days' ||
      base === 'general_abilities'
    ) storeBase = 'exams'
    else if (base === 'syllabus' || base === 'syllabi') storeBase = 'syllabus'
    else if (base === 'assignments' || base === 'assignment' || base === 'submissions') storeBase = 'assignments'
    else if (base === 'online' || base === 'online_classes' || base === 'online-classes') storeBase = 'online'
    else if (base === 'notifications' || base === 'notification_entries') storeBase = 'notifications'
    else if (base === 'notices' || base === 'notice') storeBase = 'notices'

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
  if (existingRaw && !filePath && typeof existingRaw === 'string' && existingRaw.endsWith('.json')) {
    filePath = existingRaw
    existingRaw = null
  }
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
        let cId = String(sec.classId || '').trim()
        if (!cId && sec.id) {
          const match = String(sec.id).match(/^SEC-(CLS-[^-]+)/i)
          if (match) cId = match[1]
        }
        if (!classMap.has(cId)) classMap.set(cId, [])
        classMap.get(cId)!.push({
          id: String(sec.id || `SEC-${cId}-${sec.name || 'A'}`).trim(),
          name: String(sec.name || '').trim(),
          seatQuantity: Number(sec.seatQuantity) || 40,
          classTeacherId: String(sec.classTeacherId || '').trim(),
          subjectIds: Array.isArray(sec.subjectIds) ? sec.subjectIds : (Array.isArray(sec.subjects) ? sec.subjects : []),
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
      const instSessions = Array.isArray(inst.sessions) && inst.sessions.length > 0
        ? inst.sessions
        : (existingState.institution?.sessions || [])
      const newCurrentSession = (inst.currentSession && instSessions.includes(inst.currentSession))
        ? inst.currentSession
        : (existingState.institution?.currentSession && instSessions.includes(existingState.institution.currentSession))
          ? existingState.institution.currentSession
          : (instSessions[0] || '2025-26')
      const targetClasses =
        existingState.sessionClasses?.[newCurrentSession] ||
        (newCurrentSession === existingState.institution?.currentSession ? (existingState.classes || []) : [])
      const targetRoutines =
        existingState.sessionRoutines?.[newCurrentSession] ||
        (newCurrentSession === existingState.institution?.currentSession ? (existingState.routines || []) : [])

      const cleanSessionClasses = { ...(existingState.sessionClasses || {}) }
      const cleanSessionRoutines = { ...(existingState.sessionRoutines || {}) }
      if (Array.isArray(inst.sessions) && inst.sessions.length > 0) {
        const allowedSessions = new Set(instSessions)
        for (const s of Object.keys(cleanSessionClasses)) {
          if (!allowedSessions.has(s)) delete cleanSessionClasses[s]
        }
        for (const s of Object.keys(cleanSessionRoutines)) {
          if (!allowedSessions.has(s)) delete cleanSessionRoutines[s]
        }
      }

      const finalState = {
        ...existingState,
        classes: targetClasses,
        routines: targetRoutines,
        sessionClasses: cleanSessionClasses,
        sessionRoutines: cleanSessionRoutines,
        institution: {
          ...existingState.institution,
          ...inst,
          sessions: instSessions,
          currentSession: newCurrentSession,
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
                subjectIds: Array.isArray(sec.subjectIds) ? sec.subjectIds : (Array.isArray(sec.subjects) ? sec.subjects : []),
              }))
            : [],
          subjectIds: Array.isArray(raw.subjectIds) ? raw.subjectIds : (Array.isArray(raw.subjects) ? raw.subjects : []),
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
    const parsedSessions = Array.isArray(parsedInner.institution?.sessions) && parsedInner.institution.sessions.length > 0
      ? parsedInner.institution.sessions
      : (Array.isArray(parsedInner.sessions) && parsedInner.sessions.length > 0 ? parsedInner.sessions : null)

    const finalSessions = parsedSessions || (existingState.institution?.sessions && existingState.institution.sessions.length > 0 ? existingState.institution.sessions : ['2025-26'])
    const allowedSessions = new Set(finalSessions)

    const curSession =
      (parsedInner.institution?.currentSession && allowedSessions.has(parsedInner.institution.currentSession))
        ? parsedInner.institution.currentSession
        : (parsedInner.currentSession && allowedSessions.has(parsedInner.currentSession))
          ? parsedInner.currentSession
          : (existingState.institution?.currentSession && allowedSessions.has(existingState.institution.currentSession))
            ? existingState.institution.currentSession
            : (finalSessions[0] || '2025-26')

    const mergedSessionClasses: Record<string, any[]> = {}
    if (parsedInner.sessionClasses) {
      for (const [sess, list] of Object.entries(parsedInner.sessionClasses)) {
        if (allowedSessions.has(sess) && Array.isArray(list)) {
          mergedSessionClasses[sess] = list.map((c: any, index: number) => ({
            id: c.id !== undefined && c.id !== null ? c.id : `CLS-${String(index + 1).padStart(2, '0')}`,
            name: String(c.name || '').trim(),
            nameBn: String(c.nameBn || '').trim(),
            startTime: String(c.startTime || '07:30').trim(),
            endTime: String(c.endTime || '14:30').trim(),
            subjectIds: Array.isArray(c.subjectIds) ? c.subjectIds : (Array.isArray(c.subjects) ? c.subjects : []),
            sections: Array.isArray(c.sections)
              ? c.sections.map((s: any, sIdx: number) => ({
                  id: String(s.id || `SEC-${c.id || index + 1}-${String.fromCharCode(65 + sIdx)}`).trim(),
                  name: String(s.name || String.fromCharCode(65 + sIdx)).trim(),
                  seatQuantity: Number(s.seatQuantity) || 40,
                  classTeacherId: String(s.classTeacherId || '').trim(),
                  subjectIds: Array.isArray(s.subjectIds) ? s.subjectIds : (Array.isArray(s.subjects) ? s.subjects : []),
                }))
              : [],
            createdAt: c.createdAt || today,
            updatedAt: c.updatedAt || today,
          }))
        }
      }
    }
    for (const [sess, list] of Object.entries(existingState.sessionClasses || {})) {
      if (allowedSessions.has(sess) && !mergedSessionClasses[sess]) {
        mergedSessionClasses[sess] = Array.isArray(list) ? list : []
      }
    }

    const mergedSessionRoutines: Record<string, any[]> = {}
    if (parsedInner.sessionRoutines) {
      for (const [sess, list] of Object.entries(parsedInner.sessionRoutines)) {
        if (allowedSessions.has(sess) && Array.isArray(list)) {
          mergedSessionRoutines[sess] = list
        }
      }
    }
    for (const [sess, list] of Object.entries(existingState.sessionRoutines || {})) {
      if (allowedSessions.has(sess) && !mergedSessionRoutines[sess]) {
        mergedSessionRoutines[sess] = Array.isArray(list) ? list : []
      }
    }

    let finalClasses: any[]
    if (parsedInner.sessionClasses && curSession in parsedInner.sessionClasses) {
      finalClasses = mergedSessionClasses[curSession] || []
    } else if (rawClasses !== null) {
      finalClasses = normalizedClasses
      mergedSessionClasses[curSession] = finalClasses
    } else if (mergedSessionClasses[curSession]) {
      finalClasses = mergedSessionClasses[curSession]
    } else if (existingState.sessionClasses && curSession in existingState.sessionClasses) {
      finalClasses = existingState.sessionClasses[curSession] || []
    } else {
      finalClasses = normalizedClasses.length > 0 ? normalizedClasses : (existingState.classes || [])
      mergedSessionClasses[curSession] = finalClasses
    }

    let finalRoutines: any[]
    if (parsedInner.sessionRoutines && curSession in parsedInner.sessionRoutines) {
      finalRoutines = Array.isArray(parsedInner.sessionRoutines[curSession]) ? parsedInner.sessionRoutines[curSession] : []
    } else if (rawRoutines !== null) {
      finalRoutines = normalizedRoutines
      mergedSessionRoutines[curSession] = finalRoutines
    } else if (existingState.sessionRoutines && curSession in existingState.sessionRoutines) {
      finalRoutines = existingState.sessionRoutines[curSession] || []
    } else {
      finalRoutines = normalizedRoutines.length > 0 ? normalizedRoutines : (existingState.routines || [])
      mergedSessionRoutines[curSession] = finalRoutines
    }

    const finalState = {
      ...existingState,
      ...parsedInner,
      institution: {
        ...(existingState.institution || {}),
        ...(parsedInner.institution || {}),
        sessions: finalSessions,
        currentSession: curSession,
      },
      classes: finalClasses,
      routines: finalRoutines,
      sessionClasses: mergedSessionClasses,
      sessionRoutines: mergedSessionRoutines,
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

    const isSalesOnly =
      filePath?.includes('sales') ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].soldToId !== undefined || parsed[0].soldToName !== undefined || parsed[0].items !== undefined))

    if (isSalesOnly) {
      const rawSales = Array.isArray(parsed) ? parsed : (parsed.sales || parsed.state?.sales || [])
      const normalizedSales = rawSales.map((s: any, idx: number) => ({
        id: String(s.id || `sale-${Date.now()}-${idx}`).trim(),
        items: Array.isArray(s.items) ? s.items : [],
        total: Number(s.total) || 0,
        paymentMethod: s.paymentMethod || 'cash',
        soldToId: String(s.soldToId || ''),
        soldToName: String(s.soldToName || ''),
        soldToNameBn: String(s.soldToNameBn || s.soldToName || ''),
        soldToClass: String(s.soldToClass || ''),
        soldToSection: String(s.soldToSection || ''),
        note: String(s.note || ''),
        createdBy: String(s.createdBy || 'admin'),
        createdAt: String(s.createdAt || new Date().toISOString()),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          sales: normalizedSales,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isCategoriesOnly =
      filePath?.includes('categories') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].unit !== undefined && parsed[0].price === undefined)

    if (isCategoriesOnly) {
      const rawCats = Array.isArray(parsed) ? parsed : (parsed.categories || parsed.state?.categories || [])
      const normalizedCats = rawCats.map((c: any, idx: number) => ({
        id: String(c.id || `CAT-${Date.now()}-${idx}`).trim(),
        name: String(c.name || '').trim(),
        nameBn: String(c.nameBn || c.name || '').trim(),
        unit: String(c.unit || 'pc').trim(),
        unitBn: String(c.unitBn || 'পিস').trim(),
        description: String(c.description || '').trim(),
        descriptionBn: String(c.descriptionBn || '').trim(),
        isActive: c.isActive !== false,
        createdAt: String(c.createdAt || new Date().toISOString()),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          categories: normalizedCats,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isProductsOnly =
      filePath?.includes('products') ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].price !== undefined || parsed[0].sku !== undefined))

    if (isProductsOnly) {
      const rawProds = Array.isArray(parsed) ? parsed : (parsed.products || parsed.state?.products || [])
      const normalizedProds = rawProds.map((p: any, idx: number) => ({
        id: String(p.id || `SP-${Date.now()}-${idx}`).trim(),
        name: String(p.name || '').trim(),
        nameBn: String(p.nameBn || p.name || '').trim(),
        categoryId: String(p.categoryId || '').trim(),
        classNames: Array.isArray(p.classNames) ? p.classNames : [],
        price: Number(p.price) || 0,
        cost: Number(p.cost) || 0,
        stock: Number(p.stock) || 0,
        minStock: Number(p.minStock) || 5,
        sku: String(p.sku || `SKU-${Date.now()}-${idx}`).trim(),
        unit: String(p.unit || 'pc').trim(),
        unitBn: String(p.unitBn || 'পিস').trim(),
        description: String(p.description || '').trim(),
        descriptionBn: String(p.descriptionBn || '').trim(),
        isActive: p.isActive !== false,
        createdAt: String(p.createdAt || new Date().toISOString()),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          products: normalizedProds,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const rawProducts = Array.isArray(inner.products) ? inner.products : (Array.isArray(parsed) ? parsed : (existingState.products || []))
    const products = rawProducts.map((p: any) => ({
      ...p,
      classNames: Array.isArray(p.classNames) ? p.classNames : [],
    }))
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

  if (key.includes('transport')) {
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

    const isVehiclesOnly =
      filePath?.includes('vehicles') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].registrationNo !== undefined)

    if (isVehiclesOnly) {
      const rawVehicles = Array.isArray(parsed) ? parsed : (parsed.vehicles || parsed.state?.vehicles || [])
      const normalizedVehicles = rawVehicles.map((v: any, idx: number) => ({
        id: String(v.id || `TV-${Date.now()}-${idx}`).trim(),
        name: String(v.name || '').trim(),
        nameBn: String(v.nameBn || v.name || '').trim(),
        registrationNo: String(v.registrationNo || '').trim(),
        capacity: Number(v.capacity) || 0,
        driverId: String(v.driverId || '').trim(),
        driverName: String(v.driverName || '').trim(),
        driverNameBn: String(v.driverNameBn || v.driverName || '').trim(),
        driverPhone: String(v.driverPhone || '').trim(),
        driverDetails: String(v.driverDetails || '').trim(),
        vehicleDetails: String(v.vehicleDetails || '').trim(),
        routeIds: Array.isArray(v.routeIds) ? v.routeIds : [],
        isActive: v.isActive !== false,
        createdAt: String(v.createdAt || new Date().toISOString()),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          vehicles: normalizedVehicles,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isRoutesOnly =
      filePath?.includes('routes') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].stops !== undefined)

    if (isRoutesOnly) {
      const rawRoutes = Array.isArray(parsed) ? parsed : (parsed.routes || parsed.state?.routes || [])
      const normalizedRoutes = rawRoutes.map((r: any, idx: number) => ({
        id: String(r.id || `TR-${Date.now()}-${idx}`).trim(),
        name: String(r.name || '').trim(),
        nameBn: String(r.nameBn || r.name || '').trim(),
        stops: String(r.stops || '').trim(),
        stopsBn: String(r.stopsBn || r.stops || '').trim(),
        distance: String(r.distance || '').trim(),
        fare: Number(r.fare) || 0,
        isActive: r.isActive !== false,
        createdAt: String(r.createdAt || new Date().toISOString()),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          routes: normalizedRoutes,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isAssignmentsOnly =
      filePath?.includes('assignment') ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].pickupStop !== undefined || (parsed[0].vehicleId !== undefined && parsed[0].routeId !== undefined)))

    if (isAssignmentsOnly) {
      const rawAssignments = Array.isArray(parsed) ? parsed : (parsed.assignments || parsed.state?.assignments || [])
      const normalizedAssignments = rawAssignments.map((a: any, idx: number) => ({
        id: String(a.id || `TA-${Date.now()}-${idx}`).trim(),
        studentId: String(a.studentId || '').trim(),
        vehicleId: String(a.vehicleId || '').trim(),
        routeId: String(a.routeId || '').trim(),
        pickupStop: String(a.pickupStop || '').trim(),
        monthlyFare: Number(a.monthlyFare) || 0,
        academicYear: String(a.academicYear || '2025-26'),
        months: Array.isArray(a.months) ? a.months : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        assignedDate: String(a.assignedDate || new Date().toISOString().split('T')[0]),
        isActive: a.isActive !== false,
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          assignments: normalizedAssignments,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const vehicles = Array.isArray(inner.vehicles) ? inner.vehicles : (existingState.vehicles || [])
    const routes = Array.isArray(inner.routes) ? inner.routes : (existingState.routes || [])
    const assignments = Array.isArray(inner.assignments) ? inner.assignments : (existingState.assignments || [])

    const finalState = {
      ...existingState,
      ...inner,
      vehicles,
      routes,
      assignments,
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('hostel')) {
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

    const isRoomsOnly =
      filePath?.includes('rooms') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].roomNumber !== undefined)

    if (isRoomsOnly) {
      const rawRooms = Array.isArray(parsed) ? parsed : (parsed.rooms || parsed.state?.rooms || [])
      const normalizedRooms = rawRooms.map((r: any, idx: number) => ({
        id: String(r.id || `HR-${Date.now()}-${idx}`).trim(),
        name: String(r.name || '').trim(),
        nameBn: String(r.nameBn || r.name || '').trim(),
        roomNumber: String(r.roomNumber || '').trim(),
        floor: String(r.floor || '').trim(),
        capacity: Number(r.capacity) || 0,
        monthlyRent: Number(r.monthlyRent) || 0,
        amenities: String(r.amenities || '').trim(),
        amenitiesBn: String(r.amenitiesBn || r.amenities || '').trim(),
        isActive: r.isActive !== false,
        createdAt: String(r.createdAt || new Date().toISOString()),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          rooms: normalizedRooms,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isAssignmentsOnly =
      filePath?.includes('assignment') ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].bedNumber !== undefined || parsed[0].roomId !== undefined))

    if (isAssignmentsOnly) {
      const rawAssignments = Array.isArray(parsed) ? parsed : (parsed.assignments || parsed.state?.assignments || [])
      const normalizedAssignments = rawAssignments.map((a: any, idx: number) => ({
        id: String(a.id || `HA-${Date.now()}-${idx}`).trim(),
        studentId: String(a.studentId || '').trim(),
        roomId: String(a.roomId || '').trim(),
        bedNumber: String(a.bedNumber || '').trim(),
        monthlyRent: Number(a.monthlyRent) || 0,
        academicYear: String(a.academicYear || '2025-26'),
        months: Array.isArray(a.months) ? a.months : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        assignedDate: String(a.assignedDate || new Date().toISOString().split('T')[0]),
        isActive: a.isActive !== false,
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          assignments: normalizedAssignments,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const rooms = Array.isArray(inner.rooms) ? inner.rooms : (existingState.rooms || [])
    const assignments = Array.isArray(inner.assignments) ? inner.assignments : (existingState.assignments || [])

    const finalState = {
      ...existingState,
      ...inner,
      rooms,
      assignments,
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('others-income') || key.includes('others_income')) {
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

    const isCategoriesOnly =
      filePath?.includes('categories') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].amount !== undefined && parsed[0].type !== undefined)

    if (isCategoriesOnly) {
      const rawCats = Array.isArray(parsed) ? parsed : (parsed.categories || parsed.state?.categories || [])
      const normalizedCats = rawCats.map((c: any, idx: number) => ({
        id: String(c.id || `OIC-${Date.now()}-${idx}`).trim(),
        name: String(c.name || '').trim(),
        nameBn: String(c.nameBn || c.name || '').trim(),
        amount: Number(c.amount) || 0,
        type: c.type === 'onetime' ? 'onetime' : 'monthly',
        totalMonths: Array.isArray(c.totalMonths) ? c.totalMonths : undefined,
        description: String(c.description || '').trim(),
        descriptionBn: String(c.descriptionBn || c.description || '').trim(),
        isActive: c.isActive !== false,
        createdAt: String(c.createdAt || new Date().toISOString()),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          categories: normalizedCats,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isAssignmentsOnly =
      filePath?.includes('assignment') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].categoryId !== undefined && parsed[0].studentId !== undefined)

    if (isAssignmentsOnly) {
      const rawAssignments = Array.isArray(parsed) ? parsed : (parsed.assignments || parsed.state?.assignments || [])
      const normalizedAssignments = rawAssignments.map((a: any, idx: number) => ({
        id: String(a.id || `OIA-${Date.now()}-${idx}`).trim(),
        categoryId: String(a.categoryId || '').trim(),
        studentId: String(a.studentId || '').trim(),
        months: Array.isArray(a.months) ? a.months : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        academicYear: String(a.academicYear || '2025-26'),
        assignedDate: String(a.assignedDate || new Date().toISOString().split('T')[0]),
        isActive: a.isActive !== false,
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          assignments: normalizedAssignments,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const categories = Array.isArray(inner.categories) ? inner.categories : (existingState.categories || [])
    const assignments = Array.isArray(inner.assignments) ? inner.assignments : (existingState.assignments || [])

    const finalState = {
      ...existingState,
      ...inner,
      categories,
      assignments,
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('expenses')) {
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

    const isCategoriesOnly =
      filePath?.includes('categories') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name !== undefined && parsed[0].isSystem !== undefined)

    if (isCategoriesOnly) {
      const rawCats = Array.isArray(parsed) ? parsed : (parsed.categories || parsed.state?.categories || [])
      const normalizedCats = rawCats.map((c: any, idx: number) => ({
        id: String(c.id || `EXP-CAT-${Date.now()}-${idx}`).trim(),
        name: String(c.name || '').trim(),
        nameBn: String(c.nameBn || c.name || '').trim(),
        icon: String(c.icon || 'tag').trim(),
        isSystem: Boolean(c.isSystem),
        isActive: c.isActive !== false,
        createdAt: String(c.createdAt || new Date().toISOString().split('T')[0]),
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          categories: normalizedCats,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isExpensesOnly =
      filePath?.includes('entries') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].categoryId !== undefined && parsed[0].amount !== undefined)

    if (isExpensesOnly) {
      const rawExpenses = Array.isArray(parsed) ? parsed : (parsed.expenses || parsed.state?.expenses || [])
      const normalizedExpenses = rawExpenses.map((e: any, idx: number) => ({
        id: String(e.id || `EXP-${Date.now()}-${idx}`).trim(),
        categoryId: String(e.categoryId || '').trim(),
        amount: Number(e.amount) || 0,
        date: String(e.date || new Date().toISOString().split('T')[0]),
        description: String(e.description || '').trim(),
        descriptionBn: String(e.descriptionBn || e.description || '').trim(),
        paymentMethod: ['cash', 'bank', 'mobile'].includes(e.paymentMethod) ? e.paymentMethod : 'cash',
        isRecurring: Boolean(e.isRecurring),
        recurringMonths: Array.isArray(e.recurringMonths) ? e.recurringMonths : [],
        academicYear: String(e.academicYear || '2025-26'),
        createdBy: String(e.createdBy || ''),
        createdAt: String(e.createdAt || new Date().toISOString().split('T')[0]),
        isActive: e.isActive !== false,
      }))
      return JSON.stringify({
        state: {
          ...existingState,
          expenses: normalizedExpenses,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const categories = Array.isArray(inner.categories) ? inner.categories : (existingState.categories || [])
    const expenses = Array.isArray(inner.expenses) ? inner.expenses : (existingState.expenses || [])

    const finalState = {
      ...existingState,
      ...inner,
      categories,
      expenses,
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('hr')) {
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

    const isFacilitiesOnly =
      (filePath?.includes('facilities') && !filePath?.includes('teacher_facilities')) ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].defaultAmount !== undefined)
    if (isFacilitiesOnly) {
      const rawFacilities = Array.isArray(parsed) ? parsed : (parsed.facilities || parsed.state?.facilities || [])
      return JSON.stringify({
        state: {
          ...existingState,
          facilities: rawFacilities,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isIncrementsOnly =
      filePath?.includes('increments') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].percentage !== undefined)
    if (isIncrementsOnly) {
      const rawIncrements = Array.isArray(parsed) ? parsed : (parsed.increments || parsed.state?.increments || [])
      return JSON.stringify({
        state: {
          ...existingState,
          increments: rawIncrements,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isBonusesOnly =
      filePath?.includes('bonuses') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].month !== undefined && parsed[0].amount !== undefined && !parsed[0].bonus)
    if (isBonusesOnly) {
      const rawBonuses = Array.isArray(parsed) ? parsed : (parsed.bonuses || parsed.state?.bonuses || [])
      return JSON.stringify({
        state: {
          ...existingState,
          bonuses: rawBonuses,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isPromotionsOnly =
      filePath?.includes('promotions') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].toDesignation !== undefined)
    if (isPromotionsOnly) {
      const rawPromotions = Array.isArray(parsed) ? parsed : (parsed.promotions || parsed.state?.promotions || [])
      return JSON.stringify({
        state: {
          ...existingState,
          promotions: rawPromotions,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isFundsOnly =
      filePath?.includes('funds') ||
      (Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed[0].description !== undefined &&
        (parsed[0].type === 'contribution' ||
          parsed[0].type === 'withdrawal' ||
          parsed[0].type === 'bonus_pool' ||
          parsed[0].type === 'increment_pool'))
    if (isFundsOnly) {
      const rawFunds = Array.isArray(parsed) ? parsed : (parsed.funds || parsed.state?.funds || [])
      return JSON.stringify({
        state: {
          ...existingState,
          funds: rawFunds,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isTeacherFacilitiesOnly =
      filePath?.includes('teacher_facilities') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].facilityId !== undefined && parsed[0].teacherId !== undefined)
    if (isTeacherFacilitiesOnly) {
      const rawTeacherFacilities = Array.isArray(parsed) ? parsed : (parsed.teacherFacilities || parsed.state?.teacherFacilities || [])
      return JSON.stringify({
        state: {
          ...existingState,
          teacherFacilities: rawTeacherFacilities,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isSalaryConfigsOnly =
      filePath?.includes('salary_configs') ||
      filePath?.includes('monthly_salary_configs') ||
      filePath?.includes('payroll') ||
      (Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed[0].month !== undefined &&
        parsed[0].teacherId !== undefined &&
        (parsed[0].bonus !== undefined || parsed[0].festivalBonus !== undefined || parsed[0].applyDeductionRule !== undefined))
    if (isSalaryConfigsOnly) {
      const rawConfigs = Array.isArray(parsed) ? parsed : (parsed.monthlySalaryConfigs || parsed.state?.monthlySalaryConfigs || [])
      return JSON.stringify({
        state: {
          ...existingState,
          monthlySalaryConfigs: rawConfigs,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isRecommendationsOnly =
      filePath?.includes('recommendations') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].status !== undefined && parsed[0].score !== undefined)
    if (isRecommendationsOnly) {
      const rawRecs = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.state?.recommendations || [])
      return JSON.stringify({
        state: {
          ...existingState,
          recommendations: rawRecs,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const finalState = {
      ...existingState,
      ...inner,
      increments: Array.isArray(inner.increments) ? inner.increments : (existingState.increments || []),
      bonuses: Array.isArray(inner.bonuses) ? inner.bonuses : (existingState.bonuses || []),
      promotions: Array.isArray(inner.promotions) ? inner.promotions : (existingState.promotions || []),
      funds: Array.isArray(inner.funds) ? inner.funds : (existingState.funds || []),
      homeworkRecords: Array.isArray(inner.homeworkRecords) ? inner.homeworkRecords : (existingState.homeworkRecords || []),
      dailyReports: Array.isArray(inner.dailyReports) ? inner.dailyReports : (existingState.dailyReports || []),
      recommendations: Array.isArray(inner.recommendations) ? inner.recommendations : (existingState.recommendations || []),
      monthlySalaryConfigs: Array.isArray(inner.monthlySalaryConfigs) ? inner.monthlySalaryConfigs : (existingState.monthlySalaryConfigs || []),
      facilities: Array.isArray(inner.facilities) ? inner.facilities : (existingState.facilities || []),
      teacherFacilities: Array.isArray(inner.teacherFacilities) ? inner.teacherFacilities : (existingState.teacherFacilities || []),
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('exams')) {
    const existing = (() => {
      try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    })()
    const existingState = existing.state || {}
    const existingVersion = existing.version || 8

    const isConfigsOnly =
      filePath?.includes('exam_configs') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type !== undefined && parsed[0].session !== undefined)
    if (isConfigsOnly) {
      const rawConfigs = Array.isArray(parsed) ? parsed : (parsed.examConfigs || parsed.state?.examConfigs || [])
      return JSON.stringify({
        state: {
          ...existingState,
          examConfigs: rawConfigs,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isSubjectConfigsOnly =
      filePath?.includes('subject_mark_configs') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].subExams !== undefined && parsed[0].passMarks !== undefined)
    if (isSubjectConfigsOnly) {
      const rawSubConfigs = Array.isArray(parsed) ? parsed : (parsed.subjectMarkConfigs || parsed.state?.subjectMarkConfigs || [])
      return JSON.stringify({
        state: {
          ...existingState,
          subjectMarkConfigs: rawSubConfigs,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isMarksOnly =
      filePath?.includes('student_marks') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].subExamMarks !== undefined)
    if (isMarksOnly) {
      const rawMarks = Array.isArray(parsed) ? parsed : (parsed.studentMarks || parsed.state?.studentMarks || [])
      return JSON.stringify({
        state: {
          ...existingState,
          studentMarks: rawMarks,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isRoutinesOnly =
      filePath?.includes('exam_routines') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].startTime !== undefined && parsed[0].roomNo !== undefined)
    if (isRoutinesOnly) {
      const rawRoutines = Array.isArray(parsed) ? parsed : (parsed.routines || parsed.state?.routines || [])
      return JSON.stringify({
        state: {
          ...existingState,
          routines: rawRoutines,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isRoomsOnly =
      filePath?.includes('exam_rooms') || filePath?.includes('rooms.json') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].roomNo !== undefined && parsed[0].capacity !== undefined)
    if (isRoomsOnly) {
      const rawRooms = Array.isArray(parsed) ? parsed : (parsed.rooms || parsed.state?.rooms || [])
      return JSON.stringify({
        state: {
          ...existingState,
          rooms: rawRooms,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isSeatPlansOnly =
      filePath?.includes('exam_seat_plans') || filePath?.includes('seat_plans') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].seatNo !== undefined && parsed[0].roomId !== undefined)
    if (isSeatPlansOnly) {
      const rawSeatPlans = Array.isArray(parsed) ? parsed : (parsed.seatPlans || parsed.state?.seatPlans || [])
      return JSON.stringify({
        state: {
          ...existingState,
          seatPlans: rawSeatPlans,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isGradeScalesOnly =
      filePath?.includes('grade_scales') ||
      (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0].grades))
    if (isGradeScalesOnly) {
      const rawScales = Array.isArray(parsed) ? parsed : (parsed.gradeScales || parsed.state?.gradeScales || [])
      return JSON.stringify({
        state: {
          ...existingState,
          gradeScales: rawScales,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isMarksheetsOnly =
      filePath?.includes('marksheet_configs') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].headSubjectId !== undefined)
    if (isMarksheetsOnly) {
      const rawConfigs = Array.isArray(parsed) ? parsed : (parsed.marksheetConfigs || parsed.state?.marksheetConfigs || [])
      return JSON.stringify({
        state: {
          ...existingState,
          marksheetConfigs: rawConfigs,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isPromotionsOnly =
      filePath?.includes('student_promotions') || filePath?.includes('promotions') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].fromClass !== undefined && parsed[0].toClass !== undefined)
    if (isPromotionsOnly) {
      const rawPromotions = Array.isArray(parsed) ? parsed : (parsed.promotions || parsed.state?.promotions || [])
      return JSON.stringify({
        state: {
          ...existingState,
          promotions: rawPromotions,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isCumulativeSheetsOnly =
      filePath?.includes('cumulative_sheets') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].examIds !== undefined)
    if (isCumulativeSheetsOnly) {
      const rawSheets = Array.isArray(parsed) ? parsed : (parsed.cumulativeSheets || parsed.state?.cumulativeSheets || [])
      return JSON.stringify({
        state: {
          ...existingState,
          cumulativeSheets: rawSheets,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const isMarkAdjustmentsOnly =
      filePath?.includes('mark_adjustments') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].adjustmentMarks !== undefined)
    if (isMarkAdjustmentsOnly) {
      const rawAdjustments = Array.isArray(parsed) ? parsed : (parsed.markAdjustments || parsed.state?.markAdjustments || [])
      return JSON.stringify({
        state: {
          ...existingState,
          markAdjustments: rawAdjustments,
          serverSynced: true,
          syncing: false,
        },
        version: existingVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const finalState = {
      ...existingState,
      ...inner,
      examConfigs: Array.isArray(inner.examConfigs) ? inner.examConfigs : (existingState.examConfigs || []),
      subjectMarkConfigs: Array.isArray(inner.subjectMarkConfigs) ? inner.subjectMarkConfigs : (existingState.subjectMarkConfigs || []),
      studentMarks: Array.isArray(inner.studentMarks) ? inner.studentMarks : (existingState.studentMarks || []),
      routines: Array.isArray(inner.routines) ? inner.routines : (existingState.routines || []),
      rooms: Array.isArray(inner.rooms) ? inner.rooms : (existingState.rooms || []),
      seatPlans: Array.isArray(inner.seatPlans) ? inner.seatPlans : (existingState.seatPlans || []),
      invigilators: Array.isArray(inner.invigilators) ? inner.invigilators : (existingState.invigilators || []),
      attendances: Array.isArray(inner.attendances) ? inner.attendances : (existingState.attendances || []),
      omrConfigs: Array.isArray(inner.omrConfigs) ? inner.omrConfigs : (existingState.omrConfigs || []),
      extraMarks: Array.isArray(inner.extraMarks) ? inner.extraMarks : (existingState.extraMarks || []),
      extraMarkTypes: Array.isArray(inner.extraMarkTypes) ? inner.extraMarkTypes : (existingState.extraMarkTypes || []),
      marksheetConfigs: Array.isArray(inner.marksheetConfigs) ? inner.marksheetConfigs : (existingState.marksheetConfigs || []),
      generalAbilities: Array.isArray(inner.generalAbilities) ? inner.generalAbilities : (existingState.generalAbilities || []),
      gradeScales: Array.isArray(inner.gradeScales) ? inner.gradeScales : (existingState.gradeScales || []),
      workingDays: Array.isArray(inner.workingDays) ? inner.workingDays : (existingState.workingDays || []),
      promotions: Array.isArray(inner.promotions) ? inner.promotions : (existingState.promotions || []),
      cumulativeSheets: Array.isArray(inner.cumulativeSheets) ? inner.cumulativeSheets : (existingState.cumulativeSheets || []),
      marksEntryStatuses: Array.isArray(inner.marksEntryStatuses) ? inner.marksEntryStatuses : (existingState.marksEntryStatuses || []),
      omrTemplates: Array.isArray(inner.omrTemplates) ? inner.omrTemplates : (existingState.omrTemplates || []),
      markAdjustments: Array.isArray(inner.markAdjustments) ? inner.markAdjustments : (existingState.markAdjustments || []),
      serverSynced: true,
      syncing: false,
    }
    return JSON.stringify({ state: finalState, version: existingVersion })
  }

  if (key.includes('syllabus')) {
    let rawSyllabi: any[] = []
    if (Array.isArray(parsed)) {
      rawSyllabi = parsed
    } else if (parsed && typeof parsed === 'object') {
      const inner = parsed.state || parsed
      if (Array.isArray(inner.syllabi)) {
        rawSyllabi = inner.syllabi
      } else if (Array.isArray(inner)) {
        rawSyllabi = inner
      }
    }

    const finalState = {
      ...existingState,
      syllabi: rawSyllabi.length > 0 ? rawSyllabi : (existingState.syllabi || []),
      serverSynced: true,
    }
    return JSON.stringify({ state: finalState, version: existingVersion || 1 })
  }

  if (key.includes('assignments')) {
    const exState = Object.keys(existingState).length > 0 ? existingState : (() => {
      try {
        const raw = localStorage.getItem(key)
        const p = raw ? JSON.parse(raw) : {}
        return p?.state || p || {}
      } catch {
        return {}
      }
    })()
    const exVersion = existingVersion || 1

    const isSubmissionsOnly =
      filePath?.includes('submission') ||
      (Array.isArray(parsed) && parsed.length > 0 && parsed[0].assignmentId !== undefined && parsed[0].studentId !== undefined)

    if (isSubmissionsOnly) {
      const rawSubs = Array.isArray(parsed) ? parsed : (parsed.submissions || parsed.state?.submissions || [])
      const normalizedSubs = rawSubs.map((s: any, idx: number) => ({
        id: String(s.id || `SUB-${Date.now()}-${idx}`).trim(),
        createdAt: String(s.createdAt || new Date().toISOString().split('T')[0]),
        updatedAt: String(s.updatedAt || new Date().toISOString().split('T')[0]),
        assignmentId: String(s.assignmentId || '').trim(),
        studentId: String(s.studentId || '').trim(),
        studentName: String(s.studentName || '').trim(),
        studentNameBn: String(s.studentNameBn || s.studentName || '').trim(),
        submittedAt: String(s.submittedAt || new Date().toISOString().split('T')[0]),
        fileUrl: String(s.fileUrl || ''),
        marks: s.marks !== null && s.marks !== undefined && s.marks !== '' ? Number(s.marks) : null,
        feedback: String(s.feedback || ''),
        feedbackBn: String(s.feedbackBn || s.feedback || ''),
        status: ['submitted', 'reviewed', 'returned', 'late'].includes(s.status) ? s.status : 'submitted',
      }))
      return JSON.stringify({
        state: {
          ...exState,
          assignments: Array.isArray(exState.assignments) ? exState.assignments : [],
          submissions: normalizedSubs,
          serverSynced: true,
          syncing: false,
          syncError: null,
        },
        version: exVersion,
      })
    }

    const isAssignmentsOnly =
      (filePath?.includes('assignment') && !filePath?.includes('submission')) ||
      (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].dueDate !== undefined || parsed[0].maxMarks !== undefined))

    if (isAssignmentsOnly) {
      const rawAssignments = Array.isArray(parsed) ? parsed : (parsed.assignments || parsed.state?.assignments || [])
      const normalizedAssignments = rawAssignments.map((a: any, idx: number) => ({
        id: String(a.id || `ASN-${Date.now()}-${idx}`).trim(),
        createdAt: String(a.createdAt || new Date().toISOString().split('T')[0]),
        updatedAt: String(a.updatedAt || new Date().toISOString().split('T')[0]),
        type: a.type === 'homework' ? 'homework' : 'assignment',
        title: String(a.title || '').trim(),
        titleBn: String(a.titleBn || a.title || '').trim(),
        description: String(a.description || ''),
        descriptionBn: String(a.descriptionBn || a.description || ''),
        subjectId: String(a.subjectId || '').trim(),
        classId: String(a.classId || '').trim(),
        sectionId: String(a.sectionId || '').trim(),
        teacherId: String(a.teacherId || '').trim(),
        dueDate: String(a.dueDate || ''),
        maxMarks: Number(a.maxMarks) || 0,
        status: ['active', 'draft', 'closed', 'archived'].includes(a.status) ? a.status : 'active',
        attachments: Array.isArray(a.attachments) ? a.attachments : [],
      }))
      return JSON.stringify({
        state: {
          ...exState,
          assignments: normalizedAssignments,
          submissions: Array.isArray(exState.submissions) ? exState.submissions : [],
          serverSynced: true,
          syncing: false,
          syncError: null,
        },
        version: exVersion,
      })
    }

    const inner = parsed.state || (typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
    const assignments = Array.isArray(inner.assignments) ? inner.assignments : (exState.assignments || [])
    const submissions = Array.isArray(inner.submissions) ? inner.submissions : (exState.submissions || [])

    const finalState = {
      ...exState,
      ...inner,
      assignments,
      submissions,
      serverSynced: true,
      syncing: false,
      syncError: null,
    }
    return JSON.stringify({ state: finalState, version: exVersion })
  }

  if (key.includes('online')) {
    let rawClasses: any[] = []
    if (Array.isArray(parsed)) {
      rawClasses = parsed
    } else if (parsed && typeof parsed === 'object') {
      const inner = parsed.state || parsed
      if (Array.isArray(inner.classes)) {
        rawClasses = inner.classes
      } else if (Array.isArray(inner)) {
        rawClasses = inner
      } else if (inner.title && (inner.url || inner.platform)) {
        rawClasses = [inner]
      }
    }

    const now = new Date().toISOString()
    const normalizedClasses = rawClasses.map((c: any, idx: number) => ({
      id: String(c.id || `OC-${Date.now()}-${idx}`),
      title: String(c.title || ''),
      titleBn: String(c.titleBn || ''),
      description: String(c.description || ''),
      descriptionBn: String(c.descriptionBn || ''),
      classId: String(c.classId || ''),
      sectionId: String(c.sectionId || ''),
      subjectId: String(c.subjectId || ''),
      teacherId: String(c.teacherId || ''),
      url: String(c.url || ''),
      platform: c.platform || 'other',
      thumbnailUrl: c.thumbnailUrl || '',
      scheduledAt: String(c.scheduledAt || ''),
      status: c.status || 'scheduled',
      createdBy: String(c.createdBy || ''),
      createdAt: c.createdAt || now,
      updatedAt: c.updatedAt || now,
    }))

    const finalState = {
      ...existingState,
      classes: normalizedClasses.length > 0 ? normalizedClasses : (existingState.classes || []),
      serverSynced: true,
    }
    return JSON.stringify({ state: finalState, version: existingVersion || 1 })
  }

  if (key.includes('attendance')) {
    const inner = (parsed && typeof parsed === 'object' && parsed.state) ? parsed.state : parsed
    const finalAttendance = (inner && typeof inner.attendance === 'object') ? inner.attendance : (inner && typeof inner === 'object' && !('devices' in inner) ? inner : (existingState.attendance || {}))
    const finalDevices = Array.isArray(inner?.devices) ? inner.devices : (existingState.devices || [])
    const finalRfid = Array.isArray(inner?.rfidEntries) ? inner.rfidEntries : (existingState.rfidEntries || [])
    const finalFp = Array.isArray(inner?.fpEntries) ? inner.fpEntries : (existingState.fpEntries || [])
    const finalFace = Array.isArray(inner?.faceEntries) ? inner.faceEntries : (existingState.faceEntries || [])
    const finalMobile = Array.isArray(inner?.mobileDevices) ? inner.mobileDevices : (existingState.mobileDevices || [])
    const finalLogs = Array.isArray(inner?.deviceLogs) ? inner.deviceLogs : (existingState.deviceLogs || [])

    const finalState = {
      ...existingState,
      attendance: finalAttendance,
      devices: finalDevices,
      rfidEntries: finalRfid,
      fpEntries: finalFp,
      faceEntries: finalFace,
      mobileDevices: finalMobile,
      deviceLogs: finalLogs,
      serverSynced: true,
      syncing: false,
      syncError: null,
    }
    return JSON.stringify({ state: finalState, version: existingVersion || 1 })
  }

  if (key.includes('notifications')) {
    const inner = (parsed && typeof parsed === 'object' && parsed.state) ? parsed.state : parsed
    const rawNotifications = Array.isArray(inner)
      ? inner
      : (Array.isArray(inner?.notifications) ? inner.notifications : [])

    const normalized = rawNotifications.map((n: any, idx: number) => ({
      id: String(n.id || `NTF-${Date.now()}-${idx}`).trim(),
      title: String(n.title || '').trim(),
      titleBn: String(n.titleBn || n.title || '').trim(),
      message: String(n.message || '').trim(),
      messageBn: String(n.messageBn || n.message || '').trim(),
      type: ['info', 'warning', 'success', 'error'].includes(n.type) ? n.type : 'info',
      read: Boolean(n.read),
      link: n.link ? String(n.link) : undefined,
      createdAt: String(n.createdAt || new Date().toISOString()),
    }))

    const finalState = {
      ...existingState,
      notifications: normalized,
      serverSynced: true,
      syncing: false,
      syncError: null,
    }
    return JSON.stringify({ state: finalState, version: existingVersion || 2 })
  }

  if (key.includes('user-accounts') || key.includes('accounts')) {
    const inner = (parsed && typeof parsed === 'object' && parsed.state) ? parsed.state : parsed
    const rawAccounts = Array.isArray(inner)
      ? inner
      : (Array.isArray(inner?.accounts) ? inner.accounts : [])

    const normalized = rawAccounts.map((a: any, idx: number) => ({
      id: String(a.id || `acc-${Date.now()}-${idx}`).trim(),
      schoolId: String(a.schoolId || '').trim(),
      schoolName: String(a.schoolName || '').trim(),
      role: (a.role === 'teacher' ? 'teacher' : a.role === 'parent' ? 'parent' : 'student') as 'student' | 'parent' | 'teacher',
      studentId: String(a.studentId || '').trim(),
      staffId: a.staffId ? String(a.staffId).trim() : undefined,
      studentNameEn: String(a.studentNameEn || a.nameEn || '').trim(),
      studentNameBn: String(a.studentNameBn || a.nameBn || '').trim(),
      guardianName: a.guardianName ? String(a.guardianName).trim() : undefined,
      guardianRelation: a.guardianRelation ? String(a.guardianRelation).trim() : undefined,
      department: a.department ? String(a.department).trim() : undefined,
      designation: a.designation ? String(a.designation).trim() : undefined,
      class: String(a.class || '').trim(),
      section: String(a.section || '').trim(),
      roll: String(a.roll || '').trim(),
      username: String(a.username || a.studentId || '').trim(),
      password: String(a.password || '123456').trim(),
      phone: String(a.phone || '').trim(),
      email: String(a.email || '').trim(),
      status: (a.status === 'locked' ? 'locked' : a.status === 'pending' ? 'pending' : 'active') as 'active' | 'locked' | 'pending',
      createdAt: String(a.createdAt || new Date().toISOString().split('T')[0]),
      updatedAt: String(a.updatedAt || new Date().toISOString().split('T')[0]),
      lastLogin: a.lastLogin ? String(a.lastLogin) : undefined,
    }))

    const finalState = {
      ...existingState,
      accounts: normalized,
    }
    return JSON.stringify({ state: finalState, version: existingVersion || 1 })
  }

  // Fallback generic handler: ensure state wrapper exists
  if (parsed && typeof parsed === 'object' && 'state' in parsed) {
    return JSON.stringify(parsed)
  }
  return JSON.stringify({ state: parsed, version: existingVersion })
}

