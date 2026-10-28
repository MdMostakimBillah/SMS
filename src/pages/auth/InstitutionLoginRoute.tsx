import { Suspense, useContext, useMemo, useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { AuthContext } from '@/contexts/AuthContext'
import { useSuperAdminStore, PACKAGES, type Institution } from '@/store/superAdminStore'
import { clearSlug } from '@/lib/storage'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { authApi } from '@/lib/api'
import { BrandLoadingScreen } from '@/components/ui/BrandLoadingScreen'

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

  useEffect(() => {
    let mounted = true
    if (slug && !institution) {
      setLoadingSchool(true)
      authApi
        .getPublicSchool(slug)
        .then((res) => {
          if (!mounted) return
          if (res?.school) {
            const s = res.school
            const domainSlug = s.slug || s.domain || slug
            const pkg = PACKAGES.find((p) => p.name.toLowerCase() === (s.package || 'basic').toLowerCase()) || PACKAGES[0]
            const inst: Institution = {
              id: s.id || `INST-${domainSlug}`,
              name: s.name,
              nameBn: s.nameBn || s.name,
              email: s.email || '',
              phone: s.phone || '',
              address: s.address || '',
              addressBn: s.addressBn || s.address || '',
              eiin: s.eiin || '',
              website: s.website || `smsappbd.vercel.app/i/${domainSlug}`,
              subdomain: domainSlug,
              slug: domainSlug,
              status: (s.status as any) || 'active',
              package: pkg,
              createdAt: s.createdAt ? s.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              lastLogin: '-',
              logo: s.logo || '',
              banner: s.banner || '',
              brandColor: s.brandColor || '#6366f1',
              brandName: s.brandName || s.name,
              motto: s.motto || '',
              mottoBn: s.mottoBn || '',
              startTime: s.startTime || '07:30',
              endTime: s.endTime || '14:30',
              optionalSubjects: [],
              sessions: s.sessions ? (typeof s.sessions === 'string' ? JSON.parse(s.sessions) : s.sessions) : ['2025-26'],
              accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
              language: 'en',
              theme: 'light',
            }
            useSuperAdminStore.getState().addInstitution(inst)
          }
        })
        .catch(() => {
          /* school not found in db */
        })
        .finally(() => {
          if (mounted) setLoadingSchool(false)
        })
    } else {
      setLoadingSchool(false)
    }
    return () => {
      mounted = false
    }
  }, [slug, institution])

  if (loadingSchool && !institution) {
    return <BrandLoadingScreen />
  }

  // Institution not found
  if (slug && !institution) {
    return (
      <Suspense fallback={<BrandLoadingScreen />}>
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
