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
        storageMode: school.storageMode,
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

  /**
   * POST /api/notifications/broadcast
   * Broadcast a system/update notification to all active institutions (super_admin only).
   */
  router.post('/broadcast', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.userRole !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can broadcast notifications to all institutions' })
      }

      const raw = req.body.notification ?? req.body
      if (!raw || (!raw.title && !raw.titleBn)) {
        return res.status(400).json({ error: 'Notification title is required' })
      }

      const newNotif = {
        id: raw.id || `NTF-SYS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: raw.title || raw.titleBn,
        titleBn: raw.titleBn || raw.title,
        message: raw.message || raw.messageBn || '',
        messageBn: raw.messageBn || raw.message || '',
        type: raw.type || 'info',
        category: raw.category || 'system',
        link: raw.link || undefined,
        sender: raw.sender || 'Super Admin',
        senderRole: 'super_admin',
        read: false,
        broadcastToAll: raw.broadcastToAll ?? (raw.targetType !== 'specific'),
        targetType: raw.targetType || 'all',
        targetInstitutions: raw.targetInstitutions || [],
        targetInstitutionNames: raw.targetInstitutionNames || [],
        createdAt: raw.createdAt || new Date().toISOString(),
      }

      const schools = await prisma.school.findMany({
        where: { status: 'active' },
        select: { id: true, name: true, domain: true, storageMode: true, notificationsData: true },
      })

      const isTargeted = newNotif.targetType === 'specific' && Array.isArray(newNotif.targetInstitutions) && newNotif.targetInstitutions.length > 0
      const targetSet = new Set((newNotif.targetInstitutions || []).map((t: string) => String(t).toLowerCase().trim()))
      if (Array.isArray(newNotif.targetInstitutionNames)) {
        newNotif.targetInstitutionNames.forEach((n: string) => targetSet.add(String(n).toLowerCase().trim()))
      }

      let broadcastedCount = 0
      for (const s of schools) {
        if (isTargeted) {
          const keys = [s.id, s.domain, s.name].filter(Boolean).map((k) => String(k).toLowerCase().trim())
          const matches = keys.some((k) => targetSet.has(k))
          if (!matches) continue
        }

        let existing: any[] = []
        try {
          if (s.notificationsData) {
            const parsed = typeof s.notificationsData === 'string' ? JSON.parse(s.notificationsData) : s.notificationsData
            existing = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.notifications) ? parsed.notifications : [])
          }
        } catch {
          existing = []
        }

        const merged = [newNotif, ...existing.filter((item: any) => item.id !== newNotif.id)]
        await prisma.school.update({
          where: { id: s.id },
          data: { notificationsData: JSON.stringify(merged) },
        })
        broadcastedCount++
      }

      res.json({
        success: true,
        notification: newNotif,
        schoolsCount: broadcastedCount,
      })
    } catch (err) {
      console.error('[notifications] broadcast failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
