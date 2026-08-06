import { useState, useEffect } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'
import { Mail, Lock, Eye, EyeOff, Save, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function EmailPasswordPanel({ isBn, onBack }: Props) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
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

  const handleSave = async () => {
    if (!email) {
      setError(isBn ? 'ইমেইল প্রয়োজন' : 'Email is required')
      return
    }
    if (password && password.length < 6) {
      setError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর' : 'Password must be at least 6 characters')
      return
    }

    setSaving(true)
    setError('')

    try {
      const update: { email?: string; password?: string } = {}
      if (password) update.password = password
      if (Object.keys(update).length > 0) {
        await authApi.updateSuperAdmin(update)
      }
      setSaved(true)
      setPassword('')
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

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
            <Lock size={12} />
            {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
            <span className="text-[0.625rem] font-normal text-[var(--text-muted)]">
              ({isBn ? 'পরিবর্তন না করতে চাইলে খালি রাখুন' : 'leave blank to keep current'})
            </span>
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); setSaved(false) }}
              placeholder={isBn ? 'নতুন পাসওয়ার্ড' : 'New password'}
              className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
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
