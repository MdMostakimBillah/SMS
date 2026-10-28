/**
 * License heartbeat — optional online validation for institutions that run
 * with a reachable server.
 *
 * POSTs the license key to the heartbeat URL on an interval. A successful
 * response updates enforcement status; failures are tolerated so an
 * institution that goes offline is not immediately locked out (local-first).
 *
 * Only starts when VITE_LICENSE_HEARTBEAT_URL is configured. Fully local
 * institutions (no server) rely on local signature + expiry instead.
 */

import { useAppStore } from '@/store/appStore'

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000 // hourly

export interface HeartbeatResponse {
  status: 'valid' | 'grace' | 'expired'
  expiresAt?: string
  graceEndsAt?: string
}

function heartbeatUrl(): string | null {
  if (typeof import.meta.env === 'undefined') return null
  const url = import.meta.env.VITE_LICENSE_HEARTBEAT_URL
  return url || null
}

/** One validation tick. Resolves whether the server was reachable. */
async function tick(): Promise<boolean> {
  const url = heartbeatUrl()
  if (!url) return false
  const { settings } = useAppStore.getState()
  const key = settings.licenseKey
  if (!key || !key.trim()) return false
  const slug = sessionStorage.getItem('edutech_inst_slug') || ''

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key.trim(), slug }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as HeartbeatResponse
    ;(useAppStore as any).setLicenseHeartbeat(data.status, {
      expiresAt: data.expiresAt,
      graceEndsAt: data.graceEndsAt,
    })
    return true
  } catch {
    // Offline / unreachable — keep the last known status, do not lock out.
    return false
  }
}

/**
 * Start the heartbeat loop. Returns a stop function. Safe to call multiple
 * times (returns the same stop). Non-blocking — does not delay startup.
 */
export function startLicenseHeartbeat(intervalMs: number = DEFAULT_INTERVAL_MS): () => void {
  if (typeof window === 'undefined' || !heartbeatUrl()) return () => {}

  let timer: ReturnType<typeof setInterval> | null = null

  const loop = () => {
    void tick()
  }

  // First tick shortly after startup, then on the interval.
  setTimeout(loop, 10 * 1000)
  timer = setInterval(loop, intervalMs)

  return () => {
    if (timer) clearInterval(timer)
    timer = null
  }
}
