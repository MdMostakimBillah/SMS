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
        storageMode: true,
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

      let parsedClassesData: any = null
      let parsedRoutinesData: any = null
      try {
        if (school.classesData) {
          parsedClassesData = typeof school.classesData === 'string' ? JSON.parse(school.classesData) : school.classesData
        }
      } catch {
        parsedClassesData = null
      }

      try {
        if (school.routinesData) {
          parsedRoutinesData = typeof school.routinesData === 'string' ? JSON.parse(school.routinesData) : school.routinesData
        }
      } catch {
        parsedRoutinesData = null
      }

      let sessions: string[] = ['2025-26']
      try {
        if (school.sessions) {
          sessions = typeof school.sessions === 'string' ? JSON.parse(school.sessions) : school.sessions
        }
      } catch {
        sessions = ['2025-26']
      }
      if (!Array.isArray(sessions) || sessions.length === 0) {
        sessions = ['2025-26']
      }

      const currentSession = (parsedClassesData?.currentSession as string) || sessions[0] || '2025-26'

      let breaks = []
      try {
        if (school.breaks) {
          breaks = typeof school.breaks === 'string' ? JSON.parse(school.breaks) : school.breaks
        }
      } catch {
        breaks = []
      }

      const requestedSession = (req.query.session as string)?.trim() || undefined
      const effectiveSession = requestedSession || currentSession

      // Extract sessionClasses and sessionRoutines
      let sessionClasses: Record<string, any[]> = {}
      let sessionRoutines: Record<string, any[]> = {}
      let currentSessionClasses: any[] = []
      let currentSessionRoutines: any[] = []

      if (parsedClassesData && typeof parsedClassesData === 'object' && !Array.isArray(parsedClassesData) && parsedClassesData.sessionClasses) {
        sessionClasses = parsedClassesData.sessionClasses
        currentSessionClasses = (requestedSession ? sessionClasses[requestedSession] : sessionClasses[effectiveSession]) || parsedClassesData.classes || []
      } else if (Array.isArray(parsedClassesData)) {
        currentSessionClasses = parsedClassesData
        const defaultSession = sessions[0] || '2025-26'
        sessionClasses = { [defaultSession]: parsedClassesData }
      }

      if (parsedRoutinesData && typeof parsedRoutinesData === 'object' && !Array.isArray(parsedRoutinesData) && parsedRoutinesData.sessionRoutines) {
        sessionRoutines = parsedRoutinesData.sessionRoutines
        currentSessionRoutines = (requestedSession ? sessionRoutines[requestedSession] : sessionRoutines[effectiveSession]) || parsedRoutinesData.routines || []
      } else if (Array.isArray(parsedRoutinesData)) {
        currentSessionRoutines = parsedRoutinesData
        const defaultSession = sessions[0] || '2025-26'
        sessionRoutines = { [defaultSession]: parsedRoutinesData }
      }

      res.json({
        storageMode: school.storageMode,
        classes: currentSessionClasses,
        routines: currentSessionRoutines,
        sessionClasses,
        sessionRoutines,
        sessions,
        currentSession,
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
  router.put('/', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'teacher', 'super_admin', 'hr_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      let targetSchoolId = req.schoolId
      if (req.userRole === 'super_admin') {
        targetSchoolId = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string) || req.schoolId
      } else {
        const requestedTarget = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string)
        targetSchoolId = req.schoolId || requestedTarget
      }

      if (!targetSchoolId) {
        return res.status(400).json({ error: 'School ID required' })
      }

      const cleanTarget = String(targetSchoolId).trim()
      const school = await prisma.school.findFirst({
        where: {
          OR: [{ id: cleanTarget }, { domain: cleanTarget }, { domain: cleanTarget.toLowerCase() }],
        },
        select: {
          id: true,
          storageMode: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (req.userRole !== 'super_admin' && req.schoolId && school.id !== req.schoolId) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const updateData: any = {}
      if (req.body.sessionClasses !== undefined || req.body.currentSession !== undefined) {
        updateData.classesData = JSON.stringify({
          sessionClasses: req.body.sessionClasses || {},
          classes: Array.isArray(req.body.classes) ? req.body.classes : [],
          currentSession: req.body.currentSession || undefined,
        })
      } else if (req.body.classes !== undefined) {
        if (Array.isArray(req.body.classes) && req.body.classes.length > 500) {
          return res.status(400).json({ error: 'Classes limit exceeded (max 500)' })
        }
        updateData.classesData = typeof req.body.classes === 'object' ? JSON.stringify(req.body.classes) : String(req.body.classes)
      }

      if (req.body.sessionRoutines !== undefined) {
        updateData.routinesData = JSON.stringify({
          sessionRoutines: req.body.sessionRoutines,
          routines: Array.isArray(req.body.routines) ? req.body.routines : [],
        })
      } else if (req.body.routines !== undefined) {
        if (Array.isArray(req.body.routines) && req.body.routines.length > 50000) {
          return res.status(400).json({ error: 'Routines limit exceeded (max 50,000)' })
        }
        updateData.routinesData = typeof req.body.routines === 'object' ? JSON.stringify(req.body.routines) : String(req.body.routines)
      }

      if (Array.isArray(req.body.sessions)) {
        updateData.sessions = JSON.stringify(req.body.sessions)
      }

      const updated = await prisma.school.update({
        where: { id: school.id },
        data: updateData,
        select: {
          id: true,
          classesData: true,
          routinesData: true,
          sessions: true,
        },
      })

      let parsedClassesData: any = null
      let parsedRoutinesData: any = null
      try {
        if (updated.classesData) parsedClassesData = JSON.parse(updated.classesData)
      } catch {}
      try {
        if (updated.routinesData) parsedRoutinesData = JSON.parse(updated.routinesData)
      } catch {}

      let parsedSessions = ['2025-26']
      try {
        if (updated.sessions) {
          parsedSessions = typeof updated.sessions === 'string' ? JSON.parse(updated.sessions) : updated.sessions
        }
      } catch {}
      if (!Array.isArray(parsedSessions) || parsedSessions.length === 0) {
        parsedSessions = ['2025-26']
      }

      res.json({
        success: true,
        classes: Array.isArray(parsedClassesData) ? parsedClassesData : (parsedClassesData?.classes || []),
        routines: Array.isArray(parsedRoutinesData) ? parsedRoutinesData : (parsedRoutinesData?.routines || []),
        sessionClasses: parsedClassesData?.sessionClasses || undefined,
        sessionRoutines: parsedRoutinesData?.sessionRoutines || undefined,
        sessions: parsedSessions,
        currentSession: parsedClassesData?.currentSession || req.body.currentSession || undefined,
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
  router.put('/routines', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'teacher', 'super_admin', 'hr_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      let targetSchoolId = req.schoolId
      if (req.userRole === 'super_admin') {
        targetSchoolId = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string) || req.schoolId
      } else {
        const requestedTarget = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string)
        targetSchoolId = req.schoolId || requestedTarget
      }

      if (!targetSchoolId) {
        return res.status(400).json({ error: 'School ID required' })
      }

      const cleanTarget = String(targetSchoolId).trim()
      const school = await prisma.school.findFirst({
        where: {
          OR: [{ id: cleanTarget }, { domain: cleanTarget }, { domain: cleanTarget.toLowerCase() }],
        },
        select: {
          id: true,
          storageMode: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (req.userRole !== 'super_admin' && req.schoolId && school.id !== req.schoolId) {
        return res.status(403).json({ error: 'Forbidden' })
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
