import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  vaultInit,
  vaultConnectFolder,
  vaultReconnect,
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

  it('pulls manual students.json edits and direct student image from disk into admissions store', async () => {
    await vaultConnectFolder()

    let reloads = 0
    registerReloadRequester(() => {
      reloads++
    })

    // 1. User writes students directly into demo/students.json as array
    await writeTextFile(
      pickHandle,
      'demo/students.json',
      JSON.stringify([
        { id: 'ET-2026-00001', nameEn: 'Manual Student', class: 'Ten', roll: '01' },
      ])
    )

    await sleep(4200)
    await watchTick()

    const rawAdmissions = localStorage.getItem('edutech-admissions_demo')
    expect(rawAdmissions).toBeTruthy()
    const parsed = JSON.parse(rawAdmissions!)
    expect(parsed.state).toBeDefined()
    expect(parsed.state.students).toHaveLength(1)
    expect(parsed.state.students[0].nameEn).toBe('Manual Student')
    expect(reloads).toBeGreaterThan(0)

    // 2. User drops direct photo ET-2026-00001.png
    const photoBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 5, 6, 7])
    await writeBinaryFile(pickHandle, 'demo/images/students/ET-2026-00001.png', photoBytes)
    await watchTick()

    const updatedRaw = localStorage.getItem('edutech-admissions_demo')
    const updatedParsed = JSON.parse(updatedRaw!)
    expect(updatedParsed.state.students[0].photo).toContain('data:image/png;base64,')
  }, 12000)

  it('writes classes instantly to disk at both {slug}/classes.json and root classes.json', async () => {
    await vaultConnectFolder()
    registerReloadRequester(() => undefined)

    const json = JSON.stringify({
      state: {
        classes: [
          {
            id: 'CLS-01',
            name: 'Class 1',
            nameBn: 'শ্রেণি ১',
            sections: [{ id: 'SEC-CLS-01-A', name: 'A', seatQuantity: 40 }],
          },
        ],
        routines: [{ classId: 'CLS-01', sectionId: 'SEC-CLS-01-A', periodDuration: 40 }],
      },
      version: 7,
    })

    notifyVaultWrite('edutech-classes_demo', json)
    await flushVaultWrites()

    const slugClasses = await readTextFile(pickHandle, 'demo/classes.json')
    expect(slugClasses).toContain('Class 1')
    expect(slugClasses).toContain('SEC-CLS-01-A')

    const rootClasses = await readTextFile(pickHandle, 'classes.json')
    expect(rootClasses).toContain('Class 1')
    expect(rootClasses).toContain('SEC-CLS-01-A')

    const slugRoutines = await readTextFile(pickHandle, 'demo/routines.json')
    expect(slugRoutines).toContain('CLS-01')

    const rootRoutines = await readTextFile(pickHandle, 'routines.json')
    expect(rootRoutines).toContain('CLS-01')

    const slugSections = await readTextFile(pickHandle, 'demo/sections.json')
    expect(slugSections).toContain('SEC-CLS-01-A')

    const rootSections = await readTextFile(pickHandle, 'sections.json')
    expect(rootSections).toContain('SEC-CLS-01-A')
  })

  it('writes teachers and individual files instantly to disk (departments, subjects, designations)', async () => {
    await vaultConnectFolder()
    registerReloadRequester(() => undefined)

    const json = JSON.stringify({
      state: {
        teachers: [{ id: 'ET0001', nameEn: 'John Doe', phone: '01711111111' }],
        departments: [{ id: 'DEP-01', name: 'Science' }],
        subjects: [{ id: 'SUB-01', name: 'Math', code: '101' }],
        designations: [{ id: 'DES-01', title: 'Principal' }],
      },
      version: 0,
    })

    notifyVaultWrite('edutech-teachers_demo', json)
    await flushVaultWrites()

    expect(await readTextFile(pickHandle, 'demo/teachers.json')).toContain('ET0001')
    expect(await readTextFile(pickHandle, 'teachers.json')).toContain('ET0001')

    const slugDepts = await readTextFile(pickHandle, 'demo/departments.json')
    expect(slugDepts).toContain('Science')
    const rootDepts = await readTextFile(pickHandle, 'departments.json')
    expect(rootDepts).toContain('Science')

    const slugSubs = await readTextFile(pickHandle, 'demo/subjects.json')
    expect(slugSubs).toContain('Math')
    const rootSubs = await readTextFile(pickHandle, 'subjects.json')
    expect(rootSubs).toContain('Math')

    const slugDes = await readTextFile(pickHandle, 'demo/designations.json')
    expect(slugDes).toContain('Principal')
    const rootDes = await readTextFile(pickHandle, 'designations.json')
    expect(rootDes).toContain('Principal')
  })

  it('pulls hand-edits from individual departments.json back into teacher store', async () => {
    await vaultConnectFolder()
    let reloads = 0
    registerReloadRequester(() => {
      reloads++
    })

    localStorage.setItem(
      'edutech-teachers_demo',
      JSON.stringify({
        state: {
          teachers: [{ id: 'ET0001', nameEn: 'Main Teacher' }],
          departments: [],
        },
        version: 0,
      })
    )
    await vaultSyncNow()

    // User edits departments.json on disk
    await sleep(4200)
    await writeTextFile(
      pickHandle,
      'departments.json',
      JSON.stringify([{ id: 'DEP-99', name: 'Robotics' }])
    )
    await watchTick()

    const raw = localStorage.getItem('edutech-teachers_demo')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.teachers).toHaveLength(1)
    expect(parsed.state.teachers[0].nameEn).toBe('Main Teacher')
    expect(parsed.state.departments).toHaveLength(1)
    expect(parsed.state.departments[0].name).toBe('Robotics')
    expect(reloads).toBeGreaterThan(0)
  }, 12000)

  it('preserves manually added teacher across reload when both root and scoped files exist', async () => {
    await vaultConnectFolder()

    // 1. Browser sets initial teacher
    localStorage.setItem(
      'edutech-teachers_demo',
      JSON.stringify({
        state: {
          teachers: [{ id: 'ET0001', nameEn: 'Browser Teacher' }],
          departments: [],
          subjects: [],
          designations: [],
        },
        version: 0,
      })
    )
    await vaultSyncNow()

    // Verify both files exist
    expect(await readTextFile(pickHandle, 'demo/teachers.json')).toBeTruthy()
    expect(await readTextFile(pickHandle, 'teachers.json')).toBeTruthy()

    // 2. User manually edits teachers.json on disk to add teacher ET0002
    await sleep(200)
    await writeTextFile(
      pickHandle,
      'teachers.json',
      JSON.stringify([
        { id: 'ET0001', nameEn: 'Browser Teacher' },
        { id: 'ET0002', nameEn: 'Manual Teacher' },
      ])
    )

    // 3. Simulate page reload / vault reconnect (hydrateFromVault)
    await vaultReconnect()

    // Both teachers must be preserved in localStorage and scoped file
    const raw = localStorage.getItem('edutech-teachers_demo')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.teachers).toHaveLength(2)
    expect(parsed.state.teachers.map((t: any) => t.id)).toEqual(['ET0001', 'ET0002'])

    // Twin scoped file must also be updated
    const scopedRaw = await readTextFile(pickHandle, 'demo/teachers.json')
    expect(scopedRaw).toContain('Manual Teacher')
  })

  it('hard refresh / localStorage clear does not wipe local PC files and restores store from disk', async () => {
    await vaultConnectFolder()

    // 1. Existing local files on disk (students, teachers, classes, designations)
    await writeTextFile(
      pickHandle,
      'teachers.json',
      JSON.stringify([
        { id: 'ET0001', nameEn: 'John Doe', designation: 'Senior Teacher' },
        { id: 'ET0002', nameEn: 'Jane Smith', designation: 'Assistant Teacher' },
      ])
    )
    await writeTextFile(
      pickHandle,
      'students.json',
      JSON.stringify([
        { id: 'ST0001', nameEn: 'Alice', class: 'Class 6' },
        { id: 'ST0002', nameEn: 'Bob', class: 'Class 6' },
      ])
    )
    await writeTextFile(
      pickHandle,
      'classes.json',
      JSON.stringify([
        { id: 'CLS-01', name: 'Class 6', sections: [{ id: 'SEC-1', name: 'A' }] },
      ])
    )
    await writeTextFile(
      pickHandle,
      'designations.json',
      JSON.stringify([
        { id: 'DES-01', name: 'Principal' },
        { id: 'DES-02', name: 'Headmaster' },
      ])
    )

    // 2. Simulate browser hard refresh / localStorage cleared
    localStorage.clear()

    // 3. Vault re-hydrates (files win)
    await vaultReconnect()

    // 4. Verify local PC files are completely intact (NOT wiped)
    const teachersOnDisk = await readTextFile(pickHandle, 'teachers.json')
    expect(teachersOnDisk).toContain('John Doe')
    expect(teachersOnDisk).toContain('Jane Smith')

    const studentsOnDisk = await readTextFile(pickHandle, 'students.json')
    expect(studentsOnDisk).toContain('Alice')
    expect(studentsOnDisk).toContain('Bob')

    const classesOnDisk = await readTextFile(pickHandle, 'classes.json')
    expect(classesOnDisk).toContain('Class 6')

    const desOnDisk = await readTextFile(pickHandle, 'designations.json')
    expect(desOnDisk).toContain('Principal')

    // 5. Verify stores were restored from disk files into localStorage
    const tStore = JSON.parse(localStorage.getItem('edutech-teachers_demo') || '{}')
    expect(tStore?.state?.teachers).toHaveLength(2)

    const sStore = JSON.parse(localStorage.getItem('edutech-admissions_demo') || '{}')
    expect(sStore?.state?.students).toHaveLength(2)

    const cStore = JSON.parse(localStorage.getItem('edutech-classes_demo') || '{}')
    expect(cStore?.state?.classes).toHaveLength(1)

    // 6. Simulate unhydrated store attempting an empty write (e.g. startup mount flush)
    // Attempting to write empty classes: []
    localStorage.setItem(
      'edutech-classes_demo',
      JSON.stringify({ state: { classes: [] }, version: 0 })
    )
    // watchTick or flush should refuse to overwrite disk with empty array without explicit user delete
    await watchTick()

    const classesAfterEmptyWrite = await readTextFile(pickHandle, 'classes.json')
    expect(classesAfterEmptyWrite).toContain('Class 6') // Still preserved!
  })

  it('preserves teacher designation data across watchTick cycles without resetting automatically', async () => {
    await vaultConnectFolder()

    // Populate designations file
    await writeTextFile(
      pickHandle,
      'designations.json',
      JSON.stringify([
        { id: 'DES-01', name: 'Senior Teacher', nameBn: 'সিনিয়র শিক্ষক' },
        { id: 'DES-02', name: 'Assistant Teacher', nameBn: 'সহকারী শিক্ষক' },
      ])
    )
    await writeTextFile(
      pickHandle,
      'teachers.json',
      JSON.stringify([
        { id: 'ET0001', nameEn: 'John Doe', designation: 'Senior Teacher' },
      ])
    )

    await vaultReconnect()

    // Verify designations loaded with proper name and title
    const tStore = JSON.parse(localStorage.getItem('edutech-teachers_demo') || '{}')
    expect(tStore?.state?.designations).toHaveLength(2)
    expect(tStore?.state?.designations[0].name).toBe('Senior Teacher')
    expect(tStore?.state?.designations[0].nameBn).toBe('সিনিয়র শিক্ষক')

    // Run multiple watchTick cycles
    await watchTick()
    await watchTick()
    await watchTick()

    // Designations must NOT reset automatically
    const tStoreAfterTicks = JSON.parse(localStorage.getItem('edutech-teachers_demo') || '{}')
    expect(tStoreAfterTicks?.state?.designations).toHaveLength(2)
    expect(tStoreAfterTicks?.state?.designations[0].name).toBe('Senior Teacher')
  })

  it('restores all data on vaultInit even when both localStorage and sessionStorage are completely wiped', async () => {
    await vaultConnectFolder()

    // 1. Setup vault files in scoped tenant directory
    await writeTextFile(
      pickHandle,
      'demo/teachers.json',
      JSON.stringify([{ id: 'ET0001', nameEn: 'John Vault Teacher' }])
    )
    await writeTextFile(
      pickHandle,
      'demo/students.json',
      JSON.stringify([{ id: 'ST0001', nameEn: 'Alice Student' }])
    )
    await writeTextFile(
      pickHandle,
      'demo/classes.json',
      JSON.stringify([{ id: 'CLS-01', name: 'Class 10' }])
    )

    // 2. Clear both localStorage and sessionStorage completely (DevTools Clear site data)
    localStorage.clear()
    sessionStorage.clear()
    expect(sessionStorage.getItem('edutech_inst_slug')).toBeNull()
    expect(localStorage.getItem('edutech_inst_slug')).toBeNull()

    // 3. App restarts and calls vaultInit()
    await vaultInit()

    // 4. Verify slug was auto-discovered from vault
    expect(sessionStorage.getItem('edutech_inst_slug')).toBe('demo')
    expect(localStorage.getItem('edutech_inst_slug')).toBe('demo')

    // 5. Verify stores were fully hydrated from disk files
    const tStore = JSON.parse(localStorage.getItem('edutech-teachers_demo') || '{}')
    expect(tStore?.state?.teachers).toHaveLength(1)
    expect(tStore?.state?.teachers[0].nameEn).toBe('John Vault Teacher')

    const sStore = JSON.parse(localStorage.getItem('edutech-admissions_demo') || '{}')
    expect(sStore?.state?.students).toHaveLength(1)
    expect(sStore?.state?.students[0].nameEn).toBe('Alice Student')

    const cStore = JSON.parse(localStorage.getItem('edutech-classes_demo') || '{}')
    expect(cStore?.state?.classes).toHaveLength(1)
    expect(cStore?.state?.classes[0].name).toBe('Class 10')

    // 6. Verify files on disk remain completely intact
    const teachersOnDisk = await readTextFile(pickHandle, 'demo/teachers.json')
    expect(teachersOnDisk).toContain('John Vault Teacher')
  })

  it('disconnects and clears status', async () => {
    await vaultConnectFolder()
    await vaultDisconnect()
    const status = getVaultStatus()
    expect(status.connected).toBe(false)
    expect(status.folderName).toBe(null)
  })
})
