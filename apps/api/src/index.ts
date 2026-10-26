import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import { createApp } from './app.js'
import { createStorageFromEnv } from './storage.js'

const PORT = process.env.PORT || 3001

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    console.error(`[FATAL] ${name} environment variable is required`)
    process.exit(1)
  }
  return value
}

const JWT_SECRET = requireEnv('JWT_SECRET')
const CORS_ORIGIN = requireEnv('CORS_ORIGIN')
if (JWT_SECRET.length < 32) {
  console.error('[FATAL] JWT_SECRET must be at least 32 characters')
  process.exit(1)
}

async function ensureSuperAdmin(prisma: PrismaClient) {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@edutech.local').toLowerCase()
  const password = process.env.SUPER_ADMIN_PASSWORD || 'EduAdm!65fd6a1ecb74a0bd6f'
  try {
    const existing = await prisma.user.findFirst({ where: { role: 'super_admin' } })
    if (!existing) {
      console.log(`[bootstrap] Creating default encrypted super admin: ${email}`)
      const passwordHash = await hash(password, {
        algorithm: 2, // Argon2id
        memoryCost: 64 * 1024,
        timeCost: 3,
        parallelism: 1,
      })
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'super_admin',
          name: 'Super Administrator',
          isActive: true,
        },
      })
      console.log(`[bootstrap] Super admin created successfully with Argon2id encryption.`)
    }
  } catch (err) {
    console.error('[bootstrap] Failed to verify super admin account:', err instanceof Error ? err.message : err)
  }
}

const prisma = new PrismaClient()
void ensureSuperAdmin(prisma)
const storage = createStorageFromEnv()
if (!storage) {
  console.warn('[API] R2 media storage NOT configured — /api/media endpoints will answer 503')
}
const app = createApp({ prisma, jwtSecret: JWT_SECRET, corsOrigin: CORS_ORIGIN, storage })

const server = app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`)
})

// Hourly cleanup of expired sessions
const sessionCleanup = setInterval(() => {
  prisma.session
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch((err: unknown) => console.error('[API] session cleanup failed:', err instanceof Error ? err.message : err))
}, 60 * 60 * 1000)
sessionCleanup.unref()

let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`[API] Received ${signal}, shutting down gracefully`)
  const force = setTimeout(() => {
    console.error('[API] Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
  force.unref()
  clearInterval(sessionCleanup)
  server.close(async () => {
    try {
      await prisma.$disconnect()
    } finally {
      clearTimeout(force)
      process.exit(0)
    }
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

export { prisma, JWT_SECRET }
