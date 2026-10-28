import { describe, it, expect } from 'vitest'
import {
  signLicense,
  parseLicenseKey,
  licenseStatus,
  graceDaysLeft,
  GRACE_PERIOD_MS,
  isEnforcementReadOnly,
  sha256,
  type LicensePayload,
} from './license'

const now = Date.now()
const basePayload: Omit<LicensePayload, 'v'> = {
  slug: 'demo-school',
  plan: 'pro',
  issuedAt: now - 1000,
  expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
  features: ['classes', 'exams'],
}
const secret = 'interop-secret'

// A key signed by the SERVER implementation (Node HMAC-SHA256, see
// apps/api/src/lib/license.ts). The browser must verify it too — proving the
// two implementations share one key format.
const serverSignedKey =
  'v1.eyJ2IjoxLCJzbHVnIjoiZGVtby1zY2hvb2wiLCJwbGFuIjoicHJvIiwiaXNzdWVkQXQiOjE3MDAwMDAwMDAwMDAsImV4cGlyZXNBdCI6NDEwMjQ0NDgwMDAwMCwiZmVhdHVyZXMiOlsiY2xhc3NlcyIsImV4YW1zIl19.VVwstkOBAL0XHh0ySa2RGOx91I8kyKcwo-S7SP82oGo'

describe('browser/server interop', () => {
  it('verifies a key signed by the Node server implementation', () => {
    const res = parseLicenseKey(serverSignedKey, secret)
    expect(res.signatureValid).toBe(true)
    expect(res.payload?.slug).toBe('demo-school')
    expect(res.payload?.plan).toBe('pro')
    expect(res.payload?.features).toEqual(['classes', 'exams'])
  })
})

describe('signLicense / parseLicenseKey', () => {
  it('signs and round-trips a valid key', () => {
    const key = signLicense(basePayload, secret)
    expect(key).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)

    const res = parseLicenseKey(key, secret)
    expect(res.signatureValid).toBe(true)
    expect(res.error).toBeNull()
    expect(res.payload?.slug).toBe('demo-school')
    expect(res.payload?.plan).toBe('pro')
  })

  it('rejects a tampered payload', () => {
    const key = signLicense(basePayload, secret)
    const parts = key.split('.')
    // Flip a character in the signature segment so the HMAC no longer matches.
    const first = parts[2][0]
    const replaced = first === 'A' ? 'B' : 'A'
    const tampered = `${parts[0]}.${parts[1]}.${replaced}${parts[2].slice(1)}`
    const res = parseLicenseKey(tampered, secret)
    expect(res.signatureValid).toBe(false)
    expect(res.error).toBe('License signature did not verify.')
  })

  it('rejects a key signed with a different secret', () => {
    const key = signLicense(basePayload, secret)
    const res = parseLicenseKey(key, 'other-secret')
    expect(res.signatureValid).toBe(false)
  })

  it('rejects malformed keys', () => {
    expect(parseLicenseKey('not-a-key', secret).signatureValid).toBe(false)
    expect(parseLicenseKey('v1.abc', secret).signatureValid).toBe(false)
    expect(parseLicenseKey('v2.abc.def', secret).signatureValid).toBe(false)
    expect(parseLicenseKey('', secret).signatureValid).toBe(false)
  })
})

describe('licenseStatus', () => {
  it('returns valid when not expired', () => {
    expect(licenseStatus({ ...basePayload, expiresAt: now + 1000 })).toBe('valid')
  })

  it('returns grace within the grace period', () => {
    expect(licenseStatus({ ...basePayload, expiresAt: now - 1000 })).toBe('grace')
    expect(licenseStatus({ ...basePayload, expiresAt: now - GRACE_PERIOD_MS + 1000 })).toBe('grace')
  })

  it('returns expired past the grace period', () => {
    expect(
      licenseStatus({ ...basePayload, expiresAt: now - GRACE_PERIOD_MS - 1000 })
    ).toBe('expired')
  })
})

describe('isEnforcementReadOnly', () => {
  it('only blocks writes when expired', () => {
    expect(isEnforcementReadOnly('valid')).toBe(false)
    expect(isEnforcementReadOnly('grace')).toBe(false)
    expect(isEnforcementReadOnly('expired')).toBe(true)
    expect(isEnforcementReadOnly('unlicensed')).toBe(false)
  })
})

describe('graceDaysLeft', () => {
  it('returns 0 when not expired', () => {
    expect(graceDaysLeft({ ...basePayload, expiresAt: now + 1000 })).toBe(0)
  })

  it('returns remaining days during grace', () => {
    const expiresAt = now - 1000 // expired 1s ago
    expect(graceDaysLeft({ ...basePayload, expiresAt })).toBeGreaterThan(0)
    expect(graceDaysLeft({ ...basePayload, expiresAt })).toBeLessThanOrEqual(7)
  })

  it('returns 0 when past grace', () => {
    expect(graceDaysLeft({ ...basePayload, expiresAt: now - GRACE_PERIOD_MS - 1000 })).toBe(0)
  })
})
