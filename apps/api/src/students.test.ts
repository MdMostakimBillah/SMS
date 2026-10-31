import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, extractCookies, login, type CookieJar } from './test-utils.js'

const prisma = new PrismaClient()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173' })

const FIXTURE_PASSWORD = 'StudentFixtur3!Secret'
const EMAILS = {
  adminA: 'student-admin-a@test.local',
  adminB: 'student-admin-b@test.local',
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
    prisma.school.create({ data: { name: 'Student Test School A', domain: 'studenta.test.local' } }),
    prisma.school.create({ data: { name: 'Student Test School B', domain: 'studentb.test.local' } }),
  ])
  schoolAId = sA.id
  schoolBId = sB.id

  await Promise.all([
    prisma.user.create({
      data: {
        email: EMAILS.adminA,
        passwordHash,
        name: 'Admin A',
        role: 'school_admin',
        schoolId: schoolAId,
      },
    }),
    prisma.user.create({
      data: {
        email: EMAILS.adminB,
        passwordHash,
        name: 'Admin B',
        role: 'school_admin',
        schoolId: schoolBId,
      },
    }),
  ])

  for (const [key, email] of Object.entries(EMAILS)) {
    const { res } = await login(app, email, FIXTURE_PASSWORD)
    jars[key as keyof typeof EMAILS] = extractCookies(res)
  }
})

afterAll(async () => {
  await prisma.student.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } }).catch(() => {})
  await prisma.user.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } }).catch(() => {})
  await prisma.school.deleteMany({ where: { id: { in: [schoolAId, schoolBId] } } }).catch(() => {})
  await prisma.$disconnect()
})

describe('/api/students', () => {
  it('supports single and bulk student CRUD with tenant isolation', async () => {
    const jarA = jars.adminA!
    const jarB = jars.adminB!

    // 1. Create a student in School A
    const resA = await post(jarA, '/api/students', {
      nameEn: 'Sadman Sakib',
      nameBn: 'সাদমান সাকিব',
      phone: '01711111111',
      class: 'Class 9',
      section: 'A',
      roll: '01',
      academicYear: '2026',
    })
    expect(resA.status).toBe(201)
    const studentA = resA.body.student
    expect(studentA.nameEn).toBe('Sadman Sakib')
    expect(studentA.schoolId).toBe(schoolAId)
    expect(studentA.roll).toBe('01')

    // 2. School B cannot see School A's student
    const listB = await get(jarB, '/api/students')
    expect(listB.status).toBe(200)
    expect(listB.body.students.some((s: { id: string }) => s.id === studentA.id)).toBe(false)

    // 3. School B cannot update or delete School A's student
    const updateB = await put(jarB, `/api/students/${studentA.id}`, { nameEn: 'Hacked' })
    expect(updateB.status).toBe(404)

    const deleteB = await del(jarB, `/api/students/${studentA.id}`)
    expect(deleteB.status).toBe(404)

    // 4. Update student in School A
    const updateA = await put(jarA, `/api/students/${studentA.id}`, { roll: '05', section: 'B' })
    expect(updateA.status).toBe(200)
    expect(updateA.body.student.roll).toBe('05')
    expect(updateA.body.student.section).toBe('B')

    // 5. Bulk create/update in School A
    const bulkRes = await post(jarA, '/api/students/bulk', {
      students: [
        {
          id: 'ET-2026-00101',
          nameEn: 'Student 101',
          class: 'Class 9',
          section: 'A',
          roll: '101',
        },
        {
          id: 'ET-2026-00102',
          nameEn: 'Student 102',
          class: 'Class 9',
          section: 'A',
          roll: '102',
        },
      ],
    })
    expect(bulkRes.status).toBe(200)
    expect(bulkRes.body.count).toBe(2)

    // 6. List students in School A
    const listA = await get(jarA, '/api/students')
    expect(listA.status).toBe(200)
    expect(listA.body.total).toBeGreaterThanOrEqual(3)

    // 7. Delete student in School A
    const delA = await del(jarA, `/api/students/${studentA.id}`)
    expect(delA.status).toBe(200)
    expect(delA.body.success).toBe(true)
  })
})
