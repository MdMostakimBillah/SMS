import { describe, it, expect } from 'vitest'
import {
  parseVaultKey,
  keyMatchesInstitution,
  keyToVaultPath,
  vaultPathToKey,
  prettifyJson,
  compactJson,
} from './mapping'

describe('parseVaultKey', () => {
  it('parses an institution key', () => {
    expect(parseVaultKey('edutech-classes_demo-school')).toEqual({
      slug: 'demo-school',
      base: 'classes',
      userId: undefined,
    })
  })

  it('parses a per-user institution key', () => {
    expect(parseVaultKey('edutech-settings_demo-school_user123')).toEqual({
      slug: 'demo-school',
      userId: 'user123',
      base: 'settings',
    })
  })

  it('parses dash-containing base names', () => {
    expect(parseVaultKey('edutech-message-templates_demo')).toEqual({
      slug: 'demo',
      base: 'message-templates',
      userId: undefined,
    })
  })

  it('rejects global keys without a slug suffix', () => {
    expect(parseVaultKey('edutech-settings')).toBeNull()
    expect(parseVaultKey('edutech-classes')).toBeNull()
  })

  it('rejects blocklisted super-admin keys', () => {
    expect(parseVaultKey('edutech_super_admin')).toBeNull()
    expect(parseVaultKey('edutech_superadmin_user')).toBeNull()
  })

  it('rejects non-edutech keys', () => {
    expect(parseVaultKey('some_other_app')).toBeNull()
  })

  it('rejects path-traversal segments', () => {
    expect(parseVaultKey('edutech-classes_..')).toBeNull()
    expect(parseVaultKey('edutech-classes_demo_..')).toBeNull()
  })
})

describe('keyMatchesInstitution', () => {
  it('matches plain institution keys', () => {
    expect(keyMatchesInstitution('edutech-exams_demo', 'demo')).toBe(true)
  })

  it('matches per-user keys when a userId is supplied', () => {
    expect(keyMatchesInstitution('edutech-settings_demo_u1', 'demo', 'u1')).toBe(true)
  })

  it('does not match another institution with a shared suffix', () => {
    // "my-demo" ends with the letters of "demo" but is not the same tenant
    expect(keyMatchesInstitution('edutech-classes_my-demo', 'demo')).toBe(false)
  })

  it('never matches the superadmin key for a tenant named "user"', () => {
    expect(keyMatchesInstitution('edutech_superadmin_user', 'user')).toBe(false)
  })

  it('ignores per-user keys when no userId is given', () => {
    expect(keyMatchesInstitution('edutech-settings_demo_u1', 'demo')).toBe(false)
  })
})

describe('keyToVaultPath / vaultPathToKey round trip', () => {
  it('round-trips an institution key', () => {
    const key = 'edutech-exams_demo-school'
    const path = keyToVaultPath(key)
    expect(path).toBe('demo-school/exams.json')
    expect(vaultPathToKey(path!)).toBe(key)
  })

  it('round-trips a per-user key', () => {
    const key = 'edutech-settings_demo_user42'
    const path = keyToVaultPath(key)
    expect(path).toBe('demo/users/user42/settings.json')
    expect(vaultPathToKey(path!)).toBe(key)
  })

  it('returns null for global keys', () => {
    expect(keyToVaultPath('edutech_super_admin')).toBeNull()
  })

  it('rejects paths outside the expected slug', () => {
    expect(vaultPathToKey('other/exams.json', { slug: 'demo' })).toBeNull()
    expect(vaultPathToKey('demo/users/other-user/settings.json', { slug: 'demo', userId: 'me' })).toBeNull()
  })

  it('accepts only the current user\'s per-user files when scoped', () => {
    expect(vaultPathToKey('demo/users/me/settings.json', { slug: 'demo', userId: 'me' })).toBe(
      'edutech-settings_demo_me',
    )
  })

  it('skips user-scoped files entirely when no user is in scope', () => {
    expect(vaultPathToKey('demo/users/someone/settings.json', { slug: 'demo', userId: null })).toBeNull()
  })

  it('rejects malformed paths', () => {
    expect(vaultPathToKey('demo')).toBeNull()
    expect(vaultPathToKey('demo/nested/deep/file.json')).toBeNull()
    expect(vaultPathToKey('demo/..../evil.json')).toBeNull()
  })
})

describe('json helpers', () => {
  it('prettifies compact json', () => {
    expect(prettifyJson('{"a":1}')).toBe('{\n  "a": 1\n}')
  })

  it('compacts pretty json', () => {
    expect(compactJson('{\n  "a": 1\n}')).toBe('{"a":1}')
  })

  it('passes through invalid json unchanged', () => {
    expect(prettifyJson('{broken')).toBe('{broken')
    expect(compactJson('{broken')).toBe('{broken')
  })
})
