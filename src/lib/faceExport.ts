import type { RegisteredFace } from '@/hooks/useFaceApi'

const ALGORITHM = 'PBKDF2'
const AES_ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12

interface ExportPayload {
  version: number
  salt: string
  iv: string
  data: string
  exportedAt: string
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: ALGORITHM, salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: AES_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function exportFaces(password: string, faces: RegisteredFace[]): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)
  const json = JSON.stringify(faces)
  const encoded = new TextEncoder().encode(json)
  const encrypted = await crypto.subtle.encrypt({ name: AES_ALGORITHM, iv: iv as BufferSource }, key, encoded)
  const payload: ExportPayload = {
    version: 1,
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(encrypted),
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  return blob
}

export async function importFaces(file: File, password: string): Promise<RegisteredFace[]> {
  const text = await file.text()
  const payload: ExportPayload = JSON.parse(text)
  if (payload.version !== 1) throw new Error('Unsupported export version')
  const salt = new Uint8Array(base64ToArrayBuffer(payload.salt))
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
  const data = base64ToArrayBuffer(payload.data)
  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt({ name: AES_ALGORITHM, iv }, key, data)
  const json = new TextDecoder().decode(decrypted)
  return JSON.parse(json)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function mergeFaces(existing: RegisteredFace[], imported: RegisteredFace[]): RegisteredFace[] {
  const map = new Map(existing.map((f) => [f.staffId, f]))
  for (const face of imported) {
    map.set(face.staffId, face)
  }
  return Array.from(map.values())
}
