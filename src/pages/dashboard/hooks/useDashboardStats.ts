import { useMemo } from 'react'
import type { StudentAdmission } from '@/pages/students/admission/types'
import type { Teacher } from '@/pages/teachers/types'
import type { FeePayment, FeeStructure, FeeWaiver } from '@/store/feeStore'
import { isMale, isFemale } from '@/lib/gender'
import { DASHBOARD_COLORS, STATUS_COLORS, type TopStudentItem, type FinanceStatSummary, type TeacherStatSummary } from '../types'

interface UseDashboardStatsOptions {
  students: StudentAdmission[]
  teachers: Teacher[]
  payments: FeePayment[]
  structures: FeeStructure[]
  generateWaivers: (students: StudentAdmission[]) => FeeWaiver[]
  isBn: boolean
}

export function useDashboardStats({
  students,
  teachers,
  payments,
  structures,
  generateWaivers,
  isBn,
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
  const { active: activeTeachers, totalSalary: totalTeacherSalary } = teacherStats

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

    const todayIncome = payments
      .filter((p) => p.paidAt.startsWith(today))
      .reduce((s, p) => s + p.amount, 0)

    const activeStructures = structures.filter((s) => s.isActive && s.type === 'monthly')
    const approvedS = students.filter(
      (s) => (!s.status || s.status === 'approved') && s.active !== false
    )
    const totalExpected =
      activeStructures.reduce((s, st) => s + st.amount, 0) * approvedS.length

    const monthIncome = payments
      .filter((p) => p.paidAt >= monthStart)
      .reduce((s, p) => s + p.amount, 0)

    const monthWaivers = waivers
      .filter((w) => w.createdAt >= monthStart)
      .reduce((s, w) => s + w.amount, 0)
    const monthDue = Math.max(0, totalExpected - monthIncome - monthWaivers)

    return { todayIncome, totalExpected, monthIncome, monthDue }
  }, [payments, structures, students, generateWaivers])

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
    totalTeacherSalary,
    teacherStats,
    classDist,
    statusData,
    weeklyTrend,
    financeStats,
    recentStudents,
    topStudentsList,
  }
}
