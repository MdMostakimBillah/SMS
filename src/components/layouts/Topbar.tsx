import { useState, useRef, useEffect } from "react"
import {
  Menu, Search, Bell, MessageSquare, ChevronDown,
  Sun, Moon, Monitor, Clock,
  GraduationCap, Wallet, CreditCard,
  Settings, LogOut, HelpCircle,
  LayoutDashboard, Users, ClipboardCheck,
} from "lucide-react"
import { useAppStore } from "@/store/appStore"
import { useWindowSize } from "@/hooks/useWindowSize"
import { useNavigate } from "react-router-dom"
import { t } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"
import type { Theme, Language } from "@/types"

const demoNotifications = [
  {
    id: 1,
    icon: <GraduationCap size={13} />,
    iconBg: "var(--teal-light)",
    iconColor: "var(--teal)",
    titleEn: "New Student Admission",
    titleBn: "নতুন ছাত্র ভর্তি",
    descEn: "Fatima Ahmed admitted to Class 5-A",
    descBn: "ফাতিমা আহমেদ শ্রেণি ৫-এ ভর্তি হয়েছে",
    time: "5 min ago", timeBn: "৫ মিনিট আগে", unread: true,
  },
  {
    id: 2,
    icon: <Wallet size={13} />,
    iconBg: "var(--green-light)",
    iconColor: "var(--green)",
    titleEn: "Salary Disbursed",
    titleBn: "বেতন প্রদান",
    descEn: "May 2026 salary processed",
    descBn: "মে ২০২৬ বেতন প্রক্রিয়া করা হয়েছে",
    time: "1 hour ago", timeBn: "১ ঘণ্টা আগে", unread: true,
  },
  {
    id: 3,
    icon: <CreditCard size={13} />,
    iconBg: "var(--red-light)",
    iconColor: "var(--red)",
    titleEn: "Fee Due Reminder",
    titleBn: "ফি বকেয়",
    descEn: "12 students have pending fees",
    descBn: "১২ জনের বকেয় আছে",
    time: "2 hours ago", timeBn: "২ ঘণ্টা আগে", unread: true,
  },
]

const demoMessages = [
  {
    id: 1,
    name: "Rahima Khatun", nameBn: "রহিমা খাতুন",
    role: "Parent", roleBn: "অভিভাবক",
    avatar: "RK", avatarBg: "var(--teal)",
    lastMsg: "My son is feeling unwell.",
    lastMsgBn: "আমার ছেলে অসুস্থ।",
    time: "10 min ago", timeBn: "১০ মিনিট আগে", unread: 2,
  },
  {
    id: 2,
    name: "Dr. Rafiqul Islam", nameBn: "ড. রফিকুল ইসলাম",
    role: "Teacher", roleBn: "শিক্ষক",
    avatar: "RI", avatarBg: "var(--brand)",
    lastMsg: "Lab equipment list ready.",
    lastMsgBn: "ল্যাব তালিকা প্রস্তুত।",
    time: "30 min ago", timeBn: "৩০ মিনিট আগে", unread: 0,
  },
]

export default function Topbar() {
  const navigate = useNavigate()
  const { theme, language, setTheme, setLanguage, toggleSidebar } = useAppStore()
  const { isMobile } = useWindowSize()
  const [notifOpen, setNotifOpen] = useState(false)
  const [msgOpen, setMsgOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const msgRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) setMsgOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const themeOptions: { value: Theme; labelKey: TranslationKey; icon: React.ReactNode }[] = [
    { value: "light",  labelKey: "theme_light",  icon: <Sun size={13} /> },
    { value: "dark",   labelKey: "theme_dark",   icon: <Moon size={13} /> },
    { value: "system", labelKey: "theme_system", icon: <Monitor size={13} /> },
  ]
  const langOptions: { value: Language; labelKey: TranslationKey }[] = [
    { value: "bn", labelKey: "lang_bn" },
    { value: "en", labelKey: "lang_en" },
  ]
  const isBn = language === "bn"
  const unreadNotifs = demoNotifications.filter(n => n.unread).length
  const unreadMsgs = demoMessages.reduce((sum, m) => sum + m.unread, 0)

  const iconBtn: React.CSSProperties = {
    width: "32px", height: "32px", borderRadius: "8px",
    background: "var(--surface)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "var(--text-secondary)", position: "relative",
    flexShrink: 0,
    transition: "all 0.15s"
  }
  const panelStyle: React.CSSProperties = {
    position: "absolute", top: "38px", right: 0,
    background: "var(--glass)", backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "12px", zIndex: 300,
    width: isMobile ? "calc(100vw - 16px)" : "340px",
    maxHeight: "380px", overflow: "hidden",
    boxShadow: "var(--shadow-lg)",
  }
  const panelHeader: React.CSSProperties = {
    padding: "12px 14px", borderBottom: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }
  const panelItem: React.CSSProperties = {
    padding: "10px 14px", display: "flex", gap: "10px",
    borderBottom: "1px solid var(--border)", cursor: "pointer",
    transition: "all 0.15s",
  }
  const profileDd: React.CSSProperties = {
    position: "absolute", top: "42px", right: 0,
    background: "var(--glass)", backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid var(--glass-border)",
    borderRadius: "12px", zIndex: 300, width: "240px",
    boxShadow: "var(--shadow-lg)", overflow: "hidden",
  }
  const profileItem: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "8px 14px", cursor: "pointer", fontSize: "12px",
    color: "var(--text-secondary)", transition: "all 0.15s",
    borderRadius: "6px",
  }

  return (
    <header style={{
      height: isMobile ? "50px" : "54px",
      background: "var(--glass)",
      backdropFilter: "blur(16px) saturate(180%)",
      WebkitBackdropFilter: "blur(16px) saturate(180%)",
      borderBottom: "1px solid var(--glass-border)",
      display: "flex", alignItems: "center",
      padding: isMobile ? "0 10px" : "0 20px",
      gap: isMobile ? "6px" : "8px",
      flexShrink: 0, zIndex: 100,
    }}>

      {/* Hamburger */}
      <button onClick={toggleSidebar} style={iconBtn}>
        <Menu size={16} />
      </button>

      {/* Search */}
      {isMobile ? (
        <button style={{ ...iconBtn, flexShrink: 0 }}>
          <Search size={16} />
        </button>
      ) : (
        <div style={{
          flex: 1, maxWidth: "300px",
          display: "flex", alignItems: "center", gap: "8px",
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "8px", padding: "6px 12px", cursor: "text", minWidth: 0,
        }}>
          <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "var(--text-muted)", flex: 1 }}>
            {t("search_placeholder", language)}
          </span>
          <kbd style={{
            fontSize: "9px", background: "var(--surface)",
            border: "1px solid var(--border)", padding: "2px 6px",
            borderRadius: "4px", color: "var(--text-muted)", fontFamily: "monospace",
          }}>⌘K</kbd>
        </div>
      )}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: isMobile ? "4px" : "6px", flexShrink: 0 }}>

        {/* Notification */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button style={iconBtn} onClick={() => { setNotifOpen(!notifOpen); setMsgOpen(false); setProfileOpen(false) }}>
            <Bell size={15} />
            {unreadNotifs > 0 && (
              <div style={{
                position: "absolute", top: "4px", right: "4px",
                minWidth: "14px", height: "14px", background: "var(--red)",
                borderRadius: "7px", border: "2px solid var(--bg-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "8px", fontWeight: 700, color: "#fff", padding: "0 3px",
              }}>{unreadNotifs}</div>
            )}
          </button>
          {notifOpen && (
            <div style={panelStyle}>
              <div style={panelHeader}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {isBn ? "নোটিফিকেশন" : "Notifications"}
                </span>
                <span style={{ fontSize: "11px", color: "var(--brand)", cursor: "pointer", fontWeight: 500 }}>
                  {isBn ? "সব পড়ুন" : "Mark all"}
                </span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "330px" }}>
                {demoNotifications.map(n => (
                  <div key={n.id} style={{
                    ...panelItem,
                    background: n.unread ? "var(--brand-light)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!n.unread) e.currentTarget.style.background = "var(--bg-secondary)" }}
                  onMouseLeave={e => { if (!n.unread) e.currentTarget.style.background = "transparent" }}
                  >
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "8px",
                      background: n.iconBg, display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0, color: n.iconColor,
                    }}>{n.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                        {isBn ? n.titleBn : n.titleEn}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "2px" }}>
                        {isBn ? n.descBn : n.descEn}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} />
                        {isBn ? n.timeBn : n.time}
                      </div>
                    </div>
                    {n.unread && (
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)", flexShrink: 0, marginTop: "4px" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={msgRef} style={{ position: "relative" }}>
          <button style={iconBtn} onClick={() => { setMsgOpen(!msgOpen); setNotifOpen(false); setProfileOpen(false) }}>
            <MessageSquare size={15} />
            {unreadMsgs > 0 && (
              <div style={{
                position: "absolute", top: "4px", right: "4px",
                minWidth: "14px", height: "14px", background: "var(--brand)",
                borderRadius: "7px", border: "2px solid var(--bg-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "8px", fontWeight: 700, color: "#fff", padding: "0 3px",
              }}>{unreadMsgs}</div>
            )}
          </button>
          {msgOpen && (
            <div style={panelStyle}>
              <div style={panelHeader}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {isBn ? "বার্তা" : "Messages"}
                </span>
                <span style={{ fontSize: "11px", color: "var(--brand)", cursor: "pointer", fontWeight: 500 }}>
                  {isBn ? "সব দেখুন" : "View all"}
                </span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "330px" }}>
                {demoMessages.map(m => (
                  <div key={m.id} style={panelItem}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "8px",
                      background: m.avatarBg, display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                      fontSize: "10px", fontWeight: 700, color: "#fff",
                    }}>{m.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {isBn ? m.nameBn : m.name}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", flexShrink: 0 }}>
                          {isBn ? m.timeBn : m.time}
                        </span>
                      </div>
                      <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "2px" }}>
                        {isBn ? m.roleBn : m.role}
                      </div>
                      <div style={{
                        fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {isBn ? m.lastMsgBn : m.lastMsg}
                      </div>
                    </div>
                    {m.unread > 0 && (
                      <div style={{
                        minWidth: "16px", height: "16px", borderRadius: "8px",
                        background: "var(--brand)", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "9px", fontWeight: 700,
                        color: "#fff", flexShrink: 0, marginTop: "4px",
                      }}>{m.unread}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isMobile && <div style={{ width: "1px", height: "20px", background: "var(--border)", margin: "0 2px" }} />}

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setMsgOpen(false) }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: isMobile ? "4px" : "4px 8px 4px 4px",
              borderRadius: "8px",
              border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
            }}
          >
            <div style={{
              width: "26px", height: "26px", borderRadius: "6px",
              background: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 700, color: "#fff",
            }}>SA</div>
            {!isMobile && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>Admin</div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "1px" }}>Administrator</div>
              </div>
            )}
            <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
          </div>

          {profileOpen && (
            <div style={profileDd}>
              {/* Profile header */}
              <div style={{ padding: "14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "10px",
                  background: "var(--brand)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>SA</div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>School Admin</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>admin@school.edu</div>
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ padding: "6px", borderBottom: "1px solid var(--border)" }}>
                {[
                  { icon: <LayoutDashboard size={14} />, labelEn: "Dashboard", labelBn: "ড্যাশবোর্ড", path: "/dashboard" },
                  { icon: <Users size={14} />, labelEn: "Students", labelBn: "ছাত্র", path: "/students" },
                  { icon: <ClipboardCheck size={14} />, labelEn: "Attendance", labelBn: "উপস্থিতি", path: "/attendance" },
                ].map(item => (
                  <div key={item.path} style={profileItem}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-primary)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}
                    onClick={() => { navigate(item.path); setProfileOpen(false) }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>{item.icon}</span>
                    {isBn ? item.labelBn : item.labelEn}
                  </div>
                ))}
              </div>

              {/* Language */}
              <div style={{ padding: "6px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", padding: "4px 10px", gap: "6px" }}>
                  {langOptions.map(opt => (
                    <div key={opt.value}
                      onClick={() => setLanguage(opt.value)}
                      style={{
                        flex: 1, padding: "6px", borderRadius: "6px", cursor: "pointer",
                        fontSize: "11px", fontWeight: language === opt.value ? 600 : 400,
                        textAlign: "center", transition: "all 0.15s",
                        background: language === opt.value ? "var(--brand)" : "var(--bg-secondary)",
                        color: language === opt.value ? "#fff" : "var(--text-secondary)",
                        border: `1px solid ${language === opt.value ? "var(--brand)" : "var(--border)"}`,
                      }}
                    >
                      {t(opt.labelKey, language)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div style={{ padding: "6px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", padding: "4px 10px", gap: "6px" }}>
                  {themeOptions.map(opt => (
                    <div key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      style={{
                        flex: 1, padding: "6px", borderRadius: "6px", cursor: "pointer",
                        fontSize: "11px", fontWeight: theme === opt.value ? 600 : 400,
                        textAlign: "center", transition: "all 0.15s",
                        background: theme === opt.value ? "var(--brand)" : "var(--bg-secondary)",
                        color: theme === opt.value ? "#fff" : "var(--text-secondary)",
                        border: `1px solid ${theme === opt.value ? "var(--brand)" : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                      }}
                    >
                      {opt.icon}
                      {t(opt.labelKey, language)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom actions */}
              <div style={{ padding: "6px" }}>
                {[
                  { icon: <Settings size={14} />, labelEn: "Settings", labelBn: "সেটিংস", path: "/settings" },
                  { icon: <HelpCircle size={14} />, labelEn: "Help", labelBn: "সাহায্য", path: "/help" },
                ].map(item => (
                  <div key={item.path} style={profileItem}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--text-primary)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}
                    onClick={() => { navigate(item.path); setProfileOpen(false) }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>{item.icon}</span>
                    {isBn ? item.labelBn : item.labelEn}
                  </div>
                ))}
                <div style={{ ...profileItem, color: "var(--red)", marginTop: "2px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--red-light)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={14} />
                  {isBn ? "লগ আউট" : "Log Out"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
