import { backupApi } from './api'

export interface BackupMetadata {
  app: string
  version: string
  slug: string
  institutionName?: string
  exportedAt: string
  counts: {
    classes: number
    teachers: number
    students: number
    exams: number
    departments: number
    subjects: number
  }
}

export interface BackupBundle {
  metadata: BackupMetadata
  stores: Record<string, any>
}

export interface BackupSummary {
  classes: number
  teachers: number
  students: number
  exams: number
  totalKeys: number
  exportedAt: string
  slug: string
}

const STORE_BASE_KEYS = [
  'edutech-classes',
  'edutech-teachers',
  'edutech-admissions',
  'edutech-exams',
  'edutech-syllabus',
  'edutech-assignments',
  'edutech-fees',
  'edutech-hr',
  'edutech-hostel',
  'edutech-transport',
  'edutech-library',
  'edutech-store',
  'edutech-todos',
  'edutech-expenses',
  'edutech-others-income',
  'edutech-notices',
  'edutech-messages',
  'edutech-message-templates',
  'edutech-staff-permissions',
]

/**
 * Gather all local offline storage data for a specific school or the active school.
 */
export function collectLocalStores(targetSlug?: string): BackupBundle {
  const slug = targetSlug || sessionStorage.getItem('edutech_inst_slug') || 'edutech'
  const stores: Record<string, any> = {}

  let classesCount = 0
  let teachersCount = 0
  let studentsCount = 0
  let examsCount = 0
  let deptsCount = 0
  let subjectsCount = 0

  for (const base of STORE_BASE_KEYS) {
    const keyWithSlug = `${base}_${slug}`
    const raw = localStorage.getItem(keyWithSlug) || localStorage.getItem(base)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        stores[base] = parsed

        // Inspect counts
        const state = parsed.state || parsed
        if (base === 'edutech-classes') {
          if (Array.isArray(state.classes)) classesCount = state.classes.length
          if (Array.isArray(state.departments)) deptsCount = state.departments.length
          if (Array.isArray(state.subjects)) subjectsCount = state.subjects.length
        } else if (base === 'edutech-teachers' && Array.isArray(state.teachers)) {
          teachersCount = state.teachers.length
        } else if (base === 'edutech-admissions' && Array.isArray(state.students)) {
          studentsCount = state.students.length
        } else if (base === 'edutech-exams' && Array.isArray(state.exams)) {
          examsCount = state.exams.length
        }
      } catch {
        // Skip unparseable keys
      }
    }
  }

  const metadata: BackupMetadata = {
    app: 'EduTech SMS',
    version: '2.0.0',
    slug,
    exportedAt: new Date().toISOString(),
    counts: {
      classes: classesCount,
      teachers: teachersCount,
      students: studentsCount,
      exams: examsCount,
      departments: deptsCount,
      subjects: subjectsCount,
    },
  }

  return { metadata, stores }
}

/**
 * Download a local computer backup file (.json) to the client machine.
 */
export function downloadLocalBackup(slug?: string, institutionName?: string): void {
  const bundle = collectLocalStores(slug)
  if (institutionName) {
    bundle.metadata.institutionName = institutionName
  }

  const jsonStr = JSON.stringify(bundle, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `edutech_backup_${bundle.metadata.slug}_${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Validate a user-uploaded backup file.
 */
export function parseAndValidateBackup(jsonString: string): {
  valid: boolean
  error?: string
  summary?: BackupSummary
  bundle?: BackupBundle
} {
  try {
    const parsed = JSON.parse(jsonString)
    const stores = parsed.stores || (parsed.serverData ? { serverData: parsed.serverData } : null)

    if (!stores || typeof stores !== 'object') {
      return { valid: false, error: 'Invalid backup format: missing stores or data root.' }
    }

    const metadata = parsed.metadata || {}
    const counts = metadata.counts || {}

    const summary: BackupSummary = {
      slug: metadata.slug || 'edutech',
      classes: counts.classes ?? (stores['edutech-classes']?.state?.classes?.length || 0),
      teachers: counts.teachers ?? (stores['edutech-teachers']?.state?.teachers?.length || 0),
      students: counts.students ?? (stores['edutech-admissions']?.state?.students?.length || 0),
      exams: counts.exams ?? (stores['edutech-exams']?.state?.exams?.length || 0),
      totalKeys: Object.keys(stores).length,
      exportedAt: metadata.exportedAt || metadata.timestamp || new Date().toISOString(),
    }

    return {
      valid: true,
      summary,
      bundle: {
        metadata: {
          app: metadata.app || 'EduTech SMS',
          version: metadata.version || '2.0.0',
          slug: summary.slug,
          exportedAt: summary.exportedAt,
          counts: {
            classes: summary.classes,
            teachers: summary.teachers,
            students: summary.students,
            exams: summary.exams,
            departments: counts.departments || 0,
            subjects: counts.subjects || 0,
          },
        },
        stores,
      },
    }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON file content.',
    }
  }
}

/**
 * Restore stores into local storage under the active or given slug.
 */
export function restoreLocalStores(bundle: BackupBundle, targetSlug?: string): void {
  const slug = targetSlug || sessionStorage.getItem('edutech_inst_slug') || bundle.metadata.slug || 'edutech'

  for (const [baseKey, storeValue] of Object.entries(bundle.stores)) {
    const keyWithSlug = `${baseKey}_${slug}`
    const serialized = typeof storeValue === 'string' ? storeValue : JSON.stringify(storeValue)
    localStorage.setItem(keyWithSlug, serialized)
  }
}

/**
 * Test Telegram bot connection.
 */
export async function testTelegram(botToken?: string, chatId?: string) {
  return backupApi.testTelegram({ botToken, chatId })
}

/**
 * Trigger sending backup snapshot to Telegram.
 */
export async function sendTelegramBackupNow(opts: {
  botToken?: string
  chatId?: string
  schoolSlug?: string
  schoolName?: string
  schoolId?: string
  includeLocalStores?: boolean
}) {
  const localStores = opts.includeLocalStores !== false ? collectLocalStores(opts.schoolSlug) : undefined

  return backupApi.sendTelegramBackup({
    botToken: opts.botToken,
    chatId: opts.chatId,
    schoolId: opts.schoolId,
    schoolSlug: opts.schoolSlug,
    schoolName: opts.schoolName,
    clientData: localStores,
  })
}
