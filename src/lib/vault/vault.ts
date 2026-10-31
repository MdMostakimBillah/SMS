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
          }
        }
        if (typeof inst.banner === 'string' && inst.banner.startsWith('data:')) {
          const img = dataUrlToUint8Array(inst.banner)
          if (img) {
            const imgPath = `${slug}/images/banner.${img.ext}`
            await writeBinaryFile(handle, imgPath, img.bytes)
            knownVaultFiles.add(imgPath)
            ownWriteAt.set(imgPath, Date.now())
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
            }
          }
          if (typeof t.signature === 'string' && t.signature.startsWith('data:')) {
            const img = dataUrlToUint8Array(t.signature)
            if (img) {
              const imgPath = `${slug}/images/teachers/${t.id}_signature.${img.ext}`
              await writeBinaryFile(handle, imgPath, img.bytes)
              knownVaultFiles.add(imgPath)
              ownWriteAt.set(imgPath, Date.now())
            }
          }
        }
      }
    }

    // 3. edutech-admissions_{slug} or {slug}/admissions.json
    if (keyOrPath.includes('admissions')) {
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

async function hydrateFromVault(): Promise<number> {
  if (!handle) return 0
  const slug = currentSlug()
  if (!slug) return 0

  const files = await listAllVaultFiles(handle, [slug])
  let applied = 0

  // 1. Load all JSON store files
  for (const file of files) {
    if (!file.path.endsWith('.json')) continue
    const key = vaultPathToKey(file.path, { slug, userId: currentUserId() })
    if (!key) continue
    const text = await readTextFile(handle, file.path)
    if (text === null) continue
    try {
      JSON.parse(text) // validate — never load a hand-broken file
    } catch {
      continue
    }
    localStorage.setItem(key, text)
    fileContentCache.set(file.path, compactJson(text))
    fileMtimeCache.set(file.path, file.lastModified)
    knownVaultFiles.add(file.path)
    applied++
  }

  // 2. Load any standalone image files found in the vault
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
// Seeding: localStorage → folder files
// ---------------------------------------------------------------------------

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
    await writeTextFile(handle, path, pretty)
    fileContentCache.set(path, compactJson(raw))
    ownWriteAt.set(path, Date.now())
    knownVaultFiles.add(path)
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
  if (!handle) return
  const slug = currentSlug()
  if (!slug || !keyMatchesInstitution(key, slug, currentUserId())) return
  const path = keyToVaultPath(key)
  if (!path || fileContentCache.get(path) === json) return // no-op change

  const existing = pendingWrites.get(path)
  if (existing) clearTimeout(existing.timer)
  const timer = setTimeout(() => {
    pendingWrites.delete(path)
    void writePath(path, json)
  }, WRITE_DEBOUNCE_MS)
  pendingWrites.set(path, { timer, content: json })
}

async function writePath(path: string, json: string): Promise<void> {
  if (!handle) return
  const slug = currentSlug()
  try {
    await writeTextFile(handle, path, prettifyJson(json))
    fileContentCache.set(path, json)
    fileMtimeCache.delete(path) // force watcher to accept our own write
    ownWriteAt.set(path, Date.now())
    knownVaultFiles.add(path)
    if (slug) {
      await exportStoreImages(slug, path, json)
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
  const entries = Array.from(pendingWrites.entries())
  pendingWrites.clear()
  for (const [path, entry] of entries) {
    clearTimeout(entry.timer)
    await writePath(path, entry.content)
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
  const currentFiles = await listAllVaultFiles(handle, [slug])
  const currentPathSet = new Set(currentFiles.map((f) => f.path))

  // -------------------------------------------------------------------------
  // 1. Detect DELETED files from local disk (Obsidian-style deletion)
  // -------------------------------------------------------------------------
  for (const knownPath of Array.from(knownVaultFiles)) {
    if (!knownPath.startsWith(`${slug}/`)) continue
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
        localStorage.removeItem(jsonKey)
        changed = true
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
      const key = vaultPathToKey(file.path, { slug, userId })
      if (!key) continue
      const text = await readTextFile(handle, file.path)
      if (text === null) continue
      fileMtimeCache.set(file.path, file.lastModified)
      try {
        JSON.parse(text)
      } catch {
        continue // user is mid-edit — try again next tick
      }
      const compact = compactJson(text)
      if (localStorage.getItem(key) === compact) {
        fileContentCache.set(file.path, compact)
        continue
      }
      localStorage.setItem(key, text)
      fileContentCache.set(file.path, compact)
      changed = true
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
