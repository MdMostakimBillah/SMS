import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export function schoolRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  async function resolveSchool(rawSlug: string | string[] | undefined) {
    if (!rawSlug) return null
    const str = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug
    if (typeof str !== 'string') return null
    const slug = str.trim().toLowerCase()
    if (!slug) return null

    return prisma.school.findFirst({
      where: {
        OR: [{ domain: slug }, { id: slug }],
      },
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
        storageMode: true,
        serverUrl: true,
        folderName: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  function formatSchoolResponse(school: NonNullable<Awaited<ReturnType<typeof resolveSchool>>>) {
    return {
      school,
      ...school,
      slug: school.domain,
    }
  }

  /**
   * Public school metadata lookup by domain / slug.
   * Matches /public/:slug
   */
  router.get('/public/:slug', async (req: Request, res: Response) => {
    try {
      const school = await resolveSchool(req.params.slug)
      if (!school) {
        return res.status(404).json({ error: 'Institution not found', school: null })
      }
      res.json(formatSchoolResponse(school))
    } catch (err) {
      console.error('[schools] public get failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * List all schools in the system.
   * Accessible by Super Admin with authentication, or returns public school directory.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const schools = await prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
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
          createdAt: true,
          updatedAt: true,
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
   * Direct school lookup by domain / slug / id.
   * Matches /:slug
   */
  router.get('/:slug', async (req: Request, res: Response) => {
    try {
      const rawSlug = req.params.slug
      if (rawSlug === 'public') {
        return res.status(400).json({ error: 'Slug is required' })
      }
      const school = await resolveSchool(rawSlug)
      if (!school) {
        return res.status(404).json({ error: 'Institution not found', school: null })
      }
      res.json(formatSchoolResponse(school))
    } catch (err) {
      console.error('[schools] lookup failed:', err instanceof Error ? err.message : err)
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
