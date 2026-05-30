import { useState, useRef, useEffect } from "react"
import {
  Menu, Search, Bell, MessageSquare, ChevronDown,
  Sun, Moon, Monitor, Clock, AlertTriangle,
  GraduationCap, Wallet, FileText, CreditCard,
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
    icon: <GraduationCap size={14} />,
    iconBg: "var(--teal-light)",
    iconColor: "var(--teal)",
    titleEn: "New Student Admission",
    titleBn: "নতুন ছাত্র ভর্তি",
    descEn: "Fatima Ahmed (STU-2026-0125) admitted to Class 5-A",
    descBn: "ফাতিমা আহমেদ (STU-2026-0125) শ্রেণি 5-এ ভর্তি হয়েছে",
    time: "5 min ago", timeBn: "৫ মিনিট আগে", unread: true,
  },
  {
    id: 2,
    icon: <Wallet size={14} />,
    iconBg: "var(--green-light)",
    iconColor: "var(--green)",
    titleEn: "Salary Disbursed",
    titleBn: "বেতন প্রদান করা হয়েছে",
    descEn: "May 2026 salary for 5 teachers has been processed",
    descBn: "মে ২০২৬ সালের ৫ জন শিক্ষকের বেতন প্রক্রিয়া করা হয়েছে",
    time: "1 hour ago", timeBn: "১ ঘণ্টা আগে", unread: true,
  },
  {
    id: 3,
    icon: <CreditCard size={14} />,
    iconBg: "var(--red-light)",
    iconColor: "var(--red)",
    titleEn: "Fee Due Reminder",
    titleBn: "বেতন বকেয় রিমাইন্ডার",
    descEn: "12 students have 2+ months pending fees (৳45,000 total)",
    descBn: "১২ জন ছাত্রের ২+ মাস বকেয় আছে (মোট ৳৪৫,০০০)",
    time: "2 hours ago", timeBn: "২ ঘণ্টা আগে", unread: true,
  },
  {
    id: 4,
    icon: <FileText size={14} />,
    iconBg: "var(--brand-light)",
    iconColor: "var(--brand)",
    titleEn: "Exam Schedule Published",
    titleBn: "পরীক্ষার সূচি প্রকাশিত",
    descEn: "Mid-term exam schedule for Class 6-10 has been published",
    descBn: "শ্রেণি ৬-১০ এর মধ্যবর্তী পরীক্ষার সূচি প্রকাশিত হয়েছে",
    time: "3 hours ago", timeBn: "৩ ঘণ্টা আগে", unread: false,
  },
  {
    id: 5,
    icon: <AlertTriangle size={14} />,
    iconBg: "var(--amber-light)",
    iconColor: "var(--amber)",
    titleEn: "Low Attendance Alert",
    titleBn: "কম উপস্থিতি সতর্কতা",
    descEn: "Class 8-B attendance dropped below 70% today",
    descBn: "শ্রেণি ৮-খ এর উপস্থিতি আজ ৭০% এর নিচে নেমেছে",
    time: "4 hours ago", timeBn: "৪ ঘণ্টা আগে", unread: false,
  },
]

const demoMessages = [
  {
    id: 1,
    name: "Rahima Khatun", nameBn: "রহিমা খাতুন",
    role: "Parent", roleBn: "অভিভাবক",
    avatar: "RK", avatarBg: "linear-gradient(135deg, var(--teal), var(--brand))",
    lastMsg: "My son Rashid is feeling unwell. Can he leave early today?",
    lastMsgBn: "আমার ছেলে রশিদ অসুস্থ বোধ করছে। সে আজ তাড়াতাড়ি যেতে পারবে?",
    time: "10 min ago", timeBn: "১০ মিনিট আগে", unread: 2,
  },
  {
    id: 2,
    name: "Dr. Rafiqul Islam", nameBn: "ড. রফিকুল ইসলাম",
    role: "Teacher", roleBn: "শিক্ষক",
    avatar: "RI", avatarBg: "linear-gradient(135deg, var(--brand), var(--purple))",
    lastMsg: "Science lab equipment list for next week is ready.",
    lastMsgBn: "পরবর্তী সপ্তাহের বিজ্ঞান ল্যাব সরঞ্জাম তালিকা প্রস্তুত।",
    time: "30 min ago", timeBn: "৩০ মিনিট আগে", unread: 0,
  },
  {
    id: 3,
    name: "Admin Office", nameBn: "প্রশাসনিক অফিস",
    role: "System", roleBn: "সিস্টেম",
    avatar: "AO", avatarBg: "linear-gradient(135deg, var(--amber), var(--red))",
    lastMsg: "Monthly report for May 2026 is now available.",
    lastMsgBn: "মে ২০২৬ এর মাসিক রিপোর্ট এখন উপলব্ধ।",
    time: "1 hour ago", timeBn: "১ ঘণ্টা আগে", unread: 1,
  },
  {
    id: 4,
    name: "Prof. Salma Khatun", nameBn: "প্রো. সালমা খাতুন",
    role: "Teacher", roleBn: "শিক্ষক",
    avatar: "SK", avatarBg: "linear-gradient(135deg, var(--green), var(--teal))",
    lastMsg: "Homework submission status for Class 9-A is updated.",
    lastMsgBn: "শ্রেণি ৯-ক এর বাড়ির কাজ জমা স্ট্যাটাস আপডেট করা হয়েছে।",
    time: "2 hours ago", timeBn: "২ ঘণ্টা আগে", unread: 0,
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
    { value: "light",  labelKey: "theme_light",  icon: <Sun size={14} /> },
    { value: "dark",   labelKey: "theme_dark",   icon: <Moon size={14} /> },
    { value: "system", labelKey: "theme_system", icon: <Monitor size={14} /> },
  ]
  const langOptions: { value: Language; labelKey: TranslationKey }[] = [
    { value: "bn", labelKey: "lang_bn" },
    { value: "en", labelKey: "lang_en" },
  ]
  const isBn = language === "bn"
  const unreadNotifs = demoNotifications.filter(n => n.unread).length
  const unreadMsgs = demoMessages.reduce((sum, m) => sum + m.unread, 0)

  const iconBtn: React.CSSProperties = {
    width: "34px", height: "34px", borderRadius: "9px",
    background: "var(--bg-secondary)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "var(--text-secondary)", position: "relative",
    flexShrink: 0,
  }
  const panelStyle: React.CSSProperties = {
    position: "absolute", top: "42px", right: 0,
    background: "var(--bg-primary)", border: "1px solid var(--border)",
    borderRadius: "14px", zIndex: 300,
    width: isMobile ? "calc(100vw - 20px)" : "360px",
    maxHeight: "420px", overflow: "hidden",
    boxShadow: "var(--shadow-lg)",
  }
  const panelHeader: React.CSSProperties = {
    padding: "14px 16px", borderBottom: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }
  const panelItem: React.CSSProperties = {
    padding: "12px 16px", display: "flex", gap: "10px",
    borderBottom: "1px solid var(--border)", cursor: "pointer",
    transition: "background 0.15s",
  }
  const profileDd: React.CSSProperties = {
    position: "absolute", top: "48px", right: 0,
    background: "var(--bg-primary)", border: "1px solid var(--border)",
    borderRadius: "14px", zIndex: 300, width: "260px",
    boxShadow: "var(--shadow-lg)", overflow: "hidden",
  }
  const profileItem: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "9px 14px", cursor: "pointer", fontSize: "13px",
    color: "var(--text-secondary)", transition: "all 0.15s",
  }

  return (
    <header style={{
      height: isMobile ? "52px" : "58px",
      background: "var(--bg-primary)",
      borderBottom: "1px solid var(--border)",
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
          flex: 1, maxWidth: "340px",
          display: "flex", alignItems: "center", gap: "8px",
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "7px 12px", cursor: "text", minWidth: 0,
        }}>
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>
            {t("search_placeholder", language)}
          </span>
          <kbd style={{
            fontSize: "10px", background: "var(--bg-tertiary)",
            border: "1px solid var(--border)", padding: "2px 6px",
            borderRadius: "5px", color: "var(--text-muted)", fontFamily: "monospace",
          }}>⌘K</kbd>
        </div>
      )}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: isMobile ? "4px" : "6px", flexShrink: 0 }}>

        {/* Notification */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button style={iconBtn} onClick={() => { setNotifOpen(!notifOpen); setMsgOpen(false); setProfileOpen(false) }}>
            <Bell size={16} />
            {unreadNotifs > 0 && (
              <div style={{
                position: "absolute", top: "5px", right: "5px",
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
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {isBn ? "নোটিফিকেশন" : "Notifications"}
                </span>
                <span style={{ fontSize: "11px", color: "var(--brand)", cursor: "pointer", fontWeight: 500 }}>
                  {isBn ? "সব পড়ুন" : "Mark all read"}
                </span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "370px" }}>
                {demoNotifications.map(n => (
                  <div key={n.id} style={{
                    ...panelItem,
                    background: n.unread ? "var(--brand-light)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!n.unread) e.currentTarget.style.background = "var(--bg-secondary)" }}
                  onMouseLeave={e => { if (!n.unread) e.currentTarget.style.background = "transparent" }}
                  >
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "8px",
                      background: n.iconBg, display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0, color: n.iconColor,
                    }}>{n.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                        {isBn ? n.titleBn : n.titleEn}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "3px" }}>
                        {isBn ? n.descBn : n.descEn}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} />
                        {isBn ? n.timeBn : n.time}
                      </div>
                    </div>
                    {n.unread && (
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--brand)", flexShrink: 0, marginTop: "4px" }} />
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
            <MessageSquare size={16} />
            {unreadMsgs > 0 && (
              <div style={{
                position: "absolute", top: "5px", right: "5px",
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
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {isBn ? "বার্তা" : "Messages"}
                </span>
                <span style={{ fontSize: "11px", color: "var(--brand)", cursor: "pointer", fontWeight: 500 }}>
                  {isBn ? "সব দেখুন" : "View all"}
                </span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: "370px" }}>
                {demoMessages.map(m => (
                  <div key={m.id} style={panelItem}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px",
                      background: m.avatarBg, display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0,
                      fontSize: "11px", fontWeight: 700, color: "#fff",
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
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>
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
                        minWidth: "18px", height: "18px", borderRadius: "9px",
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

        {!isMobile && <div style={{ width: "1px", height: "22px", background: "var(--border)", margin: "0 2px" }} />}

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <div
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setMsgOpen(false) }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: isMobile ? "4px" : "4px 8px 4px 4px",
              borderRadius: "10px",
              border: "1px solid var(--border)", background: "var(--bg-secondary)", cursor: "pointer",
            }}
          >
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
            <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
          </div>

          {profileOpen && (
            <div style={profileDd}>
              {/* Profile header */}
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "12px",
                  background: "linear-gradient(135deg, var(--brand), var(--purple))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "15px", fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>SA</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>School Admin</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>admin@sunriseacademy.edu</div>
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ padding: "6px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", padding: "4px 10px 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {isBn ? "দ্রুত অ্যাক্সেস" : "Quick Access"}
                </div>
                {[
                  { icon: <LayoutDashboard size={15} />, labelEn: "Dashboard", labelBn: "ড্যাশবোর্ড", path: "/dashboard" },
                  { icon: <Users size={15} />, labelEn: "Students", labelBn: "ছাত্র", path: "/students" },
                  { icon: <ClipboardCheck size={15} />, labelEn: "Attendance", labelBn: "উপস্থিতি", path: "/attendance" },
                  { icon: <Wallet size={15} />, labelEn: "Payroll", labelBn: "বেতন", path: "/payroll" },
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
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", padding: "4px 10px 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {isBn ? "ভাষা" : "Language"}
                </div>
                <div style={{ display: "flex", padding: "2px 10px", gap: "6px" }}>
                  {langOptions.map(opt => (
                    <div key={opt.value}
                      onClick={() => setLanguage(opt.value)}
                      style={{
                        flex: 1, padding: "7px", borderRadius: "8px", cursor: "pointer",
                        fontSize: "12px", fontWeight: language === opt.value ? 600 : 400,
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
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", padding: "4px 10px 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {isBn ? "থিম" : "Theme"}
                </div>
                <div style={{ display: "flex", padding: "2px 10px", gap: "6px" }}>
                  {themeOptions.map(opt => (
                    <div key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      style={{
                        flex: 1, padding: "7px", borderRadius: "8px", cursor: "pointer",
                        fontSize: "12px", fontWeight: theme === opt.value ? 600 : 400,
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
                  { icon: <Settings size={15} />, labelEn: "Settings", labelBn: "সেটিংস", path: "/settings" },
                  { icon: <HelpCircle size={15} />, labelEn: "Help & Support", labelBn: "সাহায্য ও সাপোর্ট", path: "/help" },
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
                <div style={{ ...profileItem, color: "var(--red)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--red-light)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={15} />
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
