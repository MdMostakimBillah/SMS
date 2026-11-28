import React, { useState, useEffect } from 'react'
import { KeyRound, Copy, Check, RefreshCw, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { getLoginSecret, setLoginSecret, clearLoginSecret, generateSecureLoginSecret } from '@/lib/loginPath'
import { authApi } from '@/lib/api'

interface Props {
  isBn: boolean
}

const RESERVED_PATHS = new Set(['api', 'register', 'dashboard', 'i', 'super-admin', 'health', 'login', 'admin', 'superadmin'])

export const ChangeLoginPathTab = React.memo(function ChangeLoginPathTab({ isBn }: Props) {
  const [activeSecret, setActiveSecret] = useState<string>(() => getLoginSecret())
  const [customPath, setCustomPath] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync active path from database on mount
  useEffect(() => {
    let active = true
    authApi.getSuperAdminLoginPath()
      .then((res) => {
        if (!active || !res?.loginPath) return
        const clean = res.loginPath.trim().replace(/^\/+|\/+$/g, '')
        if (clean) {
          setActiveSecret(clean)
          setLoginSecret(clean)
        }
      })
      .catch(() => {
        // Fallback to local settings if backend unreachable
      })
    return () => {
      active = false
    }
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://edutech.pro.bd'
  const fullLoginUrl = `${origin}/${activeSecret}`

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullLoginUrl).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const validatePath = (path: string): string | null => {
    const clean = path.trim().replace(/^\/+|\/+$/g, '')
    if (!clean) {
      return isBn ? 'পাথ খালি হতে পারে না' : 'Path cannot be empty'
    }
    if (clean.length < 4) {
      return isBn ? 'পাথ কমপক্ষে ৪ অক্ষরের হতে হবে' : 'Path must be at least 4 characters'
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      return isBn
        ? 'শুধুমাত্র বর্ণ, সংখ্যা, হাইফেন (-) এবং আন্ডারস্কোর (_) ব্যবহার করুন'
        : 'Only letters, numbers, hyphens (-), and underscores (_) are allowed'
    }
    if (RESERVED_PATHS.has(clean.toLowerCase())) {
      return isBn ? `"${clean}" একটি সংরক্ষিত পাথ` : `"${clean}" is a reserved system path`
    }
    return null
  }

  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSavedMessage('')

    const valError = validatePath(customPath)
    if (valError) {
      setError(valError)
      return
    }

    const clean = customPath.trim().replace(/^\/+|\/+$/g, '')
    setSaving(true)
    try {
      const res = await authApi.updateSuperAdminLoginPath(clean)
      const newPath = res?.loginPath || clean
      setLoginSecret(newPath)
      setActiveSecret(newPath)
      setCustomPath('')
      const envSynced = res?.envSyncStatus === 'synced' || res?.envSynced === true
      const readOnlyHost = res?.envSyncStatus === 'readonly' || res?.envSyncStatus === 'missing'
      setSavedMessage(
        envSynced
          ? isBn
            ? 'সুপার অ্যাডমিন লগইন পাথ এনক্রিপ্ট করে ডাটাবেজে ও .env ফাইলে সফলভাবে সংরক্ষণ করা হয়েছে।'
            : 'Super admin login path saved securely to encrypted database and updated in .env.'
          : readOnlyHost
            ? isBn
              ? 'লগইন পাথ এনক্রিপ্ট করে ডাটাবেজে সংরক্ষণ করা হয়েছে (হোস্ট ফাইলসিস্টেম রিড-অনলি হওয়ায় .env পরিবর্তন করা যায়নি)।'
              : 'Login path saved securely to encrypted database (host filesystem is read-only; rebuild env if needed).'
            : isBn
              ? 'সুপার অ্যাডমিন লগইন পাথ এনক্রিপ্ট করে ডাটাবেজে সফলভাবে সংরক্ষণ করা হয়েছে।'
              : 'Super admin login path updated and saved securely to database.'
      )
    } catch (err: any) {
      setError(err?.message || (isBn ? 'লগইন পাথ সংরক্ষণ করতে ব্যর্থ হয়েছে।' : 'Failed to update login path.'))
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateRandom = () => {
    setError('')
    setSavedMessage('')
    const randomSecret = generateSecureLoginSecret(20)
    setCustomPath(randomSecret)
  }

  const handleReset = async () => {
    setError('')
    setSavedMessage('')
    setSaving(true)
    try {
      const res = await authApi.resetSuperAdminLoginPath()
      clearLoginSecret()
      const fallback = res?.loginPath || getLoginSecret()
      setActiveSecret(fallback)
      setCustomPath('')
      setSavedMessage(
        isBn
          ? 'ডিফল্ট (.env) লগইন পাথে সফলভাবে রিসেট করা হয়েছে।'
          : 'Reset to the default (.env) login path successfully.'
      )
    } catch (err: any) {
      setError(err?.message || (isBn ? 'পাথ রিসেট করতে ব্যর্থ হয়েছে।' : 'Failed to reset login path.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current URL Card */}
      <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <KeyRound size={16} className="text-[var(--brand)]" />
            <span className="text-[0.8125rem] font-semibold">
              {isBn ? 'বর্তমান সক্রিয় লগইন ইউআরএল' : 'Current Active Login URL'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium transition-all cursor-pointer bg-[var(--brand)] text-white hover:opacity-90 active:scale-95 border-none"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? (isBn ? 'কপি হয়েছে' : 'Copied!') : (isBn ? 'কপি লিংক' : 'Copy URL')}</span>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] font-mono text-[0.75rem] text-[var(--text-primary)] break-all select-all">
          {fullLoginUrl}
        </div>

        <p className="text-[0.6875rem] text-[var(--text-muted)] leading-relaxed">
          {isBn
            ? 'এই গোপন লিংকটি ব্যবহার করে সুপার অ্যাডমিন সরাসরি লগইন পেজে প্রবেশ করতে পারেন। এটি সাধারণ ব্যবহারকারীদের থেকে গোপন রাখুন।'
            : 'This secret link grants direct access to the Super Administrator portal. Keep it confidential.'}
        </p>
      </div>

      {/* Success Notification */}
      {savedMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[0.75rem]">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[0.75rem]">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Change Path Form */}
      <form onSubmit={handleSaveCustom} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
        <label className="block text-[0.75rem] font-medium text-[var(--text-primary)]">
          {isBn ? 'নতুন কাস্টম লগইন পাথ নির্ধারণ করুন' : 'Set New Custom Login Path'}
        </label>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[0.8125rem] text-[var(--text-muted)]">
              /
            </span>
            <input
              type="text"
              value={customPath}
              onChange={(e) => {
                setCustomPath(e.target.value.replace(/^\/+/, ''))
                setError('')
              }}
              placeholder={activeSecret}
              disabled={saving}
              className="w-full h-10 pl-6 pr-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[0.8125rem] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!customPath.trim() || saving}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <span>{isBn ? 'সংরক্ষণ' : 'Save'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleGenerateRandom}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[0.6875rem] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} />
            <span>{isBn ? 'র‍্যান্ডম তৈরি করুন' : 'Generate Random'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[0.6875rem] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={12} />
            <span>{isBn ? 'ডিফল্ট (.env) রিসেট' : 'Reset to .env Default'}</span>
          </button>
        </div>
      </form>

      {/* Info notice */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[var(--text-secondary)] text-[0.6875rem] leading-relaxed">
        <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          {isBn ? (
            <>
              নতুন পাথ সংরক্ষণ করলে তা ডাটাবেজে AES-256-GCM দ্বারা এনক্রিপ্ট হয়ে জমা হয় (প্লেইনটেক্সট হিসেবে নয়) এবং <strong>.env</strong> ফাইলের শুধুমাত্র লগইন পাথ নিরাপদে প্রতিস্থাপিত হয়।
            </>
          ) : (
            <>
              Saving updates the active URL in encrypted storage (AES-256-GCM at rest in PostgreSQL) and atomically replaces only the login path key inside <strong>.env</strong> without altering other secrets.
            </>
          )}
        </div>
      </div>
    </div>
  )
})
