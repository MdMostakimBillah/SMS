import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useClassStore } from '@/store/classStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { gsap } from 'gsap'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from '@/components/shared/CommandPalette'

export default function AppLayout() {
  const { theme, sidebarCollapsed, sidebarOpen, toggleSidebar } = useAppStore()
  const { institution } = useClassStore()
  const { isMobile, isTablet } = useWindowSize()
  const isSmall = isMobile || isTablet
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
    return (
      <div className="flex h-screen overflow-hidden bg-[var(--bg-tertiary)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl bg-[var(--brand)] flex items-center justify-center"
            style={{ animation: 'pulse 2s infinite' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{institution.name || 'EduTech'}</div>
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

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-tertiary)]">
      {/* Desktop / Tablet Sidebar */}
      {!isMobile && <Sidebar collapsed={isTablet ? true : sidebarCollapsed} />}

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
            className="fixed left-0 top-0 bottom-0 z-50 flex"
            style={{ display: 'none' }}
          >
            <Sidebar collapsed={false} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
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

      <CommandPalette />
    </div>
  )
}
