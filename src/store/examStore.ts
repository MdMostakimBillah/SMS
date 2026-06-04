import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ───

export type ExamType = 'semester-1' | 'semester-2' | 'annual' | 'midterm' | 'final' | 'custom'

export interface ExamConfig {
  id: string
  name: string
  nameBn: string
  type: ExamType
  session: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

export interface SubExam {
  id: string
  name: string
  nameBn: string
  fullMarks: number
  passMarks: number
}

export interface SubjectMarkConfig {
  id: string
  examId: string
  classId: string
  subjectId: string
  fullMarks: number
  passMarks: number
  subExams: SubExam[]
}

export interface StudentMark {
  id: string
  examId: string
  studentId: string
  subjectId: string
  classId: string
  sectionId: string
  subExamMarks: Record<string, number>
  totalMarks: number
  grade: string
  enteredAt: string
  updatedAt: string
}

// ─── Step 2: Schedule & Routine ───

export interface ExamRoutine {
  id: string
  examId: string
  classId: string
  sectionId: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  roomNo: string
  status: 'upcoming' | 'in-progress' | 'completed'
  createdAt: string
}

// ─── Step 3: Room & Seat ───

export interface ExamRoom {
  id: string
  roomNo: string
  roomName: string
  capacity: number
  building: string
  floor: string
  isActive: boolean
}

export interface ExamSeatPlan {
  id: string
  examId: string
  roomId: string
  studentId: string
  classId: string
  sectionId: string
  seatNo: number
  roll: string
  assignedAt: string
}

export interface InvigilatorAssignment {
  id: string
  examId: string
  roomId: string
  teacherId: string
  date: string
  session: string
  shift: 'morning' | 'afternoon'
}

// ─── Step 4: OMR ───

export interface OMRConfig {
  id: string
  examId: string
  subjectId: string
  totalQuestions: number
  correctMark: number
  negativeMark: number
  optionCount: number
  sheetFormat: 'A' | 'B' | 'C' | 'D'
  createdAt: string
}

// ─── Step 7: Extra Marks ───

export interface ExtraMarkEntry {
  id: string
  examId: string
  studentId: string
  classId: string
  sectionId: string
  type: 'attendance' | 'discipline' | 'homework'
  marks: number
  maxMarks: number
  note: string
  createdAt: string
}

// ─── Step 9: Marksheet ───

export interface MarksheetConfig {
  id: string
  name: string
  nameBn: string
  examId: string
  sessionId: string
  headSubjectId: string
  workingDays: number
  schoolName: string
  schoolNameBn: string
  schoolAddress: string
  logo: string
  footer: string
  footerBn: string
  isPublished: boolean
  createdAt: string
}

// ─── Step 5: General Ability ───

export interface GeneralAbilityConfig {
  id: string
  examId: string
  name: string
  nameBn: string
  maxMarks: number
  description: string
}

// ─── Step 10: Grade Scale ───

export interface GradeScale {
  id: string
  name: string
  nameBn: string
  isActive: boolean
  grades: { grade: string; minPct: number; gpa: number; color: string }[]
}

// ─── Step 11: Working Days ───

export interface WorkingDaysConfig {
  id: string
  examId: string
  totalWorkingDays: number
  classId: string
}

// ─── Step 12: Student Promotion ───

export interface StudentPromotion {
  id: string
  examId: string
  studentId: string
  fromClass: string
  fromSection: string
  toClass: string
  toSection: string
  status: 'eligible' | 'promoted' | 'not-eligible' | 'detained'
  totalMarks: number
  obtainedMarks: number
  percentage: number
  grade: string
  promotedAt: string
  promotedBy: string
}

// ─── Step 13: Cumulative Marksheet ───

export interface CumulativeMarksheet {
  id: string
  name: string
  nameBn: string
  examIds: string[]
  sessionId: string
  classId: string
  isPublished: boolean
  createdAt: string
}

// ─── Step 14: Marks Entry Status ───

export interface MarksEntryStatus {
  id: string
  examId: string
  classId: string
  sectionId: string
  subjectId: string
  teacherId: string
  status: 'pending' | 'in-progress' | 'completed' | 'locked'
  totalStudents: number
  enteredCount: number
  lockedAt: string | null
}

// ─── OMR Template ───

export interface OMRTemplate {
  id: string
  name: string
  nameBn: string
  examId: string
  classId: string
  subjectId: string
  sessionName: string
  className: string
  classNameBn: string
  examName: string
  examNameBn: string
  themeColor: string
  serialNumber: string
  totalQuestions: number
  optionCount: number
  sheetFormat: 'A' | 'B' | 'C' | 'D'
  correctMark: number
  negativeMark: number
  totalCopy: number
  showRollNo: boolean
  showRegistrationNo: boolean
  showSetCode: boolean
  showSubjects: boolean
  showSubjectCode: boolean
  showQRCode: boolean
  showBarcode: boolean
  showStudentPhoto: boolean
  showStudentSignature: boolean
  showExaminerSection: boolean
  showAdditionalPaper: boolean
  showInstructions: boolean
  isArchived: boolean
  version: number
  modifiedBy: string
  createdAt: string
  updatedAt: string
}

// ─── Demo Data ───

const defaultExamConfigs: ExamConfig[] = [
  {
    id: 'EXAM-001',
    name: '1st Semester Exam',
    nameBn: '১ম সেমিস্টার পরীক্ষা',
    type: 'semester-1',
    session: '2025-26',
    startDate: '2025-06-15',
    endDate: '2025-06-25',
    isActive: true,
    createdAt: '2025-05-01',
  },
  {
    id: 'EXAM-002',
    name: '2nd Semester Exam',
    nameBn: '২য় সেমিস্টার পরীক্ষা',
    type: 'semester-2',
    session: '2025-26',
    startDate: '2025-11-10',
    endDate: '2025-11-20',
    isActive: false,
    createdAt: '2025-05-01',
  },
  {
    id: 'EXAM-003',
    name: 'Annual Exam',
    nameBn: 'বার্ষিক পরীক্ষা',
    type: 'annual',
    session: '2025-26',
    startDate: '2026-03-01',
    endDate: '2026-03-15',
    isActive: false,
    createdAt: '2025-05-01',
  },
  {
    id: 'EXAM-004',
    name: 'Mid-term Test',
    nameBn: 'মধ্যবর্তী পরীক্ষা',
    type: 'midterm',
    session: '2025-26',
    startDate: '2025-08-20',
    endDate: '2025-08-22',
    isActive: false,
    createdAt: '2025-05-01',
  },
]

const defaultSubjectMarkConfigs: SubjectMarkConfig[] = [
  {
    id: 'SMC-001',
    examId: 'EXAM-001',
    classId: 'Class-6',
    subjectId: 'SUB-001',
    fullMarks: 100,
    passMarks: 33,
    subExams: [
      { id: 'SE-001', name: 'CQ', nameBn: 'সিকিউ', fullMarks: 50, passMarks: 17 },
      { id: 'SE-002', name: 'MCQ', nameBn: 'এমসিকিউ', fullMarks: 25, passMarks: 8 },
      { id: 'SE-003', name: 'Practical', nameBn: 'প্র্যাকটিক্যাল', fullMarks: 25, passMarks: 8 },
    ],
  },
  {
    id: 'SMC-002',
    examId: 'EXAM-001',
    classId: 'Class-6',
    subjectId: 'SUB-002',
    fullMarks: 100,
    passMarks: 33,
    subExams: [
      { id: 'SE-004', name: 'CQ', nameBn: 'সিকিউ', fullMarks: 50, passMarks: 17 },
      { id: 'SE-005', name: 'MCQ', nameBn: 'এমসিকিউ', fullMarks: 25, passMarks: 8 },
      { id: 'SE-006', name: 'Practical', nameBn: 'প্র্যাকটিক্যাল', fullMarks: 25, passMarks: 8 },
    ],
  },
  {
    id: 'SMC-003',
    examId: 'EXAM-001',
    classId: 'Class-6',
    subjectId: 'SUB-003',
    fullMarks: 100,
    passMarks: 33,
    subExams: [
      { id: 'SE-007', name: 'CQ', nameBn: 'সিকিউ', fullMarks: 60, passMarks: 20 },
      { id: 'SE-008', name: 'MCQ', nameBn: 'এমসিকিউ', fullMarks: 40, passMarks: 13 },
    ],
  },
  {
    id: 'SMC-004',
    examId: 'EXAM-001',
    classId: 'Class-6',
    subjectId: 'SUB-004',
    fullMarks: 100,
    passMarks: 33,
    subExams: [
      { id: 'SE-009', name: 'CQ', nameBn: 'সিকিউ', fullMarks: 50, passMarks: 17 },
      { id: 'SE-010', name: 'MCQ', nameBn: 'এমসিকিউ', fullMarks: 20, passMarks: 7 },
      { id: 'SE-011', name: 'Oral', nameBn: 'মৌখিক', fullMarks: 15, passMarks: 5 },
      { id: 'SE-012', name: 'Assignment', nameBn: 'এসাইনমেন্ট', fullMarks: 15, passMarks: 5 },
    ],
  },
  {
    id: 'SMC-005',
    examId: 'EXAM-001',
    classId: 'Class-6',
    subjectId: 'SUB-005',
    fullMarks: 100,
    passMarks: 33,
    subExams: [
      { id: 'SE-013', name: 'CQ', nameBn: 'সিকিউ', fullMarks: 45, passMarks: 15 },
      { id: 'SE-014', name: 'MCQ', nameBn: 'এমসিকিউ', fullMarks: 20, passMarks: 7 },
      { id: 'SE-015', name: 'Oral', nameBn: 'মৌখিক', fullMarks: 20, passMarks: 7 },
      { id: 'SE-016', name: 'Written', nameBn: 'লিখিত', fullMarks: 15, passMarks: 5 },
    ],
  },
]

const defaultRoutines: ExamRoutine[] = [
  {
    id: 'RT-001',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-001',
    date: '2025-06-15',
    startTime: '09:00',
    endTime: '12:00',
    roomNo: 'R-101',
    status: 'completed',
    createdAt: '2025-06-01',
  },
  {
    id: 'RT-002',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-002',
    date: '2025-06-16',
    startTime: '09:00',
    endTime: '12:00',
    roomNo: 'R-101',
    status: 'completed',
    createdAt: '2025-06-01',
  },
  {
    id: 'RT-003',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-003',
    date: '2025-06-17',
    startTime: '09:00',
    endTime: '11:00',
    roomNo: 'R-102',
    status: 'completed',
    createdAt: '2025-06-01',
  },
  {
    id: 'RT-004',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-004',
    date: '2025-06-18',
    startTime: '09:00',
    endTime: '12:00',
    roomNo: 'R-101',
    status: 'completed',
    createdAt: '2025-06-01',
  },
  {
    id: 'RT-005',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-005',
    date: '2025-06-19',
    startTime: '14:00',
    endTime: '16:00',
    roomNo: 'R-103',
    status: 'completed',
    createdAt: '2025-06-01',
  },
  {
    id: 'RT-006',
    examId: 'EXAM-001',
    classId: 'Class-2',
    sectionId: 'A',
    subjectId: 'SUB-001',
    date: '2025-06-20',
    startTime: '09:00',
    endTime: '12:00',
    roomNo: 'R-201',
    status: 'in-progress',
    createdAt: '2025-06-01',
  },
  {
    id: 'RT-007',
    examId: 'EXAM-002',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-001',
    date: '2025-11-10',
    startTime: '09:00',
    endTime: '12:00',
    roomNo: 'R-101',
    status: 'upcoming',
    createdAt: '2025-10-01',
  },
]

const defaultRooms: ExamRoom[] = [
  { id: 'RM-001', roomNo: 'R-101', roomName: 'Room 101', capacity: 40, building: 'Main', floor: '1st', isActive: true },
  { id: 'RM-002', roomNo: 'R-102', roomName: 'Room 102', capacity: 40, building: 'Main', floor: '1st', isActive: true },
  { id: 'RM-003', roomNo: 'R-103', roomName: 'Room 103', capacity: 35, building: 'Main', floor: '1st', isActive: true },
  { id: 'RM-004', roomNo: 'R-201', roomName: 'Room 201', capacity: 45, building: 'Main', floor: '2nd', isActive: true },
  { id: 'RM-005', roomNo: 'R-202', roomName: 'Room 202', capacity: 45, building: 'Main', floor: '2nd', isActive: true },
  { id: 'RM-006', roomNo: 'L-001', roomName: 'Lab 01', capacity: 30, building: 'Science', floor: '1st', isActive: true },
]

const defaultSeatPlans: ExamSeatPlan[] = [
  {
    id: 'SP-001',
    examId: 'EXAM-001',
    roomId: 'RM-001',
    studentId: 'STU-001',
    classId: 'Class-1',
    sectionId: 'A',
    seatNo: 1,
    roll: '001',
    assignedAt: '2025-06-10',
  },
  {
    id: 'SP-002',
    examId: 'EXAM-001',
    roomId: 'RM-001',
    studentId: 'STU-002',
    classId: 'Class-1',
    sectionId: 'A',
    seatNo: 2,
    roll: '002',
    assignedAt: '2025-06-10',
  },
  {
    id: 'SP-003',
    examId: 'EXAM-001',
    roomId: 'RM-001',
    studentId: 'STU-003',
    classId: 'Class-1',
    sectionId: 'A',
    seatNo: 3,
    roll: '003',
    assignedAt: '2025-06-10',
  },
  {
    id: 'SP-004',
    examId: 'EXAM-001',
    roomId: 'RM-002',
    studentId: 'STU-004',
    classId: 'Class-1',
    sectionId: 'B',
    seatNo: 1,
    roll: '001',
    assignedAt: '2025-06-10',
  },
  {
    id: 'SP-005',
    examId: 'EXAM-001',
    roomId: 'RM-002',
    studentId: 'STU-005',
    classId: 'Class-1',
    sectionId: 'B',
    seatNo: 2,
    roll: '002',
    assignedAt: '2025-06-10',
  },
]

const defaultInvigilators: InvigilatorAssignment[] = [
  { id: 'INV-001', examId: 'EXAM-001', roomId: 'RM-001', teacherId: 'TCH-001', date: '2025-06-15', session: 'morning', shift: 'morning' },
  { id: 'INV-002', examId: 'EXAM-001', roomId: 'RM-002', teacherId: 'TCH-002', date: '2025-06-15', session: 'morning', shift: 'morning' },
  { id: 'INV-003', examId: 'EXAM-001', roomId: 'RM-003', teacherId: 'TCH-003', date: '2025-06-16', session: 'morning', shift: 'morning' },
]

const defaultOMRConfigs: OMRConfig[] = [
  {
    id: 'OMR-001',
    examId: 'EXAM-001',
    subjectId: 'SUB-001',
    totalQuestions: 50,
    correctMark: 2,
    negativeMark: 0.5,
    optionCount: 4,
    sheetFormat: 'A',
    createdAt: '2025-06-01',
  },
  {
    id: 'OMR-002',
    examId: 'EXAM-001',
    subjectId: 'SUB-002',
    totalQuestions: 40,
    correctMark: 2.5,
    negativeMark: 0.5,
    optionCount: 4,
    sheetFormat: 'B',
    createdAt: '2025-06-01',
  },
]

const defaultOMRTemplates: OMRTemplate[] = []

const defaultExtraMarks: ExtraMarkEntry[] = [
  {
    id: 'EM-001',
    examId: 'EXAM-001',
    studentId: 'STU-001',
    classId: 'Class-1',
    sectionId: 'A',
    type: 'attendance',
    marks: 8,
    maxMarks: 10,
    note: '80% attendance',
    createdAt: '2025-06-25',
  },
  {
    id: 'EM-002',
    examId: 'EXAM-001',
    studentId: 'STU-001',
    classId: 'Class-1',
    sectionId: 'A',
    type: 'discipline',
    marks: 9,
    maxMarks: 10,
    note: 'Excellent behavior',
    createdAt: '2025-06-25',
  },
  {
    id: 'EM-003',
    examId: 'EXAM-001',
    studentId: 'STU-001',
    classId: 'Class-1',
    sectionId: 'A',
    type: 'homework',
    marks: 18,
    maxMarks: 20,
    note: '90% completion',
    createdAt: '2025-06-25',
  },
  {
    id: 'EM-004',
    examId: 'EXAM-001',
    studentId: 'STU-002',
    classId: 'Class-1',
    sectionId: 'A',
    type: 'attendance',
    marks: 9,
    maxMarks: 10,
    note: '90% attendance',
    createdAt: '2025-06-25',
  },
  {
    id: 'EM-005',
    examId: 'EXAM-001',
    studentId: 'STU-002',
    classId: 'Class-1',
    sectionId: 'A',
    type: 'discipline',
    marks: 10,
    maxMarks: 10,
    note: 'Perfect conduct',
    createdAt: '2025-06-25',
  },
  {
    id: 'EM-006',
    examId: 'EXAM-001',
    studentId: 'STU-002',
    classId: 'Class-1',
    sectionId: 'A',
    type: 'homework',
    marks: 19,
    maxMarks: 20,
    note: '95% completion',
    createdAt: '2025-06-25',
  },
]

const defaultMarksheetConfigs: MarksheetConfig[] = [
  {
    id: 'MS-001',
    name: '1st Semester Marksheet',
    nameBn: '১ম সেমিস্টার মার্কশিট',
    examId: 'EXAM-001',
    sessionId: '2025-26',
    headSubjectId: 'SUB-003',
    workingDays: 120,
    schoolName: 'EduTech International School',
    schoolNameBn: 'এডুটেক ইন্টারন্যাশনাল স্কুল',
    schoolAddress: 'Dhaka, Bangladesh',
    logo: '',
    footer: 'This is a system-generated marksheet.',
    footerBn: 'এটি একটি সিস্টেম-জেনারেটেড মার্কশিট।',
    isPublished: false,
    createdAt: '2025-06-25',
  },
]

const defaultGeneralAbilities: GeneralAbilityConfig[] = [
  {
    id: 'GA-001',
    examId: 'EXAM-001',
    name: 'Creative Thinking',
    nameBn: 'সৃজনশীল চিন্তা',
    maxMarks: 10,
    description: 'Assess creative thinking ability',
  },
  { id: 'GA-002', examId: 'EXAM-001', name: 'Leadership', nameBn: 'নেতৃত্ব', maxMarks: 10, description: 'Assess leadership qualities' },
]

const defaultGradeScale: GradeScale[] = [
  {
    id: 'GS-001',
    name: 'Standard',
    nameBn: 'স্ট্যান্ডার্ড',
    isActive: true,
    grades: [
      { grade: 'A+', minPct: 80, gpa: 5.0, color: '#10b981' },
      { grade: 'A', minPct: 70, gpa: 4.0, color: '#34d399' },
      { grade: 'A-', minPct: 60, gpa: 3.5, color: '#6ee7b7' },
      { grade: 'B', minPct: 50, gpa: 3.0, color: '#60a5fa' },
      { grade: 'C', minPct: 40, gpa: 2.0, color: '#fbbf24' },
      { grade: 'D', minPct: 33, gpa: 1.0, color: '#f97316' },
      { grade: 'F', minPct: 0, gpa: 0.0, color: '#ef4444' },
    ],
  },
]

const defaultWorkingDays: WorkingDaysConfig[] = [
  { id: 'WD-001', examId: 'EXAM-001', totalWorkingDays: 120, classId: 'Class-1' },
  { id: 'WD-002', examId: 'EXAM-001', totalWorkingDays: 118, classId: 'Class-2' },
]

const defaultPromotions: StudentPromotion[] = [
  {
    id: 'PRM-001',
    examId: 'EXAM-001',
    studentId: 'STU-001',
    fromClass: 'Class-1',
    fromSection: 'A',
    toClass: 'Class-2',
    toSection: 'A',
    status: 'promoted',
    totalMarks: 500,
    obtainedMarks: 425,
    percentage: 85,
    grade: 'A+',
    promotedAt: '2025-06-30',
    promotedBy: 'Admin',
  },
  {
    id: 'PRM-002',
    examId: 'EXAM-001',
    studentId: 'STU-002',
    fromClass: 'Class-1',
    fromSection: 'A',
    toClass: 'Class-2',
    toSection: 'A',
    status: 'eligible',
    totalMarks: 500,
    obtainedMarks: 380,
    percentage: 76,
    grade: 'A',
    promotedAt: '',
    promotedBy: '',
  },
  {
    id: 'PRM-003',
    examId: 'EXAM-001',
    studentId: 'STU-003',
    fromClass: 'Class-1',
    fromSection: 'A',
    toClass: 'Class-2',
    toSection: 'A',
    status: 'not-eligible',
    totalMarks: 500,
    obtainedMarks: 155,
    percentage: 31,
    grade: 'F',
    promotedAt: '',
    promotedBy: '',
  },
]

const defaultCumulativeSheets: CumulativeMarksheet[] = [
  {
    id: 'CMS-001',
    name: 'Annual Cumulative',
    nameBn: 'বার্ষিক কিউমুলেটিভ',
    examIds: ['EXAM-001', 'EXAM-002'],
    sessionId: '2025-26',
    classId: 'Class-1',
    isPublished: false,
    createdAt: '2025-06-25',
  },
]

const defaultMarksEntryStatus: MarksEntryStatus[] = [
  {
    id: 'MES-001',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-001',
    teacherId: 'TCH-001',
    status: 'completed',
    totalStudents: 40,
    enteredCount: 40,
    lockedAt: '2025-06-20',
  },
  {
    id: 'MES-002',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-002',
    teacherId: 'TCH-002',
    status: 'completed',
    totalStudents: 40,
    enteredCount: 40,
    lockedAt: '2025-06-20',
  },
  {
    id: 'MES-003',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-003',
    teacherId: 'TCH-003',
    status: 'in-progress',
    totalStudents: 40,
    enteredCount: 28,
    lockedAt: null,
  },
  {
    id: 'MES-004',
    examId: 'EXAM-001',
    classId: 'Class-1',
    sectionId: 'A',
    subjectId: 'SUB-004',
    teacherId: 'TCH-001',
    status: 'pending',
    totalStudents: 40,
    enteredCount: 0,
    lockedAt: null,
  },
  {
    id: 'MES-005',
    examId: 'EXAM-001',
    classId: 'Class-2',
    sectionId: 'A',
    subjectId: 'SUB-001',
    teacherId: 'TCH-004',
    status: 'in-progress',
    totalStudents: 38,
    enteredCount: 15,
    lockedAt: null,
  },
]

function computeGrade(marks: number, full: number): string {
  const pct = full > 0 ? (marks / full) * 100 : 0
  if (pct >= 80) return 'A+'
  if (pct >= 70) return 'A'
  if (pct >= 60) return 'A-'
  if (pct >= 50) return 'B'
  if (pct >= 40) return 'C'
  if (pct >= 33) return 'D'
  return 'F'
}

// ─── Store ───

interface ExamState {
  examConfigs: ExamConfig[]
  subjectMarkConfigs: SubjectMarkConfig[]
  studentMarks: StudentMark[]
  routines: ExamRoutine[]
  rooms: ExamRoom[]
  seatPlans: ExamSeatPlan[]
  invigilators: InvigilatorAssignment[]
  omrConfigs: OMRConfig[]
  extraMarks: ExtraMarkEntry[]
  marksheetConfigs: MarksheetConfig[]
  generalAbilities: GeneralAbilityConfig[]
  gradeScales: GradeScale[]
  workingDays: WorkingDaysConfig[]
  promotions: StudentPromotion[]
  cumulativeSheets: CumulativeMarksheet[]
  marksEntryStatuses: MarksEntryStatus[]
  omrTemplates: OMRTemplate[]

  addExamConfig: (config: Omit<ExamConfig, 'id' | 'createdAt'>) => void
  updateExamConfig: (id: string, data: Partial<ExamConfig>) => void
  deleteExamConfig: (id: string) => void
  toggleExamActive: (id: string) => void

  upsertSubjectMarkConfig: (config: Omit<SubjectMarkConfig, 'id'>) => void
  deleteSubjectMarkConfig: (id: string) => void
  copyClassMarkConfig: (examId: string, fromClassId: string, toClassId: string) => void
  copySubjectConfig: (examId: string, classId: string, sourceSubjectId: string, targetSubjectIds: string[]) => void
  addSubExamToSubject: (configId: string, subExam: Omit<SubExam, 'id'>) => void
  removeSubExam: (configId: string, subExamId: string) => void
  updateSubExam: (configId: string, subExamId: string, data: Partial<SubExam>) => void

  saveStudentMark: (mark: Omit<StudentMark, 'id' | 'grade'>) => void
  saveBulkStudentMarks: (marks: Omit<StudentMark, 'id' | 'grade'>[]) => void
  deleteStudentMark: (id: string) => void
  getStudentMarksForExam: (examId: string, classId: string, sectionId: string, subjectId: string) => StudentMark[]

  addRoutine: (routine: Omit<ExamRoutine, 'id' | 'createdAt'>) => void
  updateRoutine: (id: string, data: Partial<ExamRoutine>) => void
  deleteRoutine: (id: string) => void
  bulkAddRoutines: (routines: Omit<ExamRoutine, 'id' | 'createdAt'>[]) => void

  addRoom: (room: Omit<ExamRoom, 'id'>) => void
  updateRoom: (id: string, data: Partial<ExamRoom>) => void
  deleteRoom: (id: string) => void

  addSeatPlan: (plan: Omit<ExamSeatPlan, 'id' | 'assignedAt'>) => void
  removeSeatPlan: (id: string) => void
  autoAssignSeats: (examId: string, classId: string, sectionId: string, studentIds: string[], rooms: string[]) => void

  addInvigilator: (inv: Omit<InvigilatorAssignment, 'id'>) => void
  removeInvigilator: (id: string) => void

  upsertOMRConfig: (config: Omit<OMRConfig, 'id' | 'createdAt'>) => void
  deleteOMRConfig: (id: string) => void

  saveOMRTemplate: (template: Omit<OMRTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => void
  updateOMRTemplate: (id: string, data: Partial<OMRTemplate>) => void
  deleteOMRTemplate: (id: string) => void
  duplicateOMRTemplate: (id: string, name: string) => void
  archiveOMRTemplate: (id: string) => void
  restoreOMRTemplate: (id: string) => void

  addExtraMark: (entry: Omit<ExtraMarkEntry, 'id' | 'createdAt'>) => void
  updateExtraMark: (id: string, data: Partial<ExtraMarkEntry>) => void
  deleteExtraMark: (id: string) => void
  bulkAddExtraMarks: (entries: Omit<ExtraMarkEntry, 'id' | 'createdAt'>[]) => void

  addMarksheetConfig: (config: Omit<MarksheetConfig, 'id' | 'createdAt'>) => void
  updateMarksheetConfig: (id: string, data: Partial<MarksheetConfig>) => void
  deleteMarksheetConfig: (id: string) => void
  toggleMarksheetPublished: (id: string) => void

  addGeneralAbility: (ability: Omit<GeneralAbilityConfig, 'id'>) => void
  updateGeneralAbility: (id: string, data: Partial<GeneralAbilityConfig>) => void
  deleteGeneralAbility: (id: string) => void

  addGradeScale: (scale: Omit<GradeScale, 'id'>) => void
  updateGradeScale: (id: string, data: Partial<GradeScale>) => void
  deleteGradeScale: (id: string) => void
  toggleGradeScaleActive: (id: string) => void

  addWorkingDays: (config: Omit<WorkingDaysConfig, 'id'>) => void
  updateWorkingDays: (id: string, data: Partial<WorkingDaysConfig>) => void

  addPromotion: (promo: Omit<StudentPromotion, 'id'>) => void
  updatePromotion: (id: string, data: Partial<StudentPromotion>) => void
  bulkPromote: (promotions: Omit<StudentPromotion, 'id'>[]) => void

  addCumulativeSheet: (sheet: Omit<CumulativeMarksheet, 'id' | 'createdAt'>) => void
  updateCumulativeSheet: (id: string, data: Partial<CumulativeMarksheet>) => void
  deleteCumulativeSheet: (id: string) => void
  toggleCumulativePublished: (id: string) => void

  updateMarksEntryStatus: (id: string, data: Partial<MarksEntryStatus>) => void
  addMarksEntryStatus: (entry: Omit<MarksEntryStatus, 'id'>) => void

  lockMarks: (examId: string, classId: string, sectionId: string, subjectId: string) => void
  unlockMarks: (examId: string, classId: string, sectionId: string, subjectId: string) => void
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      examConfigs: defaultExamConfigs,
      subjectMarkConfigs: defaultSubjectMarkConfigs,
      studentMarks: [],
      routines: defaultRoutines,
      rooms: defaultRooms,
      seatPlans: defaultSeatPlans,
      invigilators: defaultInvigilators,
      omrConfigs: defaultOMRConfigs,
      extraMarks: defaultExtraMarks,
      marksheetConfigs: defaultMarksheetConfigs,
      generalAbilities: defaultGeneralAbilities,
      gradeScales: defaultGradeScale,
      workingDays: defaultWorkingDays,
      promotions: defaultPromotions,
      cumulativeSheets: defaultCumulativeSheets,
      marksEntryStatuses: defaultMarksEntryStatus,
      omrTemplates: defaultOMRTemplates,

      // ─── Exam Config ───
      addExamConfig: (config) =>
        set((state) => ({
          examConfigs: [...state.examConfigs, { ...config, id: `EXAM-${Date.now()}`, createdAt: new Date().toISOString() }],
        })),
      updateExamConfig: (id, data) =>
        set((state) => ({
          examConfigs: state.examConfigs.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      deleteExamConfig: (id) =>
        set((state) => ({
          examConfigs: state.examConfigs.filter((e) => e.id !== id),
          subjectMarkConfigs: state.subjectMarkConfigs.filter((s) => s.examId !== id),
          studentMarks: state.studentMarks.filter((m) => m.examId !== id),
          routines: state.routines.filter((r) => r.examId !== id),
        })),
      toggleExamActive: (id) =>
        set((state) => ({
          examConfigs: state.examConfigs.map((e) => {
            if (e.id === id) return { ...e, isActive: !e.isActive }
            if (e.isActive) return { ...e, isActive: false }
            return e
          }),
        })),

      // ─── Subject Mark Config ───
      upsertSubjectMarkConfig: (config) =>
        set((state) => {
          const existing = state.subjectMarkConfigs.find(
            (s) => s.examId === config.examId && s.classId === config.classId && s.subjectId === config.subjectId
          )
          if (existing) {
            return {
              subjectMarkConfigs: state.subjectMarkConfigs.map((s) => (s.id === existing.id ? { ...s, ...config, id: existing.id } : s)),
            }
          }
          return { subjectMarkConfigs: [...state.subjectMarkConfigs, { ...config, id: `SMC-${Date.now()}` }] }
        }),
      deleteSubjectMarkConfig: (id) =>
        set((state) => ({
          subjectMarkConfigs: state.subjectMarkConfigs.filter((s) => s.id !== id),
        })),
      copyClassMarkConfig: (examId, fromClassId, toClassId) =>
        set((state) => {
          const sourceConfigs = state.subjectMarkConfigs.filter((s) => s.examId === examId && s.classId === fromClassId)
          const newConfigs = sourceConfigs.map((s) => ({
            ...s,
            id: `SMC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            classId: toClassId,
            subExams: s.subExams.map((se) => ({ ...se, id: `SE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
          }))
          const withoutTarget = state.subjectMarkConfigs.filter((s) => !(s.examId === examId && s.classId === toClassId))
          return { subjectMarkConfigs: [...withoutTarget, ...newConfigs] }
        }),
      copySubjectConfig: (examId, classId, sourceSubjectId, targetSubjectIds) =>
        set((state) => {
          const source = state.subjectMarkConfigs.find(
            (s) => s.examId === examId && s.classId === classId && s.subjectId === sourceSubjectId
          )
          if (!source) return state
          const newConfigs = targetSubjectIds
            .filter((tid) => tid !== sourceSubjectId)
            .map((tid) => {
              const existing = state.subjectMarkConfigs.find((s) => s.examId === examId && s.classId === classId && s.subjectId === tid)
              return {
                ...(existing || {}),
                examId,
                classId,
                subjectId: tid,
                fullMarks: source.fullMarks,
                passMarks: source.passMarks,
                subExams: source.subExams.map((se) => ({ ...se, id: `SE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
                id: existing?.id || `SMC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              }
            })
          const withoutTargets = state.subjectMarkConfigs.filter(
            (s) => !(s.examId === examId && s.classId === classId && targetSubjectIds.includes(s.subjectId))
          )
          return { subjectMarkConfigs: [...withoutTargets, ...newConfigs] }
        }),
      addSubExamToSubject: (configId, subExam) =>
        set((state) => ({
          subjectMarkConfigs: state.subjectMarkConfigs.map((s) =>
            s.id === configId ? { ...s, subExams: [...s.subExams, { ...subExam, id: `SE-${Date.now()}` }] } : s
          ),
        })),
      removeSubExam: (configId, subExamId) =>
        set((state) => ({
          subjectMarkConfigs: state.subjectMarkConfigs.map((s) =>
            s.id === configId ? { ...s, subExams: s.subExams.filter((se) => se.id !== subExamId) } : s
          ),
        })),
      updateSubExam: (configId, subExamId, data) =>
        set((state) => ({
          subjectMarkConfigs: state.subjectMarkConfigs.map((s) =>
            s.id === configId ? { ...s, subExams: s.subExams.map((se) => (se.id === subExamId ? { ...se, ...data } : se)) } : s
          ),
        })),

      // ─── Student Marks ───
      saveStudentMark: (mark) =>
        set((state) => {
          const fullConfig = state.subjectMarkConfigs.find((s) => s.examId === mark.examId && s.subjectId === mark.subjectId)
          const total = Object.values(mark.subExamMarks).reduce((a, b) => a + b, 0)
          const grade = computeGrade(total, fullConfig?.fullMarks || 100)
          const existing = state.studentMarks.find(
            (m) => m.examId === mark.examId && m.studentId === mark.studentId && m.subjectId === mark.subjectId
          )
          if (existing) {
            return {
              studentMarks: state.studentMarks.map((m) =>
                m.id === existing.id ? { ...m, ...mark, totalMarks: total, grade, updatedAt: new Date().toISOString() } : m
              ),
            }
          }
          return {
            studentMarks: [
              ...state.studentMarks,
              { ...mark, id: `SM-${Date.now()}-${mark.studentId}`, totalMarks: total, grade, updatedAt: new Date().toISOString() },
            ],
          }
        }),
      saveBulkStudentMarks: (marks) => {
        const state = get()
        const updated = [...state.studentMarks]
        for (const mark of marks) {
          const fullConfig = state.subjectMarkConfigs.find((s) => s.examId === mark.examId && s.subjectId === mark.subjectId)
          const total = Object.values(mark.subExamMarks).reduce((a, b) => a + b, 0)
          const grade = computeGrade(total, fullConfig?.fullMarks || 100)
          const existing = updated.find((m) => m.examId === mark.examId && m.studentId === mark.studentId && m.subjectId === mark.subjectId)
          if (existing) {
            const idx = updated.findIndex((m) => m.id === existing.id)
            updated[idx] = { ...existing, ...mark, totalMarks: total, grade, updatedAt: new Date().toISOString() }
          } else {
            updated.push({
              ...mark,
              id: `SM-${Date.now()}-${mark.studentId}`,
              totalMarks: total,
              grade,
              updatedAt: new Date().toISOString(),
            })
          }
        }
        set({ studentMarks: updated })
      },
      deleteStudentMark: (id) =>
        set((state) => ({
          studentMarks: state.studentMarks.filter((m) => m.id !== id),
        })),
      getStudentMarksForExam: (examId, classId, sectionId, subjectId) => {
        return get().studentMarks.filter(
          (m) => m.examId === examId && m.classId === classId && m.sectionId === sectionId && m.subjectId === subjectId
        )
      },

      // ─── Routines ───
      addRoutine: (routine) =>
        set((state) => ({
          routines: [...state.routines, { ...routine, id: `RT-${Date.now()}`, createdAt: new Date().toISOString() }],
        })),
      updateRoutine: (id, data) =>
        set((state) => ({
          routines: state.routines.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      deleteRoutine: (id) =>
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
        })),
      bulkAddRoutines: (routines) =>
        set((state) => ({
          routines: [
            ...state.routines,
            ...routines.map((r, i) => ({ ...r, id: `RT-${Date.now()}-${i}`, createdAt: new Date().toISOString() })),
          ],
        })),

      // ─── Rooms ───
      addRoom: (room) =>
        set((state) => ({
          rooms: [...state.rooms, { ...room, id: `RM-${Date.now()}` }],
        })),
      updateRoom: (id, data) =>
        set((state) => ({
          rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      deleteRoom: (id) =>
        set((state) => ({
          rooms: state.rooms.filter((r) => r.id !== id),
        })),

      // ─── Seat Plans ───
      addSeatPlan: (plan) =>
        set((state) => ({
          seatPlans: [...state.seatPlans, { ...plan, id: `SP-${Date.now()}`, assignedAt: new Date().toISOString() }],
        })),
      removeSeatPlan: (id) =>
        set((state) => ({
          seatPlans: state.seatPlans.filter((sp) => sp.id !== id),
        })),
      autoAssignSeats: (examId, classId, sectionId, studentIds, roomIds) =>
        set((state) => {
          const existing = state.seatPlans.filter((sp) => !(sp.examId === examId && sp.classId === classId && sp.sectionId === sectionId))
          const newPlans: ExamSeatPlan[] = []
          let seatNo = 1
          let roomIdx = 0
          const roomCapacities = state.rooms.filter((r) => roomIds.includes(r.id))
          for (const sid of studentIds) {
            const room = roomCapacities[roomIdx % roomCapacities.length]
            newPlans.push({
              id: `SP-${Date.now()}-${sid}`,
              examId,
              roomId: room.id,
              studentId: sid,
              classId,
              sectionId,
              seatNo,
              roll: sid.split('-').pop() || String(seatNo),
              assignedAt: new Date().toISOString(),
            })
            seatNo++
            if (seatNo > (room?.capacity || 40)) {
              seatNo = 1
              roomIdx++
            }
          }
          return { seatPlans: [...existing, ...newPlans] }
        }),

      // ─── Invigilators ───
      addInvigilator: (inv) =>
        set((state) => ({
          invigilators: [...state.invigilators, { ...inv, id: `INV-${Date.now()}` }],
        })),
      removeInvigilator: (id) =>
        set((state) => ({
          invigilators: state.invigilators.filter((i) => i.id !== id),
        })),

      // ─── OMR Config ───
      upsertOMRConfig: (config) =>
        set((state) => {
          const existing = state.omrConfigs.find((o) => o.examId === config.examId && o.subjectId === config.subjectId)
          if (existing) {
            return { omrConfigs: state.omrConfigs.map((o) => (o.id === existing.id ? { ...o, ...config, id: existing.id } : o)) }
          }
          return { omrConfigs: [...state.omrConfigs, { ...config, id: `OMR-${Date.now()}`, createdAt: new Date().toISOString() }] }
        }),
      deleteOMRConfig: (id) =>
        set((state) => ({
          omrConfigs: state.omrConfigs.filter((o) => o.id !== id),
        })),

      // ─── OMR Template ───
      saveOMRTemplate: (template) =>
        set((state) => ({
          omrTemplates: [
            ...state.omrTemplates,
            { ...template, id: `OMRT-${Date.now()}`, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        })),
      updateOMRTemplate: (id, data) =>
        set((state) => ({
          omrTemplates: state.omrTemplates.map((t) =>
            t.id === id ? { ...t, ...data, version: t.version + 1, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteOMRTemplate: (id) =>
        set((state) => ({
          omrTemplates: state.omrTemplates.filter((t) => t.id !== id),
        })),
      duplicateOMRTemplate: (id, name) =>
        set((state) => {
          const src = state.omrTemplates.find((t) => t.id === id)
          if (!src) return state
          const now = new Date().toISOString()
          return {
            omrTemplates: [
              ...state.omrTemplates,
              { ...src, id: `OMRT-${Date.now()}`, name, nameBn: name, version: 1, isArchived: false, createdAt: now, updatedAt: now },
            ],
          }
        }),
      archiveOMRTemplate: (id) =>
        set((state) => ({
          omrTemplates: state.omrTemplates.map((t) => (t.id === id ? { ...t, isArchived: true, updatedAt: new Date().toISOString() } : t)),
        })),
      restoreOMRTemplate: (id) =>
        set((state) => ({
          omrTemplates: state.omrTemplates.map((t) => (t.id === id ? { ...t, isArchived: false, updatedAt: new Date().toISOString() } : t)),
        })),

      // ─── Extra Marks ───
      addExtraMark: (entry) =>
        set((state) => ({
          extraMarks: [...state.extraMarks, { ...entry, id: `EM-${Date.now()}`, createdAt: new Date().toISOString() }],
        })),
      updateExtraMark: (id, data) =>
        set((state) => ({
          extraMarks: state.extraMarks.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      deleteExtraMark: (id) =>
        set((state) => ({
          extraMarks: state.extraMarks.filter((e) => e.id !== id),
        })),
      bulkAddExtraMarks: (entries) =>
        set((state) => ({
          extraMarks: [
            ...state.extraMarks,
            ...entries.map((e, i) => ({ ...e, id: `EM-${Date.now()}-${i}`, createdAt: new Date().toISOString() })),
          ],
        })),

      // ─── Marksheet Config ───
      addMarksheetConfig: (config) =>
        set((state) => ({
          marksheetConfigs: [...state.marksheetConfigs, { ...config, id: `MS-${Date.now()}`, createdAt: new Date().toISOString() }],
        })),
      updateMarksheetConfig: (id, data) =>
        set((state) => ({
          marksheetConfigs: state.marksheetConfigs.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),
      deleteMarksheetConfig: (id) =>
        set((state) => ({
          marksheetConfigs: state.marksheetConfigs.filter((m) => m.id !== id),
        })),
      toggleMarksheetPublished: (id) =>
        set((state) => ({
          marksheetConfigs: state.marksheetConfigs.map((m) => (m.id === id ? { ...m, isPublished: !m.isPublished } : m)),
        })),

      // ─── General Ability ───
      addGeneralAbility: (ability) =>
        set((state) => ({
          generalAbilities: [...state.generalAbilities, { ...ability, id: `GA-${Date.now()}` }],
        })),
      updateGeneralAbility: (id, data) =>
        set((state) => ({
          generalAbilities: state.generalAbilities.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      deleteGeneralAbility: (id) =>
        set((state) => ({
          generalAbilities: state.generalAbilities.filter((a) => a.id !== id),
        })),

      // ─── Grade Scale ───
      addGradeScale: (scale) =>
        set((state) => ({
          gradeScales: [...state.gradeScales, { ...scale, id: `GS-${Date.now()}` }],
        })),
      updateGradeScale: (id, data) =>
        set((state) => ({
          gradeScales: state.gradeScales.map((g) => (g.id === id ? { ...g, ...data } : g)),
        })),
      deleteGradeScale: (id) =>
        set((state) => ({
          gradeScales: state.gradeScales.filter((g) => g.id !== id),
        })),
      toggleGradeScaleActive: (id) =>
        set((state) => ({
          gradeScales: state.gradeScales.map((g) => {
            if (g.id === id) return { ...g, isActive: true }
            return { ...g, isActive: false }
          }),
        })),

      // ─── Working Days ───
      addWorkingDays: (config) =>
        set((state) => ({
          workingDays: [...state.workingDays, { ...config, id: `WD-${Date.now()}` }],
        })),
      updateWorkingDays: (id, data) =>
        set((state) => ({
          workingDays: state.workingDays.map((w) => (w.id === id ? { ...w, ...data } : w)),
        })),

      // ─── Promotions ───
      addPromotion: (promo) =>
        set((state) => ({
          promotions: [...state.promotions, { ...promo, id: `PRM-${Date.now()}` }],
        })),
      updatePromotion: (id, data) =>
        set((state) => ({
          promotions: state.promotions.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      bulkPromote: (promotions) =>
        set((state) => ({
          promotions: [...state.promotions, ...promotions.map((p, i) => ({ ...p, id: `PRM-${Date.now()}-${i}` }))],
        })),

      // ─── Cumulative Marksheet ───
      addCumulativeSheet: (sheet) =>
        set((state) => ({
          cumulativeSheets: [...state.cumulativeSheets, { ...sheet, id: `CMS-${Date.now()}`, createdAt: new Date().toISOString() }],
        })),
      updateCumulativeSheet: (id, data) =>
        set((state) => ({
          cumulativeSheets: state.cumulativeSheets.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCumulativeSheet: (id) =>
        set((state) => ({
          cumulativeSheets: state.cumulativeSheets.filter((c) => c.id !== id),
        })),
      toggleCumulativePublished: (id) =>
        set((state) => ({
          cumulativeSheets: state.cumulativeSheets.map((c) => (c.id === id ? { ...c, isPublished: !c.isPublished } : c)),
        })),

      // ─── Marks Entry Status ───
      updateMarksEntryStatus: (id, data) =>
        set((state) => ({
          marksEntryStatuses: state.marksEntryStatuses.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),
      addMarksEntryStatus: (entry) =>
        set((state) => ({
          marksEntryStatuses: [...state.marksEntryStatuses, { ...entry, id: `MES-${Date.now()}` }],
        })),

      // ─── Lock/Unlock Marks ───
      lockMarks: (examId, classId, sectionId, subjectId) =>
        set((state) => {
          const entry = state.marksEntryStatuses.find(
            (m) => m.examId === examId && m.classId === classId && m.sectionId === sectionId && m.subjectId === subjectId
          )
          if (entry) {
            return {
              marksEntryStatuses: state.marksEntryStatuses.map((m) =>
                m.id === entry.id ? { ...m, status: 'locked' as const, lockedAt: new Date().toISOString() } : m
              ),
            }
          }
          return state
        }),
      unlockMarks: (examId, classId, sectionId, subjectId) =>
        set((state) => {
          const entry = state.marksEntryStatuses.find(
            (m) => m.examId === examId && m.classId === classId && m.sectionId === sectionId && m.subjectId === subjectId
          )
          if (entry) {
            return {
              marksEntryStatuses: state.marksEntryStatuses.map((m) =>
                m.id === entry.id ? { ...m, status: 'completed' as const, lockedAt: null } : m
              ),
            }
          }
          return state
        }),
    }),
    { name: 'edutech-exams', version: 5 }
  )
)
