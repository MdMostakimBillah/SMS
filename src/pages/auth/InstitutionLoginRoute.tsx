import { lazy, Suspense, useContext, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const InstitutionLogin = lazy(() => import('@/pages/auth/InstitutionLogin'))

export default function InstitutionLoginRoute() {
  const { slug } = useParams<{ slug: string }>()
  const authCtx = useContext(AuthContext)
  const user = authCtx?.user
  const storeInstitutions = useSuperAdminStore((s) => s.institutions)

  const institution = useMemo(() => {
    return storeInstitutions.find((i) => i.slug === slug) || null
  }, [slug, storeInstitutions])

  if (user && institution && user.subdomain === institution.subdomain) {
    const role = user.role === 'super_admin' ? 'admin' : user.role
    return <Navigate to={`/i/${slug}/${role}/dashboard`} replace />
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InstitutionLogin subdomain={institution?.subdomain || slug || ''} />
    </Suspense>
  )
}
