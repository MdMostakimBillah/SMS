import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function notificationsRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/notifications
   * Fetch notifications for the active institution.
   */
  router.get('/', optionalAuth(prisma, jwtSecret), async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        notificationsData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      const authReq = req as AuthenticatedRequest
      if (authReq.schoolId && authReq.userRole && authReq.userRole !== 'super_admin' && authReq.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden: cross-tenant access denied' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({
          storageMode: 'local_computer',
          notifications: [],
        })
      }

      let parsedNotifications: any[] = []
      try {
        if ((school as any).notificationsData) {
          const raw = typeof (school as any).notificationsData === 'string'
            ? JSON.parse((school as any).notificationsData)
            : (school as any).notificationsData
          parsedNotifications = Array.isArray(raw)
            ? raw
            : (Array.isArray(raw?.notifications) ? raw.notifications : [])
        }
      } catch {
        parsedNotifications = []
      }

      res.json({
        notifications: parsedNotifications,
      })
    } catch (err) {
      console.error('[notifications] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/notifications
   * Save notifications for the institution.
   */
  router.put('/', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
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
          notificationsData: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (req.userRole !== 'super_admin' && req.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden: cannot modify another school' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({
          success: true,
          storageMode: 'local_computer',
          message: 'Local storage active, database write skipped',
          count: 0,
        })
      }

      const rawNotifications = req.body.notifications ?? req.body
      const notifications = Array.isArray(rawNotifications)
        ? rawNotifications
        : (Array.isArray(rawNotifications?.notifications) ? rawNotifications.notifications : [])

      const jsonString = JSON.stringify(notifications)

      await prisma.school.update({
        where: { id: school.id },
        data: { notificationsData: jsonString },
      })

      res.json({
        success: true,
        count: notifications.length,
      })
    } catch (err) {
      console.error('[notifications] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
