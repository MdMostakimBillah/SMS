import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { MediaStorage } from '../storage.js'
import { uploadBase64Media, deletePreviousMedia } from '../lib/media-helper.js'
import { audit } from '../audit.js'
import { authPool } from '../lib/better-auth.js'

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
        classesData: true,
        routinesData: true,
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
        classesData: true,
        routinesData: true,
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
   * School lookup by domain / slug / id.
   * Matches /:slug
   *
   * Full internal metadata (storage mode, server URL, billing/plan details,
   * media usage) is only returned to the school's own members or a
   * super_admin. Everyone else (anonymous or another tenant) receives the
   * same sanitized public view as /public/:slug.
   */
  router.get('/:slug', optionalAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawSlug = req.params.slug
      if (rawSlug === 'public') {
        return res.status(400).json({ error: 'Slug is required' })
      }

      const isSuper = req.userRole === 'super_admin'
      const fullSchool = isSuper || req.schoolId ? await resolveSchool(rawSlug) : null
      // Full internal metadata only for super_admin or the school's own members.
      if (fullSchool && (isSuper || fullSchool.id === req.schoolId)) {
        const usage = await prisma.mediaObject?.aggregate({
          where: { schoolId: fullSchool.id, deletedAt: null },
          _sum: { sizeBytes: true },
          _count: { id: true },
        }).catch(() => null)
        const schoolWithStorage = {
          ...fullSchool,
          storageBytes: usage?._sum?.sizeBytes || 0,
          mediaCount: usage?._count?.id || 0,
        }
        return res.json(formatSchoolResponse(schoolWithStorage))
      }

      const publicSchool = await resolvePublicSchool(rawSlug)
      if (!publicSchool) {
        return res.status(404).json({ error: 'Institution not found', school: null })
      }
      res.json(formatSchoolResponse(publicSchool))
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
        select: {
          id: true,
          storageMode: true,
          logo: true,
          banner: true,
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
        classes,
        classesData,
        routines,
        routinesData,
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
      if (classes !== undefined || classesData !== undefined) {
        const val = classes !== undefined ? classes : classesData
        dataToUpdate.classesData = typeof val === 'object' ? JSON.stringify(val) : String(val)
      }
      if (routines !== undefined || routinesData !== undefined) {
        const val = routines !== undefined ? routines : routinesData
        dataToUpdate.routinesData = typeof val === 'object' ? JSON.stringify(val) : String(val)
      }

      // Institution logo and banner remain available on the server for institution identification and branding
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
      console.error('[schools] patch failed:', err instanceof Error ? err.stack || err.message : err)
      const details = err instanceof Error ? err.message : undefined
      res.status(500).json({ error: 'Failed to update institution', ...(details ? { details } : {}) })
    }
  })

  /**
   * Super Admin only: Delete any school.
   * Unlinks any super_admin users linked to this school so platform super admins
   * are preserved and never locked out. Permanently deletes school records,
   * associated non-super_admin accounts, sessions, and storage objects.
   */
  router.delete('/:id', requireAuth(prisma, jwtSecret), requireRole('super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawTarget = req.params.id as string
      if (!rawTarget) {
        return res.status(400).json({ error: 'School ID or domain is required' })
      }
      const target = rawTarget.trim()

      const school = await prisma.school.findFirst({
        where: {
          OR: [{ id: target }, { domain: target.toLowerCase() }],
        },
        select: { id: true, name: true, domain: true },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }
      const schoolId = school.id

      // Delete all stored media objects for this school in storage (R2/S3/local)
      const mediaList = await prisma.mediaObject.findMany({
        where: { schoolId },
      }).catch(() => [])

      if (storage && mediaList.length > 0) {
        for (const m of mediaList) {
          await storage.delete(m.objectKey).catch(() => {})
        }
      }

      // Collect non-super_admin users to clean up from neon_auth if present
      const nonSuperAdminUsers = await prisma.user.findMany({
        where: { schoolId, role: { not: 'super_admin' } },
        select: { id: true, email: true },
      }).catch(() => [])

      await prisma.$transaction(async (tx) => {
        // 1. Unlink any super_admin users from this school so platform super admins
        //    are preserved and never lose access or get deleted
        await tx.user.updateMany({
          where: { schoolId, role: 'super_admin' },
          data: { schoolId: null },
        })

        // 2. Cascade delete school records
        await tx.mediaObject.deleteMany({
          where: { schoolId },
        })
        await tx.notice.deleteMany({
          where: { schoolId },
        })
        await tx.noticeCategory.deleteMany({
          where: { schoolId },
        })
        await tx.student.deleteMany({
          where: { schoolId },
        })
        await tx.teacher.deleteMany({
          where: { schoolId },
        })
        await tx.subject.deleteMany({
          where: { schoolId },
        })
        await tx.department.deleteMany({
          where: { schoolId },
        })
        await tx.designation.deleteMany({
          where: { schoolId },
        })

        // 3. Delete sessions and accounts of non-super_admin users belonging to this school
        await tx.session.deleteMany({
          where: { user: { schoolId, role: { not: 'super_admin' } } },
        })
        await tx.user.deleteMany({
          where: { schoolId, role: { not: 'super_admin' } },
        })

        // 4. Finally delete the school itself
        await tx.school.delete({
          where: { id: schoolId },
        })
      })

      // Clean up neon_auth users if neon_auth exists
      if (nonSuperAdminUsers.length > 0) {
        const userIds = nonSuperAdminUsers.map((u) => u.id)
        const userEmails = nonSuperAdminUsers.map((u) => u.email)
        try {
          await authPool.query(
            `DELETE FROM neon_auth.user WHERE id = ANY($1::uuid[]) OR email = ANY($2::text[])`,
            [userIds, userEmails]
          )
        } catch {
          // neon_auth schema may not exist in test/local environments
        }
      }

      // Audit the deletion
      audit({
        action: 'school.delete',
        actorId: req.userId,
        actorRole: req.userRole,
        schoolId,
        resourceId: schoolId,
        outcome: 'success',
        detail: { schoolName: school.name, domain: school.domain || null },
      })

      res.json({ success: true, id: schoolId, name: school.name })
    } catch (err) {
      console.error('[schools] delete failed:', err instanceof Error ? err.stack || err.message : err)
      const details = err instanceof Error ? err.message : undefined
      res.status(500).json({ error: 'Internal server error', ...(details ? { details } : {}) })
    }
  })

  return router
}
