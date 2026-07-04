import type { RegisteredFace } from '@/hooks/useFaceApi'

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const DB_NAME = 'edutech-face-keys'
const DB_STORE = 'crypto-keys'
const DB_VERSION = 1
const KEY_ID = 'face-encryption-key'

function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
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

async function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => resolve(null)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE)
      }
    }
  })
}

async function storeKey(key: CryptoKey): Promise<void> {
  const db = await openDB()
  if (!db) throw new Error('IndexedDB not available')
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    const store = tx.objectStore(DB_STORE)
    const request = store.put(key, KEY_ID)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function retrieveKey(): Promise<CryptoKey | null> {
  const db = await openDB()
  if (!db) return null
  return new Promise((resolve) => {
    const tx = db.transaction(DB_STORE, 'readonly')
    const store = tx.objectStore(DB_STORE)
    const request = store.get(KEY_ID)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => resolve(null)
  })
}

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = await retrieveKey()
  if (existing) return existing
  const key = await generateEncryptionKey()
  await storeKey(key)
  return key
}

export async function encryptEmbedding(embedding: Float32Array, key: CryptoKey): Promise<string> {
  const iv = generateIV()
  const data = new Uint8Array(embedding.buffer, embedding.byteOffset, embedding.byteLength)
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv: iv as BufferSource }, key, data as BufferSource)
  return JSON.stringify({
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    data: arrayBufferToBase64(encrypted),
  })
}

export async function decryptEmbedding(encrypted: string, key: CryptoKey): Promise<Float32Array> {
  const { iv: ivB64, data: dataB64 } = JSON.parse(encrypted)
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64))
  const data = base64ToArrayBuffer(dataB64)
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv: iv as BufferSource }, key, data)
  return new Float32Array(decrypted)
}

export interface EncryptedFacesPayload {
  version: number
  iv: string
  data: string
}

export async function encryptFaces(faces: RegisteredFace[], key: CryptoKey): Promise<string> {
  const iv = generateIV()
  const json = JSON.stringify(faces)
  const encoded = new TextEncoder().encode(json)
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv: iv as BufferSource }, key, encoded)
  const payload: EncryptedFacesPayload = {
    version: 1,
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    data: arrayBufferToBase64(encrypted),
  }
  return JSON.stringify(payload)
}

export async function decryptFaces(encrypted: string, key: CryptoKey): Promise<RegisteredFace[]> {
  const payload: EncryptedFacesPayload = JSON.parse(encrypted)
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
  const data = base64ToArrayBuffer(payload.data)
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv: iv as BufferSource }, key, data)
  const json = new TextDecoder().decode(decrypted)
  return JSON.parse(json)
}
