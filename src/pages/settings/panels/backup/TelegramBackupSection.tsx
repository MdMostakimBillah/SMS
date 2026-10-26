import React, { useState } from 'react'
import { Send, CheckCircle2, AlertCircle, Bot, Loader2, ShieldCheck, Key } from 'lucide-react'
import { testTelegram, sendTelegramBackupNow } from '@/lib/backup'

interface Props {
  isBn: boolean
  schoolSlug: string
  schoolName: string
  botToken: string
  chatId: string
  autoBackup: boolean
  onBotTokenChange: (token: string) => void
  onChatIdChange: (id: string) => void
  onAutoBackupChange: (enabled: boolean) => void
}

export const TelegramBackupSection: React.FC<Props> = ({
  isBn,
  schoolSlug,
  schoolName,
  botToken,
  chatId,
  autoBackup,
  onBotTokenChange,
  onChatIdChange,
  onAutoBackupChange,
}) => {
  const [testing, setTesting] = useState(false)
  const [sending, setSending] = useState(false)
  const [botInfo, setBotInfo] = useState<{ username?: string; name?: string } | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
    details?: { filename?: string; size?: string; sha256?: string }
  } | null>(null)

  const handleTest = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setStatusMessage({
        type: 'error',
        text: isBn ? 'বট টোকেন এবং চ্যাট আইডি প্রয়োজন।' : 'Telegram Bot Token and Chat ID are required.',
      })
      return
    }

    setTesting(true)
    setStatusMessage(null)
    try {
      const res = await testTelegram(botToken.trim(), chatId.trim())
      if (res.success) {
        setBotInfo(res.bot || null)
        setStatusMessage({
          type: 'success',
          text: isBn
            ? `টেলিগ্রাম সফলভাবে সংযুক্ত হয়েছে! বট: @${res.bot?.username || 'EduTechBot'}`
            : `Telegram connected successfully! Bot: @${res.bot?.username || 'EduTechBot'}`,
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || (isBn ? 'সংযোগ ব্যর্থ হয়েছে।' : 'Connection failed.'),
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (isBn ? 'সার্ভারে অনুরোধ পাঠানো যায়নি।' : 'Failed to reach server.'),
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSendBackup = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setStatusMessage({
        type: 'error',
        text: isBn ? 'বট টোকেন এবং চ্যাট আইডি প্রয়োজন।' : 'Telegram Bot Token and Chat ID are required.',
      })
      return
    }

    setSending(true)
    setStatusMessage(null)
    try {
      const res = await sendTelegramBackupNow({
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        schoolSlug,
        schoolName,
        includeLocalStores: true,
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: isBn ? 'টেলিগ্রাম চ্যানেলে ব্যাকআপ ফাইল সফলভাবে পাঠানো হয়েছে!' : 'Backup file delivered to Telegram channel!',
          details: {
            filename: res.filename,
            size: res.size,
            sha256: res.sha256,
          },
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || (isBn ? 'টেলিগ্রাম ব্যাকআপ ব্যর্থ হয়েছে।' : 'Telegram backup failed.'),
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (isBn ? 'টেলিগ্রাম ব্যাকআপ পাঠাতে ত্রুটি হয়েছে।' : 'Failed to send backup to Telegram.'),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(34,197,94,0.12)] text-[var(--green)] flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'টেলিগ্রাম ক্লাউড ব্যাকআপ ফেচার' : 'Telegram Cloud Backup Fetcher'}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-muted)]">
              {isBn ? 'টেলিগ্রাম বট এর মাধ্যমে স্বয়ংক্রিয় ব্যাকআপ ও তাৎক্ষণিক পুশ' : 'Instant & automated database snapshots via Telegram bot'}
            </p>
          </div>
        </div>

        {botInfo && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6875rem] font-medium bg-[rgba(16,185,129,0.1)] text-[var(--green)] border border-[rgba(16,185,129,0.2)]">
            <ShieldCheck size={12} />
            @{botInfo.username}
          </span>
        )}
      </div>

      {/* Input fields */}
      <div className="space-y-3">
        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
            <Key size={13} />
            {isBn ? 'টেলিগ্রাম বট টোকেন (Bot Token)' : 'Telegram Bot Token'}
          </label>
          <input
            type="password"
            value={botToken}
            onChange={(e) => onBotTokenChange(e.target.value)}
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] font-mono"
          />
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
            <Bot size={13} />
            {isBn ? 'টেলিগ্রাম চ্যাট আইডি (Chat ID)' : 'Telegram Chat ID'}
          </label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => onChatIdChange(e.target.value)}
            placeholder="-1001234567890 or @channelname"
            className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] font-mono"
          />
        </div>
      </div>

      {/* Auto Backup toggle */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
            {isBn ? 'দৈনিক স্বয়ংক্রিয় ব্যাকআপ' : 'Daily Automated Backup'}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">
            {isBn ? 'প্রতিদিন নির্দিষ্ট সময়ে টেলিগ্রামে ব্যাকআপ পাঠানো' : 'Trigger automated daily backup to Telegram'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAutoBackupChange(!autoBackup)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border-none ${
            autoBackup ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
              autoBackup ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl flex flex-col gap-1 text-[0.8125rem] ${
            statusMessage.type === 'success'
              ? 'bg-[rgba(16,185,129,0.1)] text-[var(--green)] border border-[rgba(16,185,129,0.2)]'
              : 'bg-[rgba(239,68,68,0.1)] text-[var(--red)] border border-[rgba(239,68,68,0.2)]'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.details && (
            <div className="text-[0.6875rem] text-[var(--text-secondary)] pl-6 space-y-0.5 mt-1 font-mono">
              {statusMessage.details.filename && <div>File: {statusMessage.details.filename}</div>}
              {statusMessage.details.size && <div>Size: {statusMessage.details.size}</div>}
              {statusMessage.details.sha256 && (
                <div>SHA256: {statusMessage.details.sha256.slice(0, 24)}...</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={testing || sending}
          onClick={handleTest}
          className="h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-all"
        >
          {testing ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
          {isBn ? 'সংযোগ পরীক্ষা করুন' : 'Test Connection'}
        </button>

        <button
          type="button"
          disabled={testing || sending}
          onClick={handleSendBackup}
          className="flex-1 h-10 px-3.5 rounded-xl bg-[var(--green)] text-white font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50 transition-all"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {isBn ? 'এখনই টেলিগ্রামে ব্যাকআপ পাঠান' : 'Send Backup to Telegram Now'}
        </button>
      </div>
    </div>
  )
}
