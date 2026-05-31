import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { useAppStore } from "@/store/appStore"
import { useWindowSize } from "@/hooks/useWindowSize"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function AppLayout() {
  const { theme, sidebarOpen, toggleSidebar } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const isSmall = isMobile || isTablet
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (theme === "system") {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
    } else {
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [theme])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-tertiary)",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "var(--brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 2s infinite",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}>
            EduTech
          </div>
          <div style={{
            width: "100px",
            height: "3px",
            background: "var(--border)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <div style={{
              width: "40%",
              height: "100%",
              background: "var(--brand)",
              borderRadius: "2px",
              animation: "shimmer 1.5s infinite",
            }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-tertiary)" }}>

      {/* Mobile overlay */}
      {isSmall && sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 40,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: isSmall ? "fixed" : "relative",
        inset: isSmall ? "0 auto 0 0" : "auto",
        zIndex: isSmall ? 50 : "auto",
        transform: isSmall
          ? sidebarOpen ? "translateX(0)" : "translateX(-100%)"
          : "translateX(0)",
        transition: "transform 0.25s ease",
        height: "100%",
        flexShrink: 0,
      }}>
        <Sidebar />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar />
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? "14px" : isTablet ? "18px" : "24px",
          background: "var(--bg-tertiary)",
        }}>
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
