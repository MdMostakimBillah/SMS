import { Suspense, useContext, useMemo, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import { useSuperAdminStore, PACKAGES } from '@/store/superAdminStore'
import { clearSlug } from '@/lib/storage'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { authApi } from '@/lib/api'

const InstitutionLogin = lazyWithRetry(() => import('@/pages/auth/InstitutionLogin'))

export default function InstitutionLoginRoute() {
  const { slug } = useParams<{ slug: string }>()
  const authCtx = useContext(AuthContext)
  const user = authCtx?.user
  const storeInstitutions = useSuperAdminStore((s) => s.institutions) ?? []
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)
  const stopViewing = useSuperAdminStore((s) => s.stopViewing)

  const institution = useMemo(() => {
    return storeInstitutions.find((i) => i.slug === slug || i.subdomain === slug) || null
  }, [slug, storeInstitutions])

  useEffect(() => {
    if (slug && !institution) {
      authApi
        .getPublicSchool(slug)
        .then((res) => {
          if (res?.school) {
            useSuperAdminStore.getState().addInstitution({
              id: res.school.id,
              name: res.school.name,
              nameBn: res.school.nameBn || res.school.name,
              email: res.school.email || '',
              phone: res.school.phone || '',
              address: res.school.address || '',
              addressBn: res.school.address || '',
              eiin: '',
              website: `smsappbd.vercel.app/i/${res.school.domain}`,
              subdomain: res.school.domain,
              slug: res.school.domain,
              status: 'active',
              package: PACKAGES[0],
              createdAt: new Date().toISOString().split('T')[0],
              lastLogin: '-',
              logo: res.school.logo || '',
              banner: '',
              brandColor: '#6366f1',
              brandName: res.school.name,
              motto: '',
              mottoBn: '',
              startTime: res.school.startTime || '07:30',
              endTime: res.school.endTime || '14:30',
              optionalSubjects: [],
              sessions: ['2025-26'],
              accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
              language: 'en',
              theme: 'light',
            })
          }
        })
        .catch(() => {
          /* school not found in db */
        })
    }
  }, [slug, institution])

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
