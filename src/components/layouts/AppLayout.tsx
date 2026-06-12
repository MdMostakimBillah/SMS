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
      <div
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--bg-tertiary)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            EduTech
          </div>
          <div
            style={{
              width: '6.25rem',
              height: '0.1875rem',
              background: 'var(--border)',
              borderRadius: '0.125rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '40%',
                height: '100%',
                background: 'var(--brand)',
                borderRadius: '0.125rem',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-tertiary)',
      }}
    >
      {/* Sidebar — desktop only (mobile uses command palette) */}
      {!isSmall && (
        <Sidebar collapsed={sidebarCollapsed} />
      )}

      {/* Main */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative',
        }}
      >
        <Topbar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '14px' : isTablet ? '18px' : '1.5rem',
            background: 'var(--bg-tertiary)',
          }}
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
