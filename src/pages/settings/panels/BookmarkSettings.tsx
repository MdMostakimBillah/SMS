import { Star } from 'lucide-react'
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

interface PageItem {
  key: string
  path: string
  icon: string
  title: string
  titleBn: string
  isSub?: boolean
  parentKey?: string
}

const allPages: PageItem[] = [
  { key: 'dashboard', path: 'dashboard', icon: 'layout-dashboard', title: 'Dashboard', titleBn: 'ড্যাশবোর্ড' },

  { key: 'classes', path: 'classes', icon: 'school', title: 'Classes & Sections', titleBn: 'শ্রেণি ও বিভাগ' },
  { key: 'classes-institution', path: 'classes', icon: 'settings', title: 'Institution', titleBn: 'প্রতিষ্ঠান', isSub: true, parentKey: 'classes' },
  { key: 'classes-classes', path: 'classes', icon: 'users', title: 'Classes', titleBn: 'শ্রেণি', isSub: true, parentKey: 'classes' },
  { key: 'classes-routine', path: 'classes', icon: 'calendar', title: 'Routine', titleBn: 'রুটিন', isSub: true, parentKey: 'classes' },

  { key: 'teachers', path: 'teachers', icon: 'graduation-cap', title: 'Teacher Management', titleBn: 'শিক্ষক ব্যবস্থাপনা' },
  { key: 'teachers-add', path: 'teachers/add', icon: 'user-plus', title: 'Add Teacher', titleBn: 'নতুন শিক্ষক', isSub: true, parentKey: 'teachers' },
  { key: 'teachers-all', path: 'teachers/all', icon: 'users', title: 'All Teachers', titleBn: 'সকল শিক্ষক', isSub: true, parentKey: 'teachers' },
  { key: 'teachers-departments', path: 'teachers/departments', icon: 'building-2', title: 'Departments', titleBn: 'বিভাগ', isSub: true, parentKey: 'teachers' },
  { key: 'teachers-subjects', path: 'teachers/subjects', icon: 'book-open', title: 'Subjects', titleBn: 'বিষয়', isSub: true, parentKey: 'teachers' },
  { key: 'teachers-designations', path: 'teachers/designations', icon: 'briefcase', title: 'Designations', titleBn: 'পদবি', isSub: true, parentKey: 'teachers' },
  { key: 'teachers-bulk-update', path: 'teachers/bulk-update', icon: 'layers', title: 'Bulk Update', titleBn: 'বাল্ক আপডেট', isSub: true, parentKey: 'teachers' },

  { key: 'students', path: 'students', icon: 'users', title: 'Student Management', titleBn: 'ছাত্র ব্যবস্থাপনা' },
  { key: 'students-admission', path: 'students/admission', icon: 'user-plus', title: 'New Admission', titleBn: 'নতুন ভর্তি', isSub: true, parentKey: 'students' },
  { key: 'students-all', path: 'students/all', icon: 'users', title: 'All Students', titleBn: 'সকল ছাত্র', isSub: true, parentKey: 'students' },
  { key: 'students-update', path: 'students/update', icon: 'user-pen', title: 'Update Student', titleBn: 'তথ্য আপডেট', isSub: true, parentKey: 'students' },
  { key: 'students-bulk-update', path: 'students/bulk-update', icon: 'table-properties', title: 'Bulk Update', titleBn: 'বাল্ক আপডেট', isSub: true, parentKey: 'students' },
  { key: 'students-id-cards', path: 'students/id-cards', icon: 'id-card', title: 'ID Cards', titleBn: 'ID কার্ড', isSub: true, parentKey: 'students' },
  { key: 'students-promotion', path: 'students/promotion', icon: 'arrow-up-circle', title: 'Promotion', titleBn: 'প্রমোশন', isSub: true, parentKey: 'students' },

  { key: 'hr', path: 'hr', icon: 'briefcase', title: 'HR Management', titleBn: 'এইচআর ব্যবস্থাপনা' },
  { key: 'hr-overview', path: 'hr', icon: 'layout-dashboard', title: 'Overview', titleBn: 'সারসংক্ষেপ', isSub: true, parentKey: 'hr' },
  { key: 'hr-decisions', path: 'hr', icon: 'zap', title: 'Decisions', titleBn: 'সিদ্ধান্ত', isSub: true, parentKey: 'hr' },
  { key: 'hr-increment', path: 'hr', icon: 'trending-up', title: 'Increment', titleBn: 'বেতন বৃদ্ধি', isSub: true, parentKey: 'hr' },
  { key: 'hr-bonus', path: 'hr', icon: 'gift', title: 'Bonus', titleBn: 'বোনাস', isSub: true, parentKey: 'hr' },
  { key: 'hr-promotion', path: 'hr', icon: 'award', title: 'Promotion', titleBn: 'পদোন্নতি', isSub: true, parentKey: 'hr' },
  { key: 'hr-facilities', path: 'hr', icon: 'briefcase', title: 'Facilities', titleBn: 'সুবিধা', isSub: true, parentKey: 'hr' },
  { key: 'hr-salary-setup', path: 'hr', icon: 'calculator', title: 'Salary Setup', titleBn: 'বেতন সেটআপ', isSub: true, parentKey: 'hr' },
  { key: 'hr-fund', path: 'hr', icon: 'hand-coins', title: 'Fund', titleBn: 'তহবিল', isSub: true, parentKey: 'hr' },

  { key: 'attendance', path: 'attendance', icon: 'calendar-check', title: 'Attendance', titleBn: 'উপস্থিতি' },
  { key: 'attendance-today', path: 'attendance', icon: 'calendar-check', title: "Today's", titleBn: 'আজকের উপস্থিতি', isSub: true, parentKey: 'attendance' },
  { key: 'attendance-student', path: 'attendance', icon: 'graduation-cap', title: 'Student', titleBn: 'শিক্ষার্থী', isSub: true, parentKey: 'attendance' },
  { key: 'attendance-employee', path: 'attendance', icon: 'briefcase', title: 'Employee', titleBn: 'কর্মচারী', isSub: true, parentKey: 'attendance' },
  { key: 'attendance-device', path: 'attendance', icon: 'fingerprint', title: 'Device', titleBn: 'ডিভাইস', isSub: true, parentKey: 'attendance' },

  { key: 'exams', path: 'exams', icon: 'clipboard-list', title: 'Exams', titleBn: 'পরীক্ষা' },
  { key: 'exams-planning', path: 'exams/planning', icon: 'settings', title: 'Planning', titleBn: 'পরিকল্পনা', isSub: true, parentKey: 'exams' },
  { key: 'exams-scheduling', path: 'exams/scheduling', icon: 'calendar', title: 'Scheduling', titleBn: 'সময়সূচী', isSub: true, parentKey: 'exams' },
  { key: 'exams-evaluation', path: 'exams/evaluation', icon: 'edit', title: 'Evaluation', titleBn: 'মূল্যায়ন', isSub: true, parentKey: 'exams' },
  { key: 'exams-results', path: 'exams/results', icon: 'bar-chart-2', title: 'Results', titleBn: 'ফলাফল', isSub: true, parentKey: 'exams' },
  { key: 'exams-marksheet', path: 'exams/marksheet', icon: 'graduation-cap', title: 'Marksheet', titleBn: 'মার্কশিট', isSub: true, parentKey: 'exams' },
  { key: 'exams-omr', path: 'exams/omr', icon: 'file-text', title: 'OMR Sheet', titleBn: 'OMR শিট', isSub: true, parentKey: 'exams' },

  { key: 'syllabus', path: 'syllabus', icon: 'book-open', title: 'Syllabus', titleBn: 'পাঠ্যক্রম' },
  { key: 'assignments', path: 'assignments', icon: 'file-text', title: 'Assignments', titleBn: 'অ্যাসাইনমেন্ট' },

  { key: 'online', path: 'online', icon: 'video', title: 'Online Classes', titleBn: 'অনলাইন ক্লাস' },
  { key: 'online-live', path: 'online', icon: 'radio', title: 'Live Now', titleBn: 'লাইভ', isSub: true, parentKey: 'online' },
  { key: 'online-recordings', path: 'online', icon: 'play-circle', title: 'Recordings', titleBn: 'রেকর্ডিং', isSub: true, parentKey: 'online' },

  { key: 'finance', path: 'finance', icon: 'landmark', title: 'Finance', titleBn: 'অর্থ' },
  { key: 'finance-structures', path: 'finance', icon: 'layers', title: 'Fee Structures', titleBn: 'ফি কাঠামো', isSub: true, parentKey: 'finance' },
  { key: 'finance-dues', path: 'finance', icon: 'calendar-check', title: 'Due Fees', titleBn: 'বকেয়', isSub: true, parentKey: 'finance' },
  { key: 'finance-collect', path: 'finance', icon: 'wallet', title: 'Fee Collect', titleBn: 'ফি আদায়', isSub: true, parentKey: 'finance' },
  { key: 'finance-payments', path: 'finance', icon: 'file-text', title: 'Payment History', titleBn: 'পেমেন্ট ইতিহাস', isSub: true, parentKey: 'finance' },
  { key: 'finance-waivers', path: 'finance', icon: 'award', title: 'Waivers', titleBn: 'ছাড়', isSub: true, parentKey: 'finance' },
  { key: 'finance-reports', path: 'finance', icon: 'bar-chart-2', title: 'Reports', titleBn: 'রিপোর্ট', isSub: true, parentKey: 'finance' },
  { key: 'finance-inactive', path: 'finance', icon: 'briefcase', title: 'Inactive Dues', titleBn: 'নিষ্ক্রিয় বকেয়', isSub: true, parentKey: 'finance' },

  { key: 'payroll', path: 'payroll', icon: 'wallet', title: 'Payroll', titleBn: 'বেতন' },
  { key: 'store', path: 'store', icon: 'shopping-bag', title: 'School Store', titleBn: 'স্কুল স্টোর' },
  { key: 'expenses', path: 'expenses', icon: 'receipt', title: 'Expenses', titleBn: 'খরচ' },
  { key: 'accounting-report', path: 'accounting-report', icon: 'bar-chart-3', title: 'Accounting Report', titleBn: 'হিসাব রিপোর্ট' },
  { key: 'library', path: 'library', icon: 'library', title: 'Library', titleBn: 'লাইব্রেরি' },
  { key: 'transport', path: 'transport', icon: 'bus', title: 'Transport', titleBn: 'পরিবহন' },
  { key: 'hostel', path: 'hostel', icon: 'building-2', title: 'Hostel', titleBn: 'হোস্টেল' },
  { key: 'messages', path: 'messages', icon: 'message-circle', title: 'Messages', titleBn: 'বার্তা' },
  { key: 'notice', path: 'notice', icon: 'megaphone', title: 'Notice Board', titleBn: 'নোটিশ বোর্ড' },
  { key: 'notifications', path: 'notifications', icon: 'bell', title: 'Notifications', titleBn: 'বিজ্ঞপ্তি' },
  { key: 'parent-portal', path: 'parent-portal', icon: 'home', title: 'Parent Portal', titleBn: 'অভিভাবক পোর্টাল' },
  { key: 'student-portal', path: 'student-portal', icon: 'user', title: 'Student Portal', titleBn: 'ছাত্র পোর্টাল' },
  { key: 'analytics', path: 'analytics', icon: 'bar-chart-2', title: 'Analytics', titleBn: 'বিশ্লেষণ' },
  { key: 'reports', path: 'reports', icon: 'file-bar-chart', title: 'Reports', titleBn: 'রিপোর্ট' },
  { key: 'settings', path: 'settings', icon: 'settings', title: 'Settings', titleBn: 'সেটিংস' },
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

  const bookmarkCount = bookmarks.length
  const maxBookmarks = 5

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

        {/* All Pages */}
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
          {allPages.map((page, idx) => {
            const fullPath = `${navBase}/${page.path}`
            const isBookmarked = bookmarks.includes(fullPath)
            const Icon = iconMap[page.icon] || LayoutDashboard
            const isSub = page.isSub

            return (
              <div
                key={page.key}
                className={`flex items-center gap-3 ${
                  isSub ? 'pl-11 pr-3.5 py-2.5' : 'px-3.5 py-3'
                } ${idx < allPages.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
              >
                {isSub ? (
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-[var(--text-muted)]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[var(--text-muted)]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className={`truncate ${isSub ? 'text-[0.75rem] font-medium text-[var(--text-secondary)]' : 'text-[0.8125rem] font-medium text-[var(--text-primary)]'}`}>
                    {isBn ? page.titleBn : page.title}
                  </div>
                  <div className={`truncate font-mono ${isSub ? 'text-[0.625rem] text-[var(--text-muted)]' : 'text-[0.6875rem] text-[var(--text-muted)]'}`}>
                    {fullPath}
                  </div>
                </div>

                <button
                  onClick={() => toggleBookmark(fullPath)}
                  disabled={!isBookmarked && bookmarkCount >= maxBookmarks}
                  className={`${isSub ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg flex items-center justify-center cursor-pointer border-none bg-transparent transition-all ${
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
                    size={isSub ? 14 : 16}
                    className={isBookmarked
                      ? 'text-[var(--amber)] fill-[var(--amber)]'
                      : 'text-[var(--text-muted)]'
                    }
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </SettingsPanel>
  )
}
