import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDashboardStats } from './useDashboardStats'
import type { StudentAdmission } from '@/pages/students/admission/types'
import type { Teacher } from '@/pages/teachers/types'
import type { FeePayment, FeeStructure } from '@/store/feeStore'

describe('useDashboardStats', () => {
  it('correctly aggregates student and teacher stats, financials, and trends', () => {
    const mockStudents: StudentAdmission[] = [
      {
        id: 's1',
        nameEn: 'Alice Rahman',
        nameBn: 'এলিস রহমান',
        class: '5',
        section: 'A',
        gender: 'female',
        status: 'approved',
        createdAt: '2026-11-01',
      } as any,
      {
        id: 's2',
        nameEn: 'Bob Hossain',
        nameBn: 'বব হোসেন',
        class: '5',
        section: 'B',
        gender: 'male',
        status: 'pending',
        createdAt: '2026-11-02',
      } as any,
      {
        id: 's3',
        nameEn: 'Charlie Khan',
        nameBn: 'চার্লি খান',
        class: '6',
        section: 'A',
        gender: 'male',
        status: 'rejected',
        createdAt: '2026-11-03',
      } as any,
    ]

    const mockTeachers: Teacher[] = [
      {
        id: 't1',
        nameEn: 'Mr. Teacher 1',
        nameBn: 'শিক্ষক ১',
        gender: 'male',
        status: 'active',
        salary: 30000,
        createdAt: '2026-10-01',
      } as any,
      {
        id: 't2',
        nameEn: 'Ms. Teacher 2',
        nameBn: 'শিক্ষক ২',
        gender: 'female',
        status: 'on-leave',
        salary: 25000,
        createdAt: '2026-10-02',
      } as any,
      {
        id: 't3',
        nameEn: 'Mr. Teacher 3',
        nameBn: 'শিক্ষক ৩',
        gender: 'male',
        status: 'inactive',
        salary: 20000,
        createdAt: '2026-10-03',
      } as any,
    ]

    const mockPayments: FeePayment[] = [
      {
        id: 'p1',
        studentId: 's1',
        amount: 5000,
        paidAt: new Date().toISOString(),
      } as any,
    ]

    const mockStructures: FeeStructure[] = [
      {
        id: 'fs1',
        name: 'Tuition Fee',
        amount: 2000,
        type: 'monthly',
        isActive: true,
      } as any,
    ]

    const { result } = renderHook(() =>
      useDashboardStats({
        students: mockStudents,
        teachers: mockTeachers,
        payments: mockPayments,
        structures: mockStructures,
        generateWaivers: () => [],
        isBn: false,
      })
    )

    // Student counts
    expect(result.current.totalStudents).toBe(3)
    expect(result.current.approvedStudents).toBe(1)
    expect(result.current.pendingStudents).toBe(1)
    expect(result.current.rejectedStudents).toBe(1)
    expect(result.current.maleStudents).toBe(2)
    expect(result.current.femaleStudents).toBe(1)

    // Teacher counts & active salary (inactive excluded)
    expect(result.current.totalTeachers).toBe(3)
    expect(result.current.activeTeachers).toBe(1)
    expect(result.current.totalTeacherSalary).toBe(55000)

    // Class distribution
    expect(result.current.classDist).toEqual([
      { name: 'Class 5', value: 2 },
      { name: 'Class 6', value: 1 },
    ])

    // Finance stats
    expect(result.current.financeStats.todayIncome).toBe(5000)
    expect(result.current.financeStats.monthIncome).toBe(5000)

    // Weekly trend array length (7 days)
    expect(result.current.weeklyTrend).toHaveLength(7)

    // Top students list (only approved students)
    expect(result.current.topStudentsList).toHaveLength(1)
    expect(result.current.topStudentsList[0].name).toBe('Alice Rahman')
  })
})
