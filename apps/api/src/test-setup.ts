/**
 * Test setup: force every test to run against the isolated `edutech_test`
 * database so no development or production data can ever be touched.
 * Loaded by vitest before any test module (see vitest.config.ts).
 */
import 'dotenv/config'

const testDbUrl = process.env.TEST_DATABASE_URL || `postgresql://edutech:${process.env.DB_PASSWORD || 'changeme'}@localhost:5432/edutech_test`
process.env.DATABASE_URL = testDbUrl
process.env.DIRECT_URL = testDbUrl

// Cookies must be readable over plain HTTP in tests
process.env.COOKIE_SECURE = 'false'
process.env.NODE_ENV = 'test'
