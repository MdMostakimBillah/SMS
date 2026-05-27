import { NavLink, useLocation } from "react-router-dom"
import { Icon } from "@iconify/react"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"

const navGroups = [
  {
    key: "grp_main",
    items: [
      { key: "nav_dashboard", page: "/dashboard", icon: "lucide:layout-dashboard" },
    ],
  },
  {
    key: "grp_manage",
    items: [
      { key: "nav_students", page: "/students", icon: "lucide:users", badge: "1248", badgeColor: "blue" },
      { key: "nav_teachers", page: "/teachers", icon: "lucide:chalkboard" },
      { key: "nav_classes",  page: "/classes",  icon: "lucide:school" },
      { key: "nav_hr",       page: "/hr",       icon: "lucide:badge" },
    ],
  },
  {
    key: "grp_academic",
    items: [
      { key: "nav_attendance",  page: "/attendance",  icon: "lucide:calendar-check", badge: "3", badgeColor: "red" },
      { key: "nav_exams",       page: "/exams",       icon: "lucide:clipboard-list" },
      { key: "nav_syllabus",    page: "/syllabus",    icon: "lucide:book-open" },
      { key: "nav_assignments", page: "/assignments", icon: "lucide:file-text" },
      { key: "nav_online",      page: "/online",      icon: "lucide:video" },
    ],
  },
  {
    key: "grp_finance",
    items: [
      { key: "nav_finance",  page: "/finance",  icon: "lucide:landmark" },
      { key: "nav_payroll",  page: "/payroll",  icon: "lucide:wallet" },
      { key: "nav_store",    page: "/store",    icon: "lucide:shopping-cart" },
      { key: "nav_expenses", page: "/expenses", icon: "lucide:receipt" },
    ],
  },
  {
    key: "grp_facility",
    items: [
      { key: "nav_library",   page: "/library",   icon: "lucide:library" },
      { key: "nav_transport", page: "/transport", icon: "lucide:bus" },
      { key: "nav_hostel",    page: "/hostel",    icon: "lucide:building-2" },
    ],
  },
  {
    key: "grp_comm",
    items: [
      { key: "nav_messages",      page: "/messages",      icon: "lucide:message-circle", badge: "5", badgeColor: "red" },
      { key: "nav_notice",        page: "/notice",        icon: "lucide:megaphone" },
      { key: "nav_notifications", page: "/notifications", icon: "lucide:bell" },
    ],
  },
  {
    key: "grp_portal",
    items: [
      { key: "nav_parent",         page: "/parent-portal",  icon: "lucide:home" },
      { key: "nav_student_portal", page: "/student-portal", icon: "lucide:user" },
    ],
  },
  {
    key: "grp_report",
    items: [
      { key: "nav_analytics", page: "/analytics", icon: "lucide:bar-chart-2" },
      { key: "nav_reports",   page: "/reports",   icon: "lucide:file-bar-chart" },
    ],
  },
  {
    key: "grp_system",
    items: [
      { key: "nav_superadmin", page: "/super-admin", icon: "lucide:crown" },
      { key: "nav_settings",   page: "/settings",    icon: "lucide:settings" },
    ],
  },
]

export default function Sidebar() {
  const { language } = useAppStore()
  const location = useLocation()

  return (
    <aside
      style={{
        width: "220px",
        height: "100%",
        background: "var(--bg-primary)",
        borderRight: "0.5px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "14px 12px 10px",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ET
          </div>
          <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>
            EduTech
          </span>
        </div>

        {/* Tenant */}
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "8px",
            padding: "7px 9px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--teal)",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
              Sunrise Academy
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {t("academic_year", language)}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {navGroups.map((group) => (
          <div key={group.key} style={{ marginBottom: "14px" }}>

            {/* Group label */}
            <div
              style={{
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.7px",
                padding: "0 6px",
                marginBottom: "3px",
              }}
            >
              {t(group.key as TranslationKey, language)}
            </div>

            {/* Nav items */}
            {group.items.map((item) => {
              const isActive = location.pathname === item.page
              return (
                <NavLink
                  key={item.page}
                  to={item.page}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 8px",
                    borderRadius: "8px",
                    marginBottom: "1px",
                    fontSize: "13px",
                    textDecoration: "none",
                    transition: "all 0.12s",
                    background: isActive ? "var(--brand-light)" : "transparent",
                    color: isActive ? "var(--brand)" : "var(--text-secondary)",
                    border: isActive
                      ? "0.5px solid var(--brand)"
                      : "0.5px solid transparent",
                  }}
                >
                  {/* Icon */}
                  <Icon
                    icon={item.icon}
                    width={16}
                    height={16}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "var(--brand)" : "var(--text-muted)",
                    }}
                  />

                  {/* Label */}
                  <span
                    style={{
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t(item.key as TranslationKey, language)}
                  </span>

                  {/* Badge */}
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 500,
                        padding: "1px 6px",
                        borderRadius: "10px",
                        background:
                          item.badgeColor === "red"
                            ? "var(--red-light)"
                            : "var(--brand-light)",
                        color:
                          item.badgeColor === "red"
                            ? "var(--red)"
                            : "var(--brand)",
                        flexShrink: 0,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom — plan info */}
      <div style={{ padding: "10px 8px", borderTop: "0.5px solid var(--border)" }}>
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "10px",
            padding: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
              {t("enterprise_plan", language)}
            </span>
            <span style={{ fontSize: "11px", color: "var(--teal)" }}>
              {t("plan_active", language)}
            </span>
          </div>
          <div
            style={{
              height: "3px",
              background: "var(--border-2)",
              borderRadius: "2px",
              margin: "7px 0 4px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "67%",
                background: "var(--brand)",
                borderRadius: "2px",
              }}
            />
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {t("storage_used", language)}
          </div>
        </div>
      </div>
    </aside>
  )
}
