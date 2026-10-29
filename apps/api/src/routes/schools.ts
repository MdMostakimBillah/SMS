import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { MediaStorage } from '../storage.js'
import { uploadBase64Media, deletePreviousMedia } from '../lib/media-helper.js'

export function schoolRouter(prisma: PrismaClient, jwtSecret: string, storage?: MediaStorage | null) {
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
        brandName: true,
        brandColor: true,
        logo: true,
        banner: true,
        bannerPosition: true,
        motto: true,
        mottoBn: true,
        eiin: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        addressBn: true,
        sessions: true,
        breaks: true,
        domain: true,
        startTime: true,
        endTime: true,
        storageMode: true,
        serverUrl: true,
        folderName: true,
        status: true,
        plan: true,
        expiresAt: true,
        maxStudents: true,
        maxTeachers: true,
        paymentStatus: true,
        billingCycle: true,
        createdAt: true,
        updatedAt: true,
        subjects: {
          select: { id: true, name: true, nameBn: true },
        },
      },
    })
  }

  async function resolvePublicSchool(rawSlug: string | string[] | undefined) {
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
        brandName: true,
        brandColor: true,
        logo: true,
        banner: true,
        bannerPosition: true,
        motto: true,
        mottoBn: true,
        eiin: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        addressBn: true,
        sessions: true,
        breaks: true,
        domain: true,
        startTime: true,
        endTime: true,
        status: true,
        plan: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        subjects: {
          select: { id: true, name: true, nameBn: true },
        },
      },
    })
  }

  function formatSchoolResponse(school: any) {
    return {
      school,
      ...school,
      slug: school.domain,
    }
  }

  /**
   * Public school metadata lookup by domain / slug.
   * Exposes public branding and contact info; omits internal storage/billing data.
   * Matches /public/:slug
   */
  router.get('/public/:slug', async (req: Request, res: Response) => {
    try {
      const school = await resolvePublicSchool(req.params.slug)
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
   * Check if a subdomain / slug is available in the database.
   */
  router.get('/check-subdomain/:slug', async (req: Request, res: Response) => {
    try {
      const rawSlug = req.params.slug
      const str = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug
      const slug = (str || '').trim().toLowerCase()
      if (!slug || slug.length < 2) {
        return res.status(400).json({ available: false, error: 'Subdomain must be at least 2 characters' })
      }
      const existing = await prisma.school.findFirst({
        where: { domain: slug },
        select: { id: true },
      })
      res.json({ available: !existing })
    } catch (err) {
      console.error('[schools] check-subdomain failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ available: false, error: 'Internal server error' })
    }
  })

  /**
   * List all schools in the system.
   * Accessible exclusively by Super Admin with authentication.
   */
  router.get('/', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schools = await prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          nameBn: true,
          brandName: true,
          brandColor: true,
          logo: true,
          banner: true,
          bannerPosition: true,
          motto: true,
          mottoBn: true,
          eiin: true,
          website: true,
          phone: true,
          email: true,
          address: true,
          addressBn: true,
          sessions: true,
          breaks: true,
          domain: true,
          startTime: true,
          endTime: true,
          storageMode: true,
          serverUrl: true,
          folderName: true,
          status: true,
          plan: true,
          expiresAt: true,
          maxStudents: true,
          maxTeachers: true,
          paymentStatus: true,
          billingCycle: true,
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

      // Aggregate media storage usage per school
      const storageUsage = await prisma.mediaObject.groupBy({
        by: ['schoolId'],
        _sum: {
          sizeBytes: true,
        },
        _count: {
          id: true,
        },
        where: {
          deletedAt: null,
        },
      }).catch(() => [])

      const storageMap = new Map<string, { bytes: number; count: number }>()
      for (const item of storageUsage) {
        if (item.schoolId) {
          storageMap.set(item.schoolId, {
            bytes: item._sum?.sizeBytes || 0,
            count: item._count?.id || 0,
          })
        }
      }

      const schoolsWithStorage = schools.map((s) => {
        const usage = storageMap.get(s.id) || { bytes: 0, count: 0 }
        return {
          ...s,
          storageBytes: usage.bytes,
          mediaCount: usage.count,
        }
      })

      res.json(schoolsWithStorage)
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
   * Super Admin & School Admin: Update institution subscription / license / branding / metadata.
   */
  router.patch('/:id', requireAuth(prisma, jwtSecret), requireRole('super_admin', 'school_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requestedId = req.params.id as string

      // Resolve school by ID or domain slug
      const existingSchool = await prisma.school.findFirst({
        where: {
          OR: [{ id: requestedId }, { domain: requestedId }],
        },
      })

      if (!existingSchool) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      const id = existingSchool.id

      // Only super_admin or the school's own admin may update
      if (req.userRole !== 'super_admin' && req.schoolId !== id) {
        return res.status(403).json({ error: 'You are not authorized to update this institution' })
      }

      let parsedBody = req.body || {}
      if (typeof parsedBody === 'string') {
        try {
          parsedBody = JSON.parse(parsedBody)
        } catch {
          parsedBody = {}
        }
      }

      const {
        name,
        nameBn,
        brandName,
        brandColor,
        logo,
        banner,
        bannerPosition,
        motto,
        mottoBn,
        eiin,
        website,
        addressBn,
        sessions,
        breaks,
        subjects,
        status,
        plan,
        expiresAt,
        maxStudents,
        maxTeachers,
        paymentStatus,
        billingCycle,
        storageMode,
        serverUrl,
        folderName,
        phone,
        email,
        address,
        startTime,
        endTime,
      } = parsedBody

      const dataToUpdate: any = {}
      if (name !== undefined) dataToUpdate.name = String(name)
      if (nameBn !== undefined) dataToUpdate.nameBn = String(nameBn)
      if (brandName !== undefined) dataToUpdate.brandName = String(brandName)
      if (brandColor !== undefined) dataToUpdate.brandColor = String(brandColor)
      if (bannerPosition !== undefined) {
        dataToUpdate.bannerPosition = typeof bannerPosition === 'object' ? JSON.stringify(bannerPosition) : String(bannerPosition)
      }
      if (motto !== undefined) dataToUpdate.motto = String(motto)
      if (mottoBn !== undefined) dataToUpdate.mottoBn = String(mottoBn)
      if (eiin !== undefined) dataToUpdate.eiin = String(eiin)
      if (website !== undefined) dataToUpdate.website = String(website)
      if (addressBn !== undefined) dataToUpdate.addressBn = String(addressBn)
      if (sessions !== undefined) {
        dataToUpdate.sessions = typeof sessions === 'object' ? JSON.stringify(sessions) : String(sessions)
      }
      if (breaks !== undefined) {
        dataToUpdate.breaks = typeof breaks === 'object' ? JSON.stringify(breaks) : String(breaks)
      }
      if (storageMode !== undefined) dataToUpdate.storageMode = String(storageMode)
      if (serverUrl !== undefined) dataToUpdate.serverUrl = String(serverUrl)
      if (folderName !== undefined) dataToUpdate.folderName = String(folderName)
      if (phone !== undefined) dataToUpdate.phone = String(phone)
      if (email !== undefined) dataToUpdate.email = String(email)
      if (address !== undefined) dataToUpdate.address = String(address)
      if (startTime !== undefined) dataToUpdate.startTime = String(startTime)
      if (endTime !== undefined) dataToUpdate.endTime = String(endTime)

      // Upload logo and banner to Cloudflare R2 if provided as base64 dataUrl
      if (logo !== undefined) {
        if (typeof logo === 'string' && logo.startsWith('data:image/')) {
          dataToUpdate.logo = await uploadBase64Media(storage, prisma, id, 'institution_logo', logo)
        } else {
          dataToUpdate.logo = logo ? String(logo) : null
        }
      }
      if (banner !== undefined) {
        if (typeof banner === 'string' && banner.startsWith('data:image/')) {
          dataToUpdate.banner = await uploadBase64Media(storage, prisma, id, 'institution_banner', banner)
        } else {
          dataToUpdate.banner = banner ? String(banner) : null
        }
      }

      // Privileged license/subscription fields: super_admin only
      if (req.userRole === 'super_admin') {
        if (status !== undefined) dataToUpdate.status = String(status)
        if (plan !== undefined) dataToUpdate.plan = String(plan)
        if (expiresAt !== undefined) {
          dataToUpdate.expiresAt = expiresAt ? new Date(expiresAt) : null
        }
        if (maxStudents !== undefined) dataToUpdate.maxStudents = Number(maxStudents)
        if (maxTeachers !== undefined) dataToUpdate.maxTeachers = Number(maxTeachers)
        if (paymentStatus !== undefined) dataToUpdate.paymentStatus = String(paymentStatus)
        if (billingCycle !== undefined) dataToUpdate.billingCycle = String(billingCycle)
      }

      // Upsert subjects if provided as an array
      if (Array.isArray(subjects)) {
        for (const sub of subjects) {
          const subName = typeof sub === 'string' ? sub.trim() : sub?.name?.trim()
          if (subName) {
            await prisma.subject.upsert({
              where: {
                name_schoolId: {
                  name: subName,
                  schoolId: id,
                },
              },
              create: {
                name: subName,
                schoolId: id,
              },
              update: {},
            }).catch(() => {})
          }
        }
      }

      const updated = await prisma.school.update({
        where: { id },
        data: dataToUpdate,
        include: {
          subjects: {
            select: { id: true, name: true, nameBn: true },
          },
        },
      })

      // If user changed or removed their logo, delete previous image from R2 storage and database
      if (logo !== undefined && existingSchool.logo && existingSchool.logo !== updated.logo) {
        await deletePreviousMedia(storage, prisma, id, existingSchool.logo)
      }

      // If user changed or removed their banner, delete previous image from R2 storage and database
      if (banner !== undefined && existingSchool.banner && existingSchool.banner !== updated.banner) {
        await deletePreviousMedia(storage, prisma, id, existingSchool.banner)
      }

      res.json({ success: true, school: updated })
    } catch (err) {
      console.error('[schools] patch failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Failed to update institution' })
    }
  })

  /**
   * Super Admin only: Delete a school.
   * Safety guard: Institutions with a super_admin user cannot be deleted.
   */
  router.delete('/:id', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string

      // Prevent deletion of institutions linked to super_admin users
      const hasSuperAdmin = await prisma.user.findFirst({
        where: { schoolId: id, role: 'super_admin' },
      })
      if (hasSuperAdmin) {
        return res.status(403).json({ error: 'Super Admin institution cannot be deleted' })
      }

      // Delete all stored media objects for this school in R2 storage
      const mediaList = await prisma.mediaObject.findMany({
        where: { schoolId: id },
      }).catch(() => [])

      if (storage && mediaList.length > 0) {
        for (const m of mediaList) {
          await storage.delete(m.objectKey).catch(() => {})
        }
      }

      await prisma.$transaction(async (tx) => {
        // Cascade delete users and media belonging to this school (except super_admin)
        await tx.mediaObject.deleteMany({
          where: { schoolId: id },
        })
        await tx.session.deleteMany({
          where: { user: { schoolId: id, role: { not: 'super_admin' } } },
        })
        await tx.user.deleteMany({
          where: { schoolId: id, role: { not: 'super_admin' } },
        })
        await tx.school.delete({
          where: { id },
        })
      })
      res.json({ success: true })
    } catch (err) {
      console.error('[schools] delete failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
