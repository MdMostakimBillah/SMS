import { describe, it, expect, beforeEach, vi } from 'vitest'
import { browserStorageDump, makeInstitution } from '@/test-fixtures'

const KEY = 'edutech_super_admin'
const SETTINGS_KEY = 'edutech-settings'
const SECRET = 'Legacy-Secret-Pw-9876!'

/**
 * Phase 6 — credential persistence tests.
 *
 * Each test re-imports the store through `vi.resetModules()` so the module
 * body (including `purgeLegacyInstitutionPasswords`) runs against the exact
 * localStorage state the test seeded — the same code path used on a real page
 * load with previously persisted data.
 */
async function importFreshStore() {
  vi.resetModules()
  const mod = await import('./superAdminStore')
  return mod.useSuperAdminStore
}

describe('superAdminStore credential persistence (Phase 6)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('purges legacy plaintext institution passwords from persisted state on load', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          institutions: [
            makeInstitution({ id: 'LEGACY-1', name: 'Legacy School', password: SECRET }),
            makeInstitution({ id: 'LEGACY-2', name: 'Second School', email: 'two@test.bd', password: SECRET }),
          ],
          viewingInstitutionId: null,
          searchQuery: '',
        },
        version: 0,
      })
    )

    const store = await importFreshStore()

    // Credentials removed from memory AND storage; everything else preserved.
    expect(store.getState().institutions).toHaveLength(2)
    for (const inst of store.getState().institutions) {
      expect(inst.password).toBeUndefined()
    }
    expect(store.getState().institutions[0].name).toBe('Legacy School')
    expect(store.getState().institutions[1].email).toBe('two@test.bd')

    const raw = localStorage.getItem(KEY)!
    expect(raw).not.toContain(SECRET)
    expect(raw).not.toContain('password')
    const persisted = JSON.parse(raw)
    expect(persisted.state.institutions[0].name).toBe('Legacy School')
  })

  it('never persists a newly supplied institution password (write path)', async () => {
    const store = await importFreshStore()
    store.getState().addInstitution(makeInstitution({ id: 'NEW-1', password: 'Fresh-Session-Pw!' }))

    // In-memory keeps it for the current session (view/copy right after
    // creation)…
    expect(store.getState().institutions[0].password).toBe('Fresh-Session-Pw!')
    // …but storage never sees it.
    expect(localStorage.getItem(KEY)).not.toContain('"password"')
    expect(browserStorageDump()).not.toContain('Fresh-Session-Pw!')
  })

  it('preserves unrelated persisted state (settings + institution data)', async () => {
    const settingsRaw = JSON.stringify({ state: { theme: 'dark', language: 'bn' }, version: 0 })
    localStorage.setItem(SETTINGS_KEY, settingsRaw)
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          institutions: [makeInstitution({ password: SECRET })],
          searchQuery: 'abc',
          statusFilter: 'suspended',
        },
        version: 0,
      })
    )

    const store = await importFreshStore()

    // Unrelated store key is byte-identical after the purge.
    expect(localStorage.getItem(SETTINGS_KEY)).toBe(settingsRaw)
    // Credential purged but every other field intact.
    const inst = store.getState().institutions[0]
    expect(inst.name).toBe('Test School')
    expect(inst.brandColor).toBe('#6366f1')
    expect(inst.password).toBeUndefined()
    expect(store.getState().searchQuery).toBe('abc')
    expect(store.getState().statusFilter).toBe('suspended')
    expect(browserStorageDump()).not.toContain(SECRET)
  })

  it('leaves malformed persisted state untouched (fail-safe, no crash)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(KEY, 'not-json{{{')
    await expect(importFreshStore()).resolves.toBeDefined()
    expect(localStorage.getItem(KEY)).toBe('not-json{{{')
    consoleError.mockRestore()
  })
})
