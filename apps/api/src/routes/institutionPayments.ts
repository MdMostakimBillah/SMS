import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export type PaymentMethodType = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank'

export interface GatewayAccountConfig {
  number: string
  type: 'personal' | 'merchant' | 'agent'
  qrCodeUrl?: string
  instructions: string
  instructionsBn: string
  active: boolean
}

export interface BankAccountConfig {
  bankName: string
  accountName: string
  accountNumber: string
  branch: string
  routingNumber?: string
  instructions: string
  instructionsBn: string
  active: boolean
}

export interface PaymentGatewaysConfig {
  bkash: GatewayAccountConfig
  nagad: GatewayAccountConfig
  rocket: GatewayAccountConfig
  upay: GatewayAccountConfig
  bank: BankAccountConfig
}

export type BkashConfig = GatewayAccountConfig

export interface InstitutionPaymentRecord {
  id: string
  schoolId: string
  schoolName: string
  schoolSlug: string
  eiin?: string
  packageName: string
  packageId?: string
  amount: number
  months: number
  senderNumber: string
  senderBkashNumber: string // alias for backward compatibility
  trxId: string
  paymentMethod: PaymentMethodType
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  notes?: string
}

export const DEFAULT_GATEWAYS_CONFIG: PaymentGatewaysConfig = {
  bkash: {
    number: '01700-123456',
    type: 'merchant',
    instructions: 'Make payment via bKash App or dial *247#. Select Payment (or Send Money) and enter Reference.',
    instructionsBn: 'বিকাশ অ্যাপ অথবা *২৪৭# ডায়াল করে পেমেন্ট করুন। পেমেন্ট সিলেক্ট করে রেফারেন্সে প্রতিষ্ঠানের নাম বা EIIN দিন।',
    active: true,
  },
  nagad: {
    number: '01800-123456',
    type: 'merchant',
    instructions: 'Make payment via Nagad App or dial *167#. Select Merchant Payment (or Send Money) with Reference.',
    instructionsBn: 'নগদ অ্যাপ অথবা *১৬৭# ডায়াল করে পেমেন্ট সম্পন্ন করুন। রেফারেন্সে স্কুলের কোড বা EIIN দিন।',
    active: true,
  },
  rocket: {
    number: '01900-123456-7',
    type: 'merchant',
    instructions: 'Make payment via Rocket App or dial *322#. Enter Biller ID or 12-digit Mobile Account with Reference.',
    instructionsBn: 'রকেট অ্যাপ অথবা *৩২২# ডায়াল করে ১২ ডিজিটের অ্যাকাউন্ট নম্বরে পেমেন্ট সম্পন্ন করুন।',
    active: true,
  },
  upay: {
    number: '01600-123456',
    type: 'merchant',
    instructions: 'Make payment via Upay App or dial *268#. Select Payment and enter Reference.',
    instructionsBn: 'উপায় অ্যাপ অথবা *২৬৮# ডায়াল করে পেমেন্ট অপশন নির্বাচন করে পেমেন্ট করুন।',
    active: true,
  },
  bank: {
    bankName: 'Dutch-Bangla Bank PLC',
    accountName: 'EduTech Pro BD Ltd.',
    accountNumber: '123-151-0009876',
    branch: 'Gulshan Branch, Dhaka',
    routingNumber: '090261234',
    instructions: 'Deposit or transfer (NPSB/BEFTN) to the bank account. Use School EIIN/Slug in the transfer remark.',
    instructionsBn: 'ব্যাংক শাখায় জমা বা NPSB/BEFTN/অনলাইন ব্যাংকিংয়ের মাধ্যমে ট্রান্সফার করুন। রিমার্কে প্রতিষ্ঠানের নাম দিন।',
    active: true,
  },
}

const DEFAULT_BKASH_CONFIG: BkashConfig = DEFAULT_GATEWAYS_CONFIG.bkash

export function institutionPaymentsRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * Helper: Get All Gateways Config from SystemConfig
   */
  async function getGatewaysConfig(): Promise<PaymentGatewaysConfig> {
    try {
      const row = await prisma.systemConfig.findUnique({
        where: { key: 'super_admin_payment_gateways_config' },
      })
      if (row?.value) {
        const parsed = JSON.parse(row.value)
        return {
          bkash: { ...DEFAULT_GATEWAYS_CONFIG.bkash, ...(parsed.bkash || {}) },
          nagad: { ...DEFAULT_GATEWAYS_CONFIG.nagad, ...(parsed.nagad || {}) },
          rocket: { ...DEFAULT_GATEWAYS_CONFIG.rocket, ...(parsed.rocket || {}) },
          upay: { ...DEFAULT_GATEWAYS_CONFIG.upay, ...(parsed.upay || {}) },
          bank: { ...DEFAULT_GATEWAYS_CONFIG.bank, ...(parsed.bank || {}) },
        }
      }

      // Check legacy bKash row if gateways key doesn't exist yet
      const bkashRow = await prisma.systemConfig.findUnique({
        where: { key: 'super_admin_bkash_config' },
      })
      if (bkashRow?.value) {
        return {
          ...DEFAULT_GATEWAYS_CONFIG,
          bkash: { ...DEFAULT_GATEWAYS_CONFIG.bkash, ...JSON.parse(bkashRow.value) },
        }
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_GATEWAYS_CONFIG
  }

  /**
   * Helper: Save Gateways Config to SystemConfig
   */
  async function saveGatewaysConfig(gateways: PaymentGatewaysConfig): Promise<void> {
    const json = JSON.stringify(gateways)
    await prisma.systemConfig.upsert({
      where: { key: 'super_admin_payment_gateways_config' },
      create: { key: 'super_admin_payment_gateways_config', value: json },
      update: { value: json },
    })

    // Also sync bkash for backward compatibility
    if (gateways.bkash) {
      const bkashJson = JSON.stringify(gateways.bkash)
      await prisma.systemConfig.upsert({
        where: { key: 'super_admin_bkash_config' },
        create: { key: 'super_admin_bkash_config', value: bkashJson },
        update: { value: bkashJson },
      })
    }
  }

  /**
   * Helper: Get Bkash Config from SystemConfig (backward compat)
   */
  async function getBkashConfig(): Promise<BkashConfig> {
    const gateways = await getGatewaysConfig()
    return gateways.bkash
  }

  /**
   * Helper: Save Bkash Config to SystemConfig (backward compat)
   */
  async function saveBkashConfig(config: BkashConfig): Promise<void> {
    const gateways = await getGatewaysConfig()
    gateways.bkash = { ...gateways.bkash, ...config }
    await saveGatewaysConfig(gateways)
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
   * Returns current receiving configuration for all gateways & bKash
   */
  router.get('/config', optionalAuth(prisma, jwtSecret), async (_req: Request, res: Response) => {
    try {
      const gateways = await getGatewaysConfig()
      res.json({
        gateways,
        config: gateways.bkash,
      })
    } catch (err) {
      console.error('[institution-payments] get config error:', err instanceof Error ? err.message : err)
      res.json({
        gateways: DEFAULT_GATEWAYS_CONFIG,
        config: DEFAULT_GATEWAYS_CONFIG.bkash,
      })
    }
  })

  /**
   * PUT /api/institution-payments/config
   * Updates payment gateway receiving configuration (super_admin only)
   */
  router.put('/config', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.userRole !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can update payment configuration' })
      }
      const existing = await getGatewaysConfig()

      let updated: PaymentGatewaysConfig
      if (req.body.gateways) {
        updated = {
          bkash: { ...existing.bkash, ...(req.body.gateways.bkash || {}) },
          nagad: { ...existing.nagad, ...(req.body.gateways.nagad || {}) },
          rocket: { ...existing.rocket, ...(req.body.gateways.rocket || {}) },
          upay: { ...existing.upay, ...(req.body.gateways.upay || {}) },
          bank: { ...existing.bank, ...(req.body.gateways.bank || {}) },
        }
      } else {
        // Direct partial bkash updates or single gateway updates
        updated = {
          ...existing,
          bkash: { ...existing.bkash, ...req.body },
        }
      }

      await saveGatewaysConfig(updated)
      res.json({
        success: true,
        gateways: updated,
        config: updated.bkash,
      })
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
        packageId,
        amount,
        months,
        senderNumber,
        senderBkashNumber,
        trxId,
        paymentMethod = 'bkash',
        notes,
      } = req.body

      const rawSender = senderNumber || senderBkashNumber
      if (!rawSender || !trxId || !amount) {
        return res.status(400).json({ error: 'Sender number/account, TrxID, and amount are required' })
      }

      // Validate TrxID uniqueness among approved or pending payments
      const allPayments = await getAllPayments()
      const cleanTrxId = String(trxId).trim().toUpperCase()
      const cleanSender = String(rawSender).trim()

      const duplicate = allPayments.find(
        (p) => p.trxId.toUpperCase() === cleanTrxId && p.status !== 'rejected'
      )
      if (duplicate) {
        return res.status(400).json({ error: 'This Transaction ID (TrxID) has already been submitted' })
      }

      const method = (['bkash', 'nagad', 'rocket', 'upay', 'bank'].includes(paymentMethod)
        ? paymentMethod
        : 'bkash') as PaymentMethodType

      const newRecord: InstitutionPaymentRecord = {
        id: `PAY-${method.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        schoolId: schoolId || req.schoolId || 'unknown-school',
        schoolName: schoolName || 'Institution',
        schoolSlug: schoolSlug || req.query.slug || 'school',
        eiin: eiin || undefined,
        packageName: packageName || 'Standard',
        packageId: packageId || undefined,
        amount: Number(amount) || 0,
        months: Number(months) || 1,
        senderNumber: cleanSender,
        senderBkashNumber: cleanSender,
        trxId: cleanTrxId,
        paymentMethod: method,
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
   * Super Admin approves a payment: updates status, applies package, & extends subscription
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

      const { packageName: overridePackage, months: overrideMonths } = req.body || {}
      const finalPackageName = overridePackage || payment.packageName || 'Standard'
      const finalMonths = Number(overrideMonths) || payment.months || 1

      const reviewedAt = new Date().toISOString()
      const reviewedBy = req.userName || 'Super Admin'

      // Update payment record
      const updatedPayment: InstitutionPaymentRecord = {
        ...payment,
        packageName: finalPackageName,
        months: finalMonths,
        status: 'approved',
        reviewedAt,
        reviewedBy,
        rejectionReason: undefined,
      }
      allPayments[index] = updatedPayment
      await saveAllPayments(allPayments)

      // Find and update the school's expiresAt, plan, and paymentStatus in database
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
        const monthsToAdd = Math.max(1, finalMonths)
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

        const gatewayLabel = payment.paymentMethod.toUpperCase()
        const approvalNotif = {
          id: `NTF-PAY-APPR-${Date.now()}`,
          title: `${gatewayLabel} Subscription Payment Approved (৳${payment.amount})`,
          titleBn: `${gatewayLabel} সাবস্ক্রিপশন পেমেন্ট অনুমোদিত হয়েছে (৳${payment.amount})`,
          message: `Your payment of ৳${payment.amount} for package "${finalPackageName}" (${finalMonths} month/s, TrxID: ${payment.trxId}) has been verified. Subscription extended until ${newExpiry.toLocaleDateString()}.`,
          messageBn: `আপনার "${finalPackageName}" প্যাকেজের ৳${payment.amount} পেমেন্ট (TrxID: ${payment.trxId}) সফলভাবে অনুমোদিত হয়েছে। মেয়াদ বৃদ্ধি: ${newExpiry.toLocaleDateString()} পর্যন্ত।`,
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
            plan: finalPackageName.toLowerCase(),
            status: 'active',
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
