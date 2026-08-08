import { useEffect, useRef, useState, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useClassStore } from '@/store/classStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useAuth } from '@/contexts/AuthContext'
import { gsap } from 'gsap'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from '@/components/shared/CommandPalette'
import QuickAccessFAB from '@/components/shared/QuickAccessFAB'
import { Crown, X } from 'lucide-react'
import { clearSlug } from '@/lib/storage'
import { useBn } from '@/hooks/useBn'

export default function AppLayout() {
  const isBn = useBn()
  const theme = useAppStore((s) => s.theme)
  const language = useAppStore((s) => s.language)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const sidebarPosition = useAppStore((s) => s.sidebarPosition)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const institution = useClassStore((s) => s.institution)
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)
  const institutions = useSuperAdminStore((s) => s.institutions)
  const stopViewing = useSuperAdminStore((s) => s.stopViewing)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useWindowSize()
  const isSmall = isMobile || isTablet

  const viewedInst = useMemo(() => {
    if (!viewingInstitutionId || user?.role !== 'super_admin') return null
    return institutions.find((i) => i.id === viewingInstitutionId) || null
  }, [viewingInstitutionId, institutions, user])

  useThemeColors()
  const [isLoading, setIsLoading] = useState(true)
  const backdropRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (theme === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', language)
  }, [language])

  useEffect(() => {
    const slug = sessionStorage.getItem('edutech_inst_slug')
    const viewed = viewedInst
    const inst = slug ? viewed || institution : null
    if (inst && inst.name) {
      document.title = inst.name
      if (inst.logo) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
        link.href = inst.logo
      }
    } else {
      document.title = 'EduTech SMS'
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (link) link.href = '/favicon.ico'
    }
  }, [institution, viewedInst])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  // Mobile sidebar GSAP animation
  useEffect(() => {
    if (!isSmall) return

    if (sidebarOpen && backdropRef.current && drawerRef.current) {
      // Open animation
      gsap.set(backdropRef.current, { display: 'block' })
      gsap.set(drawerRef.current, { display: 'flex' })
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      gsap.fromTo(drawerRef.current, { x: '-100%' }, { x: '0%', duration: 0.3, ease: 'power3.out' })
    } else if (!sidebarOpen && backdropRef.current && drawerRef.current) {
      // Close animation
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' })
      gsap.to(drawerRef.current, { x: '-100%', duration: 0.25, ease: 'power3.in', onComplete: () => {
        gsap.set(backdropRef.current, { display: 'none' })
        gsap.set(drawerRef.current, { display: 'none' })
      }})
    }
  }, [sidebarOpen, isSmall])

  // Close sidebar on resize to desktop
  useEffect(() => {
    if (!isSmall && sidebarOpen) {
      toggleSidebar()
    }
  }, [isSmall])

  if (isLoading) {
    const isSuperAdmin = user?.role === 'super_admin'
    const loadingName = isSuperAdmin ? 'EduTech' : (institution.brandName || institution.name || 'EduTech')
    const loadingLogo = isSuperAdmin ? null : institution.logo
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-tertiary)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl bg-[var(--brand)] flex items-center justify-center overflow-hidden"
            style={{ animation: 'pulse 2s infinite' }}
          >
            {loadingLogo ? (
              <img src={loadingLogo} alt={loadingName} className="w-full h-full object-cover" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            )}
          </div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{loadingName}</div>
          <div className="w-[6.25rem] h-[0.1875rem] bg-[var(--border)] rounded-[0.125rem] overflow-hidden">
            <div
              className="h-full w-2/5 bg-[var(--brand)] rounded-[0.125rem]"
              style={{ animation: 'shimmer 1.5s infinite' }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Check if institution is suspended or inactive
  const currentInstSlug = sessionStorage.getItem('edutech_inst_slug')
  const isSuperAdminViewing = user?.role === 'super_admin' && !!viewingInstitutionId
  const currentInst = !isSuperAdminViewing && currentInstSlug
    ? institutions.find((i) => i.slug === currentInstSlug) || null
    : null

  if (currentInst && (currentInst.status === 'suspended' || currentInst.status === 'inactive')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-tertiary)]">
        <div className="text-center max-w-md mx-auto px-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            currentInst.status === 'suspended' ? 'bg-red-500/10' : 'bg-gray-500/10'
          }`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke={currentInst.status === 'suspended' ? '#ef4444' : '#6b7280'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              {currentInst.status === 'suspended' ? (
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              ) : (
                <>
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {currentInst.status === 'suspended'
              ? (isBn ? 'এই প্রতিষ্ঠান বন্ধ রাখা হয়েছে' : 'Account Suspended')
              : (isBn ? 'এই প্রতিষ্ঠান নিষ্ক্রিয়' : 'Account Inactive')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-1">
            {isBn ? currentInst.nameBn || currentInst.name : currentInst.name}
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {currentInst.status === 'suspended'
              ? (isBn ? 'আপনার প্রতিষ্ঠানের অ্যাকাউন্ট সাময়িক বন্ধ রাখা হয়েছে।' : 'Your institution account has been temporarily suspended.')
              : (isBn ? 'আপনার প্রতিষ্ঠানের অ্যাকাউন্ট এখন নিষ্ক্রিয় আছে।' : 'Your institution account is currently inactive.')}
          </p>
          <button
            onClick={() => {
              clearSlug()
              logout()
              navigate('/')
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            {isBn ? 'লগ আউট' : 'Log Out'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-tertiary)]">
      {/* Desktop / Tablet Sidebar — Left */}
      {!isMobile && sidebarPosition === 'left' && <Sidebar collapsed={isTablet ? true : sidebarCollapsed} />}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
        {viewedInst && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-2 text-[0.75rem] text-amber-600 font-medium">
              <Crown size={14} />
              <span>Viewing as: <strong>{viewedInst.name}</strong></span>
            </div>
            <button
              onClick={() => { clearSlug(); stopViewing(); navigate('/super-admin/schools') }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold text-amber-700 bg-amber-500/15 hover:bg-amber-500/25 transition-colors cursor-pointer border-none"
            >
              <X size={12} />
              Exit
            </button>
          </div>
        )}
        <main
          className={`flex-1 overflow-y-auto bg-[var(--bg-tertiary)] ${
            isMobile ? 'p-3.5' : isTablet ? 'px-4 pt-[18px] pb-[18px]' : 'p-6'
          }`}
        >
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Desktop / Tablet Sidebar — Right */}
      {!isMobile && sidebarPosition === 'right' && <Sidebar collapsed={isTablet ? true : sidebarCollapsed} />}

      {/* Mobile Drawer Overlay */}
      {isMobile && (
        <>
          <div
            ref={backdropRef}
            className="fixed inset-0 bg-black/50 z-40"
            style={{ display: 'none' }}
            onClick={toggleSidebar}
          />
          <div
            ref={drawerRef}
            className={`fixed top-0 bottom-0 z-50 flex ${sidebarPosition === 'right' ? 'right-0' : 'left-0'}`}
            style={{ display: 'none' }}
          >
            <Sidebar collapsed={false} />
          </div>
        </>
      )}

      {/* Sidebar Position Toggle Button — moved to Sidebar */}

      <QuickAccessFAB />

      <CommandPalette />
    </div>
  )
}
