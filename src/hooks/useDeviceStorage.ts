import { useState, useEffect } from 'react'
import { getActiveVaultHandle } from '@/lib/vault/vault'
import { listAllVaultFiles } from '@/lib/vault/fsAccess'

export interface DeviceStorageStats {
  usedFormatted: string
  quotaFormatted: string
  remainingFormatted: string
  percentUsed: number
  usedBytes: number
  quotaBytes: number
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getInitialStorageStats(): DeviceStorageStats {
  let usedBytes = 0
  try {
    if (typeof localStorage !== 'undefined') {
      let totalChars = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const val = localStorage.getItem(key) || ''
          totalChars += key.length + val.length
        }
      }
      usedBytes = totalChars * 2
    }
  } catch {
    /* ignore */
  }
  const fallbackQuota = 64 * 1024 * 1024 * 1024
  return {
    usedFormatted: formatBytes(usedBytes || 3.6 * 1024 * 1024),
    quotaFormatted: formatBytes(fallbackQuota),
    remainingFormatted: formatBytes(fallbackQuota - usedBytes),
    percentUsed: 1,
    usedBytes,
    quotaBytes: fallbackQuota,
  }
}

export async function measureDeviceStorage(): Promise<DeviceStorageStats> {
  let usedBytes = 0
  let quotaBytes = 0

  // 1. Calculate localStorage size
  try {
    if (typeof localStorage !== 'undefined') {
      let totalChars = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const val = localStorage.getItem(key) || ''
          totalChars += key.length + val.length
        }
      }
      usedBytes += totalChars * 2
    }
  } catch {
    /* ignore */
  }

  // 2. Add local vault folder file sizes from disk if connected
  try {
    const handle = getActiveVaultHandle()
    if (handle) {
      const files = await listAllVaultFiles(handle)
      const folderBytes = files.reduce((acc, f) => acc + (f.size || 0), 0)
      if (folderBytes > 0) {
        usedBytes = Math.max(usedBytes, folderBytes)
      }
    }
  } catch {
    /* ignore */
  }

  // 3. Query OS disk storage estimate via standard Navigator Storage API
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
      const estimate = await navigator.storage.estimate()
      if (estimate.quota && estimate.quota > 0) {
        quotaBytes = estimate.quota
      }
      if (usedBytes === 0 && estimate.usage && estimate.usage > 0) {
        usedBytes = estimate.usage
      }
    }
  } catch {
    /* ignore */
  }

  if (quotaBytes <= 0) {
    quotaBytes = 64 * 1024 * 1024 * 1024
  }

  const remainingBytes = Math.max(0, quotaBytes - usedBytes)
  const rawPercent = (usedBytes / quotaBytes) * 100
  const percentUsed = Math.min(100, Math.max(1, Math.round(rawPercent)))

  return {
    usedFormatted: formatBytes(usedBytes),
    quotaFormatted: formatBytes(quotaBytes),
    remainingFormatted: formatBytes(remainingBytes),
    percentUsed,
    usedBytes,
    quotaBytes,
  }
}

/**
 * Hook to read and refresh local device storage stats.
 */
export function useDeviceStorage(): {
  stats: DeviceStorageStats
  refresh: () => Promise<void>
} {
  const [stats, setStats] = useState<DeviceStorageStats>(getInitialStorageStats)

  const refresh = async () => {
    try {
      const s = await measureDeviceStorage()
      setStats(s)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return { stats, refresh }
}
