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
})

const ARGON2_OPTIONS = {
  algorithm: 2, // Argon2id
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
} as const

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
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
    'http://localhost',
    'https://localhost',
    'https://smsappbd.vercel.app',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
  ],
})
