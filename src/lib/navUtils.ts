import type { ResolvedInstitution } from '@/hooks/useSubdomain'

export const INSTITUTION_ROLES = ['admin', 'manager', 'teacher', 'supervisor', 'guardian', 'student', 'staff'] as const
export type InstitutionRole = typeof INSTITUTION_ROLES[number]

export const ROLE_LABELS: Record<InstitutionRole, { en: string; bn: string }> = {
  admin: { en: 'Admin', bn: 'অ্যাডমিন' },
  manager: { en: 'Manager', bn: 'ম্যানেজার' },
  teacher: { en: 'Teacher', bn: 'শিক্ষক' },
  supervisor: { en: 'Supervisor', bn: 'পরিদর্শক' },
  guardian: { en: 'Guardian', bn: 'অভিভাবক' },
  student: { en: 'Student', bn: 'ছাত্র' },
  staff: { en: 'Staff', bn: 'কর্মচারী' },
}

export function getNavBase(user: { role: string } | null, resolved: ResolvedInstitution | null): string {
  if (!user || !resolved) return ''
  const { mode, slug } = resolved
  const role = user.role === 'super_admin' ? 'admin' : user.role
  if (mode === 'path') return `/i/${slug}/${role}`
  return `/${role}`
}

export function getSuperAdminViewNavBase(user: { role: string } | null, role?: string): string {
  if (!user || user.role !== 'super_admin') return ''
  const r = role || 'admin'
  return `/super-admin/viewing/${r}`
}

export function getLoginPath(resolved: ResolvedInstitution | null): string {
  if (!resolved) return '/login'
  const { mode, slug } = resolved
  if (mode === 'path') return `/i/${slug}`
  return '/'
}

export function getRoleFromPath(pathname: string): InstitutionRole | null {
  const parts = pathname.split('/').filter(Boolean)

  if (parts[0] === 'i' && parts.length >= 3) {
    const role = parts[2]
    if (INSTITUTION_ROLES.includes(role as InstitutionRole)) return role as InstitutionRole
  }

  if (parts[0] === 'super-admin' && parts[1] === 'viewing' && parts.length >= 4) {
    const role = parts[2]
    if (INSTITUTION_ROLES.includes(role as InstitutionRole)) return role as InstitutionRole
  }

  if (parts.length >= 2 && INSTITUTION_ROLES.includes(parts[0] as InstitutionRole)) {
    return parts[0] as InstitutionRole
  }

  return null
}
