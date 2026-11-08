import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function syllabusRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/syllabus
   * Fetch syllabus records for the institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        syllabusData: true,
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
          syllabi: [],
        })
      }

      let parsedSyllabus: any = {}
      try {
        if ((school as any).syllabusData) {
          parsedSyllabus = typeof (school as any).syllabusData === 'string'
            ? JSON.parse((school as any).syllabusData)
            : (school as any).syllabusData
        }
      } catch {
        parsedSyllabus = {}
      }

      res.json({
        syllabi: Array.isArray(parsedSyllabus?.syllabi) ? parsedSyllabus.syllabi : (Array.isArray(parsedSyllabus) ? parsedSyllabus : []),
      })
    } catch (err) {
      console.error('[syllabus] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/syllabus
   * Save syllabus records for the institution.
   * School admins, teachers, and super admins are allowed.
   */
  router.put('/', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'teacher', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
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
          syllabusData: true,
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
          count: Array.isArray(req.body.syllabi) ? req.body.syllabi.length : 0,
          storageMode: 'local_computer',
          message: 'Saved to local computer only (offline mode active)',
        })
      }

      const syllabi = Array.isArray(req.body.syllabi)
        ? req.body.syllabi
        : (Array.isArray(req.body) ? req.body : null)

      if (!syllabi) {
        return res.status(400).json({ error: 'Invalid syllabus payload. Must provide syllabi array.' })
      }

      if (syllabi.length > 5000) {
        return res.status(400).json({ error: 'Payload exceeds maximum limit of 5,000 syllabi' })
      }

      // Sanitize syllabus payload items
      const sanitizedSyllabi = syllabi.map((s: any) => ({
        id: String(s.id || `SYL-${Date.now()}`),
        classId: String(s.classId || ''),
        sectionId: String(s.sectionId || ''),
        subjectId: String(s.subjectId || ''),
        sessionId: String(s.sessionId || ''),
        totalChapters: Number(s.totalChapters) || (Array.isArray(s.chapters) ? s.chapters.length : 0),
        totalTopics: Number(s.totalTopics) || 0,
        completedTopics: Number(s.completedTopics) || 0,
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: Array.isArray(s.chapters)
          ? s.chapters.map((ch: any, idx: number) => ({
              id: String(ch.id || `CH-${Date.now()}-${idx}`),
              title: String(ch.title || ''),
              titleBn: String(ch.titleBn || ''),
              description: String(ch.description || ''),
              descriptionBn: String(ch.descriptionBn || ''),
              order: Number(ch.order) || (idx + 1),
              langMode: ch.langMode === 'en' || ch.langMode === 'bn' ? ch.langMode : 'both',
              topics: Array.isArray(ch.topics)
                ? ch.topics.map((tp: any, tIdx: number) => ({
                    id: String(tp.id || `TP-${Date.now()}-${tIdx}`),
                    title: String(tp.title || ''),
                    titleBn: String(tp.titleBn || ''),
                    description: String(tp.description || ''),
                    descriptionBn: String(tp.descriptionBn || ''),
                    marks: Number(tp.marks) || 0,
                    status: tp.status === 'in-progress' || tp.status === 'completed' ? tp.status : 'pending',
                    weekNo: tp.weekNo ? Number(tp.weekNo) : undefined,
                    startDate: tp.startDate || undefined,
                    endDate: tp.endDate || undefined,
                  }))
                : [],
            }))
          : [],
      }))

      const payload = {
        syllabi: sanitizedSyllabi,
        updatedAt: new Date().toISOString(),
        updatedBy: req.userRole || 'admin',
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          syllabusData: JSON.stringify(payload),
        },
      })

      res.json({
        success: true,
        count: sanitizedSyllabi.length,
      })
    } catch (err) {
      console.error('[syllabus] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
