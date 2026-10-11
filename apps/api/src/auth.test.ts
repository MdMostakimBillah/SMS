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
const ALT_SUPER_EMAIL = 'superadmin-rotated@test.local'
const STAFF_EMAIL = 'staff@test.local'
const STAFF_PASSWORD = 'StaffSecret!TestPW'
const ORG_ADMIN_EMAIL = 'orgadmin@test.local'
const ORG_ADMIN_PASSWORD = 'OrgAdmin!TestPW'
const ATTACKER_EMAIL = 'attacker-takeover@test.local'

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
  const orgAdminHash = await hash(ORG_ADMIN_PASSWORD, { algorithm: 2, memoryCost: 64 * 1024, timeCost: 3, parallelism: 1 })
  await prisma.user.upsert({
    where: { email: ORG_ADMIN_EMAIL },
    update: { passwordHash: orgAdminHash, role: 'school_admin', isActive: true },
    create: { email: ORG_ADMIN_EMAIL, passwordHash: orgAdminHash, name: 'Test Org Admin', role: 'school_admin' },
  })
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [SUPER_EMAIL, ALT_SUPER_EMAIL, STAFF_EMAIL, ORG_ADMIN_EMAIL, ATTACKER_EMAIL] } } })
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

describe('login Origin policy (anti login-CSRF layer)', () => {
  // Documented policy (docs/security/super-admin-login-path.md):
  // absent Origin = non-browser client → allowed; present Origin must be a
  // configured trusted origin (CORS_ORIGIN) or the request's own origin;
  // anything else → generic 403 with no cookies issued.

  it('allows login when Origin matches the configured trusted origin', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:5173') // matches createApp's corsOrigin in tests
      .send({ email: SUPER_EMAIL, password: SUPER_PASSWORD })
    expect(res.status).toBe(200)
  })

  it('allows a same-origin request (Origin host equals the request Host header)', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/auth/login')
      .set('Host', 'lan.example.test')
      .set('Origin', 'http://lan.example.test')
      .send({ email: SUPER_EMAIL, password: SUPER_PASSWORD })
    expect(res.status).toBe(200)
  })

  it('rejects an untrusted present Origin with a generic 403 and no cookies', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: SUPER_EMAIL, password: SUPER_PASSWORD })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Invalid request origin')
    expect(res.headers['set-cookie']).toBeUndefined()
    expect(res.text).not.toMatch(/passwordHash|argon2|eyJ/)
  })

  it('rejects a malformed Origin ("null") with the same generic 403', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'null')
      .send({ email: SUPER_EMAIL, password: SUPER_PASSWORD })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Invalid request origin')
  })

  it('allows requests without an Origin header (documented non-browser behavior)', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SUPER_EMAIL, password: SUPER_PASSWORD })
    expect(res.status).toBe(200)
  })
})

describe('inactive accounts at login', () => {
  it('rejects an inactive super admin with the same generic 401', async () => {
    const app = makeApp()
    await prisma.user.update({ where: { email: SUPER_EMAIL }, data: { isActive: false } })
    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: SUPER_EMAIL, password: SUPER_PASSWORD })
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid credentials') // no "account disabled" oracle
    } finally {
      await prisma.user.update({ where: { email: SUPER_EMAIL }, data: { isActive: true } })
    }
  })
})

describe('super-admin-only endpoint authorization (complete endpoint set)', () => {
  // Complete set of requireRole('super_admin') endpoints — verified by grep
  // over apps/api/src: GET /accounts, GET /super-admin, PUT /super-admin.
  const SUPER_ADMIN_ENDPOINTS = [
    ['get', '/api/auth/accounts'],
    ['get', '/api/auth/super-admin'],
    ['put', '/api/auth/super-admin'],
  ] as const

  it('returns 401 for anonymous requests on every super-admin-only endpoint', async () => {
    const app = makeApp()
    for (const [method, path] of SUPER_ADMIN_ENDPOINTS) {
      const res = await request(app)[method](path).send({ email: ATTACKER_EMAIL })
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401)
    }
  })

  it('returns 403 for an authenticated school_admin on every endpoint, with no side effects', async () => {
    const app = makeApp()
    const { res: loginRes, jar } = await login(app, ORG_ADMIN_EMAIL, ORG_ADMIN_PASSWORD)
    expect(loginRes.status).toBe(200)

    for (const [method, path] of SUPER_ADMIN_ENDPOINTS) {
      const res = await request(app)
        [method](path)
        .set('Cookie', cookieHeader(jar))
        .set('x-csrf-token', jar.edutech_csrf)
        .send({ email: ATTACKER_EMAIL, currentPassword: ORG_ADMIN_PASSWORD })
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(403)
    }

    // No privilege escalation side effects: the attacker email was not
    // created and the super admin record was untouched.
    expect(await prisma.user.findUnique({ where: { email: ATTACKER_EMAIL } })).toBeNull()
    expect(await prisma.user.findUnique({ where: { email: SUPER_EMAIL } })).not.toBeNull()
  })
})

describe('super-admin email change requires the current password', () => {
  const putEmail = (app: Express, jar: CookieJar, body: Record<string, string>) =>
    request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(jar))
      .set('x-csrf-token', jar.edutech_csrf)
      .send(body)

  it('rejects an email change without a current password (400) and leaves the email unchanged', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const res = await putEmail(app, jar, { email: ALT_SUPER_EMAIL })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Current password is required')
    expect(await prisma.user.findUnique({ where: { email: SUPER_EMAIL } })).not.toBeNull()
    expect(await prisma.user.findUnique({ where: { email: ALT_SUPER_EMAIL } })).toBeNull()
  })

  it('rejects an email change with a wrong current password (403) and leaves the email unchanged', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const res = await putEmail(app, jar, { email: ALT_SUPER_EMAIL, currentPassword: 'not-the-right-one' })
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Current password is incorrect')
    expect(await prisma.user.findUnique({ where: { email: SUPER_EMAIL } })).not.toBeNull()
    expect(await prisma.user.findUnique({ where: { email: ALT_SUPER_EMAIL } })).toBeNull()
  })

  it('changes the email with the correct current password and can change it back', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)

    const change = await putEmail(app, jar, { email: ALT_SUPER_EMAIL, currentPassword: SUPER_PASSWORD })
    expect(change.status).toBe(200)
    const asSuper = await request(app).get('/api/auth/super-admin').set('Cookie', cookieHeader(jar))
    expect(asSuper.status).toBe(200)
    expect(asSuper.body.email).toBe(ALT_SUPER_EMAIL)

    const back = await putEmail(app, jar, { email: SUPER_EMAIL, currentPassword: SUPER_PASSWORD })
    expect(back.status).toBe(200)
    const restored = await request(app).get('/api/auth/super-admin').set('Cookie', cookieHeader(jar))
    expect(restored.status).toBe(200)
    expect(restored.body.email).toBe(SUPER_EMAIL)
  })
})

describe('super-admin credential update is atomic (F3)', () => {
  it('applies a combined email + password change together and revokes other sessions', async () => {
    const app = makeApp()
    const { jar: jarA } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    const { jar: jarB } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)

    const rotated = 'Combined!Secret77'
    const change = await request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(jarA))
      .set('x-csrf-token', jarA.edutech_csrf)
      .send({ email: ALT_SUPER_EMAIL, password: rotated, currentPassword: SUPER_PASSWORD })
    expect(change.status).toBe(200)

    // Email changed; caller session survives; the other session is revoked
    const asSuper = await request(app).get('/api/auth/super-admin').set('Cookie', cookieHeader(jarA))
    expect(asSuper.status).toBe(200)
    expect(asSuper.body.email).toBe(ALT_SUPER_EMAIL)
    const checkB = await request(app).get('/api/auth/me').set('Cookie', cookieHeader(jarB))
    expect(checkB.status).toBe(401)

    // Both credentials actually moved: old email+password pair fails…
    const oldPair = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    expect(oldPair.res.status).toBe(401)
    // …and the new pair works
    const relogin = await login(app, ALT_SUPER_EMAIL, rotated)
    expect(relogin.res.status).toBe(200)

    // Restore both in one atomic operation (also exercises the same path)
    const restore = await request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(relogin.jar))
      .set('x-csrf-token', relogin.jar.edutech_csrf)
      .send({ email: SUPER_EMAIL, password: SUPER_PASSWORD, currentPassword: rotated })
    expect(restore.status).toBe(200)
    const restored = await prisma.user.findUnique({ where: { email: SUPER_EMAIL } })
    expect(restored).not.toBeNull()
  })

  it('returns 409 on an email conflict and applies NEITHER credential change', async () => {
    const app = makeApp()
    const { jar } = await login(app, SUPER_EMAIL, SUPER_PASSWORD)

    const res = await request(app)
      .put('/api/auth/super-admin')
      .set('Cookie', cookieHeader(jar))
      .set('x-csrf-token', jar.edutech_csrf)
      // STAFF_EMAIL belongs to another existing account → guaranteed conflict
      .send({ email: STAFF_EMAIL, password: 'AttackerRotated!99', currentPassword: SUPER_PASSWORD })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Email already in use')

    // Email unchanged
    const check = await request(app).get('/api/auth/super-admin').set('Cookie', cookieHeader(jar))
    expect(check.status).toBe(200)
    expect(check.body.email).toBe(SUPER_EMAIL)
    // Password unchanged: the original password still authenticates
    const stillWorks = await login(app, SUPER_EMAIL, SUPER_PASSWORD)
    expect(stillWorks.res.status).toBe(200)
    // The conflicting account was not modified
    const staff = await prisma.user.findUnique({ where: { email: STAFF_EMAIL } })
    expect(staff).not.toBeNull()
  })
})
