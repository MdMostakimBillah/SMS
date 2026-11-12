import React, { useState, useEffect } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  KeyRound,
  Send,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { authApi } from '@/lib/api'
import { sendVerificationCode, sendPasswordNotification } from '@/lib/emailService'
import { OtpInput } from '@/components/shared/OtpInput'

interface Props {
  isBn: boolean
  currentEmail: string
  isSuperAdmin: boolean
}

export const ChangePasswordTab = React.memo(function ChangePasswordTab({
  isBn,
  currentEmail,
  isSuperAdmin,
}: Props) {
  const [method, setMethod] = useState<'previous_password' | 'email_otp'>('previous_password')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  // Email verification OTP state
  const [otpCode, setOtpCode] = useState('')
  const [enteredOtp, setEnteredOtp] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null)

  // Submission state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [error, setError] = useState('')

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // Auto-verify OTP when 6 chars entered
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

  const getPasswordStrength = (pw: string): { level: number; label: string; color: string } => {
    if (!pw) return { level: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 2) return { level: 1, label: isBn ? 'দুর্বল' : 'Weak', color: 'var(--red)' }
    if (score <= 3) return { level: 2, label: isBn ? 'মাঝারি' : 'Fair', color: 'var(--amber)' }
    if (score <= 4) return { level: 3, label: isBn ? 'ভালো' : 'Good', color: 'var(--brand)' }
    return { level: 4, label: isBn ? 'শক্তিশালী' : 'Strong', color: 'var(--green)' }
  }

  const strength = getPasswordStrength(newPassword)

  const handleSendOtp = async () => {
    if (!currentEmail || !currentEmail.includes('@')) {
      setError(isBn ? 'কোনো বৈধ ইমেইল পাওয়া যায়নি' : 'No valid email address associated with account')
      return
    }

    setSendingOtp(true)
    setError('')

    const code = Array.from({ length: 6 }, () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]).join('')
    setOtpCode(code)

    const res = await sendVerificationCode(currentEmail, code, 'password_change')
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
      setError(res.error || (isBn ? 'যাচাইকরণ ইমেইল পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send verification email'))
    }
  }

  const handleSavePassword = async () => {
    if (method === 'previous_password' && !currentPassword) {
      setError(isBn ? 'পূর্বের পাসওয়ার্ড প্রয়োজন' : 'Previous password is required')
      return
    }
    if (method === 'email_otp' && !isOtpVerified) {
      setError(isBn ? 'অনুগ্রহ করে ইমেইল ভেরিফিকেশন সম্পন্ন করুন' : 'Please complete email verification first')
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

    setSaving(true)
    setError('')

    try {
      const emailVerified = method === 'email_otp' ? isOtpVerified : false
      const passCurrent = method === 'previous_password' ? currentPassword : (currentPassword || undefined)

      if (isSuperAdmin) {
        await authApi.updateSuperAdmin({
          password: newPassword,
          currentPassword: passCurrent,
          emailVerified,
        })
      } else {
        await authApi.updateCredentials({
          password: newPassword,
          currentPassword: passCurrent,
          emailVerified,
        })
      }

      // Send password notification to email ("password sent")
      if (currentEmail) {
        sendPasswordNotification(currentEmail, newPassword).catch(() => {})
      }

      setSaved(true)
      setSavedMessage(
        isBn
          ? `পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! নতুন পাসওয়ার্ড ${currentEmail}-এ পাঠানো হয়েছে।`
          : `Password changed successfully! New password has been sent to ${currentEmail}.`
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsOtpVerified(false)
      setOtpSent(false)
      setEnteredOtp('')
      setDemoCodeHint(null)

      setTimeout(() => setSaved(false), 6000)
    } catch (err: any) {
      setError(err?.message || (isBn ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে' : 'Password change failed'))
    } finally {
      setSaving(false)
    }
  }

  const canSave =
    !saving &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    (method === 'previous_password' ? Boolean(currentPassword) : isOtpVerified)

  return (
    <div className="space-y-4">
      {/* Verification method switcher */}
      <div className="grid grid-cols-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl">
        <button
          type="button"
          onClick={() => {
            setMethod('previous_password')
            setError('')
          }}
          className={`py-2 rounded-lg text-[0.75rem] font-semibold flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
            method === 'previous_password'
              ? 'bg-[var(--brand)] text-white shadow-sm'
              : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <KeyRound size={13} />
          <span>{isBn ? 'পূর্বের পাসওয়ার্ড' : 'Previous Password'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod('email_otp')
            setError('')
          }}
          className={`py-2 rounded-lg text-[0.75rem] font-semibold flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
            method === 'email_otp'
              ? 'bg-[var(--brand)] text-white shadow-sm'
              : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ShieldCheck size={13} />
          <span>{isBn ? 'ইমেইল ভেরিফিকেশন' : 'Email Verification'}</span>
        </button>
      </div>

      {/* Previous Password Method */}
      {method === 'previous_password' && (
        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock size={13} />
              {isBn ? 'পূর্বের পাসওয়ার্ড' : 'Previous Password'}
            </span>
            <button
              type="button"
              onClick={() => {
                setMethod('email_otp')
                setError('')
              }}
              className="text-[0.6875rem] text-[var(--brand)] hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              {isBn ? 'পাসওয়ার্ড মনে নেই? ইমেইল যাচাই করুন' : 'Forgot password? Verify via email'}
            </button>
          </label>
          <div className="relative">
            <input
              type={showCurrentPw ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setError('') }}
              placeholder={isBn ? 'পূর্বের পাসওয়ার্ড লিখুন' : 'Enter previous password'}
              className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
            >
              {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      )}

      {/* Email Verification Method */}
      {method === 'email_otp' && (
        <div className="p-3.5 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[0.75rem] font-semibold text-[var(--text-primary)] block">
                {isBn ? 'ইমেইল যাচাইকরণ' : 'Email Verification'}
              </span>
              <span className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <Mail size={11} />
                {currentEmail || (isBn ? 'কোনো ইমেইল সেট নেই' : 'No email set')}
              </span>
            </div>
            {!isOtpVerified && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || (otpSent && resendTimer > 0) || !currentEmail}
                className="px-3.5 py-1.5 rounded-xl text-[0.6875rem] font-semibold text-white bg-[var(--brand)] hover:opacity-90 disabled:opacity-40 cursor-pointer flex items-center gap-1 border-none shrink-0"
              >
                {sendingOtp ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                <span>
                  {otpSent && resendTimer > 0
                    ? `${resendTimer}s`
                    : otpSent
                    ? isBn ? 'পুনরায় পাঠান' : 'Resend Code'
                    : isBn ? 'কোড পাঠান' : 'Send Code'}
                </span>
              </button>
            )}
          </div>

          {demoCodeHint && !isOtpVerified && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[0.6875rem] flex items-center justify-between">
              <span>
                {isBn ? 'ডেমো কোড:' : 'Demo Code:'} <strong>{demoCodeHint}</strong>
              </span>
              <button
                type="button"
                onClick={() => setEnteredOtp(demoCodeHint)}
                className="px-2 py-0.5 rounded text-[0.625rem] font-semibold bg-amber-500/20 border-none cursor-pointer hover:bg-amber-500/30 text-amber-800 dark:text-amber-300"
              >
                {isBn ? 'স্বয়ংক্রিয় পূরণ' : 'Auto Fill'}
              </button>
            </div>
          )}

          {otpSent && !isOtpVerified && (
            <div className="space-y-2 pt-1">
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

          {isOtpVerified && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[0.6875rem] font-medium flex items-center gap-1.5">
              <CheckCircle size={14} className="shrink-0" />
              <span>
                {isBn
                  ? 'ইমেইল যাচাই সম্পূর্ণ হয়েছে! পূর্বের পাসওয়ার্ডের প্রয়োজন নেই।'
                  : 'Email successfully verified! Previous password is not required.'}
              </span>
            </div>
          )}

          <div className="text-right pt-0.5">
            <button
              type="button"
              onClick={() => {
                setMethod('previous_password')
                setError('')
              }}
              className="text-[0.6875rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              {isBn ? 'পূর্বের পাসওয়ার্ড ব্যবহার করতে চান?' : 'Prefer to use previous password?'}
            </button>
          </div>
        </div>
      )}

      {/* New Password */}
      <div>
        <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
          <Lock size={13} />
          {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
        </label>
        <div className="relative">
          <input
            type={showNewPw ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError('') }}
            placeholder={isBn ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)' : 'New password (min 8 characters)'}
            className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={() => setShowNewPw(!showNewPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
          >
            {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Strength Indicator */}
        {newPassword && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${strength.level * 25}%`, background: strength.color }}
                />
              </div>
              <span className="text-[0.625rem] font-medium" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
          <Lock size={13} />
          {isBn ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
        </label>
        <div className="relative">
          <input
            type={showConfirmPw ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
            placeholder={isBn ? 'নতুন পাসওয়ার্ড আবার লিখুন' : 'Re-enter new password'}
            className={`w-full h-10 px-3 pr-10 rounded-xl border bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] ${
              confirmPassword && newPassword !== confirmPassword
                ? 'border-[var(--red)] focus:border-[var(--red)]'
                : 'border-[var(--border)] focus:border-[var(--brand)]'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPw(!showConfirmPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
          >
            {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <div className="text-[0.6875rem] text-[var(--red)] mt-1">
            {isBn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
          </div>
        )}
      </div>

      {/* Notice about password sent */}
      <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center gap-2 text-[0.6875rem] text-[var(--text-muted)]">
        <Mail size={13} className="text-[var(--brand)] shrink-0" />
        <span>
          {isBn
            ? `পাসওয়ার্ড সফলভাবে পরিবর্তনের পর আপনার ইমেইল (${currentEmail})-এ নতুন পাসওয়ার্ড পাঠানো হবে।`
            : `Upon saving, a confirmation with your new password will be sent to your email (${currentEmail}).`}
        </span>
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
          <div className="text-[0.75rem] font-medium">{savedMessage}</div>
        </div>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSavePassword}
        disabled={!canSave}
        className="w-full h-10 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-sm"
        style={{ background: saved ? 'var(--green)' : 'var(--brand)' }}
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : saved ? (
          <><CheckCircle size={14} />{isBn ? 'পাসওয়ার্ড সংরক্ষিত ও পাঠানো হয়েছে!' : 'Password Saved & Sent!'}</>
        ) : (
          <><CheckCircle size={14} />{isBn ? 'পাসওয়ার্ড পরিবর্তন ও ইমেইলে পাঠান' : 'Update Password & Send Email'}</>
        )}
      </button>
    </div>
  )
})
