import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  signLicense,
  parseLicenseKey,
  licenseStatus,
  graceDaysLeft,
  GRACE_PERIOD_MS,
  type LicensePayload,
} from './lib/license.js'

const secret = 'interop-secret'

// A payload+key signed with the OFFICIAL secret via Node crypto, generated once
// and pinned. The client (src/lib/license.ts) must verify this same key — proving
// browser↔server interop of the shared key format.
const interopKey =
  'v1.eyJ2IjoxLCJzbHVnIjoiZGVtby1zY2hvb2wiLCJwbGFuIjoicHJvIiwiaXNzdWVkQXQiOjE3MDAwMDAwMDAwMDAsImV4cGlyZXNBdCI6NDEwMjQ0NDgwMDAwMCwiZmVhdHVyZXMiOlsiY2xhc3NlcyIsImV4YW1zIl19.VVwstkOBAL0XHh0ySa2RGOx91I8kyKcwo-S7SP82oGo'

describe('parseLicenseKey / signLicense', () => {
  it('verifies the pinned Node-signed interop key', () => {
    const res = parseLicenseKey(interopKey, secret)
    expect(res.signatureValid).toBe(true)
    expect(res.payload?.slug).toBe('demo-school')
    expect(res.payload?.plan).toBe('pro')
  })

  it('round-trips a freshly signed key', () => {
    const key = signLicense(
      { slug: 'acme', plan: 'basic', issuedAt: Date.now(), expiresAt: Date.now() + 1000, features: [] },
      secret
    )
    const res = parseLicenseKey(key, secret)
    expect(res.signatureValid).toBe(true)
    expect(res.payload?.slug).toBe('acme')
  })

  it('rejects a key signed with a different secret', () => {
    expect(parseLicenseKey(interopKey, 'wrong').signatureValid).toBe(false)
  })

  it('rejects a tampered payload', () => {
    const [v, p, s] = interopKey.split('.')
    const decoded = Buffer.from(p, 'base64url').toString('utf8')
    const tamperedP = Buffer.from(decoded.replace('demo-school', 'evil'), 'utf8').toString('base64url')
    const res = parseLicenseKey(`${v}.${tamperedP}.${s}`, secret)
    expect(res.signatureValid).toBe(false)
    expect(res.error).toBe('License signature did not verify.')
  })

  it('rejects malformed keys', () => {
    expect(parseLicenseKey('', secret).signatureValid).toBe(false)
    expect(parseLicenseKey('v1.abc', secret).signatureValid).toBe(false)
    expect(parseLicenseKey('v2.a.b', secret).signatureValid).toBe(false)
  })

  it('produces a signature identical to raw HMAC-SHA256 of the signing input', () => {
    const key = signLicense(
      { slug: 'x', plan: 'free', issuedAt: 1, expiresAt: 2, features: [] },
      secret
    )
    const [v, p, s] = key.split('.')
    const signingInput = `${v}.${p}`
    const expected = createHmac('sha256', secret).update(signingInput, 'utf8').digest('base64url')
    expect(s).toBe(expected)
  })
})

describe('licenseStatus / graceDaysLeft', () => {
  const now = Date.now()
  const base: LicensePayload = { v: 1, slug: 's', plan: 'pro', issuedAt: now, expiresAt: now, features: [] }

  it('valid / grace / expired boundaries', () => {
    expect(licenseStatus({ ...base, expiresAt: now + 1000 }, now)).toBe('valid')
    expect(licenseStatus({ ...base, expiresAt: now - 1000 }, now)).toBe('grace')
    expect(licenseStatus({ ...base, expiresAt: now - GRACE_PERIOD_MS - 1 }, now)).toBe('expired')
  })

  it('graceDaysLeft counts down during grace only', () => {
    expect(graceDaysLeft({ ...base, expiresAt: now + 1000 }, now)).toBe(0)
    expect(graceDaysLeft({ ...base, expiresAt: now - 1000 }, now)).toBeGreaterThan(0)
    expect(graceDaysLeft({ ...base, expiresAt: now - GRACE_PERIOD_MS - 1 }, now)).toBe(0)
  })
})
