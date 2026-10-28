/**
 * Local Data Vault — Obsidian-style sync between localStorage stores and a
 * user-chosen folder of JSON files (one file per store/page).
 *
 * - connect:  user picks a folder once; current institution data is exported
 *             into {slug}/*.json files inside it.
 * - startup:  the saved folder is re-hydrated (files win) before use.
 * - live:     every store change is debounced into its JSON file; external
 *             edits in the files are pulled back into the running app.
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
  listJsonFiles,
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
const WATCH_INTERVAL_MS = 5000
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
    return sessionStorage.getItem('edutech_inst_slug')
  } catch {
    return null
  }
}

function currentUserId(): string | null {
  try {
    return sessionStorage.getItem('edutech_user_id')
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Hydration: folder files → localStorage → live stores
// ---------------------------------------------------------------------------

async function hydrateFromVault(): Promise<number> {
  if (!handle) return 0
  const slug = currentSlug()
  if (!slug) return 0

  const files = await listJsonFiles(handle, [slug])
  let applied = 0
  for (const file of files) {
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
    applied++
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
  try {
    await writeTextFile(handle, path, prettifyJson(json))
    fileContentCache.set(path, json)
    fileMtimeCache.delete(path) // force watcher to accept our own write
    ownWriteAt.set(path, Date.now())
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
// External-change watcher: files edited by hand → live stores
// ---------------------------------------------------------------------------

async function watchTick(): Promise<void> {
  if (!handle || typeof document === 'undefined' || document.visibilityState !== 'visible') return
  const slug = currentSlug()
  if (!slug) return

  let changed = false
  const files = await listJsonFiles(handle, [slug])
  for (const file of files) {
    const knownMtime = fileMtimeCache.get(file.path)
    if (knownMtime === file.lastModified) continue
    if (Date.now() - (ownWriteAt.get(file.path) ?? 0) < OWN_WRITE_GRACE_MS) {
      fileMtimeCache.set(file.path, file.lastModified)
      continue
    }
    const key = vaultPathToKey(file.path, { slug, userId: currentUserId() })
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
  })
}
