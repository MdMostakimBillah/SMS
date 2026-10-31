import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import JSZip from 'jszip'
import { createApp } from './app.js'
import { TEST_JWT_SECRET, cookieHeader, csrfToken, extractCookies, login, type CookieJar } from './test-utils.js'

const prisma = new PrismaClient()
const app: Express = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigin: 'http://localhost:5173' })

const FIXTURE_PASSWORD = 'BackupFixtur3!Secret'
const ADMIN_EMAIL = 'backup-admin@test.local'

let schoolId = ''
let adminJar: CookieJar = { cookies: new Map() }

beforeAll(async () => {
  const passwordHash = await hash(FIXTURE_PASSWORD, {
    algorithm: 2,
    memoryCost: 64 * 1024,
    timeCost: 3,
  })

  const school = await prisma.school.create({
    data: {
      name: 'Backup Test School',
      domain: `backup-${Date.now()}`,
      storageMode: 'local_computer',
      users: {
        create: {
          email: ADMIN_EMAIL,
          name: 'Backup Admin',
          passwordHash,
          role: 'school_admin',
        },
      },
    },
  })
  schoolId = school.id

  const loginResult = await login(app, ADMIN_EMAIL, FIXTURE_PASSWORD)
  expect(loginResult.res.status).toBe(200)
  adminJar = loginResult.jar
})

afterAll(async () => {
  if (schoolId) {
    await prisma.user.deleteMany({ where: { schoolId } })
    await prisma.school.delete({ where: { id: schoolId } })
  }
  await prisma.$disconnect()
})

describe('POST /api/backup/telegram/send', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('generates a .zip file with local clientData rather than server data in local_computer mode', async () => {
    let capturedFormData: any = null

    // Mock fetch for telegram
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string, init: any) => {
      if (url.includes('sendDocument')) {
        capturedFormData = init.body
        return {
          ok: true,
          json: async () => ({ ok: true, result: { message_id: 12345 } }),
        }
      }
      return { ok: false }
    }))

    const clientData = {
      metadata: {
        app: 'EduTech SMS',
        version: '2.0.0',
        slug: 'test-backup',
        counts: { classes: 2, teachers: 5, students: 20 },
      },
      stores: {
        'edutech-classes': { institution: { name: 'Local Test School', storageMode: 'local_computer' } },
        'edutech-teachers': { teachers: [{ id: 't1', nameEn: 'Local Teacher' }] },
        'edutech-admissions': { students: [{ id: 's1', nameEn: 'Local Student' }] },
      },
    }

    const res = await request(app)
      .post('/api/backup/telegram/send')
      .set('Cookie', cookieHeader(adminJar))
      .set('x-csrf-token', csrfToken(adminJar))
      .send({
        botToken: '123456:fake-token',
        chatId: '-100987654',
        clientData,
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.filename).toMatch(/\.zip$/)

    // Inspect the FormData sent to Telegram
    expect(capturedFormData).not.toBeNull()
    const docBlob = capturedFormData.get('document') as Blob
    expect(docBlob).toBeDefined()
    expect(docBlob.type).toBe('application/zip')

    // Unzip and inspect contents
    const arrayBuffer = await docBlob.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    const backupJsonFile = zip.file('backup.json')
    expect(backupJsonFile).not.toBeNull()

    const backupJsonText = await backupJsonFile!.async('text')
    const parsedPayload = JSON.parse(backupJsonText)

    // Verify local files/data are stored, NOT server DB data store
    expect(parsedPayload.metadata.mode).toBe('local_computer')
    expect(parsedPayload.serverData).toBeNull() // Server database data is NOT stored
    expect(parsedPayload.clientData).toBeDefined()
    expect(parsedPayload.stores['edutech-teachers'].teachers[0].nameEn).toBe('Local Teacher')
  })
})
