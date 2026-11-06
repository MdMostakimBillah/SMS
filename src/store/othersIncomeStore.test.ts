import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOthersIncomeStore } from './othersIncomeStore'
import { othersIncomeApi } from '@/lib/api'
import { normalizeVaultJsonForStore, vaultPathToKey } from '@/lib/vault/mapping'

describe('othersIncomeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useOthersIncomeStore.persist?.clearStorage()
    useOthersIncomeStore.setState({
      categories: [],
      assignments: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('adds, updates, and deletes categories', () => {
    const cat = {
      id: 'OIC-101',
      name: 'Lab Development Fee',
      nameBn: 'ল্যাব উন্নয়ন ফি',
      amount: 1500,
      type: 'monthly' as const,
      totalMonths: [0, 1, 2, 3, 4, 5],
      description: 'Science and computer lab fee',
      descriptionBn: 'বিজ্ঞান ও কম্পিউটার ল্যাব ফি',
      isActive: true,
      createdAt: '2026-11-06',
    }

    useOthersIncomeStore.getState().addCategory(cat)
    expect(useOthersIncomeStore.getState().categories).toHaveLength(1)
    expect(useOthersIncomeStore.getState().categories[0].name).toBe('Lab Development Fee')

    useOthersIncomeStore.getState().updateCategory('OIC-101', { amount: 1800 })
    expect(useOthersIncomeStore.getState().categories[0].amount).toBe(1800)

    useOthersIncomeStore.getState().toggleCategoryActive('OIC-101')
    expect(useOthersIncomeStore.getState().categories[0].isActive).toBe(false)
  })

  it('adds, updates, and deletes student assignments', () => {
    const assignment = {
      id: 'OIA-101',
      categoryId: 'OIC-101',
      studentId: 'ST-005',
      months: [0, 1, 2],
      academicYear: '2026-27',
      assignedDate: '2026-11-06',
      isActive: true,
    }

    useOthersIncomeStore.getState().addAssignment(assignment)
    expect(useOthersIncomeStore.getState().assignments).toHaveLength(1)
    expect(useOthersIncomeStore.getState().assignments[0].studentId).toBe('ST-005')

    useOthersIncomeStore.getState().updateAssignment('OIA-101', { months: [0, 1, 2, 3] })
    expect(useOthersIncomeStore.getState().assignments[0].months).toHaveLength(4)

    useOthersIncomeStore.getState().deleteAssignment('OIA-101')
    expect(useOthersIncomeStore.getState().assignments).toHaveLength(0)
  })

  it('syncs others income from backend when server returns data', async () => {
    const mockData = {
      categories: [{ id: 'OIC-1', name: 'Scout Fee', nameBn: 'স্কাউট ফি', amount: 300, type: 'onetime' as const, description: '', descriptionBn: '', isActive: true, createdAt: '2026-11-06' }],
      assignments: [{ id: 'OIA-1', categoryId: 'OIC-1', studentId: 'S-99', months: [0], academicYear: '2026-27', assignedDate: '2026-11-06', isActive: true }],
    }

    vi.spyOn(othersIncomeApi, 'get').mockResolvedValue(mockData)

    await useOthersIncomeStore.getState().syncFromServer('test-school')

    const state = useOthersIncomeStore.getState()
    expect(state.categories).toHaveLength(1)
    expect(state.categories[0].name).toBe('Scout Fee')
    expect(state.assignments).toHaveLength(1)
    expect(state.serverSynced).toBe(true)
  })

  it('correctly maps vault paths to others-income key', () => {
    expect(vaultPathToKey('others_income_categories.json', { slug: 'demo' })).toBe('edutech-others-income_demo')
    expect(vaultPathToKey('others_income_assignments.json', { slug: 'demo' })).toBe('edutech-others-income_demo')
    expect(vaultPathToKey('demo/others-income.json', { slug: 'demo' })).toBe('edutech-others-income_demo')
  })

  it('normalizes slice and aggregate vault json files into others-income state', () => {
    const rawCategories = [
      { id: 'OIC-CAT1', name: 'Sports Fee', amount: 500, type: 'onetime' },
    ]
    const normalizedC = normalizeVaultJsonForStore(
      'edutech-others-income_demo',
      JSON.stringify(rawCategories),
      undefined,
      'demo/others_income_categories.json',
    )
    const parsedC = JSON.parse(normalizedC)
    expect(parsedC.state.categories).toHaveLength(1)
    expect(parsedC.state.categories[0].name).toBe('Sports Fee')

    const rawAggregate = {
      categories: [{ id: 'OIC-AGG', name: 'Tour Fee', amount: 2000, type: 'onetime' }],
      assignments: [{ id: 'OIA-AGG', categoryId: 'OIC-AGG', studentId: 'S-1' }],
    }
    const normalizedAgg = normalizeVaultJsonForStore(
      'edutech-others-income_demo',
      JSON.stringify(rawAggregate),
      undefined,
      'demo/others-income.json',
    )
    const parsedAgg = JSON.parse(normalizedAgg)
    expect(parsedAgg.state.categories).toHaveLength(1)
    expect(parsedAgg.state.assignments).toHaveLength(1)
  })
})
