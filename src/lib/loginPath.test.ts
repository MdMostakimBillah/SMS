import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLoginSecret,
  setLoginSecret,
  rotateLoginSecret,
  clearLoginSecret,
  getLoginRoute,
  getSecretPath,
  isValidLoginSecret,
  verifyLoginSecretRemote,
  generateSecureLoginSecret,
  DEFAULT_LOGIN_SECRET,
} from './loginPath'
import { authApi } from './api'

describe('loginPath helpers', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('normalizes secret and strips leading/trailing slashes', () => {
    setLoginSecret('/my-secret-path/')
    expect(getLoginSecret()).toBe('my-secret-path')
    expect(getLoginRoute()).toBe('/my-secret-path/login')
    expect(getSecretPath()).toBe('/my-secret-path')
  })

  it('generates CSPRNG login secret using Web Crypto without predictable timestamps', () => {
    const token = generateSecureLoginSecret(24)
    expect(token).toMatch(/^[A-Za-z0-9]{24}$/)
    const token2 = generateSecureLoginSecret(24)
    expect(token2).not.toBe(token)
  })

  it('rotates login secret to a new random value', () => {
    const s1 = rotateLoginSecret()
    expect(s1.length).toBeGreaterThan(5)
    expect(getLoginSecret()).toBe(s1)

    const s2 = rotateLoginSecret()
    expect(s2).not.toBe(s1)
    expect(getLoginSecret()).toBe(s2)
  })

  it('clears persisted login secret and falls back to env var or default', () => {
    setLoginSecret('custom-temp')
    expect(getLoginSecret()).toBe('custom-temp')

    clearLoginSecret()
    expect(getLoginSecret()).not.toBe('custom-temp')
    expect(getLoginSecret().length).toBeGreaterThan(0)
  })

  it('strictly validates login secret candidate (fail closed)', () => {
    setLoginSecret('secure-vault-token-99')
    expect(isValidLoginSecret('secure-vault-token-99')).toBe(true)
    expect(isValidLoginSecret('/secure-vault-token-99/')).toBe(true)
    expect(isValidLoginSecret('wrong-token')).toBe(false)
    expect(isValidLoginSecret('')).toBe(false)
    expect(isValidLoginSecret(undefined)).toBe(false)
  })

  describe('verifyLoginSecretRemote', () => {
    it('returns true immediately for local match without remote call', async () => {
      setLoginSecret('my-local-secret')
      const spy = vi.spyOn(authApi, 'verifyLoginPath')

      const result = await verifyLoginSecretRemote('my-local-secret')
      expect(result).toBe(true)
      expect(spy).not.toHaveBeenCalled()
    })

    it('verifies against remote API and caches in localStorage when valid', async () => {
      const spy = vi.spyOn(authApi, 'verifyLoginPath').mockResolvedValueOnce({ valid: true } as any)

      const result = await verifyLoginSecretRemote('remote-secret-key-123')
      expect(result).toBe(true)
      expect(spy).toHaveBeenCalledWith('remote-secret-key-123')
      expect(getLoginSecret()).toBe('remote-secret-key-123')
    })

    it('returns false when remote API reports invalid', async () => {
      const spy = vi.spyOn(authApi, 'verifyLoginPath').mockResolvedValueOnce({ valid: false } as any)

      const result = await verifyLoginSecretRemote('wrong-remote-key')
      expect(result).toBe(false)
      expect(spy).toHaveBeenCalledWith('wrong-remote-key')
      expect(getLoginSecret()).not.toBe('wrong-remote-key')
    })

    it('returns false for empty or undefined candidate without API call', async () => {
      const spy = vi.spyOn(authApi, 'verifyLoginPath')
      expect(await verifyLoginSecretRemote('')).toBe(false)
      expect(await verifyLoginSecretRemote(undefined)).toBe(false)
      expect(spy).not.toHaveBeenCalled()
    })
  })
})
