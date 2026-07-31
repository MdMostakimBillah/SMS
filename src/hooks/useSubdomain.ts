import { useMemo } from 'react'
import { useSuperAdminStore } from '@/store/superAdminStore'

const BASE_DOMAIN = 'smsappbd.vercel.app'

export function useSubdomain() {
  const institutions = useSuperAdminStore((s) => s.institutions)

  const result = useMemo(() => {
    const hostname = window.location.hostname
    const isSubdomain = hostname !== BASE_DOMAIN && hostname !== `www.${BASE_DOMAIN}` && hostname !== 'localhost'

    if (!isSubdomain) return { isSubdomain: false, institution: null, subdomain: null }

    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '').replace('.localhost', '')
    const institution = institutions.find((inst) => inst.subdomain === subdomain) || null

    return { isSubdomain: true, institution, subdomain }
  }, [institutions])

  return result
}
