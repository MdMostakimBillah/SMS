import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto'

const SEALED_PREFIX = 'enc:v1:'
const HKDF_SALT = Buffer.from('edutech:system-config:hkdf-salt:v1', 'utf8')
const IV_BYTES = 12
const TAG_BYTES = 16
const KEY_BYTES = 32

/**
 * Derive a 256-bit domain-separated encryption key via HKDF-SHA256 from server
 * secret material. Isolating contexts ensures a key derived for one table/field
 * cannot decrypt ciphertext meant for another.
 */
export function deriveDomainKey(masterSecret: string, context: string): Buffer {
  const secret = masterSecret.trim()
  if (!secret) {
    throw new Error('Master secret is required for key derivation')
  }
  const derived = hkdfSync(
    'sha256',
    Buffer.from(secret, 'utf8'),
    HKDF_SALT,
    Buffer.from(context, 'utf8'),
    KEY_BYTES
  )
  return Buffer.from(derived)
}

/**
 * Encrypt sensitive string values at rest using AES-256-GCM with a random 96-bit
 * IV and Additional Authenticated Data (AAD) binding the target context.
 */
export function sealSecret(plaintext: string, masterSecret: string, context: string, aad: string): string {
  const key = deriveDomainKey(masterSecret, context)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(aad, 'utf8'))

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${SEALED_PREFIX}${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`
}

export interface UnsealResult {
  value: string | null
  isSealed: boolean
}

/**
 * Decrypt an AES-256-GCM payload created by `sealSecret`.
 * Fails closed (`value: null`) if the ciphertext or auth tag was tampered with
 * or decrypted under the wrong key. Reports `isSealed: false` for legacy rows
 * that lack the `enc:v1:` envelope.
 */
export function unsealSecret(storedValue: string, masterSecret: string, context: string, aad: string): UnsealResult {
  if (!storedValue || !storedValue.startsWith(SEALED_PREFIX)) {
    return { value: null, isSealed: false }
  }

  const parts = storedValue.split(':')
  if (parts.length !== 5) {
    return { value: null, isSealed: true }
  }

  const [, , ivB64, tagB64, dataB64] = parts
  try {
    const iv = Buffer.from(ivB64, 'base64url')
    const authTag = Buffer.from(tagB64, 'base64url')
    const ciphertext = Buffer.from(dataB64, 'base64url')

    if (iv.length !== IV_BYTES || authTag.length !== TAG_BYTES || ciphertext.length === 0) {
      return { value: null, isSealed: true }
    }

    const key = deriveDomainKey(masterSecret, context)
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAAD(Buffer.from(aad, 'utf8'))
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return { value: decrypted.toString('utf8'), isSealed: true }
  } catch {
    return { value: null, isSealed: true }
  }
}

/** Constant-time equality over variable-length strings via SHA-256 digesting. */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const digestA = createHash('sha256').update(a, 'utf8').digest()
  const digestB = createHash('sha256').update(b, 'utf8').digest()
  return timingSafeEqual(digestA, digestB)
}
