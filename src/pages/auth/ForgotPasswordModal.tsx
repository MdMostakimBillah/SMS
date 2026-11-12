import React, { useState, useEffect } from 'react'
import { X, Mail, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2, Send, RefreshCw } from 'lucide-react'
import { authApi } from '@/lib/api'
import { sendVerificationCode, sendPasswordNotification } from '@/lib/emailService'
import { OtpInput } from '@/components/shared/OtpInput'

interface Props {
  isOpen: boolean
  onClose: () => void
  isBn: boolean
  brandColor?: string
  isDark?: boolean
}

export const ForgotPasswordModal = React.memo(function ForgotPasswordModal({
  isOpen,
  onClose,
  isBn,
  brandColor = 'var(--brand)',
  isDark = false,
}: Props) {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // OTP state
  const [otpCode, setOtpCode] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null)

  // Submitting state
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setNewPassword('')
      setConfirmPassword('')
      setOtpCode('')
      setEnteredOtp('')
      setSendingOtp(false)
      setOtpSent(false)
      setIsOtpVerified(false)
      setResendTimer(0)
      setDemoCodeHint(null)
      setSubmitting(false)
      setSuccess(false)
      setError('')
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // Auto-verify OTP
  useEffect(() => {
    if (enteredOtp.length === 6 && otpSent && !isOtpVerified) {
      if (enteredOtp.toUpperCase() === otpCode.toUpperCase()) {
        setIsOtpVerified(true)
        setError('')
      } else {
        setError(isBn ? 'যাচাইকরণ কোড ভুল' : 'Invalid verification code')
      }
    }
  }, [enteredOtp, otpSent, isOtpVerified, otpCode, isBn])

  if (!isOpen) return null

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!isEmailValid) {
      setError(isBn ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Please enter a valid email address')
      return
    }

    setSendingOtp(true)
    setError('')

    const code = Array.from({ length: 6 }, () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]).join('')
    setOtpCode(code)

    const res = await sendVerificationCode(trimmed, code, 'password_change')
    setSendingOtp(false)

    if (res.success) {
      setOtpSent(true)
      setResendTimer(60)
      if (res.simulated) {
        setDemoCodeHint(code)
      } else {
        setDemoCodeHint(null)
      }
      setError('')
    } else {
      setOtpSent(false)
      setError(res.error || (isBn ? 'কোড পাঠানো সম্ভব হয়নি' : 'Failed to send verification code'))
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!isOtpVerified) {
      setError(isBn ? 'অনুগ্রহ করে ইমেইল কোড যাচাই করুন' : 'Please verify email code first')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setError(isBn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে' : 'New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError(isBn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await authApi.resetPassword({
        email: trimmed,
        newPassword,
        emailVerified: true,
      })

      // Send password notification email
      sendPasswordNotification(trimmed, newPassword).catch(() => {})

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 3500)
    } catch (err: any) {
      setError(err?.message || (isBn ? 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে' : 'Failed to reset password'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative ${
          isDark
            ? 'bg-[#12131a] border-white/10 text-white'
            : 'bg-white border-[var(--border)] text-[var(--text-primary)]'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 border-none cursor-pointer transition-all"
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div className="mb-5 text-center">
          <div
            className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center text-white"
            style={{ background: brandColor }}
          >
            <Lock size={20} />
          </div>
          <h3 className="text-[1.125rem] font-bold text-[var(--text-primary)] mb-1">
            {isBn ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
          </h3>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {isBn
              ? 'ইমেইল ভেরিফিকেশনের মাধ্যমে পাসওয়ার্ড পরিবর্তন করুন'
              : 'Verify your email to create a new password'}
          </p>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle size={44} className="text-emerald-500 mx-auto" />
            <div className="text-[1rem] font-semibold text-emerald-500">
              {isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : 'Password Reset Successfully!'}
            </div>
            <p className="text-[0.75rem] text-[var(--text-muted)]">
              {isBn
                ? `নতুন পাসওয়ার্ড ${email}-এ পাঠানো হয়েছে। আপনি এখন লগইন করতে পারেন।`
                : `Your new password has been sent to ${email}. You can now log in.`}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 px-6 py-2.5 rounded-xl text-[0.8125rem] font-semibold text-white border-none cursor-pointer"
              style={{ background: brandColor }}
            >
              {isBn ? 'লগইন পৃষ্ঠায় যান' : 'Back to Login'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Email Field with Send Code */}
            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Mail size={13} />
                {isBn ? 'আপনার নিবন্ধিত ইমেইল' : 'Registered Email Address'}
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  disabled={isOtpVerified}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setOtpSent(false)
                    setIsOtpVerified(false)
                    setEnteredOtp('')
                    setError('')
                  }}
                  placeholder="admin@institution.edu"
                  className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] disabled:opacity-60"
                  required
                />
                {!isOtpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !isEmailValid || (otpSent && resendTimer > 0)}
                    className="h-10 px-3.5 rounded-xl text-[0.75rem] font-semibold text-white border-none cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                    style={{ background: brandColor }}
                  >
                    {sendingOtp ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>
                      {otpSent && resendTimer > 0
                        ? `${resendTimer}s`
                        : otpSent
                        ? isBn ? 'পুনরায়' : 'Resend'
                        : isBn ? 'কোড পাঠান' : 'Send Code'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Demo Code Box */}
            {demoCodeHint && !isOtpVerified && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[0.6875rem] flex items-center justify-between">
                <span>
                  {isBn ? 'ডেমো কোড:' : 'Demo Code:'} <strong>{demoCodeHint}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(demoCodeHint)}
                  className="px-2 py-0.5 rounded text-[0.625rem] font-semibold bg-amber-500/20 border-none cursor-pointer"
                >
                  {isBn ? 'পূরণ' : 'Fill'}
                </button>
              </div>
            )}

            {/* OTP Box */}
            {otpSent && !isOtpVerified && (
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-2.5">
                <div className="text-center">
                  <span className="text-[0.75rem] font-medium text-[var(--text-primary)] block">
                    {isBn ? '৬ সংখ্যার যাচাইকরণ কোড লিখুন' : 'Enter 6-Digit Code'}
                  </span>
                  <span className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? `${email}-এ পাঠানো হয়েছে` : `Sent to ${email}`}
                  </span>
                </div>
                <OtpInput length={6} value={enteredOtp} onChange={setEnteredOtp} isDark={isDark} />
                <div className="flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-1">
                  <span>{isBn ? 'কোড পাননি?' : 'No code received?'}</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendTimer > 0 || sendingOtp}
                    className="text-[var(--brand)] hover:underline bg-transparent border-none cursor-pointer font-medium flex items-center gap-1 disabled:opacity-40"
                  >
                    <RefreshCw size={11} className={sendingOtp ? 'animate-spin' : ''} />
                    {resendTimer > 0 ? `${resendTimer}s` : isBn ? 'পুনরায় পাঠান' : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {isOtpVerified && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[0.75rem] font-medium flex items-center gap-2">
                <CheckCircle size={15} />
                <span>{isBn ? 'ইমেইল সফলভাবে যাচাই করা হয়েছে' : 'Email successfully verified'}</span>
              </div>
            )}

            {/* New Password Fields (Only active after email OTP is verified) */}
            {isOtpVerified && (
              <>
                <div>
                  <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                    <Lock size={13} />
                    {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                      placeholder={isBn ? 'কমপক্ষে ৮ অক্ষর' : 'At least 8 characters'}
                      className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                    <Lock size={13} />
                    {isBn ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                      placeholder={isBn ? 'পাসওয়ার্ড পুনরায় লিখুন' : 'Re-enter password'}
                      className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[0.75rem] text-[var(--red)] flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isOtpVerified || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full h-11 rounded-xl text-[0.8125rem] font-semibold text-white border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-2"
              style={{ background: brandColor }}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <><CheckCircle size={15} />{isBn ? 'পাসওয়ার্ড পরিবর্তন ও ইমেইলে পাঠান' : 'Reset Password & Send Email'}</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
})
