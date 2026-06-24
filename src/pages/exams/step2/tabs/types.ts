import type { ExamRoom, ExamRoutine, ExamSeatPlan, InvigilatorAssignment, ExamAttendance, SubjectMarkConfig } from '@/store/examStore'

export type SubTab = 'routine' | 'rooms' | 'seats' | 'invigilators' | 'attendance' | 'admit-cards'

export const statusStyles: Record<string, { bg: string; color: string; dot: string; label: string; labelBn: string }> = {
  completed: { bg: 'var(--green-light)', color: 'var(--green)', dot: 'var(--green)', label: 'Completed', labelBn: 'সম্পন্ন' },
  'in-progress': { bg: 'var(--amber-light)', color: 'var(--amber)', dot: 'var(--amber)', label: 'In Progress', labelBn: 'চলমান' },
  upcoming: { bg: 'var(--brand-light)', color: 'var(--brand)', dot: 'var(--brand)', label: 'Upcoming', labelBn: 'আসন্ন' },
}

export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']

export interface Step2Data {
  teachers: any[]
  subjects: any[]
  students: any[]
  examConfigs: any[]
  selectedExamId: string
  selectedExam: any
  routines: ExamRoutine[]
  rooms: ExamRoom[]
  seatPlans: ExamSeatPlan[]
  invigilators: InvigilatorAssignment[]
  attendances: ExamAttendance[]
  subjectMarkConfigs: SubjectMarkConfig[]
  classes: any[]
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  isBn: boolean
  isMobile: boolean
  isTablet: boolean
}

export interface Step2Actions {
  addRoutine: (r: any) => void
  deleteRoutine: (id: string) => void
  addRoom: (r: any) => void
  updateRoom: (id: string, r: any) => void
  deleteRoom: (id: string) => void
  addSeatPlan: (sp: any) => void
  removeSeatPlan: (id: string) => void
  addInvigilator: (inv: any) => void
  removeInvigilator: (id: string) => void
  addAttendance: (a: any) => void
}

export interface Step2Computed {
  filteredRoutines: ExamRoutine[]
  filteredSeatPlans: ExamSeatPlan[]
  filteredInvigilators: InvigilatorAssignment[]
  filteredAttendances: ExamAttendance[]
  subjectMap: Map<string, any>
  studentMap: Map<string, any>
  roomMap: Map<string, any>
  teacherMap: Map<string, any>
  roomCapacityMap: Map<string, { date: string; count: number }[]>
  calendarRange: { start: Date; end: Date } | null
  examDayCount: number
  completedDays: number
  upcomingDays: number
}

export interface Step2State {
  currentMonth: Date
  setCurrentMonth: (d: Date) => void
  selectedDate: Date | null
  setSelectedDate: (d: Date | null) => void
  showDayDetail: boolean
  setShowDayDetail: (v: boolean) => void
}
