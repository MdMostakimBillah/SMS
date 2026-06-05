import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useWindowSize } from '@/hooks/useWindowSize'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  FileText,
  Video,
  Landmark,
  Wallet,
  ShoppingBag,
  Receipt,
  Library,
  Bus,
  MessageCircle,
  Megaphone,
  Bell,
  Home,
  User,
  BarChart2,
  FileBarChart,
  Crown,
  Settings,
  ChevronsUpDown,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { t } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  users: Users,
  'graduation-cap': GraduationCap,
  school: Building2,
  briefcase: Briefcase,
  'calendar-check': CalendarCheck,
  'clipboard-list': ClipboardList,
  'book-open': BookOpen,
  'file-text': FileText,
  video: Video,
  landmark: Landmark,
  wallet: Wallet,
  'shopping-bag': ShoppingBag,
  receipt: Receipt,
  library: Library,
  bus: Bus,
  'building-2': Building2,
  'message-circle': MessageCircle,
  megaphone: Megaphone,
  bell: Bell,
  home: Home,
  user: User,
  'bar-chart-2': BarChart2,
  'file-bar-chart': FileBarChart,
  crown: Crown,
  settings: Settings,
}

export default function Sidebar() {
  const { language } = useAppStore()
  const isBn = language === 'bn'
  const { width: screenWidth } = useWindowSize()
  const isLargeScreen = screenWidth >= 1600
  const isXLargeScreen = screenWidth >= 1920
  const students = useSessionStudents()
  const { teachers } = useTeacherStore()
  const location = useLocation()
  const { institution, switchSession, addSession } = useClassStore()
  const [showSessionDropdown, setShowSessionDropdown] = useState(false)
  const [newSession, setNewSession] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const studentCount = students.length
  const pendingCount = students.filter((s) => s.status === 'pending').length
  const teacherCount = teachers.length
  const activeTeacherCount = teachers.filter((t) => t.status === 'active').length

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSessionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwitchSession = (session: string) => {
    switchSession(session)
    setShowSessionDropdown(false)
  }

  const handleAddSession = () => {
    const trimmed = newSession.trim()
    if (!trimmed || institution.sessions.includes(trimmed)) return
    addSession(trimmed)
    switchSession(trimmed)
    setNewSession('')
    setShowSessionDropdown(false)
  }

  const navGroups = [
    {
      key: 'grp_main',
      items: [{ key: 'nav_dashboard', page: '/dashboard', icon: 'layout-dashboard' }],
    },
    {
      key: 'grp_manage',
      items: [
        {
          key: 'nav_students',
          page: '/students',
          icon: 'users',
          badge: String(studentCount),
          badgeColor: 'blue' as const,
        },
        {
          key: 'nav_teachers',
          page: '/teachers',
          icon: 'graduation-cap',
          badge: String(teacherCount),
          badgeColor: 'blue' as const,
        },
        { key: 'nav_classes', page: '/classes', icon: 'school' },
        {
          key: 'nav_hr',
          page: '/hr',
          icon: 'briefcase',
          badge: String(activeTeacherCount),
          badgeColor: 'blue' as const,
        },
      ],
    },
    {
      key: 'grp_academic',
      items: [
        { key: 'nav_attendance', page: '/attendance', icon: 'calendar-check' },
        { key: 'nav_exams', page: '/exams', icon: 'clipboard-list' },
        { key: 'nav_syllabus', page: '/syllabus', icon: 'book-open' },
        { key: 'nav_assignments', page: '/assignments', icon: 'file-text' },
        { key: 'nav_online', page: '/online', icon: 'video' },
      ],
    },
    {
      key: 'grp_finance',
      items: [
        { key: 'nav_finance', page: '/finance', icon: 'landmark' },
        { key: 'nav_payroll', page: '/payroll', icon: 'wallet' },
        { key: 'nav_store', page: '/store', icon: 'shopping-bag' },
        { key: 'nav_expenses', page: '/expenses', icon: 'receipt' },
      ],
    },
    {
      key: 'grp_facility',
      items: [
        { key: 'nav_library', page: '/library', icon: 'library' },
        { key: 'nav_transport', page: '/transport', icon: 'bus' },
        { key: 'nav_hostel', page: '/hostel', icon: 'building-2' },
      ],
    },
    {
      key: 'grp_comm',
      items: [
        {
          key: 'nav_messages',
          page: '/messages',
          icon: 'message-circle',
          badge: String(pendingCount),
          badgeColor: 'red' as const,
        },
        { key: 'nav_notice', page: '/notice', icon: 'megaphone' },
        { key: 'nav_notifications', page: '/notifications', icon: 'bell' },
      ],
    },
    {
      key: 'grp_portal',
      items: [
        { key: 'nav_parent', page: '/parent-portal', icon: 'home' },
        { key: 'nav_student_portal', page: '/student-portal', icon: 'user' },
      ],
    },
    {
      key: 'grp_report',
      items: [
        { key: 'nav_analytics', page: '/analytics', icon: 'bar-chart-2' },
        { key: 'nav_reports', page: '/reports', icon: 'file-bar-chart' },
      ],
    },
    {
      key: 'grp_system',
      items: [
        { key: 'nav_superadmin', page: '/super-admin', icon: 'crown' },
        { key: 'nav_settings', page: '/settings', icon: 'settings' },
      ],
    },
  ]

  return (
    <aside
      style={{
        width: isXLargeScreen ? '17.5rem' : isLargeScreen ? '16rem' : '13.75rem',
        height: '100%',
        background: 'var(--glass)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '16px 14px 14px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '0.875rem',
          }}
        >
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GraduationCap size={17} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              EduTech
            </div>
            <div
              style={{
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                marginTop: '0.125rem',
              }}
            >
              School Management
            </div>
          </div>
        </div>

        {/* Tenant / Session Switcher */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowSessionDropdown(!showSessionDropdown)}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.borderColor = 'var(--brand)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <div
              style={{
                width: '1.625rem',
                height: '1.625rem',
                borderRadius: '0.375rem',
                background: 'var(--teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.5625rem',
                fontWeight: 600,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              SA
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Sunrise Academy
              </div>
              <div style={{ fontSize: '0.5625rem', color: 'var(--brand)', fontWeight: 600 }}>
                {institution.currentSession || 'No Session'}
              </div>
            </div>
            <ChevronsUpDown
              size={11}
              style={{
                color: 'var(--text-muted)',
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: showSessionDropdown ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </div>

          {showSessionDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.25rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.625rem',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.5625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.375rem' }}>
                  {t('academic_year', language)}
                </div>
                {institution.sessions.map((s) => (
                  <div
                    key={s}
                    onClick={() => handleSwitchSession(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '6px 8px',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.6875rem',
                      fontWeight: s === institution.currentSession ? 600 : 400,
                      color: s === institution.currentSession ? 'var(--brand)' : 'var(--text-primary)',
                      background: s === institution.currentSession ? 'var(--brand-light)' : 'transparent',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      if (s !== institution.currentSession) e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      if (s !== institution.currentSession) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span style={{ flex: 1 }}>{s}</span>
                    {s === institution.currentSession && <Check size={12} style={{ color: 'var(--brand)' }} />}
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: '0.5625rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {isBn ? 'নতুন সেশন' : 'New Session'}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <input
                    value={newSession}
                    onChange={(e) => setNewSession(e.target.value)}
                    placeholder="e.g. 2026-27"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      fontSize: '0.6875rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAddSession}
                    disabled={!newSession.trim() || institution.sessions.includes(newSession.trim())}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: 'var(--brand)',
                      color: '#fff',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: !newSession.trim() || institution.sessions.includes(newSession.trim()) ? 0.5 : 1,
                    }}
                  >
                    {isBn ? 'যোগ' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {navGroups.map((group) => (
          <div key={group.key} style={{ marginBottom: '1rem' }}>
            <div
              style={{
                fontSize: '0.5625rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05rem',
                padding: '0 8px',
                marginBottom: '0.25rem',
              }}
            >
              {t(group.key as TranslationKey, language)}
            </div>

            {group.items.map((item) => {
              const isActive = location.pathname === item.page || location.pathname.startsWith(item.page + '/')
              const IconComp = iconMap[item.icon] || LayoutDashboard
              return (
                <NavLink
                  key={item.page}
                  to={item.page}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '8px 10px',
                    borderRadius: '0.5rem',
                    marginBottom: '0.125rem',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    background: isActive ? 'var(--brand-light)' : 'transparent',
                    color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <IconComp
                    size={15}
                    style={{
                      flexShrink: 0,
                      color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t(item.key as TranslationKey, language)}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.5625rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '0.5rem',
                        background: item.badgeColor === 'red' ? 'var(--red-light)' : 'var(--brand-light)',
                        color: item.badgeColor === 'red' ? 'var(--red)' : 'var(--brand)',
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

      {/* Bottom */}
      <div style={{ padding: '0.625rem', borderTop: '1px solid var(--border)' }}>
        <div
          style={{
            background: 'var(--brand-light)',
            borderRadius: '0.625rem',
            padding: '0.75rem',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Enterprise Plan
            </span>
            <span
              style={{
                fontSize: '0.5625rem',
                fontWeight: 600,
                color: 'var(--green)',
                background: 'var(--green-light)',
                padding: '2px 6px',
                borderRadius: '0.375rem',
              }}
            >
              Active
            </span>
          </div>
          <div
            style={{
              height: '0.1875rem',
              background: 'var(--border)',
              borderRadius: '0.125rem',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '67%',
                background: 'var(--brand)',
                borderRadius: '0.125rem',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '0.625rem',
              color: 'var(--text-muted)',
              marginTop: '0.3125rem',
            }}
          >
            67% storage used
          </div>
        </div>
      </div>
    </aside>
  )
}
