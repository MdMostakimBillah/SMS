import type { PublicSchool } from '@/lib/api'
import {
  PACKAGES,
  type Institution,
  type InstitutionPackage,
  type InstitutionStatus,
} from '@/store/superAdminStore'

/**
 * Maps a server PublicSchool (or partial school payload) into a full `Institution`
 * record for `useSuperAdminStore`, preserving `expiresAt`, `status`, `storageMode`,
 * and any existing client-side fields when present.
 */
export function mapPublicSchoolToInstitution(
  s: PublicSchool,
  fallbackSlug?: string,
  existing?: Institution | null,
  availablePackages: InstitutionPackage[] = PACKAGES
): Institution {
  const domainSlug = s.slug || s.domain || fallbackSlug || existing?.slug || existing?.subdomain || ''
  const pkgName = (s.package || s.plan || existing?.package?.name || 'basic').toLowerCase()
  const pkg =
    availablePackages.find((p) => p.name.toLowerCase() === pkgName) ||
    existing?.package ||
    availablePackages[0] ||
    PACKAGES[0]

  let parsedSessions: string[] = existing?.sessions || ['2025-26']
  if (s.sessions) {
    try {
      const raw = typeof s.sessions === 'string' ? JSON.parse(s.sessions) : s.sessions
      if (Array.isArray(raw) && raw.length > 0) {
        parsedSessions = raw.filter(Boolean)
      }
    } catch {
      // keep existing/default sessions
    }
  }

  return {
    id: s.id || existing?.id || `INST-${domainSlug}`,
    name: s.name || existing?.name || 'Institution',
    nameBn: s.nameBn || existing?.nameBn || s.name || 'Institution',
    email: s.email ?? existing?.email ?? '',
    phone: s.phone ?? existing?.phone ?? '',
    address: s.address ?? existing?.address ?? '',
    addressBn: s.addressBn || existing?.addressBn || s.address || '',
    eiin: s.eiin ?? existing?.eiin ?? '',
    website: s.website || existing?.website || `smsappbd.vercel.app/i/${domainSlug}`,
    subdomain: domainSlug,
    slug: domainSlug,
    status: (s.status as InstitutionStatus) || existing?.status || 'active',
    package: pkg,
    expiresAt: s.expiresAt !== undefined ? s.expiresAt : (existing?.expiresAt ?? null),
    storageMode: s.storageMode || existing?.storageMode || 'cloud',
    serverUrl: s.serverUrl ?? existing?.serverUrl ?? '',
    folderName: s.folderName ?? existing?.folderName ?? '',
    storageBytes: s.storageBytes ?? existing?.storageBytes ?? 0,
    mediaCount: s.mediaCount ?? existing?.mediaCount ?? 0,
    createdAt: s.createdAt
      ? s.createdAt.split('T')[0]
      : existing?.createdAt || new Date().toISOString().split('T')[0],
    lastLogin: existing?.lastLogin || '-',
    logo: s.logo ?? existing?.logo ?? '',
    banner: s.banner ?? existing?.banner ?? '',
    brandColor: s.brandColor || existing?.brandColor || '#6366f1',
    brandName: s.brandName || existing?.brandName || s.name || 'EduTech',
    motto: s.motto ?? existing?.motto ?? '',
    mottoBn: s.mottoBn ?? existing?.mottoBn ?? '',
    startTime: s.startTime || existing?.startTime || '07:30',
    endTime: s.endTime || existing?.endTime || '14:30',
    optionalSubjects: existing?.optionalSubjects || [],
    sessions: parsedSessions,
    currentSession: existing?.currentSession,
    accessModes: existing?.accessModes || {
      pathBased: true,
      subdomainBased: true,
      customDomain: '',
    },
    language: existing?.language || 'en',
    theme: existing?.theme || 'light',
  }
}

export interface ResolveInstitutionInput {
  institutions: Institution[]
  user?: {
    role?: string
    schoolId?: string | null
    institutionId?: string | null
    schoolDomain?: string | null
    subdomain?: string | null
    school?: any
  } | null
  viewingInstitutionId?: string | null
  schoolSlug?: string | null
  eiin?: string | null
  fetchedSchool?: Partial<PublicSchool> | null
  fallbackClassInstitution?: {
    name?: string
    nameBn?: string
    eiin?: string
    expiresAt?: string | null
    status?: string
  } | null
}

export interface ResolvedInstitutionRecord {
  id?: string
  name?: string
  nameBn?: string
  slug?: string
  subdomain?: string
  eiin?: string
  status: string
  expiresAt: string | null
  package?: InstitutionPackage
  [key: string]: any
}

function pickValidExpiry(...candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim() !== '') {
      return String(c)
    }
  }
  return null
}

/**
 * Resolves the active institution record for Dashboard, AppLayout, and Subscription settings.
 *
 * Key invariants:
 * 1. When a `super_admin` is viewing a tenant (`viewingInstitutionId`), it resolves
 *    strictly to that tenant — never to the platform account (`user.schoolId` / `user.school`).
 * 2. Live `fetchedSchool` metadata from the server takes precedence for `expiresAt` and `status`,
 *    while preventing an `institutions` store entry missing `expiresAt` from shadowing
 *    `user.school.expiresAt` or `classStore.institution.expiresAt`.
 */
export function resolveInstitutionRecord({
  institutions,
  user,
  viewingInstitutionId,
  schoolSlug,
  eiin,
  fetchedSchool,
  fallbackClassInstitution,
}: ResolveInstitutionInput): ResolvedInstitutionRecord | null {
  const isSuperAdmin = user?.role === 'super_admin'
  const isViewing = isSuperAdmin && Boolean(viewingInstitutionId)

  if (isViewing && viewingInstitutionId) {
    const matched =
      institutions.find(
        (i) =>
          i.id === viewingInstitutionId ||
          i.slug === viewingInstitutionId ||
          i.subdomain === viewingInstitutionId ||
          (schoolSlug && schoolSlug !== 'edutech' && (i.slug === schoolSlug || i.subdomain === schoolSlug))
      ) || null

    if (!matched && !fetchedSchool && !fallbackClassInstitution?.expiresAt) {
      return null
    }

    const expiresAt =
      fetchedSchool && fetchedSchool.expiresAt !== undefined
        ? fetchedSchool.expiresAt
        : matched?.expiresAt !== undefined
        ? matched.expiresAt
        : fallbackClassInstitution?.expiresAt ?? null

    const status =
      fetchedSchool?.status ||
      matched?.status ||
      fallbackClassInstitution?.status ||
      'active'

    return {
      ...(matched || {}),
      ...(fetchedSchool || {}),
      id: fetchedSchool?.id || matched?.id || viewingInstitutionId,
      name: fetchedSchool?.name || matched?.name || fallbackClassInstitution?.name,
      nameBn: fetchedSchool?.nameBn || matched?.nameBn || fallbackClassInstitution?.nameBn,
      slug: fetchedSchool?.slug || fetchedSchool?.domain || matched?.slug || schoolSlug || undefined,
      subdomain: fetchedSchool?.domain || matched?.subdomain || schoolSlug || undefined,
      eiin: fetchedSchool?.eiin || matched?.eiin || fallbackClassInstitution?.eiin,
      package: matched?.package,
      status,
      expiresAt: expiresAt ?? null,
    }
  }

  const userSchool = user?.school || null
  const slugCandidates = [
    schoolSlug,
    user?.schoolDomain,
    userSchool?.domain,
    userSchool?.slug,
    user?.subdomain,
  ].filter((s): s is string => Boolean(s && s !== 'edutech'))

  const matched =
    institutions.find(
      (i) =>
        (user?.schoolId && i.id === user.schoolId) ||
        (userSchool?.id && i.id === userSchool.id) ||
        (user?.institutionId && i.id === user.institutionId) ||
        slugCandidates.some((s) => i.slug === s || i.subdomain === s) ||
        (schoolSlug === 'edutech' && (i.slug === 'edutech' || i.subdomain === 'edutech')) ||
        (eiin && i.eiin === eiin)
    ) || null

  if (!matched && !userSchool && !fetchedSchool && !fallbackClassInstitution?.expiresAt) {
    return null
  }

  // When fetched live from the server, treat its `expiresAt` (including explicit `null`) as authoritative.
  // Otherwise prefer non-empty `userSchool.expiresAt` / `matched.expiresAt` / `fallbackClassInstitution.expiresAt`
  // so a store entry missing `expiresAt` never masks a valid subscription expiry.
  const expiresAt =
    fetchedSchool && fetchedSchool.expiresAt !== undefined
      ? fetchedSchool.expiresAt
      : pickValidExpiry(
          userSchool?.expiresAt,
          matched?.expiresAt,
          fallbackClassInstitution?.expiresAt
        )

  const status =
    fetchedSchool?.status ||
    userSchool?.status ||
    matched?.status ||
    fallbackClassInstitution?.status ||
    'active'

  return {
    ...(userSchool || {}),
    ...(matched || {}),
    ...(fetchedSchool || {}),
    id: fetchedSchool?.id || matched?.id || userSchool?.id || user?.schoolId || undefined,
    name: fetchedSchool?.name || matched?.name || userSchool?.name || fallbackClassInstitution?.name,
    nameBn: fetchedSchool?.nameBn || matched?.nameBn || userSchool?.nameBn || fallbackClassInstitution?.nameBn,
    slug: fetchedSchool?.slug || fetchedSchool?.domain || matched?.slug || userSchool?.slug || userSchool?.domain,
    subdomain: fetchedSchool?.domain || matched?.subdomain || userSchool?.domain,
    eiin: fetchedSchool?.eiin || matched?.eiin || userSchool?.eiin || fallbackClassInstitution?.eiin,
    package: matched?.package || userSchool?.package,
    status,
    expiresAt: expiresAt ?? null,
  }
}
