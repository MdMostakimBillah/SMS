import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

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
  // Main
  { id: 'dashboard', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', path: '/dashboard', group: 'Main', groupBn: 'প্রধান' },

  // Students
  { id: 'students', label: 'Student Management', labelBn: 'ছাত্র ব্যবস্থাপনা', path: '/students', group: 'Students', groupBn: 'ছাত্র' },
  { id: 'students-admission', label: 'Student Admission', labelBn: 'ভর্তি', path: '/students/admission', group: 'Students', groupBn: 'ছাত্র' },
  { id: 'students-admission-general', label: 'General Admission', labelBn: 'সাধারণ ভর্তি', path: '/students/admission', group: 'Students', groupBn: 'ছাত্র' },
  { id: 'students-admission-bulk', label: 'Bulk Admission', labelBn: 'বাল্ক ভর্তি', path: '/students/admission', group: 'Students', groupBn: 'ছাত্র' },
  { id: 'students-admission-manage', label: 'Manage Admission', labelBn: 'ভর্তি ব্যবস্থাপনা', path: '/students/admission', group: 'Students', groupBn: 'ছাত্র' },
  { id: 'students-all', label: 'All Students', labelBn: 'সকল ছাত্র', path: '/students/all', group: 'Students', groupBn: 'ছাত্র' },
  { id: 'students-id-cards', label: 'ID Cards', labelBn: 'আইডি কার্ড', path: '/students/id-cards', group: 'Students', groupBn: 'ছাত্র' },
  { id: 'students-promotion', label: 'Student Promotion', labelBn: 'পদোন্নতি', path: '/students/promotion', group: 'Students', groupBn: 'ছাত্র' },

  // Teachers
  { id: 'teachers', label: 'Teacher Management', labelBn: 'শিক্ষক ব্যবস্থাপনা', path: '/teachers', group: 'Teachers', groupBn: 'শিক্ষক' },
  { id: 'teachers-add', label: 'Add Teacher', labelBn: 'শিক্ষক যোগ', path: '/teachers/add', group: 'Teachers', groupBn: 'শিক্ষক' },
  { id: 'teachers-all', label: 'All Teachers', labelBn: 'সকল শিক্ষক', path: '/teachers/all', group: 'Teachers', groupBn: 'শিক্ষক' },
  { id: 'teachers-departments', label: 'Departments', labelBn: 'বিভাগ', path: '/teachers/departments', group: 'Teachers', groupBn: 'শিক্ষক' },
  { id: 'teachers-subjects', label: 'Subjects', labelBn: 'বিষয়', path: '/teachers/subjects', group: 'Teachers', groupBn: 'শিক্ষক' },
  { id: 'teachers-designations', label: 'Designations', labelBn: 'পদবি', path: '/teachers/designations', group: 'Teachers', groupBn: 'শিক্ষক' },

  // Classes
  { id: 'classes', label: 'Classes & Sections', labelBn: 'ক্লাস ও সেকশন', path: '/classes', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'classes-routine', label: 'Class Routine', labelBn: 'ক্লাস রুটিন', path: '/classes', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'classes-syllabus', label: 'Class Syllabus', labelBn: 'ক্লাস সিলেবাস', path: '/classes', group: 'Academic', groupBn: 'একাডেমিক' },

  // HR
  { id: 'hr', label: 'HR & Staff', labelBn: 'HR ও স্টাফ', path: '/hr', group: 'HR', groupBn: 'এইচআর' },
  { id: 'hr-staff', label: 'Staff List', labelBn: 'স্টাফ তালিকা', path: '/hr', group: 'HR', groupBn: 'এইচআর' },
  { id: 'hr-attendance', label: 'Staff Attendance', labelBn: 'স্টাফ উপস্থিতি', path: '/hr', group: 'HR', groupBn: 'এইচআর' },

  // Attendance
  { id: 'attendance', label: 'Attendance', labelBn: 'উপস্থিতি', path: '/attendance', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'attendance-student', label: 'Student Attendance', labelBn: 'ছাত্র উপস্থিতি', path: '/attendance', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'attendance-teacher', label: 'Teacher Attendance', labelBn: 'শিক্ষক উপস্থিতি', path: '/attendance', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'attendance-report', label: 'Attendance Report', labelBn: 'উপস্থিতি রিপোর্ট', path: '/attendance', group: 'Academic', groupBn: 'একাডেমিক' },

  // Exams
  { id: 'exams', label: 'Exams & Results', labelBn: 'পরীক্ষা ও ফলাফল', path: '/exams', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'exams-create', label: 'Create Exam', labelBn: 'পরীক্ষা তৈরি', path: '/exams', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'exams-schedule', label: 'Exam Schedule', labelBn: 'পরীক্ষার সময়সূচী', path: '/exams', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'exams-results', label: 'Exam Results', labelBn: 'পরীক্ষার ফলাফল', path: '/exams', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'exams-grade', label: 'Grade Setup', labelBn: 'গ্রেড সেটআপ', path: '/exams', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'exams-invigilator', label: 'Invigilator Setup', labelBn: 'পরীক্ষার্থী পরিদর্শক', path: '/exams', group: 'Academic', groupBn: 'একাডেমিক' },

  // Syllabus
  { id: 'syllabus', label: 'Syllabus', labelBn: 'সিলেবাস', path: '/syllabus', group: 'Academic', groupBn: 'একাডেমিক' },

  // Assignments
  { id: 'assignments', label: 'Assignments', labelBn: 'অ্যাসাইনমেন্ট', path: '/assignments', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'assignments-create', label: 'Create Assignment', labelBn: 'অ্যাসাইনমেন্ট তৈরি', path: '/assignments', group: 'Academic', groupBn: 'একাডেমিক' },
  { id: 'assignments-list', label: 'Assignment List', labelBn: 'অ্যাসাইনমেন্ট তালিকা', path: '/assignments', group: 'Academic', groupBn: 'একাডেমিক' },

  // Online Classes
  { id: 'online', label: 'Online Classes', labelBn: 'অনলাইন ক্লাস', path: '/online', group: 'Academic', groupBn: 'একাডেমিক' },

  // Finance
  { id: 'finance', label: 'Fee Management', labelBn: 'ফি ব্যবস্থাপনা', path: '/finance', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'finance-fee-structure', label: 'Fee Structure', labelBn: 'ফি কাঠামো', path: '/finance', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'finance-fee-collect', label: 'Fee Collection', labelBn: 'ফি সংগ্রহ', path: '/finance', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'finance-fee-report', label: 'Fee Report', labelBn: 'ফি রিপোর্ট', path: '/finance', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'finance-due', label: 'Due Fees', labelBn: 'বকেয় ফি', path: '/finance', group: 'Finance', groupBn: 'আর্থিক' },

  // Payroll
  { id: 'payroll', label: 'Payroll', labelBn: 'বেতন', path: '/payroll', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'payroll-salary', label: 'Salary Setup', labelBn: 'বেতন সেটআপ', path: '/payroll', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'payroll-generate', label: 'Generate Salary', labelBn: 'বেতন তৈরি', path: '/payroll', group: 'Finance', groupBn: 'আর্থিক' },

  // Store
  { id: 'store', label: 'School Store', labelBn: 'স্কুল স্টোর', path: '/store', group: 'Finance', groupBn: 'আর্থিক' },

  // Expenses
  { id: 'expenses', label: 'Expense Management', labelBn: 'খরচ ব্যবস্থাপনা', path: '/expenses', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'expenses-add', label: 'Add Expense', labelBn: 'খরচ যোগ', path: '/expenses', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'expenses-category', label: 'Expense Categories', labelBn: 'খরচ বিভাগ', path: '/expenses', group: 'Finance', groupBn: 'আর্থিক' },
  { id: 'expenses-report', label: 'Expense Report', labelBn: 'খরচ রিপোর্ট', path: '/expenses', group: 'Finance', groupBn: 'আর্থিক' },

  // Library
  { id: 'library', label: 'Library', labelBn: 'লাইব্রেরি', path: '/library', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'library-books', label: 'Books', labelBn: 'বই', path: '/library', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'library-issue', label: 'Issue Book', labelBn: 'বই ইস্যু', path: '/library', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'library-return', label: 'Return Book', labelBn: 'বই ফেরত', path: '/library', group: 'Facilities', groupBn: 'সুবিধাদি' },

  // Transport
  { id: 'transport', label: 'Transport', labelBn: 'পরিবহন', path: '/transport', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'transport-routes', label: 'Routes', labelBn: 'রুট', path: '/transport', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'transport-vehicles', label: 'Vehicles', labelBn: 'যানবাহন', path: '/transport', group: 'Facilities', groupBn: 'সুবিধাদি' },

  // Hostel
  { id: 'hostel', label: 'Hostel', labelBn: 'হোস্টেল', path: '/hostel', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'hostel-rooms', label: 'Rooms', labelBn: 'কক্ষ', path: '/hostel', group: 'Facilities', groupBn: 'সুবিধাদি' },
  { id: 'hostel-bed', label: 'Bed Allocation', labelBn: 'বিছানা বরাদ্দ', path: '/hostel', group: 'Facilities', groupBn: 'সুবিধাদি' },

  // Messages
  { id: 'messages', label: 'Messages', labelBn: 'বার্তা', path: '/messages', group: 'Communication', groupBn: 'যোগাযোগ' },
  { id: 'messages-inbox', label: 'Inbox', labelBn: 'ইনবক্স', path: '/messages', group: 'Communication', groupBn: 'যোগাযোগ' },
  { id: 'messages-compose', label: 'Compose Message', labelBn: 'বার্তা লিখুন', path: '/messages', group: 'Communication', groupBn: 'যোগাযোগ' },

  // Notice Board
  { id: 'notice', label: 'Notice Board', labelBn: 'নোটিশ বোর্ড', path: '/notice', group: 'Communication', groupBn: 'যোগাযোগ' },
  { id: 'notice-create', label: 'Create Notice', labelBn: 'নোটিশ তৈরি', path: '/notice', group: 'Communication', groupBn: 'যোগাযোগ' },

  // Notifications
  { id: 'notifications', label: 'Notifications', labelBn: 'নোটিফিকেশন', path: '/notifications', group: 'Communication', groupBn: 'যোগাযোগ' },

  // Portals
  { id: 'parent-portal', label: 'Parent Portal', labelBn: 'অভিভাবক পোর্টাল', path: '/parent-portal', group: 'Portals', groupBn: 'পোর্টাল' },
  { id: 'student-portal', label: 'Student Portal', labelBn: 'ছাত্র পোর্টাল', path: '/student-portal', group: 'Portals', groupBn: 'পোর্টাল' },

  // Reports
  { id: 'analytics', label: 'Analytics', labelBn: 'Analytics', path: '/analytics', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'reports', label: 'Reports', labelBn: 'রিপোর্ট', path: '/reports', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'reports-student', label: 'Student Reports', labelBn: 'ছাত্র রিপোর্ট', path: '/reports', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'reports-teacher', label: 'Teacher Reports', labelBn: 'শিক্ষক রিপোর্ট', path: '/reports', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'reports-attendance', label: 'Attendance Reports', labelBn: 'উপস্থিতি রিপোর্ট', path: '/reports', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'reports-finance', label: 'Finance Reports', labelBn: 'আর্থিক রিপোর্ট', path: '/reports', group: 'Reports', groupBn: 'রিপোর্ট' },
  { id: 'reports-exam', label: 'Exam Reports', labelBn: 'পরীক্ষা রিপোর্ট', path: '/reports', group: 'Reports', groupBn: 'রিপোর্ট' },

  // System
  { id: 'super-admin', label: 'Super Admin', labelBn: 'Super Admin', path: '/super-admin', group: 'System', groupBn: 'সিস্টেম' },
  { id: 'settings', label: 'Settings', labelBn: 'সেটিংস', path: '/settings', group: 'System', groupBn: 'সিস্টেম' },
  { id: 'settings-general', label: 'General Settings', labelBn: 'সাধারণ সেটিংস', path: '/settings', group: 'System', groupBn: 'সিস্টেম' },
  { id: 'settings-academic', label: 'Academic Settings', labelBn: 'একাডেমিক সেটিংস', path: '/settings', group: 'System', groupBn: 'সিস্টেম' },
  { id: 'settings-institution', label: 'Institution Profile', labelBn: 'প্রতিষ্ঠান প্রোফাইল', path: '/settings', group: 'System', groupBn: 'সিস্টেম' },
]

const iconKeyMap: Record<string, string> = {
  dashboard: 'layout-dashboard',
  students: 'users',
  'students-admission': 'users',
  'students-admission-general': 'users',
  'students-admission-bulk': 'users',
  'students-admission-manage': 'users',
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
  'classes-routine': 'school',
  'classes-syllabus': 'school',
  hr: 'briefcase',
  'hr-staff': 'briefcase',
  'hr-attendance': 'briefcase',
  attendance: 'calendar-check',
  'attendance-student': 'calendar-check',
  'attendance-teacher': 'calendar-check',
  'attendance-report': 'calendar-check',
  exams: 'clipboard-list',
  'exams-create': 'clipboard-list',
  'exams-schedule': 'clipboard-list',
  'exams-results': 'clipboard-list',
  'exams-grade': 'clipboard-list',
  'exams-invigilator': 'clipboard-list',
  syllabus: 'book-open',
  assignments: 'file-text',
  'assignments-create': 'file-text',
  'assignments-list': 'file-text',
  online: 'video',
  finance: 'landmark',
  'finance-fee-structure': 'landmark',
  'finance-fee-collect': 'landmark',
  'finance-fee-report': 'landmark',
  'finance-due': 'landmark',
  payroll: 'wallet',
  'payroll-salary': 'wallet',
  'payroll-generate': 'wallet',
  store: 'shopping-bag',
  expenses: 'receipt',
  'expenses-add': 'receipt',
  'expenses-category': 'receipt',
  'expenses-report': 'receipt',
  library: 'library',
  'library-books': 'library',
  'library-issue': 'library',
  'library-return': 'library',
  transport: 'bus',
  'transport-routes': 'bus',
  'transport-vehicles': 'bus',
  hostel: 'building-2',
  'hostel-rooms': 'building-2',
  'hostel-bed': 'building-2',
  messages: 'message-circle',
  'messages-inbox': 'message-circle',
  'messages-compose': 'message-circle',
  notice: 'megaphone',
  'notice-create': 'megaphone',
  notifications: 'bell',
  'parent-portal': 'home',
  'student-portal': 'user',
  analytics: 'bar-chart-2',
  reports: 'file-bar-chart',
  'reports-student': 'file-bar-chart',
  'reports-teacher': 'file-bar-chart',
  'reports-attendance': 'file-bar-chart',
  'reports-finance': 'file-bar-chart',
  'reports-exam': 'file-bar-chart',
  'super-admin': 'crown',
  settings: 'settings',
  'settings-general': 'settings',
  'settings-academic': 'settings',
  'settings-institution': 'settings',
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

  // Reset on open
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      inputRef.current?.focus()
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
    setCommandPaletteOpen(false)
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        className="glass w-full max-w-[36rem] max-h-[70vh] flex flex-col rounded-xl overflow-hidden mx-4"
        style={{ borderRadius: '1rem' }}
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
