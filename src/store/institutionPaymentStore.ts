import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  institutionPaymentsApi,
  type BkashConfig,
  type InstitutionPayment,
} from '@/lib/api'
import { useSuperAdminStore } from './superAdminStore'
import { useNotificationStore, notificationId } from './notificationStore'

export type { BkashConfig, InstitutionPayment }

const DEFAULT_BKASH_CONFIG: BkashConfig = {
  number: '01700-123456',
  type: 'merchant',
  instructions: 'Make payment via bKash App or dial *247#. Select Payment (or Send Money) and enter Reference.',
  instructionsBn: 'বিকাশ অ্যাপ অথবা *২৪৭# ডায়াল করে পেমেন্ট সম্পন্ন করুন। পেমেন্ট সিলেক্ট করে রেফারেন্সে স্কুলের নাম বা EIIN দিন।',
  active: true,
}

interface InstitutionPaymentState {
  bkashConfig: BkashConfig
  payments: InstitutionPayment[]
  isLoading: boolean
  serverSynced: boolean
  error: string | null

  fetchConfig: () => Promise<void>
  updateBkashConfig: (config: Partial<BkashConfig>) => Promise<void>
  syncFromServer: (slugOrId?: string) => Promise<void>
  submitPayment: (
    data: Omit<InstitutionPayment, 'id' | 'status' | 'submittedAt'>
  ) => Promise<InstitutionPayment>
  approvePayment: (paymentId: string, reviewedBy?: string) => Promise<void>
  rejectPayment: (paymentId: string, reason: string, reviewedBy?: string) => Promise<void>
}

export const useInstitutionPaymentStore = create<InstitutionPaymentState>()(
  persist(
    (set, get) => ({
      bkashConfig: DEFAULT_BKASH_CONFIG,
      payments: [],
      isLoading: false,
      serverSynced: false,
      error: null,

      fetchConfig: async () => {
        try {
          const res = await institutionPaymentsApi.getConfig()
          if (res?.config) {
            set({ bkashConfig: res.config })
          }
        } catch {
          // keep existing/default
        }
      },

      updateBkashConfig: async (configUpdates) => {
        const next = { ...get().bkashConfig, ...configUpdates }
        set({ bkashConfig: next })
        try {
          await institutionPaymentsApi.updateConfig(next)
        } catch {
          // fallback locally
        }
      },

      syncFromServer: async (slugOrId?: string) => {
        set({ isLoading: true, error: null })
        try {
          // Also fetch bkash config
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
        const newRecord: InstitutionPayment = {
          ...data,
          id: `PAY-BKASH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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

      approvePayment: async (paymentId: string, reviewedBy?: string) => {
        const state = get()
        const target = state.payments.find((p) => p.id === paymentId)
        if (!target) return

        const reviewedAt = new Date().toISOString()
        const reviewer = reviewedBy || 'Super Admin'

        // 1. Update local payment state
        const updatedPayment: InstitutionPayment = {
          ...target,
          status: 'approved',
          reviewedAt,
          reviewedBy: reviewer,
          rejectionReason: undefined,
        }

        set({
          payments: state.payments.map((p) => (p.id === paymentId ? updatedPayment : p)),
        })

        // 2. Extend institution expiry & set paid in superAdminStore
        try {
          const superAdminStore = useSuperAdminStore.getState()
          const inst = superAdminStore.institutions.find(
            (i) => i.id === target.schoolId || i.slug === target.schoolSlug || (target.eiin && i.eiin === target.eiin)
          )

          if (inst) {
            const monthsToAdd = Math.max(1, target.months || 1)
            const currentExpiry = inst.expiresAt ? new Date(inst.expiresAt) : new Date()
            const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
            const newExpiry = new Date(baseDate)
            newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd)

            superAdminStore.updateInstitution(inst.id, {
              expiresAt: newExpiry.toISOString(),
              status: 'active',
            })
          }
        } catch { /* ignore */ }

        // 3. Create approval notification for the institution
        try {
          const notifStore = useNotificationStore.getState()
          const approvalNotif = {
            id: notificationId(),
            title: `bKash Subscription Payment Approved (৳${target.amount})`,
            titleBn: `বিকাশ পেমেন্ট অনুমোদিত হয়েছে (৳${target.amount})`,
            message: `Your payment of ৳${target.amount} for ${target.packageName} (${target.months} month/s, TrxID: ${target.trxId}) has been verified. Subscription extended.`,
            messageBn: `আপনার ${target.packageName} প্যাকেজের ৳${target.amount} পেমেন্ট (TrxID: ${target.trxId}) সফলভাবে অনুমোদিত হয়েছে। মেয়াদ বৃদ্ধি সম্পন্ন।`,
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
          await institutionPaymentsApi.approve(paymentId)
        } catch { /* ignore */ }
      },

      rejectPayment: async (paymentId: string, reason: string, reviewedBy?: string) => {
        const state = get()
        const target = state.payments.find((p) => p.id === paymentId)
        if (!target) return

        const reviewedAt = new Date().toISOString()
        const reviewer = reviewedBy || 'Super Admin'

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
            title: `bKash Payment Verification Rejected (TrxID: ${target.trxId})`,
            titleBn: `বিকাশ পেমেন্ট যাচাই বাতিল (TrxID: ${target.trxId})`,
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
        bkashConfig: state.bkashConfig,
        payments: state.payments,
      }),
    }
  )
)
