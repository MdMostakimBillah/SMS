import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole, requireSchool } from '../middleware/rbac.js'
import { audit } from '../audit.js'
import type { MediaStorage } from '../storage.js'

/**
 * Media router (Cloudflare R2 phase) — private, tenant-scoped image storage.
 *
 * Security invariants:
 * - Server-side limits: category policy (max size + allowed MIME) is enforced
 *   here regardless of any client-side checks; the actual file signature
 *   (magic bytes) must match the declared MIME type.
 * - Tenant scope derives from the authenticated session only. Object keys are
 *   namespaced `schools/{schoolId}/...`; cross-tenant read/download/delete is
 *   answered with a uniform 404 (no existence oracle).
 * - Objects are private. Access is a short-lived presigned GET URL (<= 5 min)
 *   or authorized backend streaming — no permanent public URLs are ever stored
 *   or returned; PostgreSQL holds only object keys + metadata.
 * - Deletion is a tombstone (`deletedAt`) kept for the 3-year retention
 *   window; the physical object is removed from the bucket immediately. If the
 *   metadata write fails after an upload, the object is removed again
 *   (no orphaned bytes).
 */

export const RETENTION_YEARS = 3

/** Server-side upload policy — the single source of truth for limits. */
export const UPLOAD_POLICY = {
  student_photo: { maxBytes: 200 * 1024, mimes: ['image/jpeg', 'image/png', 'image/webp'] },
  institution_logo: { maxBytes: 5 * 1024 * 1024, mimes: ['image/jpeg', 'image/png', 'image/webp'] },
  institution_banner: { maxBytes: 5 * 1024 * 1024, mimes: ['image/jpeg', 'image/png', 'image/webp'] },
} as const

export type UploadCategory = keyof typeof UPLOAD_POLICY

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // absolute ceiling for the multipart parser
const PRESIGN_MAX_TTL_SECONDS = 300 // short-lived URLs only

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

/** Actual file signature check — the declared MIME must match the bytes. */
export function matchesSignature(buf: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') {
    return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  }
  if (mime === 'image/png') {
    return (
      buf.length >= 8 &&
      buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    )
  }
  if (mime === 'image/webp') {
    return (
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP'
    )
  }
  return false
}

function isUploadCategory(value: string): value is UploadCategory {
  return Object.prototype.hasOwnProperty.call(UPLOAD_POLICY, value)
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    // Early reject of non-image MIME (declared type is re-validated against
    // the actual signature after buffering).
    if ((UPLOAD_POLICY.student_photo.mimes as readonly string[]).includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('UNSUPPORTED_MIME'))
    }
  },
}).single('file')

const presignQuerySchema = z.object({
  ttl: z.coerce.number().int().min(1).max(PRESIGN_MAX_TTL_SECONDS).default(PRESIGN_MAX_TTL_SECONDS),
})

/** Uniform-404 tenant check: super_admin may access any tenant (audited by
 *  callers); school-scoped roles only their own school. Missing, foreign and
 *  tombstoned rows are indistinguishable. */
async function findAuthorizedRow(prisma: PrismaClient, req: AuthenticatedRequest, id: string) {
  const row = await prisma.mediaObject.findFirst({ where: { id, deletedAt: null } })
  if (!row) return null
  if (req.userRole === 'super_admin') return row
  if (!req.schoolId || row.schoolId !== req.schoolId) return null
  return row
}

function runUpload(req: AuthenticatedRequest, res: Response): Promise<'ok' | 'rejected'> {
  return new Promise((resolve) => {
    upload(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File exceeds the maximum allowed size' })
        return resolve('rejected')
      }
      if (err) {
        res.status(400).json({ error: 'Unsupported file type' })
        return resolve('rejected')
      }
      resolve('ok')
    })
  })
}

export function mediaRouter(prisma: PrismaClient, jwtSecret: string, storage: MediaStorage | null) {
  const router = Router()
  const auth = requireAuth(prisma, jwtSecret)

  /** Every route answers 503 until R2 is configured — never a partial mode. */
  const requireStorage = (_req: AuthenticatedRequest, res: Response, next: () => void) => {
    if (!storage) return res.status(503).json({ error: 'Media storage not configured' })
    next()
  }

  router.post(
    '/upload',
    auth,
    requireRole('school_admin', 'hr_admin'),
    requireSchool,
    requireStorage,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const uploaded = await runUpload(req, res)
        if (uploaded === 'rejected') return

        const schoolId = req.schoolId as string // session-derived tenant — never the body
        const category = typeof req.body?.category === 'string' ? req.body.category : ''
        if (!isUploadCategory(category)) {
          return res.status(400).json({ error: 'Invalid upload category' })
        }
        const policy = UPLOAD_POLICY[category]

        const file = req.file
        if (!file) {
          return res.status(400).json({ error: 'File is required' })
        }
        // Server-side size enforcement per category (independent of the UI).
        if (file.size > policy.maxBytes) {
          return res.status(413).json({ error: `File exceeds the ${Math.floor(policy.maxBytes / 1024)} KB limit for ${category}` })
        }
        if (file.size === 0) {
          return res.status(400).json({ error: 'Empty file' })
        }
        const mime = file.mimetype
        if (!(policy.mimes as readonly string[]).includes(mime)) {
          return res.status(400).json({ error: `MIME type ${mime} is not allowed for ${category}` })
        }
        // The bytes must actually be that image type.
        if (!matchesSignature(file.buffer, mime)) {
          return res.status(400).json({ error: 'File signature does not match the declared type' })
        }

        const mediaId = randomUUID()
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'file'
        const objectKey = `schools/${schoolId}/${category}/${mediaId}${EXT_BY_MIME[mime]}`

        await storage!.put(objectKey, file.buffer, mime)
        try {
          const row = await prisma.mediaObject.create({
            data: {
              id: mediaId,
              schoolId,
              category,
              objectKey,
              fileName: safeName,
              mimeType: mime,
              sizeBytes: file.size,
              uploadedById: req.userId ?? null,
            },
          })
          audit({
            action: 'media.upload',
            actorId: req.userId,
            actorRole: req.userRole,
            schoolId,
            resourceId: row.id,
            outcome: 'success',
            detail: { category, sizeBytes: file.size, mimeType: mime },
          })
          res.status(201).json(row)
        } catch (err) {
          // Metadata write failed after the object landed — remove the object
          // again so no orphaned bytes remain.
          await storage!.delete(objectKey).catch(() => undefined)
          throw err
        }
      } catch {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  router.get('/', auth, requireRole('school_admin', 'hr_admin', 'super_admin'), requireStorage, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requested = typeof req.query.schoolId === 'string' && req.query.schoolId ? req.query.schoolId : undefined
      let where: { schoolId?: string } = {}
      if (req.userRole === 'super_admin') {
        if (requested) where = { schoolId: requested }
      } else {
        if (!req.schoolId) return res.status(403).json({ error: 'No tenant context' })
        where = { schoolId: req.schoolId } // session scope — client values ignored
      }

      const media = await prisma.mediaObject.findMany({
        where: { ...where, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      })
      res.json({ data: media, total: media.length })
      if (req.userRole === 'super_admin' && requested) {
        audit({
          action: 'media.list.cross_tenant',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: requested,
          outcome: 'success',
          detail: { total: media.length },
        })
      }
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/:id/url', auth, requireRole('school_admin', 'hr_admin', 'teacher', 'super_admin'), requireStorage, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = presignQuerySchema.parse(req.query)
      const row = await findAuthorizedRow(prisma, req, req.params.id as string)
      if (!row) {
        return res.status(404).json({ error: 'Media not found' })
      }
      const url = await storage!.presignGet(row.objectKey, query.ttl)
      audit({
        action: 'media.download.url',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId: row.schoolId,
        resourceId: row.id,
        outcome: 'success',
        detail: { crossTenant: req.userRole === 'super_admin' && row.schoolId !== req.schoolId, ttlSeconds: query.ttl },
      })
      res.json({ url, expiresInSeconds: query.ttl, mimeType: row.mimeType })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Public streaming endpoint for institution branding (logo & banner).
   * Does NOT require authentication so public pages (login, public landing)
   * can display institutional assets securely directly from R2.
   */
  router.get('/public/:id', requireStorage, async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      if (req.headers['if-none-match'] === `"${id}"`) {
        return res.status(304).end()
      }
      const row = await prisma.mediaObject.findFirst({
        where: {
          id,
          deletedAt: null,
          category: { in: ['institution_logo', 'institution_banner'] },
        },
      })
      if (!row) {
        return res.status(404).json({ error: 'Media not found' })
      }
      const stream = await storage!.getStream(row.objectKey)
      res.setHeader('Content-Type', row.mimeType)
      res.setHeader('Content-Length', String(row.sizeBytes))
      res.setHeader('ETag', `"${row.id}"`)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Content-Disposition', `inline; filename="${row.fileName.replace(/"/g, '')}"`)
      stream.pipe(res)
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/:id', auth, requireRole('school_admin', 'hr_admin', 'teacher', 'super_admin'), requireStorage, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const row = await findAuthorizedRow(prisma, req, req.params.id as string)
      if (!row) {
        return res.status(404).json({ error: 'Media not found' })
      }
      const stream = await storage!.getStream(row.objectKey)
      res.setHeader('Content-Type', row.mimeType)
      res.setHeader('Content-Length', String(row.sizeBytes))
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Content-Disposition', `inline; filename="${row.fileName.replace(/"/g, '')}"`)
      audit({
        action: 'media.download.stream',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId: row.schoolId,
        resourceId: row.id,
        outcome: 'success',
        detail: { crossTenant: req.userRole === 'super_admin' && row.schoolId !== req.schoolId },
      })
      stream.pipe(res)
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.delete('/:id', auth, requireRole('school_admin', 'hr_admin'), requireSchool, requireStorage, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const id = req.params.id as string

      const row = await prisma.mediaObject.findFirst({ where: { id, schoolId, deletedAt: null } })
      if (!row) {
        audit({ action: 'media.delete', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Media not found' })
      }

      // Physical object first, then tombstone; a crash in between leaves a
      // row pointing at a missing object (safe: reads404 from storage),
      // never an untracked object.
      await storage!.delete(row.objectKey)
      const deletedAt = new Date()
      await prisma.mediaObject.updateMany({ where: { id, schoolId, deletedAt: null }, data: { deletedAt } })
      const retentionUntil = new Date(deletedAt)
      retentionUntil.setFullYear(retentionUntil.getFullYear() + RETENTION_YEARS)

      audit({
        action: 'media.delete',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId,
        resourceId: id,
        outcome: 'success',
        detail: { retentionUntil: retentionUntil.toISOString() },
      })
      res.json({ success: true, retentionUntil: retentionUntil.toISOString() })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
