import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LOGIN_PATH } from '@/lib/constants'
import { INSTITUTION_ROLES, type InstitutionRole } from '@/lib/navUtils'

function getLoginRedirect(): string {
  try {
    const slug = sessionStorage.getItem('edutech_inst_slug')
    if (slug) return `/i/${slug}`
  } catch { /* ignore */ }
  return LOGIN_PATH
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { role } = useParams<{ role: string }>()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={getLoginRedirect()} replace />

  if (role && INSTITUTION_ROLES.includes(role as InstitutionRole)) {
    const userRole = user.role === 'super_admin' ? 'admin' : user.role
    if (role !== userRole) {
      const slug = sessionStorage.getItem('edutech_inst_slug')
      if (slug) return <Navigate to={`/i/${slug}/${userRole}/dashboard`} replace />
      return <Navigate to={`/${userRole}/dashboard`} replace />
    }
  }

  return <Outlet />
}

export function RoleProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={getLoginRedirect()} replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/admin/dashboard" replace />

  return <Outlet />
}
