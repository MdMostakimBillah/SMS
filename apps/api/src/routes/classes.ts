import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { requireAuth, SESSION_COOKIE, type AuthenticatedRequest, type SessionClaims } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export function classRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * Helper to resolve school by auth context or query param.
   */
  async function resolveTargetSchool(req: Request) {
    const authReq = req as AuthenticatedRequest
    const querySchoolId = req.query.schoolId as string | undefined
    const querySlug = (req.query.slug || req.query.domain) as string | undefined

    if (querySchoolId) {
      const byId = await prisma.school.findFirst({
        where: { OR: [{ id: querySchoolId }, { domain: querySchoolId }] },
      })
      if (byId) return byId
    }

    if (querySlug) {
      const bySlug = await prisma.school.findFirst({
        where: { OR: [{ domain: querySlug }, { id: querySlug }] },
      })
      if (bySlug) return bySlug
    }

    if (authReq.schoolId) {
      return prisma.school.findUnique({ where: { id: authReq.schoolId } })
    }

    const token = req.cookies?.[SESSION_COOKIE] as string | undefined
    if (token) {
      try {
        const claims = jwt.verify(token, jwtSecret) as SessionClaims
        if (claims?.jti && claims?.userId) {
          const session = await prisma.session.findUnique({ where: { id: claims.jti } })
          if (session && session.userId === claims.userId && !session.revokedAt && session.expiresAt.getTime() > Date.now()) {
            const user = await prisma.user.findUnique({
              where: { id: claims.userId },
              select: { id: true, role: true, schoolId: true, isActive: true },
            })
            if (user?.isActive && user.schoolId) {
              return prisma.school.findUnique({ where: { id: user.schoolId } })
            }
          }
        }
      } catch {}
    }

    return null
  }

  /**
   * GET /api/classes
   * Fetch all classes and routines for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(req)
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
        if (requestedTarget && requestedTarget !== req.schoolId) {
          const match = await prisma.school.findFirst({
            where: { OR: [{ id: requestedTarget }, { domain: requestedTarget }] },
            select: { id: true },
          })
          if (!match || match.id !== req.schoolId) {
            return res.status(403).json({ error: 'Forbidden' })
          }
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
        if (requestedTarget && requestedTarget !== req.schoolId) {
          const match = await prisma.school.findFirst({
            where: { OR: [{ id: requestedTarget }, { domain: requestedTarget }] },
            select: { id: true },
          })
          if (!match || match.id !== req.schoolId) {
            return res.status(403).json({ error: 'Forbidden' })
          }
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
