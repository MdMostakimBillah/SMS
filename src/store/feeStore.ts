import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, getSlug } from '@/lib/storage'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { isLocalComputerMode } from '@/lib/storageMode'
import { feesApi } from '@/lib/api'

export interface FeeCategory {
  id: string
  name: string
  nameBn: string
  description: string
  descriptionBn: string
  type: 'monthly' | 'onetime'
  isActive: boolean
  createdAt: string
}

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
  categoryId?: string
  studentId?: string
  applicableMonths?: number[]
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
  receiptNo?: string
}

export function formatReceiptNo(num: number): string {
  return String(num).padStart(6, '0')
}

export function parseReceiptNumber(receiptNo?: string): number | null {
  if (!receiptNo) return null
  const clean = String(receiptNo).trim()
  if (/^\d+$/.test(clean)) {
    const n = parseInt(clean, 10)
    return isNaN(n) ? null : n
  }
  const match = clean.match(/(\d+)/)
  if (match) {
    const n = parseInt(match[1], 10)
    return isNaN(n) ? null : n
  }
  return null
}

export function getNextReceiptNo(payments: FeePayment[]): string {
  let max = 0
  for (const p of payments) {
    const n = parseReceiptNumber(p.receiptNo)
    if (n !== null && n > max) max = n
  }
  return formatReceiptNo(max + 1)
}

export function ensureReceiptNumbers(payments: FeePayment[]): FeePayment[] {
  let needsUpdate = false
  for (const p of payments) {
    if (!p.receiptNo) {
      needsUpdate = true
      break
    }
  }
  if (!needsUpdate) return payments

  let max = 0
  for (const p of payments) {
    const n = parseReceiptNumber(p.receiptNo)
    if (n !== null && n > max) max = n
  }

  const batchMap = new Map<string, string>()
  return payments.map((p) => {
    if (p.receiptNo) return p
    const key = p.batchId || `${p.studentId}__${p.paidAt}__${p.method}`
    if (!batchMap.has(key)) {
      max += 1
      batchMap.set(key, formatReceiptNo(max))
    }
    return {
      ...p,
      receiptNo: batchMap.get(key)!,
    }
  })
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
  notes?: string
  approvedBy: string
  createdAt: string
}

export interface StudentWaiver {
  id: string
  studentId: string
  waiverCategoryId: string
  feeStructureId: string
  mode: 'amount' | 'percent'
  value: number
  academicYear: string
  isActive: boolean
  reason: string
  reasonBn: string
  notes?: string
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
  forMonth?: string
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
  feeCategories: FeeCategory[]
  waiverCategories: WaiverCategory[]
  waiverEntries: WaiverEntry[]
  studentWaivers: StudentWaiver[]

  addFeeCategory: (c: FeeCategory) => void
  updateFeeCategory: (id: string, data: Partial<FeeCategory>) => void
  deleteFeeCategory: (id: string) => void
  toggleFeeCategoryActive: (id: string) => void

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

  addStudentWaiver: (w: StudentWaiver) => void
  updateStudentWaiver: (id: string, data: Partial<StudentWaiver>) => void
  deleteStudentWaiver: (id: string) => void
  toggleStudentWaiverActive: (id: string) => void

  generateWaivers: (students?: StudentInfo[]) => FeeWaiver[]
  calculateDues: (students: StudentInfo[], classId?: string, sectionId?: string, onlyInactive?: boolean) => FeeDue[]
  getStudentPayments: (studentId: string) => FeePayment[]
  getPaymentsByStructure: (structureId: string) => FeePayment[]
  getCollectionSummary: (students?: StudentInfo[]) => {
    totalCollected: number
    totalPending: number
    totalOverdue: number
    totalWaived: number
    collectedThisMonth: number
    paymentCount: number
  }
  getClassWiseSummary: (students: StudentInfo[]) => { className: string; section: string; totalDue: number; totalPaid: number; studentCount: number }[]

  serverSynced: boolean
  syncing: boolean
  syncError: string | null
  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>
}

function computeWaiverAmount(entry: WaiverEntry, feeAmount: number): number {
  if (entry.mode === 'percent') {
    return Math.round(feeAmount * entry.value / 100)
  }
  return entry.value
}

let serverSyncTimer: any = null
function queueServerSync(get: () => FeeState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    // Guard: Never push empty fees to the database during startup or unhydrated state
    if (!state.serverSynced && state.structures.length === 0 && state.payments.length === 0) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.structures.length === 0 && s.payments.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await feesApi.update({
          structures: s.structures,
          payments: s.payments,
          feeCategories: s.feeCategories,
          waiverCategories: s.waiverCategories,
          waiverEntries: s.waiverEntries,
          studentWaivers: s.studentWaivers,
        })
      } catch {
        // Warning only
      }
    }, 400)
  } catch {
    /* ignore */
  }
}

function onStateMutated(get: () => FeeState) {
  queueServerSync(get)
}

export const useFeeStore = create<FeeState>()(
  persist(
    (set, get) => ({
      structures: [],
      payments: [],
      feeCategories: [],
      waiverCategories: [],
      waiverEntries: [],
      studentWaivers: [],
      serverSynced: false,
      syncing: false,
      syncError: null,

      addFeeCategory: (c) => {
        set((state) => ({ feeCategories: [...state.feeCategories, c] }))
        onStateMutated(get)
      },

      updateFeeCategory: (id, data) => {
        set((state) => ({
          feeCategories: state.feeCategories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }))
        onStateMutated(get)
      },

      deleteFeeCategory: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          feeCategories: state.feeCategories.filter((c) => c.id !== id),
          structures: state.structures.map((s) => (s.categoryId === id ? { ...s, categoryId: undefined } : s)),
        }))
        onStateMutated(get)
      },

      toggleFeeCategoryActive: (id) => {
        set((state) => ({
          feeCategories: state.feeCategories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
        }))
        onStateMutated(get)
      },

      addStructure: (s) => {
        set((state) => ({ structures: [...state.structures, s] }))
        onStateMutated(get)
      },

      updateStructure: (id, data) => {
        set((state) => ({
          structures: state.structures.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }))
        onStateMutated(get)
      },

      deleteStructure: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          structures: state.structures.filter((s) => s.id !== id),
          payments: state.payments.filter((p) => p.feeStructureId !== id),
          waiverEntries: state.waiverEntries.filter((e) => e.feeStructureId !== id),
        }))
        onStateMutated(get)
      },

      toggleStructureActive: (id) => {
        set((state) => ({
          structures: state.structures.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
        }))
        onStateMutated(get)
      },

      bulkAddStructures: (newStructures) => {
        set((state) => ({ structures: [...state.structures, ...newStructures] }))
        onStateMutated(get)
      },

      addPayment: (p) => {
        const receiptNo = p.receiptNo || getNextReceiptNo(get().payments)
        set((state) => ({ payments: [...state.payments, { ...p, receiptNo }] }))
        onStateMutated(get)
      },

      deletePayment: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        }))
        onStateMutated(get)
      },

      addWaiverCategory: (c) => {
        set((state) => ({ waiverCategories: [...state.waiverCategories, c] }))
        onStateMutated(get)
      },

      updateWaiverCategory: (id, data) => {
        set((state) => ({
          waiverCategories: state.waiverCategories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }))
        onStateMutated(get)
      },

      deleteWaiverCategory: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          waiverCategories: state.waiverCategories.filter((c) => c.id !== id),
          waiverEntries: state.waiverEntries.filter((e) => e.categoryId !== id),
        }))
        onStateMutated(get)
      },

      toggleWaiverCategoryActive: (id) => {
        set((state) => ({
          waiverCategories: state.waiverCategories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
        }))
        onStateMutated(get)
      },

      addWaiverEntry: (e) => {
        set((state) => ({ waiverEntries: [...state.waiverEntries, e] }))
        onStateMutated(get)
      },

      addWaiverEntries: (entries) => {
        set((state) => ({ waiverEntries: [...state.waiverEntries, ...entries] }))
        onStateMutated(get)
      },

      updateWaiverEntry: (id, data) => {
        set((state) => ({
          waiverEntries: state.waiverEntries.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }))
        onStateMutated(get)
      },

      deleteWaiverEntry: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          waiverEntries: state.waiverEntries.filter((e) => e.id !== id),
        }))
        onStateMutated(get)
      },

      deleteWaiverEntriesByCategory: (categoryId) => {
        markExplicitUserDelete()
        set((state) => ({
          waiverEntries: state.waiverEntries.filter((e) => e.categoryId !== categoryId),
        }))
        onStateMutated(get)
      },

      addStudentWaiver: (w) => {
        set((state) => ({ studentWaivers: [...state.studentWaivers, w] }))
        onStateMutated(get)
      },

      updateStudentWaiver: (id, data) => {
        set((state) => ({
          studentWaivers: state.studentWaivers.map((w) => (w.id === id ? { ...w, ...data } : w)),
        }))
        onStateMutated(get)
      },

      deleteStudentWaiver: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          studentWaivers: state.studentWaivers.filter((w) => w.id !== id),
        }))
        onStateMutated(get)
      },

      toggleStudentWaiverActive: (id) => {
        set((state) => ({
          studentWaivers: state.studentWaivers.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)),
        }))
        onStateMutated(get)
      },

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false })
          return
        }
        set({ syncing: true, syncError: null })
        try {
          const res = await feesApi.get(slugOrId)
          if (res) {
            const hasStructures = Array.isArray(res.structures) && res.structures.length > 0
            const hasPayments = Array.isArray(res.payments) && res.payments.length > 0
            const hasCategories = Array.isArray(res.feeCategories) && res.feeCategories.length > 0
            const hasWaivers = (Array.isArray(res.waiverEntries) && res.waiverEntries.length > 0) || (Array.isArray(res.studentWaivers) && res.studentWaivers.length > 0)
            const state = get()

            if (hasStructures || hasPayments || hasCategories || hasWaivers) {
              set({
                structures: res.structures || [],
                payments: res.payments || [],
                feeCategories: res.feeCategories || [],
                waiverCategories: res.waiverCategories || [],
                waiverEntries: res.waiverEntries || [],
                studentWaivers: res.studentWaivers || [],
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (state.structures.length > 0 || state.payments.length > 0) {
              await feesApi.update({
                structures: state.structures,
                payments: state.payments,
                feeCategories: state.feeCategories,
                waiverCategories: state.waiverCategories,
                waiverEntries: state.waiverEntries,
                studentWaivers: state.studentWaivers,
                schoolId: slugOrId,
              })
              set({ serverSynced: true, syncing: false, syncError: null })
            } else {
              set({ serverSynced: true, syncing: false, syncError: null })
            }
          } else {
            set({ serverSynced: true, syncing: false, syncError: null })
          }
        } catch (err: any) {
          console.warn('[feeStore] syncFromServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to sync fees' })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true })
        try {
          const state = get()
          await feesApi.update({
            structures: state.structures,
            payments: state.payments,
            feeCategories: state.feeCategories,
            waiverCategories: state.waiverCategories,
            waiverEntries: state.waiverEntries,
            studentWaivers: state.studentWaivers,
          })
          set({ serverSynced: true, syncing: false, syncError: null })
        } catch (err: any) {
          console.warn('[feeStore] syncToServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to push fees' })
        }
      },

      generateWaivers: (students?) => {
        const { waiverEntries, structures, studentWaivers } = get()
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

        if (students && students.length > 0) {
          const activeSW = studentWaivers.filter((w) => w.isActive)
          for (const sw of activeSW) {
            const student = students.find((s) => s.id === sw.studentId)
            if (!student) continue
            const structure = structures.find((s) => s.id === sw.feeStructureId)
            if (!structure) continue
            const perPeriod = sw.mode === 'percent' ? Math.round(structure.amount * sw.value / 100) : Math.min(sw.value, structure.amount)
            if (perPeriod <= 0) continue
            if (structure.type === 'monthly') {
              for (let m = 0; m < 12; m++) {
                const now = new Date()
                const year = now.getFullYear()
                const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`
                result.push({
                  id: `SWVR-${sw.id}-${structure.id}-${m}`,
                  studentId: sw.studentId,
                  feeStructureId: structure.id,
                  amount: perPeriod,
                  reason: sw.reason,
                  reasonBn: sw.reasonBn,
                  approvedBy: sw.approvedBy,
                  createdAt: sw.createdAt,
                  forMonth: monthKey,
                })
              }
            } else {
              result.push({
                id: `SWVR-${sw.id}-${structure.id}`,
                studentId: sw.studentId,
                feeStructureId: structure.id,
                amount: perPeriod,
                reason: sw.reason,
                reasonBn: sw.reasonBn,
                approvedBy: sw.approvedBy,
                createdAt: sw.createdAt,
              })
            }
          }
        }

        return result
      },

      calculateDues: (students, classId, sectionId, onlyInactive) => {
        const { structures, payments, generateWaivers } = get()
        const waivers = generateWaivers(students)
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
          const studentStructures = activeStructures.filter(
            (s) => s.class === student.class && (!s.section || s.section === student.section) && (!s.studentId || s.studentId === student.id)
          )

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

      getCollectionSummary: (students?: StudentInfo[]) => {
        const { structures, payments, generateWaivers } = get()
        const waivers = generateWaivers(students)
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
        const waivers = generateWaivers(students)
        const classMap = new Map<string, { totalDue: number; totalPaid: number; studentCount: Set<string> }>()

        for (const student of students) {
          if (student.active === false) continue
          const studentStructures = structures.filter(
            (s) => s.isActive && s.class === student.class && (!s.section || s.section === student.section) && (!s.studentId || s.studentId === student.id)
          )

          for (const fee of studentStructures) {
            const key = `${student.class}__${student.section || ''}`
            if (!classMap.has(key)) {
              classMap.set(key, { totalDue: 0, totalPaid: 0, studentCount: new Set() })
            }
            const entry = classMap.get(key)!
            entry.studentCount.add(student.id)
            const paid = payments.filter((p) => p.studentId === student.id && p.feeStructureId === fee.id).reduce((sum, p) => sum + p.amount, 0)
            const waived = waivers.filter((w) => w.studentId === student.id && w.feeStructureId === fee.id).reduce((sum, w) => sum + w.amount, 0)
            entry.totalPaid += paid + waived
            entry.totalDue += fee.amount
          }
        }

        return Array.from(classMap.entries())
          .map(([key, data]) => {
            const [className, section] = key.split('__')
            return {
              className,
              section,
              totalDue: data.totalDue,
              totalPaid: data.totalPaid,
              studentCount: data.studentCount.size,
            }
          })
          .sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section))
      },
    }),
    {
      name: 'edutech-fees',
      storage: createNamespacedStorage('edutech-fees', undefined, { debounce: true }),
      version: 8,
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
        if (version < 6) {
          persistedState.feeCategories = persistedState.feeCategories || []
        }
        if (version < 7) {
          persistedState.studentWaivers = persistedState.studentWaivers || []
        }
        if (version < 8) {
          persistedState.feeCategories = (persistedState.feeCategories || []).map((c: any) => ({
            ...c,
            type: c.type || 'monthly',
          }))
        }
        return persistedState
      },
        }
  )
)

registerStoreReset(() => {
  useFeeStore.setState({ structures: [], payments: [], feeCategories: [], waiverCategories: [], waiverEntries: [], studentWaivers: [], serverSynced: false, syncing: false, syncError: null })
})

registerStoreLoad(() => {
  const slug = getSlug()
  try {
    const key = slug ? `edutech-fees_${slug}` : 'edutech-fees'
    const raw = localStorage.getItem(key) || (slug ? localStorage.getItem('edutech-fees') : null)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state) useFeeStore.setState(parsed.state)
    }
  } catch {
    /* ignore */
  }
})
