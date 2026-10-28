/**
 * Daily Telegram auto-backup scheduler.
 *
 * Runs while the app is open: once every 24h (checked hourly) it pushes the
 * institution's bundle to the configured Telegram chat. In local-computer
 * mode it goes browser → Telegram directly; otherwise through the API server.
 */

import { useAppStore } from '@/store/appStore'
import { sendTelegramBackupNow } from '../backup'

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // hourly
const DUE_MS = 24 * 60 * 60 * 1000

let started = false

async function runIfDue(): Promise<void> {
  const { settings } = useAppStore.getState()
  const tg = settings.telegramBackup
  if (!tg?.autoBackup || !tg.botToken || !tg.chatId) return
  if (tg.lastBackupAt && Date.now() - Date.parse(tg.lastBackupAt) < DUE_MS) return

  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return

  const via = settings.storageSettings?.mode === 'local_computer' ? 'browser' : 'server'
  const res = await sendTelegramBackupNow({
    botToken: tg.botToken,
    chatId: tg.chatId,
    schoolSlug: slug,
    includeLocalStores: true,
    via,
  })

  useAppStore.setState((state) => ({
    settings: {
      ...state.settings,
      telegramBackup: {
        ...state.settings.telegramBackup,
        botToken: tg.botToken,
        chatId: tg.chatId,
        autoBackup: tg.autoBackup,
        lastBackupAt: new Date().toISOString(),
        lastBackupStatus: res.success
          ? `success: ${res.filename ?? 'backup'}`
          : `failed: ${res.error ?? 'unknown'}`,
      },
    },
  }))
}

/** Start the hourly due-check. Safe to call multiple times. */
export function startAutoBackupScheduler(): void {
  if (started || typeof window === 'undefined') return
  started = true
  setTimeout(() => void runIfDue(), 30 * 1000) // first check shortly after startup
  setInterval(() => void runIfDue(), CHECK_INTERVAL_MS)
}
