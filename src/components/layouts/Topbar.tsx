import { useState, useRef, useEffect } from "react"
import { Icon } from "@iconify/react"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"
import type { Theme, Language } from "@/types"

export default function Topbar() {
  const { theme, language, setTheme, setLanguage, toggleSidebar } = useAppStore()
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node))
        setThemeOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false)
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
    light:  "lucide:sun",
    dark:   "lucide:moon",
    system: "lucide:monitor",
  }

  const btnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    borderRadius: "8px",
    background: "var(--bg-secondary)",
    border: "0.5px solid var(--border)",
    cursor: "pointer",
    fontSize: "12px",
    color: "var(--text-secondary)",
    fontFamily: "inherit",
  }

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "42px",
    right: 0,
    background: "var(--bg-primary)",
    border: "0.5px solid var(--border-2)",
    borderRadius: "10px",
    padding: "5px",
    zIndex: 200,
    minWidth: "140px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
  }

  const ddItemStyle = (selected: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 10px",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "13px",
    color: selected ? "var(--brand)" : "var(--text-secondary)",
    fontWeight: selected ? 500 : 400,
    background: selected ? "var(--brand-light)" : "transparent",
  })

  return (
    <header
      style={{
        height: "50px",
        background: "var(--bg-primary)",
        borderBottom: "0.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "10px",
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Sidebar toggle */}
      <button onClick={toggleSidebar} style={{ ...btnStyle, padding: "5px 8px" }}>
        <Icon icon="lucide:menu" width={16} />
      </button>

      {/* Search */}
      <div
        style={{
          flex: 1,
          maxWidth: "320px",
          display: "flex",
          alignItems: "center",
          gap: "7px",
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--border)",
          borderRadius: "8px",
          padding: "6px 10px",
          fontSize: "13px",
          color: "var(--text-muted)",
          cursor: "text",
        }}
      >
        <Icon icon="lucide:search" width={14} />
        <span>{t("search_placeholder", language)}</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "11px",
            background: "var(--bg-tertiary)",
            padding: "1px 6px",
            borderRadius: "4px",
            color: "var(--text-muted)",
            fontFamily: "monospace",
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right side */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>

        {/* Notification */}
        <div style={{ position: "relative" }}>
          <button style={{ ...btnStyle, padding: "6px 8px" }}>
            <Icon icon="lucide:bell" width={16} />
          </button>
          <div
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              width: "6px",
              height: "6px",
              background: "var(--red)",
              borderRadius: "50%",
              border: "1.5px solid var(--bg-primary)",
            }}
          />
        </div>

        {/* Messages */}
        <button style={{ ...btnStyle, padding: "6px 8px" }}>
          <Icon icon="lucide:message-circle" width={16} />
        </button>

        {/* Divider */}
        <div
          style={{
            width: "0.5px",
            height: "20px",
            background: "var(--border-2)",
            margin: "0 2px",
          }}
        />

        {/* Language */}
        <div ref={langRef} style={{ position: "relative" }}>
          <button style={btnStyle} onClick={() => setLangOpen(!langOpen)}>
            <Icon icon="lucide:languages" width={14} />
            <span>{language === "bn" ? "বাং" : "EN"}</span>
            <Icon icon="lucide:chevron-down" width={12} />
          </button>
          {langOpen && (
            <div style={dropdownStyle}>
              {langOptions.map((opt) => (
                <div
                  key={opt.value}
                  style={ddItemStyle(language === opt.value)}
                  onClick={() => { setLanguage(opt.value); setLangOpen(false) }}
                >
                  {language === opt.value && (
                    <Icon icon="lucide:check" width={13} style={{ color: "var(--brand)" }} />
                  )}
                  {t(opt.labelKey, language)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme */}
        <div ref={themeRef} style={{ position: "relative" }}>
          <button style={btnStyle} onClick={() => setThemeOpen(!themeOpen)}>
            <Icon icon={themeIcons[theme]} width={14} />
            <Icon icon="lucide:chevron-down" width={12} />
          </button>
          {themeOpen && (
            <div style={dropdownStyle}>
              {themeOptions.map((opt) => (
                <div
                  key={opt.value}
                  style={ddItemStyle(theme === opt.value)}
                  onClick={() => { setTheme(opt.value); setThemeOpen(false) }}
                >
                  <Icon icon={opt.icon} width={14} />
                  {t(opt.labelKey, language)}
                  {theme === opt.value && (
                    <Icon
                      icon="lucide:check"
                      width={13}
                      style={{ marginLeft: "auto", color: "var(--brand)" }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          SA
        </div>

      </div>
    </header>
  )
}
