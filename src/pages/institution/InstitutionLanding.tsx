import { useMemo, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  GraduationCap, Building2, Phone, Mail, MapPin, Globe,
  Clock, BookOpen, Shield, ChevronRight, LogIn,
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

  const infoItems = [
    institution.phone && { icon: Phone, label: institution.phone, href: `tel:${institution.phone}` },
    institution.email && { icon: Mail, label: institution.email, href: `mailto:${institution.email}` },
    (institution.address || institution.addressBn) && { icon: MapPin, label: isBn ? (institution.addressBn || institution.address) : institution.address },
    institution.eiin && { icon: Shield, label: `EIIN: ${institution.eiin}` },
    institution.startTime && institution.endTime && { icon: Clock, label: `${institution.startTime} – ${institution.endTime}` },
    institution.website && { icon: Globe, label: institution.website, href: institution.website },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href?: string }[]

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f0f2f8]'}`}>
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

      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {institution.banner ? (
          <img src={institution.banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${institution.brandColor} 0%, ${institution.brandColor}aa 100%)` }}
            />
            <BackgroundPaths color={institution.brandColor} />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Logo + Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 sm:px-10 sm:pb-8">
          <div className="flex items-end gap-4">
            {institution.logo ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 shrink-0 bg-white">
                <img src={institution.logo} alt={institution.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: institution.brandColor }}>
                <GraduationCap size={36} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {institution.brandName || institution.name}
              </h1>
              {institution.nameBn && (
                <p className="text-sm text-white/60 mt-0.5">{institution.nameBn}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 -mt-4 relative z-10 pb-12">
        {/* Card */}
        <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-[#141420] border-white/5' : 'bg-white border-gray-100'}`}>
          {/* Motto */}
          {institution.motto && (
            <div className={`px-6 py-5 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
              <p className="text-center italic text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
                "{isBn ? (institution.mottoBn || institution.motto) : institution.motto}"
              </p>
            </div>
          )}

          {/* Info Grid */}
          <div className="px-6 py-5">
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
              {isBn ? 'যোগাযোগের তথ্য' : 'Contact Information'}
            </h3>
            <div className="space-y-3">
              {infoItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon size={16} style={{ color: institution.brandColor }} className="mt-0.5 shrink-0" />
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: institution.brandColor }}>
                      {item.label}
                    </a>
                  ) : (
                    <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sessions & Subjects */}
          <div className={`px-6 py-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Sessions */}
              {institution.sessions?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <BookOpen size={14} style={{ color: institution.brandColor }} />
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                      {isBn ? 'সেশন' : 'Sessions'}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {institution.sessions.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: `${institution.brandColor}15`, color: institution.brandColor }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjects */}
              {institution.optionalSubjects?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <GraduationCap size={14} style={{ color: institution.brandColor }} />
                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                      {isBn ? 'ঐচ্ছিক বিষয়' : 'Optional Subjects'}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {institution.optionalSubjects.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: `${institution.brandColor}15`, color: institution.brandColor }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className={`px-6 py-5 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <div className="grid grid-cols-3 gap-4">
              {institution.package && (
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: institution.brandColor }}>{institution.package.maxStudents}</p>
                  <p className={`text-[0.625rem] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{isBn ? 'সর্বোচ্চ ছাত্র' : 'Max Students'}</p>
                </div>
              )}
              {institution.package && (
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: institution.brandColor }}>{institution.package.maxTeachers}</p>
                  <p className={`text-[0.625rem] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{isBn ? 'সর্বোচ্চ শিক্ষক' : 'Max Teachers'}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: institution.brandColor }}>
                  {isBn ? (institution.package?.nameBn || institution.package?.name) : institution.package?.name}
                </p>
                <p className={`text-[0.625rem] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{isBn ? 'প্যাকেজ' : 'Package'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={() => navigate(`/i/${slug}/login`)}
          className="w-full mt-6 h-12 rounded-xl text-sm font-semibold border-none cursor-pointer flex items-center justify-center gap-2.5 transition-all hover:opacity-90 hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${institution.brandColor} 0%, ${institution.brandColor}cc 100%)`,
            color: '#fff',
          }}
        >
          <LogIn size={18} />
          {isBn ? 'লগইন করুন' : 'Login to Portal'}
          <ChevronRight size={16} />
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className={`flex items-center justify-center gap-2 text-[0.625rem] ${isDark ? 'text-white/20' : 'text-gray-400'}`}>
            <Shield size={11} />
            <span>{isBn ? 'নিরাপদ স্কুল ম্যানেজমেন্ট সিস্টেম' : 'Secure School Management System'}</span>
          </div>
          <p className={`text-[0.5625rem] mt-1 ${isDark ? 'text-white/10' : 'text-gray-300'}`}>
            Powered by EduTech
          </p>
        </div>
      </div>
    </div>
  )
}
