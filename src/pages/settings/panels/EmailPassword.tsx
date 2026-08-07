import { useState, useEffect } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'
import { Mail, Lock, Eye, EyeOff, Save, CheckCircle, AlertTriangle, Loader2, Shield } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function EmailPasswordPanel({ isBn, onBack }: Props) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSuperAdmin) {
      authApi.getSuperAdmin()
        .then((data) => setEmail(data.email))
        .catch(() => setError(isBn ? 'সার্ভার থেকে তথ্য আনতে ব্যর্থ' : 'Failed to load from server'))
    }
  }, [isSuperAdmin, isBn])

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

  const handleSave = async () => {
    if (!email) {
      setError(isBn ? 'ইমেইল প্রয়োজন' : 'Email is required')
      return
    }
    if (newPassword) {
      if (!currentPassword) {
        setError(isBn ? 'বর্তমান পাসওয়ার্ড প্রয়োজন' : 'Current password is required')
        return
      }
      if (newPassword.length < 6) {
        setError(isBn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর' : 'New password must be at least 6 characters')
        return
      }
      if (newPassword !== confirmPassword) {
        setError(isBn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match')
        return
      }
    }

    setSaving(true)
    setError('')

    try {
      const update: { email?: string; password?: string; currentPassword?: string } = {}
      if (newPassword) {
        update.password = newPassword
        update.currentPassword = currentPassword
      }
      if (Object.keys(update).length > 0) {
        await authApi.updateSuperAdmin(update)
      }
      setSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError(isBn ? 'সংরক্ষণ ব্যর্থ' : 'Save failed — connect to server')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsPanel title="Email & Password" titleBn="ইমেইল ও পাসওয়ার্ড" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
            <Mail size={12} />
            {isBn ? 'ইমেইল' : 'Email'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); setSaved(false) }}
            placeholder="admin@edutech.com"
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="border-t border-[var(--border)]/40 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-[var(--text-muted)]" />
            <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
              {isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Lock size={12} />
                {isBn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(''); setSaved(false) }}
                  placeholder={isBn ? 'বর্তমান পাসওয়ার্ড' : 'Current password'}
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

            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Lock size={12} />
                {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); setSaved(false) }}
                  placeholder={isBn ? 'নতুন পাসওয়ার্ড' : 'New password'}
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

            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Lock size={12} />
                {isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setSaved(false) }}
                placeholder={isBn ? 'পাসওয়ার্ড আবার লিখুন' : 'Re-enter password'}
                className={`w-full h-10 px-3 rounded-xl border bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-[var(--red)] focus:border-[var(--red)]'
                    : 'border-[var(--border)] focus:border-[var(--brand)]'
                }`}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="text-[0.6875rem] text-[var(--red)] mt-1">
                  {isBn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--red)] shrink-0" />
            <div className="text-[0.75rem] text-[var(--red)]">{error}</div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !email}
          className="w-full h-10 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-white transition-all"
          style={{ background: saved ? 'var(--green)' : 'var(--brand)' }}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <><CheckCircle size={14} />{isBn ? 'সংরক্ষিত!' : 'Saved!'}</>
          ) : (
            <><Save size={14} />{isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}</>
          )}
        </button>
      </div>
    </SettingsPanel>
  )
}
