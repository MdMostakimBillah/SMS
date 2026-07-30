import { useState, useCallback } from 'react'

export function useInstitutionWifi() {
  const [institutionWifi, setInstitutionWifi] = useState(() => localStorage.getItem('institutionWifi') || '')
  const [institutionGateway, setInstitutionGateway] = useState(() => localStorage.getItem('institutionGateway') || '')
  const [wifiChecking, setWifiChecking] = useState(false)
  const [wifiConnected, setWifiConnected] = useState<boolean | null>(null)
  const [showWifiSettings, setShowWifiSettings] = useState(false)

  const saveWifiSettings = useCallback(() => {
    localStorage.setItem('institutionWifi', institutionWifi)
    localStorage.setItem('institutionGateway', institutionGateway)
    setShowWifiSettings(false)
  }, [institutionWifi, institutionGateway])

  const checkInstitutionNetwork = useCallback(async (): Promise<{
    onNetwork: boolean | null
    method: string
    info: string
  }> => {
    if (institutionGateway) {
      for (const proto of ['https', 'http'] as const) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 3000)
          await fetch(`${proto}://${institutionGateway}/ping`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          })
          clearTimeout(timeout)
          return {
            onNetwork: true,
            method: 'gateway',
            info: `Gateway ${institutionGateway} reachable (${proto.toUpperCase()})`,
          }
        } catch {
          // try next protocol
        }
      }
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)
      await fetch(window.location.origin, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      return {
        onNetwork: true,
        method: 'origin',
        info: 'Connected to institution network',
      }
    } catch {
      // Not on same network
    }

    const nav = navigator as Record<string, unknown>
    const conn = (nav.connection as Record<string, string> | undefined)
    if (conn) {
      if (conn.type === 'wifi' || conn.type === 'ethernet') {
        return {
          onNetwork: null,
          method: 'network-info',
          info: `Connected via ${conn.type} (cannot verify SSID)`,
        }
      }
    }

    return {
      onNetwork: false,
      method: 'none',
      info: 'Cannot verify network connection',
    }
  }, [institutionGateway])

  const runNetworkCheck = useCallback(async () => {
    setWifiChecking(true)
    const result = await checkInstitutionNetwork()
    setWifiConnected(result.onNetwork)
    setWifiChecking(false)
    return result
  }, [checkInstitutionNetwork])

  return {
    institutionWifi,
    setInstitutionWifi,
    institutionGateway,
    setInstitutionGateway,
    wifiChecking,
    wifiConnected,
    setWifiConnected,
    showWifiSettings,
    setShowWifiSettings,
    saveWifiSettings,
    checkInstitutionNetwork,
    runNetworkCheck,
  }
}
