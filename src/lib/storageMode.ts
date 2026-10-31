import { useClassStore } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'

export type StorageMode = 'cloud' | 'local_computer' | 'local_server'

/**
 * Returns true if the active user session is a Super Admin account managing platform level
 * (not viewing or impersonating a specific institution).
 * Super Admin accounts operate strictly on Provider Cloud and can never switch to local computer or own VPS.
 */
export function isSuperAdminAccount(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  const role = sessionStorage.getItem('edutech_user_role')
  const viewingId = sessionStorage.getItem('edutech_viewing_id')
  return role === 'super_admin' && !viewingId
}

/**
 * Returns true if the active institution is operating in Local Computer mode.
 * In this mode, server database mutations (PostgreSQL / Supabase) are completely stopped,
 * and the app relies exclusively on local computer storage (JSON / localStorage).
 * 
 * Note: Super admin accounts NEVER switch to local computer mode.
 */
export function isLocalComputerMode(): boolean {
  return getActiveStorageMode() === 'local_computer'
}

export function isLocalServerMode(): boolean {
  return getActiveStorageMode() === 'local_server'
}

export function getActiveStorageMode(): StorageMode {
  if (isSuperAdminAccount()) {
    return 'cloud'
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const sess = sessionStorage.getItem('edutech_storage_mode')
      if (sess === 'cloud' || sess === 'local_computer' || sess === 'local_server') {
        return sess as StorageMode
      }
    }

    if (typeof localStorage !== 'undefined') {
      const loc = localStorage.getItem('edutech_storage_mode')
      if (loc === 'cloud' || loc === 'local_computer' || loc === 'local_server') {
        return loc as StorageMode
      }

      // Check scoped classes file for institution's configured storageMode
      const slug =
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edutech_inst_slug') : null) ||
        localStorage.getItem('edutech_inst_slug')
      if (slug) {
        const rawClasses = localStorage.getItem(`edutech-classes_${slug}`)
        if (rawClasses) {
          try {
            const parsed = JSON.parse(rawClasses)
            const mode = parsed?.state?.institution?.storageMode
            if (mode === 'cloud' || mode === 'local_computer' || mode === 'local_server') {
              return mode as StorageMode
            }
          } catch { /* ignore */ }
        }
      }
    }

    const instMode = (useClassStore.getState()?.institution as any)?.storageMode
    if (instMode) return instMode as StorageMode

    const appSettingMode = useAppStore.getState()?.settings?.storageSettings?.mode
    if (appSettingMode) return appSettingMode as StorageMode
  } catch {
    /* fallback to cloud */
  }
  return 'cloud'
}

export function getActiveServerUrl(): string {
  if (isSuperAdminAccount()) {
    return ''
  }

  try {
    const mode = getActiveStorageMode()
    if (mode === 'local_server') {
      if (typeof sessionStorage !== 'undefined') {
        const url = sessionStorage.getItem('edutech_server_url')
        if (url && url.trim()) return url.trim().replace(/\/+$/, '')
      }

      const instUrl = (useClassStore.getState()?.institution as any)?.serverUrl
      if (instUrl && typeof instUrl === 'string' && instUrl.trim()) {
        return instUrl.trim().replace(/\/+$/, '')
      }

      const appUrl = useAppStore.getState()?.settings?.storageSettings?.serverUrl
      if (appUrl && typeof appUrl === 'string' && appUrl.trim()) {
        return appUrl.trim().replace(/\/+$/, '')
      }

      if (typeof localStorage !== 'undefined') {
        const url = localStorage.getItem('edutech_server_url')
        if (url && url.trim()) return url.trim().replace(/\/+$/, '')
      }
    }
  } catch {
    /* fallback to default */
  }
  return ''
}

export function setLocalServerUrl(url: string): void {
  const cleanUrl = url.trim().replace(/\/+$/, '')
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('edutech_server_url', cleanUrl)
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('edutech_server_url', cleanUrl)
  }
  try {
    const inst = useClassStore.getState().institution
    if (inst) {
      useClassStore.getState().updateInstitution({
        ...inst,
        serverUrl: cleanUrl,
      })
    }
    useAppStore.getState().updateSettings({
      storageSettings: {
        ...(useAppStore.getState().settings.storageSettings || { mode: 'local_server', folderName: '' }),
        serverUrl: cleanUrl,
      },
    })
  } catch {
    /* ignore */
  }
}

export function setLocalStorageMode(mode?: StorageMode | string | null, serverUrl?: string): void {
  const validMode: StorageMode = (mode === 'local_computer' || mode === 'local_server') ? mode : 'cloud'
  // Super admin account can never switch away from cloud
  const effectiveMode: StorageMode = isSuperAdminAccount() ? 'cloud' : validMode

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('edutech_storage_mode', effectiveMode)
    if (serverUrl !== undefined) {
      sessionStorage.setItem('edutech_server_url', serverUrl.trim().replace(/\/+$/, ''))
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('edutech_storage_mode', effectiveMode)
    if (serverUrl !== undefined) {
      localStorage.setItem('edutech_server_url', serverUrl.trim().replace(/\/+$/, ''))
    }
  }
  try {
    const inst = useClassStore.getState().institution
    if (inst) {
      useClassStore.getState().updateInstitution({
        ...inst,
        storageMode: effectiveMode,
        ...(serverUrl !== undefined ? { serverUrl: serverUrl.trim().replace(/\/+$/, '') } : {}),
      })
    }
    useAppStore.getState().updateSettings({
      storageSettings: {
        ...(useAppStore.getState().settings.storageSettings || { serverUrl: '', folderName: '' }),
        mode: effectiveMode,
        ...(serverUrl !== undefined ? { serverUrl: serverUrl.trim().replace(/\/+$/, '') } : {}),
      },
    })
  } catch {
    /* ignore */
  }
}
