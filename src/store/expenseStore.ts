import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
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
  createdAt: string
  isActive: boolean
}

export const PREDEFINED_CATEGORIES: ExpenseCategory[] = [
  { id: 'EXP-CAT-001', name: 'Salary', nameBn: 'বেতন', icon: 'wallet', isSystem: true, isActive: true, createdAt: '2025-01-01' },
  { id: 'EXP-CAT-002', name: 'Rent', nameBn: 'ভাড়া', icon: 'home', isSystem: true, isActive: true, createdAt: '2025-01-01' },
  { id: 'EXP-CAT-003', name: 'Utilities', nameBn: 'ইউটিলিটি', icon: 'zap', isSystem: true, isActive: true, createdAt: '2025-01-01' },
  { id: 'EXP-CAT-004', name: 'Maintenance', nameBn: 'রক্ষণাবেক্ষণ', icon: 'wrench', isSystem: true, isActive: true, createdAt: '2025-01-01' },
  { id: 'EXP-CAT-005', name: 'Office Supplies', nameBn: 'অফিস সাপ্লাই', icon: 'paperclip', isSystem: true, isActive: true, createdAt: '2025-01-01' },
  { id: 'EXP-CAT-006', name: 'Equipment', nameBn: 'সরঞ্জাম', icon: 'package', isSystem: true, isActive: true, createdAt: '2025-01-01' },
  { id: 'EXP-CAT-007', name: 'Transport', nameBn: 'পরিবহন', icon: 'truck', isSystem: true, isActive: true, createdAt: '2025-01-01' },
  { id: 'EXP-CAT-008', name: 'Others', nameBn: 'অন্যান্য', icon: 'tag', isSystem: true, isActive: true, createdAt: '2025-01-01' },
]

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

  addCategory: (c: ExpenseCategory) => void
  updateCategory: (id: string, data: Partial<ExpenseCategory>) => void
  deleteCategory: (id: string) => void
  toggleCategoryActive: (id: string) => void

  addExpense: (e: ExpenseEntry) => void
  updateExpense: (id: string, data: Partial<ExpenseEntry>) => void
  deleteExpense: (id: string) => void
  toggleExpenseActive: (id: string) => void
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      categories: PREDEFINED_CATEGORIES,
      expenses: [],

      addCategory: (c) => set((state) => ({ categories: [...state.categories, c] })),
      updateCategory: (id, data) =>
        set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          expenses: state.expenses.filter((e) => e.categoryId !== id),
        })),
      toggleCategoryActive: (id) =>
        set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)) })),

      addExpense: (e) => set((state) => ({ expenses: [...state.expenses, e] })),
      updateExpense: (id, data) =>
        set((state) => ({ expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
      deleteExpense: (id) =>
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),
      toggleExpenseActive: (id) =>
        set((state) => ({ expenses: state.expenses.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)) })),
    }),
    { name: 'edutech-expenses', storage: createNamespacedStorage('edutech-expenses'), version: 1 }
  )
)

registerStoreReset(() => {
  useExpenseStore.setState({ categories: [...PREDEFINED_CATEGORIES], expenses: [] })
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
        const existingIds = (state.categories || []).map((c: ExpenseCategory) => c.id)
        const missing = PREDEFINED_CATEGORIES.filter((c) => !existingIds.includes(c.id))
        state.categories = [...(state.categories || []), ...missing]
        useExpenseStore.setState(state)
      }
    }
  } catch { /* ignore */ }
})
