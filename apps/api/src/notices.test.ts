/**
 * Notices API tests — first localStorage→API domain migration.
 *
 * Covers: authentication boundary, RBAC (incl. super_admin write exclusion),
 * CRUD round-trip with server-derived tenancy, cross-tenant negative matrix
 * (uniform 404s, no existence oracle), the idempotent one-time import
 * (re-run skips, batch duplicates reported, per-tenant isolation), category
 * management with notice reassignment, validation, and audit emission.
 *
 * Runs ONLY against the isolated `edutech_test` database.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, extractCookies, login, type CookieJar } from './test-utils.js'

const prisma = new PrismaClient()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173' })

const FIXTURE_PASSWORD = 'NoticeFixtur3!Secret'
const EMAILS = {
  adminA: 'nt-admin-a@test.local',
  adminB: 'nt-admin-b@test.local',
  teacherA: 'nt-teacher-a@test.local',
  super: 'nt-super@test.local',
} as const

const SCHOOL_A_NAME = 'NT Test School A'
const SCHOOL_B_NAME = 'NT Test School B'
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000'

let schoolAId = ''
let schoolBId = ''
let noticeAId = ''
const jars: Partial<Record<keyof typeof EMAILS, CookieJar>> = {}

function get(jar: CookieJar, path: string) {
  return request(app).get(path).set('Cookie', cookieHeader(jar))
}
function post(jar: CookieJar, path: string, body: unknown) {
  return request(app)
    .post(path)
    .set('Cookie', cookieHeader(jar))
    .set('x-csrf-token', csrfToken(jar))
    .send(body as object)
}
function put(jar: CookieJar, path: string, body: unknown) {
  return request(app)
    .put(path)
    .set('Cookie', cookieHeader(jar))
    .set('x-csrf-token', csrfToken(jar))
    .send(body as object)
}
function del(jar: CookieJar, path: string) {
  return request(app)
    .delete(path)
    .set('Cookie', cookieHeader(jar))
    .set('x-csrf-token', csrfToken(jar))
}

let logSpy: MockInstance
function auditEvents(): Array<Record<string, unknown>> {
  return logSpy.mock.calls
    .map((call) => call[0])
    .filter((v): v is string => typeof v === 'string' && v.startsWith('{"audit":true'))
    .map((s) => JSON.parse(s) as Record<string, unknown>)
}

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  logSpy.mockRestore()
})

const sampleNotice = (overrides: Record<string, unknown> = {}) => ({
  title: 'NT Sample Notice',
  titleBn: 'নমুনা নোটিশ',
  content: '<p>Sample content</p>',
  contentBn: '<p>নমুনা</p>',
  author: 'Principal',
  authorBn: 'অধ্যক্ষ',
  target: 'all',
  priority: 'high',
  category: 'General',
  pinned: false,
  isActive: true,
  publishedAt: '2026-10-01T08:00:00.000Z',
  expiresAt: '',
  ...overrides,
})

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } })

  const schoolA = await prisma.school.create({ data: { name: SCHOOL_A_NAME } })
  const schoolB = await prisma.school.create({ data: { name: SCHOOL_B_NAME } })
  schoolAId = schoolA.id
  schoolBId = schoolB.id

  const pwHash = await hash(FIXTURE_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  const upsertUser = (email: string, role: 'super_admin' | 'school_admin' | 'teacher', schoolId: string | null) =>
    prisma.user.upsert({
      where: { email },
      update: { role, schoolId, isActive: true, passwordHash: pwHash },
      create: { email, passwordHash: pwHash, name: email.split('@')[0], role, schoolId },
    })

  await upsertUser(EMAILS.adminA, 'school_admin', schoolAId)
  await upsertUser(EMAILS.adminB, 'school_admin', schoolBId)
  await upsertUser(EMAILS.teacherA, 'teacher', schoolAId)
  await upsertUser(EMAILS.super, 'super_admin', null)

  const noticeA = await prisma.notice.create({
    data: { schoolId: schoolAId, title: 'NT Notice A', content: '<p>A</p>' },
  })
  noticeAId = noticeA.id

  for (const key of Object.keys(EMAILS) as (keyof typeof EMAILS)[]) {
    const { res } = await login(app, EMAILS[key], FIXTURE_PASSWORD)
    if (res.status !== 200) throw new Error(`fixture login failed for ${key}: ${res.status}`)
    jars[key] = extractCookies(res)
  }
})

afterAll(async () => {
  vi.restoreAllMocks()
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } }) // cascades notices + categories
  await prisma.$disconnect()
})

describe('notices API — authentication boundary', () => {
  it('rejects unauthenticated requests (401 on read, write and import)', async () => {
    expect((await request(app).get('/api/notices')).status).toBe(401)
    expect((await request(app).post('/api/notices').send(sampleNotice())).status).toBe(401)
    expect((await request(app).post('/api/notices/import').send({ items: [] })).status).toBe(401)
  })
})

describe('notices API — RBAC', () => {
  it('allows teacher reads but forbids teacher writes (403)', async () => {
    expect((await get(jars.teacherA!, '/api/notices')).status).toBe(200)
    expect((await post(jars.teacherA!, '/api/notices', sampleNotice())).status).toBe(403)
    expect((await put(jars.teacherA!, `/api/notices/${noticeAId}`, { title: 'X' })).status).toBe(403)
    expect((await del(jars.teacherA!, `/api/notices/${noticeAId}`)).status).toBe(403)
    expect((await post(jars.teacherA!, '/api/notices/import', { items: [] })).status).toBe(403)
  })

  it('excludes super_admin from writes (read-only global role)', async () => {
    expect((await get(jars.super!, '/api/notices')).status).toBe(200)
    expect((await post(jars.super!, '/api/notices', sampleNotice())).status).toBe(403)
    expect((await del(jars.super!, `/api/notices/${noticeAId}`)).status).toBe(403)
  })
})

describe('notices API — CRUD with server-derived tenancy', () => {
  it('create ignores a client-supplied schoolId (session tenancy wins)', async () => {
    const res = await post(jars.adminA!, '/api/notices', sampleNotice({ schoolId: schoolBId, title: 'NT MassAssign' }))
    expect(res.status).toBe(201)
    expect(res.body.schoolId).toBe(schoolAId) // never the spoofed B
    expect(res.body.localId).toBeNull() // API-native creates carry no import key
  })

  it('round-trips create → list → update → delete within the tenant', async () => {
    const created = await post(jars.adminA!, '/api/notices', sampleNotice({ title: 'NT RoundTrip' }))
    expect(created.status).toBe(201)
    const id = created.body.id as string

    const list = await get(jars.adminA!, '/api/notices')
    expect((list.body.data as Array<{ id: string }>).some((n) => n.id === id)).toBe(true)

    const updated = await put(jars.adminA!, `/api/notices/${id}`, { pinned: true, title: 'NT RoundTrip v2' })
    expect(updated.status).toBe(200)
    expect(updated.body.pinned).toBe(true)
    expect(updated.body.title).toBe('NT RoundTrip v2')

    expect((await del(jars.adminA!, `/api/notices/${id}`)).status).toBe(200)
    expect((await get(jars.adminA!, `/api/notices/${NONEXISTENT_ID}`)).status).toBe(404)
  })

  it('rejects invalid payloads (empty title, malformed expiry)', async () => {
    expect((await post(jars.adminA!, '/api/notices', sampleNotice({ title: '' }))).status).toBe(400)
    expect((await post(jars.adminA!, '/api/notices', sampleNotice({ expiresAt: 'not-a-date' }))).status).toBe(400)
  })
})

describe('notices API — cross-tenant negative matrix', () => {
  it("returns uniform 404 for another tenant's notice (update/delete; notices have no per-record GET route)", async () => {
    const updForeign = await put(jars.adminB!, `/api/notices/${noticeAId}`, { title: 'Hacked' })
    const updMissing = await put(jars.adminB!, `/api/notices/${NONEXISTENT_ID}`, { title: 'Hacked' })
    expect(updForeign.status).toBe(404)
    expect(updMissing.status).toBe(404)
    expect(updForeign.body).toEqual(updMissing.body)

    const delForeign = await del(jars.adminB!, `/api/notices/${noticeAId}`)
    const delMissing = await del(jars.adminB!, `/api/notices/${NONEXISTENT_ID}`)
    expect(delForeign.status).toBe(404)
    expect(delMissing.status).toBe(404)
    expect(delForeign.body).toEqual(delMissing.body)

    const check = await get(jars.adminA!, '/api/notices')
    expect((check.body.data as Array<{ id: string }>).some((n) => n.id === noticeAId)).toBe(true) // intact
  })

  it('never leaks foreign rows into another tenant list and ignores ?schoolId spoofing', async () => {
    const list = await get(jars.adminB!, '/api/notices')
    for (const n of list.body.data as Array<{ schoolId: string; id: string }>) {
      expect(n.schoolId).toBe(schoolBId)
      expect(n.id).not.toBe(noticeAId)
    }
    const spoofed = await get(jars.adminB!, `/api/notices?schoolId=${schoolAId}`)
    expect(spoofed.status).toBe(200)
    for (const n of spoofed.body.data as Array<{ id: string }>) {
      expect(n.id).not.toBe(noticeAId) // query spoof did NOT widen scope
    }
  })
})

describe('notices API — one-time import (idempotent)', () => {
  const importItems = [
    { localId: 'LEGACY-1', ...sampleNotice({ title: 'Legacy One' }) },
    { localId: 'LEGACY-2', ...sampleNotice({ title: 'Legacy Two', expiresAt: '2026-12-31' }) },
  ]

  it('imports fresh local records, then skips them on re-run (no duplicates)', async () => {
    const first = await post(jars.adminA!, '/api/notices/import', { items: importItems })
    expect(first.status).toBe(200)
    expect(first.body.imported).toBe(2)
    expect(first.body.skipped).toBe(0)

    const second = await post(jars.adminA!, '/api/notices/import', { items: importItems })
    expect(second.status).toBe(200)
    expect(second.body.imported).toBe(0)
    expect(second.body.skipped).toBe(2)
    for (const c of second.body.conflicts as Array<{ reason: string }>) {
      expect(c.reason).toBe('already_imported')
    }

    const list = await get(jars.adminA!, '/api/notices')
    const legacyRows = (list.body.data as Array<{ localId: string | null }>).filter((n) => n.localId?.startsWith('LEGACY-'))
    expect(legacyRows.length).toBe(2) // exactly two — re-run added nothing
  })

  it('reports in-batch duplicates as conflicts instead of importing twice', async () => {
    const res = await post(jars.adminA!, '/api/notices/import', {
      items: [
        { localId: 'LEGACY-BATCH', ...sampleNotice({ title: 'Batch' }) },
        { localId: 'LEGACY-BATCH', ...sampleNotice({ title: 'Batch again' }) },
      ],
    })
    expect(res.status).toBe(200)
    expect(res.body.imported).toBe(1)
    const dupes = (res.body.conflicts as Array<{ reason: string }>).filter((c) => c.reason === 'duplicate_in_batch')
    expect(dupes.length).toBe(1)
  })

  it('keeps import idempotency keys per-tenant (tenant B can import the same localId)', async () => {
    const res = await post(jars.adminB!, '/api/notices/import', {
      items: [{ localId: 'LEGACY-1', ...sampleNotice({ title: 'B tenant legacy' }) }],
    })
    expect(res.status).toBe(200)
    expect(res.body.imported).toBe(1) // A's localId did not block B
  })
})

describe('notices API — categories', () => {
  it('adds, lists, deletes a category and reassigns its notices to General', async () => {
    const created = await post(jars.adminA!, '/api/notices/categories', { name: 'NT Sports' })
    expect(created.status).toBe(201)

    const dupe = await post(jars.adminA!, '/api/notices/categories', { name: 'NT Sports' })
    expect(dupe.status).toBe(409)

    const withCat = await post(jars.adminA!, '/api/notices', sampleNotice({ title: 'NT Category User', category: 'NT Sports' }))
    expect(withCat.status).toBe(201)

    const delRes = await del(jars.adminA!, `/api/notices/categories/${encodeURIComponent('NT Sports')}`)
    expect(delRes.status).toBe(200)
    expect(delRes.body.reassigned).toBe(1)

    const check = await get(jars.adminA!, '/api/notices')
    const reassignedNotice = (check.body.data as Array<{ title: string; category: string }>).find((n) => n.title === 'NT Category User')
    expect(reassignedNotice?.category).toBe('General')

    const delMissing = await del(jars.adminA!, `/api/notices/categories/${encodeURIComponent('NT Sports')}`)
    expect(delMissing.status).toBe(404) // uniform — already gone
  })

  it('scopes category writes to the session tenant (no cross-tenant category delete)', async () => {
    await post(jars.adminB!, '/api/notices/categories', { name: 'B Only' })
    const cross = await del(jars.adminA!, `/api/notices/categories/${encodeURIComponent('B Only')}`)
    expect(cross.status).toBe(404) // A cannot see or delete B's label
  })
})

describe('notices API — privileged access is audited', () => {
  it('audits super_admin cross-tenant list reads', async () => {
    const res = await get(jars.super!, `/api/notices?schoolId=${schoolAId}`)
    expect(res.status).toBe(200)
    for (const n of res.body.data as Array<{ schoolId: string }>) {
      expect(n.schoolId).toBe(schoolAId)
    }
    const events = auditEvents().filter((e) => e.action === 'notice.list.cross_tenant')
    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events[events.length - 1].schoolId).toBe(schoolAId)
  })

  it('audits imports with their outcome counts', async () => {
    await post(jars.adminA!, '/api/notices/import', {
      items: [{ localId: 'LEGACY-AUDIT', ...sampleNotice({ title: 'Audited import' }) }],
    })
    const events = auditEvents().filter((e) => e.action === 'notice.import')
    expect(events.length).toBe(1)
    expect(events[0].outcome).toBe('success')
    expect(events[0].detail).toMatchObject({ imported: 1, skipped: 0 })
  })
})
