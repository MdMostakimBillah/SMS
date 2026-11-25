import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import type { PortalChild, HomeworkItem, ExamResultItem } from '../types'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useExamStore } from '@/store/examStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { matchAssignmentToStudent, normalizeClassString } from '@/lib/assignmentUtils'
import { matchRoutineForStudent, isDateRoutineWeekend } from '@/lib/routineUtils'
import { getGradeLetter, getGpa } from '@/lib/grades'

/**
 * Parses a time string in either 12-hour ("08:45 AM", "02:15 PM") or 24-hour ("09:15", "14:30")
 * format into total minutes since midnight. Returns null if unparseable.
 */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null
  const trimmed = timeStr.trim().toUpperCase()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/)
  if (!match) return null

  let hours = parseInt(match[1], 10)
  const mins = parseInt(match[2], 10)
  const meridiem = match[3]

  if (isNaN(hours) || isNaN(mins) || mins < 0 || mins > 59) return null

  if (meridiem === 'AM') {
    if (hours === 12) hours = 0
  } else if (meridiem === 'PM') {
    if (hours !== 12) hours += 12
  }

  if (hours < 0 || hours > 23) return null
  return hours * 60 + mins
}

export const DEFAULT_LATE_THRESHOLD_MINUTES = 9 * 60 + 15 // 09:15 AM

export function isPunchLate(timeStr?: string | null): boolean {
  const minutes = parseTimeToMinutes(timeStr)
  if (minutes === null) return false
  return minutes > DEFAULT_LATE_THRESHOLD_MINUTES
}

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
    if (a.status === 'draft' || a.status === 'archived') return false
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
      teacherName: (teacher ? teacher.nameEn || teacher.nameBn : '') || child.classTeacherName || '',
      description: a.description || a.descriptionBn || '',
      descriptionBn: a.descriptionBn || a.description || '',
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
 * Computes grade letters and GPA points accurately from @/lib/grades,
 * and maps both named and ID-keyed sub-exam marks.
 */
export function getChildExamResults(child: PortalChild, examId?: string): ExamResultItem[] {
  if (!child || !child.id) return []

  const state = useExamStore.getState()
  const marks = state.studentMarks || []
  const configs = state.subjectMarkConfigs || []
  const examConfigs = state.examConfigs || []
  const subjects = useTeacherStore.getState().subjects || []

  const childMarks = marks.filter((m) => {
    if (m.studentId !== child.id) return false
    if (examId && m.examId !== examId) return false
    return true
  })

  const childClassNorm = normalizeClassString(child.class)

  return childMarks.map((m) => {
    const sub = subjects.find((s) => s.id === m.subjectId)
    const examCfg = examConfigs.find((e) => e.id === m.examId)
    const cfg = configs.find(
      (c) =>
        c.examId === m.examId &&
        c.subjectId === m.subjectId &&
        (!c.classId ||
          c.classId === m.classId ||
          normalizeClassString(c.classId) === childClassNorm)
    ) || configs.find((c) => c.examId === m.examId && c.subjectId === m.subjectId)

    const fullMarks = cfg?.fullMarks || 100
    const passMarks = cfg?.passMarks || Math.round(fullMarks * 0.33)
    const isPassed = m.totalMarks >= passMarks

    // Extract written / mcq / practical from either literal keys or subExams metadata
    const subMarks = m.subExamMarks || {}
    let written = 0
    let mcq = 0
    let practical = 0

    if (
      subMarks.written !== undefined ||
      subMarks.mcq !== undefined ||
      subMarks.practical !== undefined
    ) {
      written = subMarks.written ?? 0
      mcq = subMarks.mcq ?? 0
      practical = subMarks.practical ?? 0
    } else if (cfg?.subExams && cfg.subExams.length > 0) {
      for (const se of cfg.subExams) {
        const val = subMarks[se.id] ?? 0
        const label = `${se.name} ${se.nameBn || ''}`.toLowerCase()
        if (/mcq|obj|বহুনির্বাচ|নৈর্ব্যক্তিক/.test(label)) {
          mcq += val
        } else if (/prac|lab|viva|ব্যবহারিক/.test(label)) {
          practical += val
        } else {
          written += val
        }
      }
    } else {
      written = m.totalMarks
    }

    const pct = fullMarks > 0 ? (m.totalMarks / fullMarks) * 100 : 0
    const computedLetter = isPassed ? getGradeLetter(pct) : 'F'
    const grade = m.grade || computedLetter
    const point = getGpa(pct, isPassed && grade !== 'F')

    return {
      examId: m.examId,
      examName: examCfg?.name,
      examNameBn: examCfg?.nameBn || examCfg?.name,
      subject: sub?.name || m.subjectId || 'Subject',
      subjectBn: sub?.nameBn || sub?.name || m.subjectId || 'বিষয়',
      code: sub?.id || '',
      fullMarks,
      passMarks,
      written,
      mcq,
      practical,
      obtained: m.totalMarks,
      grade,
      point,
      status: isPassed && grade !== 'F' ? 'passed' : 'failed',
    }
  })
}

/**
 * Calculates real monthly attendance metrics for the child from attendanceStore and routine.
 */
export function getChildAttendanceStats(
  childId: string,
  month: Date,
  childClass?: string,
  childSection?: string
) {
  const attendance = useAttendanceStore.getState().attendance || {}
  const classes = useClassStore.getState().classes || []
  const routines = useClassStore.getState().routines || []
  const routine = matchRoutineForStudent(childClass || '', childSection, classes, routines)

  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })

  let presentDays = 0
  let absentDays = 0
  let leaveDays = 0
  let lateDays = 0
  let workingDays = 0
  let weekendDays = 0

  days.forEach((day) => {
    const isWeekend = isDateRoutineWeekend(day, routine)
    if (isWeekend) {
      weekendDays++
      return
    }

    workingDays++

    const dateKey = format(day, 'yyyy-MM-dd')
    const rec = attendance[dateKey]?.[childId]
    if (rec) {
      if (rec.status === 'present') {
        presentDays++
        const inPunch = rec.punches?.find((p) => p.type === 'in')
        if (inPunch && isPunchLate(inPunch.time)) {
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
    weekendDays,
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
  const outPunch = [...(rec?.punches || [])].reverse().find((p) => p.type === 'out')

  return {
    inTime: inPunch?.time || '—',
    outTime: outPunch?.time || '—',
    status: rec?.status || null,
    isPresent: rec?.status === 'present',
  }
}
