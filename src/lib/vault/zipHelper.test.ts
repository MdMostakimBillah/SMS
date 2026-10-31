import { describe, it, expect } from 'vitest'
import { createBackupZip, extractBackupFromZip, parseDataUrl } from './zipHelper'
import JSZip from 'jszip'
import type { BackupBundle } from '../backup'

describe('zipHelper', () => {
  it('parses base64 data URLs correctly', () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const parsed = parseDataUrl(png)
    expect(parsed?.ext).toBe('png')
    expect(parsed?.mime).toBe('image/png')
    expect(parsed?.base64.length).toBeGreaterThan(10)

    expect(parseDataUrl('not-a-data-url')).toBeNull()
  })

  it('packages full stores and extracts local images into images/ folder in the zip', async () => {
    const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const bundle: BackupBundle = {
      metadata: {
        app: 'EduTech SMS',
        version: '2.0.0',
        slug: 'test-school',
        exportedAt: '2026-10-31T12:00:00.000Z',
        counts: { classes: 1, teachers: 1, students: 1, exams: 0, departments: 0, subjects: 0 },
      },
      stores: {
        'edutech-classes': {
          institution: {
            name: 'Local Test School',
            storageMode: 'local_computer',
            logo: samplePng,
            banner: samplePng,
          },
        },
        'edutech-teachers': {
          teachers: [
            { id: 'tch-1', nameEn: 'John Doe', photo: samplePng, signature: samplePng },
          ],
        },
        'edutech-admissions': {
          students: [
            { id: 'std-1', nameEn: 'Alice Student', photo: samplePng },
          ],
        },
      },
    }

    const zipBlob = await createBackupZip(bundle)
    expect(zipBlob.type).toBe('application/zip')
    expect(zipBlob.size).toBeGreaterThan(0)

    // Inspect files inside zip
    const zip = await JSZip.loadAsync(zipBlob)
    expect(zip.file('backup.json')).not.toBeNull()
    expect(zip.file('images/logo.png')).not.toBeNull()
    expect(zip.file('images/banner.png')).not.toBeNull()
    expect(zip.file('images/teachers/tch-1_photo.png')).not.toBeNull()
    expect(zip.file('images/teachers/tch-1_signature.png')).not.toBeNull()
    expect(zip.file('images/students/std-1_photo.png')).not.toBeNull()

    // Test extraction
    const extractedJson = await extractBackupFromZip(zipBlob)
    const extractedBundle = JSON.parse(extractedJson)
    expect(extractedBundle.metadata.slug).toBe('test-school')
    expect(extractedBundle.stores['edutech-classes'].institution.name).toBe('Local Test School')
  })
})
