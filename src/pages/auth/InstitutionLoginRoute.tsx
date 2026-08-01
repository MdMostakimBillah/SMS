import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const InstitutionLogin = lazy(() => import('@/pages/auth/InstitutionLogin'))

export default function InstitutionLoginRoute() {
  const { subdomain } = useParams<{ subdomain: string }>()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InstitutionLogin subdomain={subdomain || ''} />
    </Suspense>
  )
}
