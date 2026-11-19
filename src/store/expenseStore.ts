import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites } from '@/lib/storage'
import { flushVaultWrites } from '@/lib/vault/vault'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { isLocalComputerMode } from '@/lib/storageMode'
import { expensesApi } from '@/lib/api'
import { MONTH_NAMES, MONTH_NAMES_BN } from '@/store/transportStore'

export interface ExpenseCategory {
  id: string
  name: string
  nameBn: string
  icon: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
}

export interface ExpenseEntry {
  id: string
  categoryId: string
  amount: number
  date: string
  description: string
  descriptionBn: string
  paymentMethod: 'cash' | 'bank' | 'mobile'
  isRecurring: boolean
  recurringMonths: number[]
  academicYear: string
  createdBy: string
  createdAt: string
  isActive: boolean
}

export const PREDEFINED_CATEGORIES: ExpenseCategory[] = []

export const LEGACY_DEFAULT_CAT_IDS = new Set([
  'EXP-CAT-001',
  'EXP-CAT-002',
  'EXP-CAT-003',
  'EXP-CAT-004',
  'EXP-CAT-005',
  'EXP-CAT-006',
  'EXP-CAT-007',
  'EXP-CAT-008',
])

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', labelBn: 'নগদ' },
  { value: 'bank', label: 'Bank', labelBn: 'ব্যাংক' },
  { value: 'mobile', label: 'Mobile', labelBn: 'মোবাইল' },
] as const

let catCounter = 100
let expCounter = 100

export function expenseCategoryId(): string {
  catCounter++
  return `EXP-CAT-${String(catCounter).padStart(3, '0')}`
}

export function expenseEntryId(): string {
  expCounter++
  return `EXP-${String(expCounter).padStart(3, '0')}`
}

export function getMonthName(m: number, bn: boolean): string {
  return bn ? MONTH_NAMES_BN[m] : MONTH_NAMES[m]
}

interface ExpenseState {
  categories: ExpenseCategory[]
  expenses: ExpenseEntry[]

  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>

  addCategory: (c: ExpenseCategory) => void
  updateCategory: (id: string, data: Partial<ExpenseCategory>) => void
  deleteCategory: (id: string) => void
  toggleCategoryActive: (id: string) => void

  addExpense: (e: ExpenseEntry) => void
  updateExpense: (id: string, data: Partial<ExpenseEntry>) => void
  deleteExpense: (id: string) => void
  toggleExpenseActive: (id: string) => void
}

let serverSyncTimer: any = null
function queueServerSync(get: () => ExpenseState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    if (!state.serverSynced && state.categories.length === 0 && state.expenses.length === 0) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.categories.length === 0 && s.expenses.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await expensesApi.update({
          categories: s.categories,
          expenses: s.expenses,
        })
      } catch {
        // Warning only
      }
    }, 400)
  } catch {
    /* ignore */
  }
}

function onStateMutated(get: () => ExpenseState) {
  flushPendingWrites()
  void flushVaultWrites()
  queueServerSync(get)
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      categories: [],
      expenses: [],

      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false })
          return
        }
        set({ syncing: true, syncError: null })
        try {
          const res = await expensesApi.get(slugOrId)
          if (res) {
            const hasCats = Array.isArray(res.categories) && res.categories.length > 0
            const hasExps = Array.isArray(res.expenses) && res.expenses.length > 0
            const state = get()

            if (hasCats || hasExps) {
              const categories = hasCats
                ? res.categories!
                : (state.categories || [])
              set({
                categories,
                expenses: res.expenses || [],
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (state.categories.length > 0 || state.expenses.length > 0) {
              await expensesApi.update({
                categories: state.categories,
                expenses: state.expenses,
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
          set({ syncing: false, syncError: err?.message || 'Failed to sync expenses' })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true, syncError: null })
        try {
          const state = get()
          await expensesApi.update({
            categories: state.categories,
            expenses: state.expenses,
          })
          set({ syncing: false, serverSynced: true, syncError: null })
        } catch (err: any) {
          set({ syncing: false, syncError: err?.message || 'Failed to push expenses' })
        }
      },

      addCategory: (c) => {
        set((state) => ({ categories: [...state.categories, c] }))
        onStateMutated(get)
      },
      updateCategory: (id, data) => {
        set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)) }))
        onStateMutated(get)
      },
      deleteCategory: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          expenses: state.expenses.filter((e) => e.categoryId !== id),
        }))
        onStateMutated(get)
      },
      toggleCategoryActive: (id) => {
        set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)) }))
        onStateMutated(get)
      },

      addExpense: (e) => {
        set((state) => ({ expenses: [...state.expenses, e] }))
        onStateMutated(get)
      },
      updateExpense: (id, data) => {
        set((state) => ({ expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) }))
        onStateMutated(get)
      },
      deleteExpense: (id) => {
        markExplicitUserDelete()
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }))
        onStateMutated(get)
      },
      toggleExpenseActive: (id) => {
        set((state) => ({ expenses: state.expenses.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)) }))
        onStateMutated(get)
      },
    }),
    {
      name: 'edutech-expenses',
      storage: createNamespacedStorage('edutech-expenses'),
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState
        const existingExpenses = Array.isArray(persistedState.expenses) ? persistedState.expenses : []
        const usedCatIds = new Set(existingExpenses.map((e: any) => e.categoryId))
        const cleanedCategories = (Array.isArray(persistedState.categories) ? persistedState.categories : [])
          .filter((c: any) => !LEGACY_DEFAULT_CAT_IDS.has(c.id) || usedCatIds.has(c.id))
          .map((c: any) => ({ ...c, isSystem: false }))
        return {
          ...persistedState,
          categories: cleanedCategories,
          expenses: existingExpenses,
        }
      },
    }
  )
)

registerStoreReset(() => {
  useExpenseStore.setState({
    categories: [],
    expenses: [],
    serverSynced: false,
    syncing: false,
    syncError: null,
  })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-expenses_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) {
        const state = parsed.state
        const existingExpenses = Array.isArray(state.expenses) ? state.expenses : []
        const usedCatIds = new Set(existingExpenses.map((e: any) => e.categoryId))
        const cleanedCategories = (Array.isArray(state.categories) ? state.categories : [])
          .filter((c: ExpenseCategory) => !LEGACY_DEFAULT_CAT_IDS.has(c.id) || usedCatIds.has(c.id))
          .map((c: ExpenseCategory) => ({ ...c, isSystem: false }))
        useExpenseStore.setState({
          ...state,
          categories: cleanedCategories,
          expenses: existingExpenses,
        })
      }
    }
  } catch {
    /* ignore */
  }
})
