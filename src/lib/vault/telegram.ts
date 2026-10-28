/**
 * Direct browser → Telegram Bot API client.
 *
 * Used when an institution runs fully local (no EduTech server reachable):
 * the Bot API is plain HTTPS, so the browser can push backups straight to
 * the institution's own Telegram channel without any middleman.
 */

import type { BackupBundle } from '../backup'

const TELEGRAM_API = 'https://api.telegram.org'

export interface TelegramResult {
  success: boolean
  error?: string
}

export interface TelegramBotInfo extends TelegramResult {
  bot?: { id?: number; username?: string; name?: string }
}

export interface TelegramSendResult extends TelegramResult {
  filename?: string
  size?: string
  sha256?: string
  messageId?: number
}

function botUrl(token: string, method: string): string {
  return `${TELEGRAM_API}/bot${token}/${method}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Verify the bot token and return the bot's identity. */
export async function telegramGetMe(token: string): Promise<TelegramBotInfo> {
  if (!token.trim()) return { success: false, error: 'Bot token is required.' }
  try {
    const res = await fetch(botUrl(token.trim(), 'getMe'))
    const data = (await res.json()) as {
      ok: boolean
      description?: string
      result?: { id?: number; username?: string; first_name?: string }
    }
    if (!data.ok) {
      return { success: false, error: data.description || 'Telegram rejected the bot token.' }
    }
    return {
      success: true,
      bot: {
        id: data.result?.id,
        username: data.result?.username,
        name: data.result?.first_name,
      },
    }
  } catch {
    return { success: false, error: 'Could not reach Telegram. Check your internet connection.' }
  }
}

/** Send a JSON backup document to the configured chat/channel. */
export async function telegramSendBackup(opts: {
  botToken: string
  chatId: string
  filename: string
  content: string
  caption?: string
}): Promise<TelegramSendResult> {
  const { botToken, chatId, filename, content, caption } = opts
  if (!botToken.trim() || !chatId.trim()) {
    return { success: false, error: 'Bot token and chat ID are required.' }
  }

  try {
    const form = new FormData()
    form.append('chat_id', chatId.trim())
    form.append('document', new Blob([content], { type: 'application/json' }), filename)
    if (caption) form.append('caption', caption)

    const res = await fetch(botUrl(botToken.trim(), 'sendDocument'), {
      method: 'POST',
      body: form,
    })
    const data = (await res.json()) as {
      ok: boolean
      description?: string
      result?: { message_id?: number }
    }
    if (!data.ok) {
      return { success: false, error: data.description || 'Telegram rejected the backup file.' }
    }
    return {
      success: true,
      filename,
      size: formatBytes(new TextEncoder().encode(content).length),
      sha256: await sha256Hex(content),
      messageId: data.result?.message_id,
    }
  } catch {
    return { success: false, error: 'Could not reach Telegram. Check your internet connection.' }
  }
}

/** Send a collected backup bundle as a single pretty-printed JSON document. */
export async function sendBundleToTelegram(opts: {
  botToken?: string
  chatId?: string
  bundle: BackupBundle
  institutionName?: string
}): Promise<TelegramSendResult> {
  const token = opts.botToken?.trim()
  const chatId = opts.chatId?.trim()
  if (!token || !chatId) {
    return { success: false, error: 'Telegram bot token and chat ID are required.' }
  }

  const content = JSON.stringify(opts.bundle, null, 2)
  const date = new Date().toISOString().slice(0, 10)
  const name = opts.institutionName ? ` (${opts.institutionName})` : ''
  const caption =
    `EduTech SMS backup${name}\n` +
    `Institution: ${opts.bundle.metadata.slug}\n` +
    `Date: ${new Date().toISOString()}\n` +
    `Records: ${opts.bundle.metadata.counts.classes} classes, ` +
    `${opts.bundle.metadata.counts.teachers} teachers, ` +
    `${opts.bundle.metadata.counts.students} students`

  return telegramSendBackup({
    botToken: token,
    chatId,
    filename: `edutech_backup_${opts.bundle.metadata.slug}_${date}.json`,
    content,
    caption,
  })
}
