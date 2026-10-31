import JSZip from 'jszip'
import type { BackupBundle } from '../backup'

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

/**
 * Creates a complete ZIP archive for local computer backup:
 * - backup.json (All local stores, students, teachers, classes, routines, settings)
 * - images/ (Any locally stored images: institution logo, banner, teacher photos/signatures, student photos)
 */
export async function createBackupZip(bundle: BackupBundle): Promise<Blob> {
  const zip = new JSZip()

  // 1. Primary data payload
  const jsonContent = JSON.stringify(bundle, null, 2)
  zip.file('backup.json', jsonContent)

  // 2. Local images extraction into /images folder
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
        if (parsed && tchFolder) tchFolder.file(`${t.id || 'photo'}_photo.${parsed.ext}`, parsed.base64, { base64: true })
      }
      if (typeof t.signature === 'string') {
        const parsed = parseDataUrl(t.signature)
        if (parsed && tchFolder) tchFolder.file(`${t.id || 'sig'}_signature.${parsed.ext}`, parsed.base64, { base64: true })
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
        if (parsed && stdFolder) stdFolder.file(`${s.id || 'photo'}_photo.${parsed.ext}`, parsed.base64, { base64: true })
      }
    })
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
 */
export async function extractBackupFromZip(data: Blob | ArrayBuffer | Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(data)
  // Look for backup.json or any *.json file in root
  let targetFile = zip.file('backup.json')
  if (!targetFile) {
    const jsonFiles = zip.file(/\.json$/i)
    if (jsonFiles.length > 0) {
      targetFile = jsonFiles[0]
    }
  }

  if (!targetFile) {
    throw new Error('No backup.json found inside the ZIP archive.')
  }

  return targetFile.async('text')
}
