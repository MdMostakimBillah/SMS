import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { faceClient } from '../services/faceClient.js'

function authMiddleware(jwtSecret: string) {
  return (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' })
    }
    try {
      const token = authHeader.slice(7)
      const payload = jwt.verify(token, jwtSecret) as { userId: string; schoolId: string; role: string }
      ;(req as any).user = payload
      next()
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}

export function faceRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = authMiddleware(jwtSecret)

  router.post('/enroll', auth, async (req: Request, res: Response) => {
    try {
      const { personId, personType, image } = req.body
      const schoolId = (req as any).user.schoolId

      if (!personId || !personType || !image) {
        return res.status(400).json({ error: 'Missing required fields: personId, personType, image' })
      }
      if (!['teacher', 'student'].includes(personType)) {
        return res.status(400).json({ error: 'personType must be "teacher" or "student"' })
      }

      const result = await faceClient.enroll({ personId, schoolId, image })

      await prisma.faceEmbedding.upsert({
        where: { personId_schoolId: { personId, schoolId } },
        update: { embedding: Buffer.from(result.encrypted_embedding, 'base64') },
        create: {
          personId,
          personType,
          schoolId,
          embedding: Buffer.from(result.encrypted_embedding, 'base64'),
          enrolledBy: (req as any).user.userId,
        },
      })

      res.json({ success: true, embedding_id: result.embedding_id })
    } catch (err: any) {
      console.error('[Face Enroll]', err.message)
      res.status(500).json({ error: err.message || 'Enrollment failed' })
    }
  })

  router.post('/detect', auth, async (req: Request, res: Response) => {
    try {
      const { image } = req.body
      if (!image) {
        return res.status(400).json({ error: 'Missing image' })
      }
      const result = await faceClient.detect({ image })
      res.json(result)
    } catch (err: any) {
      console.error('[Face Detect]', err.message)
      res.status(500).json({ error: err.message || 'Detection failed' })
    }
  })

  router.post('/recognize', auth, async (req: Request, res: Response) => {
    try {
      const { image, challenge } = req.body
      const schoolId = (req as any).user.schoolId

      if (!image) {
        return res.status(400).json({ error: 'Missing image' })
      }

      const result = await faceClient.recognize({ image, schoolId })

      await prisma.faceAttendanceLog.create({
        data: {
          schoolId,
          personId: result.personId || 'unknown',
          personType: result.personType || 'teacher',
          punchType: 'in',
          confidence: result.confidence || 0,
          livenessScore: result.liveness_score || 0,
          ipAddress: req.ip,
        },
      })

      res.json(result)
    } catch (err: any) {
      console.error('[Face Recognize]', err.message)
      res.status(500).json({ error: err.message || 'Recognition failed' })
    }
  })

  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const health = await faceClient.health()
      res.json(health)
    } catch {
      res.status(503).json({ status: 'unavailable' })
    }
  })

  return router
}
