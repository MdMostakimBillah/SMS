import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FeeStructure {
  id: string
  name: string
  nameBn: string
  class: string
  section?: string
  academicYear: string
  amount: number
  description: string
  descriptionBn: string
  isActive: boolean
  type: 'monthly' | 'onetime'
  createdAt: string
}

export interface FeePayment {
  id: string
  studentId: string
  feeStructureId: string
  amount: number
  paidAt: string
  method: 'cash' | 'bank' | 'mobile' | 'other'
  reference: string
  note: string
  collectedBy: string
  createdAt: string
  batchId?: string
}

export interface FeeWaiver {
  id: string
  studentId: string
  feeStructureId: string
  amount: number
  reason: string
  reasonBn: string
  approvedBy: string
  createdAt: string
}

export interface FeeDue {
  studentId: string
  studentName: string
  studentNameBn: string
  class: string
  section: string
  roll: string
  photo: string
  feeStructureId: string
  feeName: string
  feeNameBn: string
  totalAmount: number
  paidAmount: number
  waivedAmount: number
  dueAmount: number
  isActive: boolean
  inactiveAt?: string
  inactiveReason?: string
}

interface StudentInfo {
  id: string
  nameEn: string
  nameBn: string
  class: string
  section: string
  roll: string
  photo: string
  active?: boolean
  inactiveAt?: string
  inactiveReason?: string
}

interface FeeState {
  structures: FeeStructure[]
  payments: FeePayment[]
  waivers: FeeWaiver[]

  addStructure: (s: FeeStructure) => void
  updateStructure: (id: string, data: Partial<FeeStructure>) => void
  deleteStructure: (id: string) => void
  toggleStructureActive: (id: string) => void
  bulkAddStructures: (structures: FeeStructure[]) => void

  addPayment: (p: FeePayment) => void
  deletePayment: (id: string) => void

  addWaiver: (w: FeeWaiver) => void
  deleteWaiver: (id: string) => void

  calculateDues: (students: StudentInfo[], classId?: string, sectionId?: string, onlyInactive?: boolean) => FeeDue[]
  getStudentPayments: (studentId: string) => FeePayment[]
  getPaymentsByStructure: (structureId: string) => FeePayment[]
  getCollectionSummary: () => {
    totalCollected: number
    totalPending: number
    totalOverdue: number
    totalWaived: number
    collectedThisMonth: number
    paymentCount: number
  }
  getClassWiseSummary: (students: StudentInfo[]) => { className: string; totalDue: number; totalPaid: number; studentCount: number }[]
}

export const useFeeStore = create<FeeState>()(
  persist(
    (set, get) => ({
      structures: [],
      payments: [],
      waivers: [],

      addStructure: (s) => set((state) => ({ structures: [...state.structures, s] })),

      updateStructure: (id, data) =>
        set((state) => ({
          structures: state.structures.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),

      deleteStructure: (id) =>
        set((state) => ({
          structures: state.structures.filter((s) => s.id !== id),
          payments: state.payments.filter((p) => p.feeStructureId !== id),
          waivers: state.waivers.filter((w) => w.feeStructureId !== id),
        })),

      toggleStructureActive: (id) =>
        set((state) => ({
          structures: state.structures.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
        })),

      bulkAddStructures: (newStructures) =>
        set((state) => ({ structures: [...state.structures, ...newStructures] })),

      addPayment: (p) => set((state) => ({ payments: [...state.payments, p] })),

      deletePayment: (id) =>
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        })),

      addWaiver: (w) => set((state) => ({ waivers: [...state.waivers, w] })),

      deleteWaiver: (id) =>
        set((state) => ({
          waivers: state.waivers.filter((w) => w.id !== id),
        })),

      calculateDues: (students, classId, sectionId, onlyInactive) => {
        const { structures, payments, waivers } = get()
        const dues: FeeDue[] = []

        const activeStructures = structures.filter((s) => {
          if (!s.isActive) return false
          if (classId && s.class !== classId) return false
          if (sectionId && s.section && s.section !== sectionId) return false
          return true
        })

        if (activeStructures.length === 0) return dues

        const filteredStudents = students.filter((s) => {
          if (onlyInactive) return s.active === false
          return s.active !== false
        })

        for (const student of filteredStudents) {
          const studentStructures = activeStructures.filter((s) => s.class === student.class && (!s.section || s.section === student.section))

          for (const fee of studentStructures) {
            const paid = payments
              .filter((p) => p.studentId === student.id && p.feeStructureId === fee.id)
              .reduce((sum, p) => sum + p.amount, 0)
            const waived = waivers
              .filter((w) => w.studentId === student.id && w.feeStructureId === fee.id)
              .reduce((sum, w) => sum + w.amount, 0)
            const due = fee.amount - paid - waived

            if (due > 0) {
              dues.push({
                studentId: student.id,
                studentName: student.nameEn,
                studentNameBn: student.nameBn,
                class: student.class,
                section: student.section,
                roll: student.roll,
                photo: student.photo,
                feeStructureId: fee.id,
                feeName: fee.name,
                feeNameBn: fee.nameBn,
                totalAmount: fee.amount,
                paidAmount: paid,
                waivedAmount: waived,
                dueAmount: Math.max(0, due),
                isActive: student.active !== false,
                inactiveAt: student.inactiveAt,
                inactiveReason: student.inactiveReason,
              })
            }
          }
        }

        return dues
      },

      getStudentPayments: (studentId) => {
        return get().payments.filter((p) => p.studentId === studentId)
      },

      getPaymentsByStructure: (structureId) => {
        return get().payments.filter((p) => p.feeStructureId === structureId)
      },

      getCollectionSummary: () => {
        const { structures, payments, waivers } = get()
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)
        const totalWaived = waivers.reduce((sum, w) => sum + w.amount, 0)
        const collectedThisMonth = payments.filter((p) => p.paidAt >= monthStart).reduce((sum, p) => sum + p.amount, 0)

        let totalPending = 0
        for (const s of structures) {
          if (!s.isActive) continue
          const structPayments = payments.filter((p) => p.feeStructureId === s.id)
          const structWaivers = waivers.filter((w) => w.feeStructureId === s.id)
          const totalPaid = structPayments.reduce((sum, p) => sum + p.amount, 0)
          const totalWaived = structWaivers.reduce((sum, w) => sum + w.amount, 0)
          const remaining = s.amount - totalPaid - totalWaived
          if (remaining > 0) {
            totalPending += remaining
          }
        }

        return {
          totalCollected,
          totalPending,
          totalOverdue: 0,
          totalWaived,
          collectedThisMonth,
          paymentCount: payments.length,
        }
      },

      getClassWiseSummary: (students) => {
        const { structures, payments, waivers } = get()
        const classMap = new Map<string, { totalDue: number; totalPaid: number; studentCount: Set<string> }>()

        for (const student of students) {
          if (student.active === false) continue
          const studentStructures = structures.filter((s) => s.isActive && s.class === student.class && (!s.section || s.section === student.section))

          for (const fee of studentStructures) {
            if (!classMap.has(student.class)) {
              classMap.set(student.class, { totalDue: 0, totalPaid: 0, studentCount: new Set() })
            }
            const entry = classMap.get(student.class)!
            entry.studentCount.add(student.id)
            const paid = payments.filter((p) => p.studentId === student.id && p.feeStructureId === fee.id).reduce((sum, p) => sum + p.amount, 0)
            const waived = waivers.filter((w) => w.studentId === student.id && w.feeStructureId === fee.id).reduce((sum, w) => sum + w.amount, 0)
            entry.totalPaid += paid + waived
            entry.totalDue += fee.amount
          }
        }

        return Array.from(classMap.entries())
          .map(([className, data]) => ({
            className,
            totalDue: data.totalDue,
            totalPaid: data.totalPaid,
            studentCount: data.studentCount.size,
          }))
          .sort((a, b) => a.className.localeCompare(b.className))
      },
    }),
    {
      name: 'edutech-fees',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          persistedState.waivers = persistedState.waivers || []
        }
        if (version < 3) {
          persistedState.structures = (persistedState.structures || []).map((s: any) => ({
            ...s,
            type: s.type || 'monthly',
          }))
        }
        return persistedState
      },
    }
  )
)
