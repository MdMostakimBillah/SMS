import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheck, Eye, EyeOff, KeyRound, ArrowLeft, Clock, AlertTriangle, Mail, CheckCircle2 } from 'lucide-react'

export interface SuperAdminSecurityPinFormProps {
  email: string
  verificationCode?: string
  isBn: boolean
  isDark: boolean
  isLockedOut: boolean
  lockoutRemaining: number
  formatTime: (ms: number) => string
  error: string | null
  clearError: () => void
  onVerify: (pin: string) => Promise<void>
  onResend?: () => Promise<void>
  onBack: () => void
}

export const SuperAdminSecurityPinForm: React.FC<SuperAdminSecurityPinFormProps> = React.memo(
  function SuperAdminSecurityPinForm({
    email,
    isBn,
    isDark,
    isLockedOut,
    lockoutRemaining,
    formatTime,
    error,
    clearError,
    onVerify,
    onResend,
    onBack,
  }) {
    const [pin, setPin] = useState('')
    const [showPin, setShowPin] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [resendSuccess, setResendSuccess] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      inputRef.current?.focus()
    }, [])

    useEffect(() => {
      if (resendCooldown <= 0) return
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }, [resendCooldown])

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
      setPin(val)
      clearError()
    }

    const canSubmit = pin.length >= 4 && !submitting && !isLockedOut

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit) return
      setSubmitting(true)
      try {
        await onVerify(pin)
      } finally {
        setSubmitting(false)
      }
    }

    const handleResendClick = async () => {
      if (!onResend || resending || resendCooldown > 0) return
      setResending(true)
      setResendSuccess(false)
      try {
        await onResend()
        setResendSuccess(true)
        setResendCooldown(60)
        setTimeout(() => setResendSuccess(false), 5000)
      } finally {
        setResending(false)
      }
    }

    return (
      <div className="w-full space-y-4">
        {/* Security verification header badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/20">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-[var(--brand)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
              {isBn ? '২-ধাপ নিরাপত্তা যাচাইকরণ' : 'Step 2: Security Verification'}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {email}
            </div>
          </div>
        </div>

        {/* Email dispatched notice */}
        <div
          className={`p-3 rounded-xl flex items-start gap-2.5 ${
            isDark
              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <Mail size={16} className="shrink-0 mt-0.5" />
          <div className="text-[0.75rem] leading-relaxed">
            <p className="font-semibold">
              {isBn
                ? `আপনার জিমেইলে (${email}) ৬-ডিজিট ভেরিফিকেশন কোড পাঠানো হয়েছে।`
                : `A 6-digit verification code has been sent to your Gmail (${email}).`}
            </p>
            <p className={`text-[0.6875rem] mt-0.5 ${isDark ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
              {isBn
                ? 'অনুগ্রহ করে আপনার ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন এবং কোডটি নিচে দিন।'
                : 'Please check your inbox or spam folder and enter the code below.'}
            </p>
          </div>
        </div>

        {/* Resend success notice */}
        {resendSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[0.75rem] flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>
              {isBn
                ? 'নতুন যাচাইকরণ কোড সফলভাবে জিমেইলে পাঠানো হয়েছে!'
                : 'A new verification code has been sent to your Gmail!'}
            </span>
          </div>
        )}

        {/* Lockout Banner */}
        {isLockedOut && (
          <div className="px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
            <Clock size={14} className="text-amber-500 shrink-0" />
            <span className="text-[0.75rem] text-amber-500 font-medium">
              {isBn
                ? `অ্যাক্সেস সাময়িক স্থগিত — ${formatTime(lockoutRemaining)} পর চেষ্টা করুন`
                : `Locked out — Try again in ${formatTime(lockoutRemaining)}`}
            </span>
          </div>
        )}

        {/* Verification Error */}
        {error && !isLockedOut && (
          <div className="px-3 py-2.5 rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/20 flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--red)] shrink-0" />
            <span className="text-[0.75rem] text-[var(--red)] font-medium flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-[0.75rem] font-medium mb-1.5 block ${isDark ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
              {isBn ? 'নিরাপত্তা যাচাইকরণ কোড (Verification Code)' : 'Security Verification Code'}
            </label>
            <div className="relative">
              <KeyRound size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/30' : 'text-[var(--text-muted)]'}`} />
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={pin}
                onChange={handlePinChange}
                placeholder="••••••"
                disabled={isLockedOut || submitting}
                className={`w-full h-12 pl-10 pr-11 rounded-xl border text-[1.125rem] tracking-[0.3em] font-mono outline-none transition-all ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-[var(--brand)]/60 focus:bg-white/[0.08]'
                    : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/60 focus:bg-[var(--bg-secondary)]'
                } ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none transition-colors ${
                  isDark ? 'text-white/30 hover:text-white/60' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)] px-1">
              <span>{isBn ? '৬ সংখ্যার ভেরিফিকেশন কোড প্রদান করুন' : 'Provide 6-digit verification code'}</span>
              <span>{pin.length} / 6</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-11 rounded-xl text-[0.875rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                : isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
              color: canSubmit ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            }}
          >
            <ShieldCheck size={16} />
            <span>
              {submitting
                ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                : (isBn ? 'যাচাই করুন ও প্রবেশ করুন' : 'Verify & Authenticate')}
            </span>
          </button>
        </form>

        {onResend && (
          <div className="text-center pt-1">
            <button
              type="button"
              disabled={resending || resendCooldown > 0}
              onClick={handleResendClick}
              className={`text-[0.75rem] cursor-pointer bg-transparent border-none transition-colors underline disabled:no-underline disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'text-white/40 hover:text-white/70' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {resending
                ? (isBn ? 'কোড পাঠানো হচ্ছে...' : 'Sending code...')
                : resendCooldown > 0
                ? (isBn ? `পুনরায় কোড পাঠান (${resendCooldown}s)` : `Resend Code (${resendCooldown}s)`)
                : (isBn ? 'কোড পাননি? নতুন কোড পাঠান' : "Didn't receive code? Resend Code")}
            </button>
          </div>
        )}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onBack}
            className={`text-[0.75rem] inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none transition-colors ${
              isDark ? 'text-white/40 hover:text-white/70' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <ArrowLeft size={13} />
            <span>{isBn ? 'অন্য ক্রেডেনশিয়াল দিয়ে প্রবেশ করুন' : 'Use different credentials'}</span>
          </button>
        </div>
      </div>
    )
  }
)
