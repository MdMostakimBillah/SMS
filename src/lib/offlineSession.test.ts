import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveOfflineSession,
  getOfflineSession,
  clearOfflineSession,
  isOfflineSessionValid,
  OFFLINE_SESSION_KEY,
  type OfflineSessionData,
} from './offlineSession'

describe('offlineSession utility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const validSession: OfflineSessionData = {
    user: {
      id: 'usr-1',
      email: 'admin@school.com',
      name: 'School Admin',
      role: 'school_admin',
      schoolId: 'sch-1',
      schoolName: 'Ideal School',
      avatar: null,
      subdomain: 'ideal',
      schoolDomain: 'ideal',
    },
    savedAt: 1700000000000,
    slug: 'ideal',
    role: 'school_admin',
  }

  it('validates a correct session structure', () => {
    expect(isOfflineSessionValid(validSession)).toBe(true)
  })

  it('rejects invalid or corrupted session structures', () => {
    expect(isOfflineSessionValid(null)).toBe(false)
    expect(isOfflineSessionValid({})).toBe(false)
    expect(isOfflineSessionValid({ user: null, savedAt: 123 })).toBe(false)
    expect(isOfflineSessionValid({ user: { id: '', email: 'a@b.c', role: 'admin' }, savedAt: 123 })).toBe(false)
    expect(isOfflineSessionValid({ user: { id: '1', email: '', role: 'admin' }, savedAt: 123 })).toBe(false)
    expect(isOfflineSessionValid({ user: { id: '1', email: 'a@b.c', role: '' }, savedAt: 123 })).toBe(false)
    expect(isOfflineSessionValid({ user: { id: '1', email: 'a@b.c', role: 'admin' }, savedAt: 0 })).toBe(false)
  })

  it('saves and retrieves offline session from localStorage', () => {
    saveOfflineSession(validSession)
    const retrieved = getOfflineSession()
    expect(retrieved).toEqual(validSession)
  })

  it('returns null if key is missing or corrupted JSON', () => {
    expect(getOfflineSession()).toBeNull()
    localStorage.setItem(OFFLINE_SESSION_KEY, 'not-valid-json{')
    expect(getOfflineSession()).toBeNull()
  })

  it('clears offline session on demand', () => {
    saveOfflineSession(validSession)
    expect(getOfflineSession()).not.toBeNull()
    clearOfflineSession()
    expect(getOfflineSession()).toBeNull()
    expect(localStorage.getItem(OFFLINE_SESSION_KEY)).toBeNull()
  })
})
