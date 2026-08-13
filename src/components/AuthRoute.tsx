import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function AuthRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) {
    const slug = sessionStorage.getItem('edutech_inst_slug')
    const viewingId = sessionStorage.getItem('edutech_viewing_id')
    if (viewingId) return <Navigate to="/super-admin/viewing/admin/dashboard" replace />
    if (slug) return <Navigate to={`/i/${slug}/${user.role}/dashboard`} replace />
    return <Navigate to="/super-admin/admin/dashboard" replace />
  }

  return <Outlet />
}
