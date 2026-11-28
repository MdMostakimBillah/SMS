import { Suspense, useContext, useMemo, useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { mapPublicSchoolToInstitution } from '@/lib/institutionResolver'
import { clearSlug } from '@/lib/storage'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { authApi } from '@/lib/api'
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen'
import NotFoundPage from '@/pages/NotFound'

const InstitutionLogin = lazyWithRetry(() => import('@/pages/auth/InstitutionLogin'))

export default function InstitutionLoginRoute() {
  const { slug } = useParams<{ slug: string }>()
  const authCtx = useContext(AuthContext)
  const user = authCtx?.user
  const storeInstitutions = useSuperAdminStore((s) => s.institutions) ?? []
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)
  const stopViewing = useSuperAdminStore((s) => s.stopViewing)

  const institution = useMemo(() => {
    return storeInstitutions.find((i) => i.slug === slug || i.subdomain === slug || i.id === slug) || null
  }, [slug, storeInstitutions])

  const [loadingSchool, setLoadingSchool] = useState(!institution && !!slug)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!slug) {
      setLoadingSchool(false)
      setNotFound(true)
      return
    }

    setLoadingSchool(true)
    authApi
      .getPublicSchool(slug)
      .then((res) => {
        if (!mounted) return
        if (res?.school) {
          const s = res.school
          const existing = useSuperAdminStore
            .getState()
            .institutions.find((i) => i.id === s.id || i.slug === slug || i.subdomain === slug)
          const inst = mapPublicSchoolToInstitution(s, slug, existing)
          useSuperAdminStore.getState().addInstitution(inst)
          setNotFound(false)
        } else {
          useSuperAdminStore.getState().deleteInstitution(slug)
          setNotFound(true)
        }
      })
      .catch((err: any) => {
        if (!mounted) return
        if (err?.status === 404 || err?.message?.toLowerCase().includes('not found')) {
          useSuperAdminStore.getState().deleteInstitution(slug)
          setNotFound(true)
        }
      })
      .finally(() => {
        if (mounted) setLoadingSchool(false)
      })

    return () => {
      mounted = false
    }
  }, [slug])

  if (loadingSchool && !institution && !notFound) {
    return <BrandLoadingScreen />
  }

  // Institution not found or removed — path is removed
  if (notFound || (!loadingSchool && !institution)) {
    return <NotFoundPage />
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
      <Suspense fallback={<BrandLoadingScreen />}>
        <InstitutionLogin institution={institution} subdomain={institution.subdomain} />
      </Suspense>
    )
  }

  // Already logged in — redirect to dashboard
  if (user && institution && (user.subdomain === institution.subdomain || user.subdomain === institution.slug)) {
    const isViewing = user.role === 'super_admin' && (viewingInstitutionId || sessionStorage.getItem('edutech_viewing_id'))
    if (isViewing) {
      return <Navigate to="/super-admin/viewing/admin/dashboard" replace />
    }
    const role = (user.role === 'super_admin' || user.role === 'school_admin') ? 'admin' : user.role
    return <Navigate to={`/i/${institution.slug}/${role}/dashboard`} replace />
  }

  return (
    <Suspense fallback={<BrandLoadingScreen />}>
      <InstitutionLogin institution={institution ?? undefined} subdomain={institution?.subdomain || slug} />
    </Suspense>
  )
}
