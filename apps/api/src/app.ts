import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import type { PrismaClient } from '@prisma/client'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/better-auth.js'
import { authRouter } from './routes/auth.js'
import { teacherRouter } from './routes/teachers.js'
import { departmentRouter } from './routes/departments.js'
import { subjectRouter } from './routes/subjects.js'
import { designationRouter } from './routes/designations.js'
import { noticeRouter } from './routes/notices.js'
import { mediaRouter } from './routes/media.js'
import { schoolRouter } from './routes/schools.js'
import { studentRouter } from './routes/students.js'
import { backupRouter } from './routes/backup.js'
import { licenseRouter } from './routes/license.js'
import { classRouter } from './routes/classes.js'
import { feesRouter } from './routes/fees.js'
import { storeRouter } from './routes/store.js'
import { transportRouter } from './routes/transport.js'
import { hostelRouter } from './routes/hostel.js'
import { othersIncomeRouter } from './routes/othersIncome.js'
import { expensesRouter } from './routes/expenses.js'
import { hrRouter } from './routes/hr.js'
import { examsRouter } from './routes/exams.js'
import { syllabusRouter } from './routes/syllabus.js'
import { assignmentsRouter } from './routes/assignments.js'
import { onlineRouter } from './routes/online.js'
import { attendanceRouter } from './routes/attendance.js'
import { libraryRouter } from './routes/library.js'
import { notificationsRouter } from './routes/notifications.js'
import { institutionPaymentsRouter } from './routes/institutionPayments.js'
import { csrfProtection } from './middleware/csrf.js'
import { LAN_OR_LOCAL_ORIGIN_RE } from './middleware/origin.js'
import type { MediaStorage } from './storage.js'
import type { DbKeepAlive } from './lib/db-keepalive.js'

export interface AppOptions {
  prisma: PrismaClient
  jwtSecret: string
  corsOrigin: string
  /** R2-backed media storage; null (media routes answer 503) when unconfigured. */
  storage?: MediaStorage | null
  /** Secret used to verify signed license keys; empty string disables licensing. */
  licenseSecret?: string
  /** Database keep-alive monitor to track active query traffic. */
  dbKeepAlive?: DbKeepAlive
}

export function createApp({ prisma, jwtSecret, corsOrigin, storage = null, licenseSecret = '', dbKeepAlive }: AppOptions): Express {
  const app = express()

  const allowedOrigins = corsOrigin.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  // Private/LAN origins are NOT trusted automatically: every deployment serves
  // the frontend and /api from one origin via nginx, so credentialed CORS is
  // only needed for local development (CORS_ORIGIN) — or, for LAN development
  // against a directly-exposed API, the explicit ALLOW_PRIVATE_ORIGINS=true
  // opt-in below (see .env.example).
  const allowPrivateOrigins = process.env.ALLOW_PRIVATE_ORIGINS === 'true'
  const corsDelegate = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true)
    const o = origin.toLowerCase()
    if (allowedOrigins.includes(o) || (allowPrivateOrigins && LAN_OR_LOCAL_ORIGIN_RE.test(o))) {
      return callback(null, true)
    }
    callback(null, false)
  }

  app.use(helmet())
  app.use(compression())
  app.use(cors({ origin: corsDelegate, credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.use(cookieParser())

  app.set('trust proxy', 1)
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later' },
    })
  )

  // Track database and API activity to debounce keepalive queries during active usage
  if (dbKeepAlive) {
    app.use(dbKeepAlive.createActivityMiddleware())
  }

  // Cookie-session CSRF protection for every mutating /api request
  app.use('/api', csrfProtection)

  app.get('/health', async (req: Request, res: Response) => {
    if (req.query.check === 'db') {
      try {
        const start = performance.now()
        await prisma.$queryRawUnsafe('SELECT 1')
        const latencyMs = Math.round((performance.now() - start) * 100) / 100
        dbKeepAlive?.recordActivity()
        return res.json({
          status: 'ok',
          database: 'connected',
          latencyMs,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        return res.status(503).json({
          status: 'degraded',
          database: 'disconnected',
          error: 'Database ping failed',
          timestamp: new Date().toISOString(),
        })
      }
    }
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.get('/health/db', async (_req: Request, res: Response) => {
    try {
      const start = performance.now()
      await prisma.$queryRawUnsafe('SELECT 1')
      const latencyMs = Math.round((performance.now() - start) * 100) / 100
      dbKeepAlive?.recordActivity()
      res.json({
        status: 'ok',
        database: 'connected',
        latencyMs,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      res.status(503).json({
        status: 'degraded',
        database: 'disconnected',
        error: 'Database ping failed',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Auth routes: legacy endpoints handled first, unhandled auth endpoints fall through to Better Auth
  app.use('/api/auth', authRouter(prisma, jwtSecret, corsOrigin, storage))
  app.all('/api/auth', toNodeHandler(auth))
  app.all('/api/auth/*', toNodeHandler(auth))
  app.use('/api/teachers', teacherRouter(prisma, jwtSecret))
  app.use('/api/students', studentRouter(prisma, jwtSecret))
  app.use('/api/departments', departmentRouter(prisma, jwtSecret))
  app.use('/api/subjects', subjectRouter(prisma, jwtSecret))
  app.use('/api/designations', designationRouter(prisma, jwtSecret))
  app.use('/api/notices', noticeRouter(prisma, jwtSecret))
  app.use('/api/media', mediaRouter(prisma, jwtSecret, storage))
  app.use('/api/backup', backupRouter(prisma, jwtSecret))
  app.use('/api/license', licenseRouter(licenseSecret))
  app.use('/api/classes', classRouter(prisma, jwtSecret))
  app.use('/api/fees', feesRouter(prisma, jwtSecret))
  app.use('/api/store', storeRouter(prisma, jwtSecret))
  app.use('/api/transport', transportRouter(prisma, jwtSecret))
  app.use('/api/hostel', hostelRouter(prisma, jwtSecret))
  app.use('/api/others-income', othersIncomeRouter(prisma, jwtSecret))
  app.use('/api/expenses', expensesRouter(prisma, jwtSecret))
  app.use('/api/hr', hrRouter(prisma, jwtSecret))
  app.use('/api/exams', examsRouter(prisma, jwtSecret))
  app.use('/api/syllabus', syllabusRouter(prisma, jwtSecret))
  app.use('/api/assignments', assignmentsRouter(prisma, jwtSecret))
  app.use('/api/online', onlineRouter(prisma, jwtSecret))
  app.use('/api/attendance', attendanceRouter(prisma, jwtSecret))
  app.use('/api/library', libraryRouter(prisma, jwtSecret))
  app.use('/api/notifications', notificationsRouter(prisma, jwtSecret))
  app.use('/api/institution-payments', institutionPaymentsRouter(prisma, jwtSecret))

  const sRouter = schoolRouter(prisma, jwtSecret, storage)
  app.use('/api/schools', sRouter)
  app.use('/api/institutions', sRouter)
  app.use('/api/public/schools', sRouter)
  app.use('/api/public/institutions', sRouter)
  app.use('/api/superadmin/schools', sRouter)
  app.use('/api/superadmin/institutions', sRouter)

  // JSON 404 for unknown API paths
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' })
  })

  // Centralized error handler — no stack traces or internals leak to clients
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express identifies error handlers by the 4-arg signature
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api] unhandled error:', err instanceof Error ? err.message : err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return app
}
