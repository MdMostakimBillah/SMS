/**
 * Integration tests for /api/exams:
 * - GET /api/exams (read examination configurations, routines, marks, etc.)
 * - PUT /api/exams (save exam records and configurations)
 * - Tenant isolation: School A admin cannot modify School B
 * - Super admin can view and update any school's exams
 * - Local computer storageMode handling (no remote database mutations)
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

const FIXTURE_PASSWORD = 'ExamsFixtur3!Secret'
const EMAILS = {
  adminA: 'exams-admin-a@test.local',
  adminB: 'exams-admin-b@test.local',
  super: 'exams-super@test.local',
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
    where: { domain: { in: ['school-a-exams', 'school-b-exams', 'school-local-exams'] } },
  })

  const schoolA = await prisma.school.create({
    data: {
      name: 'Exams Test School A',
      domain: 'school-a-exams',
      examsData: JSON.stringify({
        examConfigs: [
          {
            id: 'EXAM-2026-001',
            name: 'Mid-term Exam 2026',
            nameBn: 'অর্ধবার্ষিক পরীক্ষা ২০২৬',
            type: 'midterm',
            session: '2026',
            startDate: '2026-06-01',
            endDate: '2026-06-15',
            isActive: true,
            isPublished: false,
            publishedAt: null,
            publishedClasses: [],
            createdAt: new Date().toISOString(),
          },
        ],
        rooms: [
          {
            id: 'ROOM-1',
            roomNo: '101',
            roomName: 'Main Exam Hall',
            capacity: 60,
            building: 'Main',
            floor: '1st',
            isActive: true,
          },
        ],
        gradeScales: [
          {
            id: 'GS-1',
            name: 'Standard GPA',
            nameBn: 'স্ট্যান্ডার্ড জিপিএ',
            isActive: true,
            grades: [
              { grade: 'A+', minPct: 80, gpa: 5.0, color: '#10b981' },
              { grade: 'A', minPct: 70, gpa: 4.0, color: '#34d399' },
            ],
          },
        ],
      }),
    },
  })
  schoolAId = schoolA.id

  const schoolB = await prisma.school.create({
    data: {
      name: 'Exams Test School B',
      domain: 'school-b-exams',
      examsData: '{}',
    },
  })
  schoolBId = schoolB.id

  const schoolLocal = await prisma.school.create({
    data: {
      name: 'Exams Local PC School',
      domain: 'school-local-exams',
      storageMode: 'local_computer',
      examsData: '{}',
    },
  })
  schoolLocalId = schoolLocal.id

  const passwordHash = await hash(FIXTURE_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })

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
    const { res, jar } = await login(app, email, FIXTURE_PASSWORD)
    expect(res.status).toBe(200)
    jars[key as keyof typeof EMAILS] = jar
  }
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({
    where: { domain: { in: ['school-a-exams', 'school-b-exams', 'school-local-exams'] } },
  })
  await prisma.$disconnect()
})

describe('GET /api/exams', () => {
  it('returns exam records for authenticated school admin', async () => {
    const res = await get(jars.adminA, `/api/exams?slug=school-a-exams`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.examConfigs)).toBe(true)
    expect(res.body.examConfigs).toHaveLength(1)
    expect(res.body.examConfigs[0].name).toBe('Mid-term Exam 2026')
    expect(res.body.rooms).toHaveLength(1)
    expect(res.body.gradeScales).toHaveLength(1)
  })

  it('prevents cross-tenant read from another school admin', async () => {
    const res = await get(jars.adminB, `/api/exams?schoolId=${schoolAId}`)
    expect(res.status).toBe(403)
  })

  it('returns empty arrays and storageMode flag for local_computer school', async () => {
    const res = await get(jars.super, `/api/exams?slug=school-local-exams`)
    expect(res.status).toBe(200)
    expect(res.body.storageMode).toBe('local_computer')
    expect(res.body.examConfigs).toEqual([])
    expect(res.body.rooms).toEqual([])
  })
})

describe('PUT /api/exams', () => {
  it('updates exams records for own school', async () => {
    const payload = {
      examConfigs: [
        {
          id: 'EXAM-2026-002',
          name: 'Annual Exam 2026',
          nameBn: 'বার্ষিক পরীক্ষা ২০২৬',
          type: 'annual',
          session: '2026',
          startDate: '2026-11-01',
          endDate: '2026-11-20',
          isActive: true,
          isPublished: true,
          publishedAt: new Date().toISOString(),
          publishedClasses: ['Class 10'],
          createdAt: new Date().toISOString(),
        },
      ],
      subjectMarkConfigs: [
        {
          id: 'SMC-1',
          examId: 'EXAM-2026-002',
          classId: 'CLS-10',
          subjectId: 'SUB-MATH',
          fullMarks: 100,
          passMarks: 33,
          subExams: [],
        },
      ],
      studentMarks: [
        {
          id: 'SM-1',
          examId: 'EXAM-2026-002',
          studentId: 'STU-001',
          subjectId: 'SUB-MATH',
          classId: 'CLS-10',
          sectionId: 'SEC-A',
          subExamMarks: {},
          totalMarks: 85,
          grade: 'A+',
          enteredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      routines: [
        {
          id: 'ROUTINE-1',
          examId: 'EXAM-2026-002',
          classId: 'CLS-10',
          sectionId: 'SEC-A',
          subjectId: 'SUB-MATH',
          date: '2026-11-02',
          startTime: '10:00',
          endTime: '13:00',
          roomNo: '101',
          status: 'upcoming',
          createdAt: new Date().toISOString(),
        },
      ],
    }

    const res = await put(jars.adminA!, '/api/exams', payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.examConfigs).toHaveLength(1)
    expect(res.body.examConfigs[0].name).toBe('Annual Exam 2026')
    expect(res.body.studentMarks).toHaveLength(1)
    expect(res.body.studentMarks[0].grade).toBe('A+')

    // Verify DB persisted state
    const saved = await prisma.school.findUnique({ where: { id: schoolAId } })
    const parsed = JSON.parse(saved?.examsData || '{}')
    expect(parsed.examConfigs[0].name).toBe('Annual Exam 2026')
    expect(parsed.studentMarks[0].totalMarks).toBe(85)
  })

  it('rejects cross-tenant modification attempt from School B admin', async () => {
    const payload = {
      schoolId: schoolAId,
      examConfigs: [{ id: 'MALICIOUS', name: 'Hacked Exam' }],
    }
    const res = await put(jars.adminB!, `/api/exams?schoolId=${schoolAId}`, payload)
    expect(res.status).toBe(403)
  })

  it('allows super admin to update any school exams data', async () => {
    const payload = {
      examConfigs: [
        {
          id: 'EXAM-SUPER-1',
          name: 'Super Admin Override Exam',
          nameBn: 'সুপার অ্যাডমিন পরীক্ষা',
          type: 'custom',
          session: '2026',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          isActive: true,
          isPublished: false,
          publishedAt: null,
          publishedClasses: [],
          createdAt: new Date().toISOString(),
        },
      ],
    }
    const res = await put(jars.super!, `/api/exams?schoolId=${schoolBId}`, payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const saved = await prisma.school.findUnique({ where: { id: schoolBId } })
    const parsed = JSON.parse(saved?.examsData || '{}')
    expect(parsed.examConfigs[0].name).toBe('Super Admin Override Exam')
  })

  it('handles local_computer storageMode without overwriting database records', async () => {
    const payload = {
      examConfigs: [{ id: 'EXAM-LOCAL', name: 'Local Exam' }],
    }
    const res = await put(jars.super!, `/api/exams?schoolId=${schoolLocalId}`, payload)
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Local computer storage')

    const saved = await prisma.school.findUnique({ where: { id: schoolLocalId } })
    expect(saved?.examsData).toBe('{}')
  })
})
