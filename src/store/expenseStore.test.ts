import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useExpenseStore, PREDEFINED_CATEGORIES } from './expenseStore'
import { expensesApi } from '@/lib/api'
import { normalizeVaultJsonForStore, vaultPathToKey } from '@/lib/vault/mapping'

describe('expenseStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useExpenseStore.persist?.clearStorage()
    useExpenseStore.setState({
      categories: [...PREDEFINED_CATEGORIES],
      expenses: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('adds, updates, toggles, and deletes expense categories', () => {
    const cat = {
      id: 'EXP-CAT-TEST',
      name: 'Internet & WiFi',
      nameBn: 'ইন্টারনেট ও ওয়াইফাই',
      icon: 'zap',
      isSystem: false,
      isActive: true,
      createdAt: '2026-11-06',
    }

    useExpenseStore.getState().addCategory(cat)
    expect(useExpenseStore.getState().categories.some((c) => c.id === 'EXP-CAT-TEST')).toBe(true)

    useExpenseStore.getState().updateCategory('EXP-CAT-TEST', { name: 'Broadband Internet' })
    expect(useExpenseStore.getState().categories.find((c) => c.id === 'EXP-CAT-TEST')?.name).toBe('Broadband Internet')

    useExpenseStore.getState().toggleCategoryActive('EXP-CAT-TEST')
    expect(useExpenseStore.getState().categories.find((c) => c.id === 'EXP-CAT-TEST')?.isActive).toBe(false)

    useExpenseStore.getState().deleteCategory('EXP-CAT-TEST')
    expect(useExpenseStore.getState().categories.some((c) => c.id === 'EXP-CAT-TEST')).toBe(false)
  })

  it('adds, updates, toggles, and deletes expense entries', () => {
    const entry = {
      id: 'EXP-TEST-001',
      categoryId: 'EXP-CAT-003',
      amount: 4500,
      date: '2026-11-06',
      description: 'Electricity bill November',
      descriptionBn: 'বিদ্যুৎ বিল নভেম্বর',
      paymentMethod: 'bank' as const,
      isRecurring: true,
      recurringMonths: [10],
      academicYear: '2025-26',
      createdBy: 'Admin',
      createdAt: '2026-11-06',
      isActive: true,
    }

    useExpenseStore.getState().addExpense(entry)
    expect(useExpenseStore.getState().expenses).toHaveLength(1)
    expect(useExpenseStore.getState().expenses[0].amount).toBe(4500)

    useExpenseStore.getState().updateExpense('EXP-TEST-001', { amount: 5000 })
    expect(useExpenseStore.getState().expenses[0].amount).toBe(5000)

    useExpenseStore.getState().toggleExpenseActive('EXP-TEST-001')
    expect(useExpenseStore.getState().expenses[0].isActive).toBe(false)

    useExpenseStore.getState().deleteExpense('EXP-TEST-001')
    expect(useExpenseStore.getState().expenses).toHaveLength(0)
  })

  it('syncs expenses from backend when server returns data', async () => {
    const mockData = {
      categories: [
        { id: 'EXP-CAT-001', name: 'Teacher Salary', nameBn: 'শিক্ষক বেতন', icon: 'wallet', isSystem: true, isActive: true, createdAt: '2026-11-06' },
      ],
      expenses: [
        {
          id: 'EXP-101',
          categoryId: 'EXP-CAT-001',
          amount: 25000,
          date: '2026-11-01',
          description: 'Monthly Salary',
          descriptionBn: 'মাসিক বেতন',
          paymentMethod: 'bank' as const,
          isRecurring: true,
          recurringMonths: [10],
          academicYear: '2025-26',
          createdBy: 'Principal',
          createdAt: '2026-11-01',
          isActive: true,
        },
      ],
    }

    vi.spyOn(expensesApi, 'get').mockResolvedValue(mockData)

    await useExpenseStore.getState().syncFromServer('test-school')

    const state = useExpenseStore.getState()
    expect(state.categories).toHaveLength(1)
    expect(state.categories[0].name).toBe('Teacher Salary')
    expect(state.expenses).toHaveLength(1)
    expect(state.serverSynced).toBe(true)
  })

  it('skips server sync in local_computer mode', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(expensesApi, 'get')
    const updateSpy = vi.spyOn(expensesApi, 'update')

    await useExpenseStore.getState().syncFromServer('local-school')
    expect(getSpy).not.toHaveBeenCalled()
    expect(useExpenseStore.getState().serverSynced).toBe(true)

    await useExpenseStore.getState().syncToServer()
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('maps vault paths to expenses key', () => {
    expect(vaultPathToKey('expense_categories.json', { slug: 'school' })).toBe('edutech-expenses_school')
    expect(vaultPathToKey('expense_entries.json', { slug: 'school' })).toBe('edutech-expenses_school')
    expect(vaultPathToKey('school/expenses.json', { slug: 'school' })).toBe('edutech-expenses_school')
  })

  it('normalizes slice and aggregate vault json files into expenses state', () => {
    const rawCategories = [
      { id: 'EXP-CAT-VAULT', name: 'Sports Gear', nameBn: 'খেলাধুলার সরঞ্জাম', icon: 'package', isSystem: false },
    ]
    const normalizedC = normalizeVaultJsonForStore(
      'edutech-expenses_school',
      JSON.stringify(rawCategories),
      undefined,
      'school/expense_categories.json'
    )
    const parsedC = JSON.parse(normalizedC)
    expect(parsedC.state.categories).toHaveLength(1)
    expect(parsedC.state.categories[0].name).toBe('Sports Gear')

    const rawAggregate = {
      categories: [{ id: 'EXP-CAT-AGG', name: 'Software Licenses', icon: 'cpu', isSystem: false }],
      expenses: [{ id: 'EXP-AGG-1', categoryId: 'EXP-CAT-AGG', amount: 12000, date: '2026-11-06', paymentMethod: 'bank' }],
    }
    const normalizedAgg = normalizeVaultJsonForStore(
      'edutech-expenses_school',
      JSON.stringify(rawAggregate),
      undefined,
      'school/expenses.json'
    )
    const parsedAgg = JSON.parse(normalizedAgg)
    expect(parsedAgg.state.categories).toHaveLength(1)
    expect(parsedAgg.state.expenses).toHaveLength(1)
    expect(parsedAgg.state.expenses[0].amount).toBe(12000)
  })
})
