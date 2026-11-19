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

const createDesignationSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  nameBn: z.string().max(200).nullable().optional(),
})

const updateDesignationSchema = createDesignationSchema.partial()

const READ_ROLES = ['school_admin', 'hr_admin', 'teacher', 'super_admin']
const WRITE_ROLES = ['school_admin', 'hr_admin', 'super_admin']

export function designationRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(prisma, jwtSecret)

  router.get('/', auth, requireRole(...READ_ROLES), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = listQuerySchema.parse(req.query)
      const scope = resolveTenantReadScope(req, query.schoolId)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const designations = await prisma.designation.findMany({
        where: scope.where,
        orderBy: { createdAt: 'asc' },
      })
      res.json({ data: designations, total: designations.length })
      if (req.userRole === 'super_admin' && query.schoolId) {
        audit({
          action: 'designation.list.cross_tenant',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: query.schoolId,
          outcome: 'success',
          detail: { total: designations.length },
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

      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { storageMode: true },
      })
      if (school?.storageMode === 'local_computer') {
        return res.status(400).json({
          error: 'Institution is in Local Computer storage mode. Operational data must be stored locally on the PC, not on the server.',
        })
      }
      const body = createDesignationSchema.parse(req.body)

      const designation = await prisma.designation.create({
        data: {
          schoolId,
          name: body.name,
          nameBn: body.nameBn ?? null,
        },
      })
      audit({ action: 'designation.create', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: designation.id, outcome: 'success' })
      res.status(201).json(designation)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Designation with this name already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.put('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string

      const body = updateDesignationSchema.parse(req.body)
      const data: Prisma.DesignationUpdateManyMutationInput = {}
      if (body.name !== undefined) data.name = body.name
      if (body.nameBn !== undefined) data.nameBn = body.nameBn

      if (Object.keys(data).length > 0) {
        let count = 0
        if (req.userRole === 'super_admin') {
          const where = req.schoolId ? { id, schoolId: req.schoolId } : { id }
          const updateRes = await prisma.designation.updateMany({ where, data })
          count = updateRes.count
          if (count === 0) {
            const fallback = await prisma.designation.updateMany({ where: { id }, data })
            count = fallback.count
          }
        } else {
          const updateRes = await prisma.designation.updateMany({ where: { id, schoolId: req.schoolId as string }, data })
          count = updateRes.count
        }
        if (count === 0) {
          audit({ action: 'designation.update', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'not_found' })
          return res.status(404).json({ error: 'Designation not found' })
        }
      }

      const designation = req.userRole === 'super_admin'
        ? await prisma.designation.findUnique({ where: { id } })
        : await prisma.designation.findFirst({ where: { id, schoolId: req.schoolId as string } })
      if (!designation) {
        audit({ action: 'designation.update', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Designation not found' })
      }
      audit({ action: 'designation.update', actorId: req.userId, actorRole: req.userRole, schoolId: designation.schoolId, resourceId: id, outcome: 'success' })
      res.json(designation)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Designation with this name already exists' })
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
        const delRes = await prisma.designation.deleteMany({ where })
        count = delRes.count
        if (count === 0) {
          const fallback = await prisma.designation.deleteMany({ where: { id } })
          count = fallback.count
        }
      } else {
        const delRes = await prisma.designation.deleteMany({ where: { id, schoolId: req.schoolId as string } })
        count = delRes.count
      }

      if (count === 0) {
        audit({ action: 'designation.delete', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Designation not found' })
      }
      audit({ action: 'designation.delete', actorId: req.userId, actorRole: req.userRole, schoolId: req.schoolId || 'all', resourceId: id, outcome: 'success' })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
