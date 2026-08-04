import { useMemo } from 'react'
import { useSuperAdminStore, type Institution } from '@/store/superAdminStore'

const BASE_DOMAIN = 'smsappbd.vercel.app'

export type AccessMode = 'path' | 'subdomain' | 'custom-domain'

export interface ResolvedInstitution {
  institution: Institution
  mode: AccessMode
  slug: string
}

export function resolveInstitution(
  hostname: string,
  pathname: string,
  institutions: Institution[]
): ResolvedInstitution | null {
  // 1. Check custom domains (most specific)
  const customMatch = institutions.find(
    (inst) => inst.accessModes?.customDomain && hostname === inst.accessModes.customDomain
  )
  if (customMatch) {
    return { institution: customMatch, mode: 'custom-domain', slug: customMatch.slug }
  }

  // 2. Check subdomain (hostname-based)
  const isSubdomain = hostname !== BASE_DOMAIN
    && hostname !== `www.${BASE_DOMAIN}`
    && !hostname.includes('localhost')
  if (isSubdomain) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '').replace('.localhost', '')
    const inst = institutions.find((i) => i.subdomain === subdomain && i.accessModes?.subdomainBased)
    if (inst) return { institution: inst, mode: 'subdomain', slug: inst.slug }
  }

  // 3. Check path-based: /i/:slug
  const pathMatch = pathname.match(/^\/i\/([^/]+)/)
  if (pathMatch) {
    const slug = pathMatch[1]
    const inst = institutions.find((i) => i.slug === slug && i.accessModes?.pathBased)
    if (inst) return { institution: inst, mode: 'path', slug: inst.slug }
  }

  return null
}

export function useSubdomain() {
  const institutions = useSuperAdminStore((s) => s.institutions)

  const result = useMemo(() => {
    const resolved = resolveInstitution(window.location.hostname, window.location.pathname, institutions)
    if (resolved) {
      return { isSubdomain: true, institution: resolved.institution, subdomain: resolved.institution.subdomain, resolved }
    }
    return { isSubdomain: false, institution: null, subdomain: null, resolved: null }
  }, [institutions])

  return result
}
