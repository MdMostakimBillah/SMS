/**
 * Integration tests for /api/classes and /api/classes/routines:
 * - GET /api/classes (read classes and routines for target school)
 * - PUT /api/classes (save classes and routines for target school)
 * - PUT /api/classes/routines (save routines only)
 * - Tenant isolation: School A admin cannot modify School B
 * - Super admin can view and update any school's classes
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

const FIXTURE_PASSWORD = 'ClassFixtur3!Secret'
const EMAILS = {
  adminA: 'classes-admin-a@test.local',
  adminB: 'classes-admin-b@test.local',
  super: 'classes-super@test.local',
} as const

let schoolAId = ''
let schoolBId = ''
const jars: Partial<Record<keyof typeof EMAILS, CookieJar>> = {}

function get(jar: CookieJar | undefined, path: string) {
  let req = request(app).get(path)
  if (jar) {
    req = req.set('Cookie', cookieHeader(jar))
  }
  return req
}

function put(jar: CookieJar, path: string, body: unknown) {
  return request(app)
    .put(path)
    .set('Cookie', cookieHeader(jar))
    .set('x-csrf-token', csrfToken(jar))
    .send(body as object)
}

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { domain: { in: ['school-a-classes', 'school-b-classes'] } } })

  const schoolA = await prisma.school.create({
    data: {
      name: 'Class Test School A',
      domain: 'school-a-classes',
      classesData: JSON.stringify([{ id: 'CLS-A1', name: 'Class 1', sections: [] }]),
      routinesData: JSON.stringify([{ classId: 'CLS-A1', periodDuration: 40, weekendDays: [5], periods: [] }]),
    },
  })
  schoolAId = schoolA.id

  const schoolB = await prisma.school.create({
    data: {
      name: 'Class Test School B',
      domain: 'school-b-classes',
      classesData: '[]',
      routinesData: '[]',
    },
  })
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

  for (const [key, email] of Object.entries(EMAILS)) {
    const { res } = await login(app, email, FIXTURE_PASSWORD)
    if (res.status !== 200) throw new Error(`fixture login failed for ${key}: ${res.status}`)
    jars[key as keyof typeof EMAILS] = extractCookies(res)
  }
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  if (schoolAId) await prisma.school.deleteMany({ where: { id: schoolAId } })
  if (schoolBId) await prisma.school.deleteMany({ where: { id: schoolBId } })
  await prisma.$disconnect()
})

describe('/api/classes endpoints', () => {
  it('GET /api/classes returns classes and routines for target school by slug', async () => {
    const res = await get(undefined, `/api/classes?slug=school-a-classes`)
    expect(res.status).toBe(200)
    expect(res.body.classes).toHaveLength(1)
    expect(res.body.classes[0].name).toBe('Class 1')
    expect(res.body.routines).toHaveLength(1)
    expect(res.body.routines[0].classId).toBe('CLS-A1')
  })

  it('GET /api/classes returns authenticated school admin data by session', async () => {
    const res = await get(jars.adminA, `/api/classes`)
    expect(res.status).toBe(200)
    expect(res.body.classes).toHaveLength(1)
    expect(res.body.classes[0].id).toBe('CLS-A1')
  })

  it('PUT /api/classes allows school_admin to update their own classes and routines', async () => {
    const newClasses = [
      { id: 'CLS-10', name: 'Class 10', sections: [{ id: 'SEC-A', name: 'A', seatQuantity: 40 }] },
    ]
    const newRoutines = [
      { classId: 'CLS-10', sectionId: 'SEC-A', periodDuration: 45, weekendDays: [5], periods: [] },
    ]

    const putRes = await put(jars.adminA!, '/api/classes', {
      classes: newClasses,
      routines: newRoutines,
    })
    expect(putRes.status).toBe(200)
    expect(putRes.body.success).toBe(true)
    expect(putRes.body.classes).toHaveLength(1)
    expect(putRes.body.classes[0].name).toBe('Class 10')
    expect(putRes.body.routines).toHaveLength(1)

    // Verify in GET
    const getRes = await get(jars.adminA, '/api/classes')
    expect(getRes.body.classes[0].id).toBe('CLS-10')
    expect(getRes.body.routines[0].classId).toBe('CLS-10')
  })

  it('PUT /api/classes forbids school_admin A from modifying School B', async () => {
    const res = await put(jars.adminA!, '/api/classes', {
      schoolId: schoolBId,
      classes: [{ id: 'CLS-HACK', name: 'Hacked Class', sections: [] }],
    })
    expect(res.status).toBe(403)
  })

  it('PUT /api/classes/routines allows updating routines specifically', async () => {
    const routinesUpdate = [
      { classId: 'CLS-10', sectionId: 'SEC-A', periodDuration: 50, weekendDays: [5, 6], periods: [] },
    ]
    const res = await put(jars.adminA!, '/api/classes/routines', {
      routines: routinesUpdate,
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.routines[0].periodDuration).toBe(50)
  })

  it('PUT /api/classes allows super_admin to update any school classes', async () => {
    const res = await put(jars.super!, '/api/classes', {
      schoolId: schoolBId,
      classes: [{ id: 'CLS-B1', name: 'Class B 1', sections: [] }],
      routines: [],
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.classes[0].name).toBe('Class B 1')

    const verifyB = await get(undefined, `/api/classes?slug=school-b-classes`)
    expect(verifyB.body.classes[0].name).toBe('Class B 1')
  })
})
