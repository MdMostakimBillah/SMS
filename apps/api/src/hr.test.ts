/**
 * Integration tests for /api/hr (HR & Payroll):
 * - GET /api/hr (read HR & payroll records: increments, bonuses, promotions, monthlySalaryConfigs, facilities, teacherFacilities)
 * - PUT /api/hr (save HR & payroll records)
 * - Tenant isolation: School A admin cannot modify School B
 * - Super admin can view and update any school's HR & payroll data
 * - Dual persistence: Persists to PostgreSQL database even in local_computer storageMode
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

const FIXTURE_PASSWORD = 'HRFixtur3!Secret'
const EMAILS = {
  adminA: 'hr-admin-a@test.local',
  adminB: 'hr-admin-b@test.local',
  super: 'hr-super@test.local',
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
    where: { domain: { in: ['school-a-hr', 'school-b-hr', 'school-local-hr'] } },
  })

  const schoolA = await prisma.school.create({
    data: {
      name: 'HR Test School A',
      domain: 'school-a-hr',
      hrData: JSON.stringify({
        increments: [
          {
            id: 'INC-001',
            teacherId: 'TCH-001',
            type: 'annual',
            amount: 3000,
            percentage: 5,
            reason: 'Annual Increment',
            date: '2026-01-01',
          },
        ],
        monthlySalaryConfigs: [
          {
            id: 'MSC-001',
            month: '2026-06',
            teacherId: 'TCH-001',
            bonus: 5000,
            festivalBonus: 10000,
            applyDeductionRule: true,
            fundContributionPercent: 2,
            createdAt: '2026-06-01',
          },
        ],
        facilities: [
          {
            id: 'FAC-001',
            name: 'Transport',
            nameBn: 'পরিবহন',
            defaultAmount: 1500,
            type: 'monthly',
            isActive: true,
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
      }),
    },
  })
  schoolAId = schoolA.id

  const schoolB = await prisma.school.create({
    data: {
      name: 'HR Test School B',
      domain: 'school-b-hr',
      hrData: '{}',
    },
  })
  schoolBId = schoolB.id

  const schoolLocal = await prisma.school.create({
    data: {
      name: 'HR Local PC School',
      domain: 'school-local-hr',
      storageMode: 'local_computer',
      hrData: '{}',
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
      name: 'Admin A',
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.adminB,
      passwordHash,
      role: 'school_admin',
      schoolId: schoolB.id,
      name: 'Admin B',
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.super,
      passwordHash,
      role: 'super_admin',
      name: 'Super Admin',
    },
  })

  for (const [key, email] of Object.entries(EMAILS)) {
    jars[key as keyof typeof EMAILS] = await login(app, email, FIXTURE_PASSWORD)
  }
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({
    where: { domain: { in: ['school-a-hr', 'school-b-hr', 'school-local-hr'] } },
  })
  await prisma.$disconnect()
})

describe('GET /api/hr', () => {
  it('returns HR & payroll records for the authenticated school', async () => {
    const res = await get(jars.adminA, '/api/hr')
    expect(res.status).toBe(200)
    expect(res.body.increments).toHaveLength(1)
    expect(res.body.increments[0].id).toBe('INC-001')
    expect(res.body.monthlySalaryConfigs).toHaveLength(1)
    expect(res.body.monthlySalaryConfigs[0].id).toBe('MSC-001')
    expect(res.body.facilities).toHaveLength(1)
    expect(res.body.facilities[0].name).toBe('Transport')
  })

  it('allows public query by slug with resolved school', async () => {
    const res = await get(undefined, '/api/hr?slug=school-a-hr')
    expect(res.status).toBe(200)
    expect(res.body.increments).toHaveLength(1)
    expect(res.body.monthlySalaryConfigs).toHaveLength(1)
  })

  it('returns 404 if queried with unknown slug', async () => {
    const res = await get(undefined, '/api/hr?slug=does-not-exist')
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/hr & Dual Persistence', () => {
  it('saves HR & payroll records for own school', async () => {
    const payload = {
      increments: [{ id: 'INC-002', teacherId: 'TCH-002', amount: 4000, percentage: 6, reason: 'Test' }],
      monthlySalaryConfigs: [
        {
          id: 'MSC-002',
          month: '2026-06',
          teacherId: 'TCH-002',
          bonus: 6000,
          festivalBonus: 12000,
          applyDeductionRule: true,
          fundContributionPercent: 2,
        },
      ],
      facilities: [{ id: 'FAC-002', name: 'Housing', defaultAmount: 5000, type: 'monthly', isActive: true }],
      teacherFacilities: [{ id: 'TF-002', teacherId: 'TCH-002', facilityId: 'FAC-002', amount: 5000 }],
    }
    const res = await put(jars.adminA!, '/api/hr', payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.monthlySalaryConfigs).toHaveLength(1)
    expect(res.body.monthlySalaryConfigs[0].bonus).toBe(6000)

    const saved = await prisma.school.findUnique({ where: { id: schoolAId } })
    const parsed = JSON.parse(saved?.hrData || '{}')
    expect(parsed.monthlySalaryConfigs[0].id).toBe('MSC-002')
    expect(parsed.teacherFacilities[0].amount).toBe(5000)
  })

  it('enforces tenant isolation: School A admin cannot update School B', async () => {
    const payload = {
      monthlySalaryConfigs: [{ id: 'MSC-HACK', teacherId: 'TCH-B', month: '2026-06', bonus: 99999 }],
    }
    const res = await put(jars.adminA!, `/api/hr?schoolId=${schoolBId}`, payload)
    expect(res.status).toBe(403)
  })

  it('super admin can update any school HR & payroll data', async () => {
    const payload = {
      monthlySalaryConfigs: [{ id: 'MSC-SUPER', teacherId: 'TCH-B', month: '2026-06', bonus: 15000 }],
    }
    const res = await put(jars.super!, `/api/hr?schoolId=${schoolBId}`, payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const saved = await prisma.school.findUnique({ where: { id: schoolBId } })
    const parsed = JSON.parse(saved?.hrData || '{}')
    expect(parsed.monthlySalaryConfigs[0].bonus).toBe(15000)
  })

  it('persists HR & payroll data to database even in local_computer storageMode for dual persistence', async () => {
    const payload = {
      monthlySalaryConfigs: [{ id: 'MSC-LOCAL-DUAL', teacherId: 'TCH-LOC', month: '2026-06', bonus: 8000 }],
      facilities: [{ id: 'FAC-LOCAL', name: 'PC Allowance', defaultAmount: 1200, type: 'monthly', isActive: true }],
    }
    const res = await put(jars.super!, `/api/hr?schoolId=${schoolLocalId}`, payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.storageMode).toBe('local_computer')

    const saved = await prisma.school.findUnique({ where: { id: schoolLocalId } })
    const parsed = JSON.parse(saved?.hrData || '{}')
    expect(parsed.monthlySalaryConfigs[0].id).toBe('MSC-LOCAL-DUAL')
    expect(parsed.facilities[0].name).toBe('PC Allowance')
  })
})
