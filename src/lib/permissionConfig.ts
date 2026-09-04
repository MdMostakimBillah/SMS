export type PermissionAction =
  | 'view' | 'create' | 'edit' | 'delete'
  | 'approve' | 'reject' | 'print' | 'export'
  | 'import' | 'download' | 'publish' | 'manage' | 'configure'

export interface PermissionNode {
  key: string
  label: string
  labelBn: string
  actions: PermissionAction[]
  children?: PermissionNode[]
}

export type ActionSet = Record<PermissionAction, boolean>

export function createActionSet(enabled: PermissionAction[] = []): ActionSet {
  const all: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'print', 'export', 'import', 'download', 'publish', 'manage', 'configure']
  const set = {} as ActionSet
  for (const a of all) set[a] = enabled.includes(a)
  return set
}

export const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'print', 'export', 'import', 'download', 'publish', 'manage', 'configure']

export const PERMISSION_TREE: PermissionNode[] = [
  {
    key: 'dashboard', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড',
    actions: ['view'],
  },
  {
    key: 'students', label: 'Students', labelBn: 'শিক্ষার্থী',
    actions: ['view', 'manage'],
    children: [
      { key: 'admission', label: 'New Admission', labelBn: 'নতুন ভর্তি', actions: ['view', 'create', 'edit', 'delete', 'print', 'export'] },
      { key: 'all', label: 'All Students', labelBn: 'সকল শিক্ষার্থী', actions: ['view', 'edit', 'delete', 'export', 'print'] },
      { key: 'update', label: 'Update Student', labelBn: 'তথ্য আপডেট', actions: ['view', 'edit', 'delete', 'import', 'export'] },
      { key: 'bulk-update', label: 'Bulk Update', labelBn: 'বাল্ক আপডেট', actions: ['view', 'edit', 'delete', 'import', 'export'] },
      { key: 'id-cards', label: 'ID Cards', labelBn: 'ID কার্ড', actions: ['view', 'edit', 'delete', 'print', 'export', 'download'] },
      { key: 'promotion', label: 'Promotion', labelBn: 'প্রমোশন', actions: ['view', 'create', 'edit', 'delete', 'print', 'export'] },
    ],
  },
  {
    key: 'teachers', label: 'Teachers', labelBn: 'শিক্ষক',
    actions: ['view', 'manage'],
    children: [
      { key: 'all', label: 'All Teachers', labelBn: 'সকল শিক্ষক', actions: ['view', 'edit', 'delete', 'export', 'print'] },
      { key: 'add', label: 'Add Teacher', labelBn: 'শিক্ষক যোগ', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'departments', label: 'Departments', labelBn: 'বিভাগ', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'subjects', label: 'Subjects', labelBn: 'বিষয়', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'designations', label: 'Designations', labelBn: 'পদবি', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'bulk-update', label: 'Bulk Update', labelBn: 'বাল্ক আপডেট', actions: ['view', 'edit', 'delete', 'import', 'export'] },
    ],
  },
  {
    key: 'classes', label: 'Classes', labelBn: 'শ্রেণি',
    actions: ['view', 'manage'],
    children: [
      { key: 'institution', label: 'Institution', labelBn: 'প্রতিষ্ঠান', actions: ['view', 'edit', 'delete', 'configure'] },
      { key: 'classes', label: 'Classes', labelBn: 'শ্রেণি', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'routine', label: 'Routine', labelBn: 'রুটিন', actions: ['view', 'edit', 'delete', 'print', 'export'] },
    ],
  },
  {
    key: 'attendance', label: 'Attendance', labelBn: 'উপস্থিতি',
    actions: ['view', 'manage'],
    children: [
      { key: 'today', label: "Today's", labelBn: 'আজকের', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', actions: ['view', 'edit', 'delete', 'export', 'print'] },
      { key: 'employee', label: 'Employee', labelBn: 'কর্মচারী', actions: ['view', 'edit', 'delete', 'export', 'print'] },
      { key: 'device', label: 'Device', labelBn: 'ডিভাইস', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    ],
  },
  {
    key: 'exams', label: 'Exams', labelBn: 'পরীক্ষা',
    actions: ['view', 'manage'],
    children: [
      { key: 'planning', label: 'Planning', labelBn: 'পরিকল্পনা', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'scheduling', label: 'Scheduling', labelBn: 'সময়সূচী', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'evaluation', label: 'Evaluation', labelBn: 'মূল্যায়ন', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'results', label: 'Results', labelBn: 'ফলাফল', actions: ['view', 'edit', 'delete', 'publish', 'print', 'export'] },
      { key: 'promotion', label: 'Promotion', labelBn: 'প্রমোশন', actions: ['view', 'create', 'edit', 'delete', 'print', 'export'] },
    ],
  },
  {
    key: 'finance', label: 'Finance', labelBn: 'আর্থিক',
    actions: ['view', 'manage', 'configure'],
    children: [
      {
        key: 'fees', label: 'Fee Collection', labelBn: 'ফি আদায়',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
        children: [
          { key: 'structures', label: 'Fee Structures', labelBn: 'ফি কাঠামো', actions: ['view', 'create', 'edit', 'delete'] },
          { key: 'dues', label: 'Due Fees', labelBn: 'বকেয়', actions: ['view', 'edit', 'delete', 'export', 'print'] },
          { key: 'collect', label: 'Collect Fee', labelBn: 'ফি আদায়', actions: ['view', 'create', 'edit', 'delete', 'approve', 'print'] },
          { key: 'payments', label: 'Payment History', labelBn: 'পেমেন্ট ইতিহাস', actions: ['view', 'edit', 'delete', 'export', 'print'] },
          { key: 'waivers', label: 'Waivers', labelBn: 'ছাড়', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
          { key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট', actions: ['view', 'edit', 'delete', 'export', 'print'] },
          { key: 'inactive', label: 'Inactive Dues', labelBn: 'নিষ্ক্রিয় বকেয়', actions: ['view', 'edit', 'delete', 'export'] },
        ],
      },
      {
        key: 'expenses', label: 'Expenses', labelBn: 'খরচ',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
        children: [
          { key: 'categories', label: 'Categories', labelBn: 'ক্যাটাগরি', actions: ['view', 'create', 'edit', 'delete'] },
          { key: 'expenses', label: 'Expense List', labelBn: 'খরচের তালিকা', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
          { key: 'recurring', label: 'Recurring', labelBn: 'পুনরাবৃত্ত', actions: ['view', 'create', 'edit', 'delete'] },
        ],
      },
      {
        key: 'others_income', label: 'Others Income', labelBn: 'অন্যান্য আয়',
        actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
      },
    ],
  },
  {
    key: 'payroll', label: 'Payroll', labelBn: 'বেতন',
    actions: ['view', 'manage'],
    children: [
      { key: 'overview', label: 'Overview', labelBn: 'সারসংক্ষেপ', actions: ['view', 'edit', 'delete', 'print', 'export'] },
    ],
  },
  {
    key: 'hr', label: 'HR & Staff', labelBn: 'এইচআর ও স্টাফ',
    actions: ['view', 'manage'],
    children: [
      { key: 'overview', label: 'Overview', labelBn: 'সারসংক্ষেপ', actions: ['view', 'edit', 'delete'] },
      { key: 'decisions', label: 'Decisions', labelBn: 'সিদ্ধান্ত', actions: ['view', 'create', 'edit', 'delete', 'approve', 'reject'] },
      { key: 'increment', label: 'Increment', labelBn: 'বেতন বৃদ্ধি', actions: ['view', 'create', 'edit', 'delete', 'print', 'export'] },
      { key: 'bonus', label: 'Bonus', labelBn: 'বোনাস', actions: ['view', 'create', 'edit', 'delete', 'print', 'export'] },
      { key: 'promotion', label: 'Promotion', labelBn: 'পদোন্নতি', actions: ['view', 'create', 'edit', 'delete', 'print', 'export'] },
      { key: 'fund', label: 'Fund', labelBn: 'তহবিল', actions: ['view', 'create', 'edit', 'delete', 'print', 'export'] },
      { key: 'salary-setup', label: 'Salary Setup', labelBn: 'বেতন সেটআপ', actions: ['view', 'edit', 'delete', 'manage', 'print', 'export'] },
      { key: 'facilities', label: 'Facilities', labelBn: 'সুবিধা', actions: ['view', 'create', 'edit', 'delete'] },
    ],
  },
  {
    key: 'store', label: 'School Store', labelBn: 'স্কুল স্টোর',
    actions: ['view', 'manage'],
    children: [
      { key: 'categories', label: 'Categories', labelBn: 'ক্যাটাগরি', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'products', label: 'Products', labelBn: 'পণ্য', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'sales', label: 'Sales', labelBn: 'বিক্রয়', actions: ['view', 'create', 'edit', 'delete', 'export', 'print'] },
      { key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট', actions: ['view', 'edit', 'delete', 'export'] },
    ],
  },
  {
    key: 'accounting', label: 'Accounting', labelBn: 'হিসাব',
    actions: ['view', 'manage'],
    children: [
      { key: 'income', label: 'Income', labelBn: 'আয়', actions: ['view', 'create', 'edit', 'delete', 'export', 'print'] },
      { key: 'expenses', label: 'Expenses', labelBn: 'খরচ', actions: ['view', 'create', 'edit', 'delete', 'export', 'print'] },
      { key: 'profit-loss', label: 'Profit/Loss', labelBn: 'লাভ/ক্ষতি', actions: ['view', 'edit', 'delete', 'export', 'print'] },
    ],
  },
  {
    key: 'messages', label: 'Messages', labelBn: 'বার্তা',
    actions: ['view', 'create', 'manage'],
    children: [
      { key: 'inbox', label: 'Inbox', labelBn: 'ইনবক্স', actions: ['view', 'edit', 'delete'] },
      { key: 'sent', label: 'Sent', labelBn: 'পাঠানো', actions: ['view', 'edit', 'delete'] },
      { key: 'outgoing', label: 'Outgoing', labelBn: 'বহিঃগামী', actions: ['view', 'edit', 'delete', 'manage'] },
      { key: 'templates', label: 'Templates', labelBn: 'টেমপ্লেট', actions: ['view', 'create', 'edit', 'delete'] },
    ],
  },
  {
    key: 'notice', label: 'Notice Board', labelBn: 'নোটিশ বোর্ড',
    actions: ['view', 'create', 'edit', 'delete', 'publish'],
  },
  {
    key: 'notifications', label: 'Notifications', labelBn: 'নোটিফিকেশন',
    actions: ['view', 'edit', 'delete', 'manage'],
  },
  {
    key: 'library', label: 'Library', labelBn: 'গ্রন্থাগার',
    actions: ['view', 'manage'],
    children: [
      { key: 'dashboard', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', actions: ['view', 'edit', 'delete'] },
      { key: 'books', label: 'Books', labelBn: 'বই', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'categories', label: 'Categories', labelBn: 'ক্যাটাগরি', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'issue', label: 'Issue', labelBn: 'ইস্যু', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'return', label: 'Return', labelBn: 'ফেরত', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'borrowed', label: 'Borrowed', labelBn: 'ধারে', actions: ['view', 'edit', 'delete'] },
      { key: 'overdue', label: 'Overdue', labelBn: 'বিলম্বিত', actions: ['view', 'edit', 'delete'] },
      { key: 'digital', label: 'Digital', labelBn: 'ডিজিটাল', actions: ['view', 'create', 'edit', 'delete', 'download'] },
      { key: 'reading', label: 'Reading', labelBn: 'পড়াশোনা', actions: ['view', 'edit', 'delete'] },
      { key: 'profiles', label: 'Profiles', labelBn: 'প্রোফাইল', actions: ['view', 'edit', 'delete'] },
      { key: 'history', label: 'History', labelBn: 'ইতিহাস', actions: ['view', 'edit', 'delete', 'export'] },
      { key: 'transactions', label: 'Transactions', labelBn: 'লেনদেন', actions: ['view', 'edit', 'delete', 'export'] },
      { key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট', actions: ['view', 'edit', 'delete', 'export', 'print'] },
      { key: 'settings', label: 'Settings', labelBn: 'সেটিংস', actions: ['view', 'edit', 'delete', 'configure'] },
    ],
  },
  {
    key: 'transport', label: 'Transport', labelBn: 'পরিবহন',
    actions: ['view', 'manage'],
    children: [
      { key: 'vehicles', label: 'Vehicles', labelBn: 'যানবাহন', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'routes', label: 'Routes', labelBn: 'রুট', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'students', label: 'Students', labelBn: 'ছাত্র', actions: ['view', 'create', 'edit', 'delete'] },
    ],
  },
  {
    key: 'hostel', label: 'Hostel', labelBn: 'হোস্টেল',
    actions: ['view', 'manage'],
    children: [
      { key: 'rooms', label: 'Rooms', labelBn: 'রুম', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'students', label: 'Students', labelBn: 'ছাত্র', actions: ['view', 'create', 'edit', 'delete'] },
    ],
  },
  {
    key: 'syllabus', label: 'Syllabus', labelBn: 'সিলেবাস',
    actions: ['view', 'create', 'edit', 'delete', 'print', 'export', 'download'],
  },
  {
    key: 'assignments', label: 'Assignments', labelBn: 'অ্যাসাইনমেন্ট',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    key: 'online', label: 'Online Classes', labelBn: 'অনলাইন ক্লাস',
    actions: ['view', 'create', 'manage'],
    children: [
      { key: 'live', label: 'Live Now', labelBn: 'লাইভ', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'recordings', label: 'Recordings', labelBn: 'রেকর্ডিং', actions: ['view', 'edit', 'delete', 'download'] },
    ],
  },
  {
    key: 'reports', label: 'Reports', labelBn: 'রিপোর্ট',
    actions: ['view', 'edit', 'delete', 'export', 'print'],
  },
  {
    key: 'settings', label: 'Settings', labelBn: 'সেটিংস',
    actions: ['view', 'configure'],
    children: [
      { key: 'roles', label: 'Roles & Permissions', labelBn: 'ভূমিকা ও অনুমতি', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    ],
  },
]

// Flat lookup map: 'students.admission' → PermissionNode
const _flatMap = new Map<string, PermissionNode>()

function buildFlatMap(nodes: PermissionNode[], parentKey = '') {
  for (const node of nodes) {
    const fullKey = parentKey ? `${parentKey}.${node.key}` : node.key
    _flatMap.set(fullKey, node)
    if (node.children) buildFlatMap(node.children, fullKey)
  }
}
buildFlatMap(PERMISSION_TREE)

export function getPermissionNode(key: string): PermissionNode | undefined {
  return _flatMap.get(key)
}

export function getPermissionActions(key: string): PermissionAction[] {
  return getPermissionNode(key)?.actions || []
}

export function isValidPermissionKey(key: string): boolean {
  return _flatMap.has(key)
}

// Build a module → page flat list for sidebar/quick checks
export function getModuleKeys(): string[] {
  return PERMISSION_TREE.map((n) => n.key)
}

export function getChildKeys(moduleKey: string): string[] {
  const node = getPermissionNode(moduleKey)
  if (!node?.children) return []
  return node.children.map((c) => c.key)
}

// Role templates
export interface RoleTemplate {
  label: string
  labelBn: string
  description: string
  descriptionBn: string
  permissions: string[]   // permission keys to enable (view action)
  fullAccess?: string[]   // permission keys to enable all actions
  dataScope: DataScope
}

export type DataScope = 'own' | 'own_class' | 'own_department' | 'assigned' | 'all'

export const DATA_SCOPE_OPTIONS: { value: DataScope; label: string; labelBn: string }[] = [
  { value: 'own', label: 'Own Data', labelBn: 'নিজের তথ্য' },
  { value: 'own_class', label: 'Own Class', labelBn: 'নিজের শ্রেণি' },
  { value: 'own_department', label: 'Own Department', labelBn: 'নিজের বিভাগ' },
  { value: 'assigned', label: 'Assigned Students', labelBn: 'নির্ধারিত ছাত্র' },
  { value: 'all', label: 'All Data', labelBn: 'সকল তথ্য' },
]

export const ROLE_TEMPLATES: Record<string, RoleTemplate> = {
  teacher: {
    label: 'Teacher', labelBn: 'শিক্ষক',
    description: 'Academic modules — attendance, exams, classes, assignments',
    descriptionBn: 'একাডেমিক মডিউল — উপস্থিতি, পরীক্ষা, শ্রেণি, অ্যাসাইনমেন্ট',
    permissions: ['dashboard', 'classes', 'attendance', 'exams', 'syllabus', 'assignments', 'messages', 'notice'],
    dataScope: 'own_class',
  },
  class_teacher: {
    label: 'Class Teacher', labelBn: 'শ্রেণি শিক্ষক',
    description: 'Teacher + student management for assigned class',
    descriptionBn: 'শিক্ষক + নির্ধারিত শ্রেণির ছাত্র ব্যবস্থাপনা',
    permissions: ['dashboard', 'classes', 'attendance', 'exams', 'students', 'messages', 'notice'],
    fullAccess: ['attendance'],
    dataScope: 'own_class',
  },
  accountant: {
    label: 'Accountant', labelBn: 'হিসাব পরিচালক',
    description: 'Finance, fees, expenses, payroll access',
    descriptionBn: 'আর্থিক, ফি, খরচ, বেতন অ্যাক্সেস',
    permissions: ['dashboard', 'reports'],
    fullAccess: ['finance', 'payroll', 'store', 'accounting'],
    dataScope: 'all',
  },
  hr_manager: {
    label: 'HR Manager', labelBn: 'এইচআর ব্যবস্থাপক',
    description: 'Staff management, salary, facilities',
    descriptionBn: 'স্টাফ ব্যবস্থাপনা, বেতন, সুবিধা',
    permissions: ['dashboard', 'reports'],
    fullAccess: ['hr', 'teachers'],
    dataScope: 'all',
  },
  librarian: {
    label: 'Librarian', labelBn: 'গ্রন্থাগারিক',
    description: 'Full library module access',
    descriptionBn: 'সম্পূর্ণ লাইব্রেরি মডিউল অ্যাক্সেস',
    permissions: ['dashboard'],
    fullAccess: ['library'],
    dataScope: 'all',
  },
  exam_controller: {
    label: 'Exam Controller', labelBn: 'পরীক্ষা নিয়ন্ত্রক',
    description: 'Full exam module access',
    descriptionBn: 'সম্পূর্ণ পরীক্ষা মডিউল অ্যাক্সেস',
    permissions: ['dashboard', 'reports'],
    fullAccess: ['exams'],
    dataScope: 'all',
  },
  transport_staff: {
    label: 'Transport Staff', labelBn: 'পরিবহন স্টাফ',
    description: 'Transport and hostel management',
    descriptionBn: 'পরিবহন ও হোস্টেল ব্যবস্থাপনা',
    permissions: ['dashboard'],
    fullAccess: ['transport', 'hostel'],
    dataScope: 'all',
  },
  receptionist: {
    label: 'Receptionist', labelBn: 'রিসেপশনিস্ট',
    description: 'Student admission, basic info management',
    descriptionBn: 'ছাত্র ভর্তি, মৌলিক তথ্য ব্যবস্থাপনা',
    permissions: ['dashboard', 'messages', 'notice'],
    fullAccess: ['students'],
    dataScope: 'all',
  },
}

// Backward compatibility — flatten new tree to old PERMISSION_PAGES shape
export interface TabPermissionConfig {
  key: string
  label: string
  labelBn: string
}

export interface PagePermissionConfig {
  key: string
  label: string
  labelBn: string
  tabs: TabPermissionConfig[] | null
}

function flattenToPages(): PagePermissionConfig[] {
  return PERMISSION_TREE.map((node) => {
    if (!node.children) {
      return { key: node.key, label: node.label, labelBn: node.labelBn, tabs: null }
    }
    const tabs: TabPermissionConfig[] = []
    for (const child of node.children) {
      if (child.children) {
        for (const grandchild of child.children) {
          tabs.push({ key: grandchild.key, label: grandchild.label, labelBn: grandchild.labelBn })
        }
      } else {
        tabs.push({ key: child.key, label: child.label, labelBn: child.labelBn })
      }
    }
    return { key: node.key, label: node.label, labelBn: node.labelBn, tabs: tabs.length > 0 ? tabs : null }
  })
}

export const PERMISSION_PAGES: PagePermissionConfig[] = flattenToPages()

export function getPageConfig(pageKey: string): PagePermissionConfig | undefined {
  return PERMISSION_PAGES.find((p) => p.key === pageKey)
}

export function getTabConfig(pageKey: string, tabKey: string): TabPermissionConfig | undefined {
  const page = getPageConfig(pageKey)
  return page?.tabs?.find((t) => t.key === tabKey)
}
