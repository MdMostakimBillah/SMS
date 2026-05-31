import { NavLink, useLocation } from "react-router-dom"
import {
  GraduationCap, LayoutDashboard, Users, Building2, Briefcase,
  CalendarCheck, ClipboardList, BookOpen, FileText, Video,
  Landmark, Wallet, ShoppingBag, Receipt, Library, Bus,
  MessageCircle, Megaphone, Bell, Home, User,
  BarChart2, FileBarChart, Crown, Settings, ChevronsUpDown, type LucideIcon,
} from "lucide-react"
import { useAppStore } from "@/store/appStore"
import { useAdmissionStore } from "@/store/admissionStore"
import { useTeacherStore } from "@/store/teacherStore"
import { t } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"

const iconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "users": Users,
  "graduation-cap": GraduationCap,
  "school": Building2,
  "briefcase": Briefcase,
  "calendar-check": CalendarCheck,
  "clipboard-list": ClipboardList,
  "book-open": BookOpen,
  "file-text": FileText,
  "video": Video,
  "landmark": Landmark,
  "wallet": Wallet,
  "shopping-bag": ShoppingBag,
  "receipt": Receipt,
  "library": Library,
  "bus": Bus,
  "building-2": Building2,
  "message-circle": MessageCircle,
  "megaphone": Megaphone,
  "bell": Bell,
  "home": Home,
  "user": User,
  "bar-chart-2": BarChart2,
  "file-bar-chart": FileBarChart,
  "crown": Crown,
  "settings": Settings,
}

export default function Sidebar() {
  const { language } = useAppStore()
  const { students } = useAdmissionStore()
  const { teachers } = useTeacherStore()
  const location = useLocation()

  const studentCount = students.length
  const pendingCount = students.filter(s => s.status === 'pending').length
  const teacherCount = teachers.length
  const activeTeacherCount = teachers.filter(t => t.status === 'active').length

  const navGroups = [
    {
      key: "grp_main",
      items: [
        { key: "nav_dashboard", page: "/dashboard", icon: "layout-dashboard" },
      ],
    },
    {
      key: "grp_manage",
      items: [
        { key: "nav_students",  page: "/students",  icon: "users",            badge: String(studentCount), badgeColor: "blue" as const },
        { key: "nav_teachers",  page: "/teachers",  icon: "graduation-cap",   badge: String(teacherCount), badgeColor: "blue" as const },
        { key: "nav_classes",   page: "/classes",   icon: "school" },
        { key: "nav_hr",        page: "/hr",        icon: "briefcase",        badge: String(activeTeacherCount), badgeColor: "blue" as const },
      ],
    },
    {
      key: "grp_academic",
      items: [
        { key: "nav_attendance",  page: "/attendance",  icon: "calendar-check" },
        { key: "nav_exams",       page: "/exams",       icon: "clipboard-list" },
        { key: "nav_syllabus",    page: "/syllabus",    icon: "book-open" },
        { key: "nav_assignments", page: "/assignments", icon: "file-text" },
        { key: "nav_online",      page: "/online",      icon: "video" },
      ],
    },
    {
      key: "grp_finance",
      items: [
        { key: "nav_finance",  page: "/finance",  icon: "landmark" },
        { key: "nav_payroll",  page: "/payroll",  icon: "wallet" },
        { key: "nav_store",    page: "/store",    icon: "shopping-bag" },
        { key: "nav_expenses", page: "/expenses", icon: "receipt" },
      ],
    },
    {
      key: "grp_facility",
      items: [
        { key: "nav_library",   page: "/library",   icon: "library" },
        { key: "nav_transport", page: "/transport", icon: "bus" },
        { key: "nav_hostel",    page: "/hostel",    icon: "building-2" },
      ],
    },
    {
      key: "grp_comm",
      items: [
        { key: "nav_messages",      page: "/messages",      icon: "message-circle", badge: String(pendingCount), badgeColor: "red" as const },
        { key: "nav_notice",        page: "/notice",        icon: "megaphone" },
        { key: "nav_notifications", page: "/notifications", icon: "bell" },
      ],
    },
    {
      key: "grp_portal",
      items: [
        { key: "nav_parent",         page: "/parent-portal",  icon: "home" },
        { key: "nav_student_portal", page: "/student-portal", icon: "user" },
      ],
    },
    {
      key: "grp_report",
      items: [
        { key: "nav_analytics", page: "/analytics", icon: "bar-chart-2" },
        { key: "nav_reports",   page: "/reports",   icon: "file-bar-chart" },
      ],
    },
    {
      key: "grp_system",
      items: [
        { key: "nav_superadmin", page: "/super-admin", icon: "crown" },
        { key: "nav_settings",   page: "/settings",    icon: "settings" },
      ],
    },
  ]

  return (
    <aside style={{
      width: "220px",
      height: "100%",
      background: "var(--glass)",
      backdropFilter: "blur(16px) saturate(180%)",
      WebkitBackdropFilter: "blur(16px) saturate(180%)",
      borderRight: "1px solid var(--glass-border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        padding: "16px 14px 14px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "14px",
        }}>
          <div style={{
            width: "32px", height: "32px",
            borderRadius: "8px",
            background: "var(--brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <GraduationCap size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1 }}>
              EduTech
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
              School Management
            </div>
          </div>
        </div>

        {/* Tenant */}
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid var(--border)",
        }}>
          <div style={{
            width: "26px", height: "26px",
            borderRadius: "6px",
            background: "var(--teal)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: 600, color: "#fff",
            flexShrink: 0,
          }}>
            SA
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: "11px", fontWeight: 500,
              color: "var(--text-primary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              Sunrise Academy
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
              {t("academic_year", language)}
            </div>
          </div>
          <ChevronsUpDown size={11} style={{ color: "var(--text-muted)", marginLeft: "auto", flexShrink: 0 }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {navGroups.map((group) => (
          <div key={group.key} style={{ marginBottom: "16px" }}>
            <div style={{
              fontSize: "9px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              padding: "0 8px",
              marginBottom: "4px",
            }}>
              {t(group.key as TranslationKey, language)}
            </div>

            {group.items.map((item) => {
              const isActive = location.pathname === item.page ||
                location.pathname.startsWith(item.page + "/")
              const IconComp = iconMap[item.icon] || LayoutDashboard
              return (
                <NavLink
                  key={item.page}
                  to={item.page}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    marginBottom: "2px",
                    fontSize: "12px",
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                    background: isActive ? "var(--brand-light)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--bg-secondary)"
                      e.currentTarget.style.color = "var(--text-primary)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "var(--text-secondary)"
                    }
                  }}
                >
                  <IconComp
                    size={15}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "var(--brand)" : "var(--text-muted)",
                    }}
                  />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t(item.key as TranslationKey, language)}
                  </span>
                  {item.badge && (
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: "8px",
                      background: item.badgeColor === "red" ? "var(--red-light)" : "var(--brand-light)",
                      color: item.badgeColor === "red" ? "var(--red)" : "var(--brand)",
                      flexShrink: 0,
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "10px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          background: "var(--brand-light)",
          borderRadius: "10px",
          padding: "12px",
          border: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>
              Enterprise Plan
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 600,
              color: "var(--green)",
              background: "var(--green-light)",
              padding: "2px 6px",
              borderRadius: "6px",
            }}>
              Active
            </span>
          </div>
          <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px" }}>
            <div style={{
              height: "100%", width: "67%",
              background: "var(--brand)",
              borderRadius: "2px",
            }} />
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "5px" }}>
            67% storage used
          </div>
        </div>
      </div>
    </aside>
  )
}
