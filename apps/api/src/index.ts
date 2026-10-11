import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createApp } from './app.js'

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

const prisma = new PrismaClient()
const app = createApp({ prisma, jwtSecret: JWT_SECRET, corsOrigin: CORS_ORIGIN })

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
