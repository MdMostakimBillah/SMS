import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHRStore } from '@/store/hrStore'
import { useTeacherStore } from '@/store/teacherStore'
import { hrApi, teachersApi } from '@/lib/api'
import { normalizeVaultJsonForStore, vaultPathToKey } from '@/lib/vault/mapping'

vi.mock('@/lib/api', () => ({
  hrApi: {
    get: vi.fn(),
    update: vi.fn().mockResolvedValue({ success: true }),
  },
  teachersApi: {
    update: vi.fn().mockResolvedValue({ success: true }),
  },
}))

describe('HR Store & Backend Database Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('edutech_inst_slug', 'demo')

    useHRStore.setState({
      increments: [],
      bonuses: [],
      promotions: [],
      funds: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [],
      teacherFacilities: [],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
  })

  it('connects all HR mutations to queueServerSync in Cloud mode', async () => {
    // 1. Add increment
    useHRStore.getState().addIncrement({
      id: 'INC-1',
      teacherId: 'T-1',
      type: 'annual',
      amount: 2000,
      percentage: 5,
      reason: 'Annual Increment',
      date: '2026-06-01',
    })

    // 2. Add bonus
    useHRStore.getState().addBonus({
      id: 'BON-1',
      teacherId: 'T-1',
      type: 'festival',
      amount: 10000,
      month: '2026-06',
      reason: 'Eid Bonus',
      date: '2026-06-01',
    })

    // 3. Add promotion
    useHRStore.getState().addPromotion({
      id: 'PRO-1',
      teacherId: 'T-1',
      fromDesignation: 'Assistant Teacher',
      toDesignation: 'Senior Teacher',
      date: '2026-06-01',
      reason: 'Good Performance',
    })

    // 4. Add fund
    useHRStore.getState().addFund({
      id: 'FND-1',
      type: 'contribution',
      amount: 5000,
      description: 'Monthly contribution',
      date: '2026-06-01',
    })

    // 5. Add facility
    useHRStore.getState().addFacility({
      id: 'FAC-1',
      name: 'House Rent',
      nameBn: 'বাড়ি ভাড়া',
      defaultAmount: 5000,
      type: 'monthly',
      isActive: true,
      createdAt: '2026-06-01',
      updatedAt: '2026-06-01',
    })

    // 6. Assign teacher facility
    useHRStore.getState().assignTeacherFacility({
      id: 'TF-1',
      teacherId: 'T-1',
      facilityId: 'FAC-1',
      amount: 5000,
      createdAt: '2026-06-01',
      updatedAt: '2026-06-01',
    })

    // 7. Upsert monthly salary config
    useHRStore.getState().upsertMonthlySalaryConfig({
      id: 'MSC-1',
      month: '2026-06',
      teacherId: 'T-1',
      bonus: 10000,
      festivalBonus: 5000,
      applyDeductionRule: true,
      fundContributionPercent: 2,
      createdAt: '2026-06-01',
    })

    // Wait for debounce timer (400ms)
    await new Promise((r) => setTimeout(r, 450))

    expect(hrApi.update).toHaveBeenCalled()
    const lastCall = vi.mocked(hrApi.update).mock.calls[vi.mocked(hrApi.update).mock.calls.length - 1][0]
    expect(lastCall.increments).toHaveLength(1)
    expect(lastCall.bonuses).toHaveLength(1)
    expect(lastCall.promotions).toHaveLength(1)
    expect(lastCall.funds).toHaveLength(1)
    expect(lastCall.facilities).toHaveLength(1)
    expect(lastCall.teacherFacilities).toHaveLength(1)
    expect(lastCall.monthlySalaryConfigs).toHaveLength(1)
  })

  it('updates records properly without duplicating (edit mode)', async () => {
    useHRStore.getState().addIncrement({
      id: 'INC-1',
      teacherId: 'T-1',
      type: 'annual',
      amount: 2000,
      percentage: 5,
      reason: 'Old Reason',
      date: '2026-06-01',
    })

    useHRStore.getState().updateIncrement('INC-1', {
      percentage: 10,
      amount: 4000,
      reason: 'Updated Reason',
    })

    const state = useHRStore.getState()
    expect(state.increments).toHaveLength(1)
    expect(state.increments[0].percentage).toBe(10)
    expect(state.increments[0].amount).toBe(4000)
    expect(state.increments[0].reason).toBe('Updated Reason')
  })

  it('syncs all 10 HR fields from backend into store via syncFromServer', async () => {
    vi.mocked(hrApi.get).mockResolvedValueOnce({
      increments: [{ id: 'INC-1', teacherId: 'T-1', type: 'annual', amount: 3000, percentage: 6, reason: 'Annual', date: '2026-01-01' }],
      bonuses: [{ id: 'BON-1', teacherId: 'T-1', type: 'festival', amount: 5000, month: '2026-06', reason: 'Eid', date: '2026-06-01' }],
      promotions: [{ id: 'PRO-1', teacherId: 'T-1', fromDesignation: 'AT', toDesignation: 'ST', date: '2026-01-01', reason: 'Merit' }],
      funds: [{ id: 'FND-1', type: 'contribution', amount: 2000, description: 'Club', date: '2026-01-01' }],
      facilities: [{ id: 'FAC-1', name: 'Transport', nameBn: 'পরিবহন', defaultAmount: 1500, type: 'monthly', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      teacherFacilities: [{ id: 'TF-1', teacherId: 'T-1', facilityId: 'FAC-1', amount: 1500, createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      monthlySalaryConfigs: [{ id: 'MSC-1', month: '2026-06', teacherId: 'T-1', bonus: 5000, festivalBonus: 0, applyDeductionRule: false, fundContributionPercent: 1, createdAt: '2026-06-01' }],
      recommendations: [{ id: 'REC-1', teacherId: 'T-1', type: 'bonus', score: 95, reason: 'Top performer', status: 'pending', createdAt: '2026-06-01' }],
      homeworkRecords: [{ id: 'HW-1', teacherId: 'T-1', classId: 'C-1', sectionId: 'S-1', subject: 'Math', date: '2026-06-01', submitted: true }],
      dailyReports: [{ id: 'DR-1', teacherId: 'T-1', date: '2026-06-01', submitted: true, classId: 'C-1', studentCount: 40, avgScore: 85 }],
    })

    await useHRStore.getState().syncFromServer('demo')

    const state = useHRStore.getState()
    expect(state.increments).toHaveLength(1)
    expect(state.bonuses).toHaveLength(1)
    expect(state.promotions).toHaveLength(1)
    expect(state.funds).toHaveLength(1)
    expect(state.facilities).toHaveLength(1)
    expect(state.teacherFacilities).toHaveLength(1)
    expect(state.monthlySalaryConfigs).toHaveLength(1)
    expect(state.recommendations).toHaveLength(1)
    expect(state.homeworkRecords).toHaveLength(1)
    expect(state.dailyReports).toHaveLength(1)
  })

  it('updates teacher designation on server when promotion is executed', () => {
    useTeacherStore.setState({
      teachers: [
        {
          id: 'T-10',
          nameEn: 'Karim Uddin',
          status: 'active',
          designation: 'Lecturer',
          departmentId: 'D-1',
          basicSalary: 30000,
        } as any,
      ],
    })

    useTeacherStore.getState().bulkUpdateTeachers([
      { id: 'T-10', data: { designation: 'Assistant Professor' } },
    ])

    expect(teachersApi.update).toHaveBeenCalledWith('T-10', { designation: 'Assistant Professor' })
    expect(useTeacherStore.getState().teachers[0].designation).toBe('Assistant Professor')
  })
})

describe('HR Local PC Storage Vault Integration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('edutech_inst_slug', 'demo')
  })

  it('correctly maps vault slice file paths to edutech-hr store key', () => {
    expect(vaultPathToKey('demo/hr.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_facilities.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_increments.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_bonuses.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_promotions.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_funds.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_teacher_facilities.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/teacher_facilities.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_salary_configs.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/monthly_salary_configs.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('demo/hr_recommendations.json', { slug: 'demo' })).toBe('edutech-hr_demo')
  })

  it('normalizes slice files correctly for edutech-hr without data loss', () => {
    // Seed initial state in localStorage
    localStorage.setItem(
      'edutech-hr_demo',
      JSON.stringify({
        state: {
          increments: [{ id: 'INC-1', percentage: 5 }],
          bonuses: [{ id: 'BON-1', amount: 5000, month: '2026-06' }],
          facilities: [{ id: 'FAC-1', name: 'Housing', defaultAmount: 4000 }],
          teacherFacilities: [],
          monthlySalaryConfigs: [],
        },
        version: 1,
      })
    )

    // 1. Normalize teacher facilities slice file
    const tfJson = JSON.stringify([
      { id: 'TF-1', teacherId: 'T-1', facilityId: 'FAC-1', amount: 4000 },
    ])
    const normalizedTf = normalizeVaultJsonForStore('edutech-hr_demo', tfJson, 'demo/hr_teacher_facilities.json')
    const parsedTf = JSON.parse(normalizedTf)
    expect(parsedTf.state.teacherFacilities).toHaveLength(1)
    expect(parsedTf.state.teacherFacilities[0].facilityId).toBe('FAC-1')
    expect(parsedTf.state.increments).toHaveLength(1) // Existing increments preserved

    // 2. Normalize monthly salary configs slice file
    const scJson = JSON.stringify([
      { id: 'MSC-1', teacherId: 'T-1', month: '2026-06', bonus: 5000, festivalBonus: 0, applyDeductionRule: true },
    ])
    const normalizedSc = normalizeVaultJsonForStore('edutech-hr_demo', scJson, 'demo/hr_salary_configs.json')
    const parsedSc = JSON.parse(normalizedSc)
    expect(parsedSc.state.monthlySalaryConfigs).toHaveLength(1)
    expect(parsedSc.state.monthlySalaryConfigs[0].month).toBe('2026-06')
    expect(parsedSc.state.bonuses).toHaveLength(1) // Existing bonuses preserved

    // 3. Normalize recommendations slice file
    const recJson = JSON.stringify([
      { id: 'REC-1', teacherId: 'T-1', type: 'bonus', score: 90, status: 'pending' },
    ])
    const normalizedRec = normalizeVaultJsonForStore('edutech-hr_demo', recJson, 'demo/hr_recommendations.json')
    const parsedRec = JSON.parse(normalizedRec)
    expect(parsedRec.state.recommendations).toHaveLength(1)
    expect(parsedRec.state.recommendations[0].score).toBe(90)
  })
})
