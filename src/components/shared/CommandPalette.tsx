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
  const { commandPaletteOpen, setCommandPaletteOpen, theme, setTheme, language, setLanguage } = useAppStore()
  const isBn = useBn()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

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

  // Staggered item animation on query change
  useEffect(() => {
    if (!commandPaletteOpen) return
    const timer = setTimeout(() => {
      itemRefs.current.forEach((el, idx) => {
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', delay: idx * 0.03 }
          )
        }
      })
    }, 20)
    return () => clearTimeout(timer)
  }, [query, commandPaletteOpen, allResults.length])

  // Simple open/close animation
  useEffect(() => {
    if (commandPaletteOpen && dialogRef.current) {
      gsap.fromTo(
        dialogRef.current,
        { opacity: 0, scale: 0.97, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power3.out', onComplete: () => inputRef.current?.focus() }
      )
    }
  }, [commandPaletteOpen])

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
    if (dialogRef.current) {
      gsap.to(dialogRef.current, {
        opacity: 0,
        scale: 0.97,
        y: -10,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => setCommandPaletteOpen(false),
      })
    } else {
      setCommandPaletteOpen(false)
    }
  }, [setCommandPaletteOpen])

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

  const registerItem = (idx: number, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(idx, el)
    else itemRefs.current.delete(idx)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-[36rem] max-h-[70vh] flex flex-col bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          <Search size={18} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBn ? 'কমান্ড বা পৃষ্ঠা খুঁজুন...' : 'Search commands or pages...'}
            className="flex-1 bg-transparent border-none outline-none text-base text-[var(--text-primary)] font-[inherit]"
            style={{ boxShadow: 'none', borderColor: 'transparent' }}
          />
          <kbd className="text-[0.6875rem] bg-[var(--bg-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--text-muted)] font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-1.5">
          {allResults.length === 0 && (
            <div className="py-8 text-center text-[var(--text-muted)] text-sm">
              {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
            </div>
          )}

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
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
                    ref={(el) => registerItem(idx, el)}
                    onClick={() => handleSelect({ type: 'action', item: action })}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 ${
                      isSelected ? 'bg-[var(--bg-secondary)]' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-[0.375rem] flex items-center justify-center bg-[var(--brand-light)] shrink-0">
                      <Icon size={14} className="text-[var(--brand)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8125rem] text-[var(--text-primary)] font-medium">
                        {isBn ? action.labelBn : action.label}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-[var(--text-muted)] shrink-0" />
                  </div>
                )
              })}
              <div className="h-px bg-[var(--border)] mx-2 my-1.5" />
            </>
          )}

          {/* Navigation Items */}
          {Array.from(groupedNavItems.entries()).map(([groupKey, groupItems]) => (
            <div key={groupKey}>
              <div className="px-2 py-1.5 text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
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
                    ref={(el) => registerItem(idx, el)}
                    onClick={() => handleSelect({ type: 'nav', item })}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 ${
                      isSelected ? 'bg-[var(--bg-secondary)]' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-[0.375rem] flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[var(--brand)]' : 'bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <Icon size={14} className={isSelected ? 'text-white' : 'text-[var(--text-muted)]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8125rem] text-[var(--text-primary)] font-medium">
                        {isBn ? item.labelBn : item.label}
                      </div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">
                        {item.path}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-[var(--text-muted)] shrink-0" />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)] text-[0.6875rem] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <kbd className="text-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] px-1 py-px rounded font-mono">↑↓</kbd>
            {isBn ? 'নেভিগেট' : 'Navigate'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="text-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] px-1 py-px rounded font-mono">↵</kbd>
            {isBn ? 'খুলুন' : 'Open'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="text-[0.5625rem] bg-[var(--bg-secondary)] border border-[var(--border)] px-1 py-px rounded font-mono">esc</kbd>
            {isBn ? 'বন্ধ' : 'Close'}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
