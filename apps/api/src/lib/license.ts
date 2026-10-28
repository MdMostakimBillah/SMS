/**
 * Server-side license core — signed license keys + grace-period enforcement.
 *
 * Mirrors the browser implementation (src/lib/license.ts) but uses Node's
 * crypto for HMAC-SHA256. The key format is identical, so a key signed by the
 * CLI (this module) verifies in the browser and vice-versa:
 *
 *   v1.<base64url(JSON payload)>.<base64url(HMAC-SHA256 signingInput)>
 *
 * signingInput = `v1.<payloadB64>`, signed with HMAC-SHA256 using LICENSE_SECRET.
 *
 * Pure functions — no DB, no Express — so they run in tests and in the offline
 * sign-license CLI.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

export type LicensePlan = 'free' | 'basic' | 'pro' | 'enterprise'
export type LicenseStatus = 'valid' | 'grace' | 'expired'

export interface LicensePayload {
  v: 1
  slug: string
  plan: LicensePlan
  issuedAt: number
  expiresAt: number
  features: string[]
}

export interface ParseResult {
  signatureValid: boolean
  payload: LicensePayload | null
  error: string | null
}

/** After expiry, the app keeps working (with warnings) for this many ms. */
export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

const utf8 = (s: string): Buffer => Buffer.from(s, 'utf8')
const b64url = (buf: Buffer): string => buf.toString('base64url')

function b64urlDecodeToBuf(s: string): Buffer {
  return Buffer.from(s, 'base64url')
}

function hmac(secret: string, message: string): Buffer {
  return createHmac('sha256', utf8(secret)).update(utf8(message)).digest()
}

/** Sign a payload into a license key. */
export function signLicense(payload: Omit<LicensePayload, 'v'>, secret: string): string {
  const full: LicensePayload = { v: 1, ...payload }
  const payloadB64 = b64url(utf8(JSON.stringify(full)))
  const signingInput = `v1.${payloadB64}`
  return `${signingInput}.${b64url(hmac(secret, signingInput))}`
}

/** Verify a license key. Does NOT check expiry — use licenseStatus() for that. */
export function parseLicenseKey(key: string, secret: string): ParseResult {
  if (!key || !secret) {
    return { signatureValid: false, payload: null, error: 'Missing license key or secret.' }
  }
  const parts = key.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1' || !parts[1] || !parts[2]) {
    return { signatureValid: false, payload: null, error: 'Invalid license key format.' }
  }

  let payload: LicensePayload | null = null
  try {
    payload = JSON.parse(b64urlDecodeToBuf(parts[1]).toString('utf8')) as LicensePayload
    if (!payload || payload.v !== 1 || !payload.slug || !payload.expiresAt) {
      return { signatureValid: false, payload: null, error: 'Invalid license payload.' }
    }
  } catch {
    return { signatureValid: false, payload: null, error: 'Invalid license payload.' }
  }

  let sig: Buffer
  try {
    sig = b64urlDecodeToBuf(parts[2])
  } catch {
    return { signatureValid: false, payload, error: 'Invalid license signature.' }
  }

  const expected = hmac(secret, `v1.${parts[1]}`)
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
    return { signatureValid: false, payload, error: 'License signature did not verify.' }
  }
  return { signatureValid: true, payload, error: null }
}

/** Enforcement status for a verified payload (valid / grace / expired). */
export function licenseStatus(payload: LicensePayload, now: number = Date.now()): LicenseStatus {
  if (now < payload.expiresAt) return 'valid'
  if (now < payload.expiresAt + GRACE_PERIOD_MS) return 'grace'
  return 'expired'
}

/** Days left in the grace period (0 when still valid or already past grace). */
export function graceDaysLeft(payload: LicensePayload, now: number = Date.now()): number {
  if (now < payload.expiresAt) return 0
  const remaining = payload.expiresAt + GRACE_PERIOD_MS - now
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
}
