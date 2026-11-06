import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function othersIncomeRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/others-income
   * Fetch others income categories and student assignments for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        othersIncomeData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      let parsedIncome: any = {}
      try {
        if ((school as any).othersIncomeData) {
          parsedIncome = typeof (school as any).othersIncomeData === 'string'
            ? JSON.parse((school as any).othersIncomeData)
            : (school as any).othersIncomeData
        }
      } catch {
        parsedIncome = {}
      }

      const categories = Array.isArray(parsedIncome?.categories) ? parsedIncome.categories : []
      const assignments = Array.isArray(parsedIncome?.assignments) ? parsedIncome.assignments : []

      res.json({
        categories,
        assignments,
      })
    } catch (err) {
      console.error('[others-income] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/others-income
   * Save others income categories and student assignments for the institution.
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
          message: 'Local computer storage: others income stored locally on PC.',
          categories: [],
          assignments: [],
        })
      }

      let existingIncome: any = {}
      try {
        if ((school as any).othersIncomeData) {
          existingIncome = typeof (school as any).othersIncomeData === 'string'
            ? JSON.parse((school as any).othersIncomeData)
            : (school as any).othersIncomeData
        }
      } catch {
        existingIncome = {}
      }

      const updatedIncome = {
        categories: req.body.categories !== undefined ? req.body.categories : (existingIncome.categories || []),
        assignments: req.body.assignments !== undefined ? req.body.assignments : (existingIncome.assignments || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          othersIncomeData: JSON.stringify(updatedIncome),
        } as any,
      })

      res.json({
        success: true,
        ...updatedIncome,
      })
    } catch (err) {
      console.error('[others-income] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
