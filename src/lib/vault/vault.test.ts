import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  vaultConnectFolder,
  vaultDisconnect,
  vaultSyncNow,
  getVaultStatus,
  flushVaultWrites,
  watchTick,
} from './vault'
import { notifyVaultWrite, registerReloadRequester } from './bridge'
import {
  pickDirectory,
  readTextFile,
  writeTextFile,
  deleteTextFile,
  writeBinaryFile,
  readBinaryFile,
  listJsonFiles,
  listAllVaultFiles,
  __reset as resetVaultFS,
} from './fsAccess'

// The File System Access API is Chromium-only; mock it with an in-memory FS so
// we can test Mode C (local-first browser sync) in jsdom.
const pickHandle = { kind: 'directory', name: 'demo-folder' }

vi.mock('./fsAccess', () => {
  const fsNodes = new Map()
  let savedHandle: any = null

  function node(handle: any) {
    let n = fsNodes.get(handle)
    if (!n) {
      n = { dirs: new Map(), files: new Map() }
      fsNodes.set(handle, n)
    }
    return n
  }

  async function resolveDir(handle: any, segments: string[], create: boolean) {
    let dir = handle
    for (const seg of segments) {
      const n = node(dir)
      let child = n.dirs.get(seg)
      if (!child) {
        if (!create) throw new Error('not found')
        child = { kind: 'directory', name: seg }
        n.dirs.set(seg, child)
        fsNodes.set(child, { dirs: new Map(), files: new Map() })
      }
      dir = child
    }
    return dir
  }

  const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']

  return {
    isVaultSupported: () => true,
    pickDirectory: vi.fn(),
    hasPermission: async () => true,
    requestPermission: async () => 'granted',
    saveVaultHandle: async (h: any) => {
      savedHandle = h
    },
    loadVaultHandle: async () => savedHandle,
    clearVaultHandle: async () => {
      savedHandle = null
    },
    writeTextFile: async (root: any, path: string, content: string) => {
      const segments = path.split('/').filter(Boolean)
      const filename = segments.pop()!
      const dir = await resolveDir(root, segments, true)
      node(dir).files.set(filename, { content, mtime: Date.now() })
    },
    readTextFile: async (root: any, path: string): Promise<string | null> => {
      const segments = path.split('/').filter(Boolean)
      const filename = segments.pop()!
      if (!filename) return null
      try {
        const dir = await resolveDir(root, segments, false)
        const file = node(dir).files.get(filename)
        if (!file) return null
        return typeof file.content === 'string' ? file.content : null
      } catch {
        return null
      }
    },
    writeBinaryFile: async (root: any, path: string, data: Uint8Array) => {
      const segments = path.split('/').filter(Boolean)
      const filename = segments.pop()!
      const dir = await resolveDir(root, segments, true)
      node(dir).files.set(filename, { content: data, mtime: Date.now() })
    },
    readBinaryFile: async (root: any, path: string): Promise<Uint8Array | null> => {
      const segments = path.split('/').filter(Boolean)
      const filename = segments.pop()!
      if (!filename) return null
      try {
        const dir = await resolveDir(root, segments, false)
        const file = node(dir).files.get(filename)
        if (!file) return null
        if (file.content instanceof Uint8Array) return file.content
        if (typeof file.content === 'string') return new TextEncoder().encode(file.content)
        return null
      } catch {
        return null
      }
    },
    deleteTextFile: async (root: any, path: string) => {
      const segments = path.split('/').filter(Boolean)
      const filename = segments.pop()!
      if (!filename) return
      try {
        const dir = await resolveDir(root, segments, false)
        node(dir).files.delete(filename)
      } catch {
        /* ignore */
      }
    },
    isImageFileName: (name: string) => {
      const lower = name.toLowerCase()
      return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
    },
    listAllVaultFiles: async (root: any, prefixSegments: string[] = []) => {
      const results: Array<{ path: string; lastModified: number; size: number }> = []
      try {
        const dir = await resolveDir(root, prefixSegments, false)
        const walk = async (current: any, parts: string[]) => {
          const n = node(current)
          for (const [name, file] of n.files) {
            const isJson = name.endsWith('.json')
            const isImg = IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext))
            if (isJson || isImg) {
              const len = file.content instanceof Uint8Array ? file.content.byteLength : file.content.length
              results.push({ path: [...parts, name].join('/'), lastModified: file.mtime, size: len })
            }
          }
          for (const [name, child] of n.dirs) {
            await walk(child, [...parts, name])
          }
        }
        await walk(dir, [...prefixSegments])
      } catch {
        /* directory does not exist yet */
      }
      return results
    },
    listJsonFiles: async (root: any, prefixSegments: string[] = []) => {
      const results: Array<{ path: string; lastModified: number; size: number }> = []
      try {
        const dir = await resolveDir(root, prefixSegments, false)
        const walk = async (current: any, parts: string[]) => {
          const n = node(current)
          for (const [name, file] of n.files) {
            if (name.endsWith('.json')) {
              results.push({ path: [...parts, name].join('/'), lastModified: file.mtime, size: file.content.length })
            }
          }
          for (const [name, child] of n.dirs) {
            await walk(child, [...parts, name])
          }
        }
        await walk(dir, [...prefixSegments])
      } catch {
        /* directory does not exist yet */
      }
      return results
    },
    __reset: () => {
      fsNodes.clear()
      savedHandle = null
    },
  }
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

beforeEach(() => {
  resetVaultFS()
  sessionStorage.setItem('edutech_inst_slug', 'demo')
  sessionStorage.setItem('edutech_user_id', 'u1')
  localStorage.clear()
  ;(pickDirectory as any).mockResolvedValue(pickHandle)
})

afterEach(async () => {
  await vaultDisconnect()
  sessionStorage.removeItem('edutech_inst_slug')
  sessionStorage.removeItem('edutech_user_id')
  localStorage.clear()
})

describe('vault — Mode C (local-first browser sync)', () => {
  it('connects to a folder and reports connected status', async () => {
    await vaultConnectFolder()
    const status = getVaultStatus()
    expect(status.supported).toBe(true)
    expect(status.connected).toBe(true)
    expect(status.folderName).toBe('demo-folder')
    expect(status.needsReconnect).toBe(false)
  })

  it('seeds localStorage into folder files on sync (including images)', async () => {
    await vaultConnectFolder()
    localStorage.setItem(
      'edutech-classes_demo',
      JSON.stringify({
        state: {
          classes: [{ id: 1 }],
          institution: { logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
        },
        version: 0,
      })
    )
    localStorage.setItem('edutech-exams_demo', JSON.stringify({ state: { exams: [] }, version: 0 }))

    await vaultSyncNow()

    const classes = await readTextFile(pickHandle, 'demo/classes.json')
    const exams = await readTextFile(pickHandle, 'demo/exams.json')
    expect(classes).toContain('"id": 1')
    expect(JSON.parse(exams!)).toEqual({ state: { exams: [] }, version: 0 })
    expect(getVaultStatus().lastSyncAt).toBeTruthy()

    // Verifies binary image was written to demo/images/logo.png
    const logoBytes = await readBinaryFile(pickHandle, 'demo/images/logo.png')
    expect(logoBytes).not.toBeNull()
    expect(logoBytes!.byteLength).toBeGreaterThan(0)
  })

  it('mirrors store writes to files within the debounce window', async () => {
    await vaultConnectFolder()
    registerReloadRequester(() => undefined)

    const json = JSON.stringify({ state: { classes: [{ id: 2 }] }, version: 0 })
    notifyVaultWrite('edutech-classes_demo', json)
    await flushVaultWrites()

    const content = await readTextFile(pickHandle, 'demo/classes.json')
    expect(JSON.parse(content!)).toEqual({ state: { classes: [{ id: 2 }] }, version: 0 })
  })

  it('pulls hand-edits from files back into localStorage and reloads stores', async () => {
    await vaultConnectFolder()

    let reloads = 0
    registerReloadRequester(() => {
      reloads++
    })

    // Seed a file the app already has in localStorage
    localStorage.setItem(
      'edutech-classes_demo',
      JSON.stringify({ state: { classes: [{ id: 1 }] }, version: 0 })
    )

    // Hand-edit the file on disk with newer content
    await writeTextFile(
      pickHandle,
      'demo/classes.json',
      JSON.stringify({ state: { classes: [{ id: 99 }] }, version: 0 })
    )

    // Wait past the watcher interval and grace period
    await sleep(4200)
    await watchTick()

    expect(localStorage.getItem('edutech-classes_demo')).toContain('"id":99')
    expect(reloads).toBeGreaterThan(0)
  }, 15000)

  it('deletes data from localStorage and triggers store reload when a JSON file is deleted on disk', async () => {
    await vaultConnectFolder()

    let reloads = 0
    registerReloadRequester(() => {
      reloads++
    })

    // App has classes and teachers stored
    localStorage.setItem(
      'edutech-classes_demo',
      JSON.stringify({ state: { classes: [{ id: 10 }] }, version: 0 })
    )
    localStorage.setItem(
      'edutech-teachers_demo',
      JSON.stringify({ state: { teachers: [{ id: 'TCH-1', nameEn: 'John' }] }, version: 0 })
    )

    await vaultSyncNow()
    expect(await readTextFile(pickHandle, 'demo/classes.json')).toBeTruthy()
    expect(await readTextFile(pickHandle, 'demo/teachers.json')).toBeTruthy()

    // User deletes classes.json directly from disk
    await deleteTextFile(pickHandle, 'demo/classes.json')

    // Watcher tick triggers
    await watchTick()

    // edutech-classes_demo is removed from localStorage!
    expect(localStorage.getItem('edutech-classes_demo')).toBeNull()
    // edutech-teachers_demo remains untouched
    expect(localStorage.getItem('edutech-teachers_demo')).toBeTruthy()
    // Stores were reloaded so live app resets classes
    expect(reloads).toBeGreaterThan(0)
  })

  it('clears images from localStorage and triggers reload when an image file is deleted on disk', async () => {
    await vaultConnectFolder()

    let reloads = 0
    registerReloadRequester(() => {
      reloads++
    })

    // Institution with logo and teacher with photo
    const sampleDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    localStorage.setItem(
      'edutech-classes_demo',
      JSON.stringify({
        state: { institution: { name: 'Demo School', logo: sampleDataUrl } },
        version: 0,
      })
    )
    localStorage.setItem(
      'edutech-teachers_demo',
      JSON.stringify({
        state: { teachers: [{ id: 'T-100', nameEn: 'Alice', photo: sampleDataUrl }] },
        version: 0,
      })
    )

    await vaultSyncNow()
    expect(await readBinaryFile(pickHandle, 'demo/images/logo.png')).not.toBeNull()
    expect(await readBinaryFile(pickHandle, 'demo/images/teachers/T-100_photo.png')).not.toBeNull()

    // User deletes logo.png from disk
    await deleteTextFile(pickHandle, 'demo/images/logo.png')

    // Watcher tick runs
    await watchTick()

    const classStoreRaw = localStorage.getItem('edutech-classes_demo')
    const parsedClass = JSON.parse(classStoreRaw!)
    // Logo should now be cleared in the store
    expect(parsedClass.state.institution.logo).toBe('')
    expect(reloads).toBeGreaterThan(0)
  })

  it('loads updated image file from disk and reflects in localStorage and store reload', async () => {
    await vaultConnectFolder()

    let reloads = 0
    registerReloadRequester(() => {
      reloads++
    })

    localStorage.setItem(
      'edutech-classes_demo',
      JSON.stringify({
        state: { institution: { name: 'Demo School', logo: '' } },
        version: 0,
      })
    )
    await vaultSyncNow()

    // External user drops a new logo.png into demo/images/logo.png
    const newBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])
    // Wait past own write grace ms
    await sleep(4200)
    await writeBinaryFile(pickHandle, 'demo/images/logo.png', newBytes)

    await watchTick()

    const classStoreRaw = localStorage.getItem('edutech-classes_demo')
    const parsedClass = JSON.parse(classStoreRaw!)
    expect(parsedClass.state.institution.logo).toContain('data:image/png;base64,')
    expect(reloads).toBeGreaterThan(0)
  }, 10000)

  it('disconnects and clears status', async () => {
    await vaultConnectFolder()
    await vaultDisconnect()
    const status = getVaultStatus()
    expect(status.connected).toBe(false)
    expect(status.folderName).toBe(null)
  })
})
