import React, { useState } from 'react'
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { backupApi } from '@/lib/api'
import { collectLocalStores } from '@/lib/backup'

interface Props {
  isBn: boolean
  schoolSlug: string
  schoolName: string
  email: string
  onEmailChange: (email: string) => void
}

const COMMON_DOMAINS = ['proton.me', 'protonmail.com', 'outlook.com', 'gmail.com']

export const EmailBackupSection: React.FC<Props> = ({
  isBn,
  schoolSlug,
  schoolName,
  email,
  onEmailChange,
}) => {
  const [testing, setTesting] = useState(false)
  const [sending, setSending] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
    details?: { filename?: string; size?: string; sha256?: string; email?: string }
  } | null>(null)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleAppendDomain = (domain: string) => {
    const atIndex = email.indexOf('@')
    const prefix = atIndex !== -1 ? email.slice(0, atIndex) : email
    onEmailChange(`${prefix.trim()}@${domain}`)
  }

  const handleTest = async () => {
    if (!isEmailValid) {
      setStatusMessage({
        type: 'error',
        text: isBn ? 'সঠিক ইমেইল ঠিকানা দিন।' : 'A valid email address is required.',
      })
      return
    }

    setTesting(true)
    setStatusMessage(null)
    try {
      const res = await backupApi.testEmail({ email: email.trim().toLowerCase() })
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: isBn
            ? `ইমেইল ব্যাকআপ সংযোগ সফল হয়েছে! টেস্ট পিং পাঠানো হয়েছে: ${res.email}`
            : `Email backup connection successful! Test ping sent to: ${res.email}`,
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || (isBn ? 'ইমেইল টেস্ট ব্যর্থ হয়েছে।' : 'Email test failed.'),
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
    if (!isEmailValid) {
      setStatusMessage({
        type: 'error',
        text: isBn ? 'সঠিক ইমেইল ঠিকানা দিন।' : 'A valid email address is required.',
      })
      return
    }

    setSending(true)
    setStatusMessage(null)
    try {
      const clientData = collectLocalStores(schoolSlug)
      const res = await backupApi.sendEmailBackup({
        email: email.trim().toLowerCase(),
        schoolSlug,
        schoolName,
        clientData,
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: isBn
            ? `ব্যাকআপ সফলভাবে ইমেইলে পাঠানো হয়েছে!`
            : `Backup bundle successfully sent to ${email}!`,
          details: res.details,
        })
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || (isBn ? 'ব্যাকআপ পাঠানো ব্যর্থ হয়েছে।' : 'Failed to send backup.'),
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || (isBn ? 'ব্যাকআপ পাঠানো ব্যর্থ হয়েছে।' : 'Failed to send backup.'),
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'ইমেইল ও প্রোটন মেইল ক্লাউড ব্যাকআপ ফেচার' : 'Email & Proton Mail Cloud Backup Fetcher'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {isBn ? 'সক্রিয়' : 'Online'}
              </span>
            </div>
            <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
              {isBn
                ? 'প্রোটন মেইল (@proton.me), আউটলুক বা যেকোনো ইমেইলে সুরক্ষিত ব্যাকআপ গ্রহণ ও সংরক্ষণ করুন'
                : 'Send encrypted backup bundles to Proton Mail (@proton.me), Outlook, or any email inbox'}
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] flex items-center justify-between">
          <span>{isBn ? 'গন্তব্য ইমেইল ঠিকানা' : 'Destination Email Address'}</span>
          <span className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
            <Sparkles size={11} className="text-[var(--brand)]" />
            <span>Proton Mail / Outlook / Gmail</span>
          </span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your-school@proton.me"
          className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)] transition-all"
        />

        {/* Quick Domain Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[0.6875rem] text-[var(--text-muted)] mr-1">
            {isBn ? 'দ্রুত যোগ করুন:' : 'Quick:'}
          </span>
          {COMMON_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => handleAppendDomain(domain)}
              className="text-[0.6875rem] px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
            >
              @{domain}
            </button>
          ))}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-[0.75rem] flex items-start gap-2.5 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          )}
          <div className="space-y-1">
            <div className="font-medium">{statusMessage.text}</div>
            {statusMessage.details && (
              <div className="text-[0.6875rem] opacity-80 font-mono">
                {statusMessage.details.filename && <div>File: {statusMessage.details.filename}</div>}
                {statusMessage.details.size && <div>Size: {statusMessage.details.size}</div>}
                {statusMessage.details.sha256 && <div>SHA256: {statusMessage.details.sha256}...</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || sending || !isEmailValid}
          className="h-9 px-3.5 rounded-xl text-[0.75rem] font-semibold border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-all"
        >
          {testing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          <span>{testing ? (isBn ? 'টেস্ট হচ্ছে...' : 'Testing...') : (isBn ? 'সংযোগ টেস্ট ও পিং' : 'Test Connection & Ping')}</span>
        </button>

        <button
          type="button"
          onClick={handleSendBackup}
          disabled={testing || sending || !isEmailValid}
          className="h-9 px-4 rounded-xl text-[0.75rem] font-semibold text-white bg-[var(--brand)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          <span>{sending ? (isBn ? 'ব্যাকআপ পাঠানো হচ্ছে...' : 'Sending Backup...') : (isBn ? 'এখনই ইমেইলে ব্যাকআপ পাঠান' : 'Send Backup to Email Now')}</span>
        </button>
      </div>
    </div>
  )
}
