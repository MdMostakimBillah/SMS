import { useEffect, useRef, useState, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useClassStore, mapSchoolToInstitutionSettings, generateLightColors, generateDarkColors } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useThemeColors, applyThemeColors } from '@/hooks/useThemeColors'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useAuth } from '@/contexts/AuthContext'
import { authApi, resolveMediaUrl } from '@/lib/api'
import { gsap } from 'gsap'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from '@/components/shared/CommandPalette'
import QuickAccessFAB from '@/components/shared/QuickAccessFAB'
import { Crown, X, FolderSync, CreditCard, LogOut } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { clearSlug, setSlug } from '@/lib/storage'
import { useBn } from '@/hooks/useBn'
import { getVaultStatus, subscribeVault, vaultReconnect, type VaultStatus } from '@/lib/vault/vault'
import { isLocalComputerMode } from '@/lib/storageMode'
import { mapPublicSchoolToInstitution, resolveInstitutionRecord } from '@/lib/institutionResolver'
import { prefetchAllRoutes } from '@/lib/prefetchRoutes'
import { SubscriptionPaymentPanel } from '@/pages/settings/panels/SubscriptionPaymentPanel'

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
  const institutions = useSuperAdminStore((s) => s.institutions) ?? []
  const stopViewing = useSuperAdminStore((s) => s.stopViewing)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useWindowSize()
  const isSmall = isMobile || isTablet
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const viewedInst = useMemo(() => {
    if (!viewingInstitutionId || user?.role !== 'super_admin') return null
    return institutions.find((i) => i.id === viewingInstitutionId) || null
  }, [viewingInstitutionId, institutions, user])

  useThemeColors()
  const [isLoading, setIsLoading] = useState(true)
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>(() => getVaultStatus())

  useEffect(() => {
    return subscribeVault(setVaultStatus)
  }, [])
  const [loadingLogoErr, setLoadingLogoErr] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const lastSyncedKeyRef = useRef<string | null>(null)

  // Fresh attempt whenever the institution (and therefore its logo) changes.
  useEffect(() => { setLoadingLogoErr(false) }, [institution.logo])

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', language)
  }, [language])

  // Warm Service Worker cache with all route chunks during idle time for offline usage
  useEffect(() => {
    if (user) {
      prefetchAllRoutes()
    }
  }, [user])

  // Synchronize institution data from database on mount / refresh
  useEffect(() => {
    const viewingId = viewingInstitutionId || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edutech_viewing_id') : null)
    if (user?.role === 'super_admin') {
      if (viewingId) {
        const syncKey = `viewing:${viewingId}`
        if (lastSyncedKeyRef.current === syncKey) return
        lastSyncedKeyRef.current = syncKey

        authApi.getPublicSchool(viewingId).then((res) => {
          if (res?.school) {
            const targetSlug = res.school.domain || res.school.slug || viewingId
            setSlug(targetSlug)
            const mapped = mapSchoolToInstitutionSettings(res.school, useClassStore.getState().institution)
            useClassStore.getState().updateInstitution(mapped)
            const existing = useSuperAdminStore
              .getState()
              .institutions.find((i) => i.id === res.school!.id || i.slug === targetSlug || i.subdomain === targetSlug)
            useSuperAdminStore
              .getState()
              .addInstitution(mapPublicSchoolToInstitution(res.school, targetSlug, existing))
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
              sessionStorage.setItem('edutech_server_url', mapped.serverUrl || '')
            }
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
              if (mapped.serverUrl) localStorage.setItem('edutech_server_url', mapped.serverUrl)
            }
            const brand = res.school.brandColor || '#6366f1'
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
            applyThemeColors(isDark ? generateDarkColors(brand) : generateLightColors(brand))
            useClassStore.getState().syncFromServer(targetSlug).catch(() => {})
            useFeeStore.getState().syncFromServer(targetSlug).catch(() => {})
            useNotificationStore.getState().syncFromServer(targetSlug).catch(() => {})
            useTeacherStore.getState().syncFromServer(targetSlug).catch(() => {})
          }
        }).catch(() => {})
      } else {
        const platformSlug = user.schoolDomain || user.school?.domain || 'edutech'
        const syncKey = `platform:${platformSlug}`
        if (lastSyncedKeyRef.current !== syncKey) {
          lastSyncedKeyRef.current = syncKey
          setSlug(platformSlug)
          useNotificationStore.getState().syncFromServer('super-admin').catch(() => {})
        }
      }
      return
    }

    if (user?.school) {
      if (isLocalComputerMode()) {
        const brand = user.school.brandColor || '#6366f1'
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        applyThemeColors(isDark ? generateDarkColors(brand) : generateLightColors(brand))
        const classUpdates: Record<string, any> = {}
        if (user.school.expiresAt !== undefined) classUpdates.expiresAt = user.school.expiresAt || null
        if (user.school.status) classUpdates.status = user.school.status
        if (Object.keys(classUpdates).length > 0) {
          useClassStore.getState().updateInstitution(classUpdates)
        }
        return
      }

      const targetSlug =
        user.schoolDomain ||
        user.school.domain ||
        user.school.slug ||
        (user.schoolName ? user.schoolName.toLowerCase().replace(/\s+/g, '-') : '')
      const schoolId = user.school.id || targetSlug || 'school'
      const syncKey = `school:${schoolId}`
      if (lastSyncedKeyRef.current === syncKey) return
      lastSyncedKeyRef.current = syncKey

      if (targetSlug) {
        setSlug(targetSlug)
      }
      const mapped = mapSchoolToInstitutionSettings(user.school, useClassStore.getState().institution)
      useClassStore.getState().updateInstitution(mapped)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
        sessionStorage.setItem('edutech_server_url', mapped.serverUrl || '')
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
        if (mapped.serverUrl) localStorage.setItem('edutech_server_url', mapped.serverUrl)
      }
      const brand = user.school.brandColor || '#6366f1'
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      applyThemeColors(isDark ? generateDarkColors(brand) : generateLightColors(brand))
      useClassStore.getState().syncFromServer(targetSlug || user.school.id).catch(() => {})
      useFeeStore.getState().syncFromServer(targetSlug || user.school.id).catch(() => {})
      useNotificationStore.getState().syncFromServer(targetSlug || user.school.id).catch(() => {})
      useTeacherStore.getState().syncFromServer(targetSlug || user.school.id).catch(() => {})
    } else {
      if (isLocalComputerMode()) return
      const pathSlug =
        (typeof window !== 'undefined' ? window.location.pathname.match(/^\/i\/([^/]+)/)?.[1] : null) ||
        sessionStorage.getItem('edutech_inst_slug') ||
        localStorage.getItem('edutech_inst_slug')
      if (pathSlug && pathSlug !== 'super-admin' && (!institution.name || institution.brandName === 'EduTech')) {
        const syncKey = `path:${pathSlug}`
        if (lastSyncedKeyRef.current === syncKey) return
        lastSyncedKeyRef.current = syncKey

        authApi.getPublicSchool(pathSlug).then((res) => {
          if (res?.school) {
            setSlug(pathSlug)
            const mapped = mapSchoolToInstitutionSettings(res.school, useClassStore.getState().institution)
            useClassStore.getState().updateInstitution(mapped)
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
              sessionStorage.setItem('edutech_server_url', mapped.serverUrl || '')
            }
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
              if (mapped.serverUrl) localStorage.setItem('edutech_server_url', mapped.serverUrl)
            }
            const brand = res.school.brandColor || '#6366f1'
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
            applyThemeColors(isDark ? generateDarkColors(brand) : generateLightColors(brand))
            useClassStore.getState().syncFromServer(pathSlug).catch(() => {})
            useFeeStore.getState().syncFromServer(pathSlug).catch(() => {})
            useNotificationStore.getState().syncFromServer(pathSlug).catch(() => {})
            useTeacherStore.getState().syncFromServer(pathSlug).catch(() => {})
          }
        }).catch(() => {})
      }
    }
  }, [user?.school?.id, user?.schoolId, user?.role, viewingInstitutionId, theme])

  useEffect(() => {
    const slug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
    const viewed = viewedInst
    const inst = slug ? viewed || institution : null
    if (inst && inst.name) {
      document.title = inst.name
      if (inst.logo) {
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
        link.href = resolveMediaUrl(inst.logo)
      }
    } else {
      document.title = 'EduTech SMS'
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (link) link.href = '/favicon.svg'
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
    const loadingName = isSuperAdmin ? 'EduTech' : institution.name
    const loadingLogo = isSuperAdmin ? null : institution.logo
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-tertiary)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {loadingLogo && !loadingLogoErr ? (
            <div className="w-16 h-16 rounded-2xl bg-[var(--brand)] flex items-center justify-center overflow-hidden">
              <img
                src={resolveMediaUrl(loadingLogo)}
                alt={loadingName}
                referrerPolicy="no-referrer"
                onError={() => setLoadingLogoErr(true)}
                className="w-full h-full object-contain p-1.5"
              />
            </div>
          ) : (
            <BrandLogo size={72} />
          )}
        </div>
      </div>
    )
  }

  // Check if institution is suspended, inactive, or subscription expired
  const isSuperAdmin = user?.role === 'super_admin'
  const currentInstSlug =
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edutech_inst_slug') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('edutech_inst_slug') : null) ||
    user?.schoolDomain ||
    user?.school?.domain ||
    user?.school?.slug ||
    user?.subdomain

  const currentInst = !isSuperAdmin
    ? resolveInstitutionRecord({
        institutions,
        user,
        schoolSlug: currentInstSlug,
        eiin: institution?.eiin,
        fallbackClassInstitution: institution,
      })
    : null

  const isDateOver = currentInst?.expiresAt
    ? new Date(currentInst.expiresAt).getTime() < Date.now()
    : false
  const isSuspended = Boolean(currentInst && (currentInst.status === 'suspended' || isDateOver))
  const isInactive = Boolean(currentInst && currentInst.status === 'inactive')

  if (currentInst && (isSuspended || isInactive)) {
    const formattedExpiry = currentInst.expiresAt
      ? new Date(currentInst.expiresAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null

    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-tertiary)] p-4">
        <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 text-center shadow-lg">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isSuspended
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'bg-gray-500/10 text-gray-500'
            }`}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              {isSuspended ? (
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              ) : (
                <>
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-2">
            {isDateOver
              ? (isBn ? 'সাবস্ক্রিপশনের মেয়াদ শেষ — অ্যাকাউন্ট স্থগিত' : 'Subscription Expired — Account Suspended')
              : isSuspended
              ? (isBn ? 'প্রতিষ্ঠান অ্যাকাউন্ট সাময়িক স্থগিত' : 'Account Suspended')
              : (isBn ? 'প্রতিষ্ঠান অ্যাকাউন্ট নিষ্ক্রিয়' : 'Account Inactive')}
          </h1>

          <p className="text-sm font-semibold text-[var(--brand)] mb-1">
            {isBn ? currentInst.nameBn || currentInst.name : currentInst.name}
            {currentInst.eiin ? ` (EIIN: ${currentInst.eiin})` : ''}
          </p>

          {formattedExpiry && (
            <p className="text-xs text-[var(--text-muted)] mb-3">
              {isDateOver
                ? (isBn ? `মেয়াদ উত্তীর্ণের তারিখ: ${formattedExpiry}` : `Expired on: ${formattedExpiry}`)
                : (isBn ? `মেয়াদ শেষ হবে: ${formattedExpiry}` : `Expires on: ${formattedExpiry}`)}
            </p>
          )}

          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            {isDateOver
              ? (isBn
                  ? 'আপনার সফটওয়্যার সাবস্ক্রিপশনের নির্ধারিত মেয়াদ উত্তীর্ণ হয়েছে। অ্যাকাউন্ট অবিলম্বে পুনরায় চালু করতে প্যাকেজ নবায়ন ও পেমেন্ট সম্পন্ন করুন অথবা সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।'
                  : 'Your software subscription period has ended. To reactivate your account immediately, please renew payment or contact your super administrator.')
              : isSuspended
              ? (isBn
                  ? 'আপনার প্রতিষ্ঠানের অ্যাকাউন্ট সাময়িক স্থগিত রাখা হয়েছে। সক্রিয় করতে পেমেন্ট সম্পন্ন করুন অথবা সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।'
                  : 'Your institution account has been temporarily suspended. Please make a payment or contact the super administrator to reactivate.')
              : (isBn
                  ? 'আপনার প্রতিষ্ঠানের অ্যাকাউন্ট এখন নিষ্ক্রিয় অবস্থায় রয়েছে।'
                  : 'Your institution account is currently inactive.')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isSuspended && (
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-[var(--brand)] hover:brightness-110 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                <CreditCard size={16} />
                <span>{isBn ? 'পেমেন্ট ও সক্রিয় করুন' : 'Pay & Reactivate Account'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                clearSlug()
                void logout?.()
                navigate('/login')
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] bg-[var(--surface-hover)] border border-[var(--border)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <LogOut size={16} />
              <span>{isBn ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Subscription Payment Modal on Suspended Screen */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-[var(--brand)]" />
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] m-0">
                    {isBn ? 'সাবস্ক্রিপশন নবায়ন ও অ্যাক্টিভেশন' : 'Subscription Renewal & Activation'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <SubscriptionPaymentPanel isBn={isBn} onBack={() => setShowPaymentModal(false)} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-tertiary)]">
      {/* Desktop / Tablet Sidebar — Left */}
      {!isMobile && sidebarPosition === 'left' && <Sidebar collapsed={isTablet ? true : sidebarCollapsed} />}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
        {vaultStatus.needsReconnect && user?.role !== 'super_admin' && (
          <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[0.8125rem]">
            <div className="flex items-center gap-2">
              <FolderSync size={16} className="text-emerald-500 shrink-0" />
              <span>
                {isBn
                  ? `আপনার লোকাল পিসি ফোল্ডার "${vaultStatus.folderName || 'Vault'}" সংরক্ষিত আছে। ফাইল সিঙ্ক ও ডেটা দেখতে অনুমতি দিন:`
                  : `Local PC data folder "${vaultStatus.folderName || 'Vault'}" detected. Allow access to restore and sync:`}
              </span>
            </div>
            <button
              onClick={() => void vaultReconnect()}
              className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[0.75rem] cursor-pointer transition-colors border-none shrink-0"
            >
              {isBn ? 'ফোল্ডার রিকানেক্ট করুন' : 'Reconnect Folder'}
            </button>
          </div>
        )}
        {viewedInst && (
          <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-2 text-[0.75rem] text-amber-600 font-medium">
              <Crown size={14} />
              <span>Viewing as: <strong>{viewedInst.name}</strong></span>
            </div>
            <button
              onClick={() => {
                clearSlug()
                stopViewing()
                if (user?.school) {
                  const mapped = mapSchoolToInstitutionSettings(user.school, useClassStore.getState().institution)
                  useClassStore.getState().updateInstitution(mapped)
                  const brand = user.school.brandColor || '#6366f1'
                  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                  applyThemeColors(isDark ? generateDarkColors(brand) : generateLightColors(brand))
                }
                navigate('/super-admin/schools')
              }}
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
          <div className="fade-in mx-auto w-full max-w-[1800px]">
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
