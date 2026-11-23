export interface StudentProfile {
  id: string
  nameEn: string
  nameBn: string
  photo: string
  class: string
  section: string
  roll: string
  academicYear: string
  dob: string
  gender: string
  bloodGroup: string
  fatherName: string
  fatherPhone: string
  motherName: string
  motherPhone: string
  guardianName: string
  guardianPhone: string
  guardianRelation: string
  emergencyContact: string
  presentAddress: string
  permanentAddress?: string
  district?: string
  religion?: string
  nationality?: string
  admissionDate?: string
  previousSchool?: string
  studentPhone?: string
  studentEmail?: string
  status?: string
  classTeacherName: string
  classTeacherPhone: string
  classTeacherEmail: string
}

export type StudentPortalTab =
  | 'overview'
  | 'routine'
  | 'academics'
  | 'homework'
  | 'attendance'
  | 'fees'
  | 'profile'

export interface StudentRoutinePeriod {
  periodIndex: number
  periodLabel: string
  startTime: string
  endTime: string
  subjectId: string
  subjectName: string
  subjectNameBn: string
  teacherId: string
  teacherName: string
  room?: string
  isBreak?: boolean
}

export interface StudentDayRoutine {
  dayIndex: number
  dayNameEn: string
  dayNameBn: string
  isToday: boolean
  isWeekend: boolean
  periods: StudentRoutinePeriod[]
}

export interface StudentHomework {
  id: string
  type?: 'homework' | 'assignment'
  subject: string
  subjectBn: string
  title: string
  titleBn: string
  assignedDate: string
  dueDate: string
  teacherName: string
  description: string
  status: 'pending' | 'submitted' | 'evaluated'
  marks?: number
  maxMarks?: number
  feedback?: string
  attachments?: string[]
  submission?: {
    fileUrl?: string
    notes?: string
    submittedAt?: string
  }
}

export interface StudentExamResult {
  subject: string
  subjectBn: string
  code: string
  fullMarks: number
  passMarks: number
  written: number
  mcq: number
  practical: number
  obtained: number
  grade: string
  point: number
  status: 'passed' | 'failed'
}

export interface StudentFee {
  id: string
  title: string
  titleBn: string
  category: string
  dueDate: string
  amount: number
  paid: number
  due: number
  status: 'paid' | 'due' | 'partial' | 'pending'
  pendingRequestId?: string
  pendingTrxId?: string
  pendingMethod?: string
  pendingDate?: string
}

export interface StudentLeaveRequest {
  id: string
  studentId: string
  startDate: string
  endDate: string
  type: 'sick' | 'casual' | 'family' | 'other'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
