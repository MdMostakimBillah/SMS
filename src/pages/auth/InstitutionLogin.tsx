import { useState, useMemo, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Mail, Lock, Eye, EyeOff, LogIn, Check, X, GraduationCap } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAppStore } from '@/store/appStore'
import { AuthContext } from '@/contexts/AuthContext'
import { BackgroundPaths } from '@/components/ui/BackgroundPaths'
import { useSuperAdminStore, type Institution } from '@/store/superAdminStore'
import { useClassStore, defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'

const fallbackInstitutions: Institution[] = [
  {
    id: 'INST-001', name: 'Sunrise Academy', nameBn: 'সানরাইজ একাডেমি',
    email: 'admin@sunrise.edu.bd', phone: '+880-1712-345678',
    address: 'Banani, Dhaka 1213', addressBn: 'বনানী, ঢাকা-১২১৩',
    eiin: '123456', website: 'smsappbd.vercel.app/i/sunrise', subdomain: 'sunrise',
    status: 'active', package: { name: 'Premium', nameBn: 'প্রিমিয়াম', maxStudents: 400, maxTeachers: 40, maxClasses: 999, storageMB: 10240, price: 3000, duration: 30 },
    usedStorageMB: 4520, createdAt: '2024-08-15', lastLogin: '2026-07-30',
    logo: '', banner: '', brandColor: '#6366f1', brandName: 'Sunrise Academy',
    motto: 'Knowledge is Power', mottoBn: 'জ্ঞাই হলো শক্তি',
    startTime: '07:30', endTime: '14:30', optionalSubjects: [], sessions: ['2024-25', '2025-26'], password: 'Sunrise@2024',
  },
  {
    id: 'INST-002', name: 'Dhaka International School', nameBn: 'ঢাকা ইন্টারন্যাশনাল স্কুল',
    email: 'info@dis.edu.bd', phone: '+880-1812-456789',
    address: 'Gulshan, Dhaka 1212', addressBn: 'গুলশান, ঢাকা-১২১২',
    eiin: '234567', website: 'smsappbd.vercel.app/i/dis', subdomain: 'dis',
    status: 'active', package: { name: 'Enterprise', nameBn: 'এন্টারপ্রাইজ', maxStudents: 500, maxTeachers: 50, maxClasses: 999, storageMB: 20480, price: 3500, duration: 30 },
    usedStorageMB: 18750, createdAt: '2024-06-20', lastLogin: '2026-07-31',
    logo: '', banner: '', brandColor: '#3b82f6', brandName: 'DIS',
    motto: '', mottoBn: '', startTime: '08:00', endTime: '15:00',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'], password: 'Dis@2024',
  },
  {
    id: 'INST-003', name: 'Green Valley School', nameBn: 'গ্রিন ভ্যালি স্কুল',
    email: 'contact@greenvalley.edu.bd', phone: '+880-1912-567890',
    address: 'Uttara, Dhaka 1230', addressBn: 'উত্তরা, ঢাকা-১২৩০',
    eiin: '345678', website: 'smsappbd.vercel.app/i/greenvalley', subdomain: 'greenvalley',
    status: 'trial', package: { name: 'Standard', nameBn: 'স্ট্যান্ডার্ড', maxStudents: 250, maxTeachers: 30, maxClasses: 999, storageMB: 5120, price: 2200, duration: 30 },
    usedStorageMB: 340, createdAt: '2026-07-01', lastLogin: '2026-07-28',
    logo: '', banner: '', brandColor: '#22c55e', brandName: 'Green Valley',
    motto: '', mottoBn: '', startTime: '07:30', endTime: '14:00',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'], password: 'GreenValley@2024',
  },
  {
    id: 'INST-004', name: 'Rajshahi Collegiate School', nameBn: 'রাজশাহী কলেজিয়েট স্কুল',
    email: 'admin@rajshahi-cs.edu.bd', phone: '+880-1712-678901',
    address: 'Boalia, Rajshahi 6205', addressBn: 'বোয়ালিয়া, রাজশাহী-৬২০৫',
    eiin: '456789', website: 'smsappbd.vercel.app/i/rajshahi-cs', subdomain: 'rajshahi-cs',
    status: 'suspended', package: { name: 'Basic', nameBn: 'বেসিক', maxStudents: 150, maxTeachers: 20, maxClasses: 999, storageMB: 2048, price: 1500, duration: 30 },
    usedStorageMB: 120, createdAt: '2025-11-10', lastLogin: '2026-05-15',
    logo: '', banner: '', brandColor: '#f59e0b', brandName: 'Rajshahi CS',
    motto: '', mottoBn: '', startTime: '08:00', endTime: '14:30',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'], password: 'Rajshahi@2024',
  },
]

function loadInstitutionData(inst: Institution) {
  useClassStore.getState().updateInstitution({
    name: inst.name, nameBn: inst.nameBn, logo: inst.logo, banner: inst.banner, bannerPosition: { x: 0, y: 0 },
    brandName: inst.brandName || inst.name, motto: inst.motto, mottoBn: inst.mottoBn, eiin: inst.eiin, phone: inst.phone, email: inst.email,
    address: inst.address, website: inst.website, subjects: inst.optionalSubjects || [], startTime: inst.startTime || '07:30', endTime: inst.endTime || '14:30',
    breaks: [], currentSession: inst.sessions?.[1] || '2025-26', sessions: inst.sessions || ['2024-25', '2025-26'],
    lightColors: { ...defaultThemeColors, brand: inst.brandColor }, darkColors: { ...defaultThemeColorsDark },
  })
}

export { loadInstitutionData, fallbackInstitutions }

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

export default function InstitutionLogin({ subdomain, institution: propInstitution }: { subdomain?: string; institution?: Institution }) {
  const isBn = useBn()
  const navigate = useNavigate()
  const storeInstitutions = useSuperAdminStore((s) => s.institutions)
  const setAppTheme = useAppStore((s) => s.setTheme)
  const authCtx = useContext(AuthContext)
  const setInstitutionUser = authCtx?.setInstitutionUser

  const institution = useMemo(() => {
    if (propInstitution) return propInstitution
    if (!subdomain) return null
    const all = storeInstitutions.length > 0 ? storeInstitutions : fallbackInstitutions
    return all.find((i) => i.subdomain === subdomain) || null
  }, [propInstitution, subdomain, storeInstitutions])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const isDark = theme === 'dark'

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    setAppTheme(next)
  }

  const passwordValidation = useMemo(() => {
    const rules = [
      { label: '8+ characters', labelBn: '৮+ অক্ষর', test: (p: string) => p.length >= 8 },
      { label: 'Uppercase letter', labelBn: 'বড় হাতের অক্ষর', test: (p: string) => /[A-Z]/.test(p) },
      { label: 'Lowercase letter', labelBn: 'ছোট হাতের অক্ষর', test: (p: string) => /[a-z]/.test(p) },
      { label: 'Number', labelBn: 'সংখ্যা', test: (p: string) => /[0-9]/.test(p) },
      { label: 'Special character', labelBn: 'বিশেষ অক্ষর', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ]
    return rules.map((rule) => ({ ...rule, met: password.length > 0 && rule.test(password) }))
  }, [password])

  if (!institution) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0a0a0f' : '#f0f2f8' }}>
        <div className="text-center">
          <Building2 size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {isBn ? 'প্রতিষ্ঠান পাওয়া যায়নি' : 'Institution Not Found'}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {isBn ? 'এই সাবডোমেইনে কোনো প্রতিষ্ঠান নেই' : 'No institution found for this URL'}
          </p>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL
      const superAdminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD

      if (email === superAdminEmail && password === superAdminPassword) {
        localStorage.setItem('edutech_user', JSON.stringify({
          email, role: 'super_admin', name: 'Super Admin'
        }))
        navigate('/super-admin')
        return
      }

      if (email === institution.email && password === (institution.password || 'admin123')) {
        loadInstitutionData(institution)
        if (setInstitutionUser) {
          setInstitutionUser(email, institution.name, 'admin', institution.id, institution.subdomain)
        } else {
          localStorage.setItem('edutech_user', JSON.stringify({
            email, role: 'admin', name: institution.name, institutionId: institution.id, subdomain: institution.subdomain
          }))
          localStorage.setItem('edutech_institutionId', institution.id)
          localStorage.setItem('edutech_institutionSubdomain', institution.subdomain)
        }
        navigate('/dashboard')
        return
      }

      setError(isBn ? 'ভুল ইমেইল বা পাসওয়ার্ড' : 'Invalid email or password')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={isBn ? 'থিম পরিবর্তন' : 'Toggle theme'}
        className={`fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-colors ${
          isDark ? 'text-white/40 hover:text-white/70' : 'text-black/30 hover:text-black/60'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <>
              <circle cx="12" cy="12" r="4" />
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
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          )}
        </svg>
      </button>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, #0f0f18 0%, #141420 100%)'
              : 'linear-gradient(180deg, #1a1a2e 0%, #1e1e32 100%)',
          }}
        />
        <BackgroundPaths color={institution.brandColor} />
        <div className="relative z-10 text-center px-8">
          {institution.logo ? (
            <div className="w-[72px] h-[72px] rounded-2xl mx-auto mb-4 overflow-hidden shadow-xl">
              <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <GraduationCap size={72} style={{ color: institution.brandColor }} className="mx-auto mb-4" />
          )}
          <h1 className="text-[2rem] font-bold mb-3 tracking-tight text-white">
            {institution.brandName || institution.name}
          </h1>
          {institution.nameBn && (
            <p className="text-[0.875rem] text-white/40 mb-1">{institution.nameBn}</p>
          )}
          <p className="text-[1rem] max-w-[280px] mx-auto leading-relaxed text-white/50">
            {isBn ? 'স্কুল ম্যানেজমেন্ট সিস্টেম' : 'School Management System'}
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-[0.75rem] text-white/30">
            <Lock size={12} />
            <span>{isBn ? 'নিরাপদ অ্যাডমিন অ্যাক্সেস' : 'Secure Admin Access'}</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className={`flex-1 flex items-center justify-center px-6 py-12 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
        <div className="w-full max-w-[22rem]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            {institution.logo ? (
              <div className="w-11 h-11 rounded-xl mx-auto mb-4 overflow-hidden shadow-lg">
                <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <GraduationCap size={44} style={{ color: institution.brandColor }} className="mx-auto mb-4" />
            )}
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>{institution.brandName || institution.name}</h1>
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

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[var(--red)]/8 border border-[var(--red)]/15 flex items-center gap-2">
              <X size={13} className="text-[var(--red)]/70 shrink-0" />
              <span className="text-[0.75rem] text-[var(--red)]/90 flex-1">{error}</span>
              <button onClick={() => setError('')} aria-label={isBn ? 'বন্ধ করুন' : 'Close'} className="text-[var(--red)]/30 hover:text-[var(--red)]/60 cursor-pointer bg-transparent border-none p-0">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="admin@school.edu.bd"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl border text-[0.875rem] outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-[var(--brand)]/50 focus:bg-white/[0.07]'
                      : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/50 focus:bg-[var(--bg-secondary)]'
                  }`}
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
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className={`w-full h-11 pl-10 pr-11 rounded-xl border text-[0.875rem] outline-none transition-all ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/20 focus:border-[var(--brand)]/50 focus:bg-white/[0.07]'
                      : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]/50 focus:bg-[var(--bg-secondary)]'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={isBn ? (showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন') : (showPassword ? 'Hide password' : 'Show password')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password rules */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
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
              disabled={loading}
              className="w-full h-11 rounded-xl text-[0.875rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !loading
                  ? `linear-gradient(135deg, ${institution.brandColor} 0%, ${institution.brandColor}cc 100%)`
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: !loading ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading
                ? (isBn ? 'সাইন ইন হচ্ছে...' : 'Signing in...')
                : (isBn ? 'সাইন ইন' : 'Sign In')
              }
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <p className={`text-[0.6875rem] ${isDark ? 'text-white/30' : 'text-[var(--text-muted)]'}`}>
              {isBn ? 'পাসওয়ার্ড মনে নেই?' : 'Forgot password?'}{' '}
              <button className="hover:underline cursor-pointer bg-transparent border-none text-[0.6875rem]" style={{ color: institution.brandColor }}>
                {isBn ? 'যোগাযোগ করুন' : 'Contact Admin'}
              </button>
            </p>
          </div>

          {/* Footer */}
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
