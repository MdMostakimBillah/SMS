import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function expensesRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/expenses
   * Fetch expense categories and expense records for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        expensesData: true,
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
          categories: [],
          expenses: [],
        })
      }

      let parsedExpenses: any = {}
      try {
        if ((school as any).expensesData) {
          parsedExpenses = typeof (school as any).expensesData === 'string'
            ? JSON.parse((school as any).expensesData)
            : (school as any).expensesData
        }
      } catch {
        parsedExpenses = {}
      }

      const categories = Array.isArray(parsedExpenses?.categories) ? parsedExpenses.categories : []
      const expenses = Array.isArray(parsedExpenses?.expenses) ? parsedExpenses.expenses : []

      res.json({
        categories,
        expenses,
      })
    } catch (err) {
      console.error('[expenses] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/expenses
   * Save expense categories and expense records for the institution.
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
        select: {
          id: true,
          storageMode: true,
          expensesData: true,
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
          message: 'Local computer storage: expenses stored locally on PC.',
          categories: [],
          expenses: [],
        })
      }

      const categories = req.body.categories !== undefined ? req.body.categories : []
      const expenses = req.body.expenses !== undefined ? req.body.expenses : []
      if (Array.isArray(categories) && categories.length > 5000) {
        return res.status(400).json({ error: 'Categories limit exceeded (max 5,000)' })
      }
      if (Array.isArray(expenses) && expenses.length > 50000) {
        return res.status(400).json({ error: 'Expenses limit exceeded (max 50,000)' })
      }

      let existingExpenses: any = {}
      try {
        if ((school as any).expensesData) {
          existingExpenses = typeof (school as any).expensesData === 'string'
            ? JSON.parse((school as any).expensesData)
            : (school as any).expensesData
        }
      } catch {
        existingExpenses = {}
      }

      const updatedExpenses = {
        categories: req.body.categories !== undefined ? req.body.categories : (existingExpenses.categories || []),
        expenses: req.body.expenses !== undefined ? req.body.expenses : (existingExpenses.expenses || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          expensesData: JSON.stringify(updatedExpenses),
        } as any,
      })

      res.json({
        success: true,
        ...updatedExpenses,
      })
    } catch (err) {
      console.error('[expenses] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
