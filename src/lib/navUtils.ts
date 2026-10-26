import type { ResolvedInstitution } from '@/hooks/useSubdomain'
import { LOGIN_ROUTE } from '@/lib/constants'

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
  const role = (user.role === 'super_admin' || user.role === 'school_admin') ? 'admin' : user.role
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

export interface DashboardSession {
  /** Institution slug when the user is working inside one. */
  slug: string | null
  /** Set while a super admin is previewing another institution. */
  viewingId: string | null
}

function readDashboardSession(): DashboardSession {
  return {
    slug: sessionStorage.getItem('edutech_inst_slug'),
    viewingId: sessionStorage.getItem('edutech_viewing_id'),
  }
}

/**
 * Resolve "the dashboard" for whoever is signed in.
 *
 * `/dashboard` is not a page of its own — it is the entry point the installed
 * PWA launches into (`start_url`) and the target of the palette's Dashboard
 * command — so it always has to be resolved against the signed-in user. This
 * used to be hand-rolled, each time slightly differently, in four places, which
 * is how the PWA ended up dropping super admins on the 404 route.
 *
 * Signed-out visitors get `/`, where `AuthRoute` shows the public landing page.
 */
export function getDashboardPath(
  user: { role: string } | null,
  session: DashboardSession = readDashboardSession()
): string {
  if (!user) return '/'
  if (session.viewingId) return '/super-admin/viewing/admin/dashboard'
  if (user.role === 'super_admin') return '/super-admin/admin/dashboard'
  if (session.slug) {
    const role = (user.role === 'super_admin' || user.role === 'school_admin') ? 'admin' : user.role
    return `/i/${session.slug}/${role}/dashboard`
  }
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

/**
 * Where to send someone after they log out.
 *
 * Takes the role from the *server-restored* session user only — it is a pure
 * function of its arguments and never reads localStorage/sessionStorage for
 * identity, so a stale `edutech_user` value can neither grant a redirect nor
 * alter it. Institution admins go back to their institution landing page;
 * everyone else goes to the configured login route (an obscurity entry
 * point — see LOGIN_ROUTE in constants.ts).
 */
export function getLogoutRedirect(role?: string | null, slug?: string | null): string {
  if (role === 'admin' && slug) return `/i/${slug}`
  return LOGIN_ROUTE
}
