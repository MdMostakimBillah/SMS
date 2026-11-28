import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  sealLoginPath,
  unsealLoginPath,
  isValidLoginPathSegment,
  normalizeLoginPathSegment,
} from './loginPathCrypto.js'

const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long-001'

describe('loginPathCrypto — DB Encryption & Verification', () => {
  const originalEnvKey = process.env.LOGIN_PATH_ENCRYPTION_KEY

  beforeEach(() => {
    delete process.env.LOGIN_PATH_ENCRYPTION_KEY
  })

  afterEach(() => {
    if (originalEnvKey !== undefined) {
      process.env.LOGIN_PATH_ENCRYPTION_KEY = originalEnvKey
    } else {
      delete process.env.LOGIN_PATH_ENCRYPTION_KEY
    }
  })

  it('seals login path into opaque AES-256-GCM ciphertext without leaking plaintext', () => {
    const secretPath = 'super-vault-2026-alpha'
    const sealed1 = sealLoginPath(secretPath, TEST_JWT_SECRET)
    const sealed2 = sealLoginPath(secretPath, TEST_JWT_SECRET)

    expect(sealed1.startsWith('enc:v1:')).toBe(true)
    expect(sealed2.startsWith('enc:v1:')).toBe(true)
    // Distinct random IV each write
    expect(sealed1).not.toBe(sealed2)
    // Plaintext must never appear in sealed string
    expect(sealed1).not.toContain(secretPath)
    expect(sealed1).not.toContain('super-vault')

    const res = unsealLoginPath(sealed1, TEST_JWT_SECRET)
    expect(res).toEqual({ path: secretPath, needsMigration: false })
  })

  it('fails closed if ciphertext, IV, or auth tag is tampered with or wrong key is supplied', () => {
    const sealed = sealLoginPath('vault-portal-9988', TEST_JWT_SECRET)
    const parts = sealed.split(':')
    expect(parts).toHaveLength(5)

    // Corrupt auth tag
    const badTag = `${parts[0]}:${parts[1]}:${parts[2]}:AAAAAAAAAAAAAAAAAAAAAA:${parts[4]}`
    expect(unsealLoginPath(badTag, TEST_JWT_SECRET)).toEqual({ path: null, needsMigration: false })

    // Corrupt ciphertext
    const flipped = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:${parts[4].slice(0, -2)}zz`
    expect(unsealLoginPath(flipped, TEST_JWT_SECRET)).toEqual({ path: null, needsMigration: false })

    // Wrong decryption key
    expect(unsealLoginPath(sealed, 'different-secret-key-at-least-32-characters')).toEqual({
      path: null,
      needsMigration: false,
    })
  })

  it('supports dedicated LOGIN_PATH_ENCRYPTION_KEY isolated from JWT_SECRET', () => {
    process.env.LOGIN_PATH_ENCRYPTION_KEY = 'dedicated-login-path-encryption-secret-xyz'
    const sealed = sealLoginPath('isolated-key-path-77', TEST_JWT_SECRET)

    expect(unsealLoginPath(sealed, TEST_JWT_SECRET)).toEqual({
      path: 'isolated-key-path-77',
      needsMigration: false,
    })

    // Removing dedicated key makes JWT_SECRET fallback unable to decrypt (domain key isolation)
    delete process.env.LOGIN_PATH_ENCRYPTION_KEY
    expect(unsealLoginPath(sealed, TEST_JWT_SECRET)).toEqual({ path: null, needsMigration: false })
  })

  it('flags legacy plaintext DB values for auto-encryption migration and rejects invalid paths', () => {
    expect(unsealLoginPath('legacy-admin-path', TEST_JWT_SECRET)).toEqual({
      path: 'legacy-admin-path',
      needsMigration: true,
    })
    expect(unsealLoginPath('dashboard', TEST_JWT_SECRET)).toEqual({ path: null, needsMigration: false })
    expect(unsealLoginPath('', TEST_JWT_SECRET)).toEqual({ path: null, needsMigration: false })
  })

  it('validates and normalizes segments strictly', () => {
    expect(normalizeLoginPathSegment('  /vault-entry-99/  ')).toBe('vault-entry-99')
    expect(isValidLoginPathSegment('/vault_entry-99')).toBe(true)
    expect(isValidLoginPathSegment('api')).toBe(false)
    expect(isValidLoginPathSegment('ab')).toBe(false)
    expect(isValidLoginPathSegment('bad\nvalue')).toBe(false)
  })
})
