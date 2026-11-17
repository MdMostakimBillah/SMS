import { useState, useMemo, useEffect, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Mail, Lock, Eye, EyeOff, LogIn, X, Clock } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useBn } from '@/hooks/useBn'
import { useAppStore } from '@/store/appStore'
import { AuthContext } from '@/contexts/AuthContext'
import { authApi, resolveMediaUrl } from '@/lib/api'
import { BackgroundPaths } from '@/components/ui/BackgroundPaths'
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen'
import { useSuperAdminStore, PACKAGES, type Institution } from '@/store/superAdminStore'
import { useClassStore, defaultThemeColors, defaultThemeColorsDark, type ThemeColors, mapSchoolToInstitutionSettings } from '@/store/classStore'
import { setSlug } from '@/lib/storage'
import { setLocalStorageMode } from '@/lib/storageMode'
import { applyThemeColors } from '@/hooks/useThemeColors'
import { presets } from '@/components/shared/ColorSettings'
import { getVaultStatus, vaultReconnect } from '@/lib/vault/vault'
import { ForgotPasswordModal } from './ForgotPasswordModal'
import { authClient } from '@/lib/auth-client'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')
}

function lighten(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const amt = percent / 100
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt)
}

function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function generateLightColors(brandHex: string): ThemeColors {
  const preset = presets.find((p) => p.brand.toLowerCase() === brandHex.toLowerCase())
  return {
    ...defaultThemeColors,
    brand: preset?.brand || brandHex,
    brand2: preset?.brand2 || lighten(brandHex, 20),
    brandLight: preset?.brandLight || withAlpha(brandHex, 0.06),
  }
}

function generateDarkColors(brandHex: string): ThemeColors {
  const preset = presets.find((p) => p.brand.toLowerCase() === brandHex.toLowerCase())
  const dark = lighten(brandHex, 15)
  return {
    ...defaultThemeColorsDark,
    brand: preset ? lighten(preset.brand, 15) : dark,
    brand2: preset ? lighten(preset.brand, 30) : lighten(brandHex, 30),
    brandLight: preset?.brandLightDark || withAlpha(dark, 0.1),
  }
}

function getLoginAttempts(): number {
  try {
    const raw = localStorage.getItem('edutech_login_attempts')
    if (!raw) return 0
    const data = JSON.parse(raw)
    if (Date.now() - data.timestamp > LOCKOUT_DURATION) {
      localStorage.removeItem('edutech_login_attempts')
      return 0
    }
    return data.count || 0
  } catch { return 0 }
}

function recordFailedAttempt() {
  const count = getLoginAttempts() + 1
  localStorage.setItem('edutech_login_attempts', JSON.stringify({ count, timestamp: Date.now() }))
}

function clearLoginAttempts() {
  localStorage.removeItem('edutech_login_attempts')
}

function isCurrentlyLockedOut(): boolean {
  return getLoginAttempts() >= MAX_ATTEMPTS
}

function getLockoutRemaining(): number {
  try {
    const raw = localStorage.getItem('edutech_login_attempts')
    if (!raw) return 0
    const data = JSON.parse(raw)
    const elapsed = Date.now() - data.timestamp
    return Math.max(0, LOCKOUT_DURATION - elapsed)
  } catch { return 0 }
}

interface LoadInstitutionOptions {
  /**
   * True when seeding an institution that has just been created.
   *
   * Logging *in to* a school has to keep whatever config it already has stored,
   * so everything below prefers `current`. Creating one has nothing to protect
   * — inheriting `current` would seed the new school with another school's
   * breaks, sessions and start time.
   */
  fresh?: boolean
}

function loadInstitutionData(inst: Institution, opts: LoadInstitutionOptions = {}) {
  const current = useClassStore.getState().institution
  const brandColor = inst.brandColor || '#6366f1'
  // `null` while seeding, so every "prefer the existing config" branch falls
  // through to the new institution's own values instead.
  const prev = opts.fresh ? null : current
  const effectiveStorageMode = inst.storageMode || prev?.storageMode || 'cloud'
  useClassStore.getState().updateInstitution({
    name: inst.name, nameBn: inst.nameBn, logo: inst.logo, banner: inst.banner,
    brandName: inst.brandName || inst.name, motto: inst.motto, mottoBn: inst.mottoBn,
    eiin: inst.eiin, phone: inst.phone, email: inst.email,
    address: inst.address, website: inst.website, subjects: inst.optionalSubjects || [],
    startTime: prev?.startTime || inst.startTime || '07:30',
    endTime: prev?.endTime || inst.endTime || '14:30',
    breaks: prev?.breaks?.length ? prev.breaks : [],
    currentSession: prev?.currentSession || inst.sessions?.[0] || '2025-26',
    sessions: prev?.sessions?.length ? prev.sessions : (inst.sessions?.length ? inst.sessions : ['2025-26']),
    storageMode: effectiveStorageMode,
    serverUrl: inst.serverUrl || prev?.serverUrl || '',
    folderName: inst.folderName || prev?.folderName || '',
    lightColors: prev && prev.lightColors?.brand !== defaultThemeColors.brand ? prev.lightColors : generateLightColors(brandColor),
    darkColors: prev && prev.darkColors?.brand !== defaultThemeColorsDark.brand ? prev.darkColors : generateDarkColors(brandColor),
    bannerPosition: prev?.bannerPosition || { x: 0, y: 0 },
  })
  if (effectiveStorageMode === 'local_computer' || effectiveStorageMode === 'local_server') {
    setLocalStorageMode(effectiveStorageMode, inst.serverUrl || prev?.serverUrl || '')
  }
}

export { loadInstitutionData }

export default function InstitutionLogin({ subdomain, institution: propInstitution }: { subdomain?: string; institution?: Institution }) {
  const isBn = useBn()
  const navigate = useNavigate()
  const authCtx = useContext(AuthContext)
  const storeInstitutions = useSuperAdminStore((s) => s.institutions) ?? []
  const setAppTheme = useAppStore((s) => s.setTheme)
  const setAppLanguage = useAppStore((s) => s.setLanguage)

  const [dbInstitution, setDbInstitution] = useState<Institution | null>(null)
  const [loadingDb, setLoadingDb] = useState(false)

  const effectiveSubdomain = subdomain || propInstitution?.subdomain || propInstitution?.slug

  useEffect(() => {
    if (propInstitution || !effectiveSubdomain) return
    const inStore = storeInstitutions.find((i) => i.subdomain === effectiveSubdomain || i.slug === effectiveSubdomain || i.id === effectiveSubdomain)
    if (inStore) {
      setDbInstitution(inStore)
      return
    }

    let active = true
    setLoadingDb(true)
    authApi
      .getPublicSchool(effectiveSubdomain)
      .then((res) => {
        if (!active) return
        if (res?.school) {
          const s = res.school
          const domainSlug = s.slug || s.domain || effectiveSubdomain
          const pkg = PACKAGES.find((p) => p.name.toLowerCase() === (s.package || s.plan || 'basic').toLowerCase()) || PACKAGES[0]
          const inst: Institution = {
            id: s.id || `INST-${domainSlug}`,
            name: s.name,
            nameBn: s.nameBn || s.name,
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            addressBn: s.addressBn || s.address || '',
            eiin: s.eiin || '',
            website: s.website || `${window.location.origin}/i/${domainSlug}`,
            subdomain: domainSlug,
            slug: domainSlug,
            status: (s.status as any) || 'active',
            package: pkg,
            createdAt: s.createdAt ? s.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            lastLogin: '-',
            logo: s.logo || '',
            banner: s.banner || '',
            brandColor: s.brandColor || '#6366f1',
            brandName: s.brandName || s.name,
            motto: s.motto || '',
            mottoBn: s.mottoBn || '',
            startTime: s.startTime || '07:30',
            endTime: s.endTime || '14:30',
            optionalSubjects: [],
            sessions: s.sessions ? (typeof s.sessions === 'string' ? JSON.parse(s.sessions) : s.sessions) : ['2025-26'],
            accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
            language: 'en',
            theme: 'light',
          }
          if (s.storageMode) {
            setLocalStorageMode(s.storageMode, s.serverUrl || '')
          }
          setDbInstitution(inst)
          useSuperAdminStore.getState().addInstitution(inst)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingDb(false)
      })

    return () => {
      active = false
    }
  }, [effectiveSubdomain, propInstitution, storeInstitutions])

  const institution = useMemo(() => {
    if (propInstitution) return propInstitution
    if (dbInstitution) return dbInstitution
    if (!subdomain) return null
    return storeInstitutions.find((i) => i.subdomain === subdomain || i.slug === subdomain || i.id === subdomain) || null
  }, [propInstitution, dbInstitution, subdomain, storeInstitutions])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Use the user's global theme preference, not the institution's default
    try {
      const stored = localStorage.getItem('edutech-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        const t = parsed?.state?.theme
        if (t === 'dark' || t === 'light') return t
      }
    } catch { /* ignore */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const isDark = theme === 'dark'
  const [isLockedOut, setIsLockedOut] = useState(isCurrentlyLockedOut())
  const [lockoutRemaining, setLockoutRemaining] = useState(getLockoutRemaining())
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Apply institution's language on mount (theme is handled by global appStore)
  useEffect(() => {
    if (!institution) return
    const lang = institution.language || 'en'
    setAppLanguage(lang)
    document.documentElement.dataset.lang = lang
  }, [institution])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    setAppTheme(next)
  }

  // Lockout timer
  useEffect(() => {
    if (isLockedOut) {
      lockoutTimerRef.current = setInterval(() => {
        const remaining = getLockoutRemaining()
        setLockoutRemaining(remaining)
        if (remaining <= 0) {
          setIsLockedOut(false)
          clearLoginAttempts()
          if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current)
        }
      }, 1000)
    }
    return () => { if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current) }
  }, [isLockedOut])

  // Set page title and favicon from institution
  useEffect(() => {
    if (!institution) return
    const title = isBn ? (institution.nameBn || institution.name) : institution.name
    document.title = title
    if (institution.logo) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = resolveMediaUrl(institution.logo)
    }
    return () => {
      document.title = 'EduTech SMS'
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (link) link.href = '/favicon.svg'
    }
  }, [institution, isBn])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }



  if (loadingDb && !institution) {
    return <BrandLoadingScreen />
  }

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

  if (institution.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0a0a0f' : '#f0f2f8' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {isBn ? 'এই প্রতিষ্ঠান বন্ধ রাখা হয়েছে' : 'Account Suspended'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-1">
            {isBn ? institution.nameBn || institution.name : institution.name}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {isBn
              ? 'আপনার প্রতিষ্ঠানের অ্যাকাউন্ট সাময়িক বন্ধ রাখা হয়েছে। অনুগ্রহ করে সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।'
              : 'Your institution account has been temporarily suspended. Please contact the super admin.'}
          </p>
        </div>
      </div>
    )
  }

  if (institution.status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0a0a0f' : '#f0f2f8' }}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {isBn ? 'এই প্রতিষ্ঠান নিষ্ক্রিয়' : 'Account Inactive'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-1">
            {isBn ? institution.nameBn || institution.name : institution.name}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {isBn
              ? 'আপনার প্রতিষ্ঠানের অ্যাকাউন্ট এখন নিষ্ক্রিয় আছে। অনুগ্রহ করে সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।'
              : 'Your institution account is currently inactive. Please contact the super admin.'}
          </p>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check lockout
    if (isCurrentlyLockedOut()) {
      setIsLockedOut(true)
      setLockoutRemaining(getLockoutRemaining())
      setError(isBn ? `অনেক বার ভুল চেষ্টা করা হয়েছে। ${formatTime(getLockoutRemaining())} অপেক্ষা করুন।` : `Too many failed attempts. Try again in ${formatTime(getLockoutRemaining())}.`)
      return
    }

    setLoading(true)

    try {
      let u: any
      if (authCtx?.login) {
        u = await authCtx.login(email, password)
      } else {
        const res = await authApi.login(email, password)
        u = res?.user
      }
      clearLoginAttempts()

      const userRole = u?.role || 'admin'
      const targetRole = userRole === 'school_admin' ? 'admin' : userRole
      const targetSlug =
        u?.schoolDomain ||
        u?.school?.domain ||
        institution?.slug ||
        institution?.subdomain ||
        subdomain ||
        (u?.schoolName ? u.schoolName.toLowerCase().replace(/\s+/g, '-') : 'school')

      if (targetSlug) {
        setSlug(targetSlug)
      }

      // If vault needs re-permission (e.g. after localStorage clear), reconnect now.
      // The login button press is a user gesture so the browser will allow the permission dialog.
      const vs = getVaultStatus()
      if (vs.needsReconnect && !vs.connected) {
        // Fire-and-forget — vault will hydrate and reload stores asynchronously
        void vaultReconnect()
      }

      if (u?.school) {
        const s = u.school
        const brand = s.brandColor || '#6366f1'
        const mapped = mapSchoolToInstitutionSettings(s, useClassStore.getState().institution)
        useClassStore.getState().updateInstitution(mapped)
        setLocalStorageMode(mapped.storageMode || s.storageMode || 'cloud', mapped.serverUrl || s.serverUrl || '')
        const isCurrentDark = theme === 'dark'
        applyThemeColors(isCurrentDark ? generateDarkColors(brand) : generateLightColors(brand))
      }

      if (userRole === 'super_admin') {
        navigate('/super-admin/admin/dashboard')
        setLoading(false)
        return
      }

      navigate(`/i/${targetSlug}/${targetRole}/dashboard`)
      setLoading(false)
    } catch (err: any) {
      recordFailedAttempt()
      const attempts = getLoginAttempts()
      if (attempts >= MAX_ATTEMPTS) {
        setIsLockedOut(true)
        setLockoutRemaining(LOCKOUT_DURATION)
        setError(isBn ? `অনেক বার ভুল চেষ্টা করা হয়েছে। ৫ মিনিট অপেক্ষা করুন।` : `Too many failed attempts. Locked out for 5 minutes.`)
      } else {
        const serverMsg = err?.message || (err instanceof Error ? err.message : '')
        if (serverMsg && serverMsg !== 'Validation failed' && serverMsg !== 'Unauthorized' && err?.status !== 401) {
          setError(serverMsg)
        } else {
          setError(isBn ? `ভুল ইমেইল বা পাসওয়ার্ড। ${MAX_ATTEMPTS - attempts} টি চেষ্টা বাকি।` : `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`)
        }
      }
      setLoading(false)
    }
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
              <img
                src={resolveMediaUrl(institution.logo)}
                alt={institution.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          ) : (
            <BrandLogo size={104} className="mx-auto mb-5" />
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
            <span>{isBn ? 'নিরাপদ অ্যাডমিন ও শিক্ষক অ্যাক্সেস' : 'Secure Admin & Teacher Access'}</span>
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
              <img
                src={resolveMediaUrl(institution.logo)}
                alt={institution.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              </div>
            ) : (
              <BrandLogo size={64} className="mx-auto mb-4" />
            )}
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>{institution.brandName || institution.name}</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className={`text-[1.5rem] font-bold mb-2 ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>
              {isBn ? 'স্বাগতম' : 'Welcome Back'}
            </h2>
            <p className={`text-[0.875rem] ${isDark ? 'text-white/40' : 'text-[var(--text-secondary)]'}`}>
              {isBn ? 'অ্যাডমিন বা শিক্ষক প্যানেলে সাইন ইন করুন' : 'Sign in to admin or teacher panel'}
            </p>
          </div>

          {/* Error / Lockout */}
          {(error || isLockedOut) && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[var(--red)]/8 border border-[var(--red)]/15 flex items-center gap-2">
              {isLockedOut ? (
                <Clock size={13} className="text-[var(--red)]/70 shrink-0" />
              ) : (
                <X size={13} className="text-[var(--red)]/70 shrink-0" />
              )}
              <span className="text-[0.75rem] text-[var(--red)]/90 flex-1">
                {isLockedOut
                  ? (isBn ? `অনেক বার ভুল চেষ্টা করা হয়েছে। ${formatTime(lockoutRemaining)} অপেক্ষা করুন।` : `Too many failed attempts. Try again in ${formatTime(lockoutRemaining)}.`)
                  : error
                }
              </span>
              {!isLockedOut && (
                <button onClick={() => setError('')} aria-label={isBn ? 'বন্ধ করুন' : 'Close'} className="text-[var(--red)]/30 hover:text-[var(--red)]/60 cursor-pointer bg-transparent border-none p-0">
                  <X size={12} />
                </button>
              )}
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
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder={isBn ? 'admin@school.edu.bd' : 'admin@school.edu.bd'}
                  autoComplete="username"
                  data-1p-ignore="true"
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
                  autoComplete="current-password"
                  data-1p-ignore="true"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 rounded-xl text-[0.875rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !loading && !googleLoading
                  ? `linear-gradient(135deg, ${institution.brandColor} 0%, ${institution.brandColor}cc 100%)`
                  : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: !loading && !googleLoading ? '#fff' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              }}
            >
              {!loading && <LogIn size={16} />}
              {loading
                ? (isBn ? 'সাইন ইন হচ্ছে...' : 'Signing in...')
                : (isBn ? 'সাইন ইন' : 'Sign In')
              }
            </button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
            <span className={`absolute px-2 text-[0.6875rem] font-medium uppercase tracking-wider ${isDark ? 'bg-[#0f172a] text-white/40' : 'bg-white text-gray-400'}`}>
              {isBn ? 'অথবা' : 'or'}
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={async () => {
              try {
                setGoogleLoading(true)
                setError('')
                const targetPath = subdomain ? `/dashboard?institution=${encodeURIComponent(subdomain)}` : '/dashboard'
                const callbackURL = `${window.location.origin}${targetPath}`

                if (subdomain) {
                  sessionStorage.setItem('edutech_intended_institution', subdomain)
                }

                // Attempt Better-Auth social sign in (redirects browser to Google's official OAuth login)
                const res = await authClient.signIn.social({
                  provider: 'google',
                  callbackURL,
                }).catch((e: unknown) => ({ error: { message: e instanceof Error ? e.message : 'Google sign-in failed' } }))

                if (res && 'data' in res && res.data && 'url' in res.data && res.data.url && typeof window !== 'undefined') {
                  window.location.href = res.data.url
                  return
                }

                if (res?.error) {
                  const msg = String(res.error.message || '').toLowerCase()
                  if (msg.includes('provider') || msg.includes('not enabled') || msg.includes('not found')) {
                    setError(
                      isBn
                        ? 'Google সাইন-ইন এখনও সার্ভারে কনফিগার করা হয়নি (GOOGLE_CLIENT_ID এবং GOOGLE_CLIENT_SECRET প্রয়োজন)।'
                        : 'Google Sign-In is not configured on the server yet (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required in .env).'
                    )
                  } else {
                    setError(res.error.message || (isBn ? 'Google দিয়ে সাইন ইন করতে সমস্যা হয়েছে' : 'Google sign-in failed'))
                  }
                }
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err)
                if (msg.toLowerCase().includes('provider') || msg.toLowerCase().includes('not enabled') || msg.toLowerCase().includes('not found')) {
                  setError(
                    isBn
                      ? 'Google সাইন-ইন এখনও সার্ভারে কনফিগার করা হয়নি (GOOGLE_CLIENT_ID এবং GOOGLE_CLIENT_SECRET প্রয়োজন)।'
                      : 'Google Sign-In is not configured on the server yet (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required in .env).'
                  )
                } else {
                  setError(msg || (isBn ? 'Google দিয়ে সাইন ইন করতে সমস্যা হয়েছে' : 'Google sign-in failed'))
                }
              } finally {
                setGoogleLoading(false)
              }
            }}
            disabled={loading || googleLoading}
            className={`w-full h-11 rounded-xl text-[0.875rem] font-medium border cursor-pointer flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
            }`}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-[var(--brand)] rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {googleLoading
                ? (isBn ? 'Google-এ সংযোগ হচ্ছে...' : 'Connecting to Google...')
                : (isBn ? 'Google দিয়ে সাইন ইন করুন' : 'Sign in with Google')
              }
            </span>
          </button>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <p className={`text-[0.6875rem] ${isDark ? 'text-white/30' : 'text-[var(--text-muted)]'}`}>
              {isBn ? 'পাসওয়ার্ড মনে নেই?' : 'Forgot password?'}{' '}
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="hover:underline cursor-pointer bg-transparent border-none text-[0.6875rem] font-medium"
                style={{ color: institution.brandColor }}
              >
                {isBn ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
              </button>
            </p>
          </div>

          <ForgotPasswordModal
            isOpen={forgotModalOpen}
            onClose={() => setForgotModalOpen(false)}
            isBn={isBn}
            brandColor={institution.brandColor}
            isDark={isDark}
          />

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className={`flex items-center justify-center gap-2 text-[0.6875rem] ${isDark ? 'text-white/20' : 'text-[var(--text-muted)]'}`}>
              <Lock size={11} />
              <span>{isBn ? 'নিরাপদ অ্যাডমিন ও শিক্ষক অ্যাক্সেস' : 'Protected admin & teacher access'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
