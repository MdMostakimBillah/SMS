import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'
import { audit } from '../audit.js'

export function onlineRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/online
   * Fetch online classes for the active institution.
   */
  router.get('/', optionalAuth(prisma, jwtSecret), async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        onlineData: true,
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
          classes: [],
        })
      }

      let parsedOnline: any = []
      try {
        if ((school as any).onlineData) {
          parsedOnline = typeof (school as any).onlineData === 'string'
            ? JSON.parse((school as any).onlineData)
            : (school as any).onlineData
        }
      } catch {
        parsedOnline = []
      }

      const classes = Array.isArray(parsedOnline?.classes)
        ? parsedOnline.classes
        : (Array.isArray(parsedOnline) ? parsedOnline : [])

      res.json({
        classes,
      })
    } catch (err) {
      console.error('[online] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/online
   * Save online classes for the institution.
   * School admins, teachers, and super admins are allowed.
   */
  router.put(
    '/',
    requireAuth(prisma, jwtSecret),
    requireRole('school_admin', 'teacher', 'super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
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
            onlineData: true,
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
            count: Array.isArray(req.body.classes) ? req.body.classes.length : 0,
            storageMode: 'local_computer',
            message: 'Saved to local computer only (offline mode active)',
          })
        }

        const incomingClasses = Array.isArray(req.body.classes)
          ? req.body.classes
          : (Array.isArray(req.body) ? req.body : null)

        if (!incomingClasses) {
          return res.status(400).json({ error: 'Invalid online classes payload. Must provide classes array.' })
        }

        if (incomingClasses.length > 5000) {
          return res.status(400).json({ error: 'Payload exceeds maximum limit of 5,000 online classes' })
        }

        // Sanitize classes array
        const sanitizedClasses = incomingClasses.map((c: any, index: number) => ({
          id: String(c.id || `OC-${Date.now()}-${index}`),
          title: String(c.title || ''),
          titleBn: String(c.titleBn || ''),
          description: String(c.description || ''),
          descriptionBn: String(c.descriptionBn || ''),
          classId: String(c.classId || ''),
          sectionId: String(c.sectionId || ''),
          subjectId: String(c.subjectId || ''),
          teacherId: String(c.teacherId || ''),
          url: String(c.url || ''),
          platform: ['youtube', 'facebook', 'google-meet', 'zoom', 'other'].includes(c.platform) ? c.platform : 'other',
          thumbnailUrl: String(c.thumbnailUrl || ''),
          scheduledAt: String(c.scheduledAt || ''),
          status: ['scheduled', 'live', 'ended'].includes(c.status) ? c.status : 'scheduled',
          createdBy: String(c.createdBy || req.userId || 'system'),
          createdAt: String(c.createdAt || new Date().toISOString()),
          updatedAt: new Date().toISOString(),
        }))

        await prisma.school.update({
          where: { id: school.id },
          data: {
            onlineData: JSON.stringify(sanitizedClasses),
          },
        })

        audit({
          action: 'online.update',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: school.id,
          outcome: 'success',
          detail: { count: sanitizedClasses.length },
        })

        res.json({
          success: true,
          count: sanitizedClasses.length,
        })
      } catch (err) {
        console.error('[online] PUT failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  return router
}
