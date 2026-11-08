import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHRStore } from './hrStore'
import { hrApi } from '@/lib/api'
import { vaultPathToKey, normalizeVaultJsonForStore } from '@/lib/vault/mapping'

describe('hrStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
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
    })
  })

  it('addIncrement / deleteIncrement', () => {
    useHRStore.getState().addIncrement({ id: 'INC-1', teacherId: 'TCH-1', type: 'annual', amount: 5000, percentage: 8, reason: 'test', date: '2026-01-01', approvedBy: 'Admin' })
    expect(useHRStore.getState().increments).toHaveLength(1)
    useHRStore.getState().deleteIncrement('INC-1')
    expect(useHRStore.getState().increments).toHaveLength(0)
  })

  it('addBonus / deleteBonus', () => {
    useHRStore.getState().addBonus({ id: 'BON-1', teacherId: 'TCH-1', type: 'festival', amount: 10000, month: '2026-04', reason: 'test', date: '2026-04-10' })
    expect(useHRStore.getState().bonuses).toHaveLength(1)
    useHRStore.getState().deleteBonus('BON-1')
    expect(useHRStore.getState().bonuses).toHaveLength(0)
  })

  it('addPromotion / deletePromotion', () => {
    useHRStore.getState().addPromotion({ id: 'PRO-1', teacherId: 'TCH-1', fromDesignation: 'Lecturer', toDesignation: 'Prof', date: '2026-07-01', reason: 'test' })
    expect(useHRStore.getState().promotions).toHaveLength(1)
    useHRStore.getState().deletePromotion('PRO-1')
    expect(useHRStore.getState().promotions).toHaveLength(0)
  })

  it('addFund / deleteFund', () => {
    useHRStore.getState().addFund({ id: 'FND-1', type: 'contribution', amount: 100000, description: 'test', date: '2026-05-01' })
    expect(useHRStore.getState().funds).toHaveLength(1)
    useHRStore.getState().deleteFund('FND-1')
    expect(useHRStore.getState().funds).toHaveLength(0)
  })

  it('addHomeworkRecord / toggleHomework', () => {
    useHRStore.getState().addHomeworkRecord({ id: 'HW-1', teacherId: 'TCH-1', classId: 'CLS-1', sectionId: 'SEC-1', subject: 'Math', date: '2026-06-01', submitted: false })
    expect(useHRStore.getState().homeworkRecords[0].submitted).toBe(false)
    useHRStore.getState().toggleHomework('HW-1')
    expect(useHRStore.getState().homeworkRecords[0].submitted).toBe(true)
    useHRStore.getState().toggleHomework('HW-1')
    expect(useHRStore.getState().homeworkRecords[0].submitted).toBe(false)
  })

  it('addDailyReport', () => {
    useHRStore.getState().addDailyReport({ id: 'DR-1', teacherId: 'TCH-1', date: '2026-06-01', submitted: true, classId: 'CLS-1', studentCount: 30, avgScore: 75 })
    expect(useHRStore.getState().dailyReports).toHaveLength(1)
  })

  it('addRecommendation / updateRecommendation', () => {
    useHRStore.getState().addRecommendation({ id: 'REC-1', teacherId: 'TCH-1', type: 'bonus', score: 85, reason: 'test', status: 'pending', createdAt: '2026-06-01' })
    expect(useHRStore.getState().recommendations[0].status).toBe('pending')
    useHRStore.getState().updateRecommendation('REC-1', 'approved')
    expect(useHRStore.getState().recommendations[0].status).toBe('approved')
  })

  it('upsertMonthlySalaryConfig creates new', () => {
    useHRStore.getState().upsertMonthlySalaryConfig({ id: 'MSC-1', month: '2026-06', teacherId: 'TCH-1', bonus: 5000, festivalBonus: 0, applyDeductionRule: true, fundContributionPercent: 5, createdAt: '2026-06-01' })
    expect(useHRStore.getState().monthlySalaryConfigs).toHaveLength(1)
  })

  it('upsertMonthlySalaryConfig updates existing', () => {
    useHRStore.getState().upsertMonthlySalaryConfig({ id: 'MSC-1', month: '2026-06', teacherId: 'TCH-1', bonus: 5000, festivalBonus: 0, applyDeductionRule: true, fundContributionPercent: 5, createdAt: '2026-06-01' })
    useHRStore.getState().upsertMonthlySalaryConfig({ id: 'MSC-2', month: '2026-06', teacherId: 'TCH-1', bonus: 8000, festivalBonus: 0, applyDeductionRule: true, fundContributionPercent: 5, createdAt: '2026-06-01' })
    expect(useHRStore.getState().monthlySalaryConfigs).toHaveLength(1)
    expect(useHRStore.getState().monthlySalaryConfigs[0].bonus).toBe(8000)
  })

  it('upsertManyMonthlySalaryConfigs batch upserts', () => {
    useHRStore.getState().upsertManyMonthlySalaryConfigs([
      { id: 'MSC-1', month: '2026-06', teacherId: 'TCH-1', bonus: 5000, festivalBonus: 0, applyDeductionRule: true, fundContributionPercent: 5, createdAt: '2026-06-01' },
      { id: 'MSC-2', month: '2026-06', teacherId: 'TCH-2', bonus: 3000, festivalBonus: 0, applyDeductionRule: true, fundContributionPercent: 5, createdAt: '2026-06-01' },
    ])
    expect(useHRStore.getState().monthlySalaryConfigs).toHaveLength(2)
  })

  it('deleteMonthlySalaryConfig', () => {
    useHRStore.getState().upsertMonthlySalaryConfig({ id: 'MSC-1', month: '2026-06', teacherId: 'TCH-1', bonus: 5000, festivalBonus: 0, applyDeductionRule: true, fundContributionPercent: 5, createdAt: '2026-06-01' })
    useHRStore.getState().deleteMonthlySalaryConfig('MSC-1')
    expect(useHRStore.getState().monthlySalaryConfigs).toHaveLength(0)
  })

  it('addFacility / updateFacility / deleteFacility cascades', () => {
    useHRStore.getState().addFacility({ id: 'FAC-1', name: 'Housing', nameBn: '', defaultAmount: 0, type: 'monthly', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' })
    expect(useHRStore.getState().facilities).toHaveLength(1)
    useHRStore.getState().updateFacility('FAC-1', { name: 'Updated' })
    expect(useHRStore.getState().facilities[0].name).toBe('Updated')
    // Add teacher facility, then delete facility should cascade
    useHRStore.getState().assignTeacherFacility({ id: 'TF-1', teacherId: 'TCH-1', facilityId: 'FAC-1', amount: 1000, createdAt: '', updatedAt: '' })
    useHRStore.getState().deleteFacility('FAC-1')
    expect(useHRStore.getState().facilities).toHaveLength(0)
    expect(useHRStore.getState().teacherFacilities).toHaveLength(0)
  })

  it('assignTeacherFacility / removeTeacherFacility', () => {
    useHRStore.getState().assignTeacherFacility({ id: 'TF-1', teacherId: 'TCH-1', facilityId: 'FAC-1', amount: 1000, createdAt: '', updatedAt: '' })
    expect(useHRStore.getState().teacherFacilities).toHaveLength(1)
    useHRStore.getState().removeTeacherFacility('TF-1')
    expect(useHRStore.getState().teacherFacilities).toHaveLength(0)
  })

  it('removeTeacherFacilitiesByTeacher removes all for teacher', () => {
    useHRStore.getState().assignTeacherFacility({ id: 'TF-1', teacherId: 'TCH-1', facilityId: 'FAC-1', amount: 1000, createdAt: '', updatedAt: '' })
    useHRStore.getState().assignTeacherFacility({ id: 'TF-2', teacherId: 'TCH-1', facilityId: 'FAC-2', amount: 500, createdAt: '', updatedAt: '' })
    useHRStore.getState().assignTeacherFacility({ id: 'TF-3', teacherId: 'TCH-2', facilityId: 'FAC-1', amount: 1000, createdAt: '', updatedAt: '' })
    useHRStore.getState().removeTeacherFacilitiesByTeacher('TCH-1')
    expect(useHRStore.getState().teacherFacilities).toHaveLength(1)
    expect(useHRStore.getState().teacherFacilities[0].teacherId).toBe('TCH-2')
  })

  it('upsertTeacherFacilities deduplicates', () => {
    useHRStore.getState().assignTeacherFacility({ id: 'TF-1', teacherId: 'TCH-1', facilityId: 'FAC-1', amount: 1000, createdAt: '', updatedAt: '' })
    useHRStore.getState().upsertTeacherFacilities([
      { id: 'TF-2', teacherId: 'TCH-1', facilityId: 'FAC-1', amount: 2000, createdAt: '', updatedAt: '' },
      { id: 'TF-3', teacherId: 'TCH-2', facilityId: 'FAC-1', amount: 1000, createdAt: '', updatedAt: '' },
    ])
    expect(useHRStore.getState().teacherFacilities).toHaveLength(2)
    const tf1 = useHRStore.getState().teacherFacilities.find(t => t.teacherId === 'TCH-1' && t.facilityId === 'FAC-1')
    expect(tf1!.amount).toBe(2000)
  })

  it('syncFromServer loads server records when available', async () => {
    const mockData = {
      increments: [
        { id: 'INC-SRV-1', teacherId: 'TCH-1', type: 'annual', amount: 3000, percentage: 5, reason: 'Annual review', date: '2026-01-01', approvedBy: 'Principal' }
      ],
      bonuses: [
        { id: 'BON-SRV-1', teacherId: 'TCH-1', type: 'performance', amount: 5000, month: '2026-06', reason: 'Best Teacher', date: '2026-06-30' }
      ],
      promotions: [],
      funds: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [
        { id: 'FAC-SRV-1', name: 'Transport', nameBn: 'যাতায়াত', defaultAmount: 1500, type: 'monthly', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
      ],
      teacherFacilities: [],
    }

    vi.spyOn(hrApi, 'get').mockResolvedValue(mockData)

    await useHRStore.getState().syncFromServer('demo-school')

    const state = useHRStore.getState()
    expect(state.increments).toHaveLength(1)
    expect(state.increments[0].id).toBe('INC-SRV-1')
    expect(state.bonuses).toHaveLength(1)
    expect(state.bonuses[0].id).toBe('BON-SRV-1')
    expect(state.facilities).toHaveLength(1)
    expect(state.facilities[0].name).toBe('Transport')
    expect(state.serverSynced).toBe(true)
  })

  it('skips server sync in local_computer mode', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(hrApi, 'get')
    const updateSpy = vi.spyOn(hrApi, 'update')

    await useHRStore.getState().syncFromServer('local-school')
    expect(getSpy).not.toHaveBeenCalled()
    expect(useHRStore.getState().serverSynced).toBe(true)

    await useHRStore.getState().syncToServer()
    expect(updateSpy).not.toHaveBeenCalled()

    sessionStorage.removeItem('edutech_storage_mode')
  })

  it('syncToServer pushes local data to backend API', async () => {
    sessionStorage.removeItem('edutech_storage_mode')
    useHRStore.setState({
      increments: [{ id: 'INC-NEW', teacherId: 'TCH-99', type: 'special', amount: 2500, percentage: 4, reason: 'Special', date: '2026-03-01', approvedBy: 'Board' }],
      bonuses: [],
      promotions: [],
      funds: [],
      facilities: [],
      teacherFacilities: [],
    })

    const updateSpy = vi.spyOn(hrApi, 'update').mockResolvedValue({ success: true, count: 1 })
    await useHRStore.getState().syncToServer()

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        increments: expect.arrayContaining([
          expect.objectContaining({ id: 'INC-NEW' })
        ])
      })
    )
    expect(useHRStore.getState().serverSynced).toBe(true)
  })

  it('maps vault file paths to hr namespaced key', () => {
    expect(vaultPathToKey('hr.json', { slug: 'school' })).toBe('edutech-hr_school')
    expect(vaultPathToKey('hr_increments.json', { slug: 'school' })).toBe('edutech-hr_school')
    expect(vaultPathToKey('hr_bonuses.json', { slug: 'school' })).toBe('edutech-hr_school')
    expect(vaultPathToKey('hr_promotions.json', { slug: 'school' })).toBe('edutech-hr_school')
    expect(vaultPathToKey('hr_funds.json', { slug: 'school' })).toBe('edutech-hr_school')
    expect(vaultPathToKey('hr_facilities.json', { slug: 'school' })).toBe('edutech-hr_school')
    expect(vaultPathToKey('school/hr.json', { slug: 'school' })).toBe('edutech-hr_school')
  })

  it('normalizes slice and aggregate vault json files into hr state', () => {
    const rawIncrements = [
      { id: 'INC-V1', teacherId: 'TCH-1', type: 'annual', amount: 2000, percentage: 5, reason: 'Good performance', date: '2026-01-01', approvedBy: 'Admin' }
    ]
    const normalizedInc = normalizeVaultJsonForStore(
      'edutech-hr_school',
      JSON.stringify(rawIncrements),
      undefined,
      'school/hr_increments.json'
    )
    const parsedInc = JSON.parse(normalizedInc)
    expect(parsedInc.state.increments).toHaveLength(1)
    expect(parsedInc.state.increments[0].id).toBe('INC-V1')

    const rawAggregate = {
      increments: [{ id: 'INC-AGG', teacherId: 'TCH-2', type: 'annual', amount: 4000, percentage: 8, reason: 'Promotion review', date: '2026-02-01', approvedBy: 'Admin' }],
      bonuses: [{ id: 'BON-AGG', teacherId: 'TCH-2', type: 'festival', amount: 8000, month: '2026-04', reason: 'Eid bonus', date: '2026-04-01' }],
      facilities: [{ id: 'FAC-AGG', name: 'Medical', defaultAmount: 1000, type: 'monthly', isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' }]
    }
    const normalizedAgg = normalizeVaultJsonForStore(
      'edutech-hr_school',
      JSON.stringify(rawAggregate),
      undefined,
      'school/hr.json'
    )
    const parsedAgg = JSON.parse(normalizedAgg)
    expect(parsedAgg.state.increments).toHaveLength(1)
    expect(parsedAgg.state.bonuses).toHaveLength(1)
    expect(parsedAgg.state.facilities).toHaveLength(1)
    expect(parsedAgg.state.increments[0].id).toBe('INC-AGG')
    expect(parsedAgg.state.bonuses[0].id).toBe('BON-AGG')
    expect(parsedAgg.state.facilities[0].name).toBe('Medical')
  })
})
