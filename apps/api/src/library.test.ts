/**
 * Integration tests for /api/library:
 * - GET /api/library (read books, categories, copies, borrowings, digital books, reading sessions, settings)
 * - PUT /api/library (save library records and configurations)
 * - Tenant isolation: School A admin cannot modify School B
 * - Cross-tenant read protection
 * - Super admin can view and update any school's library
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

const FIXTURE_PASSWORD = 'LibraryFixtur3!Secret'
const EMAILS = {
  adminA: 'library-admin-a@test.local',
  adminB: 'library-admin-b@test.local',
  super: 'library-super@test.local',
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
    where: { domain: { in: ['school-a-library', 'school-b-library', 'school-local-library'] } },
  })

  const schoolA = await prisma.school.create({
    data: {
      name: 'Library Test School A',
      domain: 'school-a-library',
      libraryData: JSON.stringify({
        books: [
          {
            id: 'LB-001',
            title: 'Mathematics for Class 10',
            titleBn: 'দশম শ্রেণির গণিত',
            author: 'Dr. A.K. Rahman',
            authorBn: 'ড. এ.কে. রহমান',
            isbn: '978-984-001-001-1',
            categoryId: 'CAT-001',
            shelf: 'A-01',
            description: 'Complete math textbook',
            descriptionBn: 'সম্পূর্ণ গণিত পাঠ্যপুস্তক',
            totalCopies: 4,
            availableCopies: 3,
            isDigital: false,
            coverUrl: '',
            isActive: true,
            createdAt: '2025-01-15',
          },
        ],
        categories: [
          {
            id: 'CAT-001',
            name: 'Mathematics',
            nameBn: 'গণিত',
            description: 'Math books',
            descriptionBn: 'গণিত বই',
            isActive: true,
            createdAt: '2025-01-10',
          },
        ],
        copies: [
          {
            id: 'BC-001',
            bookId: 'LB-001',
            copyNumber: 1,
            barcode: 'LB-001-C01',
            condition: 'good',
            status: 'available',
            isActive: true,
            createdAt: '2025-01-15',
          },
        ],
        borrowings: [],
        digitalBooks: [],
        readingSessions: [],
        settings: {
          maxBooksPerStudent: 3,
          borrowingDurationDays: 14,
          renewalLimit: 2,
          finePerDay: 5,
          lostBookFee: 500,
          damagedBookFee: 200,
          allowRenewal: true,
          digitalAccessEnabled: true,
          maxDigitalReaders: 50,
        },
      }),
    },
  })
  schoolAId = schoolA.id

  const schoolB = await prisma.school.create({
    data: {
      name: 'Library Test School B',
      domain: 'school-b-library',
      libraryData: JSON.stringify({
        books: [],
        categories: [],
        copies: [],
        borrowings: [],
        digitalBooks: [],
        readingSessions: [],
      }),
    },
  })
  schoolBId = schoolB.id

  const schoolLocal = await prisma.school.create({
    data: {
      name: 'Library Local PC School',
      domain: 'school-local-library',
      storageMode: 'local_computer',
      libraryData: '{}',
    },
  })
  schoolLocalId = schoolLocal.id

  const passwordHash = await hash(FIXTURE_PASSWORD, {
    algorithm: 2,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 1,
  })

  await prisma.user.create({
    data: {
      email: EMAILS.adminA,
      name: 'Admin Library A',
      passwordHash,
      role: 'school_admin',
      schoolId: schoolA.id,
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.adminB,
      name: 'Admin Library B',
      passwordHash,
      role: 'school_admin',
      schoolId: schoolB.id,
    },
  })

  await prisma.user.create({
    data: {
      email: EMAILS.super,
      name: 'Super Admin Library',
      passwordHash,
      role: 'super_admin',
      schoolId: null,
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
    where: { domain: { in: ['school-a-library', 'school-b-library', 'school-local-library'] } },
  })
  await prisma.$disconnect()
})

describe('Library API (/api/library)', () => {
  it('GET /api/library returns library payload for School A', async () => {
    const res = await get(jars.adminA, `/api/library?slug=${schoolAId}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.books)).toBe(true)
    expect(res.body.books).toHaveLength(1)
    expect(res.body.books[0].title).toBe('Mathematics for Class 10')
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.settings?.maxBooksPerStudent).toBe(3)
  })

  it('PUT /api/library updates books, copies, and categories for School A', async () => {
    const payload = {
      schoolId: schoolAId,
      books: [
        {
          id: 'LB-001',
          title: 'Mathematics for Class 10 (Updated)',
          titleBn: 'দশম শ্রেণির গণিত',
          author: 'Dr. A.K. Rahman',
          authorBn: 'ড. এ.কে. রহমান',
          isbn: '978-984-001-001-1',
          categoryId: 'CAT-001',
          shelf: 'A-01',
          totalCopies: 5,
          availableCopies: 4,
          isDigital: false,
          coverUrl: '',
          isActive: true,
        },
        {
          id: 'LB-002',
          title: 'Physics for Class 10',
          titleBn: 'দশম শ্রেণির পদার্থবিজ্ঞান',
          author: 'Prof. S. Ahmed',
          authorBn: 'প্রফে. এস. আহমেদ',
          isbn: '978-984-001-002-8',
          categoryId: 'CAT-002',
          shelf: 'B-01',
          totalCopies: 2,
          availableCopies: 2,
          isDigital: false,
          coverUrl: '',
          isActive: true,
        },
      ],
      categories: [
        { id: 'CAT-001', name: 'Mathematics', nameBn: 'গণিত', isActive: true },
        { id: 'CAT-002', name: 'Science', nameBn: 'বিজ্ঞান', isActive: true },
      ],
      copies: [
        { id: 'BC-001', bookId: 'LB-001', copyNumber: 1, barcode: 'LB-001-C01', condition: 'good', status: 'available', isActive: true },
        { id: 'BC-002', bookId: 'LB-002', copyNumber: 1, barcode: 'LB-002-C01', condition: 'new', status: 'available', isActive: true },
      ],
      borrowings: [
        {
          id: 'BRW-001',
          studentId: 'STU-001',
          bookId: 'LB-001',
          copyId: 'BC-001',
          issueDate: '2026-01-01',
          dueDate: '2026-01-15',
          status: 'borrowed',
          condition: 'good',
          fine: 0,
          renewalCount: 0,
          issuedBy: 'admin',
        },
      ],
      digitalBooks: [],
      readingSessions: [],
      settings: {
        maxBooksPerStudent: 5,
        borrowingDurationDays: 21,
        renewalLimit: 3,
        finePerDay: 10,
        lostBookFee: 600,
        damagedBookFee: 300,
        allowRenewal: true,
        digitalAccessEnabled: true,
        maxDigitalReaders: 100,
      },
    }

    const res = await put(jars.adminA!, '/api/library', payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.counts.books).toBe(2)
    expect(res.body.counts.categories).toBe(2)
    expect(res.body.counts.borrowings).toBe(1)

    // Verify in GET
    const verifyRes = await get(jars.adminA, `/api/library?slug=${schoolAId}`)
    expect(verifyRes.status).toBe(200)
    expect(verifyRes.body.books).toHaveLength(2)
    expect(verifyRes.body.books[0].title).toBe('Mathematics for Class 10 (Updated)')
    expect(verifyRes.body.settings.maxBooksPerStudent).toBe(5)
  })

  it('Tenant isolation: School A admin cannot update School B library', async () => {
    const payload = {
      schoolId: schoolBId,
      books: [{ id: 'LB-HACK', title: 'Hacked Book' }],
      categories: [],
      copies: [],
      borrowings: [],
      digitalBooks: [],
      readingSessions: [],
    }

    const res = await put(jars.adminA!, `/api/library?schoolId=${schoolBId}`, payload)
    expect(res.status).toBe(403)
  })

  it('Cross-tenant read protection: School A admin cannot read School B library', async () => {
    const res = await get(jars.adminA, `/api/library?slug=${schoolBId}`)
    expect(res.status).toBe(403)
  })

  it('Super admin can update any school library', async () => {
    const payload = {
      schoolId: schoolBId,
      books: [
        {
          id: 'LB-SUPER-01',
          title: 'Super Admin Master Book',
          titleBn: 'মাস্টার বই',
          totalCopies: 1,
          availableCopies: 1,
          isActive: true,
        },
      ],
      categories: [{ id: 'CAT-SUPER', name: 'Special', nameBn: 'বিশেষ', isActive: true }],
      copies: [],
      borrowings: [],
      digitalBooks: [],
      readingSessions: [],
    }

    const res = await put(jars.super!, `/api/library?schoolId=${schoolBId}`, payload)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.counts.books).toBe(1)

    const verifyRes = await get(jars.super, `/api/library?slug=${schoolBId}`)
    expect(verifyRes.status).toBe(200)
    expect(verifyRes.body.books[0].title).toBe('Super Admin Master Book')
  })

  it('storageMode === local_computer returns offline response without writing to cloud db', async () => {
    const getRes = await get(jars.super, `/api/library?slug=${schoolLocalId}`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.storageMode).toBe('local_computer')
    expect(getRes.body.books).toHaveLength(0)

    const putRes = await put(jars.super!, `/api/library?schoolId=${schoolLocalId}`, {
      schoolId: schoolLocalId,
      books: [{ id: 'LB-LOCAL', title: 'Local Only Book' }],
    })
    expect(putRes.status).toBe(200)
    expect(putRes.body.storageMode).toBe('local_computer')
    expect(putRes.body.message).toContain('offline mode active')
  })

  it('Unauthenticated request to PUT /api/library returns 401', async () => {
    const res = await request(app).put('/api/library').send({ books: [] })
    expect(res.status).toBe(401)
  })
})
