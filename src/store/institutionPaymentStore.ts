import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  institutionPaymentsApi,
  type BkashConfig,
  type GatewayAccountConfig,
  type BankAccountConfig,
  type PaymentGatewaysConfig,
  type PaymentMethodType,
  type InstitutionPayment,
} from '@/lib/api'
import { useSuperAdminStore } from './superAdminStore'
import { useNotificationStore, notificationId } from './notificationStore'

export type {
  BkashConfig,
  GatewayAccountConfig,
  BankAccountConfig,
  PaymentGatewaysConfig,
  PaymentMethodType,
  InstitutionPayment,
}

export const DEFAULT_GATEWAYS_CONFIG: PaymentGatewaysConfig = {
  bkash: {
    number: '01700-123456',
    type: 'merchant',
    instructions: 'Make payment via bKash App or dial *247#. Select Payment (or Send Money) and enter Reference.',
    instructionsBn: 'বিকাশ অ্যাপ অথবা *২৪৭# ডায়াল করে পেমেন্ট সম্পন্ন করুন। পেমেন্ট সিলেক্ট করে রেফারেন্সে স্কুলের নাম বা EIIN দিন।',
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
    instructions: 'Make payment via Rocket App or dial *322#. Enter 12-digit Mobile Account with Reference.',
    instructionsBn: 'রকেট অ্যাপ অথবা *৩২২# ডায়াল করে ১২ ডিজিটের অ্যাকাউন্ট নম্বরে পেমেন্ট সম্পন্ন করুন।',
    active: true,
  },
  upay: {
    number: '01600-123456',
    type: 'merchant',
    instructions: 'Make payment via Upay App or dial *268#. Select Payment and enter Reference.',
    instructionsBn: 'উপায় অ্যাপ অথবা *২৬৮# ডায়াল করে পেমেন্ট অপশন নির্বাচন করে পেমেন্ট সম্পন্ন করুন।',
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

interface InstitutionPaymentState {
  gatewaysConfig: PaymentGatewaysConfig
  bkashConfig: BkashConfig
  payments: InstitutionPayment[]
  isLoading: boolean
  serverSynced: boolean
  error: string | null

  fetchConfig: () => Promise<void>
  updateGatewaysConfig: (gateways: Partial<PaymentGatewaysConfig>) => Promise<void>
  updateBkashConfig: (config: Partial<BkashConfig>) => Promise<void>
  syncFromServer: (slugOrId?: string) => Promise<void>
  submitPayment: (
    data: Omit<InstitutionPayment, 'id' | 'status' | 'submittedAt'>
  ) => Promise<InstitutionPayment>
  approvePayment: (
    paymentId: string,
    reviewedBy?: string,
    packageOverride?: { packageName?: string; months?: number }
  ) => Promise<void>
  rejectPayment: (paymentId: string, reason: string, reviewedBy?: string) => Promise<void>
}

export const useInstitutionPaymentStore = create<InstitutionPaymentState>()(
  persist(
    (set, get) => ({
      gatewaysConfig: DEFAULT_GATEWAYS_CONFIG,
      bkashConfig: DEFAULT_BKASH_CONFIG,
      payments: [],
      isLoading: false,
      serverSynced: false,
      error: null,

      fetchConfig: async () => {
        try {
          const res = await institutionPaymentsApi.getConfig()
          if (res?.gateways) {
            set({
              gatewaysConfig: { ...DEFAULT_GATEWAYS_CONFIG, ...res.gateways },
              bkashConfig: res.gateways.bkash || res.config || DEFAULT_BKASH_CONFIG,
            })
          } else if (res?.config) {
            set((state) => ({
              bkashConfig: res.config,
              gatewaysConfig: {
                ...state.gatewaysConfig,
                bkash: res.config,
              },
            }))
          }
        } catch {
          // keep existing/default
        }
      },

      updateGatewaysConfig: async (gatewaysUpdates) => {
        const next = {
          ...get().gatewaysConfig,
          ...gatewaysUpdates,
        }
        set({
          gatewaysConfig: next,
          bkashConfig: next.bkash || get().bkashConfig,
        })
        try {
          await institutionPaymentsApi.updateGatewaysConfig(next)
        } catch {
          // fallback locally
        }
      },

      updateBkashConfig: async (configUpdates) => {
        const nextBkash = { ...get().bkashConfig, ...configUpdates }
        const nextGateways = {
          ...get().gatewaysConfig,
          bkash: nextBkash,
        }
        set({
          bkashConfig: nextBkash,
          gatewaysConfig: nextGateways,
        })
        try {
          await institutionPaymentsApi.updateConfig(nextBkash)
        } catch {
          // fallback locally
        }
      },

      syncFromServer: async (slugOrId?: string) => {
        set({ isLoading: true, error: null })
        try {
          // Also fetch payment gateways config
          void get().fetchConfig()

          const res = await institutionPaymentsApi.getAll(slugOrId)
          if (res?.payments) {
            // Merge with local payments keeping newest
            const serverList = res.payments
            const localList = get().payments
            const mergedMap = new Map<string, InstitutionPayment>()

            // Local first
            for (const p of localList) {
              mergedMap.set(p.id, p)
            }
            // Server overwrites
            for (const p of serverList) {
              mergedMap.set(p.id, p)
            }

            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            )

            set({
              payments: merged,
              isLoading: false,
              serverSynced: true,
            })
            return
          }
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to sync payments',
          })
        }
        set({ isLoading: false })
      },

      submitPayment: async (data) => {
        const senderNum = data.senderNumber || data.senderBkashNumber || ''
        const method = data.paymentMethod || 'bkash'
        const newRecord: InstitutionPayment = {
          ...data,
          paymentMethod: method,
          senderNumber: senderNum,
          senderBkashNumber: senderNum,
          id: `PAY-${method.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        }

        // Add to local state immediately
        set((state) => ({
          payments: [newRecord, ...state.payments],
        }))

        // Push to server API
        try {
          const res = await institutionPaymentsApi.submit(newRecord)
          if (res?.payment) {
            set((state) => ({
              payments: state.payments.map((p) => (p.id === newRecord.id ? res.payment : p)),
            }))
            return res.payment
          }
        } catch {
          // local record persists
        }

        return newRecord
      },

      approvePayment: async (paymentId: string, reviewedBy?: string, packageOverride?: { packageName?: string; months?: number }) => {
        const state = get()
        const target = state.payments.find((p) => p.id === paymentId)
        if (!target) return

        const reviewedAt = new Date().toISOString()
        const reviewer = reviewedBy || 'Super Admin'
        const finalPackageName = packageOverride?.packageName || target.packageName || 'Standard'
        const finalMonths = Number(packageOverride?.months) || target.months || 1

        // 1. Update local payment state
        const updatedPayment: InstitutionPayment = {
          ...target,
          packageName: finalPackageName,
          months: finalMonths,
          status: 'approved',
          reviewedAt,
          reviewedBy: reviewer,
          rejectionReason: undefined,
        }

        set({
          payments: state.payments.map((p) => (p.id === paymentId ? updatedPayment : p)),
        })

        // 2. Extend institution expiry, set package & set active status in superAdminStore
        let expiryDateStr = ''
        try {
          const superAdminStore = useSuperAdminStore.getState()
          const inst = superAdminStore.institutions.find(
            (i) => i.id === target.schoolId || i.slug === target.schoolSlug || (target.eiin && i.eiin === target.eiin)
          )

          if (inst) {
            const monthsToAdd = Math.max(1, finalMonths)
            const currentExpiry = inst.expiresAt ? new Date(inst.expiresAt) : new Date()
            const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
            const newExpiry = new Date(baseDate)
            newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd)
            expiryDateStr = newExpiry.toLocaleDateString()

            // Find matching package or construct updated package
            const matchedPkg = superAdminStore.packages.find(
              (p) => p.name.toLowerCase() === finalPackageName.toLowerCase()
            ) || {
              ...inst.package,
              name: finalPackageName,
            }

            superAdminStore.updateInstitution(inst.id, {
              package: matchedPkg,
              expiresAt: newExpiry.toISOString(),
              status: 'active',
            })
          }
        } catch { /* ignore */ }

        // 3. Create approval notification for the institution
        try {
          const notifStore = useNotificationStore.getState()
          const gatewayName = target.paymentMethod ? target.paymentMethod.toUpperCase() : 'bKash'
          const approvalNotif = {
            id: notificationId(),
            title: `${gatewayName} Subscription Payment Approved (৳${target.amount})`,
            titleBn: `${gatewayName} পেমেন্ট অনুমোদিত হয়েছে (৳${target.amount})`,
            message: `Your payment of ৳${target.amount} for package "${finalPackageName}" (${finalMonths} month/s, TrxID: ${target.trxId}) has been verified. Subscription extended${expiryDateStr ? ` until ${expiryDateStr}` : ''}.`,
            messageBn: `আপনার "${finalPackageName}" প্যাকেজের ৳${target.amount} পেমেন্ট (TrxID: ${target.trxId}) সফলভাবে অনুমোদিত হয়েছে। মেয়াদ বৃদ্ধি সম্পন্ন${expiryDateStr ? ` (${expiryDateStr} পর্যন্ত)` : ''}।`,
            type: 'success' as const,
            category: 'billing' as const,
            link: '/settings?panel=subscription-payment',
            sender: 'Super Admin Billing Desk',
            senderRole: 'super_admin',
            read: false,
            createdAt: new Date().toISOString(),
          }
          notifStore.addNotification(approvalNotif)
        } catch { /* ignore */ }

        // 4. Call server API
        try {
          await institutionPaymentsApi.approve(paymentId, packageOverride)
        } catch { /* ignore */ }
      },

      rejectPayment: async (paymentId: string, reason: string, reviewedBy?: string) => {
        const state = get()
        const target = state.payments.find((p) => p.id === paymentId)
        if (!target) return

        const reviewedAt = new Date().toISOString()
        const reviewer = reviewedBy || 'Super Admin'
        const gatewayName = target.paymentMethod ? target.paymentMethod.toUpperCase() : 'bKash'

        const updatedPayment: InstitutionPayment = {
          ...target,
          status: 'rejected',
          reviewedAt,
          reviewedBy: reviewer,
          rejectionReason: reason || 'Transaction could not be verified',
        }

        set({
          payments: state.payments.map((p) => (p.id === paymentId ? updatedPayment : p)),
        })

        // Create rejection notification
        try {
          const notifStore = useNotificationStore.getState()
          const rejNotif = {
            id: notificationId(),
            title: `${gatewayName} Payment Verification Rejected (TrxID: ${target.trxId})`,
            titleBn: `${gatewayName} পেমেন্ট যাচাই বাতিল (TrxID: ${target.trxId})`,
            message: `Your payment submission of ৳${target.amount} (TrxID: ${target.trxId}) was rejected. Reason: ${reason}. Please verify your details.`,
            messageBn: `আপনার ৳${target.amount} পেমেন্ট (TrxID: ${target.trxId}) বাতিল হয়েছে। কারণ: ${reason}। তথ্য যাচাই করে পুনরায় চেষ্টা করুন।`,
            type: 'error' as const,
            category: 'billing' as const,
            link: '/settings?panel=subscription-payment',
            sender: 'Super Admin Billing Desk',
            senderRole: 'super_admin',
            read: false,
            createdAt: new Date().toISOString(),
          }
          notifStore.addNotification(rejNotif)
        } catch { /* ignore */ }

        // Call server API
        try {
          await institutionPaymentsApi.reject(paymentId, reason)
        } catch { /* ignore */ }
      },
    }),
    {
      name: 'edutech_institution_payments',
      partialize: (state) => ({
        gatewaysConfig: state.gatewaysConfig,
        bkashConfig: state.bkashConfig,
        payments: state.payments,
      }),
    }
  )
)
