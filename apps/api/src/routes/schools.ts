import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export function schoolRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * Public school metadata lookup by domain / slug.
   * Used for school branding on /i/:slug/login and /i/:slug landing pages.
   */
  router.get('/public/:slug', async (req: Request, res: Response) => {
    try {
      const rawSlug = req.params.slug
      const slug = typeof rawSlug === 'string' ? rawSlug.trim().toLowerCase() : ''
      if (!slug) {
        return res.status(400).json({ error: 'Slug is required' })
      }

      const school = await prisma.school.findFirst({
        where: { domain: slug },
        select: {
          id: true,
          name: true,
          nameBn: true,
          domain: true,
          email: true,
          phone: true,
          address: true,
          logo: true,
          startTime: true,
          endTime: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'School not found' })
      }

      res.json({ school })
    } catch (err) {
      console.error('[schools] public get failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Super Admin only: List all schools in the system.
   */
  router.get('/', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const schools = await prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              teachers: true,
              students: true,
            },
          },
        },
      })
      res.json(schools)
    } catch (err) {
      console.error('[schools] list failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Super Admin only: Delete a school.
   */
  router.delete('/:id', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string
      await prisma.school.delete({
        where: { id },
      })
      res.json({ success: true })
    } catch (err) {
      console.error('[schools] delete failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
