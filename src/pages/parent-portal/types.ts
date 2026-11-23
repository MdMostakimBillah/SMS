export interface PortalChild {
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
  fatherOccupation?: string
  motherOccupation?: string
  fatherNid?: string
  motherNid?: string
  studentPhone?: string
  studentEmail?: string
  status?: string
  classTeacherName: string
  classTeacherPhone: string
  classTeacherEmail: string
}

export type PortalTab =
  | 'overview'
  | 'attendance'
  | 'academics'
  | 'fees'
  | 'homework'
  | 'communication'
  | 'profile'

export interface LeaveRequest {
  id: string
  childId: string
  startDate: string
  endDate: string
  type: 'sick' | 'casual' | 'family' | 'other'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface HomeworkItem {
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
}

export interface ExamResultItem {
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

export interface FeeItem {
  id: string
  title: string
  titleBn: string
  category: string
  dueDate: string
  amount: number
  paid: number
  due: number
  status: 'paid' | 'due' | 'partial' | 'overdue' | 'pending'
  pendingRequestId?: string
  pendingTrxId?: string
  pendingMethod?: string
  pendingDate?: string
}
