/**
 * Authentication & session-security tests for the cookie-based auth flow.
 *
 * Runs only against the isolated `edutech_test` database
 * (see src/test-setup.ts — DATABASE_URL is rewritten before anything loads).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Express } from 'express'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { TEST_JWT_SECRET, extractCookies, cookieHeader, login, type CookieJar } from './test-utils.js'

const JWT_SECRET = TEST_JWT_SECRET
const SUPER_EMAIL = 'superadmin@test.local'
const SUPER_PASSWORD = 'Sup3rSecret!TestPW'
const STAFF_EMAIL = 'staff@test.local'
const STAFF_PASSWORD = 'StaffSecret!TestPW'

const prisma = new PrismaClient()

function makeApp(): Express {
  return createApp({ prisma, jwtSecret: JWT_SECRET, corsOrigin: 'http://localhost:5173' })
}

beforeAll(async () => {
  const superHash = await hash(SUPER_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  await prisma.user.upsert({
    where: { email: SUPER_EMAIL },
    update: { passwordHash: superHash, role: 'super_admin', schoolId: null, isActive: true },
    create: { email: SUPER_EMAIL, passwordHash: superHash, name: 'Test Super', role: 'super_admin', schoolId: null },
  })
  const staffHash = await hash(STAFF_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: staffHash, role: 'teacher', isActive: true },
    create: { email: STAFF_EMAIL, passwordHash: staffHash, name: 'Test Staff', role: 'teacher' },
  })
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [SUPER_EMAIL, STAFF_EMAIL] } } })
  await prisma.$disconnect()
})

describe('login', () => {
  it('accepts valid credentials and sets an HttpOnly session cookie without leaking the token', async () => {
    const app = makeApp()
    const { res, jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)

    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.email).toBe(SUPER_EMAIL)
    expect(res.body.user.role).toBe('super_admin')
    // No token or password material in the body
    expect(res.text).not.toMatch(/passwordHash|argon2|eyJ/)
    expect(res.text).not.toContain(SUPER_PASSWORD)

    const sessionCookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('edutech_sid='))
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie).toMatch(/HttpOnly/i)
    expect(sessionCookie).toMatch(/SameSite=Lax/i)
    expect(jar.edutech_sid).toBeTruthy()
    expect(jar.edutech_csrf).toBeTruthy()
  })

  it('rejects a wrong password with a uniform 401', async () => {
    const app = makeApp()
    const res = await request(app).post('/api/auth/login').send({ email: SUPER_EMAIL, password: 'wrong-password' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns the identical error for an unknown account (no account enumeration)', async () => {
    const app = makeApp()
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'whatever123' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('rate-limits repeated login attempts with 429', async () => {
    const app = makeApp()
    let sawLimit = false
    for (let i = 0; i < 12; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'x' })
      if (res.status === 429) {
        sawLimit = true
        break
      }
    }
    expect(sawLimit).toBe(true)
  })
})

describe('session (cookie auth)', () => {
  it('rejects requests without a session cookie', async () => {
    const app = makeApp()
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects a tampered session token', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const [header, payload, sig] = jar.edutech_sid.split('.')
    const tampered = `${header}.${payload.slice(0, -2)}${payload.slice(-2) === 'AA' ? 'BB' : 'AA'}.${sig}`
    const res = await request(app).get('/api/auth/me').set('Cookie', [`edutech_sid=${tampered}`])
    expect(res.status).toBe(401)
  })

  it('returns the current user from /me when the cookie is valid', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const res = await request(app).get('/api/auth/me').set('Cookie', cookieHeader(jar))
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(SUPER_EMAIL)
    expect(res.text).not.toMatch(/passwordHash/)
  })

  it('revokes the session on logout so the old cookie no longer works', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookieHeader(jar))
      .set('x-csrf-token', jar.edutech_csrf)
    expect(logoutRes.status).toBe(200)

    const reuse = await request(app).get('/api/auth/me').set('Cookie', cookieHeader(jar))
    expect(reuse.status).toBe(401)
  })

  it('blocks mutating requests that carry a session but no CSRF token', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookieHeader(jar))
    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/CSRF/i)
  })
})

describe('hardened endpoints', () => {
  it('removed the verify-super-admin password oracle (404)', async () => {
    const app = makeApp()
    const res = await request(app).post('/api/auth/verify-super-admin').send({ email: SUPER_EMAIL, password: 'x' })
    expect(res.status).toBe(404)
  })

  it('rejects anonymous registration including privileged roles (403)', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'evil@test.local', password: 'Attacker!Pass1', name: 'Evil', role: 'school_admin' })
    expect(res.status).toBe(403)
    const created = await prisma.user.findUnique({ where: { email: 'evil@test.local' } })
    expect(created).toBeNull()
  })

  it('requires authentication on teachers routes', async () => {
    const app = makeApp()
    const res = await request(app).get('/api/teachers')
    expect(res.status).toBe(401)
  })

  it('forbids non-super-admin accounts from listing accounts', async () => {
    const app = makeApp()
    const { jar } = await login(app, STAFF_EMAIL, STAFF_PASSWORD)
    const res = await request(app).get('/api/auth/accounts').set('Cookie', cookieHeader(jar))
    expect(res.status).toBe(403)
  })

  it('allows super admin to read the super-admin email (never the password)', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const res = await request(app).get('/api/auth/super-admin').set('Cookie', cookieHeader(jar))
    expect(res.status).toBe(200)
    expect(res.body.email).toBe(SUPER_EMAIL)
    expect(res.text).not.toMatch(/passwordHash|argon2/)
    expect(res.text).not.toContain(SUPER_PASSWORD)
  })

  it('rejects a password change with the wrong current password', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const res = await request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(jar))
      .set('x-csrf-token', jar.edutech_csrf)
      .send({ password: 'NewSecret!Pass1', currentPassword: 'not-the-right-one' })
    expect(res.status).toBe(403)
  })

  it('rejects an over-short new password (min 8)', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const res = await request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(jar))
      .set('x-csrf-token', jar.edutech_csrf)
      .send({ password: 'short', currentPassword: SUPER_PASSWORD })
    expect(res.status).toBe(400)
  })

  it('changes the password with the correct current password and revokes other sessions', async () => {
    const app = makeApp()
    // Two sessions for the same user
    const { jar: jarA } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const { jar: jarB } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)

    const rotated = 'Rotated!Secret99'
    const res = await request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(jarA))
      .set('x-csrf-token', jarA.edutech_csrf)
      .send({ password: rotated, currentPassword: SUPER_PASSWORD })
    expect(res.status).toBe(200)

    // Session B must be revoked, session A (the caller) survives
    const checkB = await request(app).get('/api/auth/me').set('Cookie', cookieHeader(jarB))
    expect(checkB.status).toBe(401)
    const checkA = await request(app).get('/api/auth/me').set('Cookie', cookieHeader(jarA))
    expect(checkA.status).toBe(200)

    // Old password no longer works, new one does (then restore original)
    const oldTry = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    expect(oldTry.res.status).toBe(401)
    const newTry = await login(app, SUPER_EMAIL, rotated)
    expect(newTry.res.status).toBe(200)

    const restore = await request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(newTry.jar))
      .set('x-csrf-token', newTry.jar.edutech_csrf)
      .send({ password: SUPER_PASSWORD, currentPassword: rotated })
    expect(restore.status).toBe(200)
  })
})
