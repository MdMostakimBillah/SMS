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
  if (isSuperAdminAccount()) {
    return false
  }

  try {
    const instMode = (useClassStore.getState()?.institution as any)?.storageMode
    if (instMode === 'local_computer') return true

    const appSettingMode = useAppStore.getState()?.settings?.storageSettings?.mode
    if (appSettingMode === 'local_computer') return true

    if (typeof sessionStorage !== 'undefined') {
      const sess = sessionStorage.getItem('edutech_storage_mode')
      if (sess === 'local_computer') return true
    }
  } catch {
    /* fallback to cloud */
  }
  return false
}

export function getActiveStorageMode(): StorageMode {
  if (isSuperAdminAccount()) {
    return 'cloud'
  }

  try {
    const instMode = (useClassStore.getState()?.institution as any)?.storageMode
    if (instMode) return instMode as StorageMode

    const appSettingMode = useAppStore.getState()?.settings?.storageSettings?.mode
    if (appSettingMode) return appSettingMode as StorageMode

    if (typeof sessionStorage !== 'undefined') {
      const sess = sessionStorage.getItem('edutech_storage_mode')
      if (sess) return sess as StorageMode
    }
  } catch {
    /* fallback to cloud */
  }
  return 'cloud'
}

export function setLocalStorageMode(mode: StorageMode): void {
  // Super admin account can never switch away from cloud
  const effectiveMode: StorageMode = isSuperAdminAccount() ? 'cloud' : mode

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('edutech_storage_mode', effectiveMode)
  }
  try {
    const inst = useClassStore.getState().institution
    if (inst) {
      useClassStore.getState().updateInstitution({
        ...inst,
        storageMode: effectiveMode,
      })
    }
    useAppStore.getState().updateSettings({
      storageSettings: {
        ...(useAppStore.getState().settings.storageSettings || { serverUrl: '', folderName: '' }),
        mode: effectiveMode,
      },
    })
  } catch {
    /* ignore */
  }
}
