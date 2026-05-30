import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useAppStore } from "@/store/appStore"
import { useWindowSize } from "@/hooks/useWindowSize"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function AppLayout() {
  const { theme, sidebarOpen, toggleSidebar } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const isSmall = isMobile || isTablet

  useEffect(() => {
    if (theme === "system") {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
    } else {
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [theme])

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-tertiary)" }}>

      {/* Mobile overlay */}
      {isSmall && sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
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
          padding: isMobile ? "12px" : isTablet ? "16px" : "24px",
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
