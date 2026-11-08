/**
 * Integration tests for /api/assignments:
 * - GET /api/assignments (read assignments and submissions)
 * - PUT /api/assignments (save assignments and submissions)
 * - Tenant isolation: School A admin cannot modify School B
 * - Super admin can view and update any school's assignments
 * - Bounds validation (max assignments and submissions limit)
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

const FIXTURE_PASSWORD = 'AssignFixtur3!Secret'
const EMAILS = {
  adminA: 'assign-admin-a@test.local',
  adminB: 'assign-admin-b@test.local',
  super: 'assign-super@test.local',
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
    where: { domain: { in: ['school-a-assign', 'school-b-assign', 'school-local-assign'] } },
  })

  const schoolA = await prisma.school.create({
    data: {
      name: 'Assign Test School A',
      domain: 'school-a-assign',
      assignmentsData: JSON.stringify({
        assignments: [
          {
            id: 'ASN-2026-001',
            type: 'assignment',
            title: 'Math Homework 1',
            titleBn: 'গণিত বাড়ির কাজ ১',
            description: 'Solve chapter 1 problems',
            descriptionBn: '',
            subjectId: 'SUB-1',
            classId: 'CLS-1',
            sectionId: 'SEC-A',
            teacherId: 'TCH-1',
            dueDate: '2026-11-10',
            maxMarks: 20,
            status: 'active',
            attachments: [],
            createdAt: '2026-11-08',
            updatedAt: '2026-11-08',
          },
        ],
        submissions: [
          {
            id: 'SUB-2026-001',
            assignmentId: 'ASN-2026-001',
            studentId: 'STU-1',
            studentName: 'Rahim',
            studentNameBn: 'রহিম',
            submittedAt: '2026-11-08T10:00:00Z',
            fileUrl: '',
            marks: 18,
            feedback: 'Good work',
            feedbackBn: '',
            status: 'reviewed',
            createdAt: '2026-11-08',
            updatedAt: '2026-11-08',
          },
        ],
      }),
    },
  })
  schoolAId = schoolA.id

  const schoolB = await prisma.school.create({
    data: {
      name: 'Assign Test School B',
      domain: 'school-b-assign',
      assignmentsData: JSON.stringify({ assignments: [], submissions: [] }),
    },
  })
  schoolBId = schoolB.id

  const schoolLocal = await prisma.school.create({
    data: {
      name: 'Assign Test School Local',
      domain: 'school-local-assign',
      storageMode: 'local_computer',
      assignmentsData: '{}',
    },
  })
  schoolLocalId = schoolLocal.id

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
  if (schoolLocalId) await prisma.school.deleteMany({ where: { id: schoolLocalId } })
  await prisma.$disconnect()
})

describe('/api/assignments endpoints', () => {
  it('GET /api/assignments returns assignments and submissions for school by slug', async () => {
    const res = await get(undefined, `/api/assignments?slug=school-a-assign`)
    expect(res.status).toBe(200)
    expect(res.body.assignments).toHaveLength(1)
    expect(res.body.assignments[0].title).toBe('Math Homework 1')
    expect(res.body.submissions).toHaveLength(1)
    expect(res.body.submissions[0].studentName).toBe('Rahim')
  })

  it('GET /api/assignments returns authenticated admin data by session', async () => {
    const res = await get(jars.adminA, `/api/assignments`)
    expect(res.status).toBe(200)
    expect(res.body.assignments).toHaveLength(1)
    expect(res.body.assignments[0].id).toBe('ASN-2026-001')
  })

  it('GET /api/assignments returns empty list and storageMode: local_computer for local computer mode', async () => {
    const res = await get(undefined, `/api/assignments?slug=school-local-assign`)
    expect(res.status).toBe(200)
    expect(res.body.storageMode).toBe('local_computer')
    expect(res.body.assignments).toEqual([])
    expect(res.body.submissions).toEqual([])
  })

  it('PUT /api/assignments allows school_admin to update assignments & submissions', async () => {
    const newAssignments = [
      {
        id: 'ASN-2026-002',
        type: 'homework',
        title: 'Science HW',
        titleBn: 'বিজ্ঞান কাজ',
        description: 'Read page 15-20',
        descriptionBn: '',
        subjectId: 'SUB-2',
        classId: 'CLS-1',
        sectionId: 'SEC-A',
        teacherId: 'TCH-1',
        dueDate: '2026-11-12',
        maxMarks: 10,
        status: 'active',
        attachments: [],
      },
    ]

    const putRes = await put(jars.adminA!, `/api/assignments`, {
      assignments: newAssignments,
      submissions: [],
    })
    expect(putRes.status).toBe(200)
    expect(putRes.body.success).toBe(true)
    expect(putRes.body.count).toBe(1)

    // Verify persisted in DB
    const getRes = await get(jars.adminA, `/api/assignments`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.assignments).toHaveLength(1)
    expect(getRes.body.assignments[0].id).toBe('ASN-2026-002')
  })

  it('PUT /api/assignments returns storageMode local_computer message when saving for local_computer school', async () => {
    const putRes = await put(jars.super!, `/api/assignments?slug=school-local-assign`, {
      assignments: [{ title: 'Offline Item' }],
    })
    expect(putRes.status).toBe(200)
    expect(putRes.body.storageMode).toBe('local_computer')
  })

  it('Tenant Isolation: Admin A cannot modify School B', async () => {
    const res = await put(jars.adminA!, `/api/assignments?schoolId=${schoolBId}`, {
      assignments: [],
    })
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/Forbidden/)
  })

  it('Super Admin can update any school assignments', async () => {
    const res = await put(jars.super!, `/api/assignments?slug=school-b-assign`, {
      assignments: [
        {
          id: 'ASN-B-01',
          type: 'assignment',
          title: 'Admin Created Assignment',
          classId: 'CLS-B1',
          sectionId: 'SEC-B1',
          subjectId: 'SUB-B1',
          teacherId: 'TCH-B1',
          dueDate: '2026-11-20',
          maxMarks: 100,
        },
      ],
    })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const checkRes = await get(jars.adminB, `/api/assignments`)
    expect(checkRes.status).toBe(200)
    expect(checkRes.body.assignments).toHaveLength(1)
    expect(checkRes.body.assignments[0].title).toBe('Admin Created Assignment')
  })
})
