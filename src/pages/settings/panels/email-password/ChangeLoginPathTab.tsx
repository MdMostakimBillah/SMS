import React, { useState } from 'react'
import { KeyRound, Copy, Check, RefreshCw, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { getLoginSecret, setLoginSecret, rotateLoginSecret, clearLoginSecret } from '@/lib/loginPath'

interface Props {
  isBn: boolean
}

const RESERVED_PATHS = new Set(['api', 'register', 'dashboard', 'i', 'super-admin', 'health'])

export const ChangeLoginPathTab = React.memo(function ChangeLoginPathTab({ isBn }: Props) {
  const [activeSecret, setActiveSecret] = useState<string>(() => getLoginSecret())
  const [customPath, setCustomPath] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [error, setError] = useState('')

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

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSavedMessage('')

    const valError = validatePath(customPath)
    if (valError) {
      setError(valError)
      return
    }

    const clean = setLoginSecret(customPath)
    setActiveSecret(clean)
    setCustomPath('')
    setSavedMessage(isBn ? 'সুপার অ্যাডমিন লগইন পাথ সফলভাবে পরিবর্তন করা হয়েছে।' : 'Super admin login path updated successfully.')
  }

  const handleRotate = () => {
    setError('')
    const newSecret = rotateLoginSecret()
    setActiveSecret(newSecret)
    setCustomPath('')
    setSavedMessage(isBn ? 'একটি নতুন এলোমেলো লগইন পাথ তৈরি করা হয়েছে।' : 'A new random secret login path has been generated.')
  }

  const handleReset = () => {
    setError('')
    clearLoginSecret()
    const fallback = getLoginSecret()
    setActiveSecret(fallback)
    setCustomPath('')
    setSavedMessage(isBn ? 'ডিফল্ট (.env) লগইন পাথে রিসেট করা হয়েছে।' : 'Reset to the default (.env) login path.')
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
              className="w-full h-10 pl-6 pr-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[0.8125rem] font-mono text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!customPath.trim()}
            className="h-10 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isBn ? 'সংরক্ষণ' : 'Save'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleRotate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[0.6875rem] font-medium transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>{isBn ? 'র‍্যান্ডম তৈরি করুন' : 'Generate Random'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[0.6875rem] font-medium transition-colors cursor-pointer"
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
              পাথ পরিবর্তন করলে পূর্ববর্তী লিংক আর কাজ করবে না। তবে আপনার <strong>.env</strong> ফাইলে উল্লেখিত পাথটি সর্বদা ব্যাকআপ হিসেবে কার্যকর থাকবে যাতে কখনও লকআউট না হতে হয়।
            </>
          ) : (
            <>
              Changing this path takes effect immediately. The path configured in your <strong>.env</strong> file remains valid as a permanent fail-safe recovery route.
            </>
          )}
        </div>
      </div>
    </div>
  )
})
