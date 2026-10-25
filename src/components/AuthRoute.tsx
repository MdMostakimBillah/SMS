import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath } from '@/lib/navUtils'
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen'

export function AuthRoute() {
  const { user, loading } = useAuth()

  if (loading) return <BrandLoadingScreen />
  if (user) return <Navigate to={getDashboardPath(user)} replace />

  return <Outlet />
}
