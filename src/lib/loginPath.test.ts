import { describe, it, expect, beforeEach } from 'vitest'
import {
  getLoginSecret,
  setLoginSecret,
  rotateLoginSecret,
  clearLoginSecret,
  getLoginRoute,
  getSecretPath,
} from './loginPath'

describe('loginPath helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('normalizes secret and strips leading/trailing slashes', () => {
    setLoginSecret('/my-secret-path/')
    expect(getLoginSecret()).toBe('my-secret-path')
    expect(getLoginRoute()).toBe('/my-secret-path/login')
    expect(getSecretPath()).toBe('/my-secret-path')
  })

  it('rotates login secret to a new random value', () => {
    const s1 = rotateLoginSecret()
    expect(s1.length).toBeGreaterThan(5)
    expect(getLoginSecret()).toBe(s1)

    const s2 = rotateLoginSecret()
    expect(s2).not.toBe(s1)
    expect(getLoginSecret()).toBe(s2)
  })

  it('clears persisted login secret and falls back to env var', () => {
    setLoginSecret('custom-temp')
    expect(getLoginSecret()).toBe('custom-temp')

    clearLoginSecret()
    // Should fall back to import.meta.env.VITE_LOGIN_PATH (cleaned) or empty string
    expect(getLoginSecret()).not.toBe('custom-temp')
  })
})
