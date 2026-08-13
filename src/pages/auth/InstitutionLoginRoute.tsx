import { Suspense, useContext, useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { clearSlug } from '@/lib/storage'
import { lazyWithRetry } from '@/lib/lazyWithRetry'

const InstitutionLogin = lazyWithRetry(() => import('@/pages/auth/InstitutionLogin'))

export default function InstitutionLoginRoute() {
  const { slug } = useParams<{ slug: string }>()
  const authCtx = useContext(AuthContext)
  const user = authCtx?.user
  const storeInstitutions = useSuperAdminStore((s) => s.institutions)
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)
  const stopViewing = useSuperAdminStore((s) => s.stopViewing)

  const institution = useMemo(() => {
    return storeInstitutions.find((i) => i.slug === slug) || null
  }, [slug, storeInstitutions])

  // Institution not found
  if (slug && !institution) {
    return (
      <Suspense fallback={null}>
        <InstitutionLogin subdomain={slug} />
      </Suspense>
    )
  }

  // Suspended or inactive — force logout and show suspended screen
  if (institution && (institution.status === 'suspended' || institution.status === 'inactive')) {
    // If user is logged in to this institution, log them out
    if (user && user.subdomain === institution.subdomain) {
      clearSlug()
      stopViewing()
      localStorage.removeItem('edutech_user')
    }
    return (
      <Suspense fallback={null}>
        <InstitutionLogin subdomain={institution.subdomain} />
      </Suspense>
    )
  }

  // Already logged in — redirect to dashboard
  if (user && institution && user.subdomain === institution.subdomain) {
    const isViewing = user.role === 'super_admin' && (viewingInstitutionId || sessionStorage.getItem('edutech_viewing_id'))
    if (isViewing) {
      return <Navigate to="/super-admin/viewing/admin/dashboard" replace />
    }
    const role = user.role === 'super_admin' ? 'admin' : user.role
    return <Navigate to={`/i/${slug}/${role}/dashboard`} replace />
  }

  return (
    <Suspense fallback={null}>
      <InstitutionLogin subdomain={institution?.subdomain || slug || ''} />
    </Suspense>
  )
}
