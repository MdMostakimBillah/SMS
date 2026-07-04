import { useState, useEffect } from 'react'
import {
  Shield, Mail, Lock, Eye, EyeOff, Save, CheckCircle, AlertTriangle, Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getAdminCredentials } from '@/lib/adminAuth'
import { authApi } from '@/lib/api'

export default function Page() {
  const { user } = useAuth()
  const [isBn] = useState(() => document.documentElement.dataset.lang === 'bn')
  const isSuperAdmin = user?.role === 'super_admin'

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={48} className="text-[var(--amber)] mx-auto mb-4 opacity-50" />
          <div className="text-[1rem] font-semibold text-[var(--text-primary)] mb-2">
            {isBn ? 'অ্যাক্সেস অস্বীকৃত' : 'Access Denied'}
          </div>
          <div className="text-[0.8125rem] text-[var(--text-muted)]">
            {isBn ? 'শুধুমাত্র সুপার অ্যাডমিন সেটিংস অ্যাক্সেস করতে পারেন' : 'Only super admin can access settings'}
          </div>
        </div>
      </div>
    )
  }

  return <SettingsContent isBn={isBn} />
}

function SettingsContent({ isBn }: { isBn: boolean }) {
  const creds = getAdminCredentials()

  const [email, setEmail] = useState(creds.email)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [apiAvailable, setApiAvailable] = useState(true)

  useEffect(() => {
    // Try to load from API
    authApi.getSuperAdmin()
      .then((data) => {
        setEmail(data.email)
        setApiAvailable(true)
      })
      .catch(() => setApiAvailable(false))
  }, [])

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
      if (apiAvailable) {
        // Save to database via API
        const update: { email?: string; password?: string } = {}
        if (email !== creds.email) update.email = email
        if (password) update.password = password
        if (Object.keys(update).length > 0) {
          await authApi.updateSuperAdmin(update)
        }
      } else {
        // Fallback to localStorage
        const stored = { email, password: password || creds.password }
        localStorage.setItem('edutech_admin_credentials', JSON.stringify(stored))
      }

      setSaved(true)
      setPassword('')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(isBn ? 'সংরক্ষণ ব্যর্থ' : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
          <Shield size={20} className="text-[var(--brand)]" />
        </div>
        <div>
          <h1 className="text-[1.125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'সেটিংস' : 'Settings'}
          </h1>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {apiAvailable
              ? (isBn ? 'ডাটাবেজে সংরক্ষিত' : 'Saved to database')
              : (isBn ? 'ব্রাউজারে সংরক্ষিত' : 'Saved to browser')}
          </p>
        </div>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#6366f115', color: '#6366f1' }}>
            <Mail size={17} />
          </div>
          <div>
            <h2 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ইমেইল ও পাসওয়ার্ড' : 'Email & Password'}</h2>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'লগইন তথ্য পরিবর্তন করুন' : 'Change login credentials'}</p>
          </div>
          {!apiAvailable && (
            <span className="ml-auto px-2 py-1 rounded text-[0.625rem] font-medium bg-[var(--amber)]/10 text-[var(--amber)]">
              {isBn ? 'অফলাইন' : 'Offline'}
            </span>
          )}
        </div>
        <div className="p-5 space-y-4">
          {/* Email */}
          <div>
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <Mail size={12} />
              {isBn ? 'ইমেইল' : 'Email'}
            </label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); setSaved(false) }}
              placeholder="admin@edutech.com"
              className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]" />
          </div>

          {/* Password */}
          <div>
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <Lock size={12} />
              {isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              <span className="text-[0.625rem] font-normal text-[var(--text-muted)]">({isBn ? 'খালি রাখুন পরিবর্তন না করতে চাইলে' : 'leave blank to keep current'})</span>
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); setSaved(false) }}
                placeholder={isBn ? 'নতুন পাসওয়ার্ড' : 'New password'}
                className="w-full h-10 px-3 pr-10 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none">
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

          <button onClick={handleSave} disabled={saving || !email}
            className="w-full h-10 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-white transition-all"
            style={{ background: saved ? 'var(--green)' : 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <><CheckCircle size={14} />{isBn ? 'সংরক্ষিত!' : 'Saved!'}</> : <><Save size={14} />{isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
