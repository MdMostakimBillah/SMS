import { useState } from 'react'
import { Star, ChevronDown, ChevronRight } from 'lucide-react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { useAuth } from '@/contexts/AuthContext'
import { useSubdomain } from '@/hooks/useSubdomain'
import { getNavBase, getSuperAdminViewNavBase } from '@/lib/navUtils'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useLocation } from 'react-router-dom'
import {
  LayoutDashboard, School, GraduationCap, Users, Briefcase,
  CalendarCheck, ClipboardList, BookOpen, FileText, Video,
  Landmark, Wallet, ShoppingBag, Receipt,
  Library, Bus, Building2,
  MessageCircle, Megaphone, Bell,
  Home, User,
  BarChart2, FileBarChart,
  Settings, Crown,
  UserPlus, UserPen, TableProperties, IdCard, ArrowUpCircle,
  Layers, Zap, TrendingUp, Gift, Award, Calculator, HandCoins,
  Fingerprint, Radio, PlayCircle,
  Edit2, Calendar,
  type LucideIcon,
} from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  school: School,
  'graduation-cap': GraduationCap,
  users: Users,
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
  settings: Settings,
  crown: Crown,
  'user-plus': UserPlus,
  'user-pen': UserPen,
  'table-properties': TableProperties,
  'id-card': IdCard,
  'arrow-up-circle': ArrowUpCircle,
  layers: Layers,
  zap: Zap,
  'trending-up': TrendingUp,
  gift: Gift,
  award: Award,
  calculator: Calculator,
  'hand-coins': HandCoins,
  fingerprint: Fingerprint,
  radio: Radio,
  'play-circle': PlayCircle,
  edit: Edit2,
  calendar: Calendar,
}

interface SubPage {
  key: string
  path: string
  icon: string
  title: string
  titleBn: string
}

interface NavPage {
  key: string
  icon: string
  title: string
  titleBn: string
  subPages?: SubPage[]
}

const pages: NavPage[] = [
  {
    key: 'dashboard',
    icon: 'layout-dashboard',
    title: 'Dashboard',
    titleBn: 'ড্যাশবোর্ড',
  },
  {
    key: 'classes',
    icon: 'school',
    title: 'Classes & Sections',
    titleBn: 'শ্রেণি ও বিভাগ',
    subPages: [
      { key: 'institution', path: 'classes', icon: 'settings', title: 'Institution', titleBn: 'প্রতিষ্ঠান' },
      { key: 'classes-tab', path: 'classes', icon: 'users', title: 'Classes', titleBn: 'শ্রেণি' },
      { key: 'routine', path: 'classes', icon: 'calendar', title: 'Routine', titleBn: 'রুটিন' },
    ],
  },
  {
    key: 'teachers',
    icon: 'graduation-cap',
    title: 'Teacher Management',
    titleBn: 'শিক্ষক ব্যবস্থাপনা',
    subPages: [
      { key: 'add', path: 'teachers/add', icon: 'user-plus', title: 'Add Teacher', titleBn: 'নতুন শিক্ষক' },
      { key: 'all', path: 'teachers/all', icon: 'users', title: 'All Teachers', titleBn: 'সকল শিক্ষক' },
      { key: 'departments', path: 'teachers/departments', icon: 'building-2', title: 'Departments', titleBn: 'বিভাগ' },
      { key: 'subjects', path: 'teachers/subjects', icon: 'book-open', title: 'Subjects', titleBn: 'বিষয়' },
      { key: 'designations', path: 'teachers/designations', icon: 'briefcase', title: 'Designations', titleBn: 'পদবি' },
      { key: 'bulk-update', path: 'teachers/bulk-update', icon: 'layers', title: 'Bulk Update', titleBn: 'বাল্ক আপডেট' },
    ],
  },
  {
    key: 'students',
    icon: 'users',
    title: 'Student Management',
    titleBn: 'ছাত্র ব্যবস্থাপনা',
    subPages: [
      { key: 'admission', path: 'students/admission', icon: 'user-plus', title: 'New Admission', titleBn: 'নতুন ভর্তি' },
      { key: 'all', path: 'students/all', icon: 'users', title: 'All Students', titleBn: 'সকল ছাত্র' },
      { key: 'update', path: 'students/update', icon: 'user-pen', title: 'Update Student', titleBn: 'তথ্য আপডেট' },
      { key: 'bulk-update', path: 'students/bulk-update', icon: 'table-properties', title: 'Bulk Update', titleBn: 'বাল্ক আপডেট' },
      { key: 'id-cards', path: 'students/id-cards', icon: 'id-card', title: 'ID Cards', titleBn: 'ID কার্ড' },
      { key: 'promotion', path: 'students/promotion', icon: 'arrow-up-circle', title: 'Promotion', titleBn: 'প্রমোশন' },
    ],
  },
  {
    key: 'hr',
    icon: 'briefcase',
    title: 'HR Management',
    titleBn: 'এইচআর ব্যবস্থাপনা',
    subPages: [
      { key: 'overview', path: 'hr', icon: 'layout-dashboard', title: 'Overview', titleBn: 'সারসংক্ষেপ' },
      { key: 'decisions', path: 'hr', icon: 'zap', title: 'Decisions', titleBn: 'সিদ্ধান্ত' },
      { key: 'increment', path: 'hr', icon: 'trending-up', title: 'Increment', titleBn: 'বেতন বৃদ্ধি' },
      { key: 'bonus', path: 'hr', icon: 'gift', title: 'Bonus', titleBn: 'বোনাস' },
      { key: 'promotion', path: 'hr', icon: 'award', title: 'Promotion', titleBn: 'পদোন্নতি' },
      { key: 'facilities', path: 'hr', icon: 'briefcase', title: 'Facilities', titleBn: 'সুবিধা' },
      { key: 'salary-setup', path: 'hr', icon: 'calculator', title: 'Salary Setup', titleBn: 'বেতন সেটআপ' },
      { key: 'fund', path: 'hr', icon: 'hand-coins', title: 'Fund', titleBn: 'তহবিল' },
    ],
  },
  {
    key: 'attendance',
    icon: 'calendar-check',
    title: 'Attendance',
    titleBn: 'উপস্থিতি',
    subPages: [
      { key: 'today', path: 'attendance', icon: 'calendar-check', title: "Today's", titleBn: 'আজকের উপস্থিতি' },
      { key: 'student', path: 'attendance', icon: 'graduation-cap', title: 'Student', titleBn: 'শিক্ষার্থী' },
      { key: 'employee', path: 'attendance', icon: 'briefcase', title: 'Employee', titleBn: 'কর্মচারী' },
      { key: 'device', path: 'attendance', icon: 'fingerprint', title: 'Device', titleBn: 'ডিভাইস' },
    ],
  },
  {
    key: 'exams',
    icon: 'clipboard-list',
    title: 'Exams',
    titleBn: 'পরীক্ষা',
    subPages: [
      { key: 'planning', path: 'exams/planning', icon: 'settings', title: 'Planning', titleBn: 'পরিকল্পনা' },
      { key: 'scheduling', path: 'exams/scheduling', icon: 'calendar', title: 'Scheduling', titleBn: 'সময়সূচী' },
      { key: 'evaluation', path: 'exams/evaluation', icon: 'edit', title: 'Evaluation', titleBn: 'মূল্যায়ন' },
      { key: 'results', path: 'exams/results', icon: 'bar-chart-2', title: 'Results', titleBn: 'ফলাফল' },
      { key: 'marksheet', path: 'exams/marksheet', icon: 'graduation-cap', title: 'Marksheet', titleBn: 'মার্কশিট' },
      { key: 'omr', path: 'exams/omr', icon: 'file-text', title: 'OMR Sheet', titleBn: 'OMR শিট' },
    ],
  },
  {
    key: 'syllabus',
    icon: 'book-open',
    title: 'Syllabus',
    titleBn: 'পাঠ্যক্রম',
  },
  {
    key: 'assignments',
    icon: 'file-text',
    title: 'Assignments',
    titleBn: 'অ্যাসাইনমেন্ট',
  },
  {
    key: 'online',
    icon: 'video',
    title: 'Online Classes',
    titleBn: 'অনলাইন ক্লাস',
    subPages: [
      { key: 'live', path: 'online', icon: 'radio', title: 'Live Now', titleBn: 'লাইভ' },
      { key: 'recordings', path: 'online', icon: 'play-circle', title: 'Recordings', titleBn: 'রেকর্ডিং' },
    ],
  },
  {
    key: 'finance',
    icon: 'landmark',
    title: 'Finance',
    titleBn: 'অর্থ',
    subPages: [
      { key: 'structures', path: 'finance', icon: 'layers', title: 'Fee Structures', titleBn: 'ফি কাঠামো' },
      { key: 'dues', path: 'finance', icon: 'calendar-check', title: 'Due Fees', titleBn: 'বকেয়' },
      { key: 'collect', path: 'finance', icon: 'wallet', title: 'Fee Collect', titleBn: 'ফি আদায়' },
      { key: 'payments', path: 'finance', icon: 'file-text', title: 'Payment History', titleBn: 'পেমেন্ট ইতিহাস' },
      { key: 'waivers', path: 'finance', icon: 'award', title: 'Waivers', titleBn: 'ছাড়' },
      { key: 'reports', path: 'finance', icon: 'bar-chart-2', title: 'Reports', titleBn: 'রিপোর্ট' },
      { key: 'inactive', path: 'finance', icon: 'briefcase', title: 'Inactive Dues', titleBn: 'নিষ্ক্রিয় বকেয়' },
    ],
  },
  {
    key: 'payroll',
    icon: 'wallet',
    title: 'Payroll',
    titleBn: 'বেতন',
  },
  {
    key: 'store',
    icon: 'shopping-bag',
    title: 'School Store',
    titleBn: 'স্কুল স্টোর',
  },
  {
    key: 'expenses',
    icon: 'receipt',
    title: 'Expenses',
    titleBn: 'খরচ',
  },
  {
    key: 'library',
    icon: 'library',
    title: 'Library',
    titleBn: 'লাইব্রেরি',
  },
  {
    key: 'transport',
    icon: 'bus',
    title: 'Transport',
    titleBn: 'পরিবহন',
  },
  {
    key: 'hostel',
    icon: 'building-2',
    title: 'Hostel',
    titleBn: 'হোস্টেল',
  },
  {
    key: 'messages',
    icon: 'message-circle',
    title: 'Messages',
    titleBn: 'বার্তা',
  },
  {
    key: 'notice',
    icon: 'megaphone',
    title: 'Notice Board',
    titleBn: 'নোটিশ বোর্ড',
  },
  {
    key: 'notifications',
    icon: 'bell',
    title: 'Notifications',
    titleBn: 'বিজ্ঞপ্তি',
  },
  {
    key: 'parent-portal',
    icon: 'home',
    title: 'Parent Portal',
    titleBn: 'অভিভাবক পোর্টাল',
  },
  {
    key: 'student-portal',
    icon: 'user',
    title: 'Student Portal',
    titleBn: 'ছাত্র পোর্টাল',
  },
  {
    key: 'analytics',
    icon: 'bar-chart-2',
    title: 'Analytics',
    titleBn: 'বিশ্লেষণ',
  },
  {
    key: 'reports',
    icon: 'file-bar-chart',
    title: 'Reports',
    titleBn: 'রিপোর্ট',
  },
  {
    key: 'settings',
    icon: 'settings',
    title: 'Settings',
    titleBn: 'সেটিংস',
  },
]

export function BookmarkSettingsPanel({ isBn, onBack }: Props) {
  const { user } = useAuth()
  const { resolved } = useSubdomain()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)
  const location = useLocation()
  const bookmarks = useAppStore((s) => s.bookmarks)
  const toggleBookmark = useAppStore((s) => s.toggleBookmark)

  const isSuperAdmin = user?.role === 'super_admin'
  const isViewing = isSuperAdmin && !!viewingInstitutionId
  const viewingRole = isViewing ? (location.pathname.split('/')[3] || 'admin') : undefined

  const navBase = isViewing
    ? getSuperAdminViewNavBase(user, viewingRole)
    : isSuperAdmin
      ? '/super-admin/admin'
      : getNavBase(user, resolved)

  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const bookmarkCount = bookmarks.length
  const maxBookmarks = 5

  const isSubPagePath = (subPage: SubPage): boolean => {
    const subTabs = ['hr', 'attendance', 'online', 'finance', 'classes']
    return subTabs.includes(subPage.path)
  }

  return (
    <SettingsPanel title="Bookmarks" titleBn="বুকমার্ক" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'সাইডবারের নিচে দ্রুত প্রবেশের জন্য পৃষ্ঠাগুলো বুকমার্ক করুন। সর্বোচ্চ ৫টি বুকমার্ক।'
            : 'Bookmark pages for quick access at the bottom of the sidebar. Max 5 bookmarks.'}
        </p>

        {/* Counter */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <span className="text-[0.8125rem] text-[var(--text-primary)]">
            {isBn ? 'বুকমার্ক' : 'Bookmarks'}
          </span>
          <span className={`text-[0.8125rem] font-bold ${bookmarkCount >= maxBookmarks ? 'text-[var(--amber)]' : 'text-[var(--brand)]'}`}>
            {bookmarkCount}/{maxBookmarks}
          </span>
        </div>

        {/* Pages */}
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
          {pages.map((page, pageIdx) => {
            const fullPath = `${navBase}/${page.key}`
            const isBookmarked = bookmarks.includes(fullPath)
            const hasSubPages = page.subPages && page.subPages.length > 0
            const isExpanded = expandedPages.has(page.key)
            const Icon = iconMap[page.icon] || LayoutDashboard

            return (
              <div key={page.key}>
                {/* Main page row */}
                <div
                  className={`flex items-center gap-3 px-3.5 py-3 ${
                    pageIdx < pages.length - 1 ? 'border-b border-[var(--border)]' : ''
                  }`}
                >
                  {hasSubPages ? (
                    <button
                      onClick={() => toggleExpand(page.key)}
                      className="w-5 h-5 flex items-center justify-center cursor-pointer bg-transparent border-none p-0 shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-[var(--text-muted)]" />
                      ) : (
                        <ChevronRight size={14} className="text-[var(--text-muted)]" />
                      )}
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}

                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[var(--text-muted)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
                      {isBn ? page.titleBn : page.title}
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)] truncate font-mono">
                      {fullPath}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBookmark(fullPath)}
                    disabled={!isBookmarked && bookmarkCount >= maxBookmarks}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none bg-transparent transition-all ${
                      !isBookmarked && bookmarkCount >= maxBookmarks
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-[var(--bg-primary)]'
                    }`}
                    title={isBookmarked
                      ? (isBn ? 'বুকমার্ক সরান' : 'Remove bookmark')
                      : (isBn ? 'বুকমার্ক যোগ করুন' : 'Add bookmark')
                    }
                  >
                    <Star
                      size={16}
                      className={isBookmarked
                        ? 'text-[var(--amber)] fill-[var(--amber)]'
                        : 'text-[var(--text-muted)]'
                      }
                    />
                  </button>
                </div>

                {/* Sub-pages */}
                {hasSubPages && isExpanded && (
                  <div className="bg-[var(--bg-primary)]">
                    {page.subPages!.map((sub, subIdx) => {
                      const subFullPath = `${navBase}/${sub.key === page.key || isSubPagePath(sub) ? sub.path : sub.path}`
                      const subIsBookmarked = bookmarks.includes(subFullPath)
                      const SubIcon = iconMap[sub.icon] || LayoutDashboard

                      return (
                        <div
                          key={sub.key}
                          className={`flex items-center gap-3 pl-12 pr-3.5 py-2.5 ${
                            subIdx < page.subPages!.length - 1 ? 'border-b border-[var(--border)]' : ''
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                            <SubIcon size={13} className="text-[var(--text-muted)]" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] truncate">
                              {isBn ? sub.titleBn : sub.title}
                            </div>
                            <div className="text-[0.625rem] text-[var(--text-muted)] truncate font-mono">
                              {subFullPath}
                            </div>
                          </div>

                          <button
                            onClick={() => toggleBookmark(subFullPath)}
                            disabled={!subIsBookmarked && bookmarkCount >= maxBookmarks}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none bg-transparent transition-all ${
                              !subIsBookmarked && bookmarkCount >= maxBookmarks
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-[var(--bg-secondary)]'
                            }`}
                            title={subIsBookmarked
                              ? (isBn ? 'বুকমার্ক সরান' : 'Remove bookmark')
                              : (isBn ? 'বুকমার্ক যোগ করুন' : 'Add bookmark')
                            }
                          >
                            <Star
                              size={14}
                              className={subIsBookmarked
                                ? 'text-[var(--amber)] fill-[var(--amber)]'
                                : 'text-[var(--text-muted)]'
                              }
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </SettingsPanel>
  )
}
