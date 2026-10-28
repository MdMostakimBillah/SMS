/**
 * License core — signed license keys + grace-period enforcement.
 *
 * License key format:
 *   v1.<base64url(JSON payload)>.<base64url(HMAC-SHA256 signature)>
 *
 * Payload:
 *   { v:1, slug, plan, issuedAt, expiresAt, features: string[] }
 *
 * The signature is computed over `v1.<payloadB64>` using HMAC-SHA256 with a
 * secret key, so a key forged without the secret won't validate. The secret
 * is read from VITE_LICENSE_SECRET (set it per deployment). A dev fallback is
 * used only when the env var is missing — never ship the fallback in prod.
 *
 * All logic is pure (no React, no DOM) so it runs in tests and in fully
 * local / browser-only institutions that never call a server.
 */

export type LicensePlan = 'free' | 'basic' | 'pro' | 'enterprise'
export type LicenseStatus = 'unlicensed' | 'valid' | 'grace' | 'expired'

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

// ---------------------------------------------------------------------------
// Pure-JS SHA-256 (FIPS 180-4). No Web Crypto dependency so it works in jsdom
// and in any browser without feature detection.
// ---------------------------------------------------------------------------

const rotr = (word: number, bits: number): number => (word >>> bits) | (word << (32 - bits))

const K = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

export function sha256(message: Uint8Array): Uint8Array {
  const bitLen = message.length * 8
  const paddedLength = Math.ceil((message.length + 1 + 8) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(message)
  padded[message.length] = 0x80
  new DataView(padded.buffer, paddedLength - 8, 8).setBigUint64(0, BigInt(bitLen), false)

  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a,
    h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19

  for (let i = 0; i < paddedLength; i += 64) {
    const w = new Int32Array(64)
    for (let j = 0; j < 16; j++) {
      w[j] =
        (padded[i + j * 4] << 24) |
        (padded[i + j * 4 + 1] << 16) |
        (padded[i + j * 4 + 2] << 8) |
        padded[i + j * 4 + 3]
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)
      const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0
    }
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[j] + w[j]) | 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) | 0
      h = g
      g = f
      f = e
      e = (d + temp1) | 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) | 0
    }
    h0 = (h0 + a) | 0
    h1 = (h1 + b) | 0
    h2 = (h2 + c) | 0
    h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0
    h5 = (h5 + f) | 0
    h6 = (h6 + g) | 0
    h7 = (h7 + h) | 0
  }

  const out = new Uint8Array(32)
  const v = [h0, h1, h2, h3, h4, h5, h6, h7]
  for (let i = 0; i < 8; i++) {
    out[i * 4] = v[i] >>> 24
    out[i * 4 + 1] = (v[i] >>> 16) & 0xff
    out[i * 4 + 2] = (v[i] >>> 8) & 0xff
    out[i * 4 + 3] = v[i] & 0xff
  }
  return out
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return (
    btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  )
}

function base64UrlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64
  let keyBytes = key
  if (keyBytes.length > blockSize) keyBytes = sha256(keyBytes)
  const padded = new Uint8Array(blockSize)
  padded.set(keyBytes)
  const oKeyPad = padded.map((b) => b ^ 0x5c)
  const iKeyPad = padded.map((b) => b ^ 0x36)
  const inner = new Uint8Array(iKeyPad.length + message.length)
  inner.set(iKeyPad)
  inner.set(message, iKeyPad.length)
  const outer = new Uint8Array(oKeyPad.length + 32)
  outer.set(oKeyPad)
  outer.set(sha256(inner), oKeyPad.length)
  return sha256(outer)
}

// ---------------------------------------------------------------------------
// Secret
// ---------------------------------------------------------------------------

/** Signing secret. Set VITE_LICENSE_SECRET per deployment; never ship the fallback. */
export function licenseSecret(): string {
  if (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_LICENSE_SECRET) {
    return import.meta.env.VITE_LICENSE_SECRET
  }
  return 'edutech-dev-secret-do-not-use-in-production'
}

// ---------------------------------------------------------------------------
// Sign / parse
// ---------------------------------------------------------------------------

/** Sign a payload into a license key. */
export function signLicense(payload: Omit<LicensePayload, 'v'>, secret?: string): string {
  const full: LicensePayload = { v: 1, ...payload }
  const payloadJson = JSON.stringify(full)
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadJson))
  const signingInput = `v1.${payloadB64}`
  const sig = hmacSha256(new TextEncoder().encode(secret ?? licenseSecret()), new TextEncoder().encode(signingInput))
  return `${signingInput}.${base64UrlEncode(sig)}`
}

/** Verify a license key. Does NOT check expiry — use licenseStatus() for that. */
export function parseLicenseKey(key: string, secret?: string): ParseResult {
  const sec = secret ?? licenseSecret()
  const parts = key.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1' || !parts[1] || !parts[2]) {
    return { signatureValid: false, payload: null, error: 'Invalid license key format.' }
  }
  let payload: LicensePayload | null = null
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(parts[1]))
    ) as LicensePayload
    if (!payload || payload.v !== 1 || !payload.slug || !payload.expiresAt) {
      return { signatureValid: false, payload: null, error: 'Invalid license payload.' }
    }
  } catch {
    return { signatureValid: false, payload: null, error: 'Invalid license payload.' }
  }
  const expected = hmacSha256(
    new TextEncoder().encode(sec),
    new TextEncoder().encode(`v1.${parts[1]}`)
  )
  if (base64UrlEncode(expected) !== parts[2]) {
    return { signatureValid: false, payload, error: 'License signature did not verify.' }
  }
  return { signatureValid: true, payload, error: null }
}

/**
 * Compute the enforcement status for a verified payload.
 *   'valid'   — not expired
 *   'grace'   — expired but within GRACE_PERIOD_MS (warn, still writable)
 *   'expired' — past grace (enforce read-only)
 */
export function licenseStatus(payload: LicensePayload, now: number = Date.now()): LicenseStatus {
  if (now < payload.expiresAt) return 'valid'
  if (now < payload.expiresAt + GRACE_PERIOD_MS) return 'grace'
  return 'expired'
}

/** Human-readable days left in the grace period (0 when already expired). */
export function graceDaysLeft(payload: LicensePayload, now: number = Date.now()): number {
  if (now < payload.expiresAt) return 0
  const remaining = payload.expiresAt + GRACE_PERIOD_MS - now
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
}

/**
 * True when the app must reject writes. Called by the write guard and by the
 * vault before seeding/syncing files.
 */
export function isEnforcementReadOnly(status: LicenseStatus): boolean {
  return status === 'expired'
}
