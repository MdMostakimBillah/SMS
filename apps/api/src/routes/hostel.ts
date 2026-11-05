import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { requireAuth, SESSION_COOKIE, type AuthenticatedRequest, type SessionClaims } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export function hostelRouter(prisma: PrismaClient, jwtSecret: string) {
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
   * GET /api/hostel
   * Fetch hostel rooms and student assignments for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(req)
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
