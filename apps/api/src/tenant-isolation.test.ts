/**
 * Backend authorization phase — cross-tenant negative matrix.
 *
 * Covers every tenant-owned API operation that exists today:
 * - read:   a foreign id is indistinguishable from a nonexistent id (uniform 404)
 * - create: references to another tenant's department are rejected (400)
 * - update/delete: foreign ids are 404 and leave the other tenant's data intact
 * - super_admin cross-tenant access is allowed and emits audit events
 * - password material is never exposed on privileged account reads
 *
 * Uploads/downloads are intentionally NOT covered here: the API currently
 * exposes no upload/download endpoints (no multipart or presigned routes
 * exist) — tracked as a blocker for the media phase, not silently skipped.
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

const FIXTURE_PASSWORD = 'TiFixtur3!Secret'
const EMAILS = {
  adminA: 'ti-admin-a@test.local',
  adminB: 'ti-admin-b@test.local',
  super: 'ti-super@test.local',
} as const

const SCHOOL_A_NAME = 'TI Test School A'
const SCHOOL_B_NAME = 'TI Test School B'
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000'

let schoolAId = ''
let schoolBId = ''
let deptAId = ''
let deptBId = ''
let teacherAId = ''
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

/** Audit events the app emitted on stdout during the current spy window. */
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

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } })

  const schoolA = await prisma.school.create({ data: { name: SCHOOL_A_NAME } })
  const schoolB = await prisma.school.create({ data: { name: SCHOOL_B_NAME } })
  schoolAId = schoolA.id
  schoolBId = schoolB.id

  const pwHash = await hash(FIXTURE_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  const upsertUser = (email: string, role: 'super_admin' | 'school_admin', schoolId: string | null) =>
    prisma.user.upsert({
      where: { email },
      update: { role, schoolId, isActive: true, passwordHash: pwHash },
      create: { email, passwordHash: pwHash, name: email.split('@')[0], role, schoolId },
    })

  await upsertUser(EMAILS.adminA, 'school_admin', schoolAId)
  await upsertUser(EMAILS.adminB, 'school_admin', schoolBId)
  await upsertUser(EMAILS.super, 'super_admin', null)

  const teacherA = await prisma.teacher.create({ data: { schoolId: schoolAId, nameEn: 'TI Teacher A', subjectIds: [] } })
  teacherAId = teacherA.id
  const deptA = await prisma.department.create({ data: { schoolId: schoolAId, name: 'TI Dept A' } })
  const deptB = await prisma.department.create({ data: { schoolId: schoolBId, name: 'TI Dept B' } })
  deptAId = deptA.id
  deptBId = deptB.id

  for (const key of Object.keys(EMAILS) as (keyof typeof EMAILS)[]) {
    const { res } = await login(app, EMAILS[key], FIXTURE_PASSWORD)
    if (res.status !== 200) throw new Error(`fixture login failed for ${key}: ${res.status}`)
    jars[key] = extractCookies(res)
  }
})

afterAll(async () => {
  vi.restoreAllMocks()
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.teacher.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } }) // cascades departments
  await prisma.$disconnect()
})

describe('cross-tenant — teachers read', () => {
  it("returns a uniform 404 for another tenant's teacher id (indistinguishable from nonexistent)", async () => {
    const foreign = await get(jars.adminB!, `/api/teachers/${teacherAId}`)
    const missing = await get(jars.adminB!, `/api/teachers/${NONEXISTENT_ID}`)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body).toEqual(missing.body) // identical body = no existence oracle
  })

  it('scopes the list to the session tenant — foreign teachers never appear', async () => {
    const res = await get(jars.adminB!, '/api/teachers')
    expect(res.status).toBe(200)
    const ids = (res.body.data as Array<{ id: string }>).map((t) => t.id)
    expect(ids).not.toContain(teacherAId)
    for (const t of res.body.data as Array<{ schoolId: string }>) {
      expect(t.schoolId).toBe(schoolBId)
    }
  })

  it("ignores a client-supplied ?schoolId for non-super-admin roles (stays on own tenant)", async () => {
    const res = await get(jars.adminB!, `/api/teachers?schoolId=${schoolAId}`)
    expect(res.status).toBe(200)
    const ids = (res.body.data as Array<{ id: string }>).map((t) => t.id)
    expect(ids).not.toContain(teacherAId) // query spoof did NOT widen scope
  })
})

describe('cross-tenant — teacher create', () => {
  it("rejects a teacher create referencing another tenant's department (400)", async () => {
    const res = await post(jars.adminB!, '/api/teachers', { nameEn: 'Cross Tenant', departmentId: deptAId })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid departmentId')
  })

  it('creates normally once the reference is own-tenant (control case)', async () => {
    const res = await post(jars.adminB!, '/api/teachers', { nameEn: 'Own Tenant', departmentId: deptBId })
    expect(res.status).toBe(201)
    expect(res.body.schoolId).toBe(schoolBId)
    expect(res.body.departmentId).toBe(deptBId)
  })
})

describe('cross-tenant — teacher update', () => {
  it("returns uniform 404 and leaves the other tenant's record untouched", async () => {
    const foreign = await put(jars.adminB!, `/api/teachers/${teacherAId}`, { designation: 'Hacked' })
    const missing = await put(jars.adminB!, `/api/teachers/${NONEXISTENT_ID}`, { designation: 'Hacked' })
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body).toEqual(missing.body)

    const check = await get(jars.adminA!, `/api/teachers/${teacherAId}`)
    expect(check.status).toBe(200)
    expect(check.body.designation).toBeNull() // unchanged by the foreign write attempt
  })

  it("rejects a write pointing departmentId at another tenant's department (400)", async () => {
    const res = await put(jars.adminA!, `/api/teachers/${teacherAId}`, { departmentId: deptBId })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid departmentId')
  })
})

describe('cross-tenant — teacher delete', () => {
  it("returns uniform 404 and the other tenant's record survives", async () => {
    const foreign = await del(jars.adminB!, `/api/teachers/${teacherAId}`)
    const missing = await del(jars.adminB!, `/api/teachers/${NONEXISTENT_ID}`)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body).toEqual(missing.body)

    const check = await get(jars.adminA!, `/api/teachers/${teacherAId}`)
    expect(check.status).toBe(200) // record still intact
  })
})

describe('cross-tenant — departments', () => {
  it("returns uniform 404 for update and delete of another tenant's department", async () => {
    const updForeign = await put(jars.adminB!, `/api/departments/${deptAId}`, { head: 'Hacked' })
    const updMissing = await put(jars.adminB!, `/api/departments/${NONEXISTENT_ID}`, { head: 'Hacked' })
    expect(updForeign.status).toBe(404)
    expect(updMissing.status).toBe(404)
    expect(updForeign.body).toEqual(updMissing.body)

    const delForeign = await del(jars.adminB!, `/api/departments/${deptAId}`)
    const delMissing = await del(jars.adminB!, `/api/departments/${NONEXISTENT_ID}`)
    expect(delForeign.status).toBe(404)
    expect(delMissing.status).toBe(404)
    expect(delForeign.body).toEqual(delMissing.body)

    const check = await get(jars.adminA!, '/api/departments')
    expect(check.status).toBe(200)
    const ids = (check.body.data as Array<{ id: string }>).map((d) => d.id)
    expect(ids).toContain(deptAId) // intact
  })

  it('control: own-tenant department create still works', async () => {
    const res = await post(jars.adminB!, '/api/departments', { name: 'TI Own Dept' })
    expect(res.status).toBe(201)
    expect(res.body.schoolId).toBe(schoolBId)
  })
})

describe('super_admin cross-tenant — allowed and audited', () => {
  it("reads another tenant's teachers by explicit scope and emits an audit event", async () => {
    const res = await get(jars.super!, `/api/teachers?schoolId=${schoolAId}`)
    expect(res.status).toBe(200)
    const rows = res.body.data as Array<{ id: string; schoolId: string }>
    expect(rows.some((t) => t.id === teacherAId)).toBe(true)
    for (const t of rows) expect(t.schoolId).toBe(schoolAId)

    const events = auditEvents().filter((e) => e.action === 'teacher.list.cross_tenant')
    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events[events.length - 1].schoolId).toBe(schoolAId)
    expect(events[events.length - 1].actorRole).toBe('super_admin')
  })

  it("reads a single teacher of any tenant and audits it", async () => {
    const res = await get(jars.super!, `/api/teachers/${teacherAId}`)
    expect(res.status).toBe(200)
    const events = auditEvents().filter((e) => e.action === 'teacher.read' && e.resourceId === teacherAId)
    expect(events.length).toBe(1)
    expect(events[0].outcome).toBe('success')
  })
})

describe('privileged reads never expose password material', () => {
  it('GET /api/auth/accounts contains no password fields anywhere', async () => {
    const res = await get(jars.super!, '/api/auth/accounts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    for (const account of res.body as Array<Record<string, unknown>>) {
      expect(Object.keys(account)).not.toContain('passwordHash')
      expect(Object.keys(account)).not.toContain('password')
    }
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
  })

  it('audits the privileged account listing', async () => {
    const res = await get(jars.super!, '/api/auth/accounts')
    expect(res.status).toBe(200)
    const events = auditEvents().filter((e) => e.action === 'auth.accounts.list')
    expect(events.length).toBe(1)
    expect(events[0].outcome).toBe('success')
    expect(events[0].actorRole).toBe('super_admin')
  })
})
