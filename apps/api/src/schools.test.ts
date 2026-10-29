import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Express } from 'express'
import { Readable } from 'node:stream'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import type { MediaStorage } from './storage.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, login, type CookieJar } from './test-utils.js'

const prisma = new PrismaClient()

class FakeStorage implements MediaStorage {
  objects = new Map<string, { body: Buffer; mime: string }>()
  async put(objectKey: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(objectKey, { body, mime: contentType })
  }
  async getStream(objectKey: string): Promise<Readable> {
    const obj = this.objects.get(objectKey)
    if (!obj) throw new Error('NoSuchKey')
    return Readable.from(obj.body)
  }
  async delete(objectKey: string): Promise<void> {
    this.objects.delete(objectKey)
  }
  async presignGet(objectKey: string, ttlSeconds: number): Promise<string> {
    return `https://fake-r2.invalid/${encodeURIComponent(objectKey)}?ttl=${ttlSeconds}`
  }
}

const storage = new FakeStorage()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173', storage })

const FIXTURE_PASSWORD = 'SchoolFixtur3!Secret'
const ADMIN_EMAIL = 'school-branding-admin@test.local'
const SLUG = 'branding-test-slug'

let schoolId = ''
let adminJar: CookieJar

// 1x1 transparent PNG data URLs for test uploads
const PNG_A = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const PNG_B = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEvgHf017tewAAAABJRU5ErkJggg=='

beforeAll(async () => {
  // Clean up any stale records
  await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } })
  await prisma.school.deleteMany({ where: { domain: SLUG } })

  const school = await prisma.school.create({
    data: {
      name: 'Original School Name',
      nameBn: 'আসল স্কুলের নাম',
      domain: SLUG,
      brandName: 'Original Brand',
      brandColor: '#6366f1',
      address: 'Original Address',
      addressBn: 'আসল ঠিকানা',
      phone: '01700000000',
      email: 'original@school.test',
      sessions: JSON.stringify(['2025-26']),
      breaks: JSON.stringify([{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }]),
    },
  })
  schoolId = school.id

  const passwordHash = await hash(FIXTURE_PASSWORD)
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: 'School Admin',
      role: 'school_admin',
      schoolId,
    },
  })

  const loginResult = await login(app, ADMIN_EMAIL, FIXTURE_PASSWORD)
  adminJar = loginResult.jar
})

afterAll(async () => {
  await prisma.mediaObject.deleteMany({ where: { schoolId } })
  await prisma.subject.deleteMany({ where: { schoolId } })
  await prisma.session.deleteMany({ where: { user: { schoolId } } })
  await prisma.user.deleteMany({ where: { schoolId } })
  await prisma.school.deleteMany({ where: { id: schoolId } })
  await prisma.$disconnect()
})

describe('School Branding & Institution Tab API', () => {
  it('reads school metadata via public endpoint', async () => {
    const res = await request(app).get(`/api/schools/public/${SLUG}`)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Original School Name')
    expect(res.body.nameBn).toBe('আসল স্কুলের নাম')
    expect(res.body.addressBn).toBe('আসল ঠিকানা')
    expect(res.body.brandColor).toBe('#6366f1')
  })

  it('updates text fields, addressBn, and subjects via PATCH /api/schools/:id', async () => {
    const patchRes = await request(app)
      .patch(`/api/schools/${schoolId}`)
      .set('Cookie', cookieHeader(adminJar))
      .set('x-csrf-token', csrfToken(adminJar))
      .send({
        name: 'Updated School Name',
        nameBn: 'হালনাগাদ স্কুলের নাম',
        address: '123 New Street',
        addressBn: '১২৩ নতুন রাস্তা',
        brandName: 'New Brand Name',
        brandColor: '#059669',
        subjects: ['Bangla', 'English', 'Science'],
      })

    expect(patchRes.status).toBe(200)
    expect(patchRes.body.school.name).toBe('Updated School Name')
    expect(patchRes.body.school.nameBn).toBe('হালনাগাদ স্কুলের নাম')
    expect(patchRes.body.school.addressBn).toBe('১২৩ নতুন রাস্তা')
    expect(patchRes.body.school.brandName).toBe('New Brand Name')
    expect(patchRes.body.school.brandColor).toBe('#059669')

    // Verify persisted in PostgreSQL
    const dbSchool = await prisma.school.findUnique({ where: { id: schoolId } })
    expect(dbSchool?.name).toBe('Updated School Name')
    expect(dbSchool?.addressBn).toBe('১২৩ নতুন রাস্তা')
  })

  it('uploads logo to storage and saves mediaObject in database', async () => {
    const patchRes = await request(app)
      .patch(`/api/schools/${SLUG}`) // Test patch by slug as well
      .set('Cookie', cookieHeader(adminJar))
      .set('x-csrf-token', csrfToken(adminJar))
      .send({
        logo: PNG_A,
      })

    expect(patchRes.status).toBe(200)
    const logoUrl = patchRes.body.school.logo
    expect(logoUrl).toMatch(/\/api\/media\/public\/[a-zA-Z0-9_-]+/)

    const mediaId = logoUrl.replace('/api/media/public/', '')
    const mediaRow = await prisma.mediaObject.findUnique({ where: { id: mediaId } })
    expect(mediaRow).not.toBeNull()
    expect(mediaRow?.category).toBe('institution_logo')
    expect(storage.objects.has(mediaRow!.objectKey)).toBe(true)
  })

  it('deletes previous logo from storage and mediaObject table when replaced with a new logo', async () => {
    // Current logo
    const currentSchool = await prisma.school.findUnique({ where: { id: schoolId } })
    const oldLogoUrl = currentSchool?.logo!
    const oldMediaId = oldLogoUrl.replace('/api/media/public/', '')
    const oldMediaRow = await prisma.mediaObject.findUnique({ where: { id: oldMediaId } })
    const oldObjectKey = oldMediaRow!.objectKey
    expect(storage.objects.has(oldObjectKey)).toBe(true)

    // Update with a new logo
    const patchRes = await request(app)
      .patch(`/api/schools/${schoolId}`)
      .set('Cookie', cookieHeader(adminJar))
      .set('x-csrf-token', csrfToken(adminJar))
      .send({
        logo: PNG_B,
      })

    expect(patchRes.status).toBe(200)
    const newLogoUrl = patchRes.body.school.logo
    expect(newLogoUrl).not.toBe(oldLogoUrl)

    // The previous logo MUST be completely removed from storage
    expect(storage.objects.has(oldObjectKey)).toBe(false)

    // The previous mediaObject record MUST be deleted from database
    const deletedRow = await prisma.mediaObject.findUnique({ where: { id: oldMediaId } })
    expect(deletedRow).toBeNull()

    // The new logo must exist in storage and DB
    const newMediaId = newLogoUrl.replace('/api/media/public/', '')
    const newMediaRow = await prisma.mediaObject.findUnique({ where: { id: newMediaId } })
    expect(newMediaRow).not.toBeNull()
    expect(storage.objects.has(newMediaRow!.objectKey)).toBe(true)
  })

  it('uploads banner to storage and totally removes it when banner is removed', async () => {
    // 1. Upload banner
    const patch1 = await request(app)
      .patch(`/api/schools/${schoolId}`)
      .set('Cookie', cookieHeader(adminJar))
      .set('x-csrf-token', csrfToken(adminJar))
      .send({
        banner: PNG_A,
      })

    expect(patch1.status).toBe(200)
    const bannerUrl = patch1.body.school.banner
    expect(bannerUrl).toMatch(/\/api\/media\/public\/[a-zA-Z0-9_-]+/)

    const mediaId = bannerUrl.replace('/api/media/public/', '')
    const mediaRow = await prisma.mediaObject.findUnique({ where: { id: mediaId } })
    expect(mediaRow).not.toBeNull()
    expect(mediaRow?.category).toBe('institution_banner')
    expect(storage.objects.has(mediaRow!.objectKey)).toBe(true)

    // 2. Remove banner (set to null or empty)
    const patch2 = await request(app)
      .patch(`/api/schools/${schoolId}`)
      .set('Cookie', cookieHeader(adminJar))
      .set('x-csrf-token', csrfToken(adminJar))
      .send({
        banner: null,
      })

    expect(patch2.status).toBe(200)
    expect(patch2.body.school.banner).toBeNull()

    // Previous banner MUST be completely removed from storage
    expect(storage.objects.has(mediaRow!.objectKey)).toBe(false)

    // Previous mediaObject row MUST be deleted from PostgreSQL
    const deletedBannerRow = await prisma.mediaObject.findUnique({ where: { id: mediaId } })
    expect(deletedBannerRow).toBeNull()
  })
})
