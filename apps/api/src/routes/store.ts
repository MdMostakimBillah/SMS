import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function storeRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/store
   * Fetch store products, categories, and sales for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        storeData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      let parsedStore: any = {}
      try {
        if ((school as any).storeData) {
          parsedStore = typeof (school as any).storeData === 'string'
            ? JSON.parse((school as any).storeData)
            : (school as any).storeData
        }
      } catch {
        parsedStore = {}
      }

      const products = Array.isArray(parsedStore?.products) ? parsedStore.products : []
      const categories = Array.isArray(parsedStore?.categories) ? parsedStore.categories : []
      const sales = Array.isArray(parsedStore?.sales) ? parsedStore.sales : []

      res.json({
        products,
        categories,
        sales,
      })
    } catch (err) {
      console.error('[store] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/store
   * Save store data (products, categories, sales) for the institution.
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
          storeData: true,
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
          message: 'Local computer storage: store stored locally on PC.',
          products: [],
          categories: [],
          sales: [],
        })
      }

      let existingStore: any = {}
      try {
        if ((school as any).storeData) {
          existingStore = typeof (school as any).storeData === 'string'
            ? JSON.parse((school as any).storeData)
            : (school as any).storeData
        }
      } catch {
        existingStore = {}
      }

      const updatedStore = {
        products: req.body.products !== undefined ? req.body.products : (existingStore.products || []),
        categories: req.body.categories !== undefined ? req.body.categories : (existingStore.categories || []),
        sales: req.body.sales !== undefined ? req.body.sales : (existingStore.sales || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          storeData: JSON.stringify(updatedStore),
        } as any,
      })

      res.json({
        success: true,
        ...updatedStore,
      })
    } catch (err) {
      console.error('[store] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * POST /api/store/sales
   * Quick sale creation endpoint.
   */
  router.post('/sales', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        storeData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({ success: true, message: 'Local computer storage: sale stored locally on PC.' })
      }

      let existingStore: any = {}
      try {
        if ((school as any).storeData) {
          existingStore = typeof (school as any).storeData === 'string'
            ? JSON.parse((school as any).storeData)
            : (school as any).storeData
        }
      } catch {
        existingStore = {}
      }

      const sales = Array.isArray(existingStore.sales) ? existingStore.sales : []
      const products = Array.isArray(existingStore.products) ? [...existingStore.products] : []
      const newSale = req.body

      // Adjust stock on products
      if (Array.isArray(newSale.items)) {
        for (const item of newSale.items) {
          const idx = products.findIndex((p: any) => p.id === item.productId)
          if (idx !== -1) {
            products[idx] = {
              ...products[idx],
              stock: Math.max(0, (products[idx].stock || 0) - (item.qty || 0)),
            }
          }
        }
      }

      sales.unshift(newSale)
      existingStore.sales = sales
      existingStore.products = products

      await prisma.school.update({
        where: { id: school.id },
        data: {
          storeData: JSON.stringify(existingStore),
        } as any,
      })

      res.status(201).json({ success: true, sale: newSale, products })
    } catch (err) {
      console.error('[store] POST sales failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
