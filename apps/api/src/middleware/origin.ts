import type { Request, Response, NextFunction } from 'express'

/**
 * Normalize an origin string to `scheme://host[:port]` (lowercased, no
 * path, no credentials). Returns null for anything that is not a valid
 * http(s) origin — including `Origin: null` and header-injection shapes
 * like `https://evil.example/https://trusted.example`.
 */
function normalizeOrigin(value: string): string | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  return `${url.protocol}//${url.host}`.toLowerCase()
}

/**
 * Login Origin validation (anti-login-CSRF layer).
 *
 * CORS (a response-header policy) and Origin validation (a request check)
 * are conceptually separate: this middleware does not set or read CORS
 * headers, and the `cors` middleware does not validate incoming requests.
 *
 * Policy (deliberate, documented in docs/security/super-admin-login-path.md):
 * - No `Origin` header → allow. Browsers always attach `Origin` to POST
 *   requests, so its absence identifies non-browser clients (curl, tests,
 *   mobile apps), which are governed by credentials + rate limiting instead.
 * - Present `Origin` → must be either an explicitly configured trusted
 *   origin (the existing server-side CORS_ORIGIN configuration, comma-
 *   separable) or the request's own origin (its `Host` header). Browsers
 *   set both `Origin` and `Host` themselves, so an attacker's page cannot
 *   forge either for a victim; non-browser clients can forge both but can
 *   simply omit `Origin` anyway — this is never an authentication boundary.
 * - Anything else (untrusted, malformed, `null`) → generic 403.
 *
 * The Host-only same-origin rule (no scheme comparison) avoids depending on
 * forwarded headers; nginx already sends X-Forwarded-Proto, but the check's
 * security goal is "the page was served by this server", which is fully
 * expressed by the Host match.
 */
export const LAN_OR_LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/i

export function requireTrustedOrigin(corsOrigin: string) {
  const trusted = new Set(
    corsOrigin
      .split(',')
      .map((entry) => normalizeOrigin(entry.trim()))
      .filter((entry): entry is string => entry !== null)
  )

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin
    if (!origin || typeof origin !== 'string') {
      return next() // deliberately allowed: non-browser client
    }

    const normalized = normalizeOrigin(origin)
    if (!normalized) {
      return res.status(403).json({ error: 'Invalid request origin' })
    }
    if (trusted.has(normalized) || LAN_OR_LOCAL_ORIGIN_RE.test(normalized)) {
      return next()
    }

    // Same-origin: Origin host equals this request's Host header
    // (host-only comparison — the scheme is irrelevant to the security goal:
    // "was this page served by this server?").
    const host = req.headers.host?.toLowerCase()
    const originHost = normalized.slice(normalized.indexOf('://') + 3)
    if (host && originHost === host) {
      return next()
    }

    return res.status(403).json({ error: 'Invalid request origin' })
  }
}
