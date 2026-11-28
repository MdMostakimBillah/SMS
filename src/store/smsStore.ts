import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { smsApi, type SmsSchoolSummary } from '@/lib/api'
import {
  calculateSmsSegments,
  DEFAULT_PROVIDER_URLS_MAP,
} from './smsDefaults'
import type { SMSGatewayOptions, SendSMSResult } from '@/lib/smsGateway'

export type { SMSGatewayOptions, SendSMSResult, SmsSchoolSummary }

export interface SMSPurchaseRecord {
  id: string
  provider: string
  quantity: number
  unitPrice: number
  totalCost: number
  refId: string
  purchasedAt: string
  notes?: string | null
}

export interface SMSAllocationRecord {
  id: string
  institutionId: string
  institutionName: string
  amount: number
  type: 'credit' | 'debit'
  note?: string | null
  allocatedAt: string
  adminUser?: string | null
}

export interface SMSDispatchLog {
  id: string
  institutionId: string
  institutionName: string
  phone: string
  message: string
  type: 'fee' | 'exam' | 'attendance' | 'admission' | 'manual' | 'broadcast' | 'test'
  status: 'sent' | 'delivered' | 'failed'
  costUnits: number
  sentAt: string
  providerResponse?: string | null
  error?: string | null
}

export interface InstitutionSMSBalance {
  allocated: number
  used: number
  remaining: number
}

export const DEFAULT_INSTITUTION_BALANCE: InstitutionSMSBalance = Object.freeze({
  allocated: 0,
  used: 0,
  remaining: 0,
})

const EMPTY_MASTER_POOL = Object.freeze({
  totalPurchased: 0,
  totalAllocated: 0,
  totalUsed: 0,
  available: 0,
})

const DEFAULT_GATEWAY: SMSGatewayOptions = {
  providerName: 'BulkSMSBD (Bangladesh)',
  providerType: 'bulksmsbd',
  apiUrl: DEFAULT_PROVIDER_URLS_MAP.bulksmsbd,
  senderId: '',
  username: '',
  isActive: false,
  hasApiKey: false,
  maskedApiKey: '',
  hasPassword: false,
}

export interface SMSStoreState {
  masterPool: {
    totalPurchased: number
    totalAllocated: number
    totalUsed: number
    available: number
  }
  gatewayConfig: SMSGatewayOptions
  gatewayConfigured: boolean
  schools: SmsSchoolSummary[]
  purchases: SMSPurchaseRecord[]
  allocations: SMSAllocationRecord[]
  institutionBalances: Record<string, InstitutionSMSBalance>
  dispatchLogs: SMSDispatchLog[]
  loadingOverview: boolean
  lastSyncError: string | null

  fetchSuperAdminOverview: () => Promise<void>
  fetchInstitutionBalance: (schoolIdOrSlug?: string) => Promise<InstitutionSMSBalance | null>

  buySMS: (data: {
    quantity: number
    totalCost: number
    provider: string
    refId?: string
    notes?: string
  }) => Promise<SMSPurchaseRecord>

  allocateSMS: (data: {
    institutionId: string
    institutionName: string
    amount: number
    type?: 'credit' | 'debit'
    note?: string
    adminUser?: string
  }) => Promise<{ success: boolean; error?: string }>

  distributeToAll: (data: {
    mode: 'per_school' | 'split_total'
    amount: number
    schoolIds?: string[]
    onlyActive?: boolean
    note?: string
  }) => Promise<{ success: boolean; distributedCount?: number; totalDistributed?: number; error?: string }>

  broadcastSMS: (data: {
    recipients?: string[]
    schoolIds?: string[]
    allSchools?: boolean
    message: string
    triggerType?: 'broadcast' | 'test'
  }) => Promise<{
    success: boolean
    sentCount?: number
    failedCount?: number
    skippedCount?: number
    error?: string
  }>

  checkProviderBalance: () => Promise<{
    success: boolean
    balanceText?: string
    balanceNumeric?: number | null
    error?: string
  }>

  deductSMS: (institutionId: string, count?: number) => boolean
  getInstitutionBalance: (institutionId?: string) => InstitutionSMSBalance

  updateGatewayConfig: (config: Partial<SMSGatewayOptions> & { clearApiKey?: boolean }) => Promise<{
    success: boolean
    error?: string
  }>

  sendSMS: (params: {
    institutionId: string
    institutionName: string
    phone: string
    message: string
    type: 'fee' | 'exam' | 'attendance' | 'admission' | 'manual' | 'test'
  }) => Promise<SendSMSResult>

  sendBulkSMS: (params: {
    institutionId: string
    institutionName: string
    phones: string[]
    message: string
    type: 'fee' | 'exam' | 'attendance' | 'admission' | 'manual'
  }) => Promise<{ success: boolean; sentCount: number; failedCount: number; error?: string }>

  clearLogs: () => void
}

export const useSmsStore = create<SMSStoreState>()(
  persist(
    (set, get) => ({
      // Zero hardcoded demo data — hydrated strictly from live PostgreSQL API
      masterPool: { ...EMPTY_MASTER_POOL },
      gatewayConfig: { ...DEFAULT_GATEWAY },
      gatewayConfigured: false,
      schools: [],
      purchases: [],
      allocations: [],
      institutionBalances: {},
      dispatchLogs: [],
      loadingOverview: false,
      lastSyncError: null,

      fetchSuperAdminOverview: async () => {
        set({ loadingOverview: true, lastSyncError: null })
        try {
          const data = await smsApi.getSuperAdminOverview()
          const nextBalances: Record<string, InstitutionSMSBalance> = {}
          for (const s of data.schools || []) {
            nextBalances[s.id] = s.balance
            if (s.slug && s.slug !== s.id) {
              nextBalances[s.slug] = s.balance
            }
          }

          set({
            masterPool: data.masterPool || { ...EMPTY_MASTER_POOL },
            gatewayConfig: {
              ...DEFAULT_GATEWAY,
              ...data.gatewayConfig,
            },
            gatewayConfigured: Boolean(
              data.gatewayConfig?.isActive &&
                (data.gatewayConfig?.hasApiKey ||
                  data.gatewayConfig?.providerType === 'custom' ||
                  data.gatewayConfig?.providerType === 'sim_gateway')
            ),
            schools: data.schools || [],
            purchases: data.purchases || [],
            allocations: (data.allocations || []).map((a) => ({
              id: a.id,
              institutionId: a.schoolId,
              institutionName: a.schoolName,
              amount: a.amount,
              type: a.type,
              note: a.note,
              allocatedAt: a.allocatedAt,
              adminUser: a.allocatedBy || 'Super Admin',
            })),
            institutionBalances: nextBalances,
            dispatchLogs: (data.dispatchLogs || []).map((l) => ({
              id: l.id,
              institutionId: l.schoolId || 'super-admin',
              institutionName: l.schoolName,
              phone: l.phone,
              message: l.message,
              type: l.triggerType,
              status: l.status,
              costUnits: l.segments,
              sentAt: l.sentAt,
              providerResponse: l.providerResponse,
              error: l.error,
            })),
            loadingOverview: false,
          })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to load SMS overview'
          set({ loadingOverview: false, lastSyncError: msg })
        }
      },

      fetchInstitutionBalance: async (schoolIdOrSlug) => {
        try {
          const res = await smsApi.getBalance(schoolIdOrSlug)
          const bal = res.balance || { ...DEFAULT_INSTITUTION_BALANCE }
          set((state) => ({
            gatewayConfigured: Boolean(res.gatewayConfigured),
            institutionBalances: {
              ...state.institutionBalances,
              [res.schoolId]: bal,
              ...(schoolIdOrSlug ? { [schoolIdOrSlug]: bal } : {}),
            },
          }))
          return bal
        } catch {
          return null
        }
      },

      buySMS: async ({ quantity, totalCost, provider, refId, notes }) => {
        const res = await smsApi.recordPurchase({ provider, quantity, totalCost, refId, notes })
        set((state) => ({
          purchases: [res.purchase, ...state.purchases],
          masterPool: res.masterPool,
        }))
        return res.purchase
      },

      allocateSMS: async ({ institutionId, amount, type = 'credit', note }) => {
        try {
          const res = await smsApi.allocateToSchool({
            schoolId: institutionId,
            amount,
            type,
            note,
          })

          const mappedAlloc: SMSAllocationRecord = {
            id: res.allocation.id,
            institutionId: res.allocation.schoolId,
            institutionName: res.allocation.schoolName,
            amount: res.allocation.amount,
            type: res.allocation.type,
            note: res.allocation.note,
            allocatedAt: res.allocation.allocatedAt,
            adminUser: res.allocation.allocatedBy || 'Super Admin',
          }

          set((state) => ({
            allocations: [mappedAlloc, ...state.allocations],
            masterPool: res.masterPool,
            schools: state.schools.map((s) =>
              s.id === res.allocation.schoolId || s.id === institutionId
                ? { ...s, balance: res.balance }
                : s
            ),
            institutionBalances: {
              ...state.institutionBalances,
              [institutionId]: res.balance,
              [res.allocation.schoolId]: res.balance,
            },
          }))

          return { success: true }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'SMS allocation failed',
          }
        }
      },

      distributeToAll: async (data) => {
        try {
          const res = await smsApi.distributeAll(data)
          await get().fetchSuperAdminOverview()
          return {
            success: true,
            distributedCount: res.distributedCount,
            totalDistributed: res.totalDistributed,
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Bulk distribution failed',
          }
        }
      },

      broadcastSMS: async (data) => {
        try {
          const res = await smsApi.superAdminBroadcast(data)
          await get().fetchSuperAdminOverview()
          return {
            success: res.success,
            sentCount: res.sentCount,
            failedCount: res.failedCount,
            skippedCount: res.skippedCount,
            error: res.error,
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Broadcast SMS failed',
          }
        }
      },

      checkProviderBalance: async () => {
        try {
          const res = await smsApi.checkProviderBalance()
          return {
            success: res.success,
            balanceText: res.balanceText,
            balanceNumeric: res.balanceNumeric,
            error: res.error,
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Could not fetch provider balance',
          }
        }
      },

      deductSMS: (institutionId, count = 1) => {
        const state = get()
        const currentBal = state.institutionBalances[institutionId] || DEFAULT_INSTITUTION_BALANCE
        if (currentBal.remaining < count) return false

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
        return (institutionId ? state.institutionBalances[institutionId] : undefined) || DEFAULT_INSTITUTION_BALANCE
      },

      updateGatewayConfig: async (config) => {
        const prev = get().gatewayConfig
        const merged: SMSGatewayOptions = { ...prev, ...config }
        try {
          const res = await smsApi.updateGateway({
            providerName: merged.providerName,
            providerType: merged.providerType,
            apiUrl: merged.apiUrl,
            senderId: merged.senderId,
            username: merged.username,
            isActive: merged.isActive,
            apiKey: config.apiKey,
            password: config.password,
            clearApiKey: config.clearApiKey,
          })
          set({
            gatewayConfig: { ...DEFAULT_GATEWAY, ...res.gatewayConfig },
            gatewayConfigured: Boolean(
              res.gatewayConfig.isActive &&
                (res.gatewayConfig.hasApiKey ||
                  res.gatewayConfig.providerType === 'custom' ||
                  res.gatewayConfig.providerType === 'sim_gateway')
            ),
          })
          return { success: true }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to save gateway settings',
          }
        }
      },

      sendSMS: async ({ institutionId, institutionName, phone, message, type }) => {
        if (type === 'test' || institutionId.startsWith('super-admin')) {
          const bRes = await get().broadcastSMS({
            recipients: [phone],
            message,
            triggerType: 'test',
          })
          return {
            success: bRes.success,
            messageId: `TEST-${Date.now()}`,
            status: bRes.success ? 'delivered' : 'failed',
            segmentsUsed: calculateSmsSegments(message),
            error: bRes.error,
          }
        }

        try {
          const res = await smsApi.sendSingle({
            phone,
            message,
            triggerType: type,
            schoolId: institutionId !== 'inst-default' ? institutionId : undefined,
          })

          set((state) => ({
            institutionBalances: {
              ...state.institutionBalances,
              [institutionId]: res.balance,
            },
            dispatchLogs: [
              {
                id: res.messageId,
                institutionId,
                institutionName,
                phone,
                message,
                type,
                status: res.status,
                costUnits: res.segmentsUsed,
                sentAt: new Date().toISOString(),
                providerResponse: res.providerResponse,
                error: res.error,
              },
              ...state.dispatchLogs,
            ],
          }))

          return {
            success: res.success,
            messageId: res.messageId,
            status: res.status,
            segmentsUsed: res.segmentsUsed,
            providerResponse: res.providerResponse,
            error: res.error,
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'SMS send failed'
          const logEntry: SMSDispatchLog = {
            id: `FAIL-${Date.now()}`,
            institutionId,
            institutionName,
            phone,
            message,
            type,
            status: 'failed',
            costUnits: 0,
            sentAt: new Date().toISOString(),
            error: errMsg,
          }
          set((s) => ({ dispatchLogs: [logEntry, ...s.dispatchLogs] }))
          return {
            success: false,
            messageId: logEntry.id,
            status: 'failed',
            error: errMsg,
          }
        }
      },

      sendBulkSMS: async ({ institutionId, phones, message, type }) => {
        try {
          const res = await smsApi.sendBulk({
            phones,
            message,
            triggerType: type,
            schoolId: institutionId !== 'inst-default' ? institutionId : undefined,
          })
          set((state) => ({
            institutionBalances: {
              ...state.institutionBalances,
              [institutionId]: res.balance,
            },
          }))
          return {
            success: res.success,
            sentCount: res.sentCount,
            failedCount: res.failedCount,
            error: res.error,
          }
        } catch (err: unknown) {
          return {
            success: false,
            sentCount: 0,
            failedCount: phones.length,
            error: err instanceof Error ? err.message : 'Bulk SMS dispatch failed',
          }
        }
      },

      clearLogs: () => set({ dispatchLogs: [] }),
    }),
    {
      name: 'edutech_sms_store',
      // Never persist sensitive or stale pool figures blindly; reload real server state cleanly
      partialize: (state) => ({
        institutionBalances: state.institutionBalances,
      }),
    }
  )
)
