export interface TabPermissionConfig {
  key: string
  label: string
  labelBn: string
}

export interface PagePermissionConfig {
  key: string
  label: string
  labelBn: string
  tabs: TabPermissionConfig[] | null // null = page-only, no sub-tabs
}

export const PERMISSION_PAGES: PagePermissionConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    labelBn: 'ড্যাশবোর্ড',
    tabs: null,
  },
  {
    key: 'students',
    label: 'Students',
    labelBn: 'শিক্ষার্থী',
    tabs: [
      { key: 'admission', label: 'New Admission', labelBn: 'নতুন ভর্তি' },
      { key: 'all', label: 'All Students', labelBn: 'সকল শিক্ষার্থী' },
      { key: 'update', label: 'Update Student', labelBn: 'তথ্য আপডেট' },
      { key: 'bulk-update', label: 'Bulk Update', labelBn: 'বাল্ক আপডেট' },
      { key: 'id-cards', label: 'ID Cards', labelBn: 'ID কার্ড' },
      { key: 'promotion', label: 'Promotion', labelBn: 'প্রমোশন' },
    ],
  },
  {
    key: 'teachers',
    label: 'Teachers',
    labelBn: 'শিক্ষক',
    tabs: [
      { key: 'all', label: 'All Teachers', labelBn: 'সকল শিক্ষক' },
      { key: 'add', label: 'Add Teacher', labelBn: 'শিক্ষক যোগ' },
      { key: 'departments', label: 'Departments', labelBn: 'বিভাগ' },
      { key: 'subjects', label: 'Subjects', labelBn: 'বিষয়' },
      { key: 'designations', label: 'Designations', labelBn: 'পদবি' },
    ],
  },
  {
    key: 'classes',
    label: 'Classes',
    labelBn: 'শ্রেণি',
    tabs: [
      { key: 'institution', label: 'Institution', labelBn: 'প্রতিষ্ঠান' },
      { key: 'classes', label: 'Classes', labelBn: 'শ্রেণি' },
      { key: 'routine', label: 'Routine', labelBn: 'রুটিন' },
    ],
  },
  {
    key: 'attendance',
    label: 'Attendance',
    labelBn: 'উপস্থিতি',
    tabs: [
      { key: 'today', label: "Today's", labelBn: 'আজকের' },
      { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী' },
      { key: 'employee', label: 'Employee', labelBn: 'কর্মচারী' },
      { key: 'device', label: 'Device', labelBn: 'ডিভাইস' },
    ],
  },
  {
    key: 'exams',
    label: 'Exams',
    labelBn: 'পরীক্ষা',
    tabs: [
      { key: 'planning', label: 'Planning', labelBn: 'পরিকল্পনা' },
      { key: 'scheduling', label: 'Scheduling', labelBn: 'সময়সূচী' },
      { key: 'evaluation', label: 'Evaluation', labelBn: 'মূল্যায়ন' },
      { key: 'results', label: 'Results', labelBn: 'ফলাফল' },
      { key: 'promotion', label: 'Promotion', labelBn: 'প্রমোশন' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    labelBn: 'অর্থ',
    tabs: [
      { key: 'structures', label: 'Fee Structures', labelBn: 'ফি কাঠামো' },
      { key: 'dues', label: 'Due Fees', labelBn: 'বকেয়' },
      { key: 'collect', label: 'Fee Collect', labelBn: 'ফি আদায়' },
      { key: 'payments', label: 'Payment History', labelBn: 'পেমেন্ট ইতিহাস' },
      { key: 'waivers', label: 'Waivers', labelBn: 'ছাড়' },
      { key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট' },
      { key: 'inactive', label: 'Inactive Dues', labelBn: 'নিষ্ক্রিয় বকেয়' },
    ],
  },
  {
    key: 'messages',
    label: 'Messages',
    labelBn: 'বার্তা',
    tabs: [
      { key: 'inbox', label: 'Inbox', labelBn: 'ইনবক্স' },
      { key: 'sent', label: 'Sent', labelBn: 'পাঠানো' },
      { key: 'outgoing', label: 'Outgoing', labelBn: 'বহিঃগামী' },
      { key: 'templates', label: 'Templates', labelBn: 'টেমপ্লেট' },
    ],
  },
  {
    key: 'library',
    label: 'Library',
    labelBn: 'গ্রন্থাগার',
    tabs: [
      { key: 'books', label: 'Books', labelBn: 'বই' },
      { key: 'categories', label: 'Categories', labelBn: 'ক্যাটাগরি' },
      { key: 'issue', label: 'Issue', labelBn: 'ইস্যু' },
      { key: 'return', label: 'Return', labelBn: 'ফেরত' },
      { key: 'borrowed', label: 'Borrowed', labelBn: 'ধারে' },
      { key: 'overdue', label: 'Overdue', labelBn: 'বিলম্বিত' },
      { key: 'digital', label: 'Digital', labelBn: 'ডিজিটাল' },
      { key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট' },
    ],
  },
  {
    key: 'transport',
    label: 'Transport',
    labelBn: 'পরিবহন',
    tabs: [
      { key: 'vehicles', label: 'Vehicles', labelBn: 'যানবাহন' },
      { key: 'routes', label: 'Routes', labelBn: 'রুট' },
      { key: 'students', label: 'Students', labelBn: 'ছাত্র' },
    ],
  },
  {
    key: 'hostel',
    label: 'Hostel',
    labelBn: 'হোস্টেল',
    tabs: [
      { key: 'rooms', label: 'Rooms', labelBn: 'রুম' },
      { key: 'students', label: 'Students', labelBn: 'ছাত্র' },
    ],
  },
  {
    key: 'hr',
    label: 'HR & Payroll',
    labelBn: 'এইচআর ও বেতন',
    tabs: [
      { key: 'overview', label: 'Overview', labelBn: 'সারসংক্ষেপ' },
      { key: 'decisions', label: 'Decisions', labelBn: 'সিদ্ধান্ত' },
      { key: 'increment', label: 'Increment', labelBn: 'বেতন বৃদ্ধি' },
      { key: 'bonus', label: 'Bonus', labelBn: 'বোনাস' },
      { key: 'promotion', label: 'Promotion', labelBn: 'পদোন্নতি' },
      { key: 'facilities', label: 'Facilities', labelBn: 'সুবিধা' },
      { key: 'salary-setup', label: 'Salary Setup', labelBn: 'বেতন সেটআপ' },
      { key: 'fund', label: 'Fund', labelBn: 'তহবিল' },
    ],
  },
  {
    key: 'store',
    label: 'Store',
    labelBn: 'দোকান',
    tabs: [
      { key: 'categories', label: 'Categories', labelBn: 'ক্যাটাগরি' },
      { key: 'products', label: 'Products', labelBn: 'পণ্য' },
      { key: 'sales', label: 'Sales', labelBn: 'বিক্রয়' },
      { key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট' },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    labelBn: 'হিসাব',
    tabs: [
      { key: 'income', label: 'Income', labelBn: 'আয়' },
      { key: 'expenses', label: 'Expenses', labelBn: 'খরচ' },
      { key: 'profit-loss', label: 'Profit/Loss', labelBn: 'লাভ/ক্ষতি' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    labelBn: 'রিপোর্ট',
    tabs: null,
  },
  {
    key: 'settings',
    label: 'Settings',
    labelBn: 'সেটিংস',
    tabs: null,
  },
]

export function getPageConfig(pageKey: string): PagePermissionConfig | undefined {
  return PERMISSION_PAGES.find((p) => p.key === pageKey)
}

export function getTabConfig(pageKey: string, tabKey: string): TabPermissionConfig | undefined {
  const page = getPageConfig(pageKey)
  return page?.tabs?.find((t) => t.key === tabKey)
}
