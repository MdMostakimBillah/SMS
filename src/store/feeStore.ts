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
  dueDate: string
  description: string
  descriptionBn: string
  isActive: boolean
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
  dueAmount: number
  dueDate: string
  isOverdue: boolean
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

  addStructure: (s: FeeStructure) => void
  updateStructure: (id: string, data: Partial<FeeStructure>) => void
  deleteStructure: (id: string) => void

  addPayment: (p: FeePayment) => void
  deletePayment: (id: string) => void

  calculateDues: (students: StudentInfo[], classId?: string, sectionId?: string, onlyInactive?: boolean) => FeeDue[]
}

export const useFeeStore = create<FeeState>()(
  persist(
    (set) => ({
      structures: [],
      payments: [],

      addStructure: (s) => set((state) => ({ structures: [...state.structures, s] })),

      updateStructure: (id, data) =>
        set((state) => ({
          structures: state.structures.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),

      deleteStructure: (id) =>
        set((state) => ({
          structures: state.structures.filter((s) => s.id !== id),
          payments: state.payments.filter((p) => p.feeStructureId !== id),
        })),

      addPayment: (p) => set((state) => ({ payments: [...state.payments, p] })),

      deletePayment: (id) =>
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        })),

      calculateDues: (students, classId, sectionId, onlyInactive) => {
        const { structures, payments } = useFeeStore.getState()
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
            const due = fee.amount - paid

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
                dueAmount: Math.max(0, due),
                dueDate: fee.dueDate,
                isOverdue: due > 0 && new Date(fee.dueDate) < new Date(),
                isActive: student.active !== false,
                inactiveAt: student.inactiveAt,
                inactiveReason: student.inactiveReason,
              })
            }
          }
        }

        return dues
      },
    }),
    {
      name: 'edutech-fees',
      version: 1,
    }
  )
)
