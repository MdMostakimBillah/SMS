/**
 * Local Data Vault — Obsidian-style sync between localStorage stores and a
 * user-chosen folder of JSON files (one file per store/page) and binary image files.
 *
 * - connect:  user picks a folder once; current institution data and images are exported
 *             into {slug}/*.json and {slug}/images/... files inside it.
 * - startup:  the saved folder is re-hydrated (files win) before use.
 * - live:     every store change is debounced into its JSON file & image files; external
 *             edits or deletions in the files are pulled back into the running app.
 * - delete:   if any file or image is deleted in the local PC folder, the corresponding
 *             data or image is immediately deleted/cleared in the software.
 */

import { onSlugChange } from '../storage'
import { isWriteAllowed } from '../writeGuard'
import {
  registerVaultHooks,
  requestStoreReload,
} from './bridge'
import {
  keyToVaultPath,
  vaultPathToKey,
  keyMatchesInstitution,
  prettifyJson,
  compactJson,
  parseVaultImagePath,
  mimeFromExt,
  uint8ArrayToDataUrl,
  dataUrlToUint8Array,
  isBackupBundlePath,
  normalizeVaultJsonForStore,
} from './mapping'
import {
  isVaultSupported,
  pickDirectory,
  hasPermission,
  requestPermission,
  saveVaultHandle,
  loadVaultHandle,
  clearVaultHandle,
  writeTextFile,
  readTextFile,
  deleteTextFile,
  writeBinaryFile,
  readBinaryFile,
  listAllVaultFiles,
  type VaultFileInfo,
  type VfsDirectoryHandle,
} from './fsAccess'

export interface VaultStatus {
  supported: boolean
  connected: boolean
  needsReconnect: boolean
  folderName: string | null
  busy: boolean
  error: string | null
  lastSyncAt: number | null
}

const WRITE_DEBOUNCE_MS = 500
const WATCH_INTERVAL_MS = 2000
const OWN_WRITE_GRACE_MS = 4000

let handle: VfsDirectoryHandle | null = null
let watcherTimer: ReturnType<typeof setInterval> | null = null
let status: VaultStatus = {
  supported: isVaultSupported(),
  connected: false,
  needsReconnect: false,
  folderName: null,
  busy: false,
  error: null,
  lastSyncAt: null,
}

const listeners = new Set<(s: VaultStatus) => void>()
const pendingWrites = new Map<string, { timer: ReturnType<typeof setTimeout>; content: string }>()
const inFlightWrites = new Set<Promise<void>>()

function trackInFlight(p: Promise<void>): void {
  inFlightWrites.add(p)
  p.finally(() => inFlightWrites.delete(p))
}
const fileContentCache = new Map<string, string>() // path → compact content we last saw/wrote
const fileMtimeCache = new Map<string, number>() // path → last known mtime
const ownWriteAt = new Map<string, number>() // path → when we last wrote it
const knownVaultFiles = new Set<string>() // all known paths currently present in the vault

function emit(patch: Partial<VaultStatus>): void {
  status = { ...status, ...patch }
  listeners.forEach((fn) => fn(status))
}

export function getVaultStatus(): VaultStatus {
  return status
}

export function getActiveVaultHandle(): VfsDirectoryHandle | null {
  return handle
}

export function subscribeVault(fn: (s: VaultStatus) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function currentSlug(): string | null {
  try {
    return sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
  } catch {
    return null
  }
}

function currentUserId(): string | null {
  try {
    return sessionStorage.getItem('edutech_user_id') || localStorage.getItem('edutech_user_id')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Image store manipulation helpers
// ---------------------------------------------------------------------------

function clearInstitutionImage(slug: string, field: 'logo' | 'banner'): boolean {
  try {
    const key = `edutech-classes_${slug}`
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const inst = parsed?.state?.institution
    if (inst && inst[field]) {
      inst[field] = ''
      localStorage.setItem(key, JSON.stringify(parsed))
      return true
    }
  } catch { /* ignore */ }
  return false
}

function setInstitutionImage(slug: string, field: 'logo' | 'banner', dataUrl: string): boolean {
  try {
    const key = `edutech-classes_${slug}`
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const inst = parsed?.state?.institution
    if (inst && inst[field] !== dataUrl) {
      inst[field] = dataUrl
      localStorage.setItem(key, JSON.stringify(parsed))
      return true
    }
  } catch { /* ignore */ }
  return false
}

function clearTeacherImage(slug: string, teacherId: string, field: 'photo' | 'signature'): boolean {
  try {
    const key = `edutech-teachers_${slug}`
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const teachers = parsed?.state?.teachers
    if (Array.isArray(teachers)) {
      const t = teachers.find((item: any) => item.id === teacherId)
      if (t && t[field]) {
        t[field] = ''
        localStorage.setItem(key, JSON.stringify(parsed))
        return true
      }
    }
  } catch { /* ignore */ }
  return false
}

function setTeacherImage(slug: string, teacherId: string, field: 'photo' | 'signature', dataUrl: string): boolean {
  try {
    const key = `edutech-teachers_${slug}`
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const teachers = parsed?.state?.teachers
    if (Array.isArray(teachers)) {
      const t = teachers.find((item: any) => item.id === teacherId)
      if (t && t[field] !== dataUrl) {
        t[field] = dataUrl
        localStorage.setItem(key, JSON.stringify(parsed))
        return true
      }
    }
  } catch { /* ignore */ }
  return false
}

function clearStudentPhoto(slug: string, studentId: string): boolean {
  try {
    const key = `edutech-admissions_${slug}`
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const students = parsed?.state?.students
    if (Array.isArray(students)) {
      const s = students.find((item: any) => item.id === studentId)
      if (s && s.photo) {
        s.photo = ''
        localStorage.setItem(key, JSON.stringify(parsed))
        return true
      }
    }
  } catch { /* ignore */ }
  return false
}

function setStudentPhoto(slug: string, studentId: string, dataUrl: string): boolean {
  try {
    const key = `edutech-admissions_${slug}`
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const students = parsed?.state?.students
    if (Array.isArray(students)) {
      const s = students.find((item: any) => item.id === studentId)
      if (s && s.photo !== dataUrl) {
        s.photo = dataUrl
        localStorage.setItem(key, JSON.stringify(parsed))
        return true
      }
    }
  } catch { /* ignore */ }
  return false
}

async function exportStoreImages(slug: string, keyOrPath: string, json: string): Promise<void> {
  if (!handle) return
  try {
    const parsed = JSON.parse(json)
    const state = parsed?.state ?? parsed
    if (!state) return

    // 1. edutech-classes_{slug} or {slug}/classes.json
    if (keyOrPath.includes('classes')) {
      const inst = state.institution
      if (inst) {
        if (typeof inst.logo === 'string' && inst.logo.startsWith('data:')) {
          const img = dataUrlToUint8Array(inst.logo)
          if (img) {
            const imgPath = `${slug}/images/logo.${img.ext}`
            await writeBinaryFile(handle, imgPath, img.bytes)
            knownVaultFiles.add(imgPath)
            ownWriteAt.set(imgPath, Date.now())

            const rootImgPath = `images/logo.${img.ext}`
            await writeBinaryFile(handle, rootImgPath, img.bytes)
            knownVaultFiles.add(rootImgPath)
            ownWriteAt.set(rootImgPath, Date.now())
          }
        }
        if (typeof inst.banner === 'string' && inst.banner.startsWith('data:')) {
          const img = dataUrlToUint8Array(inst.banner)
          if (img) {
            const imgPath = `${slug}/images/banner.${img.ext}`
            await writeBinaryFile(handle, imgPath, img.bytes)
            knownVaultFiles.add(imgPath)
            ownWriteAt.set(imgPath, Date.now())

            const rootImgPath = `images/banner.${img.ext}`
            await writeBinaryFile(handle, rootImgPath, img.bytes)
            knownVaultFiles.add(rootImgPath)
            ownWriteAt.set(rootImgPath, Date.now())
          }
        }
      }
    }

    // 2. edutech-teachers_{slug} or {slug}/teachers.json
    if (keyOrPath.includes('teachers')) {
      const teachers = state.teachers
      if (Array.isArray(teachers)) {
        for (const t of teachers) {
          if (!t.id) continue
          if (typeof t.photo === 'string' && t.photo.startsWith('data:')) {
            const img = dataUrlToUint8Array(t.photo)
            if (img) {
              const imgPath = `${slug}/images/teachers/${t.id}_photo.${img.ext}`
              await writeBinaryFile(handle, imgPath, img.bytes)
              knownVaultFiles.add(imgPath)
              ownWriteAt.set(imgPath, Date.now())

              const directPath = `${slug}/images/teachers/${t.id}.${img.ext}`
              await writeBinaryFile(handle, directPath, img.bytes)
              knownVaultFiles.add(directPath)
              ownWriteAt.set(directPath, Date.now())

              const rootImgPath = `images/teachers/${t.id}_photo.${img.ext}`
              await writeBinaryFile(handle, rootImgPath, img.bytes)
              knownVaultFiles.add(rootImgPath)
              ownWriteAt.set(rootImgPath, Date.now())

              const rootDirectPath = `images/teachers/${t.id}.${img.ext}`
              await writeBinaryFile(handle, rootDirectPath, img.bytes)
              knownVaultFiles.add(rootDirectPath)
              ownWriteAt.set(rootDirectPath, Date.now())
            }
          }
          if (typeof t.signature === 'string' && t.signature.startsWith('data:')) {
            const img = dataUrlToUint8Array(t.signature)
            if (img) {
              const imgPath = `${slug}/images/teachers/${t.id}_signature.${img.ext}`
              await writeBinaryFile(handle, imgPath, img.bytes)
              knownVaultFiles.add(imgPath)
              ownWriteAt.set(imgPath, Date.now())

              const rootSigPath = `images/teachers/${t.id}_signature.${img.ext}`
              await writeBinaryFile(handle, rootSigPath, img.bytes)
              knownVaultFiles.add(rootSigPath)
              ownWriteAt.set(rootSigPath, Date.now())
            }
          }
        }
      }
    }

    // 3. edutech-admissions_{slug} or {slug}/admissions.json or {slug}/students.json
    if (keyOrPath.includes('admissions') || keyOrPath.includes('students')) {
      const students = state.students
      if (Array.isArray(students)) {
        for (const s of students) {
          if (!s.id) continue
          if (typeof s.photo === 'string' && s.photo.startsWith('data:')) {
            const img = dataUrlToUint8Array(s.photo)
            if (img) {
              const imgPath = `${slug}/images/students/${s.id}_photo.${img.ext}`
              await writeBinaryFile(handle, imgPath, img.bytes)
              knownVaultFiles.add(imgPath)
              ownWriteAt.set(imgPath, Date.now())

              const directPath = `${slug}/images/students/${s.id}.${img.ext}`
              await writeBinaryFile(handle, directPath, img.bytes)
              knownVaultFiles.add(directPath)
              ownWriteAt.set(directPath, Date.now())
            }
          }
        }
      }
    }
  } catch {
    /* JSON parse or write error — continue */
  }
}

// ---------------------------------------------------------------------------
// Hydration: folder files → localStorage → live stores
// ---------------------------------------------------------------------------

function getDomainSlot(path: string): string {
  if (path.includes('/users/')) return path
  const baseName = (path.split('/').pop() || path).toLowerCase()
  if (baseName === 'admissions.json') return 'students.json'
  if (baseName === 'staff.json') return 'teachers.json'
  return baseName
}

function getTwinPaths(path: string, slug: string): string[] {
  const parts = path.split('/')
  const baseName = parts[parts.length - 1]
  const isRoot = parts.length === 1

  const twins: string[] = []
  if (isRoot) {
    twins.push(`${slug}/${baseName}`)
    if (baseName === 'students.json') twins.push(`${slug}/admissions.json`)
  } else if (parts.length === 2 && parts[0] === slug) {
    twins.push(baseName)
    if (baseName === 'admissions.json') {
      twins.push('students.json')
      twins.push(`${slug}/students.json`)
    } else if (baseName === 'students.json') {
      twins.push(`${slug}/admissions.json`)
    }
  }
  return twins.filter((t) => t !== path)
}

async function hydrateFromVault(): Promise<number> {
  if (!handle) return 0
  const slug = currentSlug()
  if (!slug) return 0

  const files = await listAllVaultFiles(handle)
  let applied = 0

  // 1. Check for bundle file first (backup.json or {slug}/backup.json)
  for (const file of files) {
    if (isBackupBundlePath(file.path)) {
      const text = await readTextFile(handle, file.path)
      if (text) {
        try {
          const parsedBundle = JSON.parse(text)
          if (parsedBundle?.stores) {
            for (const [sBase, sVal] of Object.entries(parsedBundle.stores)) {
              const sKey = sBase.endsWith(`_${slug}`) ? sBase : `${sBase}_${slug}`
              const norm = normalizeVaultJsonForStore(sKey, JSON.stringify(sVal), localStorage.getItem(sKey), file.path)
              localStorage.setItem(sKey, norm)
              applied++
            }
          }
        } catch { /* ignore */ }
      }
    }
  }

  // 2. Load all JSON store files, grouped by domain slot so that duplicate twin
  // files (e.g. root teachers.json vs {slug}/teachers.json) are deduplicated by mtime.
  // The newest file wins, and the older twin is updated so disk files stay in sync.
  const jsonGroups = new Map<string, VaultFileInfo[]>()
  for (const file of files) {
    if (!file.path.endsWith('.json') || isBackupBundlePath(file.path)) continue
    const key = vaultPathToKey(file.path, { slug, userId: currentUserId() })
    if (!key) continue
    const slot = getDomainSlot(file.path)
    const existing = jsonGroups.get(slot) || []
    existing.push(file)
    jsonGroups.set(slot, existing)
  }

  for (const [, group] of jsonGroups) {
    // Sort descending by lastModified: most recently edited file first
    group.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    const winner = group[0]
    const key = vaultPathToKey(winner.path, { slug, userId: currentUserId() })
    if (!key) continue

    const text = await readTextFile(handle, winner.path)
    if (text === null) continue
    try {
      JSON.parse(text) // validate — never load a hand-broken file
    } catch {
      continue
    }

    const normalized = normalizeVaultJsonForStore(key, text, localStorage.getItem(key), winner.path)
    localStorage.setItem(key, normalized)
    fileContentCache.set(winner.path, compactJson(normalized))
    fileMtimeCache.set(winner.path, winner.lastModified)
    knownVaultFiles.add(winner.path)
    applied++

    // Sync winner's text to older twin files in the group so they don't stay stale on disk
    for (let i = 1; i < group.length; i++) {
      const loser = group[i]
      try {
        await writeTextFile(handle, loser.path, text)
        fileContentCache.set(loser.path, compactJson(text))
        fileMtimeCache.delete(loser.path)
        ownWriteAt.set(loser.path, Date.now())
        knownVaultFiles.add(loser.path)
      } catch {
        /* ignore */
      }
    }
  }

  // 3. Load any standalone image files found in the vault
  for (const file of files) {
    const imgTarget = parseVaultImagePath(file.path, slug)
    if (!imgTarget) continue
    const bytes = await readBinaryFile(handle, file.path)
    if (!bytes || bytes.byteLength === 0) continue
    const mime = mimeFromExt(imgTarget.ext)
    const dataUrl = uint8ArrayToDataUrl(bytes, mime)
    fileMtimeCache.set(file.path, file.lastModified)
    knownVaultFiles.add(file.path)

    if (imgTarget.type === 'logo') {
      if (setInstitutionImage(slug, 'logo', dataUrl)) applied++
    } else if (imgTarget.type === 'banner') {
      if (setInstitutionImage(slug, 'banner', dataUrl)) applied++
    } else if (imgTarget.type === 'teacher_photo') {
      if (setTeacherImage(slug, imgTarget.id, 'photo', dataUrl)) applied++
    } else if (imgTarget.type === 'teacher_signature') {
      if (setTeacherImage(slug, imgTarget.id, 'signature', dataUrl)) applied++
    } else if (imgTarget.type === 'student_photo') {
      if (setStudentPhoto(slug, imgTarget.id, dataUrl)) applied++
    }
  }

  if (applied > 0) requestStoreReload()
  return applied
}

// ---------------------------------------------------------------------------
// Seeding & Writing individual clean JSON files
// ---------------------------------------------------------------------------

async function writeVaultFile(subPath: string, content: string): Promise<void> {
  if (!handle) return
  await writeTextFile(handle, subPath, content)
  fileContentCache.set(subPath, compactJson(content))
  fileMtimeCache.delete(subPath)
  ownWriteAt.set(subPath, Date.now())
  knownVaultFiles.add(subPath)
}

async function syncIndividualDomainFiles(slug: string, path: string, rawJson: string): Promise<void> {
  if (path === `${slug}/teachers.json`) {
    await writeVaultFile('teachers.json', prettifyJson(rawJson))
    try {
      const parsed = JSON.parse(rawJson)
      const state = parsed?.state ?? parsed

      const departments = state.departments ?? []
      const deptsPretty = JSON.stringify(departments, null, 2)
      await writeVaultFile(`${slug}/departments.json`, deptsPretty)
      await writeVaultFile('departments.json', deptsPretty)

      const subjects = state.subjects ?? []
      const subjectsPretty = JSON.stringify(subjects, null, 2)
      await writeVaultFile(`${slug}/subjects.json`, subjectsPretty)
      await writeVaultFile('subjects.json', subjectsPretty)

      const designations = state.designations ?? []
      const designationsPretty = JSON.stringify(designations, null, 2)
      await writeVaultFile(`${slug}/designations.json`, designationsPretty)
      await writeVaultFile('designations.json', designationsPretty)
    } catch { /* ignore */ }
  }

  if (path === `${slug}/admissions.json`) {
    try {
      const parsed = JSON.parse(rawJson)
      const state = parsed?.state ?? parsed
      const students = state.students ?? []
      const studentsPretty = JSON.stringify(students, null, 2)
      await writeVaultFile(`${slug}/students.json`, studentsPretty)
      await writeVaultFile('students.json', studentsPretty)
    } catch {
      await writeVaultFile(`${slug}/students.json`, prettifyJson(rawJson))
      await writeVaultFile('students.json', prettifyJson(rawJson))
    }
  }

  if (path === `${slug}/classes.json`) {
    await writeVaultFile('classes.json', prettifyJson(rawJson))

    try {
      const parsed = JSON.parse(rawJson)
      const state = parsed?.state ?? parsed

      // 1. routines.json
      const routines = state.routines ?? []
      const routinesPretty = JSON.stringify(routines, null, 2)
      await writeVaultFile(`${slug}/routines.json`, routinesPretty)
      await writeVaultFile('routines.json', routinesPretty)

      // 2. sections.json
      const classes = state.classes ?? []
      const sections = classes.flatMap((c: any) =>
        (c.sections || []).map((s: any) => ({
          classId: c.id,
          className: c.name,
          ...s,
        }))
      )
      const sectionsPretty = JSON.stringify(sections, null, 2)
      await writeVaultFile(`${slug}/sections.json`, sectionsPretty)
      await writeVaultFile('sections.json', sectionsPretty)

      // 3. institution.json
      if (state.institution) {
        const instPretty = JSON.stringify(state.institution, null, 2)
        await writeVaultFile(`${slug}/institution.json`, instPretty)
        await writeVaultFile('institution.json', instPretty)
      }
    } catch { /* ignore */ }
  }
}

async function seedVaultFromStorage(): Promise<number> {
  if (!handle) return 0
  if (!isWriteAllowed()) return 0
  const slug = currentSlug()
  if (!slug) return 0

  const userId = currentUserId()
  let seeded = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !keyMatchesInstitution(key, slug, userId)) continue
    const path = keyToVaultPath(key)
    const raw = localStorage.getItem(key)
    if (!path || raw === null) continue
    const pretty = prettifyJson(raw)
    await writeVaultFile(path, pretty)
    await syncIndividualDomainFiles(slug, path, raw)
    await exportStoreImages(slug, path, raw)
    seeded++
  }
  emit({ lastSyncAt: Date.now() })
  return seeded
}

// ---------------------------------------------------------------------------
// Write-through: store changes → files
// ---------------------------------------------------------------------------

function handleStoreWrite(key: string, json: string): void {
  if (!handle) {
    void (async () => {
      try {
        const saved = await loadVaultHandle()
        if (saved && (await hasPermission(saved))) {
          handle = saved
          handleStoreWrite(key, json)
        }
      } catch {
        /* ignore */
      }
    })()
    return
  }
  const slug = currentSlug()
  if (!slug || !keyMatchesInstitution(key, slug, currentUserId())) return
  const path = keyToVaultPath(key)
  if (!path || fileContentCache.get(path) === json) return // no-op change

  const isLocalComp =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('edutech_storage_mode') === 'local_computer') ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('edutech_storage_mode') === 'local_computer')

  if (isLocalComp || key.includes('classes') || key.includes('teachers') || key.includes('admissions')) {
    const existing = pendingWrites.get(path)
    if (existing) clearTimeout(existing.timer)
    pendingWrites.delete(path)
    trackInFlight(writePath(path, json))
    return
  }

  const existing = pendingWrites.get(path)
  if (existing) clearTimeout(existing.timer)
  const timer = setTimeout(() => {
    pendingWrites.delete(path)
    trackInFlight(writePath(path, json))
  }, WRITE_DEBOUNCE_MS)
  pendingWrites.set(path, { timer, content: json })
}

async function writePath(path: string, json: string): Promise<void> {
  if (!handle) {
    try {
      const saved = await loadVaultHandle()
      if (saved && (await hasPermission(saved))) {
        handle = saved
      }
    } catch {
      /* ignore */
    }
  }
  if (!handle) return
  const slug = currentSlug()
  try {
    await writeVaultFile(path, prettifyJson(json))
    if (slug) {
      await exportStoreImages(slug, path, json)
      await syncIndividualDomainFiles(slug, path, json)
    }
    emit({ lastSyncAt: Date.now(), error: null })
  } catch {
    emit({ error: `Failed to write ${path}` })
  }
}

async function handleStoreRemove(key: string): Promise<void> {
  if (!handle) return
  const path = keyToVaultPath(key)
  if (!path) return
  const existing = pendingWrites.get(path)
  if (existing) {
    clearTimeout(existing.timer)
    pendingWrites.delete(path)
  }
  fileContentCache.delete(path)
  fileMtimeCache.delete(path)
  knownVaultFiles.delete(path)
  await deleteTextFile(handle, path)
}

/** Write all debounced changes immediately (call on page hide). */
export async function flushVaultWrites(): Promise<void> {
  if (!isWriteAllowed()) return
  if (!handle) {
    try {
      const saved = await loadVaultHandle()
      if (saved && (await hasPermission(saved))) {
        handle = saved
      }
    } catch {
      /* ignore */
    }
  }
  if (!handle) return
  const entries = Array.from(pendingWrites.entries())
  pendingWrites.clear()
  for (const [path, entry] of entries) {
    clearTimeout(entry.timer)
    trackInFlight(writePath(path, entry.content))
  }
  if (inFlightWrites.size > 0) {
    await Promise.all(Array.from(inFlightWrites))
  }
}

// ---------------------------------------------------------------------------
// External-change watcher: files edited/deleted by hand → live stores
// ---------------------------------------------------------------------------

export async function watchTick(): Promise<void> {
  if (!handle || typeof document === 'undefined' || document.visibilityState !== 'visible') return
  const slug = currentSlug()
  if (!slug) return
  const userId = currentUserId()

  let changed = false
  const currentFiles = await listAllVaultFiles(handle)
  const currentPathSet = new Set(currentFiles.map((f) => f.path))
  const deletedKeys = new Set<string>()

  // -------------------------------------------------------------------------
  // 1. Detect DELETED files from local disk (Obsidian-style deletion)
  // -------------------------------------------------------------------------
  for (const knownPath of Array.from(knownVaultFiles)) {
    const isRootJson = !knownPath.includes('/') && knownPath.endsWith('.json')
    if (!knownPath.startsWith(`${slug}/`) && !isRootJson) continue
    if (currentPathSet.has(knownPath)) continue

    // File is GONE from disk!
    knownVaultFiles.delete(knownPath)
    fileContentCache.delete(knownPath)
    fileMtimeCache.delete(knownPath)
    ownWriteAt.delete(knownPath)

    // A) Is it a JSON file?
    if (knownPath.endsWith('.json')) {
      const jsonKey = vaultPathToKey(knownPath, { slug, userId })
      if (jsonKey) {
        if (knownPath.includes('departments')) {
          const raw = localStorage.getItem(jsonKey)
          if (raw) {
            try {
              const p = JSON.parse(raw)
              if (p?.state) {
                p.state.departments = []
                localStorage.setItem(jsonKey, JSON.stringify(p))
                changed = true
              }
            } catch { /* ignore */ }
          }
        } else if (knownPath.includes('subjects')) {
          const raw = localStorage.getItem(jsonKey)
          if (raw) {
            try {
              const p = JSON.parse(raw)
              if (p?.state) {
                p.state.subjects = []
                localStorage.setItem(jsonKey, JSON.stringify(p))
                changed = true
              }
            } catch { /* ignore */ }
          }
        } else if (knownPath.includes('designations')) {
          const raw = localStorage.getItem(jsonKey)
          if (raw) {
            try {
              const p = JSON.parse(raw)
              if (p?.state) {
                p.state.designations = []
                localStorage.setItem(jsonKey, JSON.stringify(p))
                changed = true
              }
            } catch { /* ignore */ }
          }
        } else if (knownPath.includes('routines')) {
          const raw = localStorage.getItem(jsonKey)
          if (raw) {
            try {
              const p = JSON.parse(raw)
              if (p?.state) {
                p.state.routines = []
                const curSession = p.state.institution?.currentSession || '2025-26'
                if (p.state.sessionRoutines) p.state.sessionRoutines[curSession] = []
                localStorage.setItem(jsonKey, JSON.stringify(p))
                changed = true
              }
            } catch { /* ignore */ }
          }
        } else if (knownPath.includes('sections')) {
          const raw = localStorage.getItem(jsonKey)
          if (raw) {
            try {
              const p = JSON.parse(raw)
              if (p?.state?.classes) {
                p.state.classes = p.state.classes.map((c: any) => ({ ...c, sections: [] }))
                const curSession = p.state.institution?.currentSession || '2025-26'
                if (p.state.sessionClasses?.[curSession]) {
                  p.state.sessionClasses[curSession] = p.state.sessionClasses[curSession].map((c: any) => ({ ...c, sections: [] }))
                }
                localStorage.setItem(jsonKey, JSON.stringify(p))
                changed = true
              }
            } catch { /* ignore */ }
          }
        } else {
          localStorage.removeItem(jsonKey)
          deletedKeys.add(jsonKey)
          if (knownPath === `${slug}/classes.json`) {
            await deleteTextFile(handle, 'classes.json')
            knownVaultFiles.delete('classes.json')
            fileContentCache.delete('classes.json')
            fileMtimeCache.delete('classes.json')
          } else if (knownPath === 'classes.json') {
            await deleteTextFile(handle, `${slug}/classes.json`)
            knownVaultFiles.delete(`${slug}/classes.json`)
            fileContentCache.delete(`${slug}/classes.json`)
            fileMtimeCache.delete(`${slug}/classes.json`)
          } else if (knownPath === `${slug}/teachers.json`) {
            await deleteTextFile(handle, 'teachers.json')
            knownVaultFiles.delete('teachers.json')
            fileContentCache.delete('teachers.json')
            fileMtimeCache.delete('teachers.json')
          } else if (knownPath === 'teachers.json') {
            await deleteTextFile(handle, `${slug}/teachers.json`)
            knownVaultFiles.delete(`${slug}/teachers.json`)
            fileContentCache.delete(`${slug}/teachers.json`)
            fileMtimeCache.delete(`${slug}/teachers.json`)
          } else if (knownPath === `${slug}/admissions.json`) {
            await deleteTextFile(handle, 'students.json')
            knownVaultFiles.delete('students.json')
            fileContentCache.delete('students.json')
            fileMtimeCache.delete('students.json')
          }
          changed = true
        }
      }
      continue
    }

    // B) Is it an image file?
    const imgTarget = parseVaultImagePath(knownPath, slug)
    if (imgTarget) {
      if (imgTarget.type === 'logo') {
        if (clearInstitutionImage(slug, 'logo')) changed = true
      } else if (imgTarget.type === 'banner') {
        if (clearInstitutionImage(slug, 'banner')) changed = true
      } else if (imgTarget.type === 'teacher_photo') {
        if (clearTeacherImage(slug, imgTarget.id, 'photo')) changed = true
      } else if (imgTarget.type === 'teacher_signature') {
        if (clearTeacherImage(slug, imgTarget.id, 'signature')) changed = true
      } else if (imgTarget.type === 'student_photo') {
        if (clearStudentPhoto(slug, imgTarget.id)) changed = true
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. Detect ADDED or MODIFIED files from local disk
  // -------------------------------------------------------------------------
  for (const file of currentFiles) {
    knownVaultFiles.add(file.path)
    const knownMtime = fileMtimeCache.get(file.path)
    if (knownMtime === file.lastModified) continue

    // Skip our own recent writes within the grace window
    if (Date.now() - (ownWriteAt.get(file.path) ?? 0) < OWN_WRITE_GRACE_MS) {
      fileMtimeCache.set(file.path, file.lastModified)
      continue
    }

    // A) Handle JSON file changes
    if (file.path.endsWith('.json')) {
      if (isBackupBundlePath(file.path)) {
        const text = await readTextFile(handle, file.path)
        if (text === null) continue
        fileMtimeCache.set(file.path, file.lastModified)
        const fileCompact = compactJson(text)
        if (fileContentCache.get(file.path) === fileCompact) continue
        fileContentCache.set(file.path, fileCompact)
        try {
          const parsedBundle = JSON.parse(text)
          if (parsedBundle?.stores) {
            for (const [sBase, sVal] of Object.entries(parsedBundle.stores)) {
              const sKey = sBase.endsWith(`_${slug}`) ? sBase : `${sBase}_${slug}`
              const norm = normalizeVaultJsonForStore(sKey, JSON.stringify(sVal), localStorage.getItem(sKey), file.path)
              localStorage.setItem(sKey, norm)
              changed = true
            }
          }
        } catch {
          continue // mid-edit
        }
        continue
      }

      const key = vaultPathToKey(file.path, { slug, userId })
      if (!key || deletedKeys.has(key)) continue
      const text = await readTextFile(handle, file.path)
      if (text === null) continue
      fileMtimeCache.set(file.path, file.lastModified)
      const fileCompact = compactJson(text)
      if (fileContentCache.get(file.path) === fileCompact) continue

      try {
        JSON.parse(text)
      } catch {
        continue // user is mid-edit — try again next tick
      }
      const normalized = normalizeVaultJsonForStore(key, text, localStorage.getItem(key), file.path)
      localStorage.setItem(key, normalized)
      fileContentCache.set(file.path, fileCompact)
      changed = true

      // Immediately sync this external edit to twin files so disk files stay in sync
      const twins = getTwinPaths(file.path, slug)
      for (const twin of twins) {
        try {
          await writeTextFile(handle, twin, text)
          fileContentCache.set(twin, fileCompact)
          fileMtimeCache.delete(twin)
          ownWriteAt.set(twin, Date.now())
          knownVaultFiles.add(twin)
        } catch {
          /* ignore */
        }
      }
      continue
    }

    // B) Handle image file changes / additions
    const imgTarget = parseVaultImagePath(file.path, slug)
    if (imgTarget) {
      const bytes = await readBinaryFile(handle, file.path)
      fileMtimeCache.set(file.path, file.lastModified)
      if (!bytes || bytes.byteLength === 0) continue
      const mime = mimeFromExt(imgTarget.ext)
      const dataUrl = uint8ArrayToDataUrl(bytes, mime)

      if (imgTarget.type === 'logo') {
        if (setInstitutionImage(slug, 'logo', dataUrl)) changed = true
      } else if (imgTarget.type === 'banner') {
        if (setInstitutionImage(slug, 'banner', dataUrl)) changed = true
      } else if (imgTarget.type === 'teacher_photo') {
        if (setTeacherImage(slug, imgTarget.id, 'photo', dataUrl)) changed = true
      } else if (imgTarget.type === 'teacher_signature') {
        if (setTeacherImage(slug, imgTarget.id, 'signature', dataUrl)) changed = true
      } else if (imgTarget.type === 'student_photo') {
        if (setStudentPhoto(slug, imgTarget.id, dataUrl)) changed = true
      }
    }
  }

  if (changed) {
    requestStoreReload()
    emit({ lastSyncAt: Date.now() })
  }
}

function startWatcher(): void {
  if (watcherTimer) return
  watcherTimer = setInterval(() => void watchTick(), WATCH_INTERVAL_MS)
}

function stopWatcher(): void {
  if (watcherTimer) {
    clearInterval(watcherTimer)
    watcherTimer = null
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

async function activate(savedHandle: VfsDirectoryHandle, seedIfEmpty: boolean): Promise<void> {
  handle = savedHandle
  registerVaultHooks({ onWrite: handleStoreWrite, onRemove: (k) => void handleStoreRemove(k) })
  const applied = await hydrateFromVault()
  if (seedIfEmpty && applied === 0) await seedVaultFromStorage()
  startWatcher()
  emit({
    connected: true,
    needsReconnect: false,
    folderName: savedHandle.name,
    error: null,
    lastSyncAt: Date.now(),
  })
}

/** Call once at app startup. Never blocks rendering. */
export async function vaultInit(): Promise<void> {
  if (!isVaultSupported()) {
    emit({ supported: false })
    return
  }
  const saved = await loadVaultHandle()
  if (!saved) return
  if (await hasPermission(saved)) {
    await activate(saved, false)
  } else {
    emit({ needsReconnect: true, folderName: saved.name })
  }
}

/** User gesture required. Pick a folder and start syncing into it. */
export async function vaultConnectFolder(): Promise<void> {
  emit({ busy: true, error: null })
  try {
    const picked = await pickDirectory()
    if (!(await requestPermission(picked))) {
      emit({ busy: false, error: 'Read/write permission was not granted.' })
      return
    }
    await saveVaultHandle(picked)
    await activate(picked, true)
    emit({ busy: false })
  } catch (err) {
    emit({
      busy: false,
      error: err instanceof Error ? err.message : 'Failed to connect the folder.',
    })
  }
}

/** Re-grant permission on the previously connected folder (user gesture required). */
export async function vaultReconnect(): Promise<void> {
  emit({ busy: true, error: null })
  try {
    const saved = await loadVaultHandle()
    if (!saved) {
      emit({ busy: false, needsReconnect: false, connected: false, folderName: null })
      return
    }
    if (!(await requestPermission(saved))) {
      emit({ busy: false, error: 'Permission was not granted.' })
      return
    }
    await activate(saved, false)
    emit({ busy: false })
  } catch (err) {
    emit({ busy: false, error: err instanceof Error ? err.message : 'Reconnect failed.' })
  }
}

/** Force-write pending changes and re-export current storage into the folder. */
export async function vaultSyncNow(): Promise<void> {
  await flushVaultWrites()
  await seedVaultFromStorage()
}

/** Stop syncing and forget the folder (data already in files stays untouched). */
export async function vaultDisconnect(): Promise<void> {
  await flushVaultWrites()
  stopWatcher()
  handle = null
  fileContentCache.clear()
  fileMtimeCache.clear()
  ownWriteAt.clear()
  knownVaultFiles.clear()
  registerVaultHooks({ onWrite: () => undefined, onRemove: () => undefined })
  await clearVaultHandle()
  emit({ connected: false, needsReconnect: false, folderName: null, lastSyncAt: null })
}

// Re-hydrate when the active institution changes (multi-tenant folders).
onSlugChange(() => {
  if (handle) void hydrateFromVault()
})

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void flushVaultWrites())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushVaultWrites()
    else if (document.visibilityState === 'visible') void watchTick()
  })
  window.addEventListener('focus', () => void watchTick())
}
