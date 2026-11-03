import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  savePermanentTelegramConfig,
  savePermanentStorageMode,
  getPermanentConfigSync,
  getPermanentStorageModeSync,
  getPermanentTelegramSync,
  applyPermanentConfigToStores,
  savePermanentConfigToVaultHandle,
  loadPermanentConfigFromVaultHandle,
  initPermanentConfig,
} from './permanentConfig'
import { getActiveStorageMode } from './storageMode'
import { useAppStore } from '@/store/appStore'
import { useClassStore } from '@/store/classStore'
import type { VfsDirectoryHandle, VfsFileHandle } from './vault/fsAccess'

function createMockHandle(): VfsDirectoryHandle {
  const files = new Map<string, string>()

  const createFileHandle = (name: string, getContents: () => string, setContents: (v: string) => void): VfsFileHandle => ({
    kind: 'file',
    name,
    getFile: async () => new File([getContents()], name, { type: 'application/json' }),
    createWritable: async () => {
      let written = ''
      return {
        write: async (chunk: any) => {
          written += typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)
        },
        close: async () => {
          setContents(written)
        },
      } as any
    },
  })

  const dirHandle: VfsDirectoryHandle = {
    kind: 'directory',
    name: 'MockSchoolVault',
    getDirectoryHandle: async (dirName: string, _opts?: any) => {
      return dirHandle
    },
    getFileHandle: async (fileName: string, opts?: any) => {
      if (!files.has(fileName) && !opts?.create) {
        throw new Error('Not found')
      }
      return createFileHandle(
        fileName,
        () => files.get(fileName) || '',
        (val) => files.set(fileName, val)
      )
    },
    values: async function* () {
      for (const [name, content] of files.entries()) {
        yield createFileHandle(name, () => content, (v) => files.set(name, v))
      }
    },
  }

  return dirHandle
}

describe('permanentConfig Subsystem', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('saves and synchronously retrieves permanent Telegram backup configuration', async () => {
    await savePermanentTelegramConfig({
      botToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
      chatId: '-100987654321',
      autoBackup: true,
    })

    const tg = getPermanentTelegramSync()
    expect(tg).not.toBeNull()
    expect(tg?.botToken).toBe('123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11')
    expect(tg?.chatId).toBe('-100987654321')
    expect(tg?.autoBackup).toBe(true)
  })

  it('merges partial Telegram updates without clearing botToken or chatId', async () => {
    await savePermanentTelegramConfig({
      botToken: 'bot111:TOKEN',
      chatId: 'chat999',
      autoBackup: false,
    })

    // Toggling autoBackup should NOT clear botToken or chatId
    await savePermanentTelegramConfig({
      autoBackup: true,
      lastBackupAt: '2026-11-03T20:00:00.000Z',
    })

    const tg = getPermanentTelegramSync()
    expect(tg?.botToken).toBe('bot111:TOKEN')
    expect(tg?.chatId).toBe('chat999')
    expect(tg?.autoBackup).toBe(true)
    expect(tg?.lastBackupAt).toBe('2026-11-03T20:00:00.000Z')
  })

  it('saves and preserves selected storage mode as local_computer', async () => {
    await savePermanentStorageMode('local_computer', undefined, 'MySchoolFolder')

    expect(getPermanentStorageModeSync()).toBe('local_computer')
    expect(getActiveStorageMode()).toBe('local_computer')
  })

  it('retains storage mode and Telegram credentials across localStorage.clear() and hard refresh', async () => {
    // 1. Initial setup
    await savePermanentStorageMode('local_computer', undefined, 'SchoolData')
    await savePermanentTelegramConfig({
      botToken: 'SECRET_TG_BOT',
      chatId: 'SECRET_CHAT_ID',
      autoBackup: true,
    })

    applyPermanentConfigToStores()
    expect(getActiveStorageMode()).toBe('local_computer')
    expect(useAppStore.getState().settings.telegramBackup?.botToken).toBe('SECRET_TG_BOT')

    // 2. Simulate browser hard refresh + localStorage wiped
    localStorage.clear()
    sessionStorage.clear()

    // 3. The permanent config sync cache and getActiveStorageMode must still report local_computer!
    expect(getPermanentStorageModeSync()).toBe('local_computer')
    expect(getActiveStorageMode()).toBe('local_computer')

    const tg = getPermanentTelegramSync()
    expect(tg?.botToken).toBe('SECRET_TG_BOT')
    expect(tg?.chatId).toBe('SECRET_CHAT_ID')

    // 4. On re-applying permanent config, stores are instantly repopulated
    applyPermanentConfigToStores()
    expect(localStorage.getItem('edutech_storage_mode')).toBe('local_computer')
    expect(useAppStore.getState().settings.telegramBackup?.botToken).toBe('SECRET_TG_BOT')
    expect(useClassStore.getState().institution?.storageMode).toBe('local_computer')
  })

  it('writes and reads persistent config files directly to/from local PC vault folder', async () => {
    const handle = createMockHandle()

    await savePermanentConfigToVaultHandle(
      handle,
      {
        storageMode: 'local_computer',
        folderName: 'MyVault',
        telegramBackup: {
          botToken: 'DISK_BOT_TOKEN',
          chatId: 'DISK_CHAT_ID',
          autoBackup: true,
        },
      },
      'demo-school'
    )

    const loaded = await loadPermanentConfigFromVaultHandle(handle, 'demo-school')
    expect(loaded).not.toBeNull()
    expect(loaded?.storageMode).toBe('local_computer')
    expect(loaded?.telegramBackup?.botToken).toBe('DISK_BOT_TOKEN')
    expect(loaded?.telegramBackup?.chatId).toBe('DISK_CHAT_ID')
    expect(loaded?.telegramBackup?.autoBackup).toBe(true)
  })
})
