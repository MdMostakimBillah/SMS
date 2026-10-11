/**
 * Shared helpers for API test files. Excluded from the production build
 * (see tsconfig.json "exclude") — never shipped to `dist`.
 *
 * All tests run against the isolated `edutech_test` database only
 * (src/test-setup.ts rewrites DATABASE_URL before anything loads).
 */
import type { Express } from 'express'
import request from 'supertest'

export const TEST_JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters'

export type CookieJar = Record<string, string>

export function extractCookies(res: request.Response): CookieJar {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined
  const jar: CookieJar = {}
  for (const c of raw ?? []) {
    const [pair] = c.split(';')
    const eq = pair.indexOf('=')
    if (eq > 0) jar[pair.slice(0, eq)] = decodeURIComponent(pair.slice(eq + 1))
  }
  return jar
}

export function cookieHeader(jar: CookieJar): string[] {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`)
}

export async function login(app: Express, email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password })
  return { res, jar: extractCookies(res) }
}

/** Double-submit CSRF token from the readable cookie (never a secret — matches the client contract). */
export function csrfToken(jar: CookieJar): string {
  return jar['edutech_csrf'] ?? ''
}
