import { lazy, Suspense, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const InstitutionLogin = lazy(() => import('@/pages/auth/InstitutionLogin'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))

export default function InstitutionLoginRoute() {
  const { subdomain } = useParams<{ subdomain: string }>()
  const authCtx = useContext(AuthContext)
  const user = authCtx?.user

  if (user && user.subdomain === subdomain) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardPage />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InstitutionLogin subdomain={subdomain || ''} />
    </Suspense>
  )
}
