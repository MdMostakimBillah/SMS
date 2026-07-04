import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'
import { authRouter } from './routes/auth.js'
import { teacherRouter } from './routes/teachers.js'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is required')
  process.exit(1)
}
const JWT_SECRET = process.env.JWT_SECRET

app.use(helmet())
const corsOrigin = process.env.CORS_ORIGIN
if (!corsOrigin) {
  console.error('[FATAL] CORS_ORIGIN environment variable is required')
  process.exit(1)
}
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter(prisma, JWT_SECRET))
app.use('/api/teachers', teacherRouter(prisma, JWT_SECRET))

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`)
})

export { prisma, JWT_SECRET }
