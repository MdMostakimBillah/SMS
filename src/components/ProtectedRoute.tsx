import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LOGIN_PATH } from '@/lib/constants'

function getLoginRedirect(): string {
  try {
    // Check sessionStorage first (set by InstitutionLogin, not cleared by logout)
    const subdomain = sessionStorage.getItem('edutech_inst_subdomain')
    if (subdomain) return `/i/${subdomain}`
  } catch { /* ignore */ }
  return LOGIN_PATH
}

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={getLoginRedirect()} replace />

  return <Outlet />
}

export function RoleProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={getLoginRedirect()} replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
