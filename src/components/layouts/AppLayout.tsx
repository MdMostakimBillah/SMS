import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from '@/components/shared/CommandPalette'

export default function AppLayout() {
  const { theme, sidebarCollapsed } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const isSmall = isMobile || isTablet
  const [isLoading, setIsLoading] = useState(true)

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
          <div className="text-sm font-semibold text-[var(--text-primary)]">EduTech</div>
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
      {!isSmall && <Sidebar collapsed={sidebarCollapsed} />}

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
