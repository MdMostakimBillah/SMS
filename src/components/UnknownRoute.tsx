import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen'
import NotFoundPage from '@/pages/NotFound'

/**
 * Wildcard route handler:
 * - Not signed in → redirect to /register
 * - Signed in → show 404 page
 */
export function UnknownRoute() {
  const { user, loading } = useAuth()
  if (loading) return <BrandLoadingScreen />
  if (user) return <NotFoundPage />
  return <Navigate to="/register" replace />
}
