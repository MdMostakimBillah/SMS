import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { PostgresDialect } from 'kysely'
import pg from 'pg'
import { hash, verify } from '@node-rs/argon2'

const { Pool } = pg

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_2LBHesVNClo3@ep-bold-salad-az37hp25-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true'

export const authPool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000, // Evict idle connections before Neon severs them
  connectionTimeoutMillis: 15_000, // Allow 15s for Neon serverless wake-up
})

// Prevent unhandled error events from crashing Node when Neon drops idle connections during suspend
authPool.on('error', (err) => {
  console.warn('[auth-pool] Idle connection error (safe to ignore on serverless):', err instanceof Error ? err.message : err)
})

const ARGON2_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
} as const

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}` : undefined) ||
    'http://localhost:3001',
  basePath: '/api/auth',
  database: {
    dialect: new PostgresDialect({ pool: authPool }),
    type: 'postgres',
    schemaName: 'neon_auth',
  },
  advanced: {
    database: {
      generateId: 'uuid',
    },
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => hash(password, ARGON2_OPTIONS),
      verify: async ({ hash: hashVal, password }: { hash: string; password: string }) => {
        try {
          if (hashVal && hashVal.startsWith('$argon2')) {
            return await verify(hashVal, password)
          }
          const { verifyPassword } = await import('@better-auth/utils/password')
          return await verifyPassword(hashVal, password)
        } catch {
          return false
        }
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://localhost',
    'https://localhost',
    'https://smsappbd.vercel.app',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
    ...(process.env.PUBLIC_API_URL ? [process.env.PUBLIC_API_URL.trim()] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL.trim()] : []),
  ],
})
