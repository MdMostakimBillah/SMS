import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardPath } from '@/lib/navUtils'

/**
 * `/dashboard` is the URL the installed PWA launches into (`start_url`), but it
 * is not a page of its own — it has to be resolved against whoever is signed in.
 * Without this route it fell through to the `*` catch-all, so opening the app
 * dropped a signed-in super admin on the 404 page.
 */
export function DashboardRoute() {
  const { user, loading } = useAuth()

  // `AuthRoute` renders nothing while the session resolves too; the boot loader
  // in AppLayout is what the user actually sees during that window.
  if (loading) return null

  return <Navigate to={getDashboardPath(user)} replace />
}
