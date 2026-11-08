import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function examsRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/exams
   * Fetch examination configurations, schedules, marks, and result configs for the institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        examsData: true,
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
          examConfigs: [],
          subjectMarkConfigs: [],
          studentMarks: [],
          routines: [],
          rooms: [],
          seatPlans: [],
          invigilators: [],
          attendances: [],
          omrConfigs: [],
          extraMarks: [],
          extraMarkTypes: [],
          marksheetConfigs: [],
          generalAbilities: [],
          gradeScales: [],
          workingDays: [],
          promotions: [],
          cumulativeSheets: [],
          marksEntryStatuses: [],
          omrTemplates: [],
          markAdjustments: [],
        })
      }

      let parsedExams: any = {}
      try {
        if ((school as any).examsData) {
          parsedExams = typeof (school as any).examsData === 'string'
            ? JSON.parse((school as any).examsData)
            : (school as any).examsData
        }
      } catch {
        parsedExams = {}
      }

      res.json({
        examConfigs: Array.isArray(parsedExams?.examConfigs) ? parsedExams.examConfigs : [],
        subjectMarkConfigs: Array.isArray(parsedExams?.subjectMarkConfigs) ? parsedExams.subjectMarkConfigs : [],
        studentMarks: Array.isArray(parsedExams?.studentMarks) ? parsedExams.studentMarks : [],
        routines: Array.isArray(parsedExams?.routines) ? parsedExams.routines : [],
        rooms: Array.isArray(parsedExams?.rooms) ? parsedExams.rooms : [],
        seatPlans: Array.isArray(parsedExams?.seatPlans) ? parsedExams.seatPlans : [],
        invigilators: Array.isArray(parsedExams?.invigilators) ? parsedExams.invigilators : [],
        attendances: Array.isArray(parsedExams?.attendances) ? parsedExams.attendances : [],
        omrConfigs: Array.isArray(parsedExams?.omrConfigs) ? parsedExams.omrConfigs : [],
        extraMarks: Array.isArray(parsedExams?.extraMarks) ? parsedExams.extraMarks : [],
        extraMarkTypes: Array.isArray(parsedExams?.extraMarkTypes) ? parsedExams.extraMarkTypes : [],
        marksheetConfigs: Array.isArray(parsedExams?.marksheetConfigs) ? parsedExams.marksheetConfigs : [],
        generalAbilities: Array.isArray(parsedExams?.generalAbilities) ? parsedExams.generalAbilities : [],
        gradeScales: Array.isArray(parsedExams?.gradeScales) ? parsedExams.gradeScales : [],
        workingDays: Array.isArray(parsedExams?.workingDays) ? parsedExams.workingDays : [],
        promotions: Array.isArray(parsedExams?.promotions) ? parsedExams.promotions : [],
        cumulativeSheets: Array.isArray(parsedExams?.cumulativeSheets) ? parsedExams.cumulativeSheets : [],
        marksEntryStatuses: Array.isArray(parsedExams?.marksEntryStatuses) ? parsedExams.marksEntryStatuses : [],
        omrTemplates: Array.isArray(parsedExams?.omrTemplates) ? parsedExams.omrTemplates : [],
        markAdjustments: Array.isArray(parsedExams?.markAdjustments) ? parsedExams.markAdjustments : [],
      })
    } catch (err) {
      console.error('[exams] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/exams
   * Save examination configurations, marks, routines, and results for the institution.
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
          examsData: true,
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
          message: 'Local computer storage: Examination records stored locally on PC.',
          examConfigs: [],
          subjectMarkConfigs: [],
          studentMarks: [],
          routines: [],
          rooms: [],
          seatPlans: [],
          invigilators: [],
          attendances: [],
          omrConfigs: [],
          extraMarks: [],
          extraMarkTypes: [],
          marksheetConfigs: [],
          generalAbilities: [],
          gradeScales: [],
          workingDays: [],
          promotions: [],
          cumulativeSheets: [],
          marksEntryStatuses: [],
          omrTemplates: [],
          markAdjustments: [],
        })
      }

      let existingExams: any = {}
      try {
        if ((school as any).examsData) {
          existingExams = typeof (school as any).examsData === 'string'
            ? JSON.parse((school as any).examsData)
            : (school as any).examsData
        }
      } catch {
        existingExams = {}
      }

      const sanitizeArray = (val: any) => {
        if (!Array.isArray(val)) return undefined
        return val.slice(0, 50000)
      }

      const updatedExams = {
        examConfigs: req.body.examConfigs !== undefined ? (sanitizeArray(req.body.examConfigs) ?? existingExams.examConfigs ?? []) : (existingExams.examConfigs || []),
        subjectMarkConfigs: req.body.subjectMarkConfigs !== undefined ? (sanitizeArray(req.body.subjectMarkConfigs) ?? existingExams.subjectMarkConfigs ?? []) : (existingExams.subjectMarkConfigs || []),
        studentMarks: req.body.studentMarks !== undefined ? (sanitizeArray(req.body.studentMarks) ?? existingExams.studentMarks ?? []) : (existingExams.studentMarks || []),
        routines: req.body.routines !== undefined ? (sanitizeArray(req.body.routines) ?? existingExams.routines ?? []) : (existingExams.routines || []),
        rooms: req.body.rooms !== undefined ? (sanitizeArray(req.body.rooms) ?? existingExams.rooms ?? []) : (existingExams.rooms || []),
        seatPlans: req.body.seatPlans !== undefined ? (sanitizeArray(req.body.seatPlans) ?? existingExams.seatPlans ?? []) : (existingExams.seatPlans || []),
        invigilators: req.body.invigilators !== undefined ? (sanitizeArray(req.body.invigilators) ?? existingExams.invigilators ?? []) : (existingExams.invigilators || []),
        attendances: req.body.attendances !== undefined ? (sanitizeArray(req.body.attendances) ?? existingExams.attendances ?? []) : (existingExams.attendances || []),
        omrConfigs: req.body.omrConfigs !== undefined ? (sanitizeArray(req.body.omrConfigs) ?? existingExams.omrConfigs ?? []) : (existingExams.omrConfigs || []),
        extraMarks: req.body.extraMarks !== undefined ? (sanitizeArray(req.body.extraMarks) ?? existingExams.extraMarks ?? []) : (existingExams.extraMarks || []),
        extraMarkTypes: req.body.extraMarkTypes !== undefined ? (sanitizeArray(req.body.extraMarkTypes) ?? existingExams.extraMarkTypes ?? []) : (existingExams.extraMarkTypes || []),
        marksheetConfigs: req.body.marksheetConfigs !== undefined ? (sanitizeArray(req.body.marksheetConfigs) ?? existingExams.marksheetConfigs ?? []) : (existingExams.marksheetConfigs || []),
        generalAbilities: req.body.generalAbilities !== undefined ? (sanitizeArray(req.body.generalAbilities) ?? existingExams.generalAbilities ?? []) : (existingExams.generalAbilities || []),
        gradeScales: req.body.gradeScales !== undefined ? (sanitizeArray(req.body.gradeScales) ?? existingExams.gradeScales ?? []) : (existingExams.gradeScales || []),
        workingDays: req.body.workingDays !== undefined ? (sanitizeArray(req.body.workingDays) ?? existingExams.workingDays ?? []) : (existingExams.workingDays || []),
        promotions: req.body.promotions !== undefined ? (sanitizeArray(req.body.promotions) ?? existingExams.promotions ?? []) : (existingExams.promotions || []),
        cumulativeSheets: req.body.cumulativeSheets !== undefined ? (sanitizeArray(req.body.cumulativeSheets) ?? existingExams.cumulativeSheets ?? []) : (existingExams.cumulativeSheets || []),
        marksEntryStatuses: req.body.marksEntryStatuses !== undefined ? (sanitizeArray(req.body.marksEntryStatuses) ?? existingExams.marksEntryStatuses ?? []) : (existingExams.marksEntryStatuses || []),
        omrTemplates: req.body.omrTemplates !== undefined ? (sanitizeArray(req.body.omrTemplates) ?? existingExams.omrTemplates ?? []) : (existingExams.omrTemplates || []),
        markAdjustments: req.body.markAdjustments !== undefined ? (sanitizeArray(req.body.markAdjustments) ?? existingExams.markAdjustments ?? []) : (existingExams.markAdjustments || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          examsData: JSON.stringify(updatedExams),
        } as any,
      })

      res.json({
        success: true,
        ...updatedExams,
      })
    } catch (err) {
      console.error('[exams] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
