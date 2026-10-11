/**
 * Phase 3/4 authorization & tenant-isolation tests for /api/teachers.
 *
 * Policy under test (approved):
 * - READ  = school_admin + hr_admin (own school) + super_admin (global, read-only)
 * - WRITE = school_admin + hr_admin only (super_admin explicitly excluded)
 * - Tenant scope comes from the session's database state; forged schoolId
 *   values in query/body are ignored; cross-tenant IDs return 404.
 *
 * Runs ONLY against the isolated `edutech_test` database.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, extractCookies, login, type CookieJar } from './test-utils.js'

const prisma = new PrismaClient()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173' })

const FIXTURE_PASSWORD = 'RbacFixtur3!Secret'
const EMAILS = {
  adminA: 'rbac-admin-a@test.local',
  adminB: 'rbac-admin-b@test.local',
  hrA: 'rbac-hr-a@test.local',
  teacherA: 'rbac-teacher-a@test.local',
  studentA: 'rbac-student-a@test.local',
  orphan: 'rbac-orphan-admin@test.local',
  super: 'rbac-super@test.local',
} as const

const SCHOOL_A_NAME = 'RBAC Test School A'
const SCHOOL_B_NAME = 'RBAC Test School B'

let schoolAId = ''
let schoolBId = ''
let teacherAId = ''
let teacherBId = ''
let deptAId = ''
let deptBId = ''
const jars: Partial<Record<keyof typeof EMAILS, CookieJar>> = {}

function get(jar: CookieJar, path: string) {
  return request(app).get(path).set('Cookie', cookieHeader(jar))
}
function post(jar: CookieJar | undefined, path: string, body: unknown, withCsrf = true) {
  let req = request(app).post(path)
  if (jar) {
    req = req.set('Cookie', cookieHeader(jar))
    if (withCsrf) req = req.set('x-csrf-token', csrfToken(jar))
  }
  return req.send(body as object)
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

beforeAll(async () => {
  // Clean any leftovers from a previous run, then build fixtures (test DB only)
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } })

  const schoolA = await prisma.school.create({ data: { name: SCHOOL_A_NAME } })
  const schoolB = await prisma.school.create({ data: { name: SCHOOL_B_NAME } })
  schoolAId = schoolA.id
  schoolBId = schoolB.id

  const pwHash = await hash(FIXTURE_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  const upsertUser = (email: string, role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'hr_admin', schoolId: string | null) =>
    prisma.user.upsert({
      where: { email },
      update: { role, schoolId, isActive: true, passwordHash: pwHash },
      create: { email, passwordHash: pwHash, name: email.split('@')[0], role, schoolId },
    })

  await upsertUser(EMAILS.adminA, 'school_admin', schoolAId)
  await upsertUser(EMAILS.adminB, 'school_admin', schoolBId)
  await upsertUser(EMAILS.hrA, 'hr_admin', schoolAId)
  await upsertUser(EMAILS.teacherA, 'teacher', schoolAId)
  await upsertUser(EMAILS.studentA, 'student', schoolAId)
  await upsertUser(EMAILS.orphan, 'school_admin', null) // school admin without a school
  await upsertUser(EMAILS.super, 'super_admin', null)

  const teacherA = await prisma.teacher.create({ data: { schoolId: schoolAId, nameEn: 'RBAC Teacher A', status: 'active' } })
  const teacherB = await prisma.teacher.create({ data: { schoolId: schoolBId, nameEn: 'RBAC Teacher B', status: 'active' } })
  teacherAId = teacherA.id
  teacherBId = teacherB.id

  const deptA = await prisma.department.create({ data: { schoolId: schoolAId, name: 'RBAC Dept A' } })
  const deptB = await prisma.department.create({ data: { schoolId: schoolBId, name: 'RBAC Dept B' } })
  deptAId = deptA.id
  deptBId = deptB.id

  for (const key of Object.keys(EMAILS) as (keyof typeof EMAILS)[]) {
    const { res } = await login(app, EMAILS[key], FIXTURE_PASSWORD)
    if (res.status !== 200) throw new Error(`fixture login failed for ${key}: ${res.status}`)
    jars[key] = extractCookies(res)
  }
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } }) // cascades teachers + departments
  await prisma.$disconnect()
})

describe('teacher RBAC — authentication boundary', () => {
  it('1. rejects unauthenticated requests (401 on read and write)', async () => {
    expect((await request(app).get('/api/teachers')).status).toBe(401)
    expect((await request(app).get(`/api/teachers/${teacherAId}`)).status).toBe(401)
    expect((await post(undefined, '/api/teachers', { nameEn: 'Anon' })).status).toBe(401)
  })
})

describe('teacher RBAC — permitted operations', () => {
  it('2. school_admin performs full CRUD inside its own school with CSRF', async () => {
    const jar = jars.adminA!

    const created = await post(jar, '/api/teachers', { nameEn: 'RBAC CRUD Target', departmentId: deptAId })
    expect(created.status).toBe(201)
    expect(created.body.schoolId).toBe(schoolAId)
    const id = created.body.id as string

    const list = await get(jar, '/api/teachers')
    expect(list.status).toBe(200)
    expect(list.body.data.map((t: { id: string }) => t.id)).toContain(id)

    const updated = await put(jar, `/api/teachers/${id}`, { nameEn: 'RBAC CRUD Target Renamed' })
    expect(updated.status).toBe(200)
    expect(updated.body.nameEn).toBe('RBAC CRUD Target Renamed')

    expect((await del(jar, `/api/teachers/${id}`)).status).toBe(200)
    expect((await get(jar, `/api/teachers/${id}`)).status).toBe(404)
  })

  it('4. read permissions match the authorization matrix', async () => {
    expect((await get(jars.hrA!, '/api/teachers')).status).toBe(200) // hr_admin: yes
    expect((await get(jars.adminA!, '/api/teachers')).status).toBe(200) // school_admin A: yes
    expect((await get(jars.adminB!, '/api/teachers')).status).toBe(200) // school_admin B: yes (own school)
    expect((await get(jars.teacherA!, '/api/teachers')).status).toBe(403) // teacher: no
    expect((await get(jars.studentA!, '/api/teachers')).status).toBe(403) // student: no
    expect((await get(jars.teacherA!, `/api/teachers/${teacherAId}`)).status).toBe(403) // teacher by-id: no
  })
})

describe('teacher RBAC — denied operations', () => {
  it('3. teacher and student roles cannot create, update, or delete', async () => {
    for (const key of ['teacherA', 'studentA'] as const) {
      const jar = jars[key]!
      expect((await post(jar, '/api/teachers', { nameEn: 'Sneaky' })).status).toBe(403)
      expect((await put(jar, `/api/teachers/${teacherAId}`, { nameEn: 'Sneaky' })).status).toBe(403)
      expect((await del(jar, `/api/teachers/${teacherAId}`)).status).toBe(403)
    }
    const stillThere = await prisma.teacher.findUnique({ where: { id: teacherAId } })
    expect(stillThere).not.toBeNull()
  })

  it('10. superadmin has global read but no write (explicit policy); NULL-school admin denied', async () => {
    const superJar = jars.super!

    // Global read across tenants
    const all = await get(superJar, '/api/teachers')
    expect(all.status).toBe(200)
    const ids = all.body.data.map((t: { id: string }) => t.id)
    expect(ids).toContain(teacherAId)
    expect(ids).toContain(teacherBId)

    // Optional ?schoolId filter narrows the global read
    const filtered = await get(superJar, `/api/teachers?schoolId=${schoolAId}`)
    expect(filtered.status).toBe(200)
    const filteredIds = filtered.body.data.map((t: { id: string }) => t.id)
    expect(filteredIds).toContain(teacherAId)
    expect(filteredIds).not.toContain(teacherBId)

    // No write power, ever
    expect((await post(superJar, '/api/teachers', { nameEn: 'SuperWrite' })).status).toBe(403)
    expect((await put(superJar, `/api/teachers/${teacherAId}`, { nameEn: 'SuperWrite' })).status).toBe(403)
    expect((await del(superJar, `/api/teachers/${teacherAId}`)).status).toBe(403)
    expect(await prisma.teacher.findUnique({ where: { id: teacherAId } })).not.toBeNull()

    // school_admin with schoolId=NULL: no tenant access (deny, not fallback)
    expect((await get(jars.orphan!, '/api/teachers')).status).toBe(403)
    expect((await post(jars.orphan!, '/api/teachers', { nameEn: 'OrphanWrite' })).status).toBe(403)
  })
})

describe('teacher RBAC — tenant isolation', () => {
  it('5. School A cannot read School B teacher (404, no data leak)', async () => {
    const jar = jars.adminA!
    expect((await get(jar, `/api/teachers/${teacherBId}`)).status).toBe(404)

    const list = await get(jar, '/api/teachers')
    const ids = list.body.data.map((t: { id: string }) => t.id)
    expect(ids).toContain(teacherAId)
    expect(ids).not.toContain(teacherBId)
  })

  it('6. School A cannot update or delete School B teacher', async () => {
    const jar = jars.adminA!
    expect((await put(jar, `/api/teachers/${teacherBId}`, { nameEn: 'HACKED BY A' })).status).toBe(404)
    const unchanged = await prisma.teacher.findUnique({ where: { id: teacherBId } })
    expect(unchanged?.nameEn).toBe('RBAC Teacher B')

    expect((await del(jar, `/api/teachers/${teacherBId}`)).status).toBe(404)
    expect(await prisma.teacher.findUnique({ where: { id: teacherBId } })).not.toBeNull()
  })

  it('7. forged schoolId in body/query is ignored; foreign departmentId rejected', async () => {
    const jar = jars.adminA!

    // Body schoolId must not win over session-derived schoolId
    const forged = await post(jar, '/api/teachers', { nameEn: 'Forged School Teacher', schoolId: schoolBId })
    expect(forged.status).toBe(201)
    expect(forged.body.schoolId).toBe(schoolAId)
    const forgedRow = await prisma.teacher.findUnique({ where: { id: forged.body.id as string } })
    expect(forgedRow?.schoolId).toBe(schoolAId)

    // Query schoolId must not widen School A's view to School B
    const scopedList = await get(jar, `/api/teachers?schoolId=${schoolBId}`)
    expect(scopedList.status).toBe(200)
    const ids = scopedList.body.data.map((t: { id: string }) => t.id)
    expect(ids).not.toContain(teacherBId)

    // School B admin's query filter is likewise forced to its own school
    const bView = await get(jars.adminB!, `/api/teachers?schoolId=${schoolAId}`)
    const bIds = bView.body.data.map((t: { id: string }) => t.id)
    expect(bIds).not.toContain(teacherAId)

    // departmentId from another school is rejected
    const badDept = await post(jar, '/api/teachers', { nameEn: 'Bad Department', departmentId: deptBId })
    expect(badDept.status).toBe(400)
    expect(badDept.body.error).toMatch(/departmentId/i)

    // cleanup fixture row
    expect((await del(jar, `/api/teachers/${forged.body.id as string}`)).status).toBe(200)
  })

  it('8. mass assignment cannot alter id, schoolId, or other protected fields', async () => {
    const jar = jars.adminA!

    const res = await put(jar, `/api/teachers/${teacherAId}`, {
      nameEn: 'RBAC Teacher A Renamed',
      schoolId: schoolBId, // must be stripped (not in the update schema)
      id: 'evil-id-override', // must be stripped
      createdAt: '2000-01-01T00:00:00.000Z', // must be stripped
    })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(teacherAId)

    const row = await prisma.teacher.findUnique({ where: { id: teacherAId } })
    expect(row?.schoolId).toBe(schoolAId) // tenant not movable via body
    expect(row?.id).toBe(teacherAId)
    expect(row?.nameEn).toBe('RBAC Teacher A Renamed') // allowed field did apply
  })

  it('11. mutating without the CSRF token is rejected and creates nothing', async () => {
    const jar = jars.adminA!
    const res = await post(jar, '/api/teachers', { nameEn: 'NoCsrf Create' }, false)
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/CSRF/i)

    const leak = await prisma.teacher.findFirst({ where: { nameEn: 'NoCsrf Create' } })
    expect(leak).toBeNull()
  })
})

describe('teacher RBAC — session state', () => {
  it('9. inactive users and revoked sessions are rejected with 401', async () => {
    // Inactive account: requireAuth re-checks isActive from the DB per request
    await prisma.user.update({ where: { email: EMAILS.adminA }, data: { isActive: false } })
    expect((await get(jars.adminA!, '/api/teachers')).status).toBe(401)
    await prisma.user.update({ where: { email: EMAILS.adminA }, data: { isActive: true } })
    expect((await get(jars.adminA!, '/api/teachers')).status).toBe(200) // restored access

    // Revoked session: logout revokes server-side, then the old cookie fails
    const logout = await post(jars.hrA!, '/api/auth/logout')
    expect(logout.status).toBe(200)
    expect((await get(jars.hrA!, '/api/teachers')).status).toBe(401)
  })
})
