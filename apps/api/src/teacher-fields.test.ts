/**
 * Phase 7 teacher field-coverage tests: the extended Zod allowlist must persist
 * every editable column of the existing Prisma `Teacher` model (no silent data
 * loss when the full profile form writes through the API), while `schoolId`,
 * `id`, `createdAt` and friends stay stripped (mass-assignment safe).
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

const FIXTURE_PASSWORD = 'FieldFixtur3!Secret'
const EMAILS = {
  admin: 'fields-admin@test.local',
  super: 'fields-super@test.local',
} as const

const SCHOOL_NAME = 'Field Test School'
const OTHER_SCHOOL_NAME = 'Field Test School Other'

let schoolId = ''
let otherSchoolId = ''
let departmentId = ''
const jars: Partial<Record<keyof typeof EMAILS, CookieJar>> = {}

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
function get(jar: CookieJar, path: string) {
  return request(app).get(path).set('Cookie', cookieHeader(jar))
}

/** The full payload the frontend profile form submits (~45 fields). */
const FULL_PAYLOAD = {
  nameEn: 'Full Field Teacher',
  nameBn: 'পূর্ণ ফিল্ড শিক্ষক',
  gender: 'female',
  dob: '1990-04-12',
  bloodGroup: 'B+',
  religion: 'Islam',
  phone: '+8801700000001',
  email: 'fullfield@fields.test.local',
  address: 'House 1, Road 2, Dhaka',
  nid: '19901234567890123',
  emergencyPhone: '+8801700000002',
  photo: 'data:image/png;base64,AAAA',
  departmentId: '', // filled at runtime
  subjectIds: ['local-subj-1', 'local-subj-2'],
  designation: 'Assistant Professor',
  qualification: 'M.Sc',
  experience: '5 years',
  salary: 55000,
  salaryStartDate: '2026-01-01',
  bonus: 3000,
  overtime: 1500,
  festivalBonus: 20000,
  status: 'on-leave',
  category: 'permanent',
  joiningDate: '2021-06-01',
  inTime: '08:00',
  outTime: '14:30',
  fatherNameEn: 'Father Name',
  fatherNameBn: 'পিতার নাম',
  fatherPhone: '+8801700000003',
  fatherNid: '19601234567890123',
  motherNameEn: 'Mother Name',
  motherNameBn: 'মাতার নাম',
  motherPhone: '+8801700000004',
  guardianName: 'Guardian Name',
  guardianPhone: '+8801700000005',
  guardianRelation: 'brother',
  parentAddress: 'Village Post, District',
  signature: 'data:image/png;base64,BBBB',
  expertSubjects: 'Mathematics, Physics',
  applySalaryRule: true,
}

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_NAME, OTHER_SCHOOL_NAME] } } })

  const school = await prisma.school.create({ data: { name: SCHOOL_NAME } })
  const other = await prisma.school.create({ data: { name: OTHER_SCHOOL_NAME } })
  schoolId = school.id
  otherSchoolId = other.id
  departmentId = (await prisma.department.create({ data: { schoolId, name: 'Field Dept' } })).id

  const pwHash = await hash(FIXTURE_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  await prisma.user.upsert({
    where: { email: EMAILS.admin },
    update: { role: 'school_admin', schoolId, isActive: true, passwordHash: pwHash },
    create: { email: EMAILS.admin, passwordHash: pwHash, name: 'fields-admin', role: 'school_admin', schoolId },
  })
  await prisma.user.upsert({
    where: { email: EMAILS.super },
    update: { role: 'super_admin', schoolId: null, isActive: true, passwordHash: pwHash },
    create: { email: EMAILS.super, passwordHash: pwHash, name: 'fields-super', role: 'super_admin' },
  })

  for (const key of Object.keys(EMAILS) as (keyof typeof EMAILS)[]) {
    const { res } = await login(app, EMAILS[key], FIXTURE_PASSWORD)
    if (res.status !== 200) throw new Error(`fixture login failed for ${key}: ${res.status}`)
    jars[key] = extractCookies(res)
  }
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_NAME, OTHER_SCHOOL_NAME] } } }) // cascades teachers + departments
  await prisma.$disconnect()
})

describe('teacher field coverage (Phase 7 contract extension)', () => {
  it('create + read round-trips the full field set', async () => {
    const res = await post(jars.admin!, '/api/teachers', { ...FULL_PAYLOAD, departmentId })
    expect(res.status).toBe(201)
    const id = res.body.id as string

    const t = (await get(jars.admin!, `/api/teachers/${id}`)).body

    expect(t.schoolId).toBe(schoolId)
    expect(t.nameEn).toBe(FULL_PAYLOAD.nameEn)
    expect(t.nameBn).toBe(FULL_PAYLOAD.nameBn)
    expect(t.gender).toBe(FULL_PAYLOAD.gender)
    expect(t.dob).toBe(FULL_PAYLOAD.dob)
    expect(t.bloodGroup).toBe(FULL_PAYLOAD.bloodGroup)
    expect(t.religion).toBe(FULL_PAYLOAD.religion)
    expect(t.phone).toBe(FULL_PAYLOAD.phone)
    expect(t.email).toBe(FULL_PAYLOAD.email)
    expect(t.address).toBe(FULL_PAYLOAD.address)
    expect(t.nid).toBe(FULL_PAYLOAD.nid)
    expect(t.emergencyPhone).toBe(FULL_PAYLOAD.emergencyPhone)
    expect(t.photo).toBe(FULL_PAYLOAD.photo)
    expect(t.departmentId).toBe(departmentId)
    expect(t.subjectIds).toEqual(FULL_PAYLOAD.subjectIds)
    expect(t.designation).toBe(FULL_PAYLOAD.designation)
    expect(t.qualification).toBe(FULL_PAYLOAD.qualification)
    expect(t.experience).toBe(FULL_PAYLOAD.experience)
    expect(Number(t.salary)).toBe(FULL_PAYLOAD.salary)
    expect(t.salaryStartDate).toBe(FULL_PAYLOAD.salaryStartDate)
    expect(Number(t.bonus)).toBe(FULL_PAYLOAD.bonus)
    expect(Number(t.overtime)).toBe(FULL_PAYLOAD.overtime)
    expect(Number(t.festivalBonus)).toBe(FULL_PAYLOAD.festivalBonus)
    expect(t.status).toBe(FULL_PAYLOAD.status)
    expect(t.category).toBe(FULL_PAYLOAD.category)
    expect(t.joiningDate).toBe(FULL_PAYLOAD.joiningDate)
    expect(t.inTime).toBe(FULL_PAYLOAD.inTime)
    expect(t.outTime).toBe(FULL_PAYLOAD.outTime)
    expect(t.fatherNameEn).toBe(FULL_PAYLOAD.fatherNameEn)
    expect(t.fatherNameBn).toBe(FULL_PAYLOAD.fatherNameBn)
    expect(t.fatherPhone).toBe(FULL_PAYLOAD.fatherPhone)
    expect(t.fatherNid).toBe(FULL_PAYLOAD.fatherNid)
    expect(t.motherNameEn).toBe(FULL_PAYLOAD.motherNameEn)
    expect(t.motherNameBn).toBe(FULL_PAYLOAD.motherNameBn)
    expect(t.motherPhone).toBe(FULL_PAYLOAD.motherPhone)
    expect(t.guardianName).toBe(FULL_PAYLOAD.guardianName)
    expect(t.guardianPhone).toBe(FULL_PAYLOAD.guardianPhone)
    expect(t.guardianRelation).toBe(FULL_PAYLOAD.guardianRelation)
    expect(t.parentAddress).toBe(FULL_PAYLOAD.parentAddress)
    expect(t.signature).toBe(FULL_PAYLOAD.signature)
    expect(t.expertSubjects).toBe(FULL_PAYLOAD.expertSubjects)
    expect(t.applySalaryRule).toBe(true)

    // cleanup
    expect((await request(app).delete(`/api/teachers/${id}`).set('Cookie', cookieHeader(jars.admin!)).set('x-csrf-token', csrfToken(jars.admin!))).status).toBe(200)
  })

  it('defaults: omitted status -> active, omitted applySalaryRule -> false', async () => {
    const res = await post(jars.admin!, '/api/teachers', { nameEn: 'Default Fields Teacher' })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('active')
    expect(res.body.applySalaryRule).toBe(false)
    expect(res.body.subjectIds).toEqual([])
    expect((await request(app).delete(`/api/teachers/${res.body.id as string}`).set('Cookie', cookieHeader(jars.admin!)).set('x-csrf-token', csrfToken(jars.admin!))).status).toBe(200)
  })

  it('update persists extended fields without nulling untouched ones', async () => {
    const created = await post(jars.admin!, '/api/teachers', { ...FULL_PAYLOAD, departmentId })
    const id = created.body.id as string

    const upd = await put(jars.admin!, `/api/teachers/${id}`, {
      gender: 'male',
      nid: '20001234567890123',
      salary: 60000,
      subjectIds: ['only-this-one'],
      applySalaryRule: false,
    })
    expect(upd.status).toBe(200)
    expect(upd.body.gender).toBe('male')
    expect(upd.body.nid).toBe('20001234567890123')
    expect(Number(upd.body.salary)).toBe(60000)
    expect(upd.body.subjectIds).toEqual(['only-this-one'])
    expect(upd.body.applySalaryRule).toBe(false)

    // Untouched extended fields survived the partial update
    expect(upd.body.nameBn).toBe(FULL_PAYLOAD.nameBn)
    expect(upd.body.guardianName).toBe(FULL_PAYLOAD.guardianName)
    expect(upd.body.address).toBe(FULL_PAYLOAD.address)

    expect((await request(app).delete(`/api/teachers/${id}`).set('Cookie', cookieHeader(jars.admin!)).set('x-csrf-token', csrfToken(jars.admin!))).status).toBe(200)
  })

  it('mass assignment on create cannot set schoolId, id, or timestamps', async () => {
    const res = await post(jars.admin!, '/api/teachers', {
      nameEn: 'Forged Fields Teacher',
      schoolId: otherSchoolId, // must be stripped
      id: 'evil-teacher-id', // must be stripped
      createdAt: '2000-01-01T00:00:00.000Z', // must be stripped
      updatedAt: '2000-01-01T00:00:00.000Z', // must be stripped
      createdBy: 'nobody', // local-only field, not a column — stripped
    })
    expect(res.status).toBe(201)
    expect(res.body.schoolId).toBe(schoolId)
    expect(res.body.id).not.toBe('evil-teacher-id')

    const row = await prisma.teacher.findUnique({ where: { id: res.body.id as string } })
    expect(row?.schoolId).toBe(schoolId)
    expect(row?.createdAt.getTime()).toBeGreaterThan(Date.parse('2024-01-01'))

    expect((await request(app).delete(`/api/teachers/${res.body.id as string}`).set('Cookie', cookieHeader(jars.admin!)).set('x-csrf-token', csrfToken(jars.admin!))).status).toBe(200)
  })

  it('foreign departmentId is rejected with 400 (tenant reference check)', async () => {
    const foreignDept = await prisma.department.create({ data: { schoolId: otherSchoolId, name: 'Foreign Field Dept' } })
    const res = await post(jars.admin!, '/api/teachers', { nameEn: 'Bad Ref Teacher', departmentId: foreignDept.id })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/departmentId/i)
  })

  it('superadmin still cannot write (extended fields did not change policy)', async () => {
    const res = await post(jars.super!, '/api/teachers', { nameEn: 'Super Field Write' })
    expect(res.status).toBe(403)
  })

  it('nameEn is required; invalid email body -> 400', async () => {
    expect((await post(jars.admin!, '/api/teachers', { phone: '+8801' })).status).toBe(400)
    expect((await post(jars.admin!, '/api/teachers', { nameEn: 'Bad Email', email: 'not-an-email' })).status).toBe(400)
  })
})
