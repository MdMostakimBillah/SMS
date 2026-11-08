import JSZip from 'jszip'
import type { BackupBundle } from '../backup'
import {
  type VfsDirectoryHandle,
  listAllVaultFiles,
  readBinaryFile,
  readTextFile,
  isImageFileName,
  loadVaultHandle,
  hasPermission,
} from './fsAccess'
import { getActiveVaultHandle } from './vault'

export interface ParsedDataUrl {
  mime: string
  ext: string
  base64: string
}

export function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null
  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx === -1) return null
  const meta = dataUrl.slice(5, commaIdx) // e.g. "image/png;base64"
  const [mime, encoding] = meta.split(';')
  if (encoding !== 'base64') return null

  let ext = 'bin'
  if (mime) {
    const sub = mime.split('/')[1] || ''
    if (sub.includes('png')) ext = 'png'
    else if (sub.includes('jpeg') || sub.includes('jpg')) ext = 'jpg'
    else if (sub.includes('webp')) ext = 'webp'
    else if (sub.includes('svg')) ext = 'svg'
    else if (sub.includes('gif')) ext = 'gif'
  }

  return {
    mime: mime || 'application/octet-stream',
    ext,
    base64: dataUrl.slice(commaIdx + 1),
  }
}

export interface CreateBackupZipOptions {
  vaultHandle?: VfsDirectoryHandle | null
  slug?: string
}

/**
 * Creates a complete multi-file ZIP archive for local computer / Telegram backup:
 * - Direct files from local PC vault folder when connected (classes.json, students.json, teachers.json, etc.)
 * - Individual JSON store files (classes.json, routines.json, students.json, admissions.json, teachers.json, etc.)
 * - Full images/ directory preserving all photos (students/, teachers/, logo, banner)
 * - backup.json (Full manifest bundle for fast restoration and compatibility)
 */
export async function createBackupZip(
  bundle: BackupBundle,
  options?: CreateBackupZipOptions,
): Promise<Blob> {
  const zip = new JSZip()
  const targetSlug = options?.slug || bundle.metadata?.slug

  // 1. If local PC vault directory is connected, read files directly from disk!
  let handle = options?.vaultHandle ?? getActiveVaultHandle()
  if (!handle) {
    try {
      const saved = await loadVaultHandle()
      if (saved && (await hasPermission(saved))) {
        handle = saved
      }
    } catch {
      // Ignore if loadVaultHandle fails in tests / non-browser
    }
  }

  if (handle) {
    try {
      const fileInfos = await listAllVaultFiles(handle)
      for (const info of fileInfos) {
        // If path belongs to another tenant/slug, skip
        if (targetSlug && info.path.includes('/')) {
          const topPart = info.path.split('/')[0]
          if (topPart !== targetSlug && topPart !== 'images') {
            continue
          }
        }

        if (isImageFileName(info.path)) {
          const bytes = await readBinaryFile(handle, info.path)
          if (bytes && bytes.byteLength > 0) {
            zip.file(info.path, bytes)
            // If prefixed with slug/ (e.g. thrma/images/...), also add at root level
            if (targetSlug && info.path.startsWith(`${targetSlug}/`)) {
              zip.file(info.path.slice(targetSlug.length + 1), bytes)
            }
          }
        } else if (info.path.endsWith('.json')) {
          const text = await readTextFile(handle, info.path)
          if (text) {
            zip.file(info.path, text)
            // If prefixed with slug/ (e.g. thrma/classes.json), also add at root level
            if (targetSlug && info.path.startsWith(`${targetSlug}/`)) {
              zip.file(info.path.slice(targetSlug.length + 1), text)
            }
          }
        }
      }
    } catch (err) {
      console.warn('[zipHelper] Failed to read directly from vault handle:', err)
    }
  }

  // 2. Write individual JSON store files (so the ZIP contains separate files, not just one backup.json)
  if (bundle.stores) {
    for (const [storeKey, storeData] of Object.entries(bundle.stores)) {
      if (!storeData) continue

      let rawBase = storeKey
      if (rawBase.startsWith('edutech-')) rawBase = rawBase.slice('edutech-'.length)
      else if (rawBase.startsWith('edutech_')) rawBase = rawBase.slice('edutech_'.length)
      const baseName = rawBase.split('_')[0]

      const jsonString = JSON.stringify(storeData, null, 2)
      if (!zip.file(`${baseName}.json`)) {
        zip.file(`${baseName}.json`, jsonString)
      }
      if (targetSlug && !zip.file(`${targetSlug}/${baseName}.json`)) {
        zip.file(`${targetSlug}/${baseName}.json`, jsonString)
      }

      // admissions store: also provide students.json
      if (baseName === 'admissions') {
        const studentsList = storeData?.state?.students || storeData?.students
        const studentsPayload = Array.isArray(studentsList) ? { students: studentsList } : storeData
        const studentsJson = JSON.stringify(studentsPayload, null, 2)
        if (!zip.file('students.json')) zip.file('students.json', studentsJson)
        if (targetSlug && !zip.file(`${targetSlug}/students.json`)) {
          zip.file(`${targetSlug}/students.json`, studentsJson)
        }
      }

      // classes store: also extract routines.json, departments.json, subjects.json
      if (baseName === 'classes') {
        const routines = storeData?.state?.routines || storeData?.routines
        if (Array.isArray(routines)) {
          const routinesJson = JSON.stringify({ routines }, null, 2)
          if (!zip.file('routines.json')) zip.file('routines.json', routinesJson)
          if (targetSlug && !zip.file(`${targetSlug}/routines.json`)) {
            zip.file(`${targetSlug}/routines.json`, routinesJson)
          }
        }

        const depts = storeData?.state?.departments || storeData?.departments
        if (Array.isArray(depts) && !zip.file('departments.json')) {
          const deptsJson = JSON.stringify({ departments: depts }, null, 2)
          zip.file('departments.json', deptsJson)
          if (targetSlug && !zip.file(`${targetSlug}/departments.json`)) {
            zip.file(`${targetSlug}/departments.json`, deptsJson)
          }
        }

        const subjects = storeData?.state?.subjects || storeData?.subjects
        if (Array.isArray(subjects) && !zip.file('subjects.json')) {
          const subsJson = JSON.stringify({ subjects }, null, 2)
          zip.file('subjects.json', subsJson)
          if (targetSlug && !zip.file(`${targetSlug}/subjects.json`)) {
            zip.file(`${targetSlug}/subjects.json`, subsJson)
          }
        }
      }

      // hr store: extract individual slice files
      if (baseName === 'hr') {
        const state = storeData?.state || storeData
        if (Array.isArray(state?.facilities) && !zip.file('hr_facilities.json')) {
          const fJson = JSON.stringify(state.facilities, null, 2)
          zip.file('hr_facilities.json', fJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_facilities.json`)) {
            zip.file(`${targetSlug}/hr_facilities.json`, fJson)
          }
        }
        if (Array.isArray(state?.increments) && !zip.file('hr_increments.json')) {
          const iJson = JSON.stringify(state.increments, null, 2)
          zip.file('hr_increments.json', iJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_increments.json`)) {
            zip.file(`${targetSlug}/hr_increments.json`, iJson)
          }
        }
        if (Array.isArray(state?.bonuses) && !zip.file('hr_bonuses.json')) {
          const bJson = JSON.stringify(state.bonuses, null, 2)
          zip.file('hr_bonuses.json', bJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_bonuses.json`)) {
            zip.file(`${targetSlug}/hr_bonuses.json`, bJson)
          }
        }
        if (Array.isArray(state?.promotions) && !zip.file('hr_promotions.json')) {
          const pJson = JSON.stringify(state.promotions, null, 2)
          zip.file('hr_promotions.json', pJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_promotions.json`)) {
            zip.file(`${targetSlug}/hr_promotions.json`, pJson)
          }
        }
        if (Array.isArray(state?.funds) && !zip.file('hr_funds.json')) {
          const fndJson = JSON.stringify(state.funds, null, 2)
          zip.file('hr_funds.json', fndJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_funds.json`)) {
            zip.file(`${targetSlug}/hr_funds.json`, fndJson)
          }
        }
      }

      // exams store: extract individual slice files
      if (baseName === 'exams') {
        const state = storeData?.state || storeData
        if (Array.isArray(state?.examConfigs) && !zip.file('exam_configs.json')) {
          const cJson = JSON.stringify(state.examConfigs, null, 2)
          zip.file('exam_configs.json', cJson)
          if (targetSlug && !zip.file(`${targetSlug}/exam_configs.json`)) {
            zip.file(`${targetSlug}/exam_configs.json`, cJson)
          }
        }
        if (Array.isArray(state?.studentMarks) && !zip.file('student_marks.json')) {
          const mJson = JSON.stringify(state.studentMarks, null, 2)
          zip.file('student_marks.json', mJson)
          if (targetSlug && !zip.file(`${targetSlug}/student_marks.json`)) {
            zip.file(`${targetSlug}/student_marks.json`, mJson)
          }
        }
        if (Array.isArray(state?.routines) && !zip.file('exam_routines.json')) {
          const rJson = JSON.stringify(state.routines, null, 2)
          zip.file('exam_routines.json', rJson)
          if (targetSlug && !zip.file(`${targetSlug}/exam_routines.json`)) {
            zip.file(`${targetSlug}/exam_routines.json`, rJson)
          }
        }
        if (Array.isArray(state?.subjectMarkConfigs) && !zip.file('subject_mark_configs.json')) {
          const smcJson = JSON.stringify(state.subjectMarkConfigs, null, 2)
          zip.file('subject_mark_configs.json', smcJson)
          if (targetSlug && !zip.file(`${targetSlug}/subject_mark_configs.json`)) {
            zip.file(`${targetSlug}/subject_mark_configs.json`, smcJson)
          }
        }
      }

      // syllabus store: also extract syllabi.json
      if (baseName === 'syllabus') {
        const state = storeData?.state || storeData
        const syllabi = state?.syllabi || (Array.isArray(state) ? state : [])
        if (Array.isArray(syllabi) && !zip.file('syllabi.json')) {
          const sJson = JSON.stringify(syllabi, null, 2)
          zip.file('syllabi.json', sJson)
          if (targetSlug && !zip.file(`${targetSlug}/syllabi.json`)) {
            zip.file(`${targetSlug}/syllabi.json`, sJson)
          }
        }
      }

      // assignments store: also extract assignments.json
      if (baseName === 'assignments') {
        const state = storeData?.state || storeData
        const assignments = state?.assignments || (Array.isArray(state) ? state : [])
        if (Array.isArray(assignments) && !zip.file('assignments.json')) {
          const aJson = JSON.stringify(assignments, null, 2)
          zip.file('assignments.json', aJson)
          if (targetSlug && !zip.file(`${targetSlug}/assignments.json`)) {
            zip.file(`${targetSlug}/assignments.json`, aJson)
          }
        }
      }

      // teachers store: also extract departments.json, designations.json, subjects.json
      if (baseName === 'teachers') {
        const depts = storeData?.state?.departments || storeData?.departments
        if (Array.isArray(depts) && !zip.file('departments.json')) {
          const deptsJson = JSON.stringify({ departments: depts }, null, 2)
          zip.file('departments.json', deptsJson)
          if (targetSlug && !zip.file(`${targetSlug}/departments.json`)) {
            zip.file(`${targetSlug}/departments.json`, deptsJson)
          }
        }

        const desigs = storeData?.state?.designations || storeData?.designations
        if (Array.isArray(desigs) && !zip.file('designations.json')) {
          const desigsJson = JSON.stringify({ designations: desigs }, null, 2)
          zip.file('designations.json', desigsJson)
          if (targetSlug && !zip.file(`${targetSlug}/designations.json`)) {
            zip.file(`${targetSlug}/designations.json`, desigsJson)
          }
        }

        const subjects = storeData?.state?.subjects || storeData?.subjects
        if (Array.isArray(subjects) && !zip.file('subjects.json')) {
          const subsJson = JSON.stringify({ subjects }, null, 2)
          zip.file('subjects.json', subsJson)
          if (targetSlug && !zip.file(`${targetSlug}/subjects.json`)) {
            zip.file(`${targetSlug}/subjects.json`, subsJson)
          }
        }
      }

      // hr store: extract individual slice files
      if (baseName === 'hr') {
        const state = storeData?.state || storeData
        if (Array.isArray(state?.facilities) && !zip.file('hr_facilities.json')) {
          const fJson = JSON.stringify(state.facilities, null, 2)
          zip.file('hr_facilities.json', fJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_facilities.json`)) {
            zip.file(`${targetSlug}/hr_facilities.json`, fJson)
          }
        }
        if (Array.isArray(state?.increments) && !zip.file('hr_increments.json')) {
          const iJson = JSON.stringify(state.increments, null, 2)
          zip.file('hr_increments.json', iJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_increments.json`)) {
            zip.file(`${targetSlug}/hr_increments.json`, iJson)
          }
        }
        if (Array.isArray(state?.bonuses) && !zip.file('hr_bonuses.json')) {
          const bJson = JSON.stringify(state.bonuses, null, 2)
          zip.file('hr_bonuses.json', bJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_bonuses.json`)) {
            zip.file(`${targetSlug}/hr_bonuses.json`, bJson)
          }
        }
        if (Array.isArray(state?.promotions) && !zip.file('hr_promotions.json')) {
          const pJson = JSON.stringify(state.promotions, null, 2)
          zip.file('hr_promotions.json', pJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_promotions.json`)) {
            zip.file(`${targetSlug}/hr_promotions.json`, pJson)
          }
        }
        if (Array.isArray(state?.funds) && !zip.file('hr_funds.json')) {
          const fndJson = JSON.stringify(state.funds, null, 2)
          zip.file('hr_funds.json', fndJson)
          if (targetSlug && !zip.file(`${targetSlug}/hr_funds.json`)) {
            zip.file(`${targetSlug}/hr_funds.json`, fndJson)
          }
        }
      }

      // exams store: extract individual slice files
      if (baseName === 'exams') {
        const state = storeData?.state || storeData
        if (Array.isArray(state?.examConfigs) && !zip.file('exam_configs.json')) {
          const cJson = JSON.stringify(state.examConfigs, null, 2)
          zip.file('exam_configs.json', cJson)
          if (targetSlug && !zip.file(`${targetSlug}/exam_configs.json`)) {
            zip.file(`${targetSlug}/exam_configs.json`, cJson)
          }
        }
        if (Array.isArray(state?.studentMarks) && !zip.file('student_marks.json')) {
          const mJson = JSON.stringify(state.studentMarks, null, 2)
          zip.file('student_marks.json', mJson)
          if (targetSlug && !zip.file(`${targetSlug}/student_marks.json`)) {
            zip.file(`${targetSlug}/student_marks.json`, mJson)
          }
        }
        if (Array.isArray(state?.routines) && !zip.file('exam_routines.json')) {
          const rJson = JSON.stringify(state.routines, null, 2)
          zip.file('exam_routines.json', rJson)
          if (targetSlug && !zip.file(`${targetSlug}/exam_routines.json`)) {
            zip.file(`${targetSlug}/exam_routines.json`, rJson)
          }
        }
        if (Array.isArray(state?.subjectMarkConfigs) && !zip.file('subject_mark_configs.json')) {
          const smcJson = JSON.stringify(state.subjectMarkConfigs, null, 2)
          zip.file('subject_mark_configs.json', smcJson)
          if (targetSlug && !zip.file(`${targetSlug}/subject_mark_configs.json`)) {
            zip.file(`${targetSlug}/subject_mark_configs.json`, smcJson)
          }
        }
      }

      // syllabus store: also extract syllabi.json
      if (baseName === 'syllabus') {
        const state = storeData?.state || storeData
        const syllabi = state?.syllabi || (Array.isArray(state) ? state : [])
        if (Array.isArray(syllabi) && !zip.file('syllabi.json')) {
          const sJson = JSON.stringify(syllabi, null, 2)
          zip.file('syllabi.json', sJson)
          if (targetSlug && !zip.file(`${targetSlug}/syllabi.json`)) {
            zip.file(`${targetSlug}/syllabi.json`, sJson)
          }
        }
      }

      // assignments store: also extract assignments.json
      if (baseName === 'assignments') {
        const state = storeData?.state || storeData
        const assignments = state?.assignments || (Array.isArray(state) ? state : [])
        if (Array.isArray(assignments) && !zip.file('assignments.json')) {
          const aJson = JSON.stringify(assignments, null, 2)
          zip.file('assignments.json', aJson)
          if (targetSlug && !zip.file(`${targetSlug}/assignments.json`)) {
            zip.file(`${targetSlug}/assignments.json`, aJson)
          }
        }
      }
    }
  }

  // 3. Extract all local images into /images folder in the zip
  const imagesFolder = zip.folder('images')

  // Institution logo & banner from edutech-classes
  const classStore = bundle.stores?.['edutech-classes']
  const inst = classStore?.state?.institution || classStore?.institution
  if (inst && imagesFolder) {
    if (typeof inst.logo === 'string') {
      const parsed = parseDataUrl(inst.logo)
      if (parsed) imagesFolder.file(`logo.${parsed.ext}`, parsed.base64, { base64: true })
    }
    if (typeof inst.banner === 'string') {
      const parsed = parseDataUrl(inst.banner)
      if (parsed) imagesFolder.file(`banner.${parsed.ext}`, parsed.base64, { base64: true })
    }
  }

  // Teachers photos & signatures
  const teacherStore = bundle.stores?.['edutech-teachers']
  const teachers = teacherStore?.state?.teachers || teacherStore?.teachers
  if (Array.isArray(teachers) && imagesFolder) {
    const tchFolder = imagesFolder.folder('teachers')
    teachers.forEach((t) => {
      if (typeof t.photo === 'string') {
        const parsed = parseDataUrl(t.photo)
        if (parsed && tchFolder) {
          tchFolder.file(`${t.id || 'photo'}_photo.${parsed.ext}`, parsed.base64, { base64: true })
          tchFolder.file(`${t.id || 'photo'}.${parsed.ext}`, parsed.base64, { base64: true })
        }
      }
      if (typeof t.signature === 'string') {
        const parsed = parseDataUrl(t.signature)
        if (parsed && tchFolder) {
          tchFolder.file(`${t.id || 'sig'}_signature.${parsed.ext}`, parsed.base64, { base64: true })
        }
      }
    })
  }

  // Students photos
  const studentStore = bundle.stores?.['edutech-admissions']
  const students = studentStore?.state?.students || studentStore?.students
  if (Array.isArray(students) && imagesFolder) {
    const stdFolder = imagesFolder.folder('students')
    students.forEach((s) => {
      if (typeof s.photo === 'string') {
        const parsed = parseDataUrl(s.photo)
        if (parsed && stdFolder) {
          stdFolder.file(`${s.id || 'photo'}_photo.${parsed.ext}`, parsed.base64, { base64: true })
          stdFolder.file(`${s.id || 'photo'}.${parsed.ext}`, parsed.base64, { base64: true })
        }
      }
    })
  }

  // 4. Primary data payload / manifest for instant full restoration
  const jsonContent = JSON.stringify(bundle, null, 2)
  zip.file('backup.json', jsonContent)
  if (targetSlug && !zip.file(`${targetSlug}/backup.json`)) {
    zip.file(`${targetSlug}/backup.json`, jsonContent)
  }

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

/**
 * Extracts BackupBundle from a ZIP archive or array buffer.
 * Automatically reconstitutes the bundle from individual store files
 * (classes.json, teachers.json, students.json) if backup.json is not present.
 */
export async function extractBackupFromZip(data: Blob | ArrayBuffer | Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(data)

  // 1. Look for backup.json or manifest.json in root or subfolders
  let targetFile = zip.file('backup.json') || zip.file('manifest.json')
  if (!targetFile) {
    const backupFiles = zip.file(/(^|\/)backup\.json$/i)
    if (backupFiles.length > 0) targetFile = backupFiles[0]
  }

  if (targetFile) {
    return targetFile.async('text')
  }

  // 2. If no backup.json exists, reconstruct BackupBundle from individual JSON files
  const classesFile = zip.file('classes.json') || zip.file(/(^|\/)classes\.json$/i)[0]
  const teachersFile = zip.file('teachers.json') || zip.file(/(^|\/)teachers\.json$/i)[0]
  const admissionsFile = zip.file('admissions.json') || zip.file('students.json') || zip.file(/(^|\/)(admissions|students)\.json$/i)[0]
  const hrFile = zip.file('hr.json') || zip.file(/(^|\/)hr\.json$/i)[0]
  const examsFile = zip.file('exams.json') || zip.file(/(^|\/)exams\.json$/i)[0]
  const syllabusFile = zip.file('syllabus.json') || zip.file('syllabi.json') || zip.file(/(^|\/)(syllabus|syllabi)\.json$/i)[0]
  const assignmentFile = zip.file('assignments.json') || zip.file('assignment.json') || zip.file(/(^|\/)(assignments|assignment)\.json$/i)[0]

  if (classesFile || teachersFile || admissionsFile || hrFile || examsFile || syllabusFile || assignmentFile) {
    const stores: Record<string, any> = {}
    let classesCount = 0
    let teachersCount = 0
    let studentsCount = 0
    let examsCount = 0
    let deptsCount = 0
    let subjectsCount = 0

    if (classesFile) {
      try {
        const text = await classesFile.async('text')
        const parsed = JSON.parse(text)
        stores['edutech-classes'] = parsed
        const list = parsed?.state?.classes || parsed?.classes
        if (Array.isArray(list)) classesCount = list.length
        const depts = parsed?.state?.departments || parsed?.departments
        if (Array.isArray(depts)) deptsCount = depts.length
        const subs = parsed?.state?.subjects || parsed?.subjects
        if (Array.isArray(subs)) subjectsCount = subs.length
      } catch {
        /* skip invalid json */
      }
    }

    if (teachersFile) {
      try {
        const text = await teachersFile.async('text')
        const parsed = JSON.parse(text)
        stores['edutech-teachers'] = parsed
        const list = parsed?.state?.teachers || parsed?.teachers
        if (Array.isArray(list)) teachersCount = list.length
      } catch {
        /* skip invalid json */
      }
    }

    if (admissionsFile) {
      try {
        const text = await admissionsFile.async('text')
        const parsed = JSON.parse(text)
        stores['edutech-admissions'] = parsed
        const list = parsed?.state?.students || parsed?.students
        if (Array.isArray(list)) studentsCount = list.length
      } catch {
        /* skip invalid json */
      }
    }

    if (hrFile) {
      try {
        const text = await hrFile.async('text')
        const parsed = JSON.parse(text)
        stores['edutech-hr'] = parsed
      } catch {
        /* skip invalid json */
      }
    } else {
      const hrIncFile = zip.file('hr_increments.json') || zip.file(/(^|\/)hr_increments\.json$/i)[0]
      const hrBonFile = zip.file('hr_bonuses.json') || zip.file(/(^|\/)hr_bonuses\.json$/i)[0]
      const hrFacFile = zip.file('hr_facilities.json') || zip.file(/(^|\/)hr_facilities\.json$/i)[0]
      const hrProFile = zip.file('hr_promotions.json') || zip.file(/(^|\/)hr_promotions\.json$/i)[0]
      const hrFndFile = zip.file('hr_funds.json') || zip.file(/(^|\/)hr_funds\.json$/i)[0]

      if (hrIncFile || hrBonFile || hrFacFile || hrProFile || hrFndFile) {
        try {
          const incs = hrIncFile ? JSON.parse(await hrIncFile.async('text')) : []
          const bons = hrBonFile ? JSON.parse(await hrBonFile.async('text')) : []
          const facs = hrFacFile ? JSON.parse(await hrFacFile.async('text')) : []
          const pros = hrProFile ? JSON.parse(await hrProFile.async('text')) : []
          const fnds = hrFndFile ? JSON.parse(await hrFndFile.async('text')) : []

          stores['edutech-hr'] = {
            state: {
              increments: Array.isArray(incs) ? incs : [],
              bonuses: Array.isArray(bons) ? bons : [],
              facilities: Array.isArray(facs) ? facs : [],
              promotions: Array.isArray(pros) ? pros : [],
              funds: Array.isArray(fnds) ? fnds : [],
              teacherFacilities: [],
              monthlySalaryConfigs: [],
              recommendations: [],
              homeworkRecords: [],
              dailyReports: [],
              serverSynced: true,
            },
            version: 1,
          }
        } catch {
          /* skip invalid slice json */
        }
      }
    }

    if (examsFile) {
      try {
        const text = await examsFile.async('text')
        const parsed = JSON.parse(text)
        stores['edutech-exams'] = parsed
        const list = parsed?.state?.examConfigs || parsed?.examConfigs
        if (Array.isArray(list)) examsCount = list.length
      } catch {
        /* skip invalid json */
      }
    } else {
      const examCfgFile = zip.file('exam_configs.json') || zip.file(/(^|\/)exam_configs\.json$/i)[0]
      const subMarkCfgFile = zip.file('subject_mark_configs.json') || zip.file(/(^|\/)subject_mark_configs\.json$/i)[0]
      const marksFile = zip.file('student_marks.json') || zip.file(/(^|\/)student_marks\.json$/i)[0]
      const routinesFile = zip.file('exam_routines.json') || zip.file(/(^|\/)exam_routines\.json$/i)[0]

      if (examCfgFile || subMarkCfgFile || marksFile || routinesFile) {
        try {
          const cfgs = examCfgFile ? JSON.parse(await examCfgFile.async('text')) : []
          const subCfgs = subMarkCfgFile ? JSON.parse(await subMarkCfgFile.async('text')) : []
          const marks = marksFile ? JSON.parse(await marksFile.async('text')) : []
          const rts = routinesFile ? JSON.parse(await routinesFile.async('text')) : []

          stores['edutech-exams'] = {
            state: {
              examConfigs: Array.isArray(cfgs) ? cfgs : [],
              subjectMarkConfigs: Array.isArray(subCfgs) ? subCfgs : [],
              studentMarks: Array.isArray(marks) ? marks : [],
              routines: Array.isArray(rts) ? rts : [],
              rooms: [],
              seatPlans: [],
              invigilators: [],
              attendances: [],
              omrConfigs: [],
              extraMarks: [],
              extraMarkTypes: [],
              marksheetConfigs: [],
              generalAbilities: [],
              gradeScales: [],
              workingDays: [],
              promotions: [],
              cumulativeSheets: [],
              marksEntryStatuses: [],
              omrTemplates: [],
              markAdjustments: [],
              serverSynced: true,
            },
            version: 8,
          }
          if (Array.isArray(cfgs)) examsCount = cfgs.length
        } catch {
          /* skip invalid slice json */
        }
      }
    }

    if (syllabusFile) {
      try {
        const text = await syllabusFile.async('text')
        const parsed = JSON.parse(text)
        stores['edutech-syllabus'] = parsed
      } catch {
        /* skip invalid json */
      }
    }

    if (assignmentFile) {
      try {
        const text = await assignmentFile.async('text')
        const parsed = JSON.parse(text)
        stores['edutech-assignments'] = parsed
      } catch {
        /* skip invalid json */
      }
    }

    const bundle: BackupBundle = {
      metadata: {
        app: 'EduTech SMS',
        version: '2.0.0',
        slug: 'edutech',
        exportedAt: new Date().toISOString(),
        counts: {
          classes: classesCount,
          teachers: teachersCount,
          students: studentsCount,
          exams: examsCount,
          departments: deptsCount,
          subjects: subjectsCount,
        },
      },
      stores,
    }
    return JSON.stringify(bundle, null, 2)
  }

  const jsonFiles = zip.file(/\.json$/i)
  if (jsonFiles.length > 0) {
    return jsonFiles[0].async('text')
  }

  throw new Error('No backup.json or valid store JSON files found inside the ZIP archive.')
}
