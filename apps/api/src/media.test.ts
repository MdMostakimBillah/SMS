/**
 * Media API tests (Cloudflare R2 phase) — upload/download authorization.
 *
 * Runs against an in-memory FakeStorage (no network, no real buckets) and the
 * isolated `edutech_test` database with synthetic files only.
 *
 * Covers: authentication boundary, RBAC (incl. super_admin write exclusion),
 * server-side size/MIME/signature enforcement per category, tenant-scoped
 * object keys, cross-tenant negative matrix (uniform 404s for download,
 * delete and listing), presigned-URL TTL clamping, authorized streaming,
 * tombstone deletion with 3-year retention, orphan compensation and the
 * unconfigured-storage 503 mode.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import type { Express } from 'express'
import { Readable } from 'node:stream'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { RETENTION_YEARS } from './routes/media.js'
import type { MediaStorage } from './storage.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, extractCookies, login, type CookieJar } from './test-utils.js'

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

let storage = new FakeStorage()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173', storage })
const appNoStorage: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173', storage: null })

const FIXTURE_PASSWORD = 'MediaFixtur3!Secret'
const EMAILS = {
  adminA: 'md-admin-a@test.local',
  adminB: 'md-admin-b@test.local',
  hrA: 'md-hr-a@test.local',
  teacherA: 'md-teacher-a@test.local',
  super: 'md-super@test.local',
} as const

const SCHOOL_A_NAME = 'MD Test School A'
const SCHOOL_B_NAME = 'MD Test School B'
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000'

let schoolAId = ''
let schoolBId = ''
let mediaAId = ''
let mediaAKey = ''
const jars: Partial<Record<keyof typeof EMAILS, CookieJar>> = {}

// ---- synthetic files (magic-byte-valid, no real student data) ----
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)
function jpegBytes(sizeBytes = 64): Buffer {
  const buf = Buffer.alloc(Math.max(sizeBytes, 4), 0x41)
  buf[0] = 0xff
  buf[1] = 0xd8
  buf[2] = 0xff
  buf[3] = 0xe0
  return buf
}
function webpBytes(): Buffer {
  const buf = Buffer.alloc(32, 0x00)
  buf.write('RIFF', 0, 'ascii')
  buf.write('WEBP', 8, 'ascii')
  return buf
}

function upload(jar: CookieJar, category: string, file: { buffer: Buffer; filename: string; contentType: string }) {
  return request(app)
    .post('/api/media/upload')
    .set('Cookie', cookieHeader(jar))
    .set('x-csrf-token', csrfToken(jar))
    .field('category', category)
    .attach('file', file.buffer, { filename: file.filename, contentType: file.contentType })
}
function get(jar: CookieJar, path: string) {
  return request(app).get(path).set('Cookie', cookieHeader(jar))
}
function del(jar: CookieJar, path: string) {
  return request(app)
    .delete(path)
    .set('Cookie', cookieHeader(jar))
    .set('x-csrf-token', csrfToken(jar))
}

let logSpy: MockInstance
function auditEvents(): Array<Record<string, unknown>> {
  return logSpy.mock.calls
    .map((call) => call[0])
    .filter((v): v is string => typeof v === 'string' && v.startsWith('{"audit":true'))
    .map((s) => JSON.parse(s) as Record<string, unknown>)
}

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  logSpy.mockRestore()
})

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } })

  const schoolA = await prisma.school.create({ data: { name: SCHOOL_A_NAME } })
  const schoolB = await prisma.school.create({ data: { name: SCHOOL_B_NAME } })
  schoolAId = schoolA.id
  schoolBId = schoolB.id

  const pwHash = await hash(FIXTURE_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  const upsertUser = (email: string, role: 'super_admin' | 'school_admin' | 'hr_admin' | 'teacher', schoolId: string | null) =>
    prisma.user.upsert({
      where: { email },
      update: { role, schoolId, isActive: true, passwordHash: pwHash },
      create: { email, passwordHash: pwHash, name: email.split('@')[0], role, schoolId },
    })

  await upsertUser(EMAILS.adminA, 'school_admin', schoolAId)
  await upsertUser(EMAILS.adminB, 'school_admin', schoolBId)
  await upsertUser(EMAILS.hrA, 'hr_admin', schoolAId)
  await upsertUser(EMAILS.teacherA, 'teacher', schoolAId)
  await upsertUser(EMAILS.super, 'super_admin', null)

  const created = await prisma.mediaObject.create({
    data: {
      schoolId: schoolAId,
      category: 'student_photo',
      objectKey: `schools/${schoolAId}/student_photo/fixture-a.png`,
      fileName: 'fixture.png',
      mimeType: 'image/png',
      sizeBytes: PNG_1PX.length,
    },
  })
  mediaAId = created.id
  mediaAKey = created.objectKey
  storage.objects.set(mediaAKey, { body: PNG_1PX, mime: 'image/png' })

  for (const key of Object.keys(EMAILS) as (keyof typeof EMAILS)[]) {
    const { res } = await login(app, EMAILS[key], FIXTURE_PASSWORD)
    if (res.status !== 200) throw new Error(`fixture login failed for ${key}: ${res.status}`)
    jars[key] = extractCookies(res)
  }
})

afterAll(async () => {
  vi.restoreAllMocks()
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } })
  await prisma.school.deleteMany({ where: { name: { in: [SCHOOL_A_NAME, SCHOOL_B_NAME] } } }) // cascades media
  await prisma.$disconnect()
})

describe('media API — authentication and unconfigured-storage mode', () => {
  it('rejects unauthenticated requests (401)', async () => {
    expect((await request(app).get('/api/media')).status).toBe(401)
    expect((await request(app).post('/api/media/upload')).status).toBe(401)
    expect((await request(app).get(`/api/media/${mediaAId}/url`)).status).toBe(401)
  })

  it('answers 503 on media routes when R2 is not configured', async () => {
    expect((await request(appNoStorage).get('/api/media').set('Cookie', cookieHeader(jars.adminA!))).status).toBe(503)
    const up = await request(appNoStorage)
      .post('/api/media/upload')
      .set('Cookie', cookieHeader(jars.adminA!))
      .set('x-csrf-token', csrfToken(jars.adminA!))
      .field('category', 'student_photo')
      .attach('file', PNG_1PX, { filename: 'a.png', contentType: 'image/png' })
    expect(up.status).toBe(503)
  })
})

describe('media upload — RBAC', () => {
  it('allows school_admin and hr_admin uploads; forbids teacher and super_admin (403)', async () => {
    expect((await upload(jars.adminA!, 'student_photo', { buffer: PNG_1PX, filename: 'a.png', contentType: 'image/png' })).status).toBe(201)
    expect((await upload(jars.hrA!, 'student_photo', { buffer: PNG_1PX, filename: 'b.png', contentType: 'image/png' })).status).toBe(201)
    expect((await upload(jars.teacherA!, 'student_photo', { buffer: PNG_1PX, filename: 'c.png', contentType: 'image/png' })).status).toBe(403)
    expect((await upload(jars.super!, 'student_photo', { buffer: PNG_1PX, filename: 'd.png', contentType: 'image/png' })).status).toBe(403)
  })

  it('teachers may fetch presigned URLs for their own school but students may not', async () => {
    expect((await get(jars.teacherA!, `/api/media/${mediaAId}/url`)).status).toBe(200)
  })
})

describe('media upload — server-side validation', () => {
  it('stores with a tenant-scoped key and session-derived schoolId (body spoof ignored)', async () => {
    const res = await upload(jars.adminA!, 'student_photo', { buffer: PNG_1PX, filename: 'x.png', contentType: 'image/png' })
    expect(res.status).toBe(201)
    expect(res.body.schoolId).toBe(schoolAId)
    expect(res.body.objectKey.startsWith(`schools/${schoolAId}/student_photo/`)).toBe(true)
    expect(storage.objects.has(res.body.objectKey)).toBe(true)
  })

  it('rejects student photos above 200 KB (413) and logos above 5 MB (413)', async () => {
    const tooBigStudent = await upload(jars.adminA!, 'student_photo', { buffer: jpegBytes(201 * 1024), filename: 'big.jpg', contentType: 'image/jpeg' })
    expect(tooBigStudent.status).toBe(413)
    const tooBigLogo = await upload(jars.adminA!, 'institution_logo', { buffer: jpegBytes(5 * 1024 * 1024 + 1), filename: 'big.jpg', contentType: 'image/jpeg' })
    expect(tooBigLogo.status).toBe(413)
  })

  it('accepts images within limits for each category', async () => {
    expect((await upload(jars.adminA!, 'student_photo', { buffer: jpegBytes(150 * 1024), filename: 'ok.jpg', contentType: 'image/jpeg' })).status).toBe(201)
    expect((await upload(jars.adminA!, 'institution_logo', { buffer: webpBytes(), filename: 'logo.webp', contentType: 'image/webp' })).status).toBe(201)
    expect((await upload(jars.adminA!, 'institution_banner', { buffer: PNG_1PX, filename: 'banner.png', contentType: 'image/png' })).status).toBe(201)
  })

  it('rejects disallowed MIME types (pdf, svg) with 400', async () => {
    const pdf = await upload(jars.adminA!, 'student_photo', { buffer: Buffer.from('%PDF-1.4'), filename: 'doc.pdf', contentType: 'application/pdf' })
    expect(pdf.status).toBe(400)
    const svg = await upload(jars.adminA!, 'institution_logo', { buffer: Buffer.from('<svg></svg>'), filename: 'x.svg', contentType: 'image/svg+xml' })
    expect(svg.status).toBe(400)
  })

  it('rejects a file whose actual signature contradicts the declared MIME (400)', async () => {
    const mismatch = await upload(jars.adminA!, 'student_photo', { buffer: jpegBytes(), filename: 'fake.png', contentType: 'image/png' })
    expect(mismatch.status).toBe(400)
    expect(mismatch.body.error).toMatch(/signature/i)
  })

  it('rejects unknown categories and empty files (400)', async () => {
    expect((await upload(jars.adminA!, 'avatar', { buffer: PNG_1PX, filename: 'a.png', contentType: 'image/png' })).status).toBe(400)
    expect((await upload(jars.adminA!, 'student_photo', { buffer: Buffer.alloc(0), filename: 'e.png', contentType: 'image/png' })).status).toBe(400)
  })
})

describe('media download — authorization', () => {
  it('issues short-lived presigned URLs (default and clamped ttl)', async () => {
    const def = await get(jars.adminA!, `/api/media/${mediaAId}/url`)
    expect(def.status).toBe(200)
    expect(def.body.expiresInSeconds).toBe(300)
    expect(def.body.url).toContain('fake-r2.invalid')

    const custom = await get(jars.adminA!, `/api/media/${mediaAId}/url?ttl=60`)
    expect(custom.body.expiresInSeconds).toBe(60)

    const clamped = await get(jars.adminA!, `/api/media/${mediaAId}/url?ttl=9999`)
    expect(clamped.status).toBe(400) // TTL beyond the 5-minute cap is rejected
  })

  it('streams the exact bytes with the stored content type (authorized backend streaming)', async () => {
    const res = await get(jars.adminA!, `/api/media/${mediaAId}`).buffer(true).parse((r, cb) => {
      const chunks: Buffer[] = []
      r.on('data', (c: Buffer) => chunks.push(c))
      r.on('end', () => cb(null, Buffer.concat(chunks)))
    })
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('image/png')
    expect(Buffer.compare(res.body as Buffer, PNG_1PX)).toBe(0)
  })
})

describe('media — cross-tenant negative matrix', () => {
  it("returns uniform 404 for another tenant's media (URL, stream, delete)", async () => {
    const urlForeign = await get(jars.adminB!, `/api/media/${mediaAId}/url`)
    const urlMissing = await get(jars.adminB!, `/api/media/${NONEXISTENT_ID}/url`)
    expect(urlForeign.status).toBe(404)
    expect(urlMissing.status).toBe(404)
    expect(urlForeign.body).toEqual(urlMissing.body) // no existence oracle

    expect((await get(jars.adminB!, `/api/media/${mediaAId}`)).status).toBe(404)

    const delForeign = await del(jars.adminB!, `/api/media/${mediaAId}`)
    const delMissing = await del(jars.adminB!, `/api/media/${NONEXISTENT_ID}`)
    expect(delForeign.status).toBe(404)
    expect(delForeign.body).toEqual(delMissing.body)
    expect(storage.objects.has(mediaAKey)).toBe(true) // foreign delete did nothing
  })

  it('scopes listing to the session tenant and ignores ?schoolId spoofing', async () => {
    const list = await get(jars.adminB!, '/api/media')
    expect(list.status).toBe(200)
    for (const m of list.body.data as Array<{ schoolId: string; id: string }>) {
      expect(m.schoolId).toBe(schoolBId)
      expect(m.id).not.toBe(mediaAId)
    }
    const spoofed = await get(jars.adminB!, `/api/media?schoolId=${schoolAId}`)
    for (const m of spoofed.body.data as Array<{ id: string }>) {
      expect(m.id).not.toBe(mediaAId)
    }
  })

  it('audits privileged cross-tenant access by super_admin', async () => {
    const res = await get(jars.super!, `/api/media/${mediaAId}/url`)
    expect(res.status).toBe(200)
    const events = auditEvents().filter((e) => e.action === 'media.download.url' && e.resourceId === mediaAId)
    expect(events.length).toBe(1)
    expect((events[0].detail as { crossTenant: boolean }).crossTenant).toBe(true)
  })
})

describe('media deletion — tombstone + retention', () => {
  it('tombstones the row, removes the object and reports the 3-year retention horizon', async () => {
    const up = await upload(jars.adminA!, 'student_photo', { buffer: PNG_1PX, filename: 'gone.png', contentType: 'image/png' })
    const id = up.body.id as string
    const key = up.body.objectKey as string
    expect(storage.objects.has(key)).toBe(true)

    const res = await del(jars.adminA!, `/api/media/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const retention = new Date(res.body.retentionUntil)
    const now = new Date()
    expect(retention.getFullYear() - now.getFullYear()).toBeGreaterThanOrEqual(RETENTION_YEARS - 1)

    expect(storage.objects.has(key)).toBe(false) // physical object removed
    const row = await prisma.mediaObject.findUnique({ where: { id } })
    expect(row?.deletedAt).not.toBeNull() // tombstone retained for the window

    const list = await get(jars.adminA!, '/api/media')
    expect((list.body.data as Array<{ id: string }>).some((m) => m.id === id)).toBe(false)

    expect((await del(jars.adminA!, `/api/media/${id}`)).status).toBe(404) // idempotent uniform 404
  })
})
