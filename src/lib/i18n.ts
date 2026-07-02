export const translations = {
  bn: {
    grp_main: 'প্রধান',
    grp_manage: 'ব্যবস্থাপনা',
    grp_academic: 'একাডেমিক',
    grp_finance: 'আর্থিক',
    grp_facility: 'সুবিধাদি',
    grp_comm: 'যোগাযোগ',
    grp_portal: 'পোর্টাল',
    grp_report: 'রিপোর্ট',
    grp_system: 'সিস্টেম',
    nav_dashboard: 'ড্যাশবোর্ড',
    nav_students: 'ছাত্র ব্যবস্থাপনা',
    nav_teachers: 'শিক্ষক ব্যবস্থাপনা',
    nav_classes: 'ক্লাস ও সেকশন',
    nav_hr: 'HR ও স্টাফ',
    nav_attendance: 'উপস্থিতি',
    nav_exams: 'পরীক্ষা ও ফলাফল',
    nav_syllabus: 'সিলেবাস',
    nav_assignments: 'অ্যাসাইনমেন্ট',
    nav_online: 'অনলাইন ক্লাস',
    nav_finance: 'ফি ব্যবস্থাপনা',
    nav_payroll: 'বেতন (Payroll)',
    nav_store: 'স্কুল স্টোর',
    nav_expenses: 'খরচ ব্যবস্থাপনা',
    nav_library: 'লাইব্রেরি',
    nav_transport: 'পরিবহন',
    nav_hostel: 'হোস্টেল',
    nav_messages: 'বার্তা',
    nav_notice: 'নোটিশ বোর্ড',
    nav_notifications: 'নোটিফিকেশন',
    nav_parent: 'অভিভাবক পোর্টাল',
    nav_student_portal: 'ছাত্র পোর্টাল',
    nav_analytics: 'Analytics',
    nav_reports: 'রিপোর্ট',
    nav_superadmin: 'Super Admin',
    nav_settings: 'সেটিংস',
    dashboard_title: 'ড্যাশবোর্ড',
    dashboard_sub: 'সার্বিক অবস্থা — শিক্ষাবর্ষ ২০২৫–২৬',
    total_students: 'মোট ছাত্র',
    total_staff: 'শিক্ষক ও স্টাফ',
    fees_collected: 'ফি সংগ্রহ',
    avg_attendance: 'গড় উপস্থিতি',
    recent_activity: 'সাম্প্রতিক কার্যক্রম',
    upcoming_events: 'আসন্ন ইভেন্ট',
    view_all: 'সব দেখুন',
    calendar: 'ক্যালেন্ডার',
    search_placeholder: 'ছাত্র, শিক্ষক, ক্লাস খুঁজুন...',
    add_new: 'নতুন যোগ করুন',
    academic_year: '২০২৫–২৬ শিক্ষাবর্ষ',
    enterprise_plan: 'Enterprise Plan',
    plan_active: 'সক্রিয়',
    storage_used: '৬৭% স্টোরেজ ব্যবহৃত',
    theme_light: 'লাইট',
    theme_dark: 'ডার্ক',
    theme_system: 'সিস্টেম',
    lang_bn: 'বাংলা',
    lang_en: 'English',
  },

  en: {
    grp_main: 'Main',
    grp_manage: 'Management',
    grp_academic: 'Academics',
    grp_finance: 'Finance',
    grp_facility: 'Facilities',
    grp_comm: 'Communication',
    grp_portal: 'Portals',
    grp_report: 'Reports',
    grp_system: 'System',
    nav_dashboard: 'Dashboard',
    nav_students: 'Student Management',
    nav_teachers: 'Teacher Management',
    nav_classes: 'Classes & Sections',
    nav_hr: 'HR & Staff',
    nav_attendance: 'Attendance',
    nav_exams: 'Exams & Results',
    nav_syllabus: 'Syllabus',
    nav_assignments: 'Assignments',
    nav_online: 'Online Classes',
    nav_finance: 'Fee Management',
    nav_payroll: 'Payroll',
    nav_store: 'School Store',
    nav_expenses: 'Expense Management',
    nav_library: 'Library',
    nav_transport: 'Transport',
    nav_hostel: 'Hostel',
    nav_messages: 'Messages',
    nav_notice: 'Notice Board',
    nav_notifications: 'Notifications',
    nav_parent: 'Parent Portal',
    nav_student_portal: 'Student Portal',
    nav_analytics: 'Analytics',
    nav_reports: 'Reports',
    nav_superadmin: 'Super Admin',
    nav_settings: 'Settings',
    dashboard_title: 'Dashboard',
    dashboard_sub: 'Overview — Academic Year 2025–26',
    total_students: 'Total Students',
    total_staff: 'Teachers & Staff',
    fees_collected: 'Fees Collected',
    avg_attendance: 'Avg Attendance',
    recent_activity: 'Recent Activity',
    upcoming_events: 'Upcoming Events',
    view_all: 'View all',
    calendar: 'Calendar',
    search_placeholder: 'Search students, teachers...',
    add_new: 'Add New',
    academic_year: 'Academic Year 2025–26',
    enterprise_plan: 'Enterprise Plan',
    plan_active: 'Active',
    storage_used: '67% storage used',
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_system: 'System',
    lang_bn: 'বাংলা',
    lang_en: 'English',
  },
}

export type TranslationKey = keyof typeof translations.en

export function t(key: TranslationKey, lang: 'bn' | 'en'): string {
  return translations[lang][key] ?? key
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

export function toBnNum(n: number): string {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[+d])
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #22c55e, #16a34a)',
  'linear-gradient(135deg, #a855f7, #9333ea)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
]

export function getAvatarGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

export const WEEKDAYS_SHORT_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
export const WEEKDAYS_SHORT_BN = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র']
export const WEEKDAYS_FULL_BN = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার']
export const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
