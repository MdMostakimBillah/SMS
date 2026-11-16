import { useState, useEffect, useCallback } from 'react'

/**
 * Returns true if the browser reports network connectivity.
 */
export function isNetworkOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}

/**
 * Actively probes internet reachability via lightweight HEAD / GET request.
 */
export async function checkInternetAccess(timeoutMs = 3000): Promise<boolean> {
  if (!isNetworkOnline()) return false
  if (typeof window === 'undefined') return true

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const probeUrl = `${window.location.origin}/version.txt?t=${Date.now()}`
    const res = await fetch(probeUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    })
    return res.status < 500
  } catch {
    // If local version probe fails, fallback to navigator.onLine status
    return navigator.onLine !== false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * React hook to listen to browser online/offline events and active probe checks.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => isNetworkOnline())
  const [checking, setChecking] = useState<boolean>(false)

  const checkNow = useCallback(async (): Promise<boolean> => {
    setChecking(true)
    try {
      const active = await checkInternetAccess()
      setIsOnline(active)
      return active
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      void checkNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    void checkNow()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkNow])

  return { isOnline, checking, checkNow }
}
