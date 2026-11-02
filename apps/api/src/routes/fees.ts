import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { requireAuth, SESSION_COOKIE, type AuthenticatedRequest, type SessionClaims } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export function feesRouter(prisma: PrismaClient, jwtSecret: string) {
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
   * GET /api/fees
   * Fetch fee structures, payments, categories, and waivers for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(req)
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      let parsedFees: any = {}
      try {
        if ((school as any).feesData) {
          parsedFees = typeof (school as any).feesData === 'string'
            ? JSON.parse((school as any).feesData)
            : (school as any).feesData
        }
      } catch {
        parsedFees = {}
      }

      const structures = Array.isArray(parsedFees?.structures) ? parsedFees.structures : []
      const payments = Array.isArray(parsedFees?.payments) ? parsedFees.payments : []
      const feeCategories = Array.isArray(parsedFees?.feeCategories) ? parsedFees.feeCategories : []
      const waiverCategories = Array.isArray(parsedFees?.waiverCategories) ? parsedFees.waiverCategories : []
      const waiverEntries = Array.isArray(parsedFees?.waiverEntries) ? parsedFees.waiverEntries : []
      const studentWaivers = Array.isArray(parsedFees?.studentWaivers) ? parsedFees.studentWaivers : []

      res.json({
        structures,
        payments,
        feeCategories,
        waiverCategories,
        waiverEntries,
        studentWaivers,
      })
    } catch (err) {
      console.error('[fees] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/fees
   * Save fees data (structures, payments, categories, waivers) for the institution.
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
          message: 'Local computer storage: fees stored locally on PC.',
          structures: [],
          payments: [],
          feeCategories: [],
          waiverCategories: [],
          waiverEntries: [],
          studentWaivers: [],
        })
      }

      let existingFees: any = {}
      try {
        if ((school as any).feesData) {
          existingFees = typeof (school as any).feesData === 'string'
            ? JSON.parse((school as any).feesData)
            : (school as any).feesData
        }
      } catch {
        existingFees = {}
      }

      const updatedFees = {
        structures: req.body.structures !== undefined ? req.body.structures : (existingFees.structures || []),
        payments: req.body.payments !== undefined ? req.body.payments : (existingFees.payments || []),
        feeCategories: req.body.feeCategories !== undefined ? req.body.feeCategories : (existingFees.feeCategories || []),
        waiverCategories: req.body.waiverCategories !== undefined ? req.body.waiverCategories : (existingFees.waiverCategories || []),
        waiverEntries: req.body.waiverEntries !== undefined ? req.body.waiverEntries : (existingFees.waiverEntries || []),
        studentWaivers: req.body.studentWaivers !== undefined ? req.body.studentWaivers : (existingFees.studentWaivers || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          feesData: JSON.stringify(updatedFees),
        } as any,
      })

      res.json({
        success: true,
        ...updatedFees,
      })
    } catch (err) {
      console.error('[fees] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * POST /api/fees/payments
   * Quick payment creation endpoint.
   */
  router.post('/payments', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const school = await resolveTargetSchool(req)
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({ success: true, message: 'Local computer storage: payment stored locally on PC.' })
      }

      let existingFees: any = {}
      try {
        if ((school as any).feesData) {
          existingFees = typeof (school as any).feesData === 'string'
            ? JSON.parse((school as any).feesData)
            : (school as any).feesData
        }
      } catch {
        existingFees = {}
      }

      const payments = Array.isArray(existingFees.payments) ? existingFees.payments : []
      const newPayment = req.body
      payments.unshift(newPayment)
      existingFees.payments = payments

      await prisma.school.update({
        where: { id: school.id },
        data: {
          feesData: JSON.stringify(existingFees),
        } as any,
      })

      res.status(201).json({ success: true, payment: newPayment })
    } catch (err) {
      console.error('[fees] POST payment failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
