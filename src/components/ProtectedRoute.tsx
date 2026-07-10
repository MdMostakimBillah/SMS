import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LOGIN_PATH } from '@/lib/constants'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={LOGIN_PATH} replace />

  return <Outlet />
}

export function RoleProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={LOGIN_PATH} replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
