import { describe, it, expect } from 'vitest'
import {
  mapPublicSchoolToInstitution,
  resolveInstitutionRecord,
} from './institutionResolver'
import { makeInstitution } from '@/test-fixtures'
import type { PublicSchool } from './api'

describe('institutionResolver', () => {
  it('mapPublicSchoolToInstitution preserves expiresAt, status, and storageMode from server payload', () => {
    const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const pub: PublicSchool = {
      id: 'inst-magnet',
      name: 'Magnet Smart Coaching',
      nameBn: 'ম্যাগনেট স্মার্ট কোচিং',
      domain: 'magnet',
      slug: 'magnet',
      status: 'active',
      package: 'Basic',
      expiresAt: futureExpiry,
      storageMode: 'local_computer',
      email: 'magnetmsc@gmail.com',
      phone: '01700000000',
      address: 'Dhaka',
      logo: '',
      startTime: '07:30',
      endTime: '14:30',
    }

    const mapped = mapPublicSchoolToInstitution(pub, 'magnet')
    expect(mapped.id).toBe('inst-magnet')
    expect(mapped.slug).toBe('magnet')
    expect(mapped.status).toBe('active')
    expect(mapped.expiresAt).toBe(futureExpiry)
    expect(mapped.storageMode).toBe('local_computer')
  })

  it('resolveInstitutionRecord resolves viewed tenant instead of platform school when super_admin is viewing', () => {
    const magnetExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const platform = makeInstitution({
      id: 'edutech-platform-id',
      name: 'EduTech',
      slug: 'edutech',
      subdomain: 'edutech',
      expiresAt: null,
      status: 'active',
    })
    const magnet = makeInstitution({
      id: 'inst-magnet',
      name: 'Magnet Smart Coaching',
      slug: 'magnet',
      subdomain: 'magnet',
      expiresAt: magnetExpiry,
      status: 'active',
      storageMode: 'local_computer',
    })

    const resolved = resolveInstitutionRecord({
      institutions: [platform, magnet],
      user: {
        role: 'super_admin',
        schoolId: 'edutech-platform-id',
        school: {
          id: 'edutech-platform-id',
          domain: 'edutech',
          expiresAt: null,
          status: 'active',
        },
      },
      viewingInstitutionId: 'inst-magnet',
      schoolSlug: 'magnet',
    })

    expect(resolved?.id).toBe('inst-magnet')
    expect(resolved?.name).toBe('Magnet Smart Coaching')
    expect(resolved?.expiresAt).toBe(magnetExpiry)
  })

  it('resolveInstitutionRecord does not let an institution entry missing expiresAt mask user.school.expiresAt', () => {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const staleStoreEntry = makeInstitution({
      id: 'inst-alhidayah',
      name: 'Al Hidayah',
      slug: 'alhidayah',
      subdomain: 'alhidayah',
      expiresAt: undefined,
    })

    const resolved = resolveInstitutionRecord({
      institutions: [staleStoreEntry],
      user: {
        role: 'school_admin',
        schoolId: 'inst-alhidayah',
        schoolDomain: 'alhidayah',
        school: {
          id: 'inst-alhidayah',
          domain: 'alhidayah',
          expiresAt: expiry,
          status: 'active',
        },
      },
      schoolSlug: 'alhidayah',
    })

    expect(resolved?.expiresAt).toBe(expiry)
    expect(resolved?.status).toBe('active')
  })

  it('resolveInstitutionRecord prefers live fetchedSchool metadata and falls back to classStore institution', () => {
    const liveExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    const staleExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    const resolvedFromLive = resolveInstitutionRecord({
      institutions: [
        makeInstitution({
          id: 'inst-tanjimul',
          slug: 'tanjimul',
          subdomain: 'tanjimul',
          expiresAt: staleExpiry,
        }),
      ],
      user: {
        role: 'school_admin',
        schoolId: 'inst-tanjimul',
        school: { id: 'inst-tanjimul', expiresAt: staleExpiry, status: 'active' },
      },
      schoolSlug: 'tanjimul',
      fetchedSchool: {
        id: 'inst-tanjimul',
        name: 'Tanjimul Hikmah',
        domain: 'tanjimul',
        expiresAt: liveExpiry,
        status: 'active',
      },
    })
    expect(resolvedFromLive?.expiresAt).toBe(liveExpiry)

    const fallbackExpiry = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const resolvedFromClassFallback = resolveInstitutionRecord({
      institutions: [],
      user: {
        role: 'school_admin',
        schoolId: 'inst-local',
      },
      schoolSlug: 'local-school',
      fallbackClassInstitution: {
        name: 'Local School',
        expiresAt: fallbackExpiry,
        status: 'active',
      },
    })
    expect(resolvedFromClassFallback?.expiresAt).toBe(fallbackExpiry)
  })
})
