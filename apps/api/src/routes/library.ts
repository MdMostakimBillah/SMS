import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function libraryRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/library
   * Fetch library records (books, categories, copies, borrowings, digital books, reading sessions, settings)
   */
  router.get('/', optionalAuth(prisma, jwtSecret), async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        libraryData: true,
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
          books: [],
          categories: [],
          copies: [],
          borrowings: [],
          digitalBooks: [],
          readingSessions: [],
          settings: null,
        })
      }

      let parsed: any = {}
      try {
        if ((school as any).libraryData) {
          parsed = typeof (school as any).libraryData === 'string'
            ? JSON.parse((school as any).libraryData)
            : (school as any).libraryData
        }
      } catch {
        parsed = {}
      }

      res.json({
        storageMode: school.storageMode,
        books: Array.isArray(parsed?.books) ? parsed.books : [],
        categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
        copies: Array.isArray(parsed?.copies) ? parsed.copies : [],
        borrowings: Array.isArray(parsed?.borrowings) ? parsed.borrowings : [],
        digitalBooks: Array.isArray(parsed?.digitalBooks) ? parsed.digitalBooks : [],
        readingSessions: Array.isArray(parsed?.readingSessions) ? parsed.readingSessions : [],
        settings: parsed?.settings && typeof parsed.settings === 'object' ? parsed.settings : null,
      })
    } catch (err) {
      console.error('[library] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/library
   * Save library records for the institution.
   */
  router.put(
    '/',
    requireAuth(prisma, jwtSecret),
    requireRole('school_admin', 'teacher', 'super_admin', 'staff', 'student'),
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
            libraryData: true,
          },
        })

        if (!school && req.schoolId) {
          school = await prisma.school.findUnique({
            where: { id: req.schoolId },
            select: {
              id: true,
              storageMode: true,
              libraryData: true,
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
            storageMode: 'local_computer',
            message: 'Saved to local computer only (offline mode active)',
          })
        }

        const body = req.body || {}
        const books = Array.isArray(body.books) ? body.books : []
        const categories = Array.isArray(body.categories) ? body.categories : []
        const copies = Array.isArray(body.copies) ? body.copies : []
        const borrowings = Array.isArray(body.borrowings) ? body.borrowings : []
        const digitalBooks = Array.isArray(body.digitalBooks) ? body.digitalBooks : []
        const readingSessions = Array.isArray(body.readingSessions) ? body.readingSessions : []
        const settings = body.settings && typeof body.settings === 'object' ? body.settings : undefined

        const totalItems = books.length + categories.length + copies.length + borrowings.length + digitalBooks.length + readingSessions.length
        if (totalItems > 50000) {
          return res.status(400).json({ error: 'Payload exceeds maximum limit of 50,000 library records' })
        }

        // Sanitize books
        const sanitizedBooks = books.map((b: any) => ({
          id: String(b.id || `LB-${Date.now()}`),
          title: String(b.title || ''),
          titleBn: String(b.titleBn || ''),
          author: String(b.author || ''),
          authorBn: String(b.authorBn || ''),
          isbn: String(b.isbn || ''),
          categoryId: String(b.categoryId || ''),
          shelf: String(b.shelf || ''),
          description: String(b.description || ''),
          descriptionBn: String(b.descriptionBn || ''),
          totalCopies: Number(b.totalCopies) || 0,
          availableCopies: Number(b.availableCopies) || 0,
          isDigital: Boolean(b.isDigital),
          coverUrl: String(b.coverUrl || ''),
          isActive: b.isActive !== false,
          createdAt: b.createdAt || new Date().toISOString(),
        }))

        // Sanitize categories
        const sanitizedCategories = categories.map((c: any) => ({
          id: String(c.id || `CAT-${Date.now()}`),
          name: String(c.name || ''),
          nameBn: String(c.nameBn || ''),
          description: String(c.description || ''),
          descriptionBn: String(c.descriptionBn || ''),
          isActive: c.isActive !== false,
          createdAt: c.createdAt || new Date().toISOString(),
        }))

        // Sanitize copies
        const sanitizedCopies = copies.map((cp: any) => ({
          id: String(cp.id || `BC-${Date.now()}`),
          bookId: String(cp.bookId || ''),
          copyNumber: Number(cp.copyNumber) || 1,
          barcode: String(cp.barcode || ''),
          condition: ['new', 'good', 'fair', 'worn', 'damaged'].includes(cp.condition) ? cp.condition : 'good',
          status: ['available', 'issued', 'lost', 'damaged'].includes(cp.status) ? cp.status : 'available',
          issuedTo: cp.issuedTo ? String(cp.issuedTo) : undefined,
          dueDate: cp.dueDate ? String(cp.dueDate) : undefined,
          isActive: cp.isActive !== false,
          createdAt: cp.createdAt || new Date().toISOString(),
        }))

        // Sanitize borrowings
        const sanitizedBorrowings = borrowings.map((br: any) => ({
          id: String(br.id || `BRW-${Date.now()}`),
          studentId: String(br.studentId || ''),
          bookId: String(br.bookId || ''),
          copyId: String(br.copyId || ''),
          issueDate: String(br.issueDate || ''),
          dueDate: String(br.dueDate || ''),
          returnDate: br.returnDate ? String(br.returnDate) : undefined,
          status: ['borrowed', 'returned', 'overdue', 'lost'].includes(br.status) ? br.status : 'borrowed',
          condition: ['new', 'good', 'fair', 'worn', 'damaged'].includes(br.condition) ? br.condition : 'good',
          fine: Number(br.fine) || 0,
          fineReason: String(br.fineReason || ''),
          renewalCount: Number(br.renewalCount) || 0,
          librarianNote: String(br.librarianNote || ''),
          issuedBy: String(br.issuedBy || ''),
          returnedBy: br.returnedBy ? String(br.returnedBy) : undefined,
          createdAt: br.createdAt || new Date().toISOString(),
        }))

        // Sanitize digitalBooks
        const sanitizedDigitalBooks = digitalBooks.map((db: any) => ({
          id: String(db.id || `DB-${Date.now()}`),
          bookId: String(db.bookId || ''),
          fileUrl: String(db.fileUrl || ''),
          totalPages: Number(db.totalPages) || 0,
          isActive: db.isActive !== false,
          createdAt: db.createdAt || new Date().toISOString(),
          chapters: Array.isArray(db.chapters)
            ? db.chapters.map((ch: any) => ({
                title: String(ch.title || ''),
                titleBn: String(ch.titleBn || ''),
                content: String(ch.content || ''),
                contentBn: String(ch.contentBn || ''),
              }))
            : [],
        }))

        // Sanitize readingSessions
        const sanitizedReadingSessions = readingSessions.map((rs: any) => ({
          id: String(rs.id || `RS-${Date.now()}`),
          studentId: String(rs.studentId || ''),
          digitalBookId: String(rs.digitalBookId || ''),
          currentPage: Number(rs.currentPage) || 0,
          currentChapter: Number(rs.currentChapter) || 0,
          progress: Number(rs.progress) || 0,
          totalTime: Number(rs.totalTime) || 0,
          isCompleted: Boolean(rs.isCompleted),
          bookmarks: Array.isArray(rs.bookmarks)
            ? rs.bookmarks.map((bm: any) => ({
                page: Number(bm.page) || 0,
                label: String(bm.label || ''),
                createdAt: bm.createdAt || new Date().toISOString(),
              }))
            : [],
          lastRead: String(rs.lastRead || ''),
          createdAt: rs.createdAt || new Date().toISOString(),
        }))

        const payloadToSave: any = {
          books: sanitizedBooks,
          categories: sanitizedCategories,
          copies: sanitizedCopies,
          borrowings: sanitizedBorrowings,
          digitalBooks: sanitizedDigitalBooks,
          readingSessions: sanitizedReadingSessions,
        }
        if (settings) {
          payloadToSave.settings = settings
        }

        await prisma.school.update({
          where: { id: school.id },
          data: {
            libraryData: JSON.stringify(payloadToSave),
          },
        })

        res.json({
          success: true,
          storageMode: school.storageMode,
          counts: {
            books: sanitizedBooks.length,
            categories: sanitizedCategories.length,
            copies: sanitizedCopies.length,
            borrowings: sanitizedBorrowings.length,
            digitalBooks: sanitizedDigitalBooks.length,
            readingSessions: sanitizedReadingSessions.length,
          },
        })
      } catch (err) {
        console.error('[library] PUT failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  return router
}
