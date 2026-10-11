import { describe, it, expect, beforeEach, vi } from 'vitest'
import { browserStorageDump } from '@/test-fixtures'

const KEY = 'edutech-staff-permissions'
const SLUG_KEY = 'edutech-staff-permissions_seedslug'
const SETTINGS_KEY = 'edutech-settings'
const SECRET = 'Staff-Secret-Pw-555!'

function legacyStaffMember(id: string, staffId: string, name: string) {
  return {
    id,
    staffId,
    staffName: name,
    staffNameBn: name,
    roleId: 'role-1',
    email: `${staffId.toLowerCase()}@school.bd`,
    defaultPassword: SECRET,
    overrides: [],
    dataScope: 'school',
  }
}

/**
 * Phase 6 — credential persistence tests. Each test re-imports the store so
 * `purgeLegacyStaffPasswords` runs against the seeded localStorage state —
 * the same code path used on a real page load.
 */
async function importFreshStore() {
  vi.resetModules()
  const mod = await import('./permissionStore')
  return mod.usePermissionStore
}

describe('permissionStore credential persistence (Phase 6)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('purges legacy plaintext staff default passwords from the base key', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          roles: [
            {
              id: 'role-1',
              name: 'Teacher',
              nameBn: 'শিক্ষক',
              permissions: [],
              dataScope: 'school',
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
          staffPermissions: [legacyStaffMember('sp-1', 'T-1', 'Rahim'), legacyStaffMember('sp-2', 'T-2', 'Karim')],
        },
        version: 0,
      })
    )

    const store = await importFreshStore()

    // Credentials removed from memory AND storage; everything else preserved.
    expect(store.getState().staffPermissions).toHaveLength(2)
    for (const member of store.getState().staffPermissions) {
      expect(member.defaultPassword).toBeUndefined()
    }
    expect(store.getState().staffPermissions[0].staffName).toBe('Rahim')
    expect(store.getState().staffPermissions[1].email).toBe('t-2@school.bd')
    expect(store.getState().roles).toHaveLength(1)
    expect(store.getState().roles[0].name).toBe('Teacher')

    const raw = localStorage.getItem(KEY)!
    expect(raw).not.toContain(SECRET)
    expect(raw).not.toContain('defaultPassword')
    expect(JSON.parse(raw).state.roles[0].name).toBe('Teacher')
  })

  it('purges slug-scoped variant keys (<base>_<slug>) too', async () => {
    localStorage.setItem(
      SLUG_KEY,
      JSON.stringify({
        state: { roles: [], staffPermissions: [legacyStaffMember('sp-3', 'T-3', 'Fatema')] },
        version: 0,
      })
    )

    await importFreshStore()

    const raw = localStorage.getItem(SLUG_KEY)!
    expect(raw).not.toContain(SECRET)
    expect(raw).not.toContain('defaultPassword')
    // Non-credential staff data survives the purge.
    expect(JSON.parse(raw).state.staffPermissions[0].staffName).toBe('Fatema')
  })

  it('never persists a newly set staff password (write path)', async () => {
    const store = await importFreshStore()
    const id = store.getState().addStaff({
      staffId: 'T-9',
      staffName: 'Nasrin',
      staffNameBn: 'নাসরিন',
      roleId: 'role-x',
      email: 'nasrin@school.bd',
    })
    store.getState().setStaffPassword(id, 'Session-Only-Pw!')

    // In-memory keeps it for the current session (view/copy after setting)…
    expect(store.getState().staffPermissions.find((m) => m.id === id)?.defaultPassword).toBe('Session-Only-Pw!')
    // …but storage never sees it.
    expect(localStorage.getItem(KEY)).not.toContain('defaultPassword')
    expect(localStorage.getItem(KEY)).not.toContain('Session-Only-Pw!')
    expect(browserStorageDump()).not.toContain('Session-Only-Pw!')
  })

  it('preserves unrelated persisted state (settings + roles + overrides)', async () => {
    const settingsRaw = JSON.stringify({ state: { theme: 'dark', language: 'bn' }, version: 0 })
    localStorage.setItem(SETTINGS_KEY, settingsRaw)
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          roles: [{ id: 'role-1', name: 'Librarian', nameBn: 'গ্রন্থাগারিক', permissions: [], createdAt: '', updatedAt: '' }],
          staffPermissions: [legacyStaffMember('sp-4', 'T-4', 'Jashim')],
        },
        version: 0,
      })
    )

    const store = await importFreshStore()

    // Unrelated store key is byte-identical after the purge.
    expect(localStorage.getItem(SETTINGS_KEY)).toBe(settingsRaw)
    // Credential purged but every other field intact.
    expect(store.getState().roles[0].name).toBe('Librarian')
    expect(store.getState().staffPermissions[0].staffName).toBe('Jashim')
    expect(store.getState().staffPermissions[0].defaultPassword).toBeUndefined()
    expect(browserStorageDump()).not.toContain(SECRET)
  })
})
