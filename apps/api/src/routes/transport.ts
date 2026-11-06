import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function transportRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/transport
   * Fetch vehicles, routes, and student assignments for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        transportData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      let parsedTransport: any = {}
      try {
        if ((school as any).transportData) {
          parsedTransport = typeof (school as any).transportData === 'string'
            ? JSON.parse((school as any).transportData)
            : (school as any).transportData
        }
      } catch {
        parsedTransport = {}
      }

      const vehicles = Array.isArray(parsedTransport?.vehicles) ? parsedTransport.vehicles : []
      const routes = Array.isArray(parsedTransport?.routes) ? parsedTransport.routes : []
      const assignments = Array.isArray(parsedTransport?.assignments) ? parsedTransport.assignments : []

      res.json({
        vehicles,
        routes,
        assignments,
      })
    } catch (err) {
      console.error('[transport] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/transport
   * Save vehicles, routes, and student assignments for the institution.
   */
  router.put('/', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      let targetSchoolId = req.schoolId
      if (req.userRole === 'super_admin') {
        targetSchoolId = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string) || req.schoolId
      } else {
        const requestedTarget = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string)
        if (requestedTarget) {
          targetSchoolId = requestedTarget
        }
      }

      if (!targetSchoolId) {
        return res.status(400).json({ error: 'School ID required' })
      }

      const school = await prisma.school.findFirst({
        where: {
          OR: [{ id: targetSchoolId }, { domain: targetSchoolId }],
        },
        select: {
          id: true,
          storageMode: true,
          transportData: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (req.userRole !== 'super_admin' && req.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({
          success: true,
          message: 'Local computer storage: transport stored locally on PC.',
          vehicles: [],
          routes: [],
          assignments: [],
        })
      }

      let existingTransport: any = {}
      try {
        if ((school as any).transportData) {
          existingTransport = typeof (school as any).transportData === 'string'
            ? JSON.parse((school as any).transportData)
            : (school as any).transportData
        }
      } catch {
        existingTransport = {}
      }

      const updatedTransport = {
        vehicles: req.body.vehicles !== undefined ? req.body.vehicles : (existingTransport.vehicles || []),
        routes: req.body.routes !== undefined ? req.body.routes : (existingTransport.routes || []),
        assignments: req.body.assignments !== undefined ? req.body.assignments : (existingTransport.assignments || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          transportData: JSON.stringify(updatedTransport),
        } as any,
      })

      res.json({
        success: true,
        ...updatedTransport,
      })
    } catch (err) {
      console.error('[transport] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
