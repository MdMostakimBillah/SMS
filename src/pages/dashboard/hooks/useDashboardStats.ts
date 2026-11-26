import { useMemo } from 'react'
import type { StudentAdmission } from '@/pages/students/admission/types'
import type { Teacher } from '@/pages/teachers/types'
import type { FeePayment, FeeStructure, FeeWaiver } from '@/store/feeStore'
import type { ExpenseEntry } from '@/store/expenseStore'
import type { StoreSale } from '@/store/storeStore'
import type { Message } from '@/store/messageStore'
import type { DayAttendance } from '@/store/attendanceStore'
import { isMale, isFemale } from '@/lib/gender'
import {
  DASHBOARD_COLORS,
  STATUS_COLORS,
  type TopStudentItem,
  type FinanceStatSummary,
  type TeacherStatSummary,
  type TeacherAttendanceTodaySummary,
  type MessageStatSummary,
  type BirthdayPersonItem,
  type MonthlyIncomeProgressSummary,
  type MonthlyDailyIncomePoint,
} from '../types'

interface UseDashboardStatsOptions {
  students: StudentAdmission[]
  teachers: Teacher[]
  payments: FeePayment[]
  structures: FeeStructure[]
  generateWaivers: (students: StudentAdmission[]) => FeeWaiver[]
  isBn: boolean
  attendance?: Record<string, Record<string, Pick<DayAttendance, 'status'>>>
  messages?: Pick<Message, 'read' | 'senderId'>[]
  smsRemaining?: number
  storeSales?: Pick<StoreSale, 'total' | 'createdAt'>[]
  expenses?: Pick<ExpenseEntry, 'amount' | 'date' | 'createdAt' | 'isActive'>[]
}

/** Match month and day against a reference date without timezone drift on YYYY-MM-DD strings. */
export function isBirthdayToday(dob?: string, refDate: Date = new Date()): boolean {
  if (!dob) return false
  const trimmed = dob.trim()
  if (!trimmed) return false
  const targetMonth = refDate.getMonth() + 1
  const targetDay = refDate.getDate()

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    return Number(isoMatch[2]) === targetMonth && Number(isoMatch[3]) === targetDay
  }

  const parsed = new Date(trimmed)
  if (isNaN(parsed.getTime())) return false
  return parsed.getMonth() + 1 === targetMonth && parsed.getDate() === targetDay
}

export function useDashboardStats({
  students,
  teachers,
  payments,
  structures,
  generateWaivers,
  isBn,
  attendance = {},
  messages = [],
  smsRemaining = 0,
  storeSales = [],
  expenses = [],
}: UseDashboardStatsOptions) {
  // Single-pass computation for student stats
  const studentStats = useMemo(() => {
    let approved = 0,
      pending = 0,
      rejected = 0,
      male = 0,
      female = 0
    for (const s of students) {
      if (s.status === 'approved') approved++
      else if (s.status === 'pending') pending++
      else if (s.status === 'rejected') rejected++
      if (isMale(s.gender)) male++
      else if (isFemale(s.gender)) female++
    }
    return { approved, pending, rejected, male, female }
  }, [students])

  // Single-pass computation for teacher stats
  const teacherStats: TeacherStatSummary = useMemo(() => {
    let active = 0,
      onLeave = 0,
      inactive = 0,
      male = 0,
      female = 0,
      totalSalary = 0
    for (const t of teachers) {
      if (t.status === 'active') active++
      else if (t.status === 'on-leave') onLeave++
      else if (t.status === 'inactive') inactive++
      if (isMale(t.gender)) male++
      else if (isFemale(t.gender)) female++
      if (t.status !== 'inactive') totalSalary += t.salary || 0
    }
    return { active, onLeave, inactive, male, female, totalSalary }
  }, [teachers])

  const totalStudents = students.length
  const totalTeachers = teachers.length
  const {
    approved: approvedStudents,
    pending: pendingStudents,
    rejected: rejectedStudents,
    male: maleStudents,
    female: femaleStudents,
  } = studentStats
  const {
    active: activeTeachers,
    male: maleTeachers,
    female: femaleTeachers,
    totalSalary: totalTeacherSalary,
  } = teacherStats

  // Today's teacher attendance summary
  const teacherAttendanceToday: TeacherAttendanceTodaySummary = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const dayAtt = attendance[todayStr] || {}
    let present = 0
    let absent = 0
    let onLeave = 0
    const activeTeacherList = teachers.filter((t) => t.status === 'active')

    for (const t of activeTeacherList) {
      const status = dayAtt[t.id]?.status || 'absent'
      if (status === 'present') present++
      else if (status === 'on-leave' || (status as string) === 'leave') onLeave++
      else absent++
    }

    return {
      totalActive: activeTeacherList.length,
      present,
      absent,
      onLeave,
    }
  }, [teachers, attendance])

  // Message stats
  const messageStats: MessageStatSummary = useMemo(() => {
    let unreadMessages = 0
    for (const m of messages) {
      if (m && !m.read && m.senderId !== 'me') unreadMessages++
    }
    return {
      totalMessages: messages.length,
      unreadMessages,
      smsRemaining,
    }
  }, [messages, smsRemaining])

  // Today's birthdays for students and teachers
  const todayStudentBirthdays: BirthdayPersonItem[] = useMemo(() => {
    const now = new Date()
    const list: BirthdayPersonItem[] = []
    for (const s of students) {
      if (s.status === 'rejected' || s.active === false) continue
      if (isBirthdayToday(s.dob, now)) {
        list.push({
          id: s.id,
          name: isBn ? s.nameBn || s.nameEn : s.nameEn || s.nameBn,
          subtitle: `${isBn ? 'শ্রেণি' : 'Class'} ${s.class}${s.section ? ` · ${s.section}` : ''}`,
        })
      }
    }
    return list
  }, [students, isBn])

  const todayTeacherBirthdays: BirthdayPersonItem[] = useMemo(() => {
    const now = new Date()
    const list: BirthdayPersonItem[] = []
    for (const t of teachers) {
      if (t.status === 'inactive') continue
      if (isBirthdayToday(t.dob, now)) {
        list.push({
          id: t.id,
          name: isBn ? t.nameBn || t.nameEn : t.nameEn || t.nameBn,
          subtitle: t.designation || (isBn ? 'শিক্ষক' : 'Teacher'),
        })
      }
    }
    return list
  }, [teachers, isBn])

  // Class distribution
  const classDist = useMemo(() => {
    const map = new Map<string, number>()
    students.forEach((s) => {
      const cls = `Class ${s.class}`
      map.set(cls, (map.get(cls) || 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }))
  }, [students])

  // Status distribution
  const statusData = useMemo(
    () => [
      { name: isBn ? 'অনুমোদিত' : 'Approved', value: approvedStudents, color: STATUS_COLORS.approved },
      { name: isBn ? 'বিচারাধীন' : 'Pending', value: pendingStudents, color: STATUS_COLORS.pending },
      { name: isBn ? 'বাতিল' : 'Rejected', value: rejectedStudents, color: STATUS_COLORS.rejected },
    ],
    [approvedStudents, pendingStudents, rejectedStudents, isBn]
  )

  // Weekly enrollment trend
  const weeklyTrend = useMemo(() => {
    const days: Array<{ name: string; students: number; teachers: number }> = []
    const now = new Date()
    const studentsByDate = new Map<string, number>()
    students.forEach((s) => studentsByDate.set(s.createdAt, (studentsByDate.get(s.createdAt) || 0) + 1))
    const teachersByDate = new Map<string, number>()
    teachers.forEach((t) => teachersByDate.set(t.createdAt, (teachersByDate.get(t.createdAt) || 0) + 1))

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayStudents = studentsByDate.get(dateStr) || 0
      const dayTeachers = teachersByDate.get(dateStr) || 0
      const label = d.toLocaleDateString(isBn ? 'bn' : 'en', { weekday: 'short' })
      days.push({ name: label, students: dayStudents, teachers: dayTeachers })
    }
    return days
  }, [students, teachers, isBn])

  // Finance stats
  const financeStats: FinanceStatSummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const waivers = generateWaivers(students)

    const todayFeeIncome = payments
      .filter((p) => p.paidAt.startsWith(today))
      .reduce((s, p) => s + p.amount, 0)
    const todayStoreIncome = storeSales
      .filter((s) => (s.createdAt || '').startsWith(today))
      .reduce((sum, s) => sum + (s.total || 0), 0)
    const todayIncome = todayFeeIncome + todayStoreIncome

    const activeStructures = structures.filter((s) => s.isActive && s.type === 'monthly')
    const approvedS = students.filter(
      (s) => (!s.status || s.status === 'approved') && s.active !== false
    )
    const totalExpected =
      activeStructures.reduce((s, st) => s + st.amount, 0) * approvedS.length

    const monthFeeIncome = payments
      .filter((p) => p.paidAt >= monthStart)
      .reduce((s, p) => s + p.amount, 0)
    const monthStoreIncome = storeSales
      .filter((s) => (s.createdAt || '') >= monthStart)
      .reduce((sum, s) => sum + (s.total || 0), 0)
    const monthIncome = monthFeeIncome + monthStoreIncome

    const monthWaivers = waivers
      .filter((w) => w.createdAt >= monthStart)
      .reduce((s, w) => s + w.amount, 0)
    const monthDue = Math.max(0, totalExpected - monthIncome - monthWaivers)

    return { todayIncome, totalExpected, monthIncome, monthDue }
  }, [payments, storeSales, structures, students, generateWaivers])

  // Full-month daily collection progress for chart
  const monthlyIncomeProgress: MonthlyIncomeProgressSummary = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const [year, month, todayDay] = todayStr.split('-').map(Number)
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
    const monthLabel = new Date(Date.UTC(year, month - 1, 15)).toLocaleDateString(
      isBn ? 'bn-BD' : 'en-US',
      { month: 'long', year: 'numeric', timeZone: 'UTC' }
    )

    const amountByDate = new Map<string, number>()
    for (const p of payments) {
      const ds = (p.paidAt || '').slice(0, 10)
      if (ds.startsWith(monthPrefix)) {
        amountByDate.set(ds, (amountByDate.get(ds) || 0) + (p.amount || 0))
      }
    }
    for (const s of storeSales) {
      const ds = (s.createdAt || '').slice(0, 10)
      if (ds.startsWith(monthPrefix)) {
        amountByDate.set(ds, (amountByDate.get(ds) || 0) + (s.total || 0))
      }
    }

    const expenseByDate = new Map<string, number>()
    for (const e of expenses) {
      if (e.isActive === false) continue
      const ds = (e.date || e.createdAt || '').slice(0, 10)
      if (ds.startsWith(monthPrefix)) {
        expenseByDate.set(ds, (expenseByDate.get(ds) || 0) + (e.amount || 0))
      }
    }

    const days: MonthlyDailyIncomePoint[] = []
    let cumulative = 0
    let monthExpenseTotal = 0
    let peakAmount = 0
    let peakDayLabel = isBn ? '—' : '—'

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`
      const amount = amountByDate.get(dateStr) || 0
      const expenseAmount = expenseByDate.get(dateStr) || 0
      const prevAmount = day > 1 ? days[day - 2].amount : 0
      const delta = day === 1 ? amount : amount - prevAmount
      const deltaPct =
        day > 1 && prevAmount > 0 ? Math.round((delta / prevAmount) * 100) : null
      const trend: 'up' | 'down' | 'flat' =
        delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'

      if (day <= todayDay) {
        cumulative += amount
        monthExpenseTotal += expenseAmount
      }
      if (amount > peakAmount) {
        peakAmount = amount
        peakDayLabel = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
          isBn ? 'bn-BD' : 'en-US',
          { month: 'short', day: 'numeric', timeZone: 'UTC' }
        )
      }

      days.push({
        day,
        dateStr,
        label: String(day),
        amount,
        expenseAmount,
        prevAmount,
        delta,
        deltaPct,
        trend,
        cumulative,
        isToday: day === todayDay,
        isFuture: day > todayDay,
      })
    }

    const todayPoint = days[todayDay - 1]
    const todayIncome = todayPoint?.amount || 0
    const todayExpense = todayPoint?.expenseAmount || 0
    const yesterdayIncome = todayDay > 1 ? days[todayDay - 2]?.amount || 0 : 0
    const todayDelta = todayDay > 1 ? todayIncome - yesterdayIncome : todayIncome
    const todayDeltaPct =
      todayDay > 1 && yesterdayIncome > 0
        ? Math.round((todayDelta / yesterdayIncome) * 100)
        : null
    const monthTotal = cumulative
    const dailyAverage = todayDay > 0 ? Math.round(monthTotal / todayDay) : 0

    return {
      days,
      monthLabel,
      todayIncome,
      yesterdayIncome,
      todayDelta,
      todayDeltaPct,
      monthTotal,
      todayExpense,
      monthExpenseTotal,
      dailyAverage,
      peakAmount,
      peakDayLabel,
      targetAmount: financeStats.totalExpected,
    }
  }, [payments, storeSales, expenses, financeStats.totalExpected, isBn])

  // Recent students (latest 4)
  const recentStudents = useMemo(
    () => [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [students]
  )

  // Top students (approved, preview)
  const topStudentsList: TopStudentItem[] = useMemo(
    () =>
      [...students]
        .filter((s) => !s.status || s.status === 'approved')
        .slice(0, 5)
        .map((s, i) => ({
          name: s.nameEn,
          cls: `Class ${s.class} ${s.section}`,
          score: `${85 + ((s.nameEn.charCodeAt(0) || 0) % 15)}%`,
          initials: s.nameEn
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join(''),
          color: DASHBOARD_COLORS[i % DASHBOARD_COLORS.length],
        })),
    [students]
  )

  return {
    totalStudents,
    approvedStudents,
    pendingStudents,
    rejectedStudents,
    maleStudents,
    femaleStudents,
    totalTeachers,
    activeTeachers,
    maleTeachers,
    femaleTeachers,
    totalTeacherSalary,
    teacherStats,
    teacherAttendanceToday,
    messageStats,
    todayStudentBirthdays,
    todayTeacherBirthdays,
    classDist,
    statusData,
    weeklyTrend,
    financeStats,
    monthlyIncomeProgress,
    recentStudents,
    topStudentsList,
  }
}
