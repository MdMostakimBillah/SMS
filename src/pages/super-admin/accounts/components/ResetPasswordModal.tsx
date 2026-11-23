import { useState, useEffect } from 'react'
import { X, KeyRound, Eye, EyeOff, Sparkles, Copy, Check, ShieldCheck } from 'lucide-react'
import type { ResetPasswordModalProps } from '../types'

export function ResetPasswordModal({
  isBn,
  account,
  onClose,
  onSave,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (account) {
      setPassword(account.password)
      setError('')
      setCopied(false)
    }
  }, [account])

  if (!account) return null

  const generatePin = () => {
    let pin = ''
    for (let i = 0; i < 6; i++) {
      pin += Math.floor(Math.random() * 10).toString()
    }
    setPassword(pin)
    setError('')
  }

  const generateStrong = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let pass = 'Edu#'
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
    setError('')
  }

  const handleCopy = () => {
    if (!password) return
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = password.trim()
    if (!clean) {
      setError(isBn ? 'পাসওয়ার্ড খালি রাখা যাবে না' : 'Password cannot be empty')
      return
    }
    if (clean.length < 4) {
      setError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' : 'Password must be at least 4 characters')
      return
    }
    onSave(account.id, clean)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {account.role === 'student' ? (isBn ? 'ছাত্র:' : 'Student:') : (isBn ? 'অভিভাবক:' : 'Parent:')}{' '}
                {account.studentNameEn} • ({account.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.75rem] font-semibold text-[var(--text-primary)] mb-1.5">
              {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="Enter new password or generate"
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] transition-colors"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
                  title={showPassword ? (isBn ? 'লুকান' : 'Hide') : (isBn ? 'দেখান' : 'Show')}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
                  title={isBn ? 'কপি করুন' : 'Copy'}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-[0.6875rem] mt-1.5 font-medium">{error}</p>
            )}
          </div>

          {/* Quick Generators */}
          <div className="space-y-1.5">
            <span className="block text-[0.6875rem] font-semibold text-[var(--text-muted)]">
              {isBn ? 'স্বয়ংক্রিয় পাসওয়ার্ড তৈরি করুন:' : 'Quick Password Generators:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generatePin}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>{isBn ? '৬-ডিজিট পিন' : '6-Digit PIN'}</span>
              </button>
              <button
                type="button"
                onClick={generateStrong}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
              >
                <ShieldCheck size={13} className="text-indigo-500" />
                <span>{isBn ? 'সুরক্ষিত পাসওয়ার্ড' : 'Strong Pass'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent border-none"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:brightness-110 shadow-sm transition-all cursor-pointer border-none"
            >
              {isBn ? 'পাসওয়ার্ড সেট করুন' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
