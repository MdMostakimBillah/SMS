import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LOGIN_PATH } from '@/lib/constants'
import { INSTITUTION_ROLES, type InstitutionRole } from '@/lib/navUtils'

function getLoginRedirect(): string {
  try {
    const slug = sessionStorage.getItem('edutech_inst_slug')
    if (slug) return `/i/${slug}`
  } catch { /* ignore */ }
  return LOGIN_PATH ? `${LOGIN_PATH}/login` : '/register'
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { role } = useParams<{ role: string }>()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={getLoginRedirect()} replace />

  const isViewing = user.role === 'super_admin' && (!!viewingInstitutionId || !!sessionStorage.getItem('edutech_viewing_id'))

  if (role && INSTITUTION_ROLES.includes(role as InstitutionRole)) {
    if (isViewing) {
      const allowedViewingRoles = ['admin', 'teacher', 'student', 'supervisor', 'manager', 'staff', 'guardian']
      if (!allowedViewingRoles.includes(role)) {
        return <Navigate to="/super-admin/viewing/admin/dashboard" replace />
      }
    } else {
      const userRole = user.role === 'super_admin' ? 'admin' : user.role
      if (role !== userRole) {
        const slug = sessionStorage.getItem('edutech_inst_slug')
        if (user.role === 'super_admin') return <Navigate to="/super-admin/admin/dashboard" replace />
        if (slug) return <Navigate to={`/i/${slug}/${userRole}/dashboard`} replace />
        return <Navigate to={`/${userRole}/dashboard`} replace />
      }
    }
  }

  return <Outlet />
}

export function ViewingRoute() {
  const { user, loading } = useAuth()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={getLoginRedirect()} replace />
  if (user.role !== 'super_admin') return <Navigate to="/super-admin/admin/dashboard" replace />
  if (!viewingInstitutionId && !sessionStorage.getItem('edutech_viewing_id')) return <Navigate to="/super-admin/schools" replace />

  return <Outlet />
}

export function RoleProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={getLoginRedirect()} replace />
  if (!allowedRoles.includes(user.role)) {
    const slug = sessionStorage.getItem('edutech_inst_slug')
    if (user.role === 'super_admin') return <Navigate to="/super-admin/admin/dashboard" replace />
    if (slug) return <Navigate to={`/i/${slug}/${user.role}/dashboard`} replace />
    return <Navigate to="/super-admin/admin/dashboard" replace />
  }

  return <Outlet />
}
