import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, GraduationCap, Mail, Lock, Check, X, ShieldAlert, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/store/appStore'
import { BackgroundPaths } from '@/components/ui/BackgroundPaths'

const EMAIL_KEY = 'edutech_login_email'

interface PasswordRule {
  label: string
  labelBn: string
  test: (p: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: '8+ characters', labelBn: '৮+ অক্ষর', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', labelBn: 'বড় হাতের অক্ষর', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', labelBn: 'ছোট হাতের অক্ষর', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', labelBn: 'সংখ্যা', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character', labelBn: 'বিশেষ অক্ষর', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function getInitialTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('edutech-settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      const t = parsed?.state?.theme
      if (t === 'light') return 'light'
      if (t === 'dark') return 'dark'
    }
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function LoginPage() {
  const { login, error, clearError, isLockedOut, lockoutRemaining } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isBn] = useState(() => document.documentElement.dataset.lang === 'bn')
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const isDark = theme === 'dark'
  const setAppTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    localStorage.setItem(EMAIL_KEY, email)
  }, [email])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    setAppTheme(next)
  }

  const passwordValidation = useMemo(() => {
    return PASSWORD_RULES.map((rule) => ({
      ...rule,
      met: password.length > 0 && rule.test(password),
    }))
  }, [password])

  const isPasswordValid = password.length > 0 && passwordValidation.every((r) => r.met)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = isEmailValid && isPasswordValid && !submitting && !isLockedOut

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-colors ${
          isDark ? 'text-white/40 hover:text-white/70' : 'text-black/30 hover:text-black/60'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <>
              <circle cx="12" cy="12" r="4" style={{ animation: 'sunPulse 2s ease-in-out infinite' }} />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </>
          ) : (
            <>
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" style={{ animation: 'moonWobble 3s ease-in-out infinite' }} />
            </>
          )}
        </svg>
      </button>

      {/* ── Left Panel (branding) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, #0f0f18 0%, #141420 100%)'
              : 'linear-gradient(180deg, #1a1a2e 0%, #1e1e32 100%)',
          }}
        />

        {/* SVG wave paths */}
        <BackgroundPaths isDark={isDark} />

        {/* Branding content */}
        <div className="relative z-10 text-center px-8">
          <GraduationCap size={72} className="text-[var(--brand)] mx-auto mb-4" />
          <h1 className="text-[2rem] font-bold mb-3 tracking-tight text-white">
            EduTech SMS
          </h1>
          <p className="text-[1rem] max-w-[280px] mx-auto leading-relaxed text-white/50">
            {isBn ? 'স্কুল ম্যানেজমেন্ট সিস্টেম' : 'School Management System'}
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-[0.75rem] text-white/30">
            <Lock size={12} />
            <span>{isBn ? 'নিরাপদ অ্যাডমিন অ্যাক্সেস' : 'Secure Admin Access'}</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className={`flex-1 flex items-center justify-center px-6 py-12 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
        <div className="w-full max-w-[22rem]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <GraduationCap size={44} className="text-[var(--brand)] mx-auto mb-4" />
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>EduTech SMS</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className={`text-[1.5rem] font-bold mb-2 ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>
              {isBn ? 'স্বাগতম' : 'Welcome Back'}
            </h2>
            <p className={`text-[0.875rem] ${isDark ? 'text-white/40' : 'text-[var(--text-secondary)]'}`}>
              {isBn ? 'অ্যাডমিন প্যানেলে সাইন ইন করুন' : 'Sign in to admin panel'}
            </p>
          </div>

          {/* Lockout banner */}
          {isLockedOut && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert size={12} className="text-amber-500" />
              </div>
              <span className="text-[0.8125rem] text-amber-500 flex-1">
                {isBn
                  ? `অনেক ব্যর্থ চেষ্টা। আবার চেষ্টা করুন ${formatTime(lockoutRemaining)} মিনিটে।`
                  : `Too many failed attempts. Try again in ${formatTime(lockoutRemaining)}.`}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[var(--red)]/20 flex items-center justify-center shrink-0">
                <X size={12} className="text-[var(--red)]" />
              </div>
              <span className="text-[0.8125rem] text-[var(--red)] flex-1">{error}</span>
              <button onClick={clearError} className="text-[var(--red)]/60 hover:text-[var(--red)] cursor-pointer bg-transparent border-none">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className={`text-[0.75rem] font-medium mb-1.5 block ${isDark ? 'text-white/50' : 'text-[var(--text-secondary)]'}`}>
                {isBn ? 'ইমেইল' : 'Email'}
              </label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/25' : 'text-[var(--text-muted)]'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError() }}
                  placeholder="admin@example.com"
                  disabled={isLockedOut}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl border text-[0.875rem] outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-[var(--brand)]/50 focus:bg-white/[0.07]'
                      : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/50 focus:bg-[var(--bg-secondary)]'
                  } ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`text-[0.75rem] font-medium mb-1.5 block ${isDark ? 'text-white/50' : 'text-[var(--text-secondary)]'}`}>
                {isBn ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/25' : 'text-[var(--text-muted)]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError() }}
                  placeholder="••••••••"
                  disabled={isLockedOut}
                  className={`w-full h-11 pl-10 pr-11 rounded-xl border text-[0.875rem] outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-[var(--brand)]/50 focus:bg-white/[0.07]'
                      : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/50 focus:bg-[var(--bg-secondary)]'
                  } ${isLockedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password rules */}
            {password.length > 0 && (
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                {passwordValidation.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      rule.met ? 'bg-[var(--green)]/20' : isDark ? 'bg-white/5' : 'bg-black/5'
                    }`}>
                      {rule.met ? (
                        <Check size={10} className="text-[var(--green)]" />
                      ) : (
                        <X size={10} className={isDark ? 'text-white/20' : 'text-[var(--text-muted)]'} />
                      )}
                    </div>
                    <span className={`text-[0.6875rem] transition-colors ${
                      rule.met ? 'text-[var(--green)]' : isDark ? 'text-white/30' : 'text-[var(--text-muted)]'
                    }`}>
                      {isBn ? rule.labelBn : rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11 rounded-xl text-[0.875rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: canSubmit ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              }}
            >
              {isLockedOut ? (
                <Clock size={16} />
              ) : submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {isLockedOut
                ? (isBn ? `লকড আউট — ${formatTime(lockoutRemaining)}` : `Locked out — ${formatTime(lockoutRemaining)}`)
                : submitting
                  ? (isBn ? 'সাইন ইন হচ্ছে...' : 'Signing in...')
                  : (isBn ? 'সাইন ইন' : 'Sign In')
              }
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <div className={`flex items-center justify-center gap-2 text-[0.6875rem] ${isDark ? 'text-white/20' : 'text-[var(--text-muted)]'}`}>
              <Lock size={11} />
              <span>{isBn ? 'নিরাপদ অ্যাডমিন অ্যাক্সেস' : 'Protected admin access'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
