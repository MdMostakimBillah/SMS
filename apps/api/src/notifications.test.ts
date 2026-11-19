import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, login, type CookieJar } from './test-utils.js'

const prisma = new PrismaClient()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173' })

const FIXTURE_PASSWORD = 'NotifFixtur3!Secret'
const EMAILS = {
  adminA: 'notif-admin-a@test.local',
  adminB: 'notif-admin-b@test.local',
  super: 'notif-super@test.local',
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
    where: { domain: { in: ['school-a-notif', 'school-b-notif', 'school-local-notif'] } },
  })

  const schoolA = await prisma.school.create({
    data: {
      name: 'Notif Test School A',
      domain: 'school-a-notif',
      notificationsData: JSON.stringify([
        {
          id: 'NTF-1',
          title: 'Exam Starting Tomorrow',
          titleBn: 'আগামীকাল থেকে পরীক্ষা শুরু',
          message: 'Please arrive by 8:30 AM.',
          messageBn: 'অনুগ্রহ করে সকাল ৮:৩০ এর মধ্যে উপস্থিত থাকুন।',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ]),
    },
  })
  schoolAId = schoolA.id

  const schoolB = await prisma.school.create({
    data: {
      name: 'Notif Test School B',
      domain: 'school-b-notif',
      notificationsData: JSON.stringify([]),
    },
  })
  schoolBId = schoolB.id

  const schoolLocal = await prisma.school.create({
    data: {
      name: 'Notif Test School Local',
      domain: 'school-local-notif',
      storageMode: 'local_computer',
      notificationsData: JSON.stringify([
        { id: 'NTF-LOCAL-0', title: 'Local', type: 'info', read: false },
      ]),
    },
  })
  schoolLocalId = schoolLocal.id

  const passwordHash = await hash(FIXTURE_PASSWORD)

  await prisma.user.create({
    data: {
      email: EMAILS.adminA,
      name: 'Admin A',
      passwordHash,
      role: 'school_admin',
      schoolId: schoolAId,
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.adminB,
      name: 'Admin B',
      passwordHash,
      role: 'school_admin',
      schoolId: schoolBId,
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.super,
      name: 'Super Admin',
      passwordHash,
      role: 'super_admin',
    },
  })

  jars.adminA = await login(app, EMAILS.adminA, FIXTURE_PASSWORD)
  jars.adminB = await login(app, EMAILS.adminB, FIXTURE_PASSWORD)
  jars.super = await login(app, EMAILS.super, FIXTURE_PASSWORD)
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({
    where: { domain: { in: ['school-a-notif', 'school-b-notif', 'school-local-notif'] } },
  })
  await prisma.$disconnect()
})

describe('GET /api/notifications', () => {
  it('returns notifications for authenticated school admin', async () => {
    const res = await get(jars.adminA, '/api/notifications')
    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(1)
    expect(res.body.notifications[0].title).toBe('Exam Starting Tomorrow')
  })

  it('resolves by slug query parameter', async () => {
    const res = await get(jars.super, '/api/notifications?slug=school-a-notif')
    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(1)
    expect(res.body.notifications[0].title).toBe('Exam Starting Tomorrow')
  })

  it('returns empty array when local_computer storage mode', async () => {
    const res = await get(jars.super, `/api/notifications?schoolId=${schoolLocalId}`)
    expect(res.status).toBe(200)
    expect(res.body.storageMode).toBe('local_computer')
    expect(res.body.notifications).toEqual([])
  })
})

describe('PUT /api/notifications', () => {
  it('updates notifications for own school', async () => {
    const updated = [
      {
        id: 'NTF-1',
        title: 'Exam Starting Tomorrow',
        read: true,
      },
      {
        id: 'NTF-2',
        title: 'Holiday Notice',
        type: 'success',
        read: false,
      },
    ]

    const res = await put(jars.adminA!, '/api/notifications', { notifications: updated })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.count).toBe(2)

    const check = await get(jars.adminA, '/api/notifications')
    expect(check.body.notifications).toHaveLength(2)
  })

  it('prevents cross-tenant writes', async () => {
    const res = await put(jars.adminB!, `/api/notifications?schoolId=${schoolAId}`, {
      notifications: [],
    })
    expect(res.status).toBe(403)
  })

  it('allows super admin to update any school', async () => {
    const res = await put(jars.super!, `/api/notifications?schoolId=${schoolBId}`, {
      notifications: [{ id: 'NTF-B1', title: 'Welcome School B', type: 'info', read: false }],
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
