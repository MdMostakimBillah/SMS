import { Router, type Response } from 'express'
import type { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2002'
}
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole, requireSchool, resolveTenantReadScope } from '../middleware/rbac.js'
import { audit } from '../audit.js'

const listQuerySchema = z.object({
  schoolId: z.string().min(1).optional(),
})

const nullableString = z.string().nullable().optional()

const createSubjectSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  nameBn: z.string().max(200).nullable().optional(),
  departmentId: nullableString,
  departmentIds: z.array(z.string()).optional(),
})

const updateSubjectSchema = createSubjectSchema.partial()

const READ_ROLES = ['school_admin', 'hr_admin', 'teacher', 'super_admin']
const WRITE_ROLES = ['school_admin', 'hr_admin', 'super_admin']

export function subjectRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(prisma, jwtSecret)

  router.get('/', auth, requireRole(...READ_ROLES), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = listQuerySchema.parse(req.query)
      const scope = resolveTenantReadScope(req, query.schoolId)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const subjects = await prisma.subject.findMany({
        where: scope.where,
        orderBy: { createdAt: 'asc' },
      })
      res.json({ data: subjects, total: subjects.length })
      if (req.userRole === 'super_admin' && query.schoolId) {
        audit({
          action: 'subject.list.cross_tenant',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: query.schoolId,
          outcome: 'success',
          detail: { total: subjects.length },
        })
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.post('/', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let schoolId = req.schoolId as string
      if (req.userRole === 'super_admin') {
        schoolId = (req.body.schoolId as string) || (req.headers['x-school-id'] as string) || req.schoolId || ''
        if (!schoolId) {
          const platform = await prisma.school.findFirst({
            where: { domain: { in: ['edutech', 'main'] } },
            select: { id: true },
          })
          schoolId = platform?.id || ''
        }
      }
      if (!schoolId) {
        return res.status(400).json({ error: 'School ID required' })
      }

      const body = createSubjectSchema.parse(req.body)

      const subject = await prisma.subject.create({
        data: {
          schoolId,
          name: body.name,
          nameBn: body.nameBn ?? null,
          departmentId: body.departmentId ?? (body.departmentIds?.[0] ?? null),
          departmentIds: body.departmentIds ?? (body.departmentId ? [body.departmentId] : []),
        },
      })
      audit({ action: 'subject.create', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: subject.id, outcome: 'success' })
      res.status(201).json(subject)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Subject with this name already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.put('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string

      const body = updateSubjectSchema.parse(req.body)
      const data: Prisma.SubjectUpdateManyMutationInput = {}
      if (body.name !== undefined) data.name = body.name
      if (body.nameBn !== undefined) data.nameBn = body.nameBn
      if (body.departmentId !== undefined) data.departmentId = body.departmentId
      if (body.departmentIds !== undefined) data.departmentIds = body.departmentIds

      if (Object.keys(data).length > 0) {
        let count = 0
        if (req.userRole === 'super_admin') {
          const where = req.schoolId ? { id, schoolId: req.schoolId } : { id }
          const updateRes = await prisma.subject.updateMany({ where, data })
          count = updateRes.count
          if (count === 0) {
            const fallback = await prisma.subject.updateMany({ where: { id }, data })
            count = fallback.count
          }
        } else {
          const updateRes = await prisma.subject.updateMany({ where: { id, schoolId: req.schoolId as string }, data })
          count = updateRes.count
        }
        if (count === 0) {
          audit({ action: 'subject.update', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'not_found' })
          return res.status(404).json({ error: 'Subject not found' })
        }
      }

      const subject = req.userRole === 'super_admin'
        ? await prisma.subject.findUnique({ where: { id } })
        : await prisma.subject.findFirst({ where: { id, schoolId: req.schoolId as string } })
      if (!subject) {
        audit({ action: 'subject.update', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Subject not found' })
      }
      audit({ action: 'subject.update', actorId: req.userId, actorRole: req.userRole, schoolId: subject.schoolId, resourceId: id, outcome: 'success' })
      res.json(subject)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Subject with this name already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.delete('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string

      let count = 0
      if (req.userRole === 'super_admin') {
        const where = req.schoolId ? { id, schoolId: req.schoolId } : { id }
        const delRes = await prisma.subject.deleteMany({ where })
        count = delRes.count
        if (count === 0) {
          const fallback = await prisma.subject.deleteMany({ where: { id } })
          count = fallback.count
        }
      } else {
        const delRes = await prisma.subject.deleteMany({ where: { id, schoolId: req.schoolId as string } })
        count = delRes.count
      }

      if (count === 0) {
        audit({ action: 'subject.delete', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Subject not found' })
      }
      audit({ action: 'subject.delete', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'success' })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
