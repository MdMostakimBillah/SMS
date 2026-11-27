import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useDashboardStats,
  isBirthdayToday,
  shiftMonthKey,
  getSoftwareLastPaymentDate,
  formatSoftwarePaymentDate,
  getSubscriptionStatusInfo,
} from './useDashboardStats'
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

  it('computes teacher attendance today, M/F teachers, message stats, birthdays, and monthly income progress', () => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const [year, month, todayDay] = todayStr.split('-').map(Number)
    const monthStr = String(now.getMonth() + 1).padStart(2, '0')
    const dayStr = String(now.getDate()).padStart(2, '0')
    const birthdayDob = `2012-${monthStr}-${dayStr}`

    const yesterdayDate = new Date(Date.UTC(year, month - 1, Math.max(1, todayDay - 1)))
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

    const students = [
      { id: 's1', nameEn: 'Birthday Boy', nameBn: 'বয়', class: '4', section: 'A', gender: 'male', status: 'approved', dob: birthdayDob, createdAt: '2026-01-01' } as any,
      { id: 's2', nameEn: 'Other Girl', nameBn: 'গার্ল', class: '4', section: 'A', gender: 'female', status: 'approved', dob: '2012-01-01', createdAt: '2026-01-01' } as any,
    ]
    const teachers = [
      { id: 't1', nameEn: 'Male Teacher Present', nameBn: 'শিক্ষক', gender: 'male', status: 'active', salary: 30000, dob: `1990-${monthStr}-${dayStr}`, createdAt: '2026-01-01' } as any,
      { id: 't2', nameEn: 'Female Teacher Absent', nameBn: 'শিক্ষিকা', gender: 'female', status: 'active', salary: 28000, dob: '1991-02-10', createdAt: '2026-01-01' } as any,
    ]
    const attendance = {
      [todayStr]: {
        t1: { status: 'present' },
      },
    }
    const payments = [
      { id: 'p1', studentId: 's1', amount: 8000, paidAt: `${todayStr}T10:00:00.000Z` } as any,
      ...(todayDay > 1
        ? [{ id: 'p2', studentId: 's2', amount: 5000, paidAt: `${yesterdayStr}T10:00:00.000Z` } as any]
        : []),
    ]
    const messages = [
      { read: false, senderId: 'u1' },
      { read: true, senderId: 'me' },
    ]
    const expenses = [
      { amount: 2200, date: todayStr, createdAt: todayStr, isActive: true },
      { amount: 500, date: todayStr, createdAt: todayStr, isActive: false },
      ...(todayDay > 1
        ? [{ amount: 1200, date: yesterdayStr, createdAt: yesterdayStr, isActive: true }]
        : []),
    ]

    const { result } = renderHook(() =>
      useDashboardStats({
        students,
        teachers,
        payments,
        structures: [{ id: 'f1', amount: 5000, type: 'monthly', isActive: true } as any],
        generateWaivers: () => [],
        isBn: false,
        attendance,
        messages,
        smsRemaining: 450,
        expenses,
      })
    )

    expect(result.current.maleTeachers).toBe(1)
    expect(result.current.femaleTeachers).toBe(1)
    expect(result.current.teacherAttendanceToday.present).toBe(1)
    expect(result.current.teacherAttendanceToday.absent).toBe(1)
    expect(result.current.messageStats.totalMessages).toBe(2)
    expect(result.current.messageStats.unreadMessages).toBe(1)
    expect(result.current.messageStats.smsRemaining).toBe(450)
    expect(result.current.todayStudentBirthdays).toHaveLength(1)
    expect(result.current.todayStudentBirthdays[0].name).toBe('Birthday Boy')
    expect(result.current.todayTeacherBirthdays).toHaveLength(1)
    expect(result.current.todayTeacherBirthdays[0].name).toBe('Male Teacher Present')

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    expect(result.current.monthlyIncomeProgress.days).toHaveLength(daysInMonth)
    expect(result.current.monthlyIncomeProgress.todayIncome).toBe(8000)
    expect(result.current.monthlyIncomeProgress.todayExpense).toBe(2200)
    expect(result.current.monthlyIncomeProgress.peakAmount).toBe(8000)
    if (todayDay > 1) {
      expect(result.current.monthlyIncomeProgress.todayDelta).toBe(3000)
      expect(result.current.monthlyIncomeProgress.monthTotal).toBe(13000)
      expect(result.current.monthlyIncomeProgress.monthExpenseTotal).toBe(3400)
    } else {
      expect(result.current.monthlyIncomeProgress.monthExpenseTotal).toBe(2200)
    }

    expect(isBirthdayToday(birthdayDob, now)).toBe(true)
    expect(isBirthdayToday('', now)).toBe(false)
  })

  it('supports switching selectedMonth across year boundaries and aggregates full past month data', () => {
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12')
    expect(shiftMonthKey('2025-12', 1)).toBe('2026-01')

    const prevMonthPayments = [
      { id: 'p-oct', studentId: 's1', amount: 4200, paidAt: '2025-10-15T09:00:00.000Z' } as any,
    ]
    const prevMonthExpenses = [
      { amount: 1500, date: '2025-10-15', createdAt: '2025-10-15', isActive: true },
    ]

    const { result } = renderHook(() =>
      useDashboardStats({
        students: [],
        teachers: [],
        payments: prevMonthPayments,
        structures: [],
        generateWaivers: () => [],
        isBn: false,
        expenses: prevMonthExpenses,
        selectedMonth: '2025-10',
      })
    )

    expect(result.current.monthlyIncomeProgress.monthKey).toBe('2025-10')
    expect(result.current.monthlyIncomeProgress.isCurrentMonth).toBe(false)
    expect(result.current.monthlyIncomeProgress.days).toHaveLength(31)
    expect(result.current.monthlyIncomeProgress.days.every((d) => !d.isFuture)).toBe(true)
    expect(result.current.monthlyIncomeProgress.monthTotal).toBe(4200)
    expect(result.current.monthlyIncomeProgress.monthExpenseTotal).toBe(1500)
    expect(result.current.monthlyIncomeProgress.days[14].amount).toBe(4200)
    expect(result.current.monthlyIncomeProgress.days[14].expenseAmount).toBe(1500)
  })

  it('determines and formats software last payment date from institution payments', () => {
    const payments = [
      {
        id: 'PAY-1',
        schoolId: 'sch-1',
        schoolSlug: 'model-school',
        status: 'approved',
        submittedAt: '2026-10-10T10:00:00.000Z',
        reviewedAt: '2026-10-11T12:00:00.000Z',
      } as any,
      {
        id: 'PAY-2',
        schoolId: 'sch-1',
        schoolSlug: 'model-school',
        status: 'approved',
        submittedAt: '2026-11-01T10:00:00.000Z',
        reviewedAt: '2026-11-02T15:30:00.000Z',
      } as any,
      {
        id: 'PAY-3',
        schoolId: 'sch-other',
        status: 'approved',
        submittedAt: '2026-11-20T10:00:00.000Z',
      } as any,
    ]

    const lastDate = getSoftwareLastPaymentDate(payments, { schoolId: 'sch-1' })
    expect(lastDate).toBe('2026-11-02T15:30:00.000Z')

    expect(formatSoftwarePaymentDate(lastDate, false)).toMatch(/Nov 2, 2026|2 Nov 2026/)
    expect(formatSoftwarePaymentDate(null, false)).toBe('No payment')
    expect(formatSoftwarePaymentDate(null, true)).toBe('পেমেন্ট নেই')

    const { result } = renderHook(() =>
      useDashboardStats({
        students: [],
        teachers: [],
        payments: [],
        structures: [],
        generateWaivers: () => [],
        isBn: false,
        institutionPayments: payments,
        currentSchoolId: 'sch-1',
      })
    )
    expect(result.current.softwareLastPaymentDate).toBe('2026-11-02T15:30:00.000Z')
  })

  it('calculates subscription status, days left, warning color, and suspended state', () => {
    const fixedNow = new Date('2026-11-20T12:00:00.000Z').getTime()

    // 25 days remaining (> 7 days) -> brand color
    const future25d = new Date('2026-12-15T12:00:00.000Z').toISOString()
    const stat25d = getSubscriptionStatusInfo({ expiresAt: future25d, status: 'active' }, false, fixedNow)
    expect(stat25d.daysLeft).toBe(25)
    expect(stat25d.isExpired).toBe(false)
    expect(stat25d.isSuspended).toBe(false)
    expect(stat25d.formattedValue).toBe('25 Days Left')
    expect(stat25d.color).toBe('var(--brand)')

    // Bengali formatting for 25 days
    const stat25dBn = getSubscriptionStatusInfo({ expiresAt: future25d, status: 'active' }, true, fixedNow)
    expect(stat25dBn.formattedValue).toBe('২৫ দিন বাকি')

    // 7 days remaining -> amber warning color
    const future7d = new Date('2026-11-27T12:00:00.000Z').toISOString()
    const stat7d = getSubscriptionStatusInfo({ expiresAt: future7d, status: 'active' }, false, fixedNow)
    expect(stat7d.daysLeft).toBe(7)
    expect(stat7d.formattedValue).toBe('7 Days Left')
    expect(stat7d.color).toBe('var(--amber)')

    // 1 day remaining -> amber warning
    const future1d = new Date('2026-11-21T12:00:00.000Z').toISOString()
    const stat1d = getSubscriptionStatusInfo({ expiresAt: future1d, status: 'active' }, false, fixedNow)
    expect(stat1d.daysLeft).toBe(1)
    expect(stat1d.formattedValue).toBe('1 Day Left')
    expect(stat1d.color).toBe('var(--amber)')

    const stat1dBn = getSubscriptionStatusInfo({ expiresAt: future1d, status: 'active' }, true, fixedNow)
    expect(stat1dBn.formattedValue).toBe('১ দিন বাকি')

    // Due today (0 days left) -> red
    const dueToday = new Date('2026-11-20T12:00:00.000Z').toISOString()
    const statDue = getSubscriptionStatusInfo({ expiresAt: dueToday, status: 'active' }, false, fixedNow)
    expect(statDue.daysLeft).toBe(0)
    expect(statDue.formattedValue).toBe('Due Today')
    expect(statDue.color).toBe('var(--red)')

    const statDueBn = getSubscriptionStatusInfo({ expiresAt: dueToday, status: 'active' }, true, fixedNow)
    expect(statDueBn.formattedValue).toBe('আজ শেষ দিন')

    // Expired date in the past -> Suspended in red
    const pastDate = new Date('2026-11-10T12:00:00.000Z').toISOString()
    const statExpired = getSubscriptionStatusInfo({ expiresAt: pastDate, status: 'active' }, false, fixedNow)
    expect(statExpired.isExpired).toBe(true)
    expect(statExpired.isSuspended).toBe(true)
    expect(statExpired.formattedValue).toBe('Suspended')
    expect(statExpired.color).toBe('var(--red)')

    const statExpiredBn = getSubscriptionStatusInfo({ expiresAt: pastDate, status: 'active' }, true, fixedNow)
    expect(statExpiredBn.formattedValue).toBe('স্থগিত')

    // Status is suspended even if expiresAt is in future
    const statSuspended = getSubscriptionStatusInfo({ expiresAt: future25d, status: 'suspended' }, false, fixedNow)
    expect(statSuspended.isSuspended).toBe(true)
    expect(statSuspended.formattedValue).toBe('Suspended')
    expect(statSuspended.color).toBe('var(--red)')

    // Lifetime active without expiresAt
    const statLifetime = getSubscriptionStatusInfo({ expiresAt: null, status: 'active' }, false, fixedNow)
    expect(statLifetime.daysLeft).toBeNull()
    expect(statLifetime.formattedValue).toBe('Lifetime Active')
    expect(statLifetime.color).toBe('var(--brand)')

    // Integration check via useDashboardStats hook
    const dynamicFuture20d = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    const { result } = renderHook(() =>
      useDashboardStats({
        students: [],
        teachers: [],
        payments: [],
        structures: [],
        generateWaivers: () => [],
        isBn: false,
        institutionInfo: { expiresAt: dynamicFuture20d, status: 'active' },
      })
    )
    expect(result.current.subscriptionStatus.daysLeft).toBe(20)
    expect(result.current.subscriptionStatus.formattedValue).toBe('20 Days Left')
  })
})
