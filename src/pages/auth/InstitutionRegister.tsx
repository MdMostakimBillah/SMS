import { useState, useMemo, useRef } from 'react'
import {
  GraduationCap, Building2, Globe, Phone, MapPin,
  Upload, Palette, CreditCard, Shield, Eye, EyeOff,
  ChevronRight, ChevronLeft, Check, X,
  Zap, BarChart3, Users, Lock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSuperAdminStore, PACKAGES, type Institution, type InstitutionPackage } from '@/store/superAdminStore'
import { defaultThemeColors } from '@/store/classStore'
import { sendVerificationCode } from '@/lib/emailService'
import { BackgroundPaths } from '@/components/ui/BackgroundPaths'
import { LOGIN_PATH } from '@/lib/constants'
import { setAuthToken } from '@/lib/api'

const BASE_URL = 'smsappbd.vercel.app'

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

const PRESET_COLORS = ['#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#06b6d4', '#f97316']

function hasEmoji(str: string): boolean {
  return /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u.test(str)
}

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

interface RegForm {
  name: string
  nameBn: string
  brandName: string
  subdomain: string
  email: string
  phone: string
  address: string
  logo: string
  brandColor: string
  package: InstitutionPackage
  adminEmail: string
  adminPassword: string
}

const defaultForm: RegForm = {
  name: '', nameBn: '', brandName: 'EduTech', subdomain: '',
  email: '', phone: '', address: '',
  logo: '', brandColor: defaultThemeColors.brand,
  package: PACKAGES[0], adminEmail: '', adminPassword: '',
}

const STEPS = [
  { key: 'name', icon: Building2, labelEn: 'Institution', labelBn: 'প্রতিষ্ঠান' },
  { key: 'url', icon: Globe, labelEn: 'URL', labelBn: 'ইউআরএল' },
  { key: 'contact', icon: Phone, labelEn: 'Contact', labelBn: 'যোগাযোগ' },
  { key: 'logo', icon: Upload, labelEn: 'Logo', labelBn: 'লোগো' },
  { key: 'color', icon: Palette, labelEn: 'Brand Color', labelBn: 'ব্র্যান্ড রং' },
  { key: 'package', icon: CreditCard, labelEn: 'Package', labelBn: 'প্যাকেজ' },
  { key: 'admin', icon: Shield, labelEn: 'Admin', labelBn: 'অ্যাডমিন' },
]

/* ─── OtpInput ─── */
function OtpInput({ length, value, onChange, disabled }: { length: number; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const handleChange = (i: number, d: string) => {
    if (d.length > 1) {
      const p = d.replace(/[^a-zA-Z0-9]/g, '').slice(0, length).toUpperCase()
      onChange(p)
      setTimeout(() => refs.current[Math.min(p.length, length - 1)]?.focus(), 0)
      return
    }
    const arr = value.split('')
    arr[i] = d.toUpperCase()
    const r = arr.join('').replace(/[^a-zA-Z0-9]/g, '').slice(0, length)
    onChange(r)
    if (d && i < length - 1) setTimeout(() => refs.current[i + 1]?.focus(), 0)
  }
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) setTimeout(() => refs.current[i - 1]?.focus(), 0)
  }
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el }} type="text" inputMode="text" autoComplete="one-time-code"
          maxLength={length} value={value[i] || ''} onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)} disabled={disabled}
          className="w-11 h-12 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-center text-lg font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all disabled:opacity-50" />
      ))}
    </div>
  )
}

/* ─── Main Component ─── */
export default function InstitutionRegister() {
  const navigate = useNavigate()
  const isBn = document.documentElement.dataset.lang === 'bn'
  const addInstitution = useSuperAdminStore((s) => s.addInstitution)
  const institutions = useSuperAdminStore((s) => s.institutions)

  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<RegForm>(defaultForm)
  const [showPassword, setShowPassword] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const isDark = theme === 'dark'

  // Email verification
  const [emailSent, setEmailSent] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailCodeInput, setEmailCodeInput] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [simulated, setSimulated] = useState(false)

  const [created, setCreated] = useState(false)

  const set = <K extends keyof RegForm>(key: K, val: RegForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const passwordValidation = useMemo(() =>
    PASSWORD_RULES.map((r) => ({ ...r, met: form.adminPassword.length > 0 && r.test(form.adminPassword) })),
    [form.adminPassword]
  )
  const isPasswordValid = form.adminPassword.length > 0 && passwordValidation.every((r) => r.met)

  const subdomainSlug = form.subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const subdomainTaken = institutions.some((i) => i.subdomain === subdomainSlug && subdomainSlug.length > 0)

  const canNext = useMemo(() => {
    switch (STEPS[step]?.key) {
      case 'name': return form.name.trim().length > 0 && !hasEmoji(form.name)
      case 'url': return subdomainSlug.length >= 3 && !subdomainTaken
      case 'admin': return form.adminEmail.includes('@') && emailVerified && isPasswordValid
      default: return true
    }
  }, [step, form, subdomainSlug, subdomainTaken, emailVerified, isPasswordValid])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('logo', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const sendOtp = async () => {
    if (!form.adminEmail.includes('@')) return
    setSendingCode(true)
    setEmailError('')
    const code = Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('')
    setEmailCode(code)
    const result = await sendVerificationCode(form.adminEmail, code)
    setSimulated(result.simulated)
    setEmailSent(true)
    setSendingCode(false)
  }

  const verifyOtp = () => {
    if (emailCodeInput.toUpperCase() === emailCode) {
      setEmailVerified(true)
      setEmailError('')
    } else {
      setEmailError(isBn ? 'ভুল কোড' : 'Invalid code')
    }
  }

  const handleCreate = () => {
    const inst: Institution = {
      id: `INST-${Date.now()}`,
      name: form.name,
      nameBn: form.nameBn || form.name,
      email: form.adminEmail,
      phone: form.phone,
      address: form.address,
      addressBn: form.address,
      eiin: '',
      website: `${BASE_URL}/i/${subdomainSlug}`,
      subdomain: subdomainSlug,
      slug: subdomainSlug,
      status: 'active',
      package: form.package,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: '-',
      logo: form.logo,
      banner: '',
      brandColor: form.brandColor,
      brandName: form.brandName,
      motto: '',
      mottoBn: '',
      startTime: '07:30',
      endTime: '14:30',
      optionalSubjects: [],
      sessions: ['2025-26'],
      password: form.adminPassword,
      accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
    }
    addInstitution(inst)

    // Auto-login
    const slug = inst.slug
    sessionStorage.setItem('edutech_inst_slug', slug)
    localStorage.setItem(`edutech_inst_slug`, slug)
    const userData = JSON.stringify({
      email: inst.email, role: 'admin', name: inst.name,
      institutionId: inst.id, subdomain: inst.subdomain, slug: inst.slug,
      loginTimestamp: Date.now(),
    })
    localStorage.setItem(`edutech_user_${slug}`, userData)
    localStorage.setItem('edutech_user', userData)
    setAuthToken(`auto-${inst.id}`)
    setCreated(true)
  }

  const currentStep = STEPS[step]
  const StepIcon = currentStep?.icon || Building2

  /* ─── Success Screen ─── */
  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
        <div className="bg-[var(--bg-primary)] rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--green)] flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {isBn ? 'নিবন্ধন সম্পন্ন!' : 'Registration Complete!'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {isBn ? `${form.name} সফলভাবে তৈরি হয়েছে` : `${form.name} has been created successfully`}
          </p>
          <button onClick={() => navigate(`/i/${subdomainSlug}/admin/dashboard`)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#818cf8] text-white text-sm font-semibold border-none cursor-pointer">
            {isBn ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    )
  }

  /* ─── Landing Page (before wizard) ─── */
  if (!started) {
    return (
      <div className={`min-h-screen flex ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
        <button onClick={toggleTheme}
          className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-colors text-white/40 hover:text-white/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isDark ? (
              <>
                <circle cx="12" cy="12" r="4" style={{ animation: 'sunPulse 2s ease-in-out infinite' }} />
                <path d="M12 2v2" /><path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" /><path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
              </>
            ) : (
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" style={{ animation: 'moonWobble 3s ease-in-out infinite' }} />
            )}
          </svg>
        </button>

        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(180deg, #0f0f18 0%, #141420 100%)' : 'linear-gradient(180deg, #1a1a2e 0%, #1e1e32 100%)' }} />
          <BackgroundPaths isDark={isDark} />
          <div className="relative z-10 text-center px-8">
            <GraduationCap size={72} className="text-[var(--brand)] mx-auto mb-4" />
            <h1 className="text-[2rem] font-bold mb-3 tracking-tight text-white">EduTech SMS</h1>
            <p className="text-[1rem] max-w-[280px] mx-auto leading-relaxed text-white/50">
              {isBn ? 'আপনার স্কুলের জন্য সম্পূর্ণ ম্যানেজমেন্ট সিস্টেম' : 'Complete school management system'}
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-[0.75rem] text-white/30">
              <Lock size={12} />
              <span>{isBn ? 'নিরাপদ ও বিশ্বস্ত' : 'Secure & Reliable'}</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Marketing */}
        <div className={`flex-1 flex items-center justify-center px-6 py-12 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
          <div className="w-full max-w-[24rem] relative">
            <div className="lg:hidden text-center mb-8">
              <GraduationCap size={44} className="text-[var(--brand)] mx-auto mb-4" />
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>EduTech SMS</h1>
            </div>

            <div className="mb-8">
              <h2 className={`text-[1.75rem] font-bold mb-2 leading-tight ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                {isBn ? 'আপনার স্কুল অনলাইনে নিন' : 'Take Your School Online'}
              </h2>
              <p className={`text-[0.875rem] leading-relaxed ${isDark ? 'text-white/40' : 'text-[var(--text-secondary)]'}`}>
                {isBn ? 'মাত্র কয়েকটি ধাপে আপনার স্কুলের জন্য পূর্ণাঙ্গ ম্যানেজমেন্ট সিস্টেম তৈরি করুন' : 'Set up a complete management system for your school in just a few steps'}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Users, title: isBn ? 'ছাত্র ও শিক্ষক ম্যানেজমেন্ট' : 'Student & Teacher Management', desc: isBn ? 'সকল তথ্য এক জায়গায়' : 'All data in one place' },
                { icon: BarChart3, title: isBn ? 'পরীক্ষা ও ফলাফল' : 'Exams & Results', desc: isBn ? 'স্বয়ংক্রিয় গ্রেডিং ও রিপোর্ট' : 'Automatic grading & reports' },
                { icon: Zap, title: isBn ? 'ফি ও হিসাব' : 'Fees & Accounting', desc: isBn ? 'অনলাইন পেমেন্ট ও হিসাব' : 'Online payment & accounting' },
              ].map((f, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-white hover:shadow-sm'}`}>
                  <div className="w-9 h-9 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon size={16} className="text-[var(--brand)]" />
                  </div>
                  <div>
                    <h3 className={`text-[0.8125rem] font-semibold ${isDark ? 'text-white/80' : 'text-[var(--text-primary)]'}`}>{f.title}</h3>
                    <p className={`text-[0.6875rem] ${isDark ? 'text-white/35' : 'text-[var(--text-muted)]'}`}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStarted(true)}
              className="w-full h-12 rounded-xl text-[0.875rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: '#fff' }}>
              {isBn ? 'এখনই শুরু করুন' : 'Get Started'}
              <ChevronRight size={16} />
            </button>

            <p className={`text-center text-[0.6875rem] mt-4 ${isDark ? 'text-white/20' : 'text-[var(--text-muted)]'}`}>
              {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
              <button onClick={() => navigate(LOGIN_PATH)} className="text-[var(--brand)] hover:underline bg-transparent border-none cursor-pointer text-[0.6875rem] p-0">
                {isBn ? 'সাইন ইন' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ─── Wizard ─── */
  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-colors text-white/40 hover:text-white/70">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <>
              <circle cx="12" cy="12" r="4" style={{ animation: 'sunPulse 2s ease-in-out infinite' }} />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </>
          ) : (
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" style={{ animation: 'moonWobble 3s ease-in-out infinite' }} />
          )}
        </svg>
      </button>

      {/* Left - Preview */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(180deg, #0f0f18 0%, #141420 100%)' : 'linear-gradient(180deg, #1a1a2e 0%, #1e1e32 100%)' }} />
        <BackgroundPaths isDark={isDark} />
        <div className="relative z-10 w-full max-w-sm px-8">
          <div className="text-center mb-6">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-16 h-16 rounded-2xl object-contain mx-auto mb-3 bg-white/10 p-2" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold"
                style={{ background: form.brandColor }}>
                {(form.brandName || 'ET').slice(0, 2).toUpperCase()}
              </div>
            )}
            <h3 className="text-lg font-bold text-white">{form.name || (isBn ? 'আপনার স্কুল' : 'Your School')}</h3>
            {form.nameBn && <p className="text-sm text-white/40 mt-0.5">{form.nameBn}</p>}
          </div>
          <div className="space-y-2 text-[0.75rem] text-white/40">
            {form.subdomain && (
              <div className="flex items-center gap-2"><Globe size={12} className="text-white/30" /><span>{BASE_URL}/i/{subdomainSlug}</span></div>
            )}
            {form.phone && (
              <div className="flex items-center gap-2"><Phone size={12} className="text-white/30" /><span>{form.phone}</span></div>
            )}
            {form.address && (
              <div className="flex items-center gap-2"><MapPin size={12} className="text-white/30" /><span>{form.address}</span></div>
            )}
            <div className="flex items-center gap-2"><CreditCard size={12} className="text-white/30" /><span>{form.package.name} — ৳{form.package.price}/mo</span></div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => step === 0 ? setStarted(false) : setStep((s) => s - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer border-none bg-transparent transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'নতুন প্রতিষ্ঠান' : 'New Institution'}
              </h2>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {step + 1}/{STEPS.length} — {isBn ? currentStep.labelBn : currentStep.labelEn}
              </p>
            </div>
          </div>
          <button onClick={() => setStarted(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer border-none bg-transparent transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-2.5 border-b border-[var(--border)] shrink-0">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s.key} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-[var(--brand)]' : isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-[0.625rem] font-medium text-[var(--text-muted)] mb-5">
              <span className="text-[var(--brand)]"><StepIcon size={12} /></span>
              {isBn ? currentStep.labelBn : currentStep.labelEn}
            </div>

            <div className="space-y-4">
              {/* Step 1: Name */}
              {STEPS[step].key === 'name' && (
                <>
                  <Field label={`${isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'} *`} value={form.name}
                    onChange={(v) => set('name', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. Sunrise Academy'} />
                  <Field label={isBn ? 'বাংলায় নাম' : 'Bengali Name'} value={form.nameBn}
                    onChange={(v) => set('nameBn', v)} placeholder={isBn ? 'যেমন: সানরাইজ একাডেমি' : 'e.g. সানরাইজ একাডেমি'} />
                  <Field label={isBn ? 'ব্র্যান্ড নাম' : 'Brand Name'} value={form.brandName}
                    onChange={(v) => set('brandName', v)} placeholder="EduTech" />
                </>
              )}

              {/* Step 2: Subdomain */}
              {STEPS[step].key === 'url' && (
                <>
                  <div>
                    <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
                      {isBn ? 'সাবডোমেইন *' : 'Subdomain *'}
                    </label>
                    <p className="text-[0.6875rem] text-[var(--text-muted)] mb-2">
                      {isBn ? 'আপনার স্কুলের URL চয়ন করুন' : 'Choose your school URL'}
                    </p>
                    <div className="flex items-center gap-0">
                      <div className="flex-1 flex items-center h-11 px-3.5 rounded-l-xl border border-r-0 border-[var(--border)] bg-[var(--bg-secondary)]">
                        <input type="text" value={form.subdomain} onChange={(e) => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                          placeholder={isBn ? 'যেমন: sunrise-academy' : 'e.g. sunrise-academy'}
                          className="flex-1 bg-transparent border-none outline-none text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
                      </div>
                      <div className="h-11 px-3 flex items-center rounded-r-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-muted)]">
                        .{BASE_URL}/i/
                      </div>
                    </div>
                    {form.subdomain && (
                      <p className={`text-[0.6875rem] mt-1.5 ${subdomainTaken ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                        {subdomainTaken
                          ? (isBn ? 'এই সাবডোমেইন ইতিমধ্যে ব্যবহৃত' : 'This subdomain is already taken')
                          : `${BASE_URL}/i/${subdomainSlug}`}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: Contact */}
              {STEPS[step].key === 'contact' && (
                <>
                  <Field label={isBn ? 'ইমেইল' : 'Email'} type="email" value={form.email}
                    onChange={(v) => set('email', v)} placeholder="info@school.edu.bd" />
                  <Field label={isBn ? 'ফোন' : 'Phone'} value={form.phone}
                    onChange={(v) => set('phone', v)} placeholder="+880-2-1234567" />
                  <Field label={isBn ? 'ঠিকানা' : 'Address'} value={form.address}
                    onChange={(v) => set('address', v)} placeholder={isBn ? 'বাসা নং, রাস্তা, শহর' : 'House, Road, City'} />
                </>
              )}

              {/* Step 4: Logo */}
              {STEPS[step].key === 'logo' && (
                <div className="text-center">
                  {form.logo ? (
                    <div className="mb-4">
                      <img src={form.logo} alt="Logo" className="w-24 h-24 rounded-2xl object-contain mx-auto bg-[var(--bg-secondary)] p-2" />
                      <button onClick={() => set('logo', '')}
                        className="mt-2 text-[0.75rem] text-[var(--red)] hover:underline bg-transparent border-none cursor-pointer">
                        {isBn ? 'মুছুন' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center mx-auto hover:border-[var(--brand)] transition-colors">
                        <Upload size={20} className="text-[var(--text-muted)] mb-1" />
                        <span className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'আপলোড' : 'Upload'}</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mt-3">
                    {isBn ? 'বামে ক্লিক করে লোগো আপলোড করুন (ঐচ্ছিক)' : 'Click left panel to upload logo (optional)'}
                  </p>
                </div>
              )}

              {/* Step 5: Brand Color */}
              {STEPS[step].key === 'color' && (
                <div>
                  <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-3 block">
                    {isBn ? 'ব্র্যান্ড রং চয়ন করুন' : 'Choose Brand Color'}
                  </label>
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {PRESET_COLORS.map((c) => (
                      <button key={c} onClick={() => set('brandColor', c)}
                        className={`w-full aspect-square rounded-xl cursor-pointer border-2 transition-all ${form.brandColor === c ? 'border-[var(--text-primary)] scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[0.75rem] text-[var(--text-muted)]">Custom:</label>
                    <div className="relative">
                      <input type="color" value={form.brandColor} onChange={(e) => set('brandColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent" />
                    </div>
                    <span className="text-[0.75rem] text-[var(--text-muted)] font-mono">{form.brandColor}</span>
                  </div>
                </div>
              )}

              {/* Step 6: Package */}
              {STEPS[step].key === 'package' && (
                <div className="space-y-3">
                  {PACKAGES.map((pkg) => (
                    <button key={pkg.name} onClick={() => set('package', pkg)}
                      className={`w-full p-4 rounded-xl border text-left cursor-pointer transition-all ${form.package.name === pkg.name ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-[var(--border)] hover:border-[var(--brand)]/50 bg-[var(--bg-secondary)]'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                          {isBn ? pkg.nameBn : pkg.name}
                        </span>
                        <span className="text-[0.875rem] font-bold text-[var(--brand)]">৳{pkg.price}/mo</span>
                      </div>
                      <p className="text-[0.6875rem] text-[var(--text-muted)]">
                        {isBn ? `${pkg.maxStudents} জন ছাত্র পর্যন্ত` : `Up to ${pkg.maxStudents} students`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 7: Admin */}
              {STEPS[step].key === 'admin' && (
                <>
                  <div>
                    <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
                      {isBn ? 'অ্যাডমিন ইমেইল *' : 'Admin Email *'}
                    </label>
                    <div className="flex gap-2">
                      <input type="email" value={form.adminEmail}
                        onChange={(e) => { set('adminEmail', e.target.value); setEmailSent(false); setEmailVerified(false); setEmailCode(''); setEmailError('') }}
                        placeholder="admin@school.edu.bd" disabled={emailVerified}
                        className="flex-1 h-11 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-all disabled:opacity-50" />
                      {!emailVerified && (
                        <button onClick={sendOtp} disabled={sendingCode || !form.adminEmail.includes('@')}
                          className="h-11 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold border-none cursor-pointer disabled:opacity-50 whitespace-nowrap">
                          {sendingCode ? '...' : isBn ? 'কোড পাঠান' : 'Send Code'}
                        </button>
                      )}
                      {emailVerified && (
                        <div className="h-11 px-4 rounded-xl bg-[var(--green)]/10 flex items-center gap-1.5">
                          <Check size={14} className="text-[var(--green)]" />
                          <span className="text-[0.75rem] text-[var(--green)] font-medium">{isBn ? 'যাচাইকৃত' : 'Verified'}</span>
                        </div>
                      )}
                    </div>
                    {emailSent && !emailVerified && (
                      <div className="mt-3 space-y-3">
                        {simulated && (
                          <div className="px-3 py-2 rounded-lg bg-[var(--brand)]/5 border border-[var(--brand)]/10 text-[0.6875rem] text-[var(--brand)]">
                            {isBn ? 'ডেমো মোড: কোড হলো' : 'Demo mode: Your code is'} <strong>{emailCode}</strong>
                          </div>
                        )}
                        <OtpInput length={6} value={emailCodeInput} onChange={setEmailCodeInput} />
                        {emailError && <p className="text-[0.6875rem] text-[var(--red)] text-center">{emailError}</p>}
                        <button onClick={verifyOtp} disabled={emailCodeInput.length < 6}
                          className="w-full h-10 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold border-none cursor-pointer disabled:opacity-50">
                          {isBn ? 'যাচাই করুন' : 'Verify'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
                      {isBn ? 'পাসওয়ার্ড *' : 'Password *'}
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input type={showPassword ? 'text' : 'password'} value={form.adminPassword}
                        onChange={(e) => set('adminPassword', e.target.value)}
                        placeholder="••••••••" disabled={emailVerified}
                        className="w-full h-11 pl-10 pr-11 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-all disabled:opacity-50" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {form.adminPassword.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                        {passwordValidation.map((r) => (
                          <div key={r.label} className="flex items-center gap-1.5">
                            <Check size={10} className={r.met ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'} />
                            <span className={`text-[0.625rem] ${r.met ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'}`}>
                              {isBn ? r.labelBn : r.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between shrink-0">
          <button onClick={() => step === 0 ? setStarted(false) : setStep((s) => s - 1)}
            className={`h-10 px-4 rounded-xl text-[0.8125rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-pointer flex items-center gap-1.5 hover:bg-[var(--bg-primary)] transition-colors`}>
            <ChevronLeft size={14} />
            {isBn ? 'পূর্ববর্তী' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}
              className="h-10 px-5 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canNext ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: canNext ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
              {isBn ? 'পরবর্তী' : 'Next'}
              <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={!canNext}
              className="h-10 px-5 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canNext ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: canNext ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
              <Check size={14} />
              {isBn ? 'তৈরি করুন' : 'Create'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Reusable Field ─── */
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-11 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-all placeholder:text-[var(--text-muted)]" />
    </div>
  )
}
