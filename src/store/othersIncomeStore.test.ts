import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useOthersIncomeStore,
  otherIncomeCategoryId,
  otherIncomeAssignmentId,
  otherFeeStructureId,
} from './othersIncomeStore'
import { useFeeStore } from './feeStore'
import { useAdmissionStore } from './admissionStore'
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
    useFeeStore.setState({
      structures: [],
      payments: [],
      waivers: [],
    })
    useAdmissionStore.setState({
      students: [
        {
          id: 'STU-001',
          nameEn: 'Fahim Mia',
          nameBn: 'ফাহিম মিয়া',
          class: 'Class 10',
          section: 'A',
          roll: '1',
          isActive: true,
        } as any,
      ],
    })
    vi.restoreAllMocks()
  })

  it('adds, updates, toggles, and deletes categories', () => {
    const cat = {
      id: otherIncomeCategoryId(),
      name: 'Day Care',
      nameBn: 'ডে কেয়ার',
      amount: 500,
      type: 'monthly' as const,
      description: 'Monthly day care service',
      descriptionBn: 'মাসিক ডে কেয়ার সুবিধা',
      isActive: true,
      createdAt: '2026-11-07',
    }

    useOthersIncomeStore.getState().addCategory(cat)
    expect(useOthersIncomeStore.getState().categories).toHaveLength(1)
    expect(useOthersIncomeStore.getState().categories[0].name).toBe('Day Care')

    useOthersIncomeStore.getState().updateCategory(cat.id, { amount: 600 })
    expect(useOthersIncomeStore.getState().categories[0].amount).toBe(600)

    useOthersIncomeStore.getState().toggleCategoryActive(cat.id)
    expect(useOthersIncomeStore.getState().categories[0].isActive).toBe(false)

    useOthersIncomeStore.getState().deleteCategory(cat.id)
    expect(useOthersIncomeStore.getState().categories).toHaveLength(0)
  })

  it('adds an assignment and automatically syncs a fee structure into feeStore', () => {
    const cat = {
      id: 'OIC-101',
      name: 'Day Care',
      nameBn: 'ডে কেয়ার',
      amount: 500,
      type: 'monthly' as const,
      description: 'Day care',
      descriptionBn: 'ডে কেয়ার',
      isActive: true,
      createdAt: '2026-11-07',
    }
    useOthersIncomeStore.getState().addCategory(cat)

    const assignment = {
      id: otherIncomeAssignmentId(),
      categoryId: cat.id,
      studentId: 'STU-001',
      months: [10],
      academicYear: '2025-26',
      assignedDate: '2026-11-07',
      isActive: true,
    }
    useOthersIncomeStore.getState().addAssignment(assignment)

    expect(useOthersIncomeStore.getState().assignments).toHaveLength(1)

    // Check feeStore has corresponding fee structure
    const expectedStructId = otherFeeStructureId(assignment.id)
    const struct = useFeeStore.getState().structures.find((s) => s.id === expectedStructId)
    expect(struct).toBeDefined()
    expect(struct?.name).toBe('Day Care')
    expect(struct?.amount).toBe(500)
    expect(struct?.studentId).toBe('STU-001')

    // Delete assignment removes fee structure
    useOthersIncomeStore.getState().deleteAssignment(assignment.id)
    expect(useOthersIncomeStore.getState().assignments).toHaveLength(0)
    expect(useFeeStore.getState().structures.some((s) => s.id === expectedStructId)).toBe(false)
  })

  it('syncs from server when in cloud database mode', async () => {
    const mockData = {
      categories: [
        {
          id: 'OIC-999',
          name: 'Special Coaching',
          nameBn: 'বিশেষ কোচিং',
          amount: 1200,
          type: 'monthly' as const,
          description: '',
          descriptionBn: '',
          isActive: true,
          createdAt: '2026-11-07',
        },
      ],
      assignments: [
        {
          id: 'OIA-999',
          categoryId: 'OIC-999',
          studentId: 'STU-001',
          months: [0, 1],
          academicYear: '2025-26',
          assignedDate: '2026-11-07',
          isActive: true,
        },
      ],
    }

    vi.spyOn(othersIncomeApi, 'get').mockResolvedValue(mockData)

    await useOthersIncomeStore.getState().syncFromServer('demo-school')

    const state = useOthersIncomeStore.getState()
    expect(state.categories).toHaveLength(1)
    expect(state.categories[0].name).toBe('Special Coaching')
    expect(state.assignments).toHaveLength(1)
    expect(state.serverSynced).toBe(true)
  })

  it('skips server sync in local_computer mode', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(othersIncomeApi, 'get')
    const updateSpy = vi.spyOn(othersIncomeApi, 'update')

    await useOthersIncomeStore.getState().syncFromServer('local-school')
    expect(getSpy).not.toHaveBeenCalled()
    expect(useOthersIncomeStore.getState().serverSynced).toBe(true)

    await useOthersIncomeStore.getState().syncToServer()
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('maps vault file paths to others-income namespaced key', () => {
    expect(vaultPathToKey('others-income.json', { slug: 'school' })).toBe('edutech-others-income_school')
    expect(vaultPathToKey('others_income_categories.json', { slug: 'school' })).toBe('edutech-others-income_school')
    expect(vaultPathToKey('others_income_assignments.json', { slug: 'school' })).toBe('edutech-others-income_school')
    expect(vaultPathToKey('school/others-income.json', { slug: 'school' })).toBe('edutech-others-income_school')
  })

  it('normalizes slice and aggregate vault json files into others-income state', () => {
    const rawCategories = [
      { id: 'OIC-V1', name: 'Karate Club', nameBn: 'কারাতে ক্লাব', amount: 800, type: 'monthly' },
    ]
    const normalizedC = normalizeVaultJsonForStore(
      'edutech-others-income_school',
      JSON.stringify(rawCategories),
      undefined,
      'school/others_income_categories.json'
    )
    const parsedC = JSON.parse(normalizedC)
    expect(parsedC.state.categories).toHaveLength(1)
    expect(parsedC.state.categories[0].name).toBe('Karate Club')

    const rawAggregate = {
      categories: [{ id: 'OIC-AGG', name: 'Robotics Workshop', amount: 1500, type: 'onetime' }],
      assignments: [{ id: 'OIA-AGG', categoryId: 'OIC-AGG', studentId: 'STU-001', months: [] }],
    }
    const normalizedAgg = normalizeVaultJsonForStore(
      'edutech-others-income_school',
      JSON.stringify(rawAggregate),
      undefined,
      'school/others-income.json'
    )
    const parsedAgg = JSON.parse(normalizedAgg)
    expect(parsedAgg.state.categories).toHaveLength(1)
    expect(parsedAgg.state.assignments).toHaveLength(1)
    expect(parsedAgg.state.categories[0].name).toBe('Robotics Workshop')
  })
})
