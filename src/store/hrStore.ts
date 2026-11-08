import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, getSlug } from '@/lib/storage'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { isLocalComputerMode } from '@/lib/storageMode'
import { hrApi } from '@/lib/api'

export interface IncrementRecord {
  id: string
  teacherId: string
  type: 'annual' | 'performance' | 'special'
  amount: number
  percentage: number
  reason: string
  date: string
  approvedBy?: string
}

export interface BonusRecord {
  id: string
  teacherId: string
  type: 'festival' | 'performance' | 'attendance' | 'special'
  amount: number
  month: string
  reason: string
  date: string
  createdBy?: string
}

export interface PromotionRecord {
  id: string
  teacherId: string
  fromDesignation: string
  toDesignation: string
  date: string
  reason: string
  createdBy?: string
}

export interface FundRecord {
  id: string
  type: 'contribution' | 'withdrawal' | 'bonus_pool' | 'increment_pool'
  amount: number
  description: string
  date: string
  createdBy?: string
}

export interface HomeworkRecord {
  id: string
  teacherId: string
  classId: string
  sectionId: string
  subject: string
  date: string
  submitted: boolean
}

export interface DailyReport {
  id: string
  teacherId: string
  date: string
  submitted: boolean
  classId: string
  studentCount: number
  avgScore: number
}

export interface HRRecommendation {
  id: string
  teacherId: string
  type: 'promotion' | 'bonus' | 'increment'
  score: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface Facility {
  id: string
  name: string
  nameBn: string
  defaultAmount: number
  type: 'monthly' | 'oneTime'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TeacherFacility {
  id: string
  teacherId: string
  facilityId: string
  amount: number
  createdAt: string
  updatedAt: string
}

export interface MonthlySalaryConfig {
  id: string
  month: string // "2026-06"
  teacherId: string
  bonus: number
  festivalBonus: number
  applyDeductionRule: boolean
  fundContributionPercent: number
  createdAt: string
}

interface HRState {
  increments: IncrementRecord[]
  bonuses: BonusRecord[]
  promotions: PromotionRecord[]
  funds: FundRecord[]
  homeworkRecords: HomeworkRecord[]
  dailyReports: DailyReport[]
  recommendations: HRRecommendation[]
  monthlySalaryConfigs: MonthlySalaryConfig[]
  facilities: Facility[]
  teacherFacilities: TeacherFacility[]

  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>

  addIncrement: (record: IncrementRecord) => void
  deleteIncrement: (id: string) => void
  addBonus: (record: BonusRecord) => void
  deleteBonus: (id: string) => void
  addPromotion: (record: PromotionRecord) => void
  deletePromotion: (id: string) => void
  addFund: (record: FundRecord) => void
  deleteFund: (id: string) => void
  addHomeworkRecord: (record: HomeworkRecord) => void
  toggleHomework: (id: string) => void
  addDailyReport: (record: DailyReport) => void
  addRecommendation: (rec: HRRecommendation) => void
  updateRecommendation: (id: string, status: 'approved' | 'rejected') => void
  upsertMonthlySalaryConfig: (config: MonthlySalaryConfig) => void
  upsertManyMonthlySalaryConfigs: (configs: MonthlySalaryConfig[]) => void
  deleteMonthlySalaryConfig: (id: string) => void
  addFacility: (facility: Facility) => void
  updateFacility: (id: string, data: Partial<Facility>) => void
  deleteFacility: (id: string) => void
  assignTeacherFacility: (tf: TeacherFacility) => void
  assignManyTeacherFacilities: (tfs: TeacherFacility[]) => void
  updateTeacherFacility: (id: string, data: Partial<TeacherFacility>) => void
  removeTeacherFacility: (id: string) => void
  removeTeacherFacilitiesByTeacher: (teacherId: string) => void
  upsertTeacherFacilities: (tfs: TeacherFacility[]) => void
}

let serverSyncTimer: any = null
function queueServerSync(get: () => HRState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    if (
      !state.serverSynced &&
      state.increments.length === 0 &&
      state.bonuses.length === 0 &&
      state.promotions.length === 0 &&
      state.funds.length === 0 &&
      state.facilities.length === 0 &&
      state.teacherFacilities.length === 0
    ) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (
          s.increments.length === 0 &&
          s.bonuses.length === 0 &&
          s.promotions.length === 0 &&
          s.funds.length === 0 &&
          s.facilities.length === 0 &&
          s.teacherFacilities.length === 0 &&
          !isRecentExplicitDelete()
        ) {
          return
        }
        await hrApi.update({
          increments: s.increments,
          bonuses: s.bonuses,
          promotions: s.promotions,
          funds: s.funds,
          homeworkRecords: s.homeworkRecords,
          dailyReports: s.dailyReports,
          recommendations: s.recommendations,
          monthlySalaryConfigs: s.monthlySalaryConfigs,
          facilities: s.facilities,
          teacherFacilities: s.teacherFacilities,
        })
      } catch {
        // Warning only
      }
    }, 400)
  } catch {
    /* ignore */
  }
}

function onStateMutated(get: () => HRState) {
  queueServerSync(get)
}

export const useHRStore = create<HRState>()(
  persist(
    (set, get): HRState => ({
      increments: [],
      bonuses: [],
      promotions: [],
      funds: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [],
      teacherFacilities: [],

      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false, syncError: null })
          return
        }
        const effectiveSlug = slugOrId || getSlug() || undefined
        set({ syncing: true, syncError: null })
        try {
          const res = await hrApi.get(effectiveSlug)
          if (res) {
            const hasAny =
              (Array.isArray(res.increments) && res.increments.length > 0) ||
              (Array.isArray(res.bonuses) && res.bonuses.length > 0) ||
              (Array.isArray(res.promotions) && res.promotions.length > 0) ||
              (Array.isArray(res.funds) && res.funds.length > 0) ||
              (Array.isArray(res.facilities) && res.facilities.length > 0) ||
              (Array.isArray(res.teacherFacilities) && res.teacherFacilities.length > 0) ||
              (Array.isArray(res.monthlySalaryConfigs) && res.monthlySalaryConfigs.length > 0) ||
              (Array.isArray(res.recommendations) && res.recommendations.length > 0)

            const state = get()
            if (hasAny) {
              set({
                increments: res.increments || [],
                bonuses: res.bonuses || [],
                promotions: res.promotions || [],
                funds: res.funds || [],
                homeworkRecords: res.homeworkRecords || [],
                dailyReports: res.dailyReports || [],
                recommendations: res.recommendations || [],
                monthlySalaryConfigs: res.monthlySalaryConfigs || [],
                facilities: res.facilities || [],
                teacherFacilities: res.teacherFacilities || [],
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (
              state.increments.length > 0 ||
              state.bonuses.length > 0 ||
              state.promotions.length > 0 ||
              state.funds.length > 0 ||
              state.facilities.length > 0 ||
              state.teacherFacilities.length > 0
            ) {
              await hrApi.update({
                increments: state.increments,
                bonuses: state.bonuses,
                promotions: state.promotions,
                funds: state.funds,
                homeworkRecords: state.homeworkRecords,
                dailyReports: state.dailyReports,
                recommendations: state.recommendations,
                monthlySalaryConfigs: state.monthlySalaryConfigs,
                facilities: state.facilities,
                teacherFacilities: state.teacherFacilities,
                schoolId: effectiveSlug,
              })
              set({ serverSynced: true, syncing: false, syncError: null })
            } else {
              set({ serverSynced: true, syncing: false, syncError: null })
            }
          } else {
            set({ serverSynced: true, syncing: false, syncError: null })
          }
        } catch (err: any) {
          set({ syncing: false, syncError: err?.message || 'Failed to sync HR records' })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        const s = get()
        set({ syncing: true, syncError: null })
        try {
          await hrApi.update({
            increments: s.increments,
            bonuses: s.bonuses,
            promotions: s.promotions,
            funds: s.funds,
            homeworkRecords: s.homeworkRecords,
            dailyReports: s.dailyReports,
            recommendations: s.recommendations,
            monthlySalaryConfigs: s.monthlySalaryConfigs,
            facilities: s.facilities,
            teacherFacilities: s.teacherFacilities,
          })
          set({ serverSynced: true, syncing: false, syncError: null })
        } catch (err: any) {
          set({ syncing: false, syncError: err?.message || 'Failed to sync HR to server' })
        }
      },

      addIncrement: (record) => {
        set((state) => ({ increments: [...state.increments, record] }))
        onStateMutated(get)
      },
      deleteIncrement: (id) => {
        markExplicitUserDelete()
        set((state) => ({ increments: state.increments.filter((i) => i.id !== id) }))
        onStateMutated(get)
      },
      addBonus: (record) => {
        set((state) => ({ bonuses: [...state.bonuses, record] }))
        onStateMutated(get)
      },
      deleteBonus: (id) => {
        markExplicitUserDelete()
        set((state) => ({ bonuses: state.bonuses.filter((b) => b.id !== id) }))
        onStateMutated(get)
      },
      addPromotion: (record) => {
        set((state) => ({ promotions: [...state.promotions, record] }))
        onStateMutated(get)
      },
      deletePromotion: (id) => {
        markExplicitUserDelete()
        set((state) => ({ promotions: state.promotions.filter((p) => p.id !== id) }))
        onStateMutated(get)
      },
      addFund: (record) => {
        set((state) => ({ funds: [...state.funds, record] }))
        onStateMutated(get)
      },
      deleteFund: (id) => {
        markExplicitUserDelete()
        set((state) => ({ funds: state.funds.filter((f) => f.id !== id) }))
        onStateMutated(get)
      },
      addHomeworkRecord: (record) => {
        set((state) => ({ homeworkRecords: [...state.homeworkRecords, record] }))
        onStateMutated(get)
      },
      toggleHomework: (id) => {
        set((state) => ({
          homeworkRecords: state.homeworkRecords.map((r) => (r.id === id ? { ...r, submitted: !r.submitted } : r)),
        }))
        onStateMutated(get)
      },
      addDailyReport: (record) => {
        set((state) => ({ dailyReports: [...state.dailyReports, record] }))
        onStateMutated(get)
      },
      addRecommendation: (rec) => {
        set((state) => ({ recommendations: [...state.recommendations, rec] }))
        onStateMutated(get)
      },
      updateRecommendation: (id, status) => {
        set((state) => ({
          recommendations: state.recommendations.map((r) => (r.id === id ? { ...r, status } : r)),
        }))
        onStateMutated(get)
      },
      upsertMonthlySalaryConfig: (config) => {
        set((state) => {
          const existing = state.monthlySalaryConfigs.find((c) => c.teacherId === config.teacherId && c.month === config.month)
          if (existing) {
            return { monthlySalaryConfigs: state.monthlySalaryConfigs.map((c) => (c.id === existing.id ? config : c)) }
          }
          return { monthlySalaryConfigs: [...state.monthlySalaryConfigs, config] }
        })
        onStateMutated(get)
      },
      upsertManyMonthlySalaryConfigs: (configs) => {
        set((state) => {
          const map = new Map<string, MonthlySalaryConfig>()
          for (const c of state.monthlySalaryConfigs) {
            map.set(`${c.teacherId}_${c.month}`, c)
          }
          for (const c of configs) {
            map.set(`${c.teacherId}_${c.month}`, c)
          }
          return { monthlySalaryConfigs: Array.from(map.values()) }
        })
        onStateMutated(get)
      },
      deleteMonthlySalaryConfig: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          monthlySalaryConfigs: state.monthlySalaryConfigs.filter((c) => c.id !== id),
        }))
        onStateMutated(get)
      },
      addFacility: (facility) => {
        set((state) => ({ facilities: [...state.facilities, facility] }))
        onStateMutated(get)
      },
      updateFacility: (id, data) => {
        set((state) => ({
          facilities: state.facilities.map((f) => (f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString().split('T')[0] } : f)),
        }))
        onStateMutated(get)
      },
      deleteFacility: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          facilities: state.facilities.filter((f) => f.id !== id),
          teacherFacilities: state.teacherFacilities.filter((tf) => tf.facilityId !== id),
        }))
        onStateMutated(get)
      },
      assignTeacherFacility: (tf) => {
        set((state) => ({ teacherFacilities: [...state.teacherFacilities, tf] }))
        onStateMutated(get)
      },
      assignManyTeacherFacilities: (tfs) => {
        set((state) => ({ teacherFacilities: [...state.teacherFacilities, ...tfs] }))
        onStateMutated(get)
      },
      updateTeacherFacility: (id, data) => {
        set((state) => ({
          teacherFacilities: state.teacherFacilities.map((tf) =>
            tf.id === id ? { ...tf, ...data, updatedAt: new Date().toISOString().split('T')[0] } : tf
          ),
        }))
        onStateMutated(get)
      },
      removeTeacherFacility: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          teacherFacilities: state.teacherFacilities.filter((tf) => tf.id !== id),
        }))
        onStateMutated(get)
      },
      removeTeacherFacilitiesByTeacher: (teacherId) => {
        markExplicitUserDelete()
        set((state) => ({
          teacherFacilities: state.teacherFacilities.filter((tf) => tf.teacherId !== teacherId),
        }))
        onStateMutated(get)
      },
      upsertTeacherFacilities: (tfs) => {
        set((state) => {
          const map = new Map<string, TeacherFacility>()
          for (const tf of state.teacherFacilities) {
            map.set(`${tf.teacherId}_${tf.facilityId}`, tf)
          }
          for (const tf of tfs) {
            map.set(`${tf.teacherId}_${tf.facilityId}`, tf)
          }
          return { teacherFacilities: Array.from(map.values()) }
        })
        onStateMutated(get)
      },
    }),
    {
      name: 'edutech-hr',
      storage: createNamespacedStorage('edutech-hr', undefined, { debounce: true }),
      version: 1,
      partialize: (state) => ({
        increments: state.increments,
        bonuses: state.bonuses,
        promotions: state.promotions,
        funds: state.funds,
        homeworkRecords: state.homeworkRecords,
        dailyReports: state.dailyReports,
        recommendations: state.recommendations,
        monthlySalaryConfigs: state.monthlySalaryConfigs,
        facilities: state.facilities,
        teacherFacilities: state.teacherFacilities,
        serverSynced: state.serverSynced,
      }),
    }
  )
)

registerStoreReset(() => {
  useHRStore.setState({
    increments: [],
    bonuses: [],
    promotions: [],
    funds: [],
    homeworkRecords: [],
    dailyReports: [],
    recommendations: [],
    monthlySalaryConfigs: [],
    facilities: [],
    teacherFacilities: [],
    serverSynced: false,
    syncing: false,
    syncError: null,
  })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-hr_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useHRStore.setState(parsed.state)
    } else {
      useHRStore.setState({
        increments: [],
        bonuses: [],
        promotions: [],
        funds: [],
        homeworkRecords: [],
        dailyReports: [],
        recommendations: [],
        monthlySalaryConfigs: [],
        facilities: [],
        teacherFacilities: [],
        serverSynced: false,
        syncing: false,
        syncError: null,
      })
    }
  } catch {
    useHRStore.setState({
      increments: [],
      bonuses: [],
      promotions: [],
      funds: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [],
      teacherFacilities: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
  }
})
