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
  discount: number
  paidAt: string
  method: 'cash' | 'bank' | 'mobile' | 'other'
  reference: string
  note: string
  collectedBy: string
  createdAt: string
  batchId?: string
  forMonth?: string
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
  forMonth?: string
}

export interface WaiverCategory {
  id: string
  name: string
  nameBn: string
  description: string
  descriptionBn: string
  isActive: boolean
  createdAt: string
}

export interface WaiverEntry {
  id: string
  categoryId: string
  studentId: string
  feeStructureId: string
  mode: 'amount' | 'percent'
  value: number
  months: number[]
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
  waiverCategories: WaiverCategory[]
  waiverEntries: WaiverEntry[]

  addStructure: (s: FeeStructure) => void
  updateStructure: (id: string, data: Partial<FeeStructure>) => void
  deleteStructure: (id: string) => void
  toggleStructureActive: (id: string) => void
  bulkAddStructures: (structures: FeeStructure[]) => void

  addPayment: (p: FeePayment) => void
  deletePayment: (id: string) => void

  addWaiverCategory: (c: WaiverCategory) => void
  updateWaiverCategory: (id: string, data: Partial<WaiverCategory>) => void
  deleteWaiverCategory: (id: string) => void
  toggleWaiverCategoryActive: (id: string) => void

  addWaiverEntry: (e: WaiverEntry) => void
  addWaiverEntries: (entries: WaiverEntry[]) => void
  updateWaiverEntry: (id: string, data: Partial<WaiverEntry>) => void
  deleteWaiverEntry: (id: string) => void
  deleteWaiverEntriesByCategory: (categoryId: string) => void

  generateWaivers: () => FeeWaiver[]
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

function computeWaiverAmount(entry: WaiverEntry, feeAmount: number): number {
  if (entry.mode === 'percent') {
    return Math.round(feeAmount * entry.value / 100)
  }
  return entry.value
}

export const useFeeStore = create<FeeState>()(
  persist(
    (set, get) => ({
      structures: [],
      payments: [],
      waiverCategories: [],
      waiverEntries: [],

      addStructure: (s) => set((state) => ({ structures: [...state.structures, s] })),

      updateStructure: (id, data) =>
        set((state) => ({
          structures: state.structures.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),

      deleteStructure: (id) =>
        set((state) => ({
          structures: state.structures.filter((s) => s.id !== id),
          payments: state.payments.filter((p) => p.feeStructureId !== id),
          waiverEntries: state.waiverEntries.filter((e) => e.feeStructureId !== id),
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

      addWaiverCategory: (c) => set((state) => ({ waiverCategories: [...state.waiverCategories, c] })),

      updateWaiverCategory: (id, data) =>
        set((state) => ({
          waiverCategories: state.waiverCategories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      deleteWaiverCategory: (id) =>
        set((state) => ({
          waiverCategories: state.waiverCategories.filter((c) => c.id !== id),
          waiverEntries: state.waiverEntries.filter((e) => e.categoryId !== id),
        })),

      toggleWaiverCategoryActive: (id) =>
        set((state) => ({
          waiverCategories: state.waiverCategories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
        })),

      addWaiverEntry: (e) => set((state) => ({ waiverEntries: [...state.waiverEntries, e] })),

      addWaiverEntries: (entries) => set((state) => ({ waiverEntries: [...state.waiverEntries, ...entries] })),

      updateWaiverEntry: (id, data) =>
        set((state) => ({
          waiverEntries: state.waiverEntries.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      deleteWaiverEntry: (id) =>
        set((state) => ({
          waiverEntries: state.waiverEntries.filter((e) => e.id !== id),
        })),

      deleteWaiverEntriesByCategory: (categoryId) =>
        set((state) => ({
          waiverEntries: state.waiverEntries.filter((e) => e.categoryId !== categoryId),
        })),

      generateWaivers: () => {
        const { waiverEntries, structures } = get()
        const result: FeeWaiver[] = []
        for (const entry of waiverEntries) {
          const structure = structures.find((s) => s.id === entry.feeStructureId)
          if (!structure) continue
          const perPeriod = computeWaiverAmount(entry, structure.amount)
          if (perPeriod <= 0) continue
          if (structure.type === 'monthly') {
            for (const m of entry.months) {
              const now = new Date()
              const year = now.getFullYear()
              const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`
              result.push({
                id: `WVR-${entry.id}-${m}`,
                studentId: entry.studentId,
                feeStructureId: entry.feeStructureId,
                amount: perPeriod,
                reason: entry.reason,
                reasonBn: entry.reasonBn,
                approvedBy: entry.approvedBy,
                createdAt: entry.createdAt,
                forMonth: monthKey,
              })
            }
          } else {
            result.push({
              id: `WVR-${entry.id}`,
              studentId: entry.studentId,
              feeStructureId: entry.feeStructureId,
              amount: perPeriod,
              reason: entry.reason,
              reasonBn: entry.reasonBn,
              approvedBy: entry.approvedBy,
              createdAt: entry.createdAt,
            })
          }
        }
        return result
      },

      calculateDues: (students, classId, sectionId, onlyInactive) => {
        const { structures, payments, generateWaivers } = get()
        const waivers = generateWaivers()
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
        const { structures, payments, generateWaivers } = get()
        const waivers = generateWaivers()
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
          const totalWaivedForStruct = structWaivers.reduce((sum, w) => sum + w.amount, 0)
          const remaining = s.amount - totalPaid - totalWaivedForStruct
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
        const { structures, payments, generateWaivers } = get()
        const waivers = generateWaivers()
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
      version: 5,
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
        if (version < 4) {
          persistedState.payments = (persistedState.payments || []).map((p: any) => ({
            ...p,
            discount: p.discount || 0,
          }))
        }
        if (version < 5) {
          const oldWaivers: any[] = persistedState.waivers || []
          const categories: WaiverCategory[] = []
          const entries: WaiverEntry[] = []
          const groupMap = new Map<string, { category: WaiverCategory; entryMap: Map<string, WaiverEntry> }>()

          for (const w of oldWaivers) {
            const groupKey = w.reason || 'Default'
            if (!groupMap.has(groupKey)) {
              const cat: WaiverCategory = {
                id: `WCAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                name: groupKey,
                nameBn: w.reasonBn || groupKey,
                description: `Migrated from old waivers`,
                descriptionBn: `পুরাতন ছাড় থেকে মাইগ্রেট`,
                isActive: true,
                createdAt: w.createdAt,
              }
              categories.push(cat)
              groupMap.set(groupKey, { category: cat, entryMap: new Map() })
            }
            const group = groupMap.get(groupKey)!
            const entryKey = `${w.studentId}-${w.feeStructureId}`

            if (group.entryMap.has(entryKey)) {
              const existing = group.entryMap.get(entryKey)!
              if (w.forMonth) {
                const monthIdx = parseInt(w.forMonth.split('-')[1]) - 1
                if (!existing.months.includes(monthIdx)) {
                  existing.months.push(monthIdx)
                }
              }
            } else {
              const entry: WaiverEntry = {
                id: `WENT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                categoryId: group.category.id,
                studentId: w.studentId,
                feeStructureId: w.feeStructureId,
                mode: 'amount',
                value: w.amount,
                months: w.forMonth ? [parseInt(w.forMonth.split('-')[1]) - 1] : [],
                reason: w.reason,
                reasonBn: w.reasonBn || '',
                approvedBy: w.approvedBy,
                createdAt: w.createdAt,
              }
              entries.push(entry)
              group.entryMap.set(entryKey, entry)
            }
          }

          persistedState.waiverCategories = categories
          persistedState.waiverEntries = entries
          delete persistedState.waivers
        }
        return persistedState
      },
    }
  )
)
