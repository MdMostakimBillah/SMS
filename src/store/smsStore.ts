import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dispatchSMS, type SMSGatewayOptions, type SendSMSResult } from '@/lib/smsGateway'

export type { SMSGatewayOptions, SendSMSResult }

export interface SMSPurchaseRecord {
  id: string
  provider: string
  quantity: number
  unitPrice: number
  totalCost: number
  refId: string
  purchasedAt: string
  notes?: string
}

export interface SMSAllocationRecord {
  id: string
  institutionId: string
  institutionName: string
  amount: number
  type: 'credit' | 'debit'
  note?: string
  allocatedAt: string
  adminUser?: string
}

export interface SMSDispatchLog {
  id: string
  institutionId: string
  institutionName: string
  phone: string
  message: string
  type: 'fee' | 'exam' | 'manual' | 'test'
  status: 'sent' | 'delivered' | 'failed'
  costUnits: number
  sentAt: string
  providerResponse?: string
  error?: string
}

export interface InstitutionSMSBalance {
  allocated: number
  used: number
  remaining: number
}

export interface SMSStoreState {
  masterPool: {
    totalPurchased: number
    totalAllocated: number
    totalUsed: number
  }
  gatewayConfig: SMSGatewayOptions
  purchases: SMSPurchaseRecord[]
  allocations: SMSAllocationRecord[]
  institutionBalances: Record<string, InstitutionSMSBalance>
  dispatchLogs: SMSDispatchLog[]

  // Actions
  buySMS: (data: {
    quantity: number
    totalCost: number
    provider: string
    refId?: string
    notes?: string
  }) => SMSPurchaseRecord

  allocateSMS: (data: {
    institutionId: string
    institutionName: string
    amount: number
    type?: 'credit' | 'debit'
    note?: string
    adminUser?: string
  }) => { success: boolean; error?: string }

  deductSMS: (institutionId: string, count?: number) => boolean

  getInstitutionBalance: (institutionId: string) => InstitutionSMSBalance

  updateGatewayConfig: (config: Partial<SMSGatewayOptions>) => void

  sendSMS: (params: {
    institutionId: string
    institutionName: string
    phone: string
    message: string
    type: 'fee' | 'exam' | 'manual' | 'test'
  }) => Promise<SendSMSResult>

  clearLogs: () => void
}

const DEFAULT_GATEWAY: SMSGatewayOptions = {
  providerName: 'SIM SMS Provider (Bangladesh)',
  providerType: 'sim_gateway',
  apiUrl: '',
  apiKey: '',
  senderId: 'EduTech',
  isActive: true,
}

const INITIAL_PURCHASES: SMSPurchaseRecord[] = [
  {
    id: 'BUY-2026-001',
    provider: 'Grameenphone / Robi SIM Gateway',
    quantity: 50000,
    unitPrice: 0.35,
    totalCost: 17500,
    refId: 'SIM-GP-883921',
    purchasedAt: '2026-02-15T10:00:00.000Z',
    notes: 'Initial Bulk SIM SMS Pool purchase for multi-institution distribution',
  },
]

const INITIAL_ALLOCATIONS: SMSAllocationRecord[] = [
  {
    id: 'ALC-001',
    institutionId: 'inst-default',
    institutionName: 'Dhaka Ideal School & College',
    amount: 5000,
    type: 'credit',
    note: 'Semester SMS Allocation',
    allocatedAt: '2026-02-20T12:00:00.000Z',
    adminUser: 'Super Admin',
  },
  {
    id: 'ALC-002',
    institutionId: 'inst-udvash',
    institutionName: 'Udvash Academic & Admission Care',
    amount: 10000,
    type: 'credit',
    note: 'Annual Package SMS Allocation',
    allocatedAt: '2026-03-01T14:30:00.000Z',
    adminUser: 'Super Admin',
  },
]

const INITIAL_BALANCES: Record<string, InstitutionSMSBalance> = {
  'inst-default': { allocated: 5000, used: 340, remaining: 4660 },
  'inst-udvash': { allocated: 10000, used: 1250, remaining: 8750 },
}

export const useSmsStore = create<SMSStoreState>()(
  persist(
    (set, get) => ({
      masterPool: {
        totalPurchased: 50000,
        totalAllocated: 15000,
        totalUsed: 1590,
      },
      gatewayConfig: DEFAULT_GATEWAY,
      purchases: INITIAL_PURCHASES,
      allocations: INITIAL_ALLOCATIONS,
      institutionBalances: INITIAL_BALANCES,
      dispatchLogs: [
        {
          id: 'LOG-001',
          institutionId: 'inst-default',
          institutionName: 'Dhaka Ideal School & College',
          phone: '01712345678',
          message: 'Fee Payment Confirmation: 2,500 BDT received for March 2026. Receipt: RN-9821. Thank you.',
          type: 'fee',
          status: 'delivered',
          costUnits: 1,
          sentAt: '2026-03-10T11:20:00.000Z',
          providerResponse: 'Delivered via SIM SMS Provider',
        },
        {
          id: 'LOG-002',
          institutionId: 'inst-udvash',
          institutionName: 'Udvash Academic & Admission Care',
          phone: '01898765432',
          message: 'Exam Result Notice: First Terminal Exam results published. GPA: 5.00, Grade: A+.',
          type: 'exam',
          status: 'delivered',
          costUnits: 1,
          sentAt: '2026-03-11T09:15:00.000Z',
          providerResponse: 'Delivered via SIM SMS Provider',
        },
      ],

      buySMS: ({ quantity, totalCost, provider, refId, notes }) => {
        const unitPrice = quantity > 0 ? Number((totalCost / quantity).toFixed(3)) : 0
        const newPurchase: SMSPurchaseRecord = {
          id: `BUY-${Date.now()}`,
          provider,
          quantity,
          unitPrice,
          totalCost,
          refId: refId || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
          purchasedAt: new Date().toISOString(),
          notes,
        }

        set((state) => ({
          purchases: [newPurchase, ...state.purchases],
          masterPool: {
            ...state.masterPool,
            totalPurchased: state.masterPool.totalPurchased + quantity,
          },
        }))

        return newPurchase
      },

      allocateSMS: ({ institutionId, institutionName, amount, type = 'credit', note, adminUser }) => {
        const state = get()
        const availableMaster = state.masterPool.totalPurchased - state.masterPool.totalAllocated

        if (type === 'credit' && amount > availableMaster) {
          return {
            success: false,
            error: `Insufficient master SMS pool balance. Available to allocate: ${availableMaster.toLocaleString()} SMS`,
          }
        }

        const currentBal = state.institutionBalances[institutionId] || { allocated: 0, used: 0, remaining: 0 }
        let newAllocated = currentBal.allocated
        let newRemaining = currentBal.remaining

        if (type === 'credit') {
          newAllocated += amount
          newRemaining += amount
        } else {
          // Debit / Adjust down
          newAllocated = Math.max(currentBal.used, newAllocated - amount)
          newRemaining = Math.max(0, newRemaining - amount)
        }

        const newAllocationRecord: SMSAllocationRecord = {
          id: `ALC-${Date.now()}`,
          institutionId,
          institutionName,
          amount,
          type,
          note: note || (type === 'credit' ? 'SMS Credit Recharge' : 'SMS Balance Adjustment'),
          allocatedAt: new Date().toISOString(),
          adminUser: adminUser || 'Super Admin',
        }

        const masterAllocDelta = type === 'credit' ? amount : -amount

        set({
          allocations: [newAllocationRecord, ...state.allocations],
          institutionBalances: {
            ...state.institutionBalances,
            [institutionId]: {
              allocated: newAllocated,
              used: currentBal.used,
              remaining: newRemaining,
            },
          },
          masterPool: {
            ...state.masterPool,
            totalAllocated: Math.max(0, state.masterPool.totalAllocated + masterAllocDelta),
          },
        })

        return { success: true }
      },

      deductSMS: (institutionId, count = 1) => {
        const state = get()
        const currentBal = state.institutionBalances[institutionId] || { allocated: 0, used: 0, remaining: 0 }

        if (currentBal.remaining < count) {
          return false
        }

        set({
          institutionBalances: {
            ...state.institutionBalances,
            [institutionId]: {
              ...currentBal,
              used: currentBal.used + count,
              remaining: currentBal.remaining - count,
            },
          },
          masterPool: {
            ...state.masterPool,
            totalUsed: state.masterPool.totalUsed + count,
          },
        })

        return true
      },

      getInstitutionBalance: (institutionId) => {
        const state = get()
        return (
          state.institutionBalances[institutionId] || {
            allocated: 0,
            used: 0,
            remaining: 0,
          }
        )
      },

      updateGatewayConfig: (config) => {
        set((state) => ({
          gatewayConfig: { ...state.gatewayConfig, ...config },
        }))
      },

      sendSMS: async ({ institutionId, institutionName, phone, message, type }) => {
        const state = get()
        const isTest = type === 'test' || institutionId.startsWith('super-admin')
        const currentBal = state.getInstitutionBalance(institutionId)

        // Check if institution has SMS credits remaining (test SMS from Super Admin bypasses tenant allocation)
        if (!isTest && currentBal.remaining <= 0) {
          const failedResult: SendSMSResult = {
            success: false,
            messageId: `FAIL-${Date.now()}`,
            status: 'failed',
            error: 'Institution SMS credit exhausted. Please contact Super Admin to recharge.',
          }

          const logEntry: SMSDispatchLog = {
            id: failedResult.messageId,
            institutionId,
            institutionName,
            phone,
            message,
            type,
            status: 'failed',
            costUnits: 0,
            sentAt: new Date().toISOString(),
            error: failedResult.error,
          }

          set((s) => ({ dispatchLogs: [logEntry, ...s.dispatchLogs] }))
          return failedResult
        }

        // Dispatch via configured SMS Gateway
        const result = await dispatchSMS({
          phone,
          message,
          gateway: state.gatewayConfig,
        })

        if (result.success) {
          if (!isTest) {
            // Deduct 1 unit from institution balance
            state.deductSMS(institutionId, 1)
          } else {
            // Increment master pool usage for super-admin test SMS
            set((s) => ({
              masterPool: {
                ...s.masterPool,
                totalUsed: s.masterPool.totalUsed + 1,
              },
            }))
          }
        }

        const logEntry: SMSDispatchLog = {
          id: result.messageId,
          institutionId,
          institutionName,
          phone,
          message,
          type,
          status: result.status,
          costUnits: result.success ? 1 : 0,
          sentAt: new Date().toISOString(),
          providerResponse: result.providerResponse,
          error: result.error,
        }

        set((s) => ({ dispatchLogs: [logEntry, ...s.dispatchLogs] }))
        return result
      },

      clearLogs: () => set({ dispatchLogs: [] }),
    }),
    {
      name: 'edutech_sms_store',
    }
  )
)
