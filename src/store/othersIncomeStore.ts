import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
import { useAdmissionStore } from './admissionStore'
import { useFeeStore, type FeeStructure } from './feeStore'
import { useClassStore } from './classStore'

export interface OthersIncomeCategory {
  id: string
  name: string
  nameBn: string
  amount: number
  type: 'monthly' | 'onetime'
  totalMonths?: number
  description: string
  descriptionBn: string
  isActive: boolean
  createdAt: string
}

export interface OthersIncomeAssignment {
  id: string
  categoryId: string
  studentId: string
  months: number[]
  academicYear: string
  assignedDate: string
  isActive: boolean
}

export const OTHERS_INCOME_FEE_NAME = 'Others Income'
export const OTHERS_INCOME_FEE_NAME_BN = 'অন্যান্য আয়'

let catCounter = 100
let assignCounter = 100

export function otherIncomeCategoryId(): string {
  catCounter++
  return `OIC-${String(catCounter).padStart(3, '0')}`
}

export function otherIncomeAssignmentId(): string {
  assignCounter++
  return `OIA-${String(assignCounter).padStart(3, '0')}`
}

export function otherFeeStructureId(assignmentId: string): string {
  return `FEE-OTHER-${assignmentId}`
}

function buildOtherFeeStructure(
  a: OthersIncomeAssignment,
  cat: OthersIncomeCategory,
  student?: { class: string; section: string }
): FeeStructure {
  return {
    id: otherFeeStructureId(a.id),
    name: cat.name,
    nameBn: cat.nameBn,
    class: student?.class || '',
    section: student?.section || undefined,
    academicYear: a.academicYear,
    amount: cat.amount,
    description: cat.description,
    descriptionBn: cat.descriptionBn,
    isActive: a.isActive,
    type: cat.type,
    studentId: a.studentId,
    applicableMonths: cat.type === 'monthly' ? [...(a.months || [])] : undefined,
    createdAt: a.assignedDate || new Date().toISOString().split('T')[0],
  }
}

function syncOtherFeeStructure(a: OthersIncomeAssignment) {
  const cats = useOthersIncomeStore.getState().categories
  const cat = cats.find((c) => c.id === a.categoryId)
  if (!cat) return

  const students = useAdmissionStore.getState().students
  const student = students.find((s) => s.id === a.studentId)
  const structureId = otherFeeStructureId(a.id)
  const existing = useFeeStore.getState().structures.find((s) => s.id === structureId)

  if (cat.type === 'monthly' && (!a.months || a.months.length === 0)) {
    if (existing) useFeeStore.getState().deleteStructure(structureId)
    return
  }

  const next = buildOtherFeeStructure(a, cat, student)
  if (existing) {
    useFeeStore.getState().updateStructure(structureId, {
      name: next.name,
      nameBn: next.nameBn,
      amount: next.amount,
      isActive: next.isActive,
      type: next.type,
      class: next.class,
      section: next.section,
      academicYear: next.academicYear,
      applicableMonths: next.applicableMonths,
      description: next.description,
      descriptionBn: next.descriptionBn,
    })
  } else {
    useFeeStore.getState().addStructure(next)
  }
}

function removeOtherFeeStructure(assignmentId: string) {
  const structureId = otherFeeStructureId(assignmentId)
  const structures = useFeeStore.getState().structures
  if (structures.some((s) => s.id === structureId)) {
    useFeeStore.getState().deleteStructure(structureId)
  }
}

function normalizeAssignment(a: OthersIncomeAssignment): OthersIncomeAssignment {
  if (Array.isArray(a.months) && a.months.length > 0) return a
  return {
    ...a,
    academicYear: a.academicYear || useClassStore.getState().institution.currentSession || '2025-26',
    months: Array.isArray(a.months) ? a.months : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  }
}

export function pruneExpiredOthersIncomeAssignments() {
  const { assignments, updateAssignment } = useOthersIncomeStore.getState()
  const currentSession = useClassStore.getState().institution.currentSession || '2025-26'
  for (const a of assignments) {
    const normalized = normalizeAssignment(a)
    if (!normalized.isActive) continue
    if (normalized.academicYear !== currentSession) {
      updateAssignment(normalized.id, { isActive: false })
    }
  }
}

interface OthersIncomeState {
  categories: OthersIncomeCategory[]
  assignments: OthersIncomeAssignment[]

  addCategory: (c: OthersIncomeCategory) => void
  updateCategory: (id: string, data: Partial<OthersIncomeCategory>) => void
  deleteCategory: (id: string) => void
  toggleCategoryActive: (id: string) => void

  addAssignment: (a: OthersIncomeAssignment) => void
  updateAssignment: (id: string, data: Partial<OthersIncomeAssignment>) => void
  deleteAssignment: (id: string) => void
  toggleAssignmentActive: (id: string) => void
}

export const useOthersIncomeStore = create<OthersIncomeState>()(
  persist(
    (set) => ({
      categories: [],
      assignments: [],

      addCategory: (c) => set((state) => ({ categories: [...state.categories, c] })),
      updateCategory: (id, data) =>
        set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCategory: (id) =>
        set((state) => {
          for (const a of state.assignments.filter((a) => a.categoryId === id)) {
            removeOtherFeeStructure(a.id)
          }
          return {
            categories: state.categories.filter((c) => c.id !== id),
            assignments: state.assignments.filter((a) => a.categoryId !== id),
          }
        }),
      toggleCategoryActive: (id) =>
        set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)) })),

      addAssignment: (a) => {
        set((state) => ({ assignments: [...state.assignments, a] }))
        syncOtherFeeStructure(a)
      },
      updateAssignment: (id, data) => {
        let updated: OthersIncomeAssignment | undefined
        set((state) => {
          const existing = state.assignments.find((a) => a.id === id)
          if (!existing) return state
          updated = { ...existing, ...data }
          return { assignments: state.assignments.map((a) => (a.id === id ? updated! : a)) }
        })
        if (updated) syncOtherFeeStructure(updated)
      },
      deleteAssignment: (id) => {
        set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) }))
        removeOtherFeeStructure(id)
      },
      toggleAssignmentActive: (id) => {
        let updated: OthersIncomeAssignment | undefined
        set((state) => ({
          assignments: state.assignments.map((a) => {
            if (a.id !== id) return a
            updated = { ...a, isActive: !a.isActive }
            return updated
          }),
        }))
        if (updated) syncOtherFeeStructure(updated)
      },
    }),
    { name: 'edutech-others-income', storage: createNamespacedStorage('edutech-others-income'), version: 1 }
  )
)

registerStoreReset(() => {
  useOthersIncomeStore.setState({ categories: [], assignments: [] })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-others-income_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) {
        const state = parsed.state
        if (Array.isArray(state.assignments)) {
          state.assignments = state.assignments.map(normalizeAssignment)
        }
        useOthersIncomeStore.setState(state)
      }
    }
  } catch { /* ignore */ }
  pruneExpiredOthersIncomeAssignments()
})
