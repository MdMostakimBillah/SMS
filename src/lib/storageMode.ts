import { useClassStore } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'

export type StorageMode = 'cloud' | 'local_computer' | 'local_server'

/**
 * Returns true if the active institution is operating in Local Computer mode.
 * In this mode, server database mutations (PostgreSQL / Supabase) are completely stopped,
 * and the app relies exclusively on local computer storage (JSON / localStorage).
 */
export function isLocalComputerMode(): boolean {
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
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('edutech_storage_mode', mode)
  }
  try {
    useAppStore.getState().updateSettings({
      storageSettings: {
        ...(useAppStore.getState().settings.storageSettings || { serverUrl: '', folderName: '' }),
        mode,
      },
    })
  } catch {
    /* ignore */
  }
}
