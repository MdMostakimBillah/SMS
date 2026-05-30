import { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import { useAppStore } from "@/store/appStore"
import { useWindowSize } from "@/hooks/useWindowSize"
import { t } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"
import type { Theme, Language } from "@/types"

export default function Topbar() {
  const { theme, language, setTheme, setLanguage, toggleSidebar } = useAppStore()
  const { isMobile } = useWindowSize()
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const themeOptions: { value: Theme; labelKey: TranslationKey; icon: string }[] = [
    { value: "light",  labelKey: "theme_light",  icon: "lucide:sun" },
    { value: "dark",   labelKey: "theme_dark",   icon: "lucide:moon" },
    { value: "system", labelKey: "theme_system", icon: "lucide:monitor" },
  ]
  const langOptions: { value: Language; labelKey: TranslationKey }[] = [
    { value: "bn", labelKey: "lang_bn" },
    { value: "en", labelKey: "lang_en" },
  ]
  const themeIcons: Record<Theme, string> = {
    light: "lucide:sun", dark: "lucide:moon", system: "lucide:monitor",
  }

  const iconBtn: React.CSSProperties = {
    width: "34px", height: "34px", borderRadius: "9px",
    background: "var(--bg-secondary)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "var(--text-secondary)", position: "relative",
  }
  const ctrlBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "6px 10px", borderRadius: "9px",
    background: "var(--bg-secondary)", border: "1px solid var(--border)",
    cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)",
    fontFamily: "inherit", fontWeight: 500,
  }
  const ddStyle: React.CSSProperties = {
    position: "absolute", top: "42px", right: 0,
    background: "var(--bg-primary)", border: "1px solid var(--border)",
    borderRadius: "12px", padding: "5px", zIndex: 300,
    minWidth: "145px", boxShadow: "var(--shadow-lg)",
  }
  const ddItem = (sel: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: "8px",
    padding: "7px 10px", borderRadius: "8px", cursor: "pointer",
    fontSize: "13px",
    color: sel ? "var(--brand)" : "var(--text-secondary)",
    fontWeight: sel ? 500 : 400,
    background: sel ? "var(--brand-light)" : "transparent",
  })

  return (
    <header style={{
      height: "58px", background: "var(--bg-primary)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: isMobile ? "0 12px" : "0 20px",
      gap: "8px", flexShrink: 0, zIndex: 100,
    }}>

      {/* Hamburger — always visible */}
      <button onClick={toggleSidebar} style={iconBtn}>
        <Icon icon="lucide:menu" width={16} />
      </button>

      {/* Search */}
      <div style={{
        flex: 1, maxWidth: isMobile ? "100%" : "340px",
        display: "flex", alignItems: "center", gap: "8px",
        background: "var(--bg-secondary)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "7px 12px", cursor: "text",
      }}>
        <Icon icon="lucide:search" width={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>
          {t("search_placeholder", language)}
        </span>
        {!isMobile && (
          <kbd style={{
            fontSize: "10px", background: "var(--bg-tertiary)",
            border: "1px solid var(--border)", padding: "2px 6px",
            borderRadius: "5px", color: "var(--text-muted)", fontFamily: "monospace",
          }}>⌘K</kbd>
        )}
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>

        {/* Notification */}
        <div style={{ position: "relative" }}>
          <button style={iconBtn}>
            <Icon icon="lucide:bell" width={16} />
            <div style={{
              position: "absolute", top: "7px", right: "7px",
              width: "7px", height: "7px", background: "var(--red)",
              borderRadius: "50%", border: "2px solid var(--bg-primary)",
            }} />
          </button>
        </div>

        {!isMobile && (
          <button style={iconBtn}>
            <Icon icon="lucide:message-square" width={16} />
          </button>
        )}

        <div style={{ width: "1px", height: "22px", background: "var(--border)", margin: "0 2px" }} />

        {/* Language */}
        <div ref={langRef} style={{ position: "relative" }}>
          <button style={ctrlBtn} onClick={() => setLangOpen(!langOpen)}>
            <Icon icon="lucide:languages" width={14} />
            {!isMobile && <span>{language === "bn" ? "বাং" : "EN"}</span>}
            <Icon icon="lucide:chevron-down" width={11} style={{ opacity: 0.6 }} />
          </button>
          {langOpen && (
            <div style={ddStyle}>
              {langOptions.map(opt => (
                <div key={opt.value} style={ddItem(language === opt.value)}
                  onClick={() => { setLanguage(opt.value); setLangOpen(false) }}>
                  {language === opt.value && <Icon icon="lucide:check" width={13} />}
                  {language !== opt.value && <div style={{ width: 13 }} />}
                  {t(opt.labelKey, language)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme */}
        <div ref={themeRef} style={{ position: "relative" }}>
          <button style={ctrlBtn} onClick={() => setThemeOpen(!themeOpen)}>
            <Icon icon={themeIcons[theme]} width={14} />
            <Icon icon="lucide:chevron-down" width={11} style={{ opacity: 0.6 }} />
          </button>
          {themeOpen && (
            <div style={ddStyle}>
              {themeOptions.map(opt => (
                <div key={opt.value} style={ddItem(theme === opt.value)}
                  onClick={() => { setTheme(opt.value); setThemeOpen(false) }}>
                  <Icon icon={opt.icon} width={14} />
                  {t(opt.labelKey, language)}
                  {theme === opt.value && <Icon icon="lucide:check" width={13} style={{ marginLeft: "auto" }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: "1px", height: "22px", background: "var(--border)", margin: "0 2px" }} />

        {/* Profile */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "4px 8px 4px 4px", borderRadius: "10px",
          border: "1px solid var(--border)", background: "var(--bg-secondary)", cursor: "pointer",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: "linear-gradient(135deg, var(--brand), var(--purple))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: "#fff",
          }}>SA</div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>School Admin</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Administrator</div>
            </div>
          )}
          <Icon icon="lucide:chevron-down" width={12} style={{ color: "var(--text-muted)" }} />
        </div>
      </div>
    </header>
  )
}
