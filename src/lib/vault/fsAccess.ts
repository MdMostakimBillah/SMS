/**
 * Minimal typed wrapper around the File System Access API (Chromium only).
 *
 * Handles are stored in IndexedDB so the granted folder survives restarts;
 * the browser then only asks for a one-click permission re-grant instead of
 * a full folder re-pick.
 */

export interface VfsFileHandle {
  kind: 'file'
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
}

export interface VfsDirectoryHandle {
  kind: 'directory'
  name: string
  queryPermission?: (desc: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (desc: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
  getDirectoryHandle: (
    name: string,
    opts?: { create?: boolean },
  ) => Promise<VfsDirectoryHandle>
  getFileHandle: (
    name: string,
    opts?: { create?: boolean },
  ) => Promise<VfsFileHandle>
  values(): AsyncIterableIterator<VfsDirectoryHandle | VfsFileHandle>
  removeEntry?: (name: string, opts?: { recursive?: boolean }) => Promise<void>
}

type DirectoryPickerFn = (opts?: {
  id?: string
  mode?: 'read' | 'readwrite'
}) => Promise<VfsDirectoryHandle>

export function isVaultSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

function getPicker(): DirectoryPickerFn | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { showDirectoryPicker?: DirectoryPickerFn }).showDirectoryPicker ?? null
}

export async function pickDirectory(): Promise<VfsDirectoryHandle> {
  const picker = getPicker()
  if (!picker) throw new Error('File System Access API is not available in this browser')
  return picker({ id: 'edutech-vault', mode: 'readwrite' })
}

/** true when the handle currently has readwrite access without prompting. */
export async function hasPermission(handle: VfsDirectoryHandle): Promise<boolean> {
  if (!handle.queryPermission) return true
  const state = await handle.queryPermission({ mode: 'readwrite' })
  return state === 'granted'
}

/** Ask the user to (re)grant access. Must be called from a user gesture. */
export async function requestPermission(handle: VfsDirectoryHandle): Promise<boolean> {
  if (!handle.requestPermission) return true
  const state = await handle.requestPermission({ mode: 'readwrite' })
  return state === 'granted'
}

// ---------------------------------------------------------------------------
// IndexedDB persistence of the directory handle
// ---------------------------------------------------------------------------

const DB_NAME = 'edutech-vault'
const STORE = 'handles'
const HANDLE_KEY = 'directory'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveVaultHandle(handle: VfsDirectoryHandle): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(handle, HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function loadVaultHandle(): Promise<VfsDirectoryHandle | null> {
  try {
    const db = await openDb()
    try {
      return await new Promise<VfsDirectoryHandle | null>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(HANDLE_KEY)
        req.onsuccess = () => resolve((req.result as VfsDirectoryHandle) ?? null)
        req.onerror = () => reject(req.error)
      })
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

export async function clearVaultHandle(): Promise<void> {
  try {
    const db = await openDb()
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete(HANDLE_KEY)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } finally {
      db.close()
    }
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Path-based file IO inside the granted directory
// ---------------------------------------------------------------------------

async function walkToParent(
  root: VfsDirectoryHandle,
  segments: string[],
): Promise<VfsDirectoryHandle> {
  let dir = root
  for (const segment of segments) {
    dir = await dir.getDirectoryHandle(segment, { create: true })
  }
  return dir
}

export async function writeTextFile(
  root: VfsDirectoryHandle,
  path: string,
  content: string,
): Promise<void> {
  const segments = path.split('/').filter(Boolean)
  const filename = segments.pop()
  if (!filename) throw new Error(`Invalid vault path: ${path}`)
  const dir = await walkToParent(root, segments)
  const fileHandle = await dir.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function readTextFile(
  root: VfsDirectoryHandle,
  path: string,
): Promise<string | null> {
  const segments = path.split('/').filter(Boolean)
  const filename = segments.pop()
  if (!filename) return null
  try {
    let dir = root
    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment)
    }
    const fileHandle = await dir.getFileHandle(filename)
    const file = await fileHandle.getFile()
    return await file.text()
  } catch {
    return null
  }
}

export async function deleteTextFile(
  root: VfsDirectoryHandle,
  path: string,
): Promise<void> {
  const segments = path.split('/').filter(Boolean)
  const filename = segments.pop()
  if (!filename) return
  try {
    let dir = root
    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment)
    }
    if (dir.removeEntry) await dir.removeEntry(filename)
  } catch {
    /* file may not exist — nothing to delete */
  }
}

export async function writeBinaryFile(
  root: VfsDirectoryHandle,
  path: string,
  data: Uint8Array | Blob | ArrayBuffer,
): Promise<void> {
  const segments = path.split('/').filter(Boolean)
  const filename = segments.pop()
  if (!filename) throw new Error(`Invalid vault path: ${path}`)
  const dir = await walkToParent(root, segments)
  const fileHandle = await dir.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(data as any)
  await writable.close()
}

export async function readBinaryFile(
  root: VfsDirectoryHandle,
  path: string,
): Promise<Uint8Array | null> {
  const segments = path.split('/').filter(Boolean)
  const filename = segments.pop()
  if (!filename) return null
  try {
    let dir = root
    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment)
    }
    const fileHandle = await dir.getFileHandle(filename)
    const file = await fileHandle.getFile()
    const buffer = await file.arrayBuffer()
    return new Uint8Array(buffer)
  } catch {
    return null
  }
}

export const deleteVaultFile = deleteTextFile

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']

export function isImageFileName(name: string): boolean {
  const lower = name.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export interface VaultFileInfo {
  path: string
  lastModified: number
  size: number
}

/** Recursively list every .json and image file with its mtime (for external-change watching). */
export async function listAllVaultFiles(
  root: VfsDirectoryHandle,
  prefixSegments: string[] = [],
): Promise<VaultFileInfo[]> {
  const results: VaultFileInfo[] = []
  let dir = root
  for (const segment of prefixSegments) {
    try {
      dir = await dir.getDirectoryHandle(segment)
    } catch {
      return results
    }
  }

  const walk = async (current: VfsDirectoryHandle, parts: string[]): Promise<void> => {
    for await (const entry of current.values()) {
      if (entry.kind === 'file') {
        const lower = entry.name.toLowerCase()
        if (lower.endsWith('.json') || isImageFileName(entry.name)) {
          try {
            const file = await (entry as VfsFileHandle).getFile()
            results.push({
              path: [...parts, entry.name].join('/'),
              lastModified: file.lastModified,
              size: file.size,
            })
          } catch {
            /* unreadable file — skip */
          }
        }
      } else if (entry.kind === 'directory') {
        await walk(entry as VfsDirectoryHandle, [...parts, entry.name])
      }
    }
  }

  await walk(dir, prefixSegments)
  return results
}

/** Recursively list every .json file with its mtime (for external-change watching). */
export async function listJsonFiles(
  root: VfsDirectoryHandle,
  prefixSegments: string[] = [],
): Promise<VaultFileInfo[]> {
  const all = await listAllVaultFiles(root, prefixSegments)
  return all.filter((f) => f.path.endsWith('.json'))
}
