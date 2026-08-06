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
}

const groupLabels: Record<string, { en: string; bn: string }> = {
  grp_main: { en: 'Main', bn: 'প্রধান' },
  grp_manage: { en: 'Management', bn: 'ব্যবস্থাপনা' },
  grp_academic: { en: 'Academic', bn: 'শৈক্ষিক' },
  grp_finance: { en: 'Finance & Store', bn: 'অর্থ ও স্টোর' },
  grp_facility: { en: 'Facilities', bn: 'সুবিধা' },
  grp_comm: { en: 'Communication', bn: 'যোগাযোগ' },
  grp_portal: { en: 'Portals', bn: 'পোর্টাল' },
  grp_report: { en: 'Reports & Analytics', bn: 'রিপোর্ট ও বিশ্লেষণ' },
  grp_system: { en: 'System', bn: 'সিস্টেম' },
}

const navItemLabels: Record<string, { en: string; bn: string }> = {
  nav_dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  nav_classes: { en: 'Classes & Sections', bn: 'শ্রেণি ও বিভাগ' },
  nav_teachers: { en: 'Teacher Management', bn: 'শিক্ষক ব্যবস্থাপনা' },
  nav_students: { en: 'Student Management', bn: 'ছাত্র ব্যবস্থাপনা' },
  nav_hr: { en: 'HR Management', bn: 'এইচআর ব্যবস্থাপনা' },
  nav_attendance: { en: 'Attendance', bn: 'উপস্থিতি' },
  nav_exams: { en: 'Exams', bn: 'পরীক্ষা' },
  nav_syllabus: { en: 'Syllabus', bn: 'পাঠ্যক্রম' },
  nav_assignments: { en: 'Assignments', bn: 'অ্যাসাইনমেন্ট' },
  nav_online: { en: 'Online Classes', bn: 'অনলাইন ক্লাস' },
  nav_finance: { en: 'Finance', bn: 'অর্থ' },
  nav_payroll: { en: 'Payroll', bn: 'বেতন' },
  nav_store: { en: 'School Store', bn: 'স্কুল স্টোর' },
  nav_expenses: { en: 'Expenses', bn: 'খরচ' },
  nav_library: { en: 'Library', bn: 'লাইব্রেরি' },
  nav_transport: { en: 'Transport', bn: 'পরিবহন' },
  nav_hostel: { en: 'Hostel', bn: 'হোস্টেল' },
  nav_messages: { en: 'Messages', bn: 'বার্তা' },
  nav_notice: { en: 'Notice Board', bn: 'নোটিশ বোর্ড' },
  nav_notifications: { en: 'Notifications', bn: 'বিজ্ঞপ্তি' },
  nav_parent: { en: 'Parent Portal', bn: 'অভিভাবক পোর্টাল' },
  nav_student_portal: { en: 'Student Portal', bn: 'ছাত্র পোর্টাল' },
  nav_analytics: { en: 'Analytics', bn: 'বিশ্লেষণ' },
  nav_reports: { en: 'Reports', bn: 'রিপোর্ট' },
  nav_settings: { en: 'Settings', bn: 'সেটিংস' },
  nav_superadmin: { en: 'Super Admin', bn: 'সুপার অ্যাডমিন' },
  nav_superadmin_back: { en: 'Super Admin', bn: 'সুপার অ্যাডমিন' },
}

const navGroups = [
  {
    key: 'grp_main',
    items: [{ key: 'nav_dashboard', icon: 'layout-dashboard' }],
  },
  {
    key: 'grp_manage',
    items: [
      { key: 'nav_classes', icon: 'school' },
      { key: 'nav_teachers', icon: 'graduation-cap' },
      { key: 'nav_students', icon: 'users' },
      { key: 'nav_hr', icon: 'briefcase' },
    ],
  },
  {
    key: 'grp_academic',
    items: [
      { key: 'nav_attendance', icon: 'calendar-check' },
      { key: 'nav_exams', icon: 'clipboard-list' },
      { key: 'nav_syllabus', icon: 'book-open' },
      { key: 'nav_assignments', icon: 'file-text' },
      { key: 'nav_online', icon: 'video' },
    ],
  },
  {
    key: 'grp_finance',
    items: [
      { key: 'nav_finance', icon: 'landmark' },
      { key: 'nav_payroll', icon: 'wallet' },
      { key: 'nav_store', icon: 'shopping-bag' },
      { key: 'nav_expenses', icon: 'receipt' },
    ],
  },
  {
    key: 'grp_facility',
    items: [
      { key: 'nav_library', icon: 'library' },
      { key: 'nav_transport', icon: 'bus' },
      { key: 'nav_hostel', icon: 'building-2' },
    ],
  },
  {
    key: 'grp_comm',
    items: [
      { key: 'nav_messages', icon: 'message-circle' },
      { key: 'nav_notice', icon: 'megaphone' },
      { key: 'nav_notifications', icon: 'bell' },
    ],
  },
  {
    key: 'grp_portal',
    items: [
      { key: 'nav_parent', icon: 'home' },
      { key: 'nav_student_portal', icon: 'user' },
    ],
  },
  {
    key: 'grp_report',
    items: [
      { key: 'nav_analytics', icon: 'bar-chart-2' },
      { key: 'nav_reports', icon: 'file-bar-chart' },
    ],
  },
  {
    key: 'grp_system',
    items: [
      { key: 'nav_settings', icon: 'settings' },
    ],
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

        {/* Groups */}
        {navGroups.map((group) => {
          const label = groupLabels[group.key]
          return (
            <div key={group.key}>
              <h3 className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 mb-1.5">
                {isBn ? label.bn : label.en}
              </h3>
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
                {group.items.map((item, idx) => {
                  const fullPath = `${navBase}/${item.key.replace('nav_', '').replace('_back', '')}`
                  const isBookmarked = bookmarks.includes(fullPath)
                  const isLast = idx === group.items.length - 1
                  const itemLabel = navItemLabels[item.key]
                  const Icon = iconMap[item.icon] || LayoutDashboard

                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-3 px-3.5 py-3 ${
                        !isLast ? 'border-b border-[var(--border)]' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center shrink-0">
                        <Icon size={15} className="text-[var(--text-muted)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
                          {isBn ? itemLabel.bn : itemLabel.en}
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
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </SettingsPanel>
  )
}
