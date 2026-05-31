import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface HRState {
  increments: IncrementRecord[]
  bonuses: BonusRecord[]
  promotions: PromotionRecord[]
  funds: FundRecord[]
  homeworkRecords: HomeworkRecord[]
  addIncrement: (record: IncrementRecord) => void
  addBonus: (record: BonusRecord) => void
  addPromotion: (record: PromotionRecord) => void
  addFund: (record: FundRecord) => void
  addHomeworkRecord: (record: HomeworkRecord) => void
  toggleHomework: (id: string) => void
}

export const useHRStore = create<HRState>()(
  persist(
    (set) => ({
      increments: [
        { id: 'INC-001', teacherId: 'TCH-2026-001', type: 'annual', amount: 5000, percentage: 8, reason: 'Annual increment 2026', date: '2026-01-01', approvedBy: 'Admin' },
        { id: 'INC-002', teacherId: 'TCH-2026-008', type: 'performance', amount: 3000, percentage: 5, reason: 'Outstanding results', date: '2026-06-01', approvedBy: 'Admin' },
        { id: 'INC-003', teacherId: 'TCH-2026-014', type: 'annual', amount: 4500, percentage: 8, reason: 'Annual increment 2026', date: '2026-01-01', approvedBy: 'Admin' },
      ],
      bonuses: [
        { id: 'BON-001', teacherId: 'TCH-2026-001', type: 'festival', amount: 10000, month: '2026-04', reason: 'Eid Festival Bonus', date: '2026-04-10' },
        { id: 'BON-002', teacherId: 'TCH-2026-008', type: 'performance', amount: 8000, month: '2026-03', reason: 'Best teacher of the month', date: '2026-03-30' },
        { id: 'BON-003', teacherId: 'TCH-2026-014', type: 'attendance', amount: 5000, month: '2026-02', reason: '100% attendance February', date: '2026-02-28' },
        { id: 'BON-004', teacherId: 'TCH-2026-004', type: 'festival', amount: 10000, month: '2026-04', reason: 'Eid Festival Bonus', date: '2026-04-10' },
      ],
      promotions: [
        { id: 'PRO-001', teacherId: 'TCH-2026-005', fromDesignation: 'Lecturer', toDesignation: 'Assistant Professor', date: '2026-07-01', reason: 'Excellent performance' },
      ],
      funds: [
        { id: 'FND-001', type: 'bonus_pool', amount: 200000, description: 'Q2 bonus pool allocation', date: '2026-04-01' },
        { id: 'FND-002', type: 'increment_pool', amount: 150000, description: 'Annual increment allocation', date: '2026-01-01' },
        { id: 'FND-003', type: 'contribution', amount: 500000, description: 'Monthly fund contribution', date: '2026-05-01' },
        { id: 'FND-004', type: 'withdrawal', amount: 55000, description: 'April increments paid', date: '2026-04-01' },
      ],
      homeworkRecords: [],

      addIncrement: (record) => set((state) => ({ increments: [...state.increments, record] })),
      addBonus: (record) => set((state) => ({ bonuses: [...state.bonuses, record] })),
      addPromotion: (record) => set((state) => ({ promotions: [...state.promotions, record] })),
      addFund: (record) => set((state) => ({ funds: [...state.funds, record] })),
      addHomeworkRecord: (record) => set((state) => ({ homeworkRecords: [...state.homeworkRecords, record] })),
      toggleHomework: (id) => set((state) => ({
        homeworkRecords: state.homeworkRecords.map(r => r.id === id ? { ...r, submitted: !r.submitted } : r)
      })),
    }),
    { name: 'edutech-hr' }
  )
)
