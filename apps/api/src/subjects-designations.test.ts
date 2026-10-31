import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, extractCookies, login, type CookieJar } from './test-utils.js'

const prisma = new PrismaClient()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173' })

const FIXTURE_PASSWORD = 'SubjFixtur3!Secret'
const EMAILS = {
  adminA: 'subj-admin-a@test.local',
  adminB: 'subj-admin-b@test.local',
} as const

let schoolAId = ''
let schoolBId = ''
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

beforeAll(async () => {
  const passwordHash = await hash(FIXTURE_PASSWORD, {
    algorithm: 2,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 1,
  })

  const [sA, sB] = await Promise.all([
    prisma.school.create({ data: { name: 'Subj Test School A', domain: 'subja.test.local' } }),
    prisma.school.create({ data: { name: 'Subj Test School B', domain: 'subjb.test.local' } }),
  ])
  schoolAId = sA.id
  schoolBId = sB.id

  await Promise.all([
    prisma.user.create({ data: { email: EMAILS.adminA, passwordHash, role: 'school_admin', schoolId: schoolAId } }),
    prisma.user.create({ data: { email: EMAILS.adminB, passwordHash, role: 'school_admin', schoolId: schoolBId } }),
  ])

  for (const [k, email] of Object.entries(EMAILS)) {
    const { res } = await login(app, email, FIXTURE_PASSWORD)
    jars[k as keyof typeof EMAILS] = extractCookies(res)
  }
})

afterAll(async () => {
  await prisma.subject.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } }).catch(() => {})
  await prisma.designation.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } }).catch(() => {})
  await prisma.session.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } }).catch(() => {})
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } }).catch(() => {})
  await prisma.school.deleteMany({ where: { id: { in: [schoolAId, schoolBId] } } }).catch(() => {})
  await prisma.$disconnect()
})

describe('/api/subjects and /api/designations', () => {
  it('supports full subject CRUD and enforces tenant isolation', async () => {
    const jarA = jars.adminA!
    const jarB = jars.adminB!

    // Create subject in School A
    const resA = await post(jarA, '/api/subjects', { name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', departmentIds: ['dept-1'] })
    expect(resA.status).toBe(201)
    expect(resA.body.name).toBe('Physics')
    expect(resA.body.schoolId).toBe(schoolAId)
    const subjAId = resA.body.id

    // School B cannot see School A's subject
    const listB = await get(jarB, '/api/subjects')
    expect(listB.status).toBe(200)
    expect(listB.body.data.some((s: any) => s.id === subjAId)).toBe(false)

    // School A updates subject
    const updateRes = await put(jarA, `/api/subjects/${subjAId}`, { name: 'Advanced Physics' })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.name).toBe('Advanced Physics')

    // School B cannot update or delete School A's subject
    const fakeUpdate = await put(jarB, `/api/subjects/${subjAId}`, { name: 'Hacked' })
    expect(fakeUpdate.status).toBe(404)

    const fakeDel = await del(jarB, `/api/subjects/${subjAId}`)
    expect(fakeDel.status).toBe(404)

    // School A deletes subject
    const delRes = await del(jarA, `/api/subjects/${subjAId}`)
    expect(delRes.status).toBe(200)
  })

  it('supports full designation CRUD and enforces tenant isolation', async () => {
    const jarA = jars.adminA!
    const jarB = jars.adminB!

    // Create designation in School A
    const resA = await post(jarA, '/api/designations', { name: 'Senior Lecturer', nameBn: 'জ্যেষ্ঠ প্রভাষক' })
    expect(resA.status).toBe(201)
    expect(resA.body.name).toBe('Senior Lecturer')
    expect(resA.body.schoolId).toBe(schoolAId)
    const desAId = resA.body.id

    // School B cannot see School A's designation
    const listB = await get(jarB, '/api/designations')
    expect(listB.status).toBe(200)
    expect(listB.body.data.some((d: any) => d.id === desAId)).toBe(false)

    // School A updates designation
    const updateRes = await put(jarA, `/api/designations/${desAId}`, { name: 'Principal Lecturer' })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.name).toBe('Principal Lecturer')

    // School B cannot update or delete School A's designation
    const fakeUpdate = await put(jarB, `/api/designations/${desAId}`, { name: 'Hacked' })
    expect(fakeUpdate.status).toBe(404)

    const fakeDel = await del(jarB, `/api/designations/${desAId}`)
    expect(fakeDel.status).toBe(404)

    // School A deletes designation
    const delRes = await del(jarA, `/api/designations/${desAId}`)
    expect(delRes.status).toBe(200)
  })
})
