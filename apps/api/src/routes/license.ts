/**
 * License routes — online validation of signed license keys (Mode B heartbeat).
 *
 * The license key itself is the credential: no session is required, so an
 * institution's browser can validate before/without logging in. The server
 * verifies the HMAC signature with LICENSE_SECRET and reports the enforcement
 * status. The client applies read-only once status is 'expired'.
 */

import { Router, type Request, type Response } from 'express'
import {
  parseLicenseKey,
  licenseStatus,
  GRACE_PERIOD_MS,
  type LicenseStatus,
} from '../lib/license.js'

export function licenseRouter(licenseSecret: string): Router {
  const router = Router()

  // No secret configured → licensing is inert; report 'valid' so a self-hosted
  // instance without licensing keeps working (Mode B without a key).
  router.post('/heartbeat', (req: Request, res: Response) => {
    if (!licenseSecret) {
      return res.json({ status: 'valid', serverTime: Date.now() })
    }

    const body = (req.body ?? {}) as { licenseKey?: string; slug?: string }
    const key = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : ''
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''

    if (!key) {
      return res.json({ status: 'expired', error: 'Missing license key.', serverTime: Date.now() })
    }

    const { signatureValid, payload } = parseLicenseKey(key, licenseSecret)
    if (!signatureValid || !payload) {
      return res.json({ status: 'expired', error: 'Invalid license key.', serverTime: Date.now() })
    }

    // If a slug is supplied, it must match the one the key was issued for.
    if (slug && payload.slug && slug !== payload.slug) {
      return res.json({
        status: 'expired',
        error: 'License does not match this institution.',
        serverTime: Date.now(),
      })
    }

    const status: LicenseStatus = licenseStatus(payload)
    return res.json({
      status,
      expiresAt: new Date(payload.expiresAt).toISOString(),
      graceEndsAt: new Date(payload.expiresAt + GRACE_PERIOD_MS).toISOString(),
      serverTime: Date.now(),
    })
  })

  return router
}
