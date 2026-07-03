import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'
import { authRouter } from './routes/auth.js'
import { teacherRouter } from './routes/teachers.js'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
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
