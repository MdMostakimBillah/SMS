import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function hostelRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/hostel
   * Fetch hostel rooms and student assignments for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        hostelData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      let parsedHostel: any = {}
      try {
        if ((school as any).hostelData) {
          parsedHostel = typeof (school as any).hostelData === 'string'
            ? JSON.parse((school as any).hostelData)
            : (school as any).hostelData
        }
      } catch {
        parsedHostel = {}
      }

      const rooms = Array.isArray(parsedHostel?.rooms) ? parsedHostel.rooms : []
      const assignments = Array.isArray(parsedHostel?.assignments) ? parsedHostel.assignments : []

      res.json({
        rooms,
        assignments,
      })
    } catch (err) {
      console.error('[hostel] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/hostel
   * Save rooms and student assignments for the institution.
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
          message: 'Local computer storage: hostel stored locally on PC.',
          rooms: [],
          assignments: [],
        })
      }

      let existingHostel: any = {}
      try {
        if ((school as any).hostelData) {
          existingHostel = typeof (school as any).hostelData === 'string'
            ? JSON.parse((school as any).hostelData)
            : (school as any).hostelData
        }
      } catch {
        existingHostel = {}
      }

      const updatedHostel = {
        rooms: req.body.rooms !== undefined ? req.body.rooms : (existingHostel.rooms || []),
        assignments: req.body.assignments !== undefined ? req.body.assignments : (existingHostel.assignments || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          hostelData: JSON.stringify(updatedHostel),
        } as any,
      })

      res.json({
        success: true,
        ...updatedHostel,
      })
    } catch (err) {
      console.error('[hostel] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
