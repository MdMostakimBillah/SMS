import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2, Send, Shield, RefreshCw } from 'lucide-react'
import { authApi } from '@/lib/api'
import { sendVerificationCode, sendEmailChangeNotification } from '@/lib/emailService'
import { OtpInput } from '@/components/shared/OtpInput'

interface Props {
  isBn: boolean
  currentEmail: string
  onEmailUpdated: (newEmail: string) => void
  isSuperAdmin: boolean
}

export const ChangeEmailTab = React.memo(function ChangeEmailTab({
  isBn,
  currentEmail,
  onEmailUpdated,
  isSuperAdmin,
}: Props) {
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null)

  // Submission state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // Reset verification if newEmail changes
  const handleEmailChange = (val: string) => {
    setNewEmail(val)
    setIsVerified(false)
    setOtpSent(false)
    setEnteredOtp('')
    setOtpCode('')
    setDemoCodeHint(null)
    setError('')
    setSaved(false)
  }

  // Auto-verify when 6 chars entered
  useEffect(() => {
    if (enteredOtp.length === 6 && otpSent && !isVerified) {
      if (enteredOtp.toUpperCase() === otpCode.toUpperCase()) {
        setIsVerified(true)
        setError('')
      } else {
        setError(isBn ? 'যাচাইকরণ কোড ভুল' : 'Invalid verification code')
      }
    }
  }, [enteredOtp, otpSent, isVerified, otpCode, isBn])

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())
  const isChanged = newEmail.trim().toLowerCase() !== currentEmail.trim().toLowerCase()

  const handleSendOtp = async () => {
    const trimmed = newEmail.trim().toLowerCase()
    if (!isEmailValid) {
      setError(isBn ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Please enter a valid email address')
      return
    }
    if (!isChanged) {
      setError(isBn ? 'নতুন ইমেইল বর্তমান ইমেইল থেকে ভিন্ন হতে হবে' : 'New email must be different from current email')
      return
    }

    setSendingOtp(true)
    setError('')

    try {
      // Check if email already registered to someone else
      const check = await authApi.checkEmail(trimmed)
      if (!check.available) {
        setSendingOtp(false)
        setError(check.error || (isBn ? 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে' : 'This email is already in use by another account'))
        return
      }
    } catch {
      // Continue if network check fails
    }

    const code = Array.from({ length: 6 }, () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]).join('')
    setOtpCode(code)

    const res = await sendVerificationCode(trimmed, code, 'email_change')
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
      setError(res.error || (isBn ? 'ইমেইল পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send verification email'))
    }
  }

  const handleSaveEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase()
    if (!isEmailValid || !isChanged) {
      setError(isBn ? 'সঠিক নতুন ইমেইল দিন' : 'Please enter a valid new email')
      return
    }
    if (!isVerified) {
      setError(isBn ? 'অনুগ্রহ করে নতুন ইমেইল যাচাই করুন' : 'Please verify your new email first')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (isSuperAdmin) {
        await authApi.updateSuperAdmin({
          email: trimmed,
          currentPassword: currentPassword || undefined,
          emailVerified: isVerified,
        })
      } else {
        await authApi.updateCredentials({
          email: trimmed,
          currentPassword: currentPassword || undefined,
          emailVerified: isVerified,
        })
      }

      // Send notice to old email
      sendEmailChangeNotification(currentEmail, trimmed).catch(() => {})

      setSaved(true)
      onEmailUpdated(trimmed)
      setCurrentPassword('')
      setNewEmail('')
      setIsVerified(false)
      setOtpSent(false)
      setEnteredOtp('')
      setDemoCodeHint(null)
      setTimeout(() => setSaved(false), 4000)
    } catch (err: any) {
      setError(err?.message || (isBn ? 'ইমেইল সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save email'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Email Display */}
      <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <div>
          <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] block mb-0.5">
            {isBn ? 'বর্তমান ইমেইল' : 'Current Email'}
          </span>
          <div className="text-[0.875rem] font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Mail size={14} className="text-[var(--brand)]" />
            <span>{currentEmail || (isBn ? 'ইমেইল নেই' : 'No email set')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[0.6875rem] font-medium">
          <CheckCircle size={12} />
          <span>{isBn ? 'সক্রিয়' : 'Active'}</span>
        </div>
      </div>

      {/* New Email Input */}
      <div>
        <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
          <Mail size={13} />
          {isBn ? 'নতুন ইমেইল ঠিকানা' : 'New Email Address'}
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="new-email@example.com"
            className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp || !isEmailValid || !isChanged || (otpSent && resendTimer > 0)}
            className="h-10 px-3.5 rounded-xl text-[0.75rem] font-semibold text-white bg-[var(--brand)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-all shrink-0 border-none"
          >
            {sendingOtp ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isVerified ? (
              <CheckCircle size={13} />
            ) : (
              <Send size={13} />
            )}
            <span>
              {isVerified
                ? isBn ? 'যাচাইকৃত' : 'Verified'
                : otpSent && resendTimer > 0
                ? `${resendTimer}s`
                : otpSent
                ? isBn ? 'পুনরায় পাঠান' : 'Resend Code'
                : isBn ? 'কোড পাঠান' : 'Send Code'}
            </span>
          </button>
        </div>
      </div>

      {/* Demo Code Box (for dev/simulated environments) */}
      {demoCodeHint && !isVerified && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[0.75rem] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <span>
              {isBn ? `ডেমো যাচাইকরণ কোড:` : `Demo verification code:`}{' '}
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

      {/* OTP Input Section */}
      {otpSent && !isVerified && (
        <div className="p-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 space-y-3">
          <div className="text-center">
            <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)] block">
              {isBn ? 'ইমেইল যাচাইকরণ কোড' : 'Enter 6-Digit Verification Code'}
            </span>
            <span className="text-[0.6875rem] text-[var(--text-muted)]">
              {isBn ? `${newEmail}-এ পাঠানো ৬ সংখ্যার কোড লিখুন` : `Sent to ${newEmail}`}
            </span>
          </div>
          <OtpInput length={6} value={enteredOtp} onChange={setEnteredOtp} />
          <div className="flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-1">
            <span>{isBn ? 'কোড পাননি?' : 'Did not receive code?'}</span>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={resendTimer > 0 || sendingOtp}
              className="text-[var(--brand)] hover:underline bg-transparent border-none cursor-pointer disabled:opacity-40 font-medium flex items-center gap-1"
            >
              <RefreshCw size={11} className={sendingOtp ? 'animate-spin' : ''} />
              {resendTimer > 0
                ? `${isBn ? 'অপেক্ষা করুন' : 'Wait'} (${resendTimer}s)`
                : isBn ? 'পুনরায় পাঠান' : 'Resend Code'}
            </button>
          </div>
        </div>
      )}

      {/* Verified Badge */}
      {isVerified && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[0.75rem] font-medium flex items-center gap-2">
          <CheckCircle size={15} className="shrink-0" />
          <span>{isBn ? 'ইমেইল সফলভাবে যাচাই করা হয়েছে' : 'New email verified successfully'}</span>
        </div>
      )}

      {/* Previous / Current Password Input for Security (Optional when email OTP is verified) */}
      <div>
        <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock size={13} />
            {isBn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
          </span>
          <span className="text-[0.6875rem] text-[var(--text-muted)] font-normal">
            {isBn ? '(ঐচ্ছিক)' : '(Optional)'}
          </span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setError('') }}
            placeholder={isBn ? 'বর্তমান পাসওয়ার্ড লিখুন' : 'Enter current password to confirm'}
            className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
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

      {/* Error display */}
      {error && (
        <div className="px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center gap-2">
          <AlertTriangle size={14} className="text-[var(--red)] shrink-0" />
          <div className="text-[0.75rem] text-[var(--red)]">{error}</div>
        </div>
      )}

      {/* Success display */}
      {saved && (
        <div className="px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={14} className="shrink-0" />
          <div className="text-[0.75rem] font-medium">
            {isBn ? 'ইমেইল সফলভাবে আপডেট করা হয়েছে!' : 'Email updated successfully!'}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSaveEmail}
        disabled={saving || !isEmailValid || !isChanged || !isVerified}
        className="w-full h-10 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm"
        style={{ background: saved ? 'var(--green)' : 'var(--brand)' }}
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : saved ? (
          <><CheckCircle size={14} />{isBn ? 'সংরক্ষিত!' : 'Saved!'}</>
        ) : (
          <><CheckCircle size={14} />{isBn ? 'নতুন ইমেইল সংরক্ষণ করুন' : 'Save New Email'}</>
        )}
      </button>
    </div>
  )
})
