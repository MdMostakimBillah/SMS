import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  vaultConnectFolder,
  vaultDisconnect,
  vaultSyncNow,
  getVaultStatus,
  flushVaultWrites,
} from './vault'
import { notifyVaultWrite, registerReloadRequester } from './bridge'
import { pickDirectory, readTextFile, writeTextFile, listJsonFiles, __reset as resetVaultFS } from './fsAccess'

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
        return file ? file.content : null
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
    listJsonFiles: async (root: any, prefixSegments: string[] = []) => {
      const results: Array<{ path: string; lastModified: number; size: number }> = []
      try {
        let dir = await resolveDir(root, prefixSegments, false)
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

  it('seeds localStorage into folder files on sync', async () => {
    await vaultConnectFolder()
    localStorage.setItem('edutech-classes_demo', JSON.stringify({ state: { classes: [{ id: 1 }] }, version: 0 }))
    localStorage.setItem('edutech-exams_demo', JSON.stringify({ state: { exams: [] }, version: 0 }))

    await vaultSyncNow()

    const classes = await readTextFile(pickHandle, 'demo/classes.json')
    const exams = await readTextFile(pickHandle, 'demo/exams.json')
    expect(JSON.parse(classes!)).toEqual({ state: { classes: [{ id: 1 }] }, version: 0 })
    expect(JSON.parse(exams!)).toEqual({ state: { exams: [] }, version: 0 })
    expect(getVaultStatus().lastSyncAt).toBeTruthy()
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

    // Wait past the 5s watcher interval so the external edit is pulled back
    await sleep(6000)

    expect(localStorage.getItem('edutech-classes_demo')).toContain('"id":99')
    expect(reloads).toBeGreaterThan(0)
  }, 15000)

  it('disconnects and clears status', async () => {
    await vaultConnectFolder()
    await vaultDisconnect()
    const status = getVaultStatus()
    expect(status.connected).toBe(false)
    expect(status.folderName).toBe(null)
  })
})
