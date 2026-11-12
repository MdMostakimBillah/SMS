import { describe, it, expect } from 'vitest'
import {
  parseVaultKey,
  keyMatchesInstitution,
  keyToVaultPath,
  vaultPathToKey,
  prettifyJson,
  compactJson,
  parseVaultImagePath,
  isVaultImagePath,
  isBackupBundlePath,
  normalizeVaultJsonForStore,
  mimeFromExt,
  uint8ArrayToDataUrl,
  dataUrlToUint8Array,
} from './mapping'

describe('parseVaultKey', () => {
  it('parses an institution key', () => {
    expect(parseVaultKey('edutech-classes_demo-school')).toEqual({
      slug: 'demo-school',
      base: 'classes',
      userId: undefined,
    })
  })

  it('parses a per-user institution key', () => {
    expect(parseVaultKey('edutech-settings_demo-school_user123')).toEqual({
      slug: 'demo-school',
      userId: 'user123',
      base: 'settings',
    })
  })

  it('parses dash-containing base names', () => {
    expect(parseVaultKey('edutech-message-templates_demo')).toEqual({
      slug: 'demo',
      base: 'message-templates',
      userId: undefined,
    })
  })

  it('rejects global keys without a slug suffix', () => {
    expect(parseVaultKey('edutech-settings')).toBeNull()
    expect(parseVaultKey('edutech-classes')).toBeNull()
  })

  it('rejects blocklisted super-admin keys', () => {
    expect(parseVaultKey('edutech_super_admin')).toBeNull()
    expect(parseVaultKey('edutech_superadmin_user')).toBeNull()
  })

  it('rejects non-edutech keys', () => {
    expect(parseVaultKey('some_other_app')).toBeNull()
  })

  it('rejects path-traversal segments', () => {
    expect(parseVaultKey('edutech-classes_..')).toBeNull()
    expect(parseVaultKey('edutech-classes_demo_..')).toBeNull()
  })
})

describe('keyMatchesInstitution', () => {
  it('matches plain institution keys', () => {
    expect(keyMatchesInstitution('edutech-exams_demo', 'demo')).toBe(true)
  })

  it('matches per-user keys when a userId is supplied', () => {
    expect(keyMatchesInstitution('edutech-settings_demo_u1', 'demo', 'u1')).toBe(true)
  })

  it('does not match another institution with a shared suffix', () => {
    // "my-demo" ends with the letters of "demo" but is not the same tenant
    expect(keyMatchesInstitution('edutech-classes_my-demo', 'demo')).toBe(false)
  })

  it('never matches the superadmin key for a tenant named "user"', () => {
    expect(keyMatchesInstitution('edutech_superadmin_user', 'user')).toBe(false)
  })

  it('ignores per-user keys when no userId is given', () => {
    expect(keyMatchesInstitution('edutech-settings_demo_u1', 'demo')).toBe(false)
  })
})

describe('keyToVaultPath / vaultPathToKey round trip', () => {
  it('round-trips an institution key', () => {
    const key = 'edutech-exams_demo-school'
    const path = keyToVaultPath(key)
    expect(path).toBe('demo-school/exams.json')
    expect(vaultPathToKey(path!)).toBe(key)
  })

  it('round-trips a per-user key', () => {
    const key = 'edutech-settings_demo_user42'
    const path = keyToVaultPath(key)
    expect(path).toBe('demo/users/user42/settings.json')
    expect(vaultPathToKey(path!)).toBe(key)
  })

  it('returns null for global keys', () => {
    expect(keyToVaultPath('edutech_super_admin')).toBeNull()
  })

  it('rejects paths outside the expected slug', () => {
    expect(vaultPathToKey('other/exams.json', { slug: 'demo' })).toBeNull()
    expect(vaultPathToKey('demo/users/other-user/settings.json', { slug: 'demo', userId: 'me' })).toBeNull()
  })

  it('accepts only the current user\'s per-user files when scoped', () => {
    expect(vaultPathToKey('demo/users/me/settings.json', { slug: 'demo', userId: 'me' })).toBe(
      'edutech-settings_demo_me',
    )
  })

  it('skips user-scoped files entirely when no user is in scope', () => {
    expect(vaultPathToKey('demo/users/someone/settings.json', { slug: 'demo', userId: null })).toBeNull()
  })

  it('rejects malformed paths', () => {
    expect(vaultPathToKey('demo')).toBeNull()
    expect(vaultPathToKey('demo/nested/deep/file.json')).toBeNull()
    expect(vaultPathToKey('demo/..../evil.json')).toBeNull()
  })
})

describe('json helpers', () => {
  it('prettifies compact json', () => {
    expect(prettifyJson('{"a":1}')).toBe('{\n  "a": 1\n}')
  })

  it('compacts pretty json', () => {
    expect(compactJson('{\n  "a": 1\n}')).toBe('{"a":1}')
  })

  it('passes through invalid json unchanged', () => {
    expect(prettifyJson('{broken')).toBe('{broken')
    expect(compactJson('{broken')).toBe('{broken')
  })
})

describe('vault image mapping & conversion', () => {
  it('parses institution logo and banner paths', () => {
    expect(parseVaultImagePath('demo/images/logo.png')).toEqual({ type: 'logo', slug: 'demo', ext: 'png' })
    expect(parseVaultImagePath('demo/images/banner.jpg')).toEqual({ type: 'banner', slug: 'demo', ext: 'jpg' })
    expect(isVaultImagePath('demo/images/logo.png')).toBe(true)
    expect(isVaultImagePath('demo/images/banner.webp')).toBe(true)
  })

  it('parses teacher photo and signature paths', () => {
    expect(parseVaultImagePath('demo/images/teachers/T-1_photo.png')).toEqual({
      type: 'teacher_photo',
      slug: 'demo',
      id: 'T-1',
      ext: 'png',
    })
    expect(parseVaultImagePath('demo/images/teachers/TCH-99_signature.jpeg')).toEqual({
      type: 'teacher_signature',
      slug: 'demo',
      id: 'TCH-99',
      ext: 'jpeg',
    })
  })

  it('parses student photo paths', () => {
    expect(parseVaultImagePath('demo/images/students/S-500_photo.png')).toEqual({
      type: 'student_photo',
      slug: 'demo',
      id: 'S-500',
      ext: 'png',
    })
  })

  it('rejects paths outside scopeSlug or non-image files', () => {
    expect(parseVaultImagePath('other/images/logo.png', 'demo')).toBeNull()
    expect(parseVaultImagePath('demo/classes.json')).toBeNull()
    expect(parseVaultImagePath('demo/images/random.txt')).toBeNull()
    expect(isVaultImagePath('demo/classes.json')).toBe(false)
  })

  it('round-trips data URLs to Uint8Array and back', () => {
    const rawDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const parsed = dataUrlToUint8Array(rawDataUrl)
    expect(parsed).not.toBeNull()
    expect(parsed!.ext).toBe('png')
    expect(parsed!.mime).toBe('image/png')
    expect(parsed!.bytes.byteLength).toBeGreaterThan(0)

    const convertedBack = uint8ArrayToDataUrl(parsed!.bytes, parsed!.mime)
    expect(convertedBack).toBe(rawDataUrl)
  })

  it('correctly maps MIME types from extensions', () => {
    expect(mimeFromExt('png')).toBe('image/png')
    expect(mimeFromExt('jpg')).toBe('image/jpeg')
    expect(mimeFromExt('jpeg')).toBe('image/jpeg')
    expect(mimeFromExt('webp')).toBe('image/webp')
    expect(mimeFromExt('svg')).toBe('image/svg+xml')
    expect(mimeFromExt('gif')).toBe('image/gif')
  })

  it('maps direct image paths without _photo suffix and outside images/ subfolder', () => {
    expect(parseVaultImagePath('demo/images/students/S-101.jpg')).toEqual({
      type: 'student_photo',
      slug: 'demo',
      id: 'S-101',
      ext: 'jpg',
    })
    expect(parseVaultImagePath('demo/students/S-101.png')).toEqual({
      type: 'student_photo',
      slug: 'demo',
      id: 'S-101',
      ext: 'png',
    })
    expect(parseVaultImagePath('demo/images/teachers/ET0001.png')).toEqual({
      type: 'teacher_photo',
      slug: 'demo',
      id: 'ET0001',
      ext: 'png',
    })
    expect(parseVaultImagePath('demo/teachers/ET0001.jpg')).toEqual({
      type: 'teacher_photo',
      slug: 'demo',
      id: 'ET0001',
      ext: 'jpg',
    })
  })
})

describe('vaultPathToKey aliases', () => {
  it('maps students.json to edutech-admissions', () => {
    expect(vaultPathToKey('demo/students.json', { slug: 'demo' })).toBe('edutech-admissions_demo')
    expect(vaultPathToKey('students.json', { slug: 'demo' })).toBe('edutech-admissions_demo')
  })

  it('maps routines.json, sections.json, and institution.json to edutech-classes', () => {
    expect(vaultPathToKey('demo/routines.json', { slug: 'demo' })).toBe('edutech-classes_demo')
    expect(vaultPathToKey('routines.json', { slug: 'demo' })).toBe('edutech-classes_demo')
    expect(vaultPathToKey('demo/sections.json', { slug: 'demo' })).toBe('edutech-classes_demo')
    expect(vaultPathToKey('sections.json', { slug: 'demo' })).toBe('edutech-classes_demo')
    expect(vaultPathToKey('demo/institution.json', { slug: 'demo' })).toBe('edutech-classes_demo')
    expect(vaultPathToKey('institution.json', { slug: 'demo' })).toBe('edutech-classes_demo')
  })

  it('maps staff.json, departments.json, subjects.json, and designations.json to edutech-teachers', () => {
    expect(vaultPathToKey('demo/staff.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
    expect(vaultPathToKey('staff.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
    expect(vaultPathToKey('demo/departments.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
    expect(vaultPathToKey('departments.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
    expect(vaultPathToKey('demo/subjects.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
    expect(vaultPathToKey('subjects.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
    expect(vaultPathToKey('demo/designations.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
    expect(vaultPathToKey('designations.json', { slug: 'demo' })).toBe('edutech-teachers_demo')
  })
})

describe('isBackupBundlePath', () => {
  it('identifies backup.json and {slug}/backup.json', () => {
    expect(isBackupBundlePath('backup.json')).toBe(true)
    expect(isBackupBundlePath('demo/backup.json')).toBe(true)
    expect(isBackupBundlePath('demo/classes.json')).toBe(false)
  })
})

describe('normalizeVaultJsonForStore', () => {
  it('normalizes a pure array of students into Zustand persist format', () => {
    const raw = JSON.stringify([
      { id: 'ET-2026-00001', nameEn: 'Rahim Khan', roll: '01', class: 'Six' },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-admissions_demo', raw)
    const parsed = JSON.parse(normalized)
    expect(parsed.state).toBeDefined()
    expect(parsed.state.students).toHaveLength(1)
    expect(parsed.state.students[0].nameEn).toBe('Rahim Khan')
    expect(parsed.state.students[0].status).toBe('approved')
    expect(parsed.state.students[0].active).toBe(true)
  })

  it('normalizes an object with students array', () => {
    const raw = JSON.stringify({
      students: [{ id: 'ET-2026-00002', nameEn: 'Karim', nameBn: 'করিম' }],
    })
    const normalized = normalizeVaultJsonForStore('edutech-admissions_demo', raw)
    const parsed = JSON.parse(normalized)
    expect(parsed.state.students[0].nameEn).toBe('Karim')
    expect(parsed.state.students[0].nameBn).toBe('করিম')
  })

  it('normalizes an array of teachers into Zustand format', () => {
    const raw = JSON.stringify([
      { id: 'ET0001', nameEn: 'Teacher A', phone: '01700000000' },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-teachers_demo', raw)
    const parsed = JSON.parse(normalized)
    expect(parsed.state.teachers).toHaveLength(1)
    expect(parsed.state.teachers[0].id).toBe('ET0001')
    expect(parsed.state.teachers[0].status).toBe('active')
  })

  it('normalizes an array of classes into Zustand format', () => {
    const raw = JSON.stringify([
      { id: 'CLS-01', name: 'Play', nameBn: 'প্লে' },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-classes_demo', raw)
    const parsed = JSON.parse(normalized)
    expect(parsed.state.classes).toHaveLength(1)
    expect(parsed.state.classes[0].name).toBe('Play')
  })

  it('unpacks from a full backup bundle format', () => {
    const raw = JSON.stringify({
      metadata: { slug: 'demo' },
      stores: {
        'edutech-admissions': {
          state: {
            students: [{ id: 'ET-2026-00003', nameEn: 'Bundle Student' }],
          },
        },
      },
    })
    const normalized = normalizeVaultJsonForStore('edutech-admissions_demo', raw)
    const parsed = JSON.parse(normalized)
    expect(parsed.state.students[0].nameEn).toBe('Bundle Student')
  })

  it('normalizes departments.json into teacher store without wiping teachers', () => {
    const existing = JSON.stringify({
      state: {
        teachers: [{ id: 'ET0001', nameEn: 'Existing Teacher' }],
        departments: [],
        subjects: [],
        designations: [],
      },
      version: 0,
    })
    const deptsRaw = JSON.stringify([
      { id: 'DEP-01', name: 'Science', nameBn: 'বিজ্ঞান' },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-teachers_demo', deptsRaw, existing, 'demo/departments.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.teachers).toHaveLength(1)
    expect(parsed.state.teachers[0].nameEn).toBe('Existing Teacher')
    expect(parsed.state.departments).toHaveLength(1)
    expect(parsed.state.departments[0].name).toBe('Science')
  })

  it('normalizes subjects.json into teacher store without wiping teachers', () => {
    const existing = JSON.stringify({
      state: {
        teachers: [{ id: 'ET0001', nameEn: 'Existing Teacher' }],
        departments: [],
        subjects: [],
      },
      version: 0,
    })
    const subjectsRaw = JSON.stringify([
      { id: 'SUB-01', name: 'Mathematics', code: '101' },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-teachers_demo', subjectsRaw, existing, 'subjects.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.teachers).toHaveLength(1)
    expect(parsed.state.subjects).toHaveLength(1)
    expect(parsed.state.subjects[0].name).toBe('Mathematics')
    expect(parsed.state.subjects[0].code).toBe('101')
  })

  it('normalizes designations.json into teacher store without wiping teachers', () => {
    const existing = JSON.stringify({
      state: {
        teachers: [{ id: 'ET0001', nameEn: 'Existing Teacher' }],
        designations: [],
      },
      version: 0,
    })
    const desRaw = JSON.stringify([
      { id: 'DES-01', title: 'Senior Teacher' },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-teachers_demo', desRaw, existing, 'designations.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.teachers).toHaveLength(1)
    expect(parsed.state.designations).toHaveLength(1)
    expect(parsed.state.designations[0].title).toBe('Senior Teacher')
  })

  it('normalizes routines.json into class store without wiping classes', () => {
    const existing = JSON.stringify({
      state: {
        institution: { currentSession: '2025-26' },
        classes: [{ id: 'CLS-01', name: 'Ten', sections: [] }],
        routines: [],
      },
      version: 7,
    })
    const routinesRaw = JSON.stringify([
      { classId: 'CLS-01', sectionId: 'SEC-A', periodDuration: 45 },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-classes_demo', routinesRaw, existing, 'demo/routines.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.classes).toHaveLength(1)
    expect(parsed.state.classes[0].name).toBe('Ten')
    expect(parsed.state.routines).toHaveLength(1)
    expect(parsed.state.routines[0].periodDuration).toBe(45)
    expect(parsed.state.sessionRoutines['2025-26']).toHaveLength(1)
  })

  it('normalizes sections.json into class store and assigns to matching class', () => {
    const existing = JSON.stringify({
      state: {
        institution: { currentSession: '2025-26' },
        classes: [
          { id: 'CLS-01', name: 'Ten', sections: [] },
          { id: 'CLS-02', name: 'Nine', sections: [] },
        ],
      },
      version: 7,
    })
    const sectionsRaw = JSON.stringify([
      { classId: 'CLS-01', id: 'SEC-CLS-01-A', name: 'Section A', seatQuantity: 50 },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-classes_demo', sectionsRaw, existing, 'sections.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.classes[0].sections).toHaveLength(1)
    expect(parsed.state.classes[0].sections[0].name).toBe('Section A')
    expect(parsed.state.classes[0].sections[0].seatQuantity).toBe(50)
    expect(parsed.state.classes[1].sections).toHaveLength(0)
  })

  it('round-trips assignments.json and normalizes assignments store', () => {
    expect(vaultPathToKey('demo/assignments.json')).toBe('edutech-assignments_demo')
    expect(keyToVaultPath('edutech-assignments_demo')).toBe('demo/assignments.json')

    const assignmentsRaw = JSON.stringify([
      { id: 'ASN-1', title: 'Local PC Assignment', maxMarks: 20 },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-assignments_demo', assignmentsRaw, null, 'demo/assignments.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.assignments).toHaveLength(1)
    expect(parsed.state.assignments[0].title).toBe('Local PC Assignment')
    expect(parsed.state.serverSynced).toBe(true)
  })

  it('normalizes submissions.json without overwriting assignments array', () => {
    expect(vaultPathToKey('demo/submissions.json')).toBe('edutech-assignments_demo')

    const existingStore = JSON.stringify({
      state: {
        assignments: [{ id: 'ASN-1', title: 'Existing ASN', maxMarks: 50 }],
        submissions: [],
      },
    })

    const submissionsRaw = JSON.stringify([
      { id: 'SUB-1', assignmentId: 'ASN-1', studentId: 'STU-1', studentName: 'Rahim', marks: 45 },
    ])

    const normalized = normalizeVaultJsonForStore('edutech-assignments_demo', submissionsRaw, existingStore, 'demo/submissions.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.assignments).toHaveLength(1)
    expect(parsed.state.assignments[0].title).toBe('Existing ASN')
    expect(parsed.state.submissions).toHaveLength(1)
    expect(parsed.state.submissions[0].studentName).toBe('Rahim')
    expect(parsed.state.submissions[0].marks).toBe(45)
    expect(parsed.state.serverSynced).toBe(true)
  })

  it('round-trips online.json and normalizes online store', () => {
    expect(vaultPathToKey('demo/online.json')).toBe('edutech-online_demo')
    expect(keyToVaultPath('edutech-online_demo')).toBe('demo/online.json')

    const onlineRaw = JSON.stringify([
      { id: 'OC-1', title: 'Local PC Online Class', platform: 'youtube', url: 'https://youtube.com/watch?v=abc' },
    ])
    const normalized = normalizeVaultJsonForStore('edutech-online_demo', onlineRaw, null, 'demo/online.json')
    const parsed = JSON.parse(normalized)
    expect(parsed.state.classes).toHaveLength(1)
    expect(parsed.state.classes[0].title).toBe('Local PC Online Class')
    expect(parsed.state.serverSynced).toBe(true)
  })
})

