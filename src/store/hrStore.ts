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

interface HRState {
  increments: IncrementRecord[]
  bonuses: BonusRecord[]
  promotions: PromotionRecord[]
  funds: FundRecord[]
  homeworkRecords: HomeworkRecord[]
  dailyReports: DailyReport[]
  recommendations: HRRecommendation[]
  addIncrement: (record: IncrementRecord) => void
  addBonus: (record: BonusRecord) => void
  addPromotion: (record: PromotionRecord) => void
  addFund: (record: FundRecord) => void
  addHomeworkRecord: (record: HomeworkRecord) => void
  toggleHomework: (id: string) => void
  addDailyReport: (record: DailyReport) => void
  addRecommendation: (rec: HRRecommendation) => void
  updateRecommendation: (id: string, status: 'approved' | 'rejected') => void
}

function generateDemoDailyReports(): DailyReport[] {
  const reports: DailyReport[] = []
  const teacherIds = [
    'TCH-2026-001','TCH-2026-002','TCH-2026-003','TCH-2026-004','TCH-2026-005',
    'TCH-2026-006','TCH-2026-008','TCH-2026-009','TCH-2026-010','TCH-2026-011',
    'TCH-2026-012','TCH-2026-014','TCH-2026-015','TCH-2026-016','TCH-2026-017',
    'TCH-2026-018',
  ]
  const classIds = ['CLS-001','CLS-002','CLS-003','CLS-004','CLS-005','CLS-006','CLS-007','CLS-008']
  const now = new Date()
  for (let i = 1; i <= 28; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (d.getDay() === 0) continue
    const dateStr = d.toISOString().split('T')[0]
    teacherIds.forEach(tid => {
      const submitted = Math.random() > 0.18
      const studentCount = 25 + Math.floor(Math.random() * 20)
      const avgScore = submitted ? 45 + Math.floor(Math.random() * 35) : 0
      reports.push({
        id: `DR-${tid}-${dateStr}`,
        teacherId: tid,
        date: dateStr,
        submitted,
        classId: classIds[Math.floor(Math.random() * classIds.length)],
        studentCount,
        avgScore,
      })
    })
  }
  return reports
}

function generateDemoRecommendations(): HRRecommendation[] {
  const recs: HRRecommendation[] = [
    { id: 'REC-001', teacherId: 'TCH-2026-001', type: 'promotion', score: 92, reason: 'Consistent top performer, excellent student results', status: 'pending', createdAt: '2026-05-28' },
    { id: 'REC-002', teacherId: 'TCH-2026-008', type: 'bonus', score: 88, reason: 'Outstanding homework submission rate and attendance', status: 'pending', createdAt: '2026-05-28' },
    { id: 'REC-003', teacherId: 'TCH-2026-004', type: 'increment', score: 85, reason: 'High student performance scores consistently', status: 'pending', createdAt: '2026-05-27' },
    { id: 'REC-004', teacherId: 'TCH-2026-014', type: 'bonus', score: 82, reason: 'Perfect daily report submission record', status: 'approved', createdAt: '2026-05-25' },
    { id: 'REC-005', teacherId: 'TCH-2026-005', type: 'promotion', score: 79, reason: 'Good improvement in last quarter', status: 'pending', createdAt: '2026-05-26' },
  ]
  return recs
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
      dailyReports: generateDemoDailyReports(),
      recommendations: generateDemoRecommendations(),

      addIncrement: (record) => set((state) => ({ increments: [...state.increments, record] })),
      addBonus: (record) => set((state) => ({ bonuses: [...state.bonuses, record] })),
      addPromotion: (record) => set((state) => ({ promotions: [...state.promotions, record] })),
      addFund: (record) => set((state) => ({ funds: [...state.funds, record] })),
      addHomeworkRecord: (record) => set((state) => ({ homeworkRecords: [...state.homeworkRecords, record] })),
      toggleHomework: (id) => set((state) => ({
        homeworkRecords: state.homeworkRecords.map(r => r.id === id ? { ...r, submitted: !r.submitted } : r)
      })),
      addDailyReport: (record) => set((state) => ({ dailyReports: [...state.dailyReports, record] })),
      addRecommendation: (rec) => set((state) => ({ recommendations: [...state.recommendations, rec] })),
      updateRecommendation: (id, status) => set((state) => ({
        recommendations: state.recommendations.map(r => r.id === id ? { ...r, status } : r)
      })),
    }),
    { name: 'edutech-hr' }
  )
)
