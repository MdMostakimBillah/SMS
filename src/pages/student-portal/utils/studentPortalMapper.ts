import type { StudentProfile, StudentHomework, StudentExamResult, StudentFee } from '../types'
import type { StudentAdmission } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useExamStore } from '@/store/examStore'
import { useFeeStore } from '@/store/feeStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'

export { getStudentWeeklyRoutine } from './routineMapper'

export function mapStudentsToPortalProfiles(
  admittedStudents: StudentAdmission[] | undefined
): StudentProfile[] {
  if (!admittedStudents || admittedStudents.length === 0) return []

  const teachers = useTeacherStore.getState().teachers || []
  const classes = useClassStore.getState().classes || []

  return admittedStudents.map((s, idx) => {
    let teacher = s.teacherId ? teachers.find((t) => t.id === s.teacherId) : undefined
    if (!teacher && s.class) {
      const sClass = s.class.toLowerCase().trim()
      const cls = classes.find(
        (c) =>
          c.name.toLowerCase().trim() === sClass ||
          c.name.toLowerCase().trim() === `class ${sClass}` ||
          sClass === `class ${c.name.toLowerCase().trim()}` ||
          c.id === s.class
      )
      if (cls) {
        const sec = cls.sections.find(
          (sc) => sc.name.toLowerCase().trim() === (s.section || '').toLowerCase().trim()
        )
        if (sec?.classTeacherId) {
          teacher = teachers.find((t) => t.id === sec.classTeacherId)
        }
      }
    }

    const father = s.fatherNameEn || s.fatherNameBn || ''
    const mother = s.motherNameEn || s.motherNameBn || ''
    const guardian = s.guardianName || father || mother || ''
    const emergency = s.phone || s.guardianPhone || s.fatherPhone || s.motherPhone || ''

    return {
      id: s.id || `student-${idx}`,
      nameEn: s.nameEn || '',
      nameBn: s.nameBn || s.nameEn || '',
      photo: s.photo || '',
      class: s.class || '',
      section: s.section || '',
      roll: s.roll || '',
      academicYear: s.academicYear || '',
      dob: s.dob || '',
      gender: s.gender || '',
      bloodGroup: s.bloodGroup || '',
      fatherName: father,
      fatherPhone: s.fatherPhone || '',
      motherName: mother,
      motherPhone: s.motherPhone || '',
      guardianName: guardian,
      guardianPhone: s.guardianPhone || '',
      guardianRelation: s.guardianRelation || '',
      emergencyContact: emergency,
      presentAddress: s.presentAddress || '',
      permanentAddress: s.permanentAddress || '',
      district: s.district || '',
      religion: s.religion || '',
      nationality: s.nationality || 'Bangladeshi',
      admissionDate: s.admissionDate || '',
      previousSchool: s.previousSchool || '',
      studentPhone: s.phone || '',
      studentEmail: s.email || '',
      status: s.status || 'active',
      classTeacherName: teacher ? teacher.nameEn || teacher.nameBn : '',
      classTeacherPhone: teacher?.phone || '',
      classTeacherEmail: teacher?.email || '',
    }
  })
}

export function getStudentHomework(student: StudentProfile): StudentHomework[] {
  if (!student || !student.id) return []

  const state = useAssignmentStore.getState()
  const assignments = state.assignments || []
  const submissions = state.submissions || []
  const teachers = useTeacherStore.getState().teachers || []
  const subjects = useTeacherStore.getState().subjects || []

  const sClass = (student.class || '').toLowerCase().trim()
  const sSec = (student.section || '').toLowerCase().trim()

  const matched = assignments.filter((a) => {
    if (!a.classId) return true
    const aClass = a.classId.toLowerCase().trim()
    const matchesClass =
      aClass === sClass ||
      aClass === `class ${sClass}` ||
      sClass === `class ${aClass}`
    if (!matchesClass) return false
    if (!a.sectionId) return true
    return a.sectionId.toLowerCase().trim() === sSec
  })

  return matched.map((a) => {
    const sub = submissions.find(
      (s) => s.assignmentId === a.id && s.studentId === student.id
    )
    const teacher = teachers.find((t) => t.id === a.teacherId)
    const subject = subjects.find((s) => s.id === a.subjectId)

    return {
      id: a.id,
      subject: subject?.name || a.subjectId || 'General',
      subjectBn: subject?.nameBn || subject?.name || a.subjectId || 'সাধারণ',
      title: a.title,
      titleBn: a.titleBn || a.title,
      assignedDate: a.createdAt?.split('T')[0] || '',
      dueDate: a.dueDate?.split('T')[0] || '',
      teacherName: teacher?.nameEn || teacher?.nameBn || student.classTeacherName || '',
      description: a.description || '',
      status: sub ? (sub.status === 'reviewed' ? 'evaluated' : 'submitted') : 'pending',
      marks: sub?.marks ?? undefined,
      maxMarks: a.maxMarks,
      feedback: sub?.feedback,
      submission: sub ? {
        fileUrl: sub.fileUrl,
        notes: sub.feedbackBn || sub.feedback,
        submittedAt: sub.submittedAt,
      } : undefined,
    }
  })
}

export function getStudentExamResults(student: StudentProfile, examId?: string): StudentExamResult[] {
  if (!student || !student.id) return []

  const state = useExamStore.getState()
  const marks = state.studentMarks || []
  const configs = state.subjectMarkConfigs || []
  const subjects = useTeacherStore.getState().subjects || []

  const studentMarks = marks.filter((m) => {
    if (m.studentId !== student.id) return false
    if (examId && m.examId !== examId) return false
    return true
  })

  return studentMarks.map((m) => {
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

export function getStudentFees(student: StudentProfile): StudentFee[] {
  if (!student || !student.id) return []

  const state = useFeeStore.getState()
  const structures = state.structures || []
  const payments = state.payments || []
  const requests = state.onlinePaymentRequests || []

  const sClass = (student.class || '').toLowerCase().trim()
  const relevant = structures.filter(
    (s) => s.isActive && (!s.class || s.class.toLowerCase().trim() === sClass)
  )

  if (relevant.length > 0) {
    return relevant.map((st) => {
      const paid = payments
        .filter((p) => p.studentId === student.id && p.feeStructureId === st.id)
        .reduce((sum, p) => sum + p.amount, 0)
      const pendingReq = requests.find(
        (r) => r.studentId === student.id && (r.feeStructureId === st.id || r.id === st.id) && r.status === 'pending'
      )
      const due = Math.max(0, st.amount - paid)

      return {
        id: st.id,
        title: st.name,
        titleBn: st.nameBn || st.name,
        category: st.type === 'monthly' ? 'Tuition' : 'General',
        dueDate: new Date().toISOString().split('T')[0],
        amount: st.amount,
        paid,
        due,
        status: pendingReq ? 'pending' : due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'due',
        pendingRequestId: pendingReq?.id,
        pendingTrxId: pendingReq?.trxId,
        pendingMethod: pendingReq?.method,
        pendingDate: pendingReq?.submittedAt,
      }
    })
  }

  try {
    const saved = localStorage.getItem(`edutech_student_portal_fees_${student.id}`)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }

  return []
}

export function getStudentAttendanceStats(studentId: string, month: Date) {
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
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
    if (!isWeekend) workingDays++

    const dateKey = format(day, 'yyyy-MM-dd')
    const rec = attendance[dateKey]?.[studentId]
    if (rec) {
      if (rec.status === 'present') {
        presentDays++
        const inPunch = rec.punches?.find((p) => p.type === 'in')
        if (inPunch && inPunch.time > '09:15') lateDays++
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
