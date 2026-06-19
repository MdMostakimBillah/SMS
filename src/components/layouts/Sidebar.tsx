import { useState, useRef, useEffect, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
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
  X,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAppStore } from '@/store/appStore'
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

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const isBn = useBn()
  const { language, toggleSidebar, trackVisit, pageVisits, bookmarks, toggleBookmark, sidebarOrder, setSidebarOrder } = useAppStore()
  const { isMobile, width } = useWindowSize()
  const location = useLocation()
  const { institution, switchSession, addSession } = useClassStore()
  const [showSessionDropdown, setShowSessionDropdown] = useState(false)
  const [newSession, setNewSession] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLElement>(null)
  const [hoveredItem, setHoveredItem] = useState<{ label: string; rect: DOMRect } | null>(null)

  // Responsive collapsed width and icon size
  const collapsedWidth = width >= 1280 ? '4.25rem' : width >= 1024 ? '3.75rem' : '3.25rem'
  const expandedWidth = '13.75rem'
  const navIconSize = collapsed ? (width >= 1280 ? 19 : width >= 1024 ? 17 : 16) : 15

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSessionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (asideRef.current) {
      gsap.to(asideRef.current, {
        width: collapsed ? collapsedWidth : expandedWidth,
        duration: 0.25,
        ease: 'power3.out',
      })
    }
  }, [collapsed, collapsedWidth])

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
        { key: 'nav_classes', page: '/classes', icon: 'school' },
        { key: 'nav_teachers', page: '/teachers', icon: 'graduation-cap' },
        { key: 'nav_students', page: '/students', icon: 'users' },
        { key: 'nav_hr', page: '/hr', icon: 'briefcase' },
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
        { key: 'nav_messages', page: '/messages', icon: 'message-circle' },
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

  // Apply custom sidebar order
  type NavItem = { key: string; page: string }
  const orderedNavGroups = useMemo(() => {
    if (sidebarOrder.length === 0) return navGroups

    const orderMap = new Map(sidebarOrder.map((item, idx) => [item.page, idx]))

    return navGroups.map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        const aIdx = orderMap.get(a.page) ?? 999
        const bIdx = orderMap.get(b.page) ?? 999
        return aIdx - bIdx
      }),
    }))
  }, [navGroups, sidebarOrder])

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, page: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', page)
    setDraggedItem(page)
  }

  const handleDragOver = (e: React.DragEvent, page: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(page)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetPage: string) => {
    e.preventDefault()
    const sourcePage = e.dataTransfer.getData('text/plain')
    if (!sourcePage || sourcePage === targetPage) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    // Build flat list of all items in current order
    const allItems: NavItem[] = []
    orderedNavGroups.forEach((g) =>
      g.items.forEach((item) => allItems.push({ key: item.key, page: item.page }))
    )

    const srcIdx = allItems.findIndex((i) => i.page === sourcePage)
    const tgtIdx = allItems.findIndex((i) => i.page === targetPage)
    if (srcIdx === -1 || tgtIdx === -1) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const [moved] = allItems.splice(srcIdx, 1)
    allItems.splice(tgtIdx, 0, moved)

    setSidebarOrder(allItems)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Flat map for looking up nav item info by path
  const navItemsMap = useMemo(() => {
    const map: Record<string, { label: string; icon: string }> = {}
    navGroups.forEach((g) =>
      g.items.forEach((item) => {
        map[item.page] = { label: t(item.key as TranslationKey, language), icon: item.icon }
      })
    )
    return map
  }, [navGroups, isBn])

  // Use refs to avoid infinite loop from trackVisit
  const trackVisitRef = useRef(trackVisit)
  trackVisitRef.current = trackVisit
  const lastTrackedPath = useRef('')

  // Track page visits
  useEffect(() => {
    const base = '/' + (location.pathname.split('/')[1] || '')
    if (base === lastTrackedPath.current) return
    lastTrackedPath.current = base
    const info = navItemsMap[base]
    if (info) {
      trackVisitRef.current(base, info.label, info.icon)
    }
  }, [location.pathname, navItemsMap])

  // Only manually bookmarked pages (max 6)
  const quickAccess = useMemo(() => {
    return pageVisits.filter((v) => bookmarks.includes(v.path)).slice(0, 5)
  }, [pageVisits, bookmarks])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHoveredItem(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    setHoveredItem(null)
  }, [location.pathname])

  return (
    <>
      <aside
        ref={asideRef}
        className="h-full flex flex-col overflow-hidden shrink-0"
        style={{
          width: collapsed ? collapsedWidth : expandedWidth,
          background: 'var(--glass)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          borderRight: '1px solid var(--glass-border)',
        }}
      >
        {/* Logo */}
        <div
          className={`flex items-center border-b border-[var(--border)] ${
            collapsed ? 'flex-col px-0 py-3' : 'flex-row px-3.5 py-3'
          }`}
        >
          <div
            className={`flex items-center gap-2.5 ${
              collapsed ? 'w-full justify-center' : 'flex-1'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center shrink-0">
              <GraduationCap size={17} color="#fff" />
            </div>
            {!collapsed && (
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)] leading-none">{institution.brandName || 'EduTech'}</div>
                <div className="text-[0.5625rem] text-[var(--text-muted)] mt-0.5">School Management</div>
              </div>
            )}
          </div>
          {isMobile && !collapsed && (
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Session Switcher */}
        {!collapsed && (
          <div ref={dropdownRef} className="relative px-2 pt-2 pb-1 z-50">
            <div
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-150 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--surface-2)] hover:border-[var(--brand)]"
            >
              {institution.logo ? (
                <img src={institution.logo} alt="Logo" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[var(--teal)] flex items-center justify-center text-[0.625rem] font-bold text-white shrink-0">
                  {(institution.name || 'SA').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">
                  {institution.name || 'Institution'}
                </div>
                <div className="text-[0.5625rem] text-[var(--brand)] font-semibold">
                  {institution.currentSession || 'No Session'}
                </div>
              </div>
              <ChevronsUpDown
                size={11}
                className="text-[var(--text-muted)] shrink-0 transition-transform duration-200"
                style={{ transform: showSessionDropdown ? 'rotate(180deg)' : 'rotate(0)' }}
              />
            </div>

            {showSessionDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-[0.625rem] shadow-lg z-[60] overflow-hidden mx-2">
                <div className="px-2.5 py-2 border-b border-[var(--border)]">
                  <div className="text-[0.5625rem] font-semibold text-[var(--text-muted)] mb-1.5">
                    {isBn ? 'সেশন পরিবর্তন' : 'Switch Session'}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {institution.sessions.map((s) => (
                      <div
                        key={s}
                        onClick={() => handleSwitchSession(s)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[0.375rem] cursor-pointer text-[0.6875rem] ${
                          s === institution.currentSession
                            ? 'bg-[var(--brand-light)] text-[var(--brand)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {s}
                        {s === institution.currentSession && <Check size={12} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-2.5 py-2">
                  <div className="text-[0.5625rem] font-semibold text-[var(--text-muted)] mb-1.5">
                    {isBn ? 'নতুন সেশন' : 'New Session'}
                  </div>
                  <div className="flex gap-1 items-stretch">
                    <input
                      value={newSession}
                      onChange={(e) => setNewSession(e.target.value)}
                      placeholder="e.g. 2026-27"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
                      className="flex-1 min-w-0 px-2 py-1 rounded-l-[0.375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] outline-none"
                    />
                    <button
                      onClick={handleAddSession}
                      disabled={!newSession.trim() || institution.sessions.includes(newSession.trim())}
                      className="shrink-0 px-2.5 py-1 rounded-r-[0.375rem] border-none bg-[var(--brand)] text-white text-[0.625rem] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isBn ? 'যোগ' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto overflow-x-auto ${collapsed ? 'px-1 py-2.5' : 'px-2 py-2.5'}`}>
          {orderedNavGroups.map((group) => (
            <div key={group.key} className={collapsed ? 'mb-2' : 'mb-4'}>
              {!collapsed && (
                <div className="text-[0.5625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1">
                  {t(group.key as TranslationKey, language)}
                </div>
              )}

              {group.items.map((item) => {
                const isActive = location.pathname === item.page || location.pathname.startsWith(item.page + '/')
                const IconComp = iconMap[item.icon] || LayoutDashboard
                const isBookmarked = bookmarks.includes(item.page)
                const atMaxBookmarks = bookmarks.length >= 5 && !isBookmarked
                const isDragging = draggedItem === item.page
                const isDragOver = dragOverItem === item.page
                return (
                  <NavLink
                    key={item.page}
                    to={item.page}
                    draggable={!collapsed}
                    onDragStart={(e) => handleDragStart(e, item.page)}
                    onDragOver={(e) => handleDragOver(e, item.page)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, item.page)}
                    onDragEnd={handleDragEnd}
                    onClick={() => { if (isMobile) toggleSidebar() }}
                    className={`flex items-center gap-2 rounded-lg mb-0.5 text-xs no-underline transition-all duration-150 relative group ${
                      collapsed ? 'px-0 py-2 justify-center' : 'px-2.5 py-2'
                    } ${
                      isActive
                        ? 'bg-[var(--brand-light)] text-[var(--brand)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                    } ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'border-t-2 border-[var(--brand)]' : ''}`}
                    onMouseEnter={(e) => {
                      if (collapsed) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoveredItem({ label: t(item.key as TranslationKey, language), rect })
                      }
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <IconComp size={navIconSize} className={`shrink-0 ${isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">
                          {t(item.key as TranslationKey, language)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleBookmark(item.page)
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--bg-primary)] shrink-0 ${
                            isBookmarked ? '!opacity-100' : ''
                          } ${atMaxBookmarks ? 'cursor-not-allowed' : ''}`}
                          title={isBookmarked ? (isBn ? 'বুকমার্ক সরান' : 'Remove bookmark') : atMaxBookmarks ? (isBn ? 'সর্বোচ্চ ৬টি বুকমার্ক যোগ করা যাবে' : 'Max 6 bookmarks allowed') : (isBn ? 'বুকমার্ক যোগ করুন' : 'Add bookmark')}
                        >
                          <Star
                            size={12}
                            className={isBookmarked ? 'text-[var(--amber)] fill-[var(--amber)]' : atMaxBookmarks ? 'text-[var(--text-muted)] opacity-40' : 'text-[var(--text-muted)]'}
                          />
                        </button>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom - Quick Access */}
        {!collapsed && quickAccess.length > 0 && (
          <div className="px-3 py-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-center gap-1">
              {quickAccess.map((v) => {
                const Icon = iconMap[v.icon] || Star
                return (
                  <NavLink
                    key={v.path}
                    to={v.path}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--brand-light)] transition-colors relative group"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredItem({ label: v.label, rect })
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Icon size={15} className="text-[var(--brand)]" />
                  </NavLink>
                )
              })}
            </div>
          </div>
        )}

        {/* Collapsed Quick Access */}
        {collapsed && quickAccess.length > 0 && (
          <div className="px-1 pb-2 border-t border-[var(--border)] pt-2">
            <div className="flex flex-col items-center gap-1">
              {quickAccess.map((v) => {
                const Icon = iconMap[v.icon] || Star
                return (
                  <NavLink
                    key={v.path}
                    to={v.path}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--brand-light)] transition-colors relative group"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredItem({ label: v.label, rect })
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Icon size={15} className="text-[var(--brand)]" />
                  </NavLink>
                )
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Tooltip */}
      {hoveredItem && (
        <div
          className="fixed z-[9000] pointer-events-none"
          style={{
            left: hoveredItem.rect.left + hoveredItem.rect.width / 2,
            top: hoveredItem.rect.top - 8,
            transform: 'translate(-50%, -100%)',
            animation: 'tooltipIn 0.15s ease-out',
          }}
        >
          <div className="relative">
            <div
              className="px-3 py-1.5 rounded-lg text-[0.8125rem] font-semibold whitespace-nowrap"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid var(--border)',
              }}
            >
              {hoveredItem.label}
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: '-5px',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid var(--border)',
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: '-4px',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid var(--bg-primary)',
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
