/**
 * Phase 7 tests for /api/departments — mirrors the approved teachers RBAC policy:
 * - READ  = school_admin + hr_admin (own school) + super_admin (global, read-only)
 * - WRITE = school_admin + hr_admin only (super_admin explicitly excluded)
 * - Tenant scope from session state; forged schoolId values ignored; cross-tenant IDs -> 404
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

const FIXTURE_PASSWORD = 'DeptFixtur3!Secret'
const EMAILS = {
  adminA: 'dept-admin-a@test.local',
  adminB: 'dept-admin-b@test.local',
  hrA: 'dept-hr-a@test.local',
  teacherA: 'dept-teacher-a@test.local',
  orphan: 'dept-orphan-admin@test.local',
  super: 'dept-super@test.local',
} as const

const SCHOOL_A_NAME = 'Dept Test School A'
const SCHOOL_B_NAME = 'Dept Test School B'

let schoolAId = ''
let schoolBId = ''
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
  // Clean leftovers from a previous run, then build fixtures (test DB only)
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } })

  const schoolA = await prisma.school.create({ data: { name: SCHOOL_A_NAME } })
  const schoolB = await prisma.school.create({ data: { name: SCHOOL_B_NAME } })
  schoolAId = schoolA.id
  schoolBId = schoolB.id

  const pwHash = await hash(FIXTURE_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  const upsertUser = (email: string, role: 'super_admin' | 'school_admin' | 'teacher' | 'hr_admin', schoolId: string | null) =>
    prisma.user.upsert({
      where: { email },
      update: { role, schoolId, isActive: true, passwordHash: pwHash },
      create: { email, passwordHash: pwHash, name: email.split('@')[0], role, schoolId },
    })

  await upsertUser(EMAILS.adminA, 'school_admin', schoolAId)
  await upsertUser(EMAILS.adminB, 'school_admin', schoolBId)
  await upsertUser(EMAILS.hrA, 'hr_admin', schoolAId)
  await upsertUser(EMAILS.teacherA, 'teacher', schoolAId)
  await upsertUser(EMAILS.orphan, 'school_admin', null) // school admin without a school
  await upsertUser(EMAILS.super, 'super_admin', null)

  const deptA = await prisma.department.create({ data: { schoolId: schoolAId, name: 'Dept Fixture A' } })
  const deptB = await prisma.department.create({ data: { schoolId: schoolBId, name: 'Dept Fixture B' } })
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
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } }) // cascades departments
  await prisma.$disconnect()
})

describe('department RBAC — authentication boundary', () => {
  it('rejects unauthenticated requests (401 on read and write)', async () => {
    expect((await request(app).get('/api/departments')).status).toBe(401)
    expect((await post(undefined, '/api/departments', { name: 'Anon Dept' })).status).toBe(401)
  })
})

describe('department RBAC — permitted operations', () => {
  it('school_admin performs full CRUD inside its own school with CSRF', async () => {
    const jar = jars.adminA!

    const created = await post(jar, '/api/departments', { name: 'Dept CRUD Target', nameBn: 'লক্ষ্য বিভাগ', head: 'Head Teacher' })
    expect(created.status).toBe(201)
    expect(created.body.schoolId).toBe(schoolAId)
    expect(created.body.nameBn).toBe('লক্ষ্য বিভাগ')
    const id = created.body.id as string

    const list = await get(jar, '/api/departments')
    expect(list.status).toBe(200)
    expect(list.body.data.map((d: { id: string }) => d.id)).toContain(id)

    const updated = await put(jar, `/api/departments/${id}`, { head: 'New Head' })
    expect(updated.status).toBe(200)
    expect(updated.body.head).toBe('New Head')
    expect(updated.body.name).toBe('Dept CRUD Target') // untouched fields preserved

    expect((await del(jar, `/api/departments/${id}`)).status).toBe(200)
    const afterDelete = await get(jar, '/api/departments')
    expect(afterDelete.body.data.map((d: { id: string }) => d.id)).not.toContain(id)
  })

  it('read permissions match the authorization matrix', async () => {
    expect((await get(jars.hrA!, '/api/departments')).status).toBe(200) // hr_admin: yes
    expect((await get(jars.adminA!, '/api/departments')).status).toBe(200) // school_admin A: yes
    expect((await get(jars.adminB!, '/api/departments')).status).toBe(200) // school_admin B: yes (own)
    expect((await get(jars.teacherA!, '/api/departments')).status).toBe(403) // teacher: no
  })
})

describe('department RBAC — denied operations', () => {
  it('teacher role cannot create, update, or delete', async () => {
    const jar = jars.teacherA!
    expect((await post(jar, '/api/departments', { name: 'Sneaky Dept' })).status).toBe(403)
    expect((await put(jar, `/api/departments/${deptAId}`, { head: 'Sneaky' })).status).toBe(403)
    expect((await del(jar, `/api/departments/${deptAId}`)).status).toBe(403)
    expect(await prisma.department.findUnique({ where: { id: deptAId } })).not.toBeNull()
  })

  it('superadmin has global read but no write (explicit policy); NULL-school admin denied', async () => {
    const superJar = jars.super!

    const all = await get(superJar, '/api/departments')
    expect(all.status).toBe(200)
    const ids = all.body.data.map((d: { id: string }) => d.id)
    expect(ids).toContain(deptAId)
    expect(ids).toContain(deptBId)

    const filtered = await get(superJar, `/api/departments?schoolId=${schoolAId}`)
    expect(filtered.status).toBe(200)
    const filteredIds = filtered.body.data.map((d: { id: string }) => d.id)
    expect(filteredIds).toContain(deptAId)
    expect(filteredIds).not.toContain(deptBId)

    expect((await post(superJar, '/api/departments', { name: 'SuperWrite Dept' })).status).toBe(403)
    expect((await put(superJar, `/api/departments/${deptAId}`, { head: 'SuperWrite' })).status).toBe(403)
    expect((await del(superJar, `/api/departments/${deptAId}`)).status).toBe(403)
    expect(await prisma.department.findUnique({ where: { id: deptAId } })).not.toBeNull()

    expect((await get(jars.orphan!, '/api/departments')).status).toBe(403)
    expect((await post(jars.orphan!, '/api/departments', { name: 'Orphan Dept' })).status).toBe(403)
  })
})

describe('department RBAC — tenant isolation', () => {
  it('School A cannot read or mutate School B departments (404, no data leak)', async () => {
    const jar = jars.adminA!

    const list = await get(jar, '/api/departments')
    const ids = list.body.data.map((d: { id: string }) => d.id)
    expect(ids).toContain(deptAId)
    expect(ids).not.toContain(deptBId)

    expect((await put(jar, `/api/departments/${deptBId}`, { name: 'HACKED BY A' })).status).toBe(404)
    const unchanged = await prisma.department.findUnique({ where: { id: deptBId } })
    expect(unchanged?.name).toBe('Dept Fixture B')

    expect((await del(jar, `/api/departments/${deptBId}`)).status).toBe(404)
    expect(await prisma.department.findUnique({ where: { id: deptBId } })).not.toBeNull()
  })

  it('forged schoolId in body/query is ignored', async () => {
    const jar = jars.adminA!

    const forged = await post(jar, '/api/departments', { name: 'Forged School Dept', schoolId: schoolBId })
    expect(forged.status).toBe(201)
    expect(forged.body.schoolId).toBe(schoolAId)

    const scopedList = await get(jar, `/api/departments?schoolId=${schoolBId}`)
    expect(scopedList.status).toBe(200)
    const ids = scopedList.body.data.map((d: { id: string }) => d.id)
    expect(ids).not.toContain(deptBId)

    // cleanup fixture row
    expect((await del(jar, `/api/departments/${forged.body.id as string}`)).status).toBe(200)
  })

  it('duplicate name within one school -> 409; same name in another school -> allowed', async () => {
    const jarA = jars.adminA!
    const dup = await post(jarA, '/api/departments', { name: 'Dept Fixture A' }) // exists in A
    expect(dup.status).toBe(409)

    const jarB = jars.adminB!
    const crossOk = await post(jarB, '/api/departments', { name: 'Dept Fixture A' }) // unique per (name, schoolId)
    expect(crossOk.status).toBe(201)
    expect((await del(jarB, `/api/departments/${crossOk.body.id as string}`)).status).toBe(200)
  })

  it('validation: empty name -> 400; mass assignment of id/createdAt is stripped', async () => {
    const jar = jars.adminA!

    expect((await post(jar, '/api/departments', { name: '   ' })).status).toBe(400)

    const res = await put(jar, `/api/departments/${deptAId}`, {
      head: 'Mass Assignment Check',
      schoolId: schoolBId, // must be stripped (not in the update schema)
      id: 'evil-id-override', // must be stripped
      createdAt: '2000-01-01T00:00:00.000Z', // must be stripped
    })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(deptAId)

    const row = await prisma.department.findUnique({ where: { id: deptAId } })
    expect(row?.schoolId).toBe(schoolAId)
    expect(row?.head).toBe('Mass Assignment Check')
    // restore fixture state
    await prisma.department.update({ where: { id: deptAId }, data: { head: null } })
  })

  it('mutating without the CSRF token is rejected and creates nothing', async () => {
    const jar = jars.adminA!
    const res = await post(jar, '/api/departments', { name: 'NoCsrf Dept' }, false)
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/CSRF/i)
    expect(await prisma.department.findFirst({ where: { name: 'NoCsrf Dept' } })).toBeNull()
  })
})
