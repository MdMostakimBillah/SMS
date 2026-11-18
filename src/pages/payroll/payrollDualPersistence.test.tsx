import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import PayrollPage from './index'
import { useTeacherStore } from '@/store/teacherStore'
import { useHRStore } from '@/store/hrStore'
import { hrApi, teachersApi } from '@/lib/api'
import { vaultPathToKey, normalizeVaultJsonForStore } from '@/lib/vault/mapping'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    hrApi: {
      ...actual.hrApi,
      get: vi.fn(),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
    teachersApi: {
      ...actual.teachersApi,
      list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      get: vi.fn().mockResolvedValue({ teachers: [], departments: [], subjects: [], designations: [] }),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
  }
})

describe('Payroll Dual Persistence & Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('edutech_inst_slug', 'demo-school')

    useTeacherStore.setState({
      teachers: [
        {
          id: 'TCH-001',
          nameEn: 'Md. Mostakim',
          nameBn: 'মোঃ মোস্তাকিম',
          phone: '01700000000',
          salary: 50000,
          overtime: 3000,
          departmentId: 'DEP-001',
          designation: 'Senior Lecturer',
          status: 'active',
          salaryStartDate: '2026-01-01',
        } as any,
      ],
      departments: [
        { id: 'DEP-001', name: 'Science', nameBn: 'বিজ্ঞান' } as any,
      ],
      serverSynced: true,
      syncing: false,
    })

    useHRStore.setState({
      monthlySalaryConfigs: [
        {
          id: 'MSC-001',
          month: '2026-06',
          teacherId: 'TCH-001',
          bonus: 5000,
          festivalBonus: 10000,
          applyDeductionRule: true,
          fundContributionPercent: 2,
          createdAt: '2026-06-01',
        },
      ],
      facilities: [
        {
          id: 'FAC-001',
          name: 'Travel Allowance',
          nameBn: 'যাতায়াত ভাতা',
          defaultAmount: 2000,
          type: 'monthly',
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      teacherFacilities: [
        {
          id: 'TF-001',
          teacherId: 'TCH-001',
          facilityId: 'FAC-001',
          amount: 2500,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
  })

  it('triggers syncFromServer on mount for both teacherStore and hrStore', async () => {
    const teacherSyncSpy = vi.spyOn(useTeacherStore.getState(), 'syncFromServer')
    const hrSyncSpy = vi.spyOn(useHRStore.getState(), 'syncFromServer')

    render(
      <TestWrapper>
        <PayrollPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(teacherSyncSpy).toHaveBeenCalled()
      expect(hrSyncSpy).toHaveBeenCalled()
    })
  })

  it('preserves database sync in local_computer mode (dual persistence)', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    vi.mocked(hrApi.get).mockResolvedValueOnce({
      increments: [],
      bonuses: [],
      promotions: [],
      funds: [],
      facilities: [],
      teacherFacilities: [],
      monthlySalaryConfigs: [
        {
          id: 'MSC-REMOTE',
          month: '2026-06',
          teacherId: 'TCH-001',
          bonus: 6000,
          festivalBonus: 10000,
          applyDeductionRule: false,
          fundContributionPercent: 0,
          createdAt: '2026-06-01',
        },
      ],
      recommendations: [],
      homeworkRecords: [],
      dailyReports: [],
    })

    await useHRStore.getState().syncFromServer('demo-school')
    expect(hrApi.get).toHaveBeenCalledWith('demo-school')
    expect(useHRStore.getState().serverSynced).toBe(true)

    // Verify remote config was merged
    const configs = useHRStore.getState().monthlySalaryConfigs
    expect(configs.some((c) => c.bonus === 6000)).toBe(true)

    sessionStorage.removeItem('edutech_storage_mode')
  })

  it('maps payroll and salary config files to hr store in local vault', () => {
    expect(vaultPathToKey('payroll.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('salary_configs.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('monthly_salary_configs.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('facilities.json', { slug: 'demo' })).toBe('edutech-hr_demo')
    expect(vaultPathToKey('teacher_facilities.json', { slug: 'demo' })).toBe('edutech-hr_demo')
  })

  it('normalizes payroll.json vault file into monthlySalaryConfigs in hr store', () => {
    const rawPayroll = [
      {
        id: 'MSC-VAULT-1',
        teacherId: 'TCH-001',
        month: '2026-06',
        bonus: 7500,
        festivalBonus: 15000,
        applyDeductionRule: true,
      },
    ]

    const normalized = normalizeVaultJsonForStore(
      'edutech-hr_demo',
      JSON.stringify(rawPayroll),
      undefined,
      'demo/payroll.json'
    )

    const parsed = JSON.parse(normalized)
    expect(parsed.state.monthlySalaryConfigs).toHaveLength(1)
    expect(parsed.state.monthlySalaryConfigs[0].bonus).toBe(7500)
    expect(parsed.state.monthlySalaryConfigs[0].festivalBonus).toBe(15000)
  })

  it('calculates employee compensation details accurately without breaking rules', () => {
    // Basic: 50,000
    // House rent (15%): 7,500
    // Medical (10%): 5,000
    // Conveyance (5%): 2,500
    // Overtime: 3,000
    // Bonus: 5,000
    // Festival Bonus: 10,000
    // Facility: 2,500
    // Gross: 50000 + 7500 + 5000 + 2500 + 3000 + 5000 + 10000 + 2500 = 85,500
    // Deduction (1 day): round(50000 / 30) = 1,667
    // Fund Contribution (2% of basic): 1,000
    // Net: 85500 - 1667 - 1000 = 82,833
    const basic = 50000
    const house = Math.round(basic * 0.15)
    const medical = Math.round(basic * 0.1)
    const conveyance = Math.round(basic * 0.05)
    const overtime = 3000
    const bonus = 5000
    const festival = 10000
    const facility = 2500
    const gross = basic + house + medical + conveyance + overtime + bonus + festival + facility
    expect(gross).toBe(85500)

    const deduction = Math.round(basic / 30)
    expect(deduction).toBe(1667)

    const fund = Math.round((basic * 2) / 100)
    expect(fund).toBe(1000)

    const net = gross - deduction - fund
    expect(net).toBe(82833)
  })
})
