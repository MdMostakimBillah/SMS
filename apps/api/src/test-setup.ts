/**
 * Test setup: force every test to run against the isolated `edutech_test`
 * database so no development or production data can ever be touched.
 * Loaded by vitest before any test module (see vitest.config.ts).
 */
import 'dotenv/config'

const url = new URL(process.env.DATABASE_URL ?? 'postgresql://localhost:5432/edutech')
url.pathname = '/edutech_test'
process.env.DATABASE_URL = url.toString()

// Cookies must be readable over plain HTTP in tests
process.env.COOKIE_SECURE = 'false'
process.env.NODE_ENV = 'test'
