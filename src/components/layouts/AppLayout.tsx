import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useAppStore } from "@/store/appStore"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function AppLayout() {
  const { theme, sidebarOpen, toggleSidebar } = useAppStore()

  // App load হলে theme apply করো
  useEffect(() => {
    if (theme === "system") {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
    } else {
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [theme])

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 20,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "relative",
          zIndex: 30,
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            background: "var(--bg-tertiary)",
          }}
        >
          <Outlet />
        </main>
      </div>

    </div>
  )
}
