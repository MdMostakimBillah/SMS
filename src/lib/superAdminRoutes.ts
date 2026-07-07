export interface SuperAdminRoute {
  id: string
  path: string
  label: string
  labelBn: string
  icon: string
  color: string
  desc: string
  descBn: string
  functional: boolean
}

export const SUPER_ADMIN_ROUTES: SuperAdminRoute[] = [
  { id: 'account', path: '/super-admin/account', label: 'Account', labelBn: 'অ্যাকাউন্ট', icon: 'lock', color: '#6366f1', desc: 'Email & password', descBn: 'ইমেইল ও পাসওয়ার্ড', functional: true },
  { id: 'schools', path: '/super-admin/schools', label: 'Schools', labelBn: 'স্কুল', icon: 'building-2', color: '#14b8a6', desc: 'Registered', descBn: 'নিবন্ধিত', functional: false },
  { id: 'requests', path: '/super-admin/requests', label: 'Requests', labelBn: 'অনুরোধ', icon: 'users', color: '#f59e0b', desc: 'Pending', descBn: 'পেন্ডিং', functional: false },
  { id: 'subscriptions', path: '/super-admin/subscriptions', label: 'Packages', labelBn: 'প্যাকেজ', icon: 'credit-card', color: '#ec4899', desc: 'Subscriptions', descBn: 'সাবস্ক্রিপশন', functional: false },
  { id: 'sms', path: '/super-admin/sms', label: 'SMS', labelBn: 'SMS', icon: 'message-square', color: '#06b6d4', desc: 'Provider', descBn: 'প্রোভাইডার', functional: false },
  { id: 'database', path: '/super-admin/database', label: 'Database', labelBn: 'ডাটাবেজ', icon: 'database', color: '#22c55e', desc: 'Backup', descBn: 'ব্যাকআপ', functional: false },
  { id: 'add-school', path: '/super-admin/add-school', label: 'Add School', labelBn: 'নতুন স্কুল', icon: 'crown', color: '#3b82f6', desc: 'Register', descBn: 'যোগ', functional: false },
  { id: 'notices', path: '/super-admin/notices', label: 'Notices', labelBn: 'নোটিশ', icon: 'bell', color: '#f97316', desc: 'System', descBn: 'বার্তা', functional: false },
  { id: 'status', path: '/super-admin/status', label: 'Status', labelBn: 'স্ট্যাটাস', icon: 'globe', color: '#10b981', desc: 'App', descBn: 'সিস্টেম', functional: false },
  { id: 'payments', path: '/super-admin/payments', label: 'Payments', labelBn: 'পেমেন্ট', icon: 'file-text', color: '#a855f7', desc: 'Institution', descBn: 'প্রতিষ্ঠান', functional: false },
]

export const SUPER_ADMIN_PATH_MAP: Record<string, string> = {
  '/super-admin': 'home',
}
SUPER_ADMIN_ROUTES.forEach((r) => { SUPER_ADMIN_PATH_MAP[r.path] = r.id })

export const SUPER_ADMIN_REVERSE_MAP: Record<string, string> = {
  home: '/super-admin',
}
SUPER_ADMIN_ROUTES.forEach((r) => { SUPER_ADMIN_REVERSE_MAP[r.id] = r.path })
