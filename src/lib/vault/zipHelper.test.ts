import { describe, it, expect } from 'vitest'
import { createBackupZip, extractBackupFromZip, parseDataUrl } from './zipHelper'
import JSZip from 'jszip'
import type { BackupBundle } from '../backup'
import type { VfsDirectoryHandle } from './fsAccess'

describe('zipHelper', () => {
  it('parses base64 data URLs correctly', () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const parsed = parseDataUrl(png)
    expect(parsed?.ext).toBe('png')
    expect(parsed?.mime).toBe('image/png')
    expect(parsed?.base64.length).toBeGreaterThan(10)

    expect(parseDataUrl('not-a-data-url')).toBeNull()
  })

  it('packages individual store files (classes.json, students.json, teachers.json) and extracts local images into images/ folder', async () => {
    const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const bundle: BackupBundle = {
      metadata: {
        app: 'EduTech SMS',
        version: '2.0.0',
        slug: 'test-school',
        exportedAt: '2026-10-31T12:00:00.000Z',
        counts: { classes: 1, teachers: 1, students: 1, exams: 0, departments: 1, subjects: 1 },
      },
      stores: {
        'edutech-classes': {
          institution: {
            name: 'Local Test School',
            storageMode: 'local_computer',
            logo: samplePng,
            banner: samplePng,
          },
          classes: [{ id: 'cls-1', name: 'Class 1' }],
          routines: [{ classId: 'cls-1', periodDuration: 40 }],
          departments: [{ id: 'dept-1', name: 'Science' }],
          subjects: [{ id: 'sub-1', name: 'Physics' }],
        },
        'edutech-teachers': {
          teachers: [
            { id: 'ET0001', nameEn: 'John Doe', photo: samplePng, signature: samplePng },
          ],
          designations: [{ id: 'des-1', name: 'Senior Teacher' }],
        },
        'edutech-admissions': {
          students: [
            { id: '2026-0001', nameEn: 'Alice Student', photo: samplePng },
          ],
        },
      },
    }

    const zipBlob = await createBackupZip(bundle)
    expect(zipBlob.type).toBe('application/zip')
    expect(zipBlob.size).toBeGreaterThan(0)

    // Inspect files inside zip — must contain ALL individual JSON files and images folder!
    const zip = await JSZip.loadAsync(zipBlob)
    expect(zip.file('backup.json')).not.toBeNull()
    expect(zip.file('classes.json')).not.toBeNull()
    expect(zip.file('routines.json')).not.toBeNull()
    expect(zip.file('teachers.json')).not.toBeNull()
    expect(zip.file('students.json')).not.toBeNull()
    expect(zip.file('admissions.json')).not.toBeNull()
    expect(zip.file('departments.json')).not.toBeNull()
    expect(zip.file('subjects.json')).not.toBeNull()
    expect(zip.file('designations.json')).not.toBeNull()

    // Inspect image files
    expect(zip.file('images/logo.png')).not.toBeNull()
    expect(zip.file('images/banner.png')).not.toBeNull()
    expect(zip.file('images/teachers/ET0001_photo.png')).not.toBeNull()
    expect(zip.file('images/teachers/ET0001.png')).not.toBeNull()
    expect(zip.file('images/teachers/ET0001_signature.png')).not.toBeNull()
    expect(zip.file('images/students/2026-0001_photo.png')).not.toBeNull()
    expect(zip.file('images/students/2026-0001.png')).not.toBeNull()

    // Test extraction
    const extractedJson = await extractBackupFromZip(zipBlob)
    const extractedBundle = JSON.parse(extractedJson)
    expect(extractedBundle.metadata.slug).toBe('test-school')
    expect(extractedBundle.stores['edutech-classes'].institution.name).toBe('Local Test School')
  })

  it('reads directly from local PC vault directory handle when connected', async () => {
    // Create an in-memory mock directory handle
    const diskFiles = new Map<string, { kind: 'file'; content: string | Uint8Array }>()
    diskFiles.set('my-school/classes.json', { kind: 'file', content: JSON.stringify({ classes: [{ id: 'cls-from-disk' }] }) })
    diskFiles.set('my-school/students.json', { kind: 'file', content: JSON.stringify({ students: [{ id: 'std-from-disk' }] }) })
    diskFiles.set('my-school/images/teachers/ET9999.png', { kind: 'file', content: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) })

    function makeMockHandle(prefix = ''): VfsDirectoryHandle {
      return {
        kind: 'directory',
        name: prefix ? prefix.split('/').pop()! : 'root',
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted',
        async getDirectoryHandle(name: string) {
          const subPrefix = prefix ? `${prefix}/${name}` : name
          return makeMockHandle(subPrefix)
        },
        async getFileHandle(name: string) {
          const filePath = prefix ? `${prefix}/${name}` : name
          const item = diskFiles.get(filePath)
          if (!item) throw new Error(`Not found: ${filePath}`)
          return {
            kind: 'file',
            name,
            getFile: async () => {
              const buffer = typeof item.content === 'string'
                ? new TextEncoder().encode(item.content).buffer
                : item.content.buffer
              return {
                name,
                size: buffer.byteLength,
                lastModified: Date.now(),
                text: async () => (typeof item.content === 'string' ? item.content : new TextDecoder().decode(item.content)),
                arrayBuffer: async () => buffer,
              } as unknown as File
            },
            createWritable: async () => ({
              write: async () => {},
              close: async () => {},
            } as any),
          }
        },
        async *values() {
          const directEntries = new Map<string, 'file' | 'directory'>()
          for (const key of diskFiles.keys()) {
            if (prefix && !key.startsWith(`${prefix}/`)) continue
            const relative = prefix ? key.slice(prefix.length + 1) : key
            const parts = relative.split('/')
            if (parts.length === 1) {
              directEntries.set(parts[0], 'file')
            } else {
              directEntries.set(parts[0], 'directory')
            }
          }
          for (const [name, kind] of directEntries.entries()) {
            if (kind === 'file') {
              const full = prefix ? `${prefix}/${name}` : name
              const it = diskFiles.get(full)!
              yield {
                kind: 'file',
                name,
                getFile: async () => {
                  const buf = typeof it.content === 'string'
                    ? new TextEncoder().encode(it.content).buffer
                    : it.content.buffer
                  return {
                    name,
                    size: buf.byteLength,
                    lastModified: Date.now(),
                    text: async () => (typeof it.content === 'string' ? it.content : new TextDecoder().decode(it.content)),
                    arrayBuffer: async () => buf,
                  } as unknown as File
                },
                createWritable: async () => ({ write: async () => {}, close: async () => {} } as any),
              }
            } else {
              const sub = prefix ? `${prefix}/${name}` : name
              yield makeMockHandle(sub)
            }
          }
        },
      }
    }

    const mockVault = makeMockHandle('')
    const minimalBundle: BackupBundle = {
      metadata: {
        app: 'EduTech SMS',
        version: '2.0.0',
        slug: 'my-school',
        exportedAt: new Date().toISOString(),
        counts: { classes: 0, teachers: 0, students: 0, exams: 0, departments: 0, subjects: 0 },
      },
      stores: {},
    }

    const zipBlob = await createBackupZip(minimalBundle, { vaultHandle: mockVault, slug: 'my-school' })
    const zip = await JSZip.loadAsync(zipBlob)

    // Verify files were read directly from local PC vault directory!
    expect(zip.file('classes.json')).not.toBeNull()
    const classesContent = await zip.file('classes.json')!.async('text')
    expect(classesContent).toContain('cls-from-disk')

    expect(zip.file('students.json')).not.toBeNull()
    const studentsContent = await zip.file('students.json')!.async('text')
    expect(studentsContent).toContain('std-from-disk')

    expect(zip.file('images/teachers/ET9999.png')).not.toBeNull()
  })

  it('reconstructs BackupBundle from individual files if backup.json is missing in ZIP', async () => {
    const rawZip = new JSZip()
    rawZip.file('classes.json', JSON.stringify({ classes: [{ id: 'c1', name: 'Class 1' }] }))
    rawZip.file('teachers.json', JSON.stringify({ teachers: [{ id: 'ET0001', nameEn: 'Mr. Smith' }] }))
    rawZip.file('students.json', JSON.stringify({ students: [{ id: 'S1', nameEn: 'John Doe' }] }))
    const rawZipBlob = await rawZip.generateAsync({ type: 'blob' })

    const extractedJson = await extractBackupFromZip(rawZipBlob)
    const bundle = JSON.parse(extractedJson) as BackupBundle

    expect(bundle.metadata).toBeDefined()
    expect(bundle.metadata.counts.classes).toBe(1)
    expect(bundle.metadata.counts.teachers).toBe(1)
    expect(bundle.metadata.counts.students).toBe(1)
    expect(bundle.stores['edutech-classes'].classes[0].id).toBe('c1')
    expect(bundle.stores['edutech-teachers'].teachers[0].id).toBe('ET0001')
    expect(bundle.stores['edutech-admissions'].students[0].id).toBe('S1')
  })
})
