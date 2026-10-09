import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath } from '@/lib/navUtils'

export function AuthRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to={getDashboardPath(user)} replace />

  return <Outlet />
}
