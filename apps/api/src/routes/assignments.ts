import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function assignmentsRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/assignments
   * Fetch assignments and submissions for the active institution.
   */
  router.get('/', optionalAuth(prisma, jwtSecret), async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        assignmentsData: true,
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
          assignments: [],
          submissions: [],
        })
      }

      let parsedAssignments: any = {}
      try {
        if ((school as any).assignmentsData) {
          parsedAssignments = typeof (school as any).assignmentsData === 'string'
            ? JSON.parse((school as any).assignmentsData)
            : (school as any).assignmentsData
        }
      } catch {
        parsedAssignments = {}
      }

      const assignments = Array.isArray(parsedAssignments?.assignments)
        ? parsedAssignments.assignments
        : (Array.isArray(parsedAssignments) ? parsedAssignments : [])
      const submissions = Array.isArray(parsedAssignments?.submissions)
        ? parsedAssignments.submissions
        : []

      res.json({
        assignments,
        submissions,
      })
    } catch (err) {
      console.error('[assignments] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/assignments
   * Save assignments and submissions for the institution.
   * School admins, teachers, and super admins can manage assignments.
   * Students can update submissions.
   */
  router.put(
    '/',
    requireAuth(prisma, jwtSecret),
    requireRole('school_admin', 'teacher', 'super_admin', 'student', 'hr_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
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

        let school = await prisma.school.findFirst({
          where: {
            OR: [{ id: targetSchoolId }, { domain: targetSchoolId }],
          },
          select: {
            id: true,
            storageMode: true,
            assignmentsData: true,
          },
        })

        if (!school && req.schoolId) {
          school = await prisma.school.findUnique({
            where: { id: req.schoolId },
            select: {
              id: true,
              storageMode: true,
              assignmentsData: true,
            },
          })
        }

        if (!school) {
          return res.status(404).json({ error: 'Institution not found' })
        }

        if (req.userRole !== 'super_admin' && req.schoolId !== school.id) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        if (school.storageMode === 'local_computer') {
          return res.json({
            success: true,
            count: Array.isArray(req.body.assignments) ? req.body.assignments.length : 0,
            storageMode: 'local_computer',
            message: 'Saved to local computer only (offline mode active)',
          })
        }

        let existingData: any = {}
        try {
          if ((school as any).assignmentsData) {
            existingData = typeof (school as any).assignmentsData === 'string'
              ? JSON.parse((school as any).assignmentsData)
              : (school as any).assignmentsData
          }
        } catch {
          existingData = {}
        }

        const rawAssignments = req.body.assignments !== undefined
          ? (Array.isArray(req.body.assignments) ? req.body.assignments : (Array.isArray(req.body) ? req.body : null))
          : (existingData.assignments || [])

        if (rawAssignments && rawAssignments.length > 5000) {
          return res.status(400).json({ error: 'Payload exceeds maximum limit of 5,000 assignments' })
        }

        const rawSubmissions = req.body.submissions !== undefined
          ? (Array.isArray(req.body.submissions) ? req.body.submissions : null)
          : (existingData.submissions || [])

        if (rawSubmissions && rawSubmissions.length > 50000) {
          return res.status(400).json({ error: 'Payload exceeds maximum limit of 50,000 submissions' })
        }

        let sanitizedAssignments = existingData.assignments || []
        if (req.userRole !== 'student') {
          if (rawAssignments) {
            sanitizedAssignments = rawAssignments.map((a: any) => ({
              id: String(a.id || `ASN-${Date.now()}`),
              type: a.type === 'homework' ? 'homework' : 'assignment',
              title: String(a.title || ''),
              titleBn: String(a.titleBn || ''),
              description: String(a.description || ''),
              descriptionBn: String(a.descriptionBn || ''),
              subjectId: String(a.subjectId || ''),
              classId: String(a.classId || ''),
              sectionId: String(a.sectionId || ''),
              teacherId: String(a.teacherId || ''),
              dueDate: String(a.dueDate || ''),
              maxMarks: Number(a.maxMarks) || 0,
              status: ['active', 'draft', 'closed', 'archived'].includes(a.status) ? a.status : 'active',
              attachments: Array.isArray(a.attachments) ? a.attachments.map(String).slice(0, 20) : [],
              createdAt: a.createdAt || new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            }))
          }
        }

        let sanitizedSubmissions = existingData.submissions || []
        if (rawSubmissions) {
          sanitizedSubmissions = rawSubmissions.map((s: any) => ({
            id: String(s.id || `SUB-${Date.now()}`),
            assignmentId: String(s.assignmentId || ''),
            studentId: String(s.studentId || ''),
            studentName: String(s.studentName || ''),
            studentNameBn: String(s.studentNameBn || ''),
            submittedAt: String(s.submittedAt || new Date().toISOString()),
            fileUrl: String(s.fileUrl || ''),
            marks: s.marks !== null && s.marks !== undefined && s.marks !== '' ? Number(s.marks) : null,
            feedback: String(s.feedback || ''),
            feedbackBn: String(s.feedbackBn || ''),
            status: ['submitted', 'reviewed', 'returned', 'late'].includes(s.status) ? s.status : 'submitted',
            createdAt: s.createdAt || new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          }))
        }

        const payload = {
          assignments: sanitizedAssignments,
          submissions: sanitizedSubmissions,
          updatedAt: new Date().toISOString(),
          updatedBy: req.userRole || 'admin',
        }

        await prisma.school.update({
          where: { id: school.id },
          data: {
            assignmentsData: JSON.stringify(payload),
          } as any,
        })

        res.json({
          success: true,
          count: sanitizedAssignments.length,
          submissionsCount: sanitizedSubmissions.length,
        })
      } catch (err) {
        console.error('[assignments] PUT failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  return router
}
