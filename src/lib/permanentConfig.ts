import { useAppStore } from '@/store/appStore'
import { useClassStore } from '@/store/classStore'
import { readTextFile, writeTextFile, type VfsDirectoryHandle, hasSavedVaultHandle } from './vault/fsAccess'

export interface PermanentTelegramConfig {
  botToken: string
  chatId: string
  autoBackup: boolean
  lastBackupAt?: string
  lastBackupStatus?: string
}

export interface PermanentConfig {
  storageMode?: 'cloud' | 'local_computer' | 'local_server'
  serverUrl?: string
  folderName?: string
  telegramBackup?: PermanentTelegramConfig
  institutionSlug?: string
  updatedAt?: number
}

const DB_NAME = 'edutech-permanent-config'
const STORE_NAME = 'config'
const CONFIG_KEY = 'permanent_settings'
const BACKUP_STORAGE_KEY = 'edutech_perm_vault_config'

// Synchronous in-memory cache to immediately fulfill synchronous checks (e.g. getActiveStorageMode)
let memConfig: PermanentConfig | null = null

export function getPermanentConfigSync(): PermanentConfig | null {
  if (memConfig) return memConfig
  // Fallback to localStorage mirrored key if present
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(BACKUP_STORAGE_KEY)
      if (raw) {
        memConfig = JSON.parse(raw) as PermanentConfig
        return memConfig
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function getPermanentStorageModeSync(): 'cloud' | 'local_computer' | 'local_server' | null {
  const cfg = getPermanentConfigSync()
  return cfg?.storageMode ?? null
}

export function getPermanentTelegramSync(): PermanentTelegramConfig | null {
  const cfg = getPermanentConfigSync()
  return cfg?.telegramBackup ?? null
}

function openConfigDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'))
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function loadPermanentConfig(): Promise<PermanentConfig | null> {
  try {
    const db = await openConfigDb()
    try {
      const result = await new Promise<PermanentConfig | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.get(CONFIG_KEY)
        req.onsuccess = () => resolve((req.result as PermanentConfig) ?? null)
        req.onerror = () => reject(req.error)
      })

      if (result) {
        memConfig = { ...(memConfig || {}), ...result }
        return memConfig
      }
    } finally {
      db.close()
    }
  } catch {
    /* IndexedDB might not be available or empty; fall back to memory/storage */
  }

  return getPermanentConfigSync()
}

export async function savePermanentConfig(patch: Partial<PermanentConfig>): Promise<void> {
  const current = memConfig || getPermanentConfigSync() || {}
  const merged: PermanentConfig = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  }

  // Deep-merge telegram backup so botToken/chatId are never accidentally erased by partial updates
  if (patch.telegramBackup) {
    merged.telegramBackup = {
      ...(current.telegramBackup || { botToken: '', chatId: '', autoBackup: false }),
      ...patch.telegramBackup,
    }
  }

  memConfig = merged

  // 1. Mirror into localStorage backup key
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(merged))
    }
  } catch {
    /* ignore */
  }

  // 2. Persist to IndexedDB
  try {
    const db = await openConfigDb()
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        store.put(merged, CONFIG_KEY)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } finally {
      db.close()
    }
  } catch {
    /* ignore indexedDB errors */
  }
}

export async function savePermanentStorageMode(
  mode: 'cloud' | 'local_computer' | 'local_server',
  serverUrl?: string,
  folderName?: string
): Promise<void> {
  await savePermanentConfig({
    storageMode: mode,
    ...(serverUrl !== undefined ? { serverUrl } : {}),
    ...(folderName !== undefined ? { folderName } : {}),
  })
}

export async function savePermanentTelegramConfig(
  tg: Partial<PermanentTelegramConfig>
): Promise<void> {
  const current = memConfig?.telegramBackup || getPermanentTelegramSync() || {
    botToken: '',
    chatId: '',
    autoBackup: false,
  }

  const updated: PermanentTelegramConfig = {
    ...current,
    ...tg,
  }

  await savePermanentConfig({
    telegramBackup: updated,
  })
}

/**
 * Re-applies the permanent configuration to Zustand stores, localStorage, and sessionStorage.
 * This guarantees that even after localStorage.clear() or a hard refresh, the stores immediately
 * adopt the persistent storageMode and Telegram connection.
 */
export function applyPermanentConfigToStores(): void {
  const config = getPermanentConfigSync()
  if (!config) return

  // 1. Storage Mode preservation
  if (config.storageMode) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('edutech_storage_mode', config.storageMode)
        if (config.serverUrl) localStorage.setItem('edutech_server_url', config.serverUrl)
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('edutech_storage_mode', config.storageMode)
        if (config.serverUrl) sessionStorage.setItem('edutech_server_url', config.serverUrl)
      }
    } catch {
      /* ignore */
    }

    try {
      useAppStore.getState().updateSettings({
        storageSettings: {
          ...(useAppStore.getState().settings.storageSettings || { serverUrl: '', folderName: '' }),
          mode: config.storageMode,
          ...(config.serverUrl ? { serverUrl: config.serverUrl } : {}),
          ...(config.folderName ? { folderName: config.folderName } : {}),
        },
      })
    } catch {
      /* ignore */
    }

    try {
      const inst = useClassStore.getState().institution
      if (inst) {
        useClassStore.getState().updateInstitution({
          ...inst,
          storageMode: config.storageMode,
          ...(config.serverUrl ? { serverUrl: config.serverUrl } : {}),
          ...(config.folderName ? { folderName: config.folderName } : {}),
        })
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Telegram connection preservation
  if (config.telegramBackup && (config.telegramBackup.botToken || config.telegramBackup.chatId)) {
    try {
      const currentTg = useAppStore.getState().settings.telegramBackup
      const mergedTg = {
        ...(currentTg || { botToken: '', chatId: '', autoBackup: false }),
        ...config.telegramBackup,
      }

      useAppStore.getState().updateSettings({
        telegramBackup: mergedTg,
      })

      // Also mirror onto institution object if available
      const inst = useClassStore.getState().institution
      if (inst) {
        useClassStore.getState().updateInstitution({
          ...inst,
          telegramBackup: mergedTg,
        } as any)
      }

      // Re-populate localStorage keys for settings
      if (typeof localStorage !== 'undefined') {
        const slug =
          (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edutech_inst_slug') : null) ||
          localStorage.getItem('edutech_inst_slug') ||
          config.institutionSlug ||
          'demo'

        const keysToUpdate = [
          'edutech-settings',
          `edutech-settings_${slug}`,
        ]
        const userId =
          (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edutech_user_id') : null) ||
          localStorage.getItem('edutech_user_id')
        if (userId) {
          keysToUpdate.push(`edutech-settings_${slug}_${userId}`)
        }

        for (const k of keysToUpdate) {
          try {
            const raw = localStorage.getItem(k)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (parsed?.state?.settings) {
                parsed.state.settings.telegramBackup = mergedTg
                localStorage.setItem(k, JSON.stringify(parsed))
              }
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
}

/**
 * Writes persistent config files directly to the local PC folder on disk.
 * This guarantees that even if all browser data and IndexedDB are completely wiped,
 * the local PC files retain the telegram credentials and storage status.
 */
export async function savePermanentConfigToVaultHandle(
  handle: VfsDirectoryHandle,
  patch: Partial<PermanentConfig>,
  slug?: string
): Promise<void> {
  const current = memConfig || getPermanentConfigSync() || {}
  const merged: PermanentConfig = {
    ...current,
    ...patch,
  }

  const tg = merged.telegramBackup || { botToken: '', chatId: '', autoBackup: false }
  const tgJson = JSON.stringify(tg, null, 2)
  const configJson = JSON.stringify(
    {
      storageMode: merged.storageMode || 'local_computer',
      serverUrl: merged.serverUrl || '',
      folderName: merged.folderName || handle.name || '',
      telegramBackup: tg,
      institutionSlug: slug || merged.institutionSlug || 'demo',
      updatedAt: Date.now(),
    },
    null,
    2
  )

  // Write at root
  try {
    await writeTextFile(handle, 'telegram.json', tgJson)
  } catch {
    /* ignore */
  }
  try {
    await writeTextFile(handle, 'config.json', configJson)
  } catch {
    /* ignore */
  }

  // Write inside {slug} if available
  if (slug) {
    try {
      await writeTextFile(handle, `${slug}/telegram.json`, tgJson)
    } catch {
      /* ignore */
    }
    try {
      await writeTextFile(handle, `${slug}/config.json`, configJson)
    } catch {
      /* ignore */
    }
  }
}

/**
 * Reads persistent config files directly from the local PC folder on disk.
 */
export async function loadPermanentConfigFromVaultHandle(
  handle: VfsDirectoryHandle,
  slug?: string
): Promise<Partial<PermanentConfig> | null> {
  const result: Partial<PermanentConfig> = {}

  // 1. Try reading config.json (root or {slug}/config.json)
  const configPaths = ['config.json']
  if (slug) configPaths.unshift(`${slug}/config.json`)

  for (const path of configPaths) {
    try {
      const text = await readTextFile(handle, path)
      if (text) {
        const parsed = JSON.parse(text)
        if (parsed.storageMode) result.storageMode = parsed.storageMode
        if (parsed.serverUrl) result.serverUrl = parsed.serverUrl
        if (parsed.folderName) result.folderName = parsed.folderName
        if (parsed.telegramBackup && (parsed.telegramBackup.botToken || parsed.telegramBackup.chatId)) {
          result.telegramBackup = parsed.telegramBackup
        }
        if (parsed.institutionSlug) result.institutionSlug = parsed.institutionSlug
        break
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Try reading telegram.json (root or {slug}/telegram.json)
  const tgPaths = ['telegram.json']
  if (slug) tgPaths.unshift(`${slug}/telegram.json`)

  for (const path of tgPaths) {
    try {
      const text = await readTextFile(handle, path)
      if (text) {
        const parsed = JSON.parse(text)
        if (parsed.botToken || parsed.chatId) {
          result.telegramBackup = {
            ...(result.telegramBackup || { autoBackup: false }),
            ...parsed,
          }
          break
        }
      }
    } catch {
      /* ignore */
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

/**
 * Initializes the permanent configuration system on app boot.
 * Checks IndexedDB for existing vault handles and saved configs,
 * and restores them into memory, stores, and localStorage.
 */
export async function initPermanentConfig(): Promise<void> {
  // 1. Load from IndexedDB
  await loadPermanentConfig()

  // 2. Check if a local PC vault handle is already stored in IndexedDB
  try {
    const hasHandle = await hasSavedVaultHandle()
    if (hasHandle) {
      // If a folder was previously chosen, storage mode is firmly local_computer!
      await savePermanentStorageMode('local_computer')
    }
  } catch {
    /* ignore */
  }

  // 3. Re-apply to stores and localStorage
  applyPermanentConfigToStores()
}
