import React, { useState, useEffect } from 'react'
import { X, Mail, CheckCircle, AlertTriangle, Loader2, Send, RefreshCw, Shield, Sparkles } from 'lucide-react'
import { authApi } from '@/lib/api'
import { sendVerificationCode } from '@/lib/emailService'
import { OtpInput } from '@/components/shared/OtpInput'
import { useNavigate } from 'react-router-dom'
import { getDashboardPath } from '@/lib/navUtils'
import { useClassStore } from '@/store/classStore'

interface Props {
  isOpen: boolean
  onClose: () => void
  isBn: boolean
  subdomain?: string
  brandColor?: string
  isDark?: boolean
}

const COMMON_DOMAINS = ['proton.me', 'protonmail.com', 'outlook.com', 'gmail.com']

export const OtherMailLoginModal = React.memo(function OtherMailLoginModal({
  isOpen,
  onClose,
  isBn,
  subdomain,
  brandColor = 'var(--brand)',
  isDark = false,
}: Props) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setOtpCode('')
      setEnteredOtp('')
      setSendingOtp(false)
      setOtpSent(false)
      setIsOtpVerified(false)
      setResendTimer(0)
      setDemoCodeHint(null)
      setSubmitting(false)
      setError('')
    }
  }, [isOpen])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // Auto-verify OTP when 6 chars entered
  useEffect(() => {
    if (enteredOtp.length === 6 && otpSent && !isOtpVerified) {
      if (otpCode && enteredOtp.toUpperCase() === otpCode.toUpperCase()) {
        setIsOtpVerified(true)
        setError('')
      } else if (!otpCode) {
        setIsOtpVerified(true)
      } else {
        setError(isBn ? 'যাচাইকরণ কোড ভুল' : 'Invalid verification code')
      }
    }
  }, [enteredOtp, otpSent, isOtpVerified, otpCode, isBn])

  if (!isOpen) return null

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleAppendDomain = (domain: string) => {
    const atIndex = email.indexOf('@')
    const prefix = atIndex !== -1 ? email.slice(0, atIndex) : email
    setEmail(`${prefix.trim()}@${domain}`)
  }

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!isEmailValid) {
      setError(isBn ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Please enter a valid email address')
      return
    }

    setSendingOtp(true)
    setError('')

    try {
      // 1. Request OTP from backend
      const res = await authApi.sendLoginOtp(trimmed)
      if (res.demoCode) {
        setOtpCode(res.demoCode)
        setDemoCodeHint(res.demoCode)
      } else {
        const clientCode = Math.floor(100000 + Math.random() * 900000).toString()
        setOtpCode(clientCode)
        const emailJsRes = await sendVerificationCode(trimmed, clientCode, 'registration')
        if (emailJsRes.simulated) {
          setDemoCodeHint(clientCode)
        }
      }

      setOtpSent(true)
      setResendTimer(60)
    } catch {
      // Fallback: client-side verification code
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString()
      setOtpCode(fallbackCode)
      const emailJsRes = await sendVerificationCode(trimmed, fallbackCode, 'registration')
      if (emailJsRes.simulated || emailJsRes.success) {
        setOtpSent(true)
        setResendTimer(60)
        if (emailJsRes.simulated) {
          setDemoCodeHint(fallbackCode)
        }
      } else {
        setError(emailJsRes.error || (isBn ? 'কোড পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send verification code'))
      }
    } finally {
      setSendingOtp(false)
    }
  }

  const handleLogin = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!isEmailValid) {
      setError(isBn ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Please enter a valid email address')
      return
    }
    if (!otpSent || !enteredOtp) {
      setError(isBn ? 'অনুগ্রহ করে যাচাইকরণ কোড লিখুন' : 'Please enter the verification code')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (subdomain) {
        sessionStorage.setItem('edutech_intended_institution', subdomain)
      }

      const res = await authApi.emailLogin({
        email: trimmed,
        code: enteredOtp.trim(),
        verified: isOtpVerified,
        institution: subdomain,
      })

      if (res?.user) {
        if (res.user.school) {
          useClassStore.getState().updateInstitution(res.user.school)
        }
        const destination = getDashboardPath(res.user)
        onClose()
        navigate(destination)
      } else {
        throw new Error(isBn ? 'লগইন ব্যর্থ হয়েছে' : 'Authentication failed')
      }
    } catch (err: any) {
      setError(err?.message || (isBn ? 'লগইন করতে সমস্যা হয়েছে' : 'Login failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark
            ? 'bg-[#0f172a] border-white/10 text-white'
            : 'bg-white border-gray-100 text-[var(--text-primary)]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: `${brandColor}18`, color: brandColor }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h2 className="text-[0.9375rem] font-bold">
                {isBn ? 'অন্যান্য মেইল দিয়ে সাইন ইন' : 'Sign in with Other Mail'}
              </h2>
              <p className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
                <Sparkles size={11} className="text-[var(--brand)]" />
                <span>Proton Mail, Outlook, Yahoo &amp; custom domains</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-white/5 border-none cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 pt-4">
          {/* Email input */}
          <div>
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail size={13} />
                {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </span>
              <span className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'প্রোটন মেইল বা যেকোনো ইমেইল' : 'Proton Mail or any provider'}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                disabled={otpSent && isOtpVerified}
                placeholder="username@proton.me"
                className={`flex-1 h-10 px-3 rounded-xl border text-[0.8125rem] outline-none transition-all ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/25 focus:border-[var(--brand)]'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]'
                }`}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || !isEmailValid || (otpSent && resendTimer > 0)}
                className="h-10 px-3.5 rounded-xl text-[0.75rem] font-semibold text-white cursor-pointer flex items-center gap-1.5 transition-all shrink-0 border-none disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: brandColor }}
              >
                {sendingOtp ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : otpSent ? (
                  <RefreshCw size={13} />
                ) : (
                  <Send size={13} />
                )}
                <span>
                  {otpSent && resendTimer > 0
                    ? `${resendTimer}s`
                    : otpSent
                    ? isBn ? 'পুনরায় পাঠান' : 'Resend'
                    : isBn ? 'কোড পাঠান' : 'Send Code'}
                </span>
              </button>
            </div>

            {/* Quick Domain Badges */}
            {!otpSent && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[0.6875rem] text-[var(--text-muted)] mr-1">
                  {isBn ? 'দ্রুত ডোমেইন:' : 'Quick:'}
                </span>
                {COMMON_DOMAINS.map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => handleAppendDomain(dom)}
                    className="text-[0.6875rem] px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                  >
                    @{dom}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Demo code hint */}
          {demoCodeHint && !isOtpVerified && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[0.75rem] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>
                  {isBn ? 'ডেমো কোড:' : 'Demo Code:'}{' '}
                  <strong className="tracking-wider">{demoCodeHint}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEnteredOtp(demoCodeHint)}
                className="px-2 py-0.5 rounded text-[0.6875rem] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border-none cursor-pointer hover:bg-amber-500/30"
              >
                {isBn ? 'স্বয়ংক্রিয় পূরণ' : 'Auto Fill'}
              </button>
            </div>
          )}

          {/* OTP Input */}
          {otpSent && (
            <div className="p-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 space-y-3">
              <div className="text-center">
                <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)] block">
                  {isBn ? '৬ সংখ্যার যাচাইকরণ কোড লিখুন' : 'Enter 6-Digit Verification Code'}
                </span>
                <span className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? `${email}-এ কোড পাঠানো হয়েছে` : `Sent to ${email}`}
                </span>
              </div>
              <OtpInput length={6} value={enteredOtp} onChange={setEnteredOtp} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-[0.75rem]">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={submitting || !isEmailValid || !otpSent || enteredOtp.length < 6}
            className="w-full h-11 rounded-xl text-[0.875rem] font-semibold text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: brandColor }}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isOtpVerified ? (
              <CheckCircle size={16} />
            ) : (
              <Mail size={16} />
            )}
            <span>
              {submitting
                ? isBn ? 'সাইন ইন হচ্ছে...' : 'Signing in...'
                : isBn ? 'যাচাই করুন ও সাইন ইন করুন' : 'Verify & Sign In'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
})
