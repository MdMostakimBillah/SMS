import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export interface BkashConfig {
  number: string
  type: 'personal' | 'merchant' | 'agent'
  qrCodeUrl?: string
  instructions: string
  instructionsBn: string
  active: boolean
}

export interface InstitutionPaymentRecord {
  id: string
  schoolId: string
  schoolName: string
  schoolSlug: string
  eiin?: string
  packageName: string
  amount: number
  months: number
  senderBkashNumber: string
  trxId: string
  paymentMethod: 'bkash'
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  notes?: string
}

const DEFAULT_BKASH_CONFIG: BkashConfig = {
  number: '01700-123456',
  type: 'merchant',
  instructions: 'Make payment via bKash App or dial *247#. Use your School EIIN/Slug as reference.',
  instructionsBn: 'বিকাশ অ্যাপ অথবা *২৪৭# ডায়াল করে পেমেন্ট সম্পন্ন করুন। রেফারেন্স হিসেবে স্কুলের EIIN বা কোড ব্যবহার করুন।',
  active: true,
}

export function institutionPaymentsRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * Helper: Get Bkash Config from SystemConfig
   */
  async function getBkashConfig(): Promise<BkashConfig> {
    try {
      const row = await prisma.systemConfig.findUnique({
        where: { key: 'super_admin_bkash_config' },
      })
      if (row?.value) {
        return { ...DEFAULT_BKASH_CONFIG, ...JSON.parse(row.value) }
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_BKASH_CONFIG
  }

  /**
   * Helper: Save Bkash Config to SystemConfig
   */
  async function saveBkashConfig(config: BkashConfig): Promise<void> {
    const json = JSON.stringify(config)
    await prisma.systemConfig.upsert({
      where: { key: 'super_admin_bkash_config' },
      create: { key: 'super_admin_bkash_config', value: json },
      update: { value: json },
    })
  }

  /**
   * Helper: Get All Payments from SystemConfig
   */
  async function getAllPayments(): Promise<InstitutionPaymentRecord[]> {
    try {
      const row = await prisma.systemConfig.findUnique({
        where: { key: 'institution_subscription_payments' },
      })
      if (row?.value) {
        const parsed = JSON.parse(row.value)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {
      // fallback
    }
    return []
  }

  /**
   * Helper: Save All Payments to SystemConfig
   */
  async function saveAllPayments(payments: InstitutionPaymentRecord[]): Promise<void> {
    const json = JSON.stringify(payments)
    await prisma.systemConfig.upsert({
      where: { key: 'institution_subscription_payments' },
      create: { key: 'institution_subscription_payments', value: json },
      update: { value: json },
    })
  }

  /**
   * GET /api/institution-payments/config
   * Returns current bKash receiving configuration
   */
  router.get('/config', optionalAuth(prisma, jwtSecret), async (_req: Request, res: Response) => {
    try {
      const config = await getBkashConfig()
      res.json({ config })
    } catch (err) {
      console.error('[institution-payments] get config error:', err instanceof Error ? err.message : err)
      res.json({ config: DEFAULT_BKASH_CONFIG })
    }
  })

  /**
   * PUT /api/institution-payments/config
   * Updates bKash receiving configuration (super_admin only)
   */
  router.put('/config', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.userRole !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can update payment configuration' })
      }
      const existing = await getBkashConfig()
      const updated: BkashConfig = {
        ...existing,
        ...req.body,
      }
      await saveBkashConfig(updated)
      res.json({ success: true, config: updated })
    } catch (err) {
      console.error('[institution-payments] update config error:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * GET /api/institution-payments
   * List payments: Super admin gets all, school gets their own.
   */
  router.get('/', optionalAuth(prisma, jwtSecret), async (req: Request, res: Response) => {
    try {
      const allPayments = await getAllPayments()
      const authReq = req as AuthenticatedRequest

      if (authReq.userRole === 'super_admin') {
        return res.json({ payments: allPayments })
      }

      // School context
      const targetSchool = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        domain: true,
        eiin: true,
      })

      if (!targetSchool) {
        return res.json({ payments: [] })
      }

      const schoolPayments = allPayments.filter(
        (p) => p.schoolId === targetSchool.id || p.schoolSlug === targetSchool.domain || (targetSchool.eiin && p.eiin === targetSchool.eiin)
      )

      res.json({ payments: schoolPayments })
    } catch (err) {
      console.error('[institution-payments] get payments error:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * POST /api/institution-payments
   * Submit a new payment verification for an institution
   */
  router.post('/', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        schoolId,
        schoolName,
        schoolSlug,
        eiin,
        packageName,
        amount,
        months,
        senderBkashNumber,
        trxId,
        notes,
      } = req.body

      if (!senderBkashNumber || !trxId || !amount) {
        return res.status(400).json({ error: 'Sender bKash number, TrxID, and amount are required' })
      }

      // Validate TrxID uniqueness among approved or pending payments
      const allPayments = await getAllPayments()
      const cleanTrxId = String(trxId).trim().toUpperCase()
      const cleanSender = String(senderBkashNumber).trim()

      const duplicate = allPayments.find(
        (p) => p.trxId.toUpperCase() === cleanTrxId && p.status !== 'rejected'
      )
      if (duplicate) {
        return res.status(400).json({ error: 'This Transaction ID (TrxID) has already been submitted' })
      }

      const newRecord: InstitutionPaymentRecord = {
        id: `PAY-BKASH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        schoolId: schoolId || req.schoolId || 'unknown-school',
        schoolName: schoolName || 'Institution',
        schoolSlug: schoolSlug || req.query.slug || 'school',
        eiin: eiin || undefined,
        packageName: packageName || 'Standard',
        amount: Number(amount) || 0,
        months: Number(months) || 1,
        senderBkashNumber: cleanSender,
        trxId: cleanTrxId,
        paymentMethod: 'bkash',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        notes: notes ? String(notes).trim() : undefined,
      }

      const updatedPayments = [newRecord, ...allPayments]
      await saveAllPayments(updatedPayments)

      res.status(201).json({
        success: true,
        payment: newRecord,
      })
    } catch (err) {
      console.error('[institution-payments] submit payment error:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * POST /api/institution-payments/:id/approve
   * Super Admin approves a payment: updates status & extends school subscription
   */
  router.post('/:id/approve', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.userRole !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can approve payments' })
      }

      const paymentId = req.params.id
      const allPayments = await getAllPayments()
      const index = allPayments.findIndex((p) => p.id === paymentId)

      if (index === -1) {
        return res.status(404).json({ error: 'Payment record not found' })
      }

      const payment = allPayments[index]
      if (payment.status === 'approved') {
        return res.status(400).json({ error: 'Payment is already approved' })
      }

      const reviewedAt = new Date().toISOString()
      const reviewedBy = req.userName || 'Super Admin'

      // Update payment record
      const updatedPayment: InstitutionPaymentRecord = {
        ...payment,
        status: 'approved',
        reviewedAt,
        reviewedBy,
        rejectionReason: undefined,
      }
      allPayments[index] = updatedPayment
      await saveAllPayments(allPayments)

      // Find and update the school's expiresAt and paymentStatus in database
      const school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: payment.schoolId },
            { domain: payment.schoolSlug },
            ...(payment.eiin ? [{ eiin: payment.eiin }] : []),
          ],
        },
      })

      let updatedSchool: any = null
      if (school) {
        const monthsToAdd = Math.max(1, payment.months || 1)
        const currentExpiry = school.expiresAt ? new Date(school.expiresAt) : new Date()
        const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
        const newExpiry = new Date(baseDate)
        newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd)

        // Generate approval notification for the school
        let existingNotifs: any[] = []
        try {
          if (school.notificationsData) {
            const raw = typeof school.notificationsData === 'string' ? JSON.parse(school.notificationsData) : school.notificationsData
            existingNotifs = Array.isArray(raw) ? raw : (Array.isArray(raw?.notifications) ? raw.notifications : [])
          }
        } catch { /* ignore */ }

        const approvalNotif = {
          id: `NTF-PAY-APPR-${Date.now()}`,
          title: `Subscription Payment Approved (৳${payment.amount})`,
          titleBn: `বিকাশ পেমেন্ট অনুমোদিত হয়েছে (৳${payment.amount})`,
          message: `Your payment of ৳${payment.amount} for ${payment.packageName} (${payment.months} month/s, TrxID: ${payment.trxId}) has been verified. Subscription extended until ${newExpiry.toLocaleDateString()}.`,
          messageBn: `আপনার ${payment.packageName} প্যাকেজের ৳${payment.amount} পেমেন্ট (TrxID: ${payment.trxId}) সফলভাবে অনুমোদিত হয়েছে। মেয়াদ বৃদ্ধি: ${newExpiry.toLocaleDateString()} পর্যন্ত।`,
          type: 'success',
          category: 'billing',
          link: '/settings?panel=subscription-payment',
          sender: 'Super Admin Billing Desk',
          senderRole: 'super_admin',
          read: false,
          createdAt: new Date().toISOString(),
        }

        const mergedNotifs = [approvalNotif, ...existingNotifs]

        updatedSchool = await prisma.school.update({
          where: { id: school.id },
          data: {
            expiresAt: newExpiry,
            paymentStatus: 'paid',
            plan: payment.packageName.toLowerCase(),
            notificationsData: JSON.stringify(mergedNotifs),
          },
        })
      }

      res.json({
        success: true,
        payment: updatedPayment,
        school: updatedSchool,
      })
    } catch (err) {
      console.error('[institution-payments] approve payment error:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * POST /api/institution-payments/:id/reject
   * Super Admin rejects a payment with reason
   */
  router.post('/:id/reject', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.userRole !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can reject payments' })
      }

      const paymentId = req.params.id
      const { reason } = req.body
      const allPayments = await getAllPayments()
      const index = allPayments.findIndex((p) => p.id === paymentId)

      if (index === -1) {
        return res.status(404).json({ error: 'Payment record not found' })
      }

      const payment = allPayments[index]
      const reviewedAt = new Date().toISOString()
      const reviewedBy = req.userName || 'Super Admin'
      const rejectionReason = reason || 'Transaction could not be verified'

      const updatedPayment: InstitutionPaymentRecord = {
        ...payment,
        status: 'rejected',
        reviewedAt,
        reviewedBy,
        rejectionReason,
      }
      allPayments[index] = updatedPayment
      await saveAllPayments(allPayments)

      // Notify the school of rejection
      const school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: payment.schoolId },
            { domain: payment.schoolSlug },
            ...(payment.eiin ? [{ eiin: payment.eiin }] : []),
          ],
        },
      })

      if (school) {
        let existingNotifs: any[] = []
        try {
          if (school.notificationsData) {
            const raw = typeof school.notificationsData === 'string' ? JSON.parse(school.notificationsData) : school.notificationsData
            existingNotifs = Array.isArray(raw) ? raw : (Array.isArray(raw?.notifications) ? raw.notifications : [])
          }
        } catch { /* ignore */ }

        const rejectionNotif = {
          id: `NTF-PAY-REJ-${Date.now()}`,
          title: `Payment Verification Rejected (TrxID: ${payment.trxId})`,
          titleBn: `পেমেন্ট যাচাই বাতিল হয়েছে (TrxID: ${payment.trxId})`,
          message: `Your payment submission of ৳${payment.amount} (TrxID: ${payment.trxId}) was rejected. Reason: ${rejectionReason}. Please re-check or contact support.`,
          messageBn: `আপনার ৳${payment.amount} এর পেমেন্ট (TrxID: ${payment.trxId}) যাচাই বাতিল হয়েছে। কারণ: ${rejectionReason}। অনুগ্রহ করে তথ্য পুনরায় পরীক্ষা করুন।`,
          type: 'error',
          category: 'billing',
          link: '/settings?panel=subscription-payment',
          sender: 'Super Admin Billing Desk',
          senderRole: 'super_admin',
          read: false,
          createdAt: new Date().toISOString(),
        }

        await prisma.school.update({
          where: { id: school.id },
          data: {
            notificationsData: JSON.stringify([rejectionNotif, ...existingNotifs]),
          },
        })
      }

      res.json({
        success: true,
        payment: updatedPayment,
      })
    } catch (err) {
      console.error('[institution-payments] reject payment error:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  return router
}
