import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function classRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/classes
   * Fetch all classes and routines for the active institution.
   * Public by explicit ?slug= (school landing pages); authenticated sessions
   * resolve their own school when no slug is given.
   */
  router.get('/', optionalAuth(prisma, jwtSecret), async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        classesData: true,
        routinesData: true,
        sessions: true,
        breaks: true,
        startTime: true,
        endTime: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      let classes = []
      let routines = []
      try {
        if (school.classesData) {
          classes = typeof school.classesData === 'string' ? JSON.parse(school.classesData) : school.classesData
        }
      } catch {
        classes = []
      }

      try {
        if (school.routinesData) {
          routines = typeof school.routinesData === 'string' ? JSON.parse(school.routinesData) : school.routinesData
        }
      } catch {
        routines = []
      }

      let sessions = ['2025-26']
      try {
        if (school.sessions) {
          sessions = typeof school.sessions === 'string' ? JSON.parse(school.sessions) : school.sessions
        }
      } catch {
        sessions = ['2025-26']
      }

      let breaks = []
      try {
        if (school.breaks) {
          breaks = typeof school.breaks === 'string' ? JSON.parse(school.breaks) : school.breaks
        }
      } catch {
        breaks = []
      }

      res.json({
        classes: Array.isArray(classes) ? classes : [],
        routines: Array.isArray(routines) ? routines : [],
        sessions: Array.isArray(sessions) ? sessions : ['2025-26'],
        breaks: Array.isArray(breaks) ? breaks : [],
        startTime: school.startTime,
        endTime: school.endTime,
      })
    } catch (err) {
      console.error('[classes] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/classes
   * Save classes and/or routines for the institution.
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
          message: 'Local computer storage: classes stored locally on PC.',
          classes: [],
          routines: [],
        })
      }

      const updateData: any = {}
      if (req.body.classes !== undefined) {
        updateData.classesData = typeof req.body.classes === 'object' ? JSON.stringify(req.body.classes) : String(req.body.classes)
      }
      if (req.body.routines !== undefined) {
        updateData.routinesData = typeof req.body.routines === 'object' ? JSON.stringify(req.body.routines) : String(req.body.routines)
      }

      const updated = await prisma.school.update({
        where: { id: school.id },
        data: updateData,
        select: {
          id: true,
          classesData: true,
          routinesData: true,
        },
      })

      let parsedClasses = []
      let parsedRoutines = []
      try {
        if (updated.classesData) parsedClasses = JSON.parse(updated.classesData)
      } catch {}
      try {
        if (updated.routinesData) parsedRoutines = JSON.parse(updated.routinesData)
      } catch {}

      res.json({
        success: true,
        classes: parsedClasses,
        routines: parsedRoutines,
      })
    } catch (err) {
      console.error('[classes] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/classes/routines
   * Specifically update only routines for the institution.
   */
  router.put('/routines', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
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
          message: 'Local computer storage: classes stored locally on PC.',
          classes: [],
          routines: [],
        })
      }

      const routinesData = typeof req.body.routines === 'object' ? JSON.stringify(req.body.routines) : String(req.body.routines || '[]')

      const updated = await prisma.school.update({
        where: { id: school.id },
        data: { routinesData },
        select: { routinesData: true },
      })

      let parsedRoutines = []
      try {
        if (updated.routinesData) parsedRoutines = JSON.parse(updated.routinesData)
      } catch {}

      res.json({
        success: true,
        routines: parsedRoutines,
      })
    } catch (err) {
      console.error('[classes] routines PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
