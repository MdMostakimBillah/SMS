import { Router, type Response } from 'express'
import type { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002'
}
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole, requireSchool, resolveTenantReadScope } from '../middleware/rbac.js'
import { audit } from '../audit.js'

/**
 * Notices router (first localStorage→API domain migration).
 *
 * Mirrors the teachers/departments write policy, with one deliberate read
 * difference: notices are broadcast announcements, and the legacy UI exposes
 * the board to every institution role (`/i/:slug/:role/notice`), so reads
 * include teacher + student while writes stay admin-only:
 * - READ  = school_admin + hr_admin + teacher + student (own school) + super_admin (global, read-only)
 * - WRITE = school_admin + hr_admin only (super_admin explicitly excluded)
 * - Tenant scope from trusted session state only; a client `?schoolId` is
 *   honoured solely for super_admin narrowing and is audited.
 *
 * One-time migration support: `POST /import` ingests records from the legacy
 * localStorage store. Idempotency comes from the per-school unique
 * `(schoolId, localId)` constraint — re-imports skip existing records instead
 * of duplicating them, and conflicts are reported back, never silently fixed.
 */

/** Loose date check: the legacy store holds both full ISO timestamps and
 *  plain `yyyy-mm-dd` strings (plus '' for "no expiry"). */
const dateField = z
  .string()
  .max(40)
  .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Invalid date')
  .optional()

const TARGETS = ['all', 'students', 'teachers', 'parents'] as const
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

const noticeBodyFields = {
  title: z.string().min(1).max(300),
  titleBn: z.string().max(300).nullish(),
  content: z.string().min(1).max(100000),
  contentBn: z.string().max(100000).nullish(),
  author: z.string().max(200).nullish(),
  authorBn: z.string().max(200).nullish(),
  target: z.enum(TARGETS).default('all'),
  priority: z.enum(PRIORITIES).default('medium'),
  category: z.string().min(1).max(100).default('General'),
  pinned: z.boolean().default(false),
  isActive: z.boolean().default(true),
  publishedAt: dateField,
  expiresAt: dateField,
  storage: z.string().max(2000).nullish(),
}

const createNoticeSchema = z.object(noticeBodyFields)
const updateNoticeSchema = z.object(noticeBodyFields).partial()

/** Import item = create fields + the legacy local id (the idempotency key). */
const importItemSchema = z.object({ localId: z.string().min(1).max(200), ...noticeBodyFields })
const importSchema = z.object({ items: z.array(importItemSchema).min(1).max(500) })

const createCategorySchema = z.object({ name: z.string().min(1).max(100) })

function parseDate(value: string | null | undefined, fallback: Date | null): Date | null {
  if (!value) return fallback
  return new Date(value)
}

export function noticeRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(prisma, jwtSecret)

  router.get('/', auth, requireRole('school_admin', 'hr_admin', 'teacher', 'student', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requested = typeof req.query.schoolId === 'string' && req.query.schoolId ? req.query.schoolId : undefined
      const scope = resolveTenantReadScope(req, requested)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const notices = await prisma.notice.findMany({
        where: scope.where,
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      })
      res.json({ data: notices, total: notices.length })
      if (req.userRole === 'super_admin' && requested) {
        // Privileged cross-tenant read — always audited.
        audit({
          action: 'notice.list.cross_tenant',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: requested,
          outcome: 'success',
          detail: { total: notices.length },
        })
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/', auth, requireRole('school_admin', 'hr_admin'), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string // trusted session state — never the body
      const body = createNoticeSchema.parse(req.body)

      const notice = await prisma.notice.create({
        data: {
          schoolId,
          title: body.title,
          titleBn: body.titleBn ?? null,
          content: body.content,
          contentBn: body.contentBn ?? null,
          author: body.author ?? null,
          authorBn: body.authorBn ?? null,
          target: body.target,
          priority: body.priority,
          category: body.category,
          pinned: body.pinned,
          isActive: body.isActive,
          publishedAt: parseDate(body.publishedAt, new Date()) as Date,
          expiresAt: parseDate(body.expiresAt, null),
          storage: body.storage ?? null,
        },
      })
      audit({ action: 'notice.create', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: notice.id, outcome: 'success' })
      res.status(201).json(notice)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.put('/:id', auth, requireRole('school_admin', 'hr_admin'), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const id = req.params.id as string

      const body = updateNoticeSchema.parse(req.body)
      const data: Prisma.NoticeUpdateManyMutationInput = {}
      if (body.title !== undefined) data.title = body.title
      if (body.titleBn !== undefined) data.titleBn = body.titleBn
      if (body.content !== undefined) data.content = body.content
      if (body.contentBn !== undefined) data.contentBn = body.contentBn
      if (body.author !== undefined) data.author = body.author
      if (body.authorBn !== undefined) data.authorBn = body.authorBn
      if (body.target !== undefined) data.target = body.target
      if (body.priority !== undefined) data.priority = body.priority
      if (body.category !== undefined) data.category = body.category
      if (body.pinned !== undefined) data.pinned = body.pinned
      if (body.isActive !== undefined) data.isActive = body.isActive
      if (body.publishedAt !== undefined) data.publishedAt = parseDate(body.publishedAt, new Date()) as Date
      if (body.expiresAt !== undefined) data.expiresAt = parseDate(body.expiresAt, null)
      if (body.storage !== undefined) data.storage = body.storage

      if (Object.keys(data).length > 0) {
        // Atomic tenant-scoped write (same TOCTOU-closing pattern as teachers).
        const { count } = await prisma.notice.updateMany({ where: { id, schoolId }, data })
        if (count === 0) {
          audit({ action: 'notice.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
          return res.status(404).json({ error: 'Notice not found' })
        }
      }

      const notice = await prisma.notice.findFirst({ where: { id, schoolId } })
      if (!notice) {
        audit({ action: 'notice.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Notice not found' })
      }
      audit({ action: 'notice.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'success' })
      res.json(notice)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.delete('/:id', auth, requireRole('school_admin', 'hr_admin'), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const id = req.params.id as string

      // Atomic tenant-scoped delete (see PUT). Cross-tenant IDs -> 404.
      const { count } = await prisma.notice.deleteMany({ where: { id, schoolId } })
      if (count === 0) {
        audit({ action: 'notice.delete', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Notice not found' })
      }
      audit({ action: 'notice.delete', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'success' })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * One-time import of legacy localStorage records.
   *
   * Idempotent by design: records whose (schoolId, localId) already exist are
   * skipped and reported; duplicates inside one batch are reported as
   * conflicts. Nothing is ever overwritten — existing server data always wins.
   */
  router.post('/import', auth, requireRole('school_admin', 'hr_admin'), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const parsed = importSchema.parse(req.body)

      const localIds = parsed.items.map((i) => i.localId)
      const existing = await prisma.notice.findMany({
        where: { schoolId, localId: { in: localIds } },
        select: { localId: true },
      })
      const existingSet = new Set(existing.map((r) => r.localId))

      const seen = new Set<string>()
      const conflicts: Array<{ localId: string; title: string; reason: string }> = []
      const toCreate: Prisma.NoticeCreateManyInput[] = []

      for (const item of parsed.items) {
        if (existingSet.has(item.localId)) {
          conflicts.push({ localId: item.localId, title: item.title, reason: 'already_imported' })
          continue
        }
        if (seen.has(item.localId)) {
          conflicts.push({ localId: item.localId, title: item.title, reason: 'duplicate_in_batch' })
          continue
        }
        seen.add(item.localId)
        toCreate.push({
          schoolId,
          localId: item.localId,
          title: item.title,
          titleBn: item.titleBn ?? null,
          content: item.content,
          contentBn: item.contentBn ?? null,
          author: item.author ?? null,
          authorBn: item.authorBn ?? null,
          target: item.target,
          priority: item.priority,
          category: item.category,
          pinned: item.pinned,
          isActive: item.isActive,
          publishedAt: parseDate(item.publishedAt, new Date()) as Date,
          expiresAt: parseDate(item.expiresAt, null),
          storage: item.storage ?? null,
        })
      }

      let imported = 0
      if (toCreate.length > 0) {
        try {
          const result = await prisma.notice.createMany({ data: toCreate })
          imported = result.count
        } catch (err) {
          // Concurrent import race on the (schoolId, localId) unique index:
          // report as retryable — a re-run safely skips whatever landed.
          if (isUniqueViolation(err)) {
            return res.status(409).json({ error: 'Concurrent import detected — re-run to resume (already-imported items will be skipped)' })
          }
          throw err
        }
      }

      const skipped = conflicts.filter((c) => c.reason === 'already_imported').length
      audit({
        action: 'notice.import',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId,
        outcome: 'success',
        detail: { imported, skipped, conflicts: conflicts.length },
      })
      res.json({ imported, skipped, conflicts })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.get('/categories', auth, requireRole('school_admin', 'hr_admin', 'teacher', 'student', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const scope = resolveTenantReadScope(req)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const categories = await prisma.noticeCategory.findMany({
        where: scope.where,
        orderBy: { name: 'asc' },
      })
      res.json({ data: categories.map((c) => c.name) })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/categories', auth, requireRole('school_admin', 'hr_admin'), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const body = createCategorySchema.parse(req.body)

      const category = await prisma.noticeCategory.create({ data: { schoolId, name: body.name } })
      audit({ action: 'notice.category.create', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: category.id, outcome: 'success' })
      res.status(201).json({ name: category.name })
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Category already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Deleting a category reassigns its notices to 'General' in one transaction —
  // same semantics as the legacy local store's removeCategory.
  router.delete('/categories/:name', auth, requireRole('school_admin', 'hr_admin'), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const name = decodeURIComponent(req.params.name as string)

      const result = await prisma.$transaction(async (tx) => {
        const reassigned = await tx.notice.updateMany({
          where: { schoolId, category: name },
          data: { category: 'General' },
        })
        const deleted = await tx.noticeCategory.deleteMany({ where: { schoolId, name } })
        return { reassigned: reassigned.count, deleted: deleted.count }
      })

      if (result.deleted === 0) {
        audit({ action: 'notice.category.delete', actorId: req.userId, actorRole: req.userRole, schoolId, outcome: 'not_found', detail: { name } })
        return res.status(404).json({ error: 'Category not found' })
      }
      audit({
        action: 'notice.category.delete',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId,
        outcome: 'success',
        detail: { name, reassigned: result.reassigned },
      })
      res.json({ success: true, reassigned: result.reassigned })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
