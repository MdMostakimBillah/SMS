import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import type { PrismaClient } from '@prisma/client'
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
import { csrfProtection } from './middleware/csrf.js'
import { LAN_OR_LOCAL_ORIGIN_RE } from './middleware/origin.js'
import type { MediaStorage } from './storage.js'

export interface AppOptions {
  prisma: PrismaClient
  jwtSecret: string
  corsOrigin: string
  /** R2-backed media storage; null (media routes answer 503) when unconfigured. */
  storage?: MediaStorage | null
  /** Secret used to verify signed license keys; empty string disables licensing. */
  licenseSecret?: string
}

export function createApp({ prisma, jwtSecret, corsOrigin, storage = null, licenseSecret = '' }: AppOptions): Express {
  const app = express()

  const allowedOrigins = corsOrigin.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  const corsDelegate = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true)
    const o = origin.toLowerCase()
    if (allowedOrigins.includes(o) || LAN_OR_LOCAL_ORIGIN_RE.test(o)) {
      return callback(null, true)
    }
    callback(null, false)
  }

  app.use(helmet())
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

  // Cookie-session CSRF protection for every mutating /api request
  app.use('/api', csrfProtection)

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/auth', authRouter(prisma, jwtSecret, corsOrigin, storage))
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
