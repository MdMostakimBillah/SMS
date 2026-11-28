import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  syncLoginPathToEnv,
  readEnvLoginPath,
  EnvIntegrityError,
} from './envLoginPathSync.js'

const SAMPLE_ENV = [
  '# Production Database & Auth Secrets',
  'DATABASE_URL="postgresql://edutech:p@ss#word=123@db.example:5432/edutech?sslmode=require"',
  'JWT_SECRET=super-secret-jwt-key-do-not-touch-0123456789abcdef',
  '',
  '# Super Admin portal route',
  'VITE_LOGIN_PATH=/old-secret-login',
  'SUPER_ADMIN_SECURITY_PIN=849201',
  'R2_SECRET_ACCESS_KEY="abc+def/ghi=123"',
  '',
].join('\n')

describe('envLoginPathSync — Surgical & Atomic .env Protection', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'edutech-env-sync-'))
  })

  afterEach(async () => {
    await fsPromises.rm(tmpDir, { recursive: true, force: true })
  })

  it('replaces ONLY VITE_LOGIN_PATH and preserves every secret, quote, comment, and blank line byte-for-byte', async () => {
    const envFile = path.join(tmpDir, '.env')
    await fsPromises.writeFile(envFile, SAMPLE_ENV, { mode: 0o644 })

    const res = await syncLoginPathToEnv('NewRandomPath99', { targets: [envFile] })
    expect(res).toEqual({ envSynced: true, envSyncStatus: 'synced', targetsUpdated: 1 })

    const updated = await fsPromises.readFile(envFile, 'utf8')
    const expected = SAMPLE_ENV.replace('VITE_LOGIN_PATH=/old-secret-login', 'VITE_LOGIN_PATH=/NewRandomPath99')
    expect(updated).toBe(expected)

    // File permissions hardened to 0600 (owner read/write only)
    const stat = await fsPromises.stat(envFile)
    expect(stat.mode & 0o777).toBe(0o600)

    // No stray .tmp files left behind
    const files = await fsPromises.readdir(tmpDir)
    expect(files).toEqual(['.env'])

    // Single-key safe reader returns normalized value
    expect(await readEnvLoginPath([envFile])).toBe('NewRandomPath99')
  })

  it('preserves Windows CRLF endings and UTF-8 BOM without mutating other lines', async () => {
    const crlfEnv = '\uFEFFDATABASE_URL=postgres://user:pass@localhost/db\r\nVITE_LOGIN_PATH=/prev1234\r\nJWT_SECRET=xyz987654\r\n'
    const envFile = path.join(tmpDir, '.env')
    await fsPromises.writeFile(envFile, crlfEnv, 'utf8')

    await syncLoginPathToEnv('crlfSafePath1', { targets: [envFile] })
    const updated = await fsPromises.readFile(envFile, 'utf8')
    expect(updated).toBe(crlfEnv.replace('/prev1234', '/crlfSafePath1'))
  })

  it('appends VITE_LOGIN_PATH cleanly when missing from .env without disturbing existing keys', async () => {
    const envWithoutLogin = 'DATABASE_URL=postgres://x/y\nJWT_SECRET=abc123456'
    const envFile = path.join(tmpDir, '.env')
    await fsPromises.writeFile(envFile, envWithoutLogin, 'utf8')

    await syncLoginPathToEnv('addedCleanPath1', { targets: [envFile] })
    const updated = await fsPromises.readFile(envFile, 'utf8')
    expect(updated).toBe('DATABASE_URL=postgres://x/y\nJWT_SECRET=abc123456\nVITE_LOGIN_PATH=/addedCleanPath1\n')
  })

  it('blocks injection payloads (newlines, null bytes, shell chars, reserved words, quotes)', async () => {
    const envFile = path.join(tmpDir, '.env')
    await fsPromises.writeFile(envFile, SAMPLE_ENV, 'utf8')

    const maliciousInputs = [
      'valid123\nJWT_SECRET=hacked',
      'valid123\r\nADMIN=1',
      'valid\0null',
      '$(whoami)',
      'my"quote',
      'dashboard',
      'ab',
    ]

    for (const payload of maliciousInputs) {
      await expect(syncLoginPathToEnv(payload, { targets: [envFile] })).rejects.toThrow(EnvIntegrityError)
    }

    // Confirm .env remained completely untouched
    expect(await fsPromises.readFile(envFile, 'utf8')).toBe(SAMPLE_ENV)
  })

  it('refuses symlink targets so symlinks cannot redirect writes elsewhere', async () => {
    const realSecret = path.join(tmpDir, 'victim.txt')
    const symlinkEnv = path.join(tmpDir, '.env')
    await fsPromises.writeFile(realSecret, 'DO_NOT_OVERWRITE=true\n', 'utf8')
    await fsPromises.symlink(realSecret, symlinkEnv)

    await expect(syncLoginPathToEnv('symlinkAttempt1', { targets: [symlinkEnv] })).rejects.toThrow(EnvIntegrityError)
    expect(await fsPromises.readFile(realSecret, 'utf8')).toBe('DO_NOT_OVERWRITE=true\n')
  })

  it('serializes concurrent updates safely without corruption or lost keys', async () => {
    const envFile = path.join(tmpDir, '.env')
    await fsPromises.writeFile(envFile, SAMPLE_ENV, 'utf8')

    await Promise.all([
      syncLoginPathToEnv('concurrent-A1', { targets: [envFile] }),
      syncLoginPathToEnv('concurrent-B2', { targets: [envFile] }),
      syncLoginPathToEnv('concurrent-C3', { targets: [envFile] }),
    ])

    const finalContent = await fsPromises.readFile(envFile, 'utf8')
    expect(finalContent).toContain('DATABASE_URL="postgresql://edutech:p@ss#word=123@db.example:5432/edutech?sslmode=require"')
    expect(finalContent).toContain('JWT_SECRET=super-secret-jwt-key-do-not-touch-0123456789abcdef')
    expect(finalContent).toContain('R2_SECRET_ACCESS_KEY="abc+def/ghi=123"')

    const matches = finalContent.match(/^VITE_LOGIN_PATH=/gm) ?? []
    expect(matches).toHaveLength(1)
  })
})
