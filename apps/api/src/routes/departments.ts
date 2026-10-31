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
 * Departments router (Phase 7, approved with the teacher-write migration).
 *
 * Mirrors the teachers router exactly: one shared RBAC policy
 * (see `middleware/rbac.ts`), tenant scope from trusted session state only,
 * Zod allowlists that strip `schoolId`/`id`/`createdAt` from bodies
 * (mass-assignment safe), and atomic `{ id, schoolId }` writes so a foreign ID
 * yields 404 — never another tenant's data.
 *
 * `Department` has a `@@unique([name, schoolId])` constraint: duplicate names
 * within the caller's own school answer 409.
 */

const listQuerySchema = z.object({
  schoolId: z.string().min(1).optional(),
})

const nullableString = z.string().nullable().optional()

const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  nameBn: z.string().max(200).nullable().optional(),
  head: nullableString,
})

const updateDepartmentSchema = createDepartmentSchema.partial()

/** Same approved policy as teachers: READ = school_admin + hr_admin + super_admin (read-only). */
const READ_ROLES = ['school_admin', 'hr_admin', 'super_admin']
const WRITE_ROLES = ['school_admin', 'hr_admin']

export function departmentRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()
  const auth = requireAuth(prisma, jwtSecret)

  router.get('/', auth, requireRole(...READ_ROLES), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const query = listQuerySchema.parse(req.query)
      const scope = resolveTenantReadScope(req, query.schoolId)
      if (!scope.ok) return res.status(403).json({ error: 'No tenant context' })

      const departments = await prisma.department.findMany({
        where: scope.where,
        orderBy: { createdAt: 'asc' },
      })
      res.json({ data: departments, total: departments.length })
      if (req.userRole === 'super_admin' && query.schoolId) {
        // Privileged cross-tenant read — always audited.
        audit({
          action: 'department.list.cross_tenant',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: query.schoolId,
          outcome: 'success',
          detail: { total: departments.length },
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
      const schoolId = req.schoolId as string // trusted session state — never the body
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { storageMode: true },
      })
      if (school?.storageMode === 'local_computer') {
        return res.status(400).json({
          error: 'Institution is in Local Computer storage mode. Operational data must be stored locally on the PC, not on the server.',
        })
      }
      const body = createDepartmentSchema.parse(req.body)

      const department = await prisma.department.create({
        data: {
          schoolId,
          name: body.name,
          nameBn: body.nameBn ?? null,
          head: body.head ?? null,
        },
      })
      audit({ action: 'department.create', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: department.id, outcome: 'success' })
      res.status(201).json(department)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Department with this name already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.put('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const id = req.params.id as string

      const body = updateDepartmentSchema.parse(req.body)
      const data: Prisma.DepartmentUpdateManyMutationInput = {}
      if (body.name !== undefined) data.name = body.name
      if (body.nameBn !== undefined) data.nameBn = body.nameBn
      if (body.head !== undefined) data.head = body.head

      if (Object.keys(data).length > 0) {
        // Atomic tenant-scoped write (same TOCTOU-closing pattern as teachers).
        const { count } = await prisma.department.updateMany({ where: { id, schoolId }, data })
        if (count === 0) {
          audit({ action: 'department.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
          return res.status(404).json({ error: 'Department not found' })
        }
      }

      const department = await prisma.department.findFirst({ where: { id, schoolId } })
      if (!department) {
        audit({ action: 'department.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Department not found' })
      }
      audit({ action: 'department.update', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'success' })
      res.json(department)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors })
      }
      if (isUniqueViolation(err)) {
        return res.status(409).json({ error: 'Department with this name already exists' })
      }
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  router.delete('/:id', auth, requireRole(...WRITE_ROLES), requireSchool, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.schoolId as string
      const id = req.params.id as string

      // `departmentId` on teachers/subjects is a soft reference (no FK), so a
      // plain tenant-scoped delete matches the previous local semantics.
      const { count } = await prisma.department.deleteMany({ where: { id, schoolId } })
      if (count === 0) {
        audit({ action: 'department.delete', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'not_found' })
        return res.status(404).json({ error: 'Department not found' })
      }
      audit({ action: 'department.delete', actorId: req.userId, actorRole: req.userRole, schoolId, resourceId: id, outcome: 'success' })
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
