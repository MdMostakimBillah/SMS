import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function hrRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/hr
   * Fetch HR records (increments, bonuses, promotions, funds, facilities, salary configs, etc.)
   * for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        hrData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      const authReq = req as AuthenticatedRequest
      if (authReq.schoolId && authReq.userRole && authReq.userRole !== 'super_admin' && authReq.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden: cross-tenant access denied' })
      }

      let parsedHR: any = {}
      try {
        if ((school as any).hrData) {
          parsedHR = typeof (school as any).hrData === 'string'
            ? JSON.parse((school as any).hrData)
            : (school as any).hrData
        }
      } catch {
        parsedHR = {}
      }

      res.json({
        increments: Array.isArray(parsedHR?.increments) ? parsedHR.increments : [],
        bonuses: Array.isArray(parsedHR?.bonuses) ? parsedHR.bonuses : [],
        promotions: Array.isArray(parsedHR?.promotions) ? parsedHR.promotions : [],
        funds: Array.isArray(parsedHR?.funds) ? parsedHR.funds : [],
        homeworkRecords: Array.isArray(parsedHR?.homeworkRecords) ? parsedHR.homeworkRecords : [],
        dailyReports: Array.isArray(parsedHR?.dailyReports) ? parsedHR.dailyReports : [],
        recommendations: Array.isArray(parsedHR?.recommendations) ? parsedHR.recommendations : [],
        monthlySalaryConfigs: Array.isArray(parsedHR?.monthlySalaryConfigs) ? parsedHR.monthlySalaryConfigs : [],
        facilities: Array.isArray(parsedHR?.facilities) ? parsedHR.facilities : [],
        teacherFacilities: Array.isArray(parsedHR?.teacherFacilities) ? parsedHR.teacherFacilities : [],
      })
    } catch (err) {
      console.error('[hr] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/hr
   * Save HR records for the institution.
   */
  router.put('/', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'super_admin', 'hr_admin'), async (req: AuthenticatedRequest, res: Response) => {
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
          hrData: true,
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
          message: 'Local computer storage: HR records stored locally on PC.',
          increments: [],
          bonuses: [],
          promotions: [],
          funds: [],
          homeworkRecords: [],
          dailyReports: [],
          recommendations: [],
          monthlySalaryConfigs: [],
          facilities: [],
          teacherFacilities: [],
        })
      }

      let existingHR: any = {}
      try {
        if ((school as any).hrData) {
          existingHR = typeof (school as any).hrData === 'string'
            ? JSON.parse((school as any).hrData)
            : (school as any).hrData
        }
      } catch {
        existingHR = {}
      }

      const sanitizeArray = (val: any) => {
        if (!Array.isArray(val)) return undefined
        return val.slice(0, 10000)
      }

      const updatedHR = {
        increments: req.body.increments !== undefined ? (sanitizeArray(req.body.increments) ?? existingHR.increments ?? []) : (existingHR.increments || []),
        bonuses: req.body.bonuses !== undefined ? (sanitizeArray(req.body.bonuses) ?? existingHR.bonuses ?? []) : (existingHR.bonuses || []),
        promotions: req.body.promotions !== undefined ? (sanitizeArray(req.body.promotions) ?? existingHR.promotions ?? []) : (existingHR.promotions || []),
        funds: req.body.funds !== undefined ? (sanitizeArray(req.body.funds) ?? existingHR.funds ?? []) : (existingHR.funds || []),
        homeworkRecords: req.body.homeworkRecords !== undefined ? (sanitizeArray(req.body.homeworkRecords) ?? existingHR.homeworkRecords ?? []) : (existingHR.homeworkRecords || []),
        dailyReports: req.body.dailyReports !== undefined ? (sanitizeArray(req.body.dailyReports) ?? existingHR.dailyReports ?? []) : (existingHR.dailyReports || []),
        recommendations: req.body.recommendations !== undefined ? (sanitizeArray(req.body.recommendations) ?? existingHR.recommendations ?? []) : (existingHR.recommendations || []),
        monthlySalaryConfigs: req.body.monthlySalaryConfigs !== undefined ? (sanitizeArray(req.body.monthlySalaryConfigs) ?? existingHR.monthlySalaryConfigs ?? []) : (existingHR.monthlySalaryConfigs || []),
        facilities: req.body.facilities !== undefined ? (sanitizeArray(req.body.facilities) ?? existingHR.facilities ?? []) : (existingHR.facilities || []),
        teacherFacilities: req.body.teacherFacilities !== undefined ? (sanitizeArray(req.body.teacherFacilities) ?? existingHR.teacherFacilities ?? []) : (existingHR.teacherFacilities || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          hrData: JSON.stringify(updatedHR),
        } as any,
      })

      res.json({
        success: true,
        ...updatedHR,
      })
    } catch (err) {
      console.error('[hr] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
