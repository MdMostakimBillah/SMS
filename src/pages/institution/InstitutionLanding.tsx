import { useMemo, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  GraduationCap, Building2, Users, BarChart3, Zap,
  ChevronRight, Lock, LogIn,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { BackgroundPaths } from '@/components/ui/BackgroundPaths'

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

export default function InstitutionLanding() {
  const { slug } = useParams<{ slug: string }>()
  const isBn = useBn()
  const navigate = useNavigate()
  const institutions = useSuperAdminStore((s) => s.institutions)
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const isDark = theme === 'dark'

  const institution = useMemo(() => {
    return institutions.find((i) => i.slug === slug) || null
  }, [slug, institutions])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

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
      link.href = institution.logo
    }
    return () => {
      document.title = 'EduTech SMS'
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (link) link.href = '/favicon.ico'
    }
  }, [institution, isBn])

  if (!institution) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0a0a0f' : '#f0f2f8' }}>
        <div className="text-center">
          <Building2 size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {isBn ? 'প্রতিষ্ঠান পাওয়া যায়নি' : 'Institution Not Found'}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {isBn ? 'এই ঠিকানায় কোনো প্রতিষ্ঠান নেই' : 'No institution found at this URL'}
          </p>
        </div>
      </div>
    )
  }

  const brandColor = institution.brandColor || '#6366f1'

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-colors text-white/40 hover:text-white/70">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </>
          ) : (
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          )}
        </svg>
      </button>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(180deg, #0f0f18 0%, #141420 100%)' : 'linear-gradient(180deg, #1a1a2e 0%, #1e1e32 100%)' }} />
        <BackgroundPaths isDark={isDark} color={brandColor} />
        <div className="relative z-10 text-center px-8">
          {institution.logo ? (
            <div className="w-[72px] h-[72px] rounded-2xl mx-auto mb-4 overflow-hidden shadow-xl">
              <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <GraduationCap size={72} style={{ color: brandColor }} className="mx-auto mb-4" />
          )}
          <h1 className="text-[2rem] font-bold mb-3 tracking-tight text-white">
            {institution.brandName || institution.name}
          </h1>
          {institution.nameBn && (
            <p className="text-[0.875rem] text-white/40 mb-1">{institution.nameBn}</p>
          )}
          {institution.motto && (
            <p className="text-[1rem] max-w-[280px] mx-auto leading-relaxed text-white/50 italic">
              "{isBn ? (institution.mottoBn || institution.motto) : institution.motto}"
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-2 text-[0.75rem] text-white/30">
            <Lock size={12} />
            <span>{isBn ? 'নিরাপদ ও বিশ্বস্ত' : 'Secure & Reliable'}</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Marketing */}
      <div className={`flex-1 flex items-center justify-center px-6 py-12 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
        <div className="w-full max-w-[24rem] relative">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            {institution.logo ? (
              <div className="w-11 h-11 rounded-xl mx-auto mb-4 overflow-hidden shadow-lg">
                <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <GraduationCap size={44} style={{ color: brandColor }} className="mx-auto mb-4" />
            )}
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>
              {institution.brandName || institution.name}
            </h1>
          </div>

          <div className="mb-8">
            <h2 className={`text-[1.75rem] font-bold mb-2 leading-tight ${isDark ? 'text-white' : 'text-[var(--text-primary)]'}`}>
              {isBn ? 'স্বাগতম' : 'Welcome'}
            </h2>
            <p className={`text-[0.875rem] leading-relaxed ${isDark ? 'text-white/40' : 'text-[var(--text-secondary)]'}`}>
              {isBn
                ? `${institution.brandName || institution.name}-এ স্বাগতম। আপনার স্কুল ম্যানেজমেন্ট পোর্টালে প্রবেশ করুন।`
                : `Welcome to ${institution.brandName || institution.name}. Access your school management portal.`
              }
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              { icon: Users, title: isBn ? 'ছাত্র ও শিক্ষক ম্যানেজমেন্ট' : 'Student & Teacher Management', desc: isBn ? 'সকল তথ্য এক জায়গায়' : 'All data in one place' },
              { icon: BarChart3, title: isBn ? 'পরীক্ষা ও ফলাফল' : 'Exams & Results', desc: isBn ? 'স্বয়ংক্রিয় গ্রেডিং ও রিপোর্ট' : 'Automatic grading & reports' },
              { icon: Zap, title: isBn ? 'ফি ও হিসাব' : 'Fees & Accounting', desc: isBn ? 'অনলাইন পেমেন্ট ও হিসাব' : 'Online payment & accounting' },
            ].map((f, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-white hover:shadow-sm'}`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : `${brandColor}15` }}>
                  <f.icon size={16} style={{ color: brandColor }} />
                </div>
                <div>
                  <h3 className={`text-[0.8125rem] font-semibold ${isDark ? 'text-white/80' : 'text-[var(--text-primary)]'}`}>{f.title}</h3>
                  <p className={`text-[0.6875rem] ${isDark ? 'text-white/35' : 'text-[var(--text-muted)]'}`}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Login Button */}
          <button onClick={() => navigate(`/i/${slug}/login`)}
            className="w-full h-12 rounded-xl text-[0.875rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`, color: '#fff' }}>
            <LogIn size={16} />
            {isBn ? 'লগইন করুন' : 'Login'}
            <ChevronRight size={16} />
          </button>

          <div className="mt-6 text-center">
            <p className={`text-[0.6875rem] ${isDark ? 'text-white/20' : 'text-[var(--text-muted)]'}`}>
              {isBn ? 'নিরাপদ স্কুল ম্যানেজমেন্ট সিস্টেম' : 'Secure school management system'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
