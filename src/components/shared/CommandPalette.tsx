import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
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
  Sun,
  Moon,
  Languages,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useBn } from '@/hooks/useBn'

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

interface SearchItem {
  id: string
  label: string
  labelBn: string
  path: string
  icon: LucideIcon
  group: string
  groupBn: string
}

const navigationItems: Omit<SearchItem, 'icon'>[] = [
  { id: 'dashboard', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', path: '/dashboard', group: 'Main', groupBn: 'প্রধান' },
  { id: 'students', label: 'Student Management', labelBn: 'ছাত্র ব্যবস্থাপনা', path: '/students', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'students-admission', label: 'Student Admission', labelBn: 'ভর্তি', path: '/students/admission', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'students-all', label: 'All Students', labelBn: 'সকল ছাত্র', path: '/students/all', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'students-id-cards', label: 'ID Cards', labelBn: 'আইডি কার্ড', path: '/students/id-cards', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'students-promotion', label: 'Student Promotion', labelBn: 'পদোন্নতি', path: '/students/promotion', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'teachers', label: 'Teacher Management', labelBn: 'শিক্ষক ব্যবস্থাপনা', path: '/teachers', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'teachers-add', label: 'Add Teacher', labelBn: 'শিক্ষক যোগ', path: '/teachers/add', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'teachers-all', label: 'All Teachers', labelBn: 'সকল শিক্ষক', path: '/teachers/all', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'teachers-departments', label: 'Departments', labelBn: 'বিভাগ', path: '/teachers/departments', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'teachers-subjects', label: 'Subjects', labelBn: 'বিষয়', path: '/teachers/subjects', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'teachers-designations', label: 'Designations', labelBn: 'পদবি', path: '/teachers/designations', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'classes', label: 'Classes & Sections', labelBn: 'ক্লাস ও সেকশন', path: '/classes', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'hr', label: 'HR & Staff', labelBn: 'HR ও স্টাফ', path: '/hr', group: 'Management', groupBn: 'ব্যবস্থাপনা' },
  { id: 'attendance', label: 'Attendance', labelBn: 'উপস্থিতি', path: '/attendance', group: 'Academics', groupBn: 'একাডেমিক' },
  { id: 'exams', label: 'Exams & Results', labelBn: 'পরীক্ষা ও ফলাফল', path: '/exams', group: 'Academics', groupBn: 'একাডেমিক' },
  { id: 'syllabus', label: 'Syllabus', labelBn: 'সিলেবাস', path: '/syllabus', group: 'Academics', groupBn: 'একাডেমিক' },
  { id: 'assignments', label: 'Assignments', labelBn: 'অ্যাসাইনমেন্ট', path: '/assignments', group: 'Academics', groupBn: 'একাডেমিক' },
  { id: 'online', label: 'Online Classes', labelBn: 'অনলাইন ক্লাস', path: '/online', group: 'Academics', groupBn: 'একাডেমিক' },
  { id: 'finance', label: 'Fee Management', labelBn: 'ফি ব্যবস্থাপনা', path: '/finance', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'payroll', label: 'Payroll', labelBn: 'বেতন', path: '/payroll', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'store', label: 'School Store', labelBn: 'স্কুল স্টোর', path: '/store', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'expenses', label: 'Expense Management', labelBn: 'খরচ ব্যবস্থাপনা', path: '/expenses', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'library', label: 'Library', labelBn: 'লাইব্রেরি', path: '/library', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'transport', label: 'Transport', labelBn: 'পরিবহন', path: '/transport', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'hostel', label: 'Hostel', labelBn: 'হোস্টেল', path: '/hostel', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'messages', label: 'Messages', labelBn: 'বার্তা', path: '/messages', group: 'Communication', groupBn: 'যোগাযোগ' },
  { id: 'notice', label: 'Notice Board', labelBn: 'নোটিশ বোর্ড', path: '/notice', group: 'Communication', groupBn: 'যোগাযোগ' },
  { id: 'notifications', label: 'Notifications', labelBn: 'নোটিফিকেশন', path: '/notifications', group: 'Communication', groupBn: 'যোগাযোগ' },
  { id: 'parent-portal', label: 'Parent Portal', labelBn: 'অভিভাবক পোর্টাল', path: '/parent-portal', group: 'Portals', groupBn: 'পোর্টাল' },
  { id: 'student-portal', label: 'Student Portal', labelBn: 'ছাত্র পোর্টাল', path: '/student-portal', group: 'Portals', groupBn: 'পোর্টাল' },
  { id: 'analytics', label: 'Analytics', labelBn: 'Analytics', path: '/analytics', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'reports', label: 'Reports', labelBn: 'রিপোর্ট', path: '/reports', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'super-admin', label: 'Super Admin', labelBn: 'Super Admin', path: '/super-admin', group: 'System', groupBn: 'সিস্টেম' },
  { id: 'settings', label: 'Settings', labelBn: 'সেটিংস', path: '/settings', group: 'System', groupBn: 'সিস্টেম' },
]

const iconKeyMap: Record<string, string> = {
  dashboard: 'layout-dashboard',
  students: 'users',
  'students-admission': 'users',
  'students-all': 'users',
  'students-id-cards': 'users',
  'students-promotion': 'users',
  teachers: 'graduation-cap',
  'teachers-add': 'graduation-cap',
  'teachers-all': 'graduation-cap',
  'teachers-departments': 'graduation-cap',
  'teachers-subjects': 'graduation-cap',
  'teachers-designations': 'graduation-cap',
  classes: 'school',
  hr: 'briefcase',
  attendance: 'calendar-check',
  exams: 'clipboard-list',
  syllabus: 'book-open',
  assignments: 'file-text',
  online: 'video',
  finance: 'landmark',
  payroll: 'wallet',
  store: 'shopping-bag',
  expenses: 'receipt',
  library: 'library',
  transport: 'bus',
  hostel: 'building-2',
  messages: 'message-circle',
  notice: 'megaphone',
  notifications: 'bell',
  'parent-portal': 'home',
  'student-portal': 'user',
  analytics: 'bar-chart-2',
  reports: 'file-bar-chart',
  'super-admin': 'crown',
  settings: 'settings',
}

const items: SearchItem[] = navigationItems.map((item) => ({
  ...item,
  icon: iconMap[iconKeyMap[item.id]] || LayoutDashboard,
}))

interface QuickAction {
  id: string
  label: string
  labelBn: string
  icon: LucideIcon
  action: string
}

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, theme, setTheme, language, setLanguage, searchDivRect } = useAppStore()
  const isBn = useBn()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'toggle-theme',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      labelBn: theme === 'dark' ? 'লাইট মোডে পরিবর্তন' : 'ডার্ক মোডে পরিবর্তন',
      icon: theme === 'dark' ? Sun : Moon,
      action: 'theme',
    },
    {
      id: 'toggle-lang',
      label: language === 'en' ? 'Switch to Bengali' : 'Switch to English',
      labelBn: language === 'en' ? 'বাংলায় পরিবর্তন' : 'ইংরেজিতে পরিবর্তন',
      icon: Languages,
      action: 'language',
    },
  ], [theme, language])

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.labelBn.includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.groupBn.includes(q)
    )
  }, [query])

  const filteredQuickActions = useMemo(() => {
    if (!query.trim()) return quickActions
    const q = query.toLowerCase()
    return quickActions.filter(
      (action) =>
        action.label.toLowerCase().includes(q) ||
        action.labelBn.includes(q)
    )
  }, [query, quickActions])

  const allResults = useMemo(() => {
    const results: Array<{ type: 'nav' | 'action'; item: SearchItem | QuickAction }> = []
    for (const action of filteredQuickActions) {
      results.push({ type: 'action', item: action })
    }
    for (const item of filteredItems) {
      results.push({ type: 'nav', item })
    }
    return results
  }, [filteredItems, filteredQuickActions])

  const groupedNavItems = useMemo(() => {
    const groups = new Map<string, SearchItem[]>()
    for (const item of filteredItems) {
      const groupKey = isBn ? item.groupBn : item.group
      const existing = groups.get(groupKey) || []
      existing.push(item)
      groups.set(groupKey, existing)
    }
    return groups
  }, [filteredItems, isBn])

  // GSAP open animation
  useEffect(() => {
    if (commandPaletteOpen && overlayRef.current && dialogRef.current) {
      const rect = searchDivRect

      if (rect) {
        const viewportW = window.innerWidth
        const viewportH = window.innerHeight
        const dialogW = Math.min(576, viewportW - 32)
        const dialogH = viewportH * 0.7

        const scaleX = rect.width / dialogW
        const scaleY = rect.height / dialogH
        const translateX = rect.left + rect.width / 2 - viewportW / 2
        const translateY = rect.top + rect.height / 2 - (viewportH * 0.15 + dialogH / 2)

        gsap.set(dialogRef.current, {
          scale: Math.max(scaleX, scaleY),
          x: translateX,
          y: translateY,
          opacity: 0,
          transformOrigin: 'center center',
        })
      }

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: 'power2.out' }
      )

      gsap.to(dialogRef.current, {
        scale: 1,
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: 'back.out(1.1)',
        onComplete: () => {
          setTimeout(() => inputRef.current?.focus(), 10)
        },
      })
    }
  }, [commandPaletteOpen, searchDivRect])

  // Reset on open
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!listRef.current) return
    const selectedEl = listRef.current.children[selectedIndex] as HTMLElement
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleClose = useCallback(() => {
    if (overlayRef.current && dialogRef.current) {
      const rect = searchDivRect
      if (rect) {
        const viewportW = window.innerWidth
        const viewportH = window.innerHeight
        const dialogW = Math.min(576, viewportW - 32)
        const dialogH = viewportH * 0.7

        const scaleX = rect.width / dialogW
        const scaleY = rect.height / dialogH
        const translateX = rect.left + rect.width / 2 - viewportW / 2
        const translateY = rect.top + rect.height / 2 - (viewportH * 0.15 + dialogH / 2)

        gsap.to(dialogRef.current, {
          scale: Math.max(scaleX, scaleY),
          x: translateX,
          y: translateY,
          opacity: 0,
          duration: 0.15,
          ease: 'power2.in',
        })
      }

      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.12,
        ease: 'power2.in',
        onComplete: () => {
          setCommandPaletteOpen(false)
        },
      })
    } else {
      setCommandPaletteOpen(false)
    }
  }, [searchDivRect, setCommandPaletteOpen])

  const handleSelect = useCallback((result: typeof allResults[number]) => {
    if (result.type === 'action') {
      const action = result.item as QuickAction
      if (action.action === 'theme') {
        setTheme(theme === 'dark' ? 'light' : 'dark')
      } else if (action.action === 'language') {
        setLanguage(language === 'en' ? 'bn' : 'en')
      }
    } else {
      const item = result.item as SearchItem
      navigate(item.path)
    }
    handleClose()
  }, [navigate, theme, language, setTheme, setLanguage, handleClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % allResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + allResults.length) % allResults.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        handleClose()
      }
    },
    [allResults, selectedIndex, handleSelect, handleClose]
  )

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (commandPaletteOpen) {
          handleClose()
        } else {
          setCommandPaletteOpen(true)
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen, handleClose])

  if (!commandPaletteOpen) return null

  let runningIndex = -1

  return createPortal(
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '15vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        style={{
          width: '100%',
          maxWidth: '36rem',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          margin: '0 1rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBn ? 'কমান্ড বা পৃষ্ঠা খুঁজুন...' : 'Search commands or pages...'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              borderColor: 'transparent',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              fontSize: '0.6875rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              padding: '2px 6px',
              borderRadius: '0.25rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.375rem',
          }}
        >
          {allResults.length === 0 && (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
            </div>
          )}

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <>
              <div
                style={{
                  padding: '0.375rem 0.5rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {isBn ? 'দ্রুত কাজ' : 'Quick Actions'}
              </div>
              {filteredQuickActions.map((action) => {
                runningIndex++
                const idx = runningIndex
                const Icon = action.icon
                const isSelected = idx === selectedIndex
                return (
                  <div
                    key={action.id}
                    onClick={() => handleSelect({ type: 'action', item: action })}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--brand-light)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={14} style={{ color: 'var(--brand)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {isBn ? action.labelBn : action.label}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })}
              <div style={{ height: '1px', background: 'var(--border)', margin: '0.375rem 0.5rem' }} />
            </>
          )}

          {/* Navigation Items */}
          {Array.from(groupedNavItems.entries()).map(([groupKey, groupItems]) => (
            <div key={groupKey}>
              <div
                style={{
                  padding: '0.375rem 0.5rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {groupKey}
              </div>
              {groupItems.map((item) => {
                runningIndex++
                const idx = runningIndex
                const Icon = item.icon
                const isSelected = idx === selectedIndex
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect({ type: 'nav', item })}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? 'var(--brand)' : 'var(--bg-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={14} style={{ color: isSelected ? 'white' : 'var(--text-muted)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {isBn ? item.labelBn : item.label}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.path}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.5rem 1rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.6875rem',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <kbd style={{ fontSize: '0.5625rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>↑↓</kbd>
            {isBn ? 'নেভিগেট' : 'Navigate'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <kbd style={{ fontSize: '0.5625rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>↵</kbd>
            {isBn ? 'খুলুন' : 'Open'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <kbd style={{ fontSize: '0.5625rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '1px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>esc</kbd>
            {isBn ? 'বন্ধ' : 'Close'}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
