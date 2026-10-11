import type { Institution } from '@/store/superAdminStore'

/**
 * Shared test fixtures (Phase 6 credential tests).
 *
 * Import only from test files — this module is never part of the production
 * dependency graph, so tree-shaking keeps it out of the bundle.
 */

/** Full `Institution` factory; `password` is a session-only field (Phase 6). */
export function makeInstitution(overrides: Partial<Institution> = {}): Institution {
  return {
    id: 'INST-1',
    name: 'Test School',
    nameBn: 'টেস্ট স্কুল',
    email: 'admin@test.bd',
    phone: '01700000000',
    address: 'Dhaka',
    addressBn: 'ঢাকা',
    eiin: '12345',
    website: '',
    subdomain: 'testschool',
    slug: 'testschool',
    status: 'active',
    package: {
      name: 'Basic',
      nameBn: 'বেসিক',
      maxStudents: 200,
      maxTeachers: 25,
      maxClasses: 99,
      pricePerStudent: 10,
      price: 2000,
      duration: 12,
    },
    createdAt: '2026-01-01',
    lastLogin: '',
    logo: '',
    banner: '',
    brandColor: '#6366f1',
    brandName: 'Test',
    motto: '',
    mottoBn: '',
    startTime: '07:30',
    endTime: '14:30',
    optionalSubjects: [],
    sessions: ['2025-26'],
    accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
    language: 'en',
    theme: 'light',
    ...overrides,
  }
}

/** Concatenated values of localStorage + sessionStorage, for leak assertions. */
export function browserStorageDump(): string {
  const parts: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    parts.push(localStorage.getItem(key) || '')
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)!
    parts.push(sessionStorage.getItem(key) || '')
  }
  return parts.join('\n')
}
