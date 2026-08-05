import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreRehydrate } from '@/lib/storage'

export interface IncrementRecord {
  id: string
  teacherId: string
  type: 'annual' | 'performance' | 'special'
  amount: number
  percentage: number
  reason: string
  date: string
  approvedBy: string
}

export interface BonusRecord {
  id: string
  teacherId: string
  type: 'festival' | 'performance' | 'attendance' | 'special'
  amount: number
  month: string
  reason: string
  date: string
}

export interface PromotionRecord {
  id: string
  teacherId: string
  fromDesignation: string
  toDesignation: string
  date: string
  reason: string
}

export interface FundRecord {
  id: string
  type: 'contribution' | 'withdrawal' | 'bonus_pool' | 'increment_pool'
  amount: number
  description: string
  date: string
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
  addIncrement: (record: IncrementRecord) => void
  deleteIncrement: (id: string) => void
  addBonus: (record: BonusRecord) => void
  deleteBonus: (id: string) => void
  addPromotion: (record: PromotionRecord) => void
  deletePromotion: (id: string) => void
  addFund: (record: FundRecord) => void
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

export const useHRStore = create<HRState>()(
  persist(
    (set): HRState => ({
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

      addIncrement: (record) => set((state) => ({ increments: [...state.increments, record] })),
      deleteIncrement: (id) => set((state) => ({ increments: state.increments.filter((i) => i.id !== id) })),
      addBonus: (record) => set((state) => ({ bonuses: [...state.bonuses, record] })),
      deleteBonus: (id) => set((state) => ({ bonuses: state.bonuses.filter((b) => b.id !== id) })),
      addPromotion: (record) => set((state) => ({ promotions: [...state.promotions, record] })),
      deletePromotion: (id) => set((state) => ({ promotions: state.promotions.filter((p) => p.id !== id) })),
      addFund: (record) => set((state) => ({ funds: [...state.funds, record] })),
      addHomeworkRecord: (record) => set((state) => ({ homeworkRecords: [...state.homeworkRecords, record] })),
      toggleHomework: (id) =>
        set((state) => ({
          homeworkRecords: state.homeworkRecords.map((r) => (r.id === id ? { ...r, submitted: !r.submitted } : r)),
        })),
      addDailyReport: (record) => set((state) => ({ dailyReports: [...state.dailyReports, record] })),
      addRecommendation: (rec) => set((state) => ({ recommendations: [...state.recommendations, rec] })),
      updateRecommendation: (id, status) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) => (r.id === id ? { ...r, status } : r)),
        })),
      upsertMonthlySalaryConfig: (config) =>
        set((state) => {
          const existing = state.monthlySalaryConfigs.find((c) => c.teacherId === config.teacherId && c.month === config.month)
          if (existing) {
            return { monthlySalaryConfigs: state.monthlySalaryConfigs.map((c) => (c.id === existing.id ? config : c)) }
          }
          return { monthlySalaryConfigs: [...state.monthlySalaryConfigs, config] }
        }),
      upsertManyMonthlySalaryConfigs: (configs) =>
        set((state) => {
          const newConfigs = [...state.monthlySalaryConfigs]
          configs.forEach((config) => {
            const existing = newConfigs.find((c) => c.teacherId === config.teacherId && c.month === config.month)
            if (existing) {
              const idx = newConfigs.indexOf(existing)
              newConfigs[idx] = config
            } else {
              newConfigs.push(config)
            }
          })
          return { monthlySalaryConfigs: newConfigs }
        }),
      deleteMonthlySalaryConfig: (id) =>
        set((state) => ({
          monthlySalaryConfigs: state.monthlySalaryConfigs.filter((c) => c.id !== id),
        })),
      addFacility: (facility) => set((state) => ({ facilities: [...state.facilities, facility] })),
      updateFacility: (id, data) =>
        set((state) => ({
          facilities: state.facilities.map((f) => (f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString().split('T')[0] } : f)),
        })),
      deleteFacility: (id) =>
        set((state) => ({
          facilities: state.facilities.filter((f) => f.id !== id),
          teacherFacilities: state.teacherFacilities.filter((tf) => tf.facilityId !== id),
        })),
      assignTeacherFacility: (tf) => set((state) => ({ teacherFacilities: [...state.teacherFacilities, tf] })),
      assignManyTeacherFacilities: (tfs) => set((state) => ({ teacherFacilities: [...state.teacherFacilities, ...tfs] })),
      updateTeacherFacility: (id, data) =>
        set((state) => ({
          teacherFacilities: state.teacherFacilities.map((tf) =>
            tf.id === id ? { ...tf, ...data, updatedAt: new Date().toISOString().split('T')[0] } : tf
          ),
        })),
      removeTeacherFacility: (id) =>
        set((state) => ({
          teacherFacilities: state.teacherFacilities.filter((tf) => tf.id !== id),
        })),
      removeTeacherFacilitiesByTeacher: (teacherId) =>
        set((state) => ({
          teacherFacilities: state.teacherFacilities.filter((tf) => tf.teacherId !== teacherId),
        })),
      upsertTeacherFacilities: (tfs) =>
        set((state) => {
          const newTfs = [...state.teacherFacilities]
          tfs.forEach((tf) => {
            const existing = newTfs.find((e) => e.teacherId === tf.teacherId && e.facilityId === tf.facilityId)
            if (existing) {
              const idx = newTfs.indexOf(existing)
              newTfs[idx] = tf
            } else {
              newTfs.push(tf)
            }
          })
          return { teacherFacilities: newTfs }
        }),
    }),
    { name: 'edutech-hr', storage: createNamespacedStorage('edutech-hr'), version: 1 }
  )
)

registerStoreRehydrate(() => useHRStore.persist.rehydrate())
