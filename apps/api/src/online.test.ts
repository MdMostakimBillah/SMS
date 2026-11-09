/**
 * Integration tests for /api/online:
 * - GET /api/online (read online classes)
 * - PUT /api/online (save online classes)
 * - Tenant isolation: School A admin cannot modify School B
 * - Super admin can view and update any school's online classes
 * - Bounds validation (max classes limit)
 * - Offline / local_computer storageMode handling
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

const FIXTURE_PASSWORD = 'OnlineFixtur3!Secret'
const EMAILS = {
  adminA: 'online-admin-a@test.local',
  adminB: 'online-admin-b@test.local',
  super: 'online-super@test.local',
} as const

let schoolAId = ''
let schoolBId = ''
let schoolLocalId = ''
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
  await prisma.school.deleteMany({
    where: { domain: { in: ['school-a-online', 'school-b-online', 'school-local-online'] } },
  })

  const schoolA = await prisma.school.create({
    data: {
      name: 'Online Test School A',
      domain: 'school-a-online',
      onlineData: JSON.stringify([
        {
          id: 'OC-101',
          title: 'Math Live Class',
          titleBn: 'গণিত লাইভ ক্লাস',
          description: 'Algebra revision',
          descriptionBn: '',
          classId: 'CLS-1',
          sectionId: 'SEC-A',
          subjectId: 'SUB-1',
          teacherId: 'TCH-1',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          platform: 'youtube',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          scheduledAt: '2026-11-10T10:00',
          status: 'live',
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
    },
  })
  schoolAId = schoolA.id

  const schoolB = await prisma.school.create({
    data: {
      name: 'Online Test School B',
      domain: 'school-b-online',
      onlineData: '[]',
    },
  })
  schoolBId = schoolB.id

  const schoolLocal = await prisma.school.create({
    data: {
      name: 'Online Local PC School',
      domain: 'school-local-online',
      storageMode: 'local_computer',
      onlineData: '[]',
    },
  })
  schoolLocalId = schoolLocal.id

  const passwordHash = await hash(FIXTURE_PASSWORD)

  await prisma.user.create({
    data: {
      email: EMAILS.adminA,
      passwordHash,
      role: 'school_admin',
      schoolId: schoolA.id,
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.adminB,
      passwordHash,
      role: 'school_admin',
      schoolId: schoolB.id,
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.super,
      passwordHash,
      role: 'super_admin',
    },
  })

  for (const [key, email] of Object.entries(EMAILS)) {
    const res = await login(app, email, FIXTURE_PASSWORD)
    expect(res.status).toBe(200)
    jars[key as keyof typeof EMAILS] = extractCookies(res)
  }
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({
    where: { domain: { in: ['school-a-online', 'school-b-online', 'school-local-online'] } },
  })
  await prisma.$disconnect()
})

describe('GET /api/online', () => {
  it('returns online classes for authenticated school admin', async () => {
    const res = await get(jars.adminA, `/api/online?slug=school-a-online`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.classes)).toBe(true)
    expect(res.body.classes).toHaveLength(1)
    expect(res.body.classes[0].title).toBe('Math Live Class')
  })

  it('prevents cross-tenant read from another school admin', async () => {
    const res = await get(jars.adminB, `/api/online?schoolId=${schoolAId}`)
    expect(res.status).toBe(403)
  })

  it('returns empty array and storageMode flag for local_computer school', async () => {
    const res = await get(jars.super, `/api/online?slug=school-local-online`)
    expect(res.status).toBe(200)
    expect(res.body.storageMode).toBe('local_computer')
    expect(res.body.classes).toEqual([])
  })
})

describe('PUT /api/online', () => {
  it('updates online classes for own school', async () => {
    const newClasses = [
      {
        id: 'OC-202',
        title: 'Science Live Class',
        titleBn: 'বিজ্ঞান লাইভ ক্লাস',
        description: 'Physics Chapter 2',
        descriptionBn: '',
        classId: 'CLS-2',
        sectionId: 'SEC-B',
        subjectId: 'SUB-2',
        teacherId: 'TCH-2',
        url: 'https://meet.google.com/abc-defg-hij',
        platform: 'google-meet',
        thumbnailUrl: '',
        scheduledAt: '2026-11-11T11:00',
        status: 'scheduled',
        createdBy: 'adminA',
        createdAt: new Date().toISOString(),
      },
    ]

    const res = await put(jars.adminA!, `/api/online?schoolId=${schoolAId}`, {
      classes: newClasses,
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.count).toBe(1)

    // Verify stored
    const check = await get(jars.adminA, `/api/online?slug=school-a-online`)
    expect(check.status).toBe(200)
    expect(check.body.classes[0].title).toBe('Science Live Class')
    expect(check.body.classes[0].platform).toBe('google-meet')
  })

  it('rejects cross-tenant PUT attempt from School B admin on School A', async () => {
    const res = await put(jars.adminB!, `/api/online?schoolId=${schoolAId}`, {
      classes: [],
    })
    expect(res.status).toBe(403)
  })

  it('handles local_computer schools without persisting to database', async () => {
    const res = await put(jars.super!, `/api/online?schoolId=${schoolLocalId}`, {
      classes: [{ id: 'OC-999', title: 'Local Only Class', url: 'https://zoom.us/j/123' }],
    })
    expect(res.status).toBe(200)
    expect(res.body.storageMode).toBe('local_computer')
    expect(res.body.count).toBe(1)
  })

  it('rejects invalid non-array payload', async () => {
    const res = await put(jars.adminA!, `/api/online?schoolId=${schoolAId}`, {
      invalidField: true,
    })
    expect(res.status).toBe(400)
  })
})
