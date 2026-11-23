import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import type { PortalChild, HomeworkItem, ExamResultItem } from '../types'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useExamStore } from '@/store/examStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { matchAssignmentToStudent } from '@/lib/assignmentUtils'

/**
 * Derives homework, diary, and assignments assigned to the student's class & section
 * directly from the institution admin assignment page / useAssignmentStore.
 */
export function getChildHomework(child: PortalChild): HomeworkItem[] {
  if (!child || !child.id) return []

  const state = useAssignmentStore.getState()
  const assignments = state.assignments || []
  const submissions = state.submissions || []
  const teachers = useTeacherStore.getState().teachers || []
  const subjects = useTeacherStore.getState().subjects || []
  const classes = useClassStore.getState().classes || []

  const matched = assignments.filter((a) => {
    return matchAssignmentToStudent(a, child.class, child.section, classes)
  })

  return matched.map((a) => {
    const sub = submissions.find(
      (s) => s.assignmentId === a.id && s.studentId === child.id
    )
    const teacher = teachers.find((t) => t.id === a.teacherId)
    const subject = subjects.find((s) => s.id === a.subjectId)

    const isHw = a.type === 'homework'
    const defaultSubj = isHw ? 'Diary / Homework' : 'Assignment'
    const defaultSubjBn = isHw ? 'ডায়েরি / গৃহকাজ' : 'অ্যাসাইনমেন্ট'

    return {
      id: a.id,
      type: a.type || 'homework',
      subject: subject?.name || a.subjectId || defaultSubj,
      subjectBn: subject?.nameBn || subject?.name || a.subjectId || defaultSubjBn,
      title: a.title,
      titleBn: a.titleBn || a.title,
      assignedDate: a.createdAt?.split('T')[0] || '',
      dueDate: a.dueDate?.split('T')[0] || '',
      teacherName: teacher?.nameEn || teacher?.nameBn || child.classTeacherName || '',
      description: a.description || a.descriptionBn || '',
      status: sub ? (sub.status === 'reviewed' ? 'evaluated' : 'submitted') : 'pending',
      marks: sub?.marks ?? undefined,
      maxMarks: a.maxMarks,
      feedback: sub?.feedback || sub?.feedbackBn,
      attachments: a.attachments || [],
    }
  })
}

/**
 * Derives real exam results and marks recorded for the student.
 * Returns empty array if no marks exist for the student.
 */
export function getChildExamResults(child: PortalChild, examId?: string): ExamResultItem[] {
  if (!child || !child.id) return []

  const state = useExamStore.getState()
  const marks = state.studentMarks || []
  const configs = state.subjectMarkConfigs || []
  const subjects = useTeacherStore.getState().subjects || []

  const childMarks = marks.filter((m) => {
    if (m.studentId !== child.id) return false
    if (examId && m.examId !== examId) return false
    return true
  })

  return childMarks.map((m) => {
    const sub = subjects.find((s) => s.id === m.subjectId)
    const cfg = configs.find(
      (c) => c.examId === m.examId && c.subjectId === m.subjectId
    )
    const fullMarks = cfg?.fullMarks || 100
    const passMarks = cfg?.passMarks || 33
    const isPassed = m.totalMarks >= passMarks

    return {
      subject: sub?.name || m.subjectId || 'Subject',
      subjectBn: sub?.nameBn || sub?.name || m.subjectId || 'বিষয়',
      code: sub?.id || '',
      fullMarks,
      passMarks,
      written: m.subExamMarks?.written ?? m.totalMarks,
      mcq: m.subExamMarks?.mcq ?? 0,
      practical: m.subExamMarks?.practical ?? 0,
      obtained: m.totalMarks,
      grade: m.grade || (isPassed ? 'A' : 'F'),
      point: isPassed ? 4.0 : 0,
      status: isPassed ? 'passed' : 'failed',
    }
  })
}

/**
 * Calculates real monthly attendance metrics for the child from attendanceStore.
 */
export function getChildAttendanceStats(childId: string, month: Date) {
  const attendance = useAttendanceStore.getState().attendance || {}
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })

  let presentDays = 0
  let absentDays = 0
  let leaveDays = 0
  let lateDays = 0
  let workingDays = 0

  days.forEach((day) => {
    const dayOfWeek = day.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Fri/Sat in BD
    if (!isWeekend) {
      workingDays++
    }

    const dateKey = format(day, 'yyyy-MM-dd')
    const rec = attendance[dateKey]?.[childId]
    if (rec) {
      if (rec.status === 'present') {
        presentDays++
        const inPunch = rec.punches?.find((p) => p.type === 'in')
        if (inPunch && inPunch.time > '09:15') {
          lateDays++
        }
      } else if (rec.status === 'absent') {
        absentDays++
      } else if (rec.status === 'on-leave') {
        leaveDays++
      }
    }
  })

  const recordedTotal = presentDays + absentDays + leaveDays
  const attendanceRate =
    recordedTotal > 0 ? ((presentDays / recordedTotal) * 100).toFixed(1) + '%' : '0.0%'

  return {
    workingDays,
    presentDays,
    absentDays,
    leaveDays,
    lateDays,
    attendanceRate,
  }
}

/**
 * Gets real today punch log for the child.
 */
export function getTodayPunchInfo(childId: string) {
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const attendance = useAttendanceStore.getState().attendance || {}
  const rec = attendance[todayKey]?.[childId]

  const inPunch = rec?.punches?.find((p) => p.type === 'in')
  const outPunch = rec?.punches?.find((p) => p.type === 'out')

  return {
    inTime: inPunch?.time || '—',
    outTime: outPunch?.time || '—',
    status: rec?.status || null,
    isPresent: rec?.status === 'present',
  }
}
