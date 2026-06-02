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
  weight: number
}

export interface SubjectMarkConfig {
  id: string
  examId: string
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

// ─── Demo Data ───

const defaultExamConfigs: ExamConfig[] = [
  { id: 'EXAM-001', name: '1st Semester Exam', nameBn: '১ম সেমিস্টার পরীক্ষা', type: 'semester-1', session: '2025-26', startDate: '2025-06-15', endDate: '2025-06-25', isActive: true, createdAt: '2025-05-01' },
  { id: 'EXAM-002', name: '2nd Semester Exam', nameBn: '২য় সেমিস্টার পরীক্ষা', type: 'semester-2', session: '2025-26', startDate: '2025-11-10', endDate: '2025-11-20', isActive: false, createdAt: '2025-05-01' },
  { id: 'EXAM-003', name: 'Annual Exam', nameBn: 'বার্ষিক পরীক্ষা', type: 'annual', session: '2025-26', startDate: '2026-03-01', endDate: '2026-03-15', isActive: false, createdAt: '2025-05-01' },
  { id: 'EXAM-004', name: 'Mid-term Test', nameBn: 'মধ্যবর্তী পরীক্ষা', type: 'midterm', session: '2025-26', startDate: '2025-08-20', endDate: '2025-08-22', isActive: false, createdAt: '2025-05-01' },
]

const defaultSubjectMarkConfigs: SubjectMarkConfig[] = [
  // 1st Semester - Physics
  { id: 'SMC-001', examId: 'EXAM-001', subjectId: 'SUB-001', fullMarks: 100, passMarks: 33, subExams: [
    { id: 'SE-001', name: 'CQ', nameBn: 'সিকিউ', weight: 50 },
    { id: 'SE-002', name: 'MCQ', nameBn: 'এমসিকিউ', weight: 25 },
    { id: 'SE-003', name: 'Practical', nameBn: 'প্র্যাকটিক্যাল', weight: 25 },
  ]},
  // 1st Semester - Chemistry
  { id: 'SMC-002', examId: 'EXAM-001', subjectId: 'SUB-002', fullMarks: 100, passMarks: 33, subExams: [
    { id: 'SE-004', name: 'CQ', nameBn: 'সিকিউ', weight: 50 },
    { id: 'SE-005', name: 'MCQ', nameBn: 'এমসিকিউ', weight: 25 },
    { id: 'SE-006', name: 'Practical', nameBn: 'প্র্যাকটিক্যাল', weight: 25 },
  ]},
  // 1st Semester - Mathematics
  { id: 'SMC-003', examId: 'EXAM-001', subjectId: 'SUB-003', fullMarks: 100, passMarks: 33, subExams: [
    { id: 'SE-007', name: 'CQ', nameBn: 'সিকিউ', weight: 60 },
    { id: 'SE-008', name: 'MCQ', nameBn: 'এমসিকিউ', weight: 40 },
  ]},
  // 1st Semester - Bangla
  { id: 'SMC-004', examId: 'EXAM-001', subjectId: 'SUB-004', fullMarks: 100, passMarks: 33, subExams: [
    { id: 'SE-009', name: 'CQ', nameBn: 'সিকিউ', weight: 50 },
    { id: 'SE-010', name: 'MCQ', nameBn: 'এমসিকিউ', weight: 20 },
    { id: 'SE-011', name: 'Oral', nameBn: 'মৌখিক', weight: 15 },
    { id: 'SE-012', name: 'Assignment', nameBn: 'এসাইনমেন্ট', weight: 15 },
  ]},
  // 1st Semester - English
  { id: 'SMC-005', examId: 'EXAM-001', subjectId: 'SUB-005', fullMarks: 100, passMarks: 33, subExams: [
    { id: 'SE-013', name: 'CQ', nameBn: 'সিকিউ', weight: 45 },
    { id: 'SE-014', name: 'MCQ', nameBn: 'এমসিকিউ', weight: 20 },
    { id: 'SE-015', name: 'Oral', nameBn: 'মৌখিক', weight: 20 },
    { id: 'SE-016', name: 'Written', nameBn: 'লিখিত', weight: 15 },
  ]},
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

  addExamConfig: (config: Omit<ExamConfig, 'id' | 'createdAt'>) => void
  updateExamConfig: (id: string, data: Partial<ExamConfig>) => void
  deleteExamConfig: (id: string) => void
  toggleExamActive: (id: string) => void

  upsertSubjectMarkConfig: (config: Omit<SubjectMarkConfig, 'id'>) => void
  deleteSubjectMarkConfig: (id: string) => void
  addSubExamToSubject: (configId: string, subExam: Omit<SubExam, 'id'>) => void
  removeSubExam: (configId: string, subExamId: string) => void
  updateSubExam: (configId: string, subExamId: string, data: Partial<SubExam>) => void

  saveStudentMark: (mark: Omit<StudentMark, 'id' | 'grade'>) => void
  saveBulkStudentMarks: (marks: (Omit<StudentMark, 'id' | 'grade'>)[]) => void
  deleteStudentMark: (id: string) => void
  getStudentMarksForExam: (examId: string, classId: string, sectionId: string, subjectId: string) => StudentMark[]
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      examConfigs: defaultExamConfigs,
      subjectMarkConfigs: defaultSubjectMarkConfigs,
      studentMarks: [],

      addExamConfig: (config) => set(state => ({
        examConfigs: [...state.examConfigs, { ...config, id: `EXAM-${Date.now()}`, createdAt: new Date().toISOString() }]
      })),

      updateExamConfig: (id, data) => set(state => ({
        examConfigs: state.examConfigs.map(e => e.id === id ? { ...e, ...data } : e)
      })),

      deleteExamConfig: (id) => set(state => ({
        examConfigs: state.examConfigs.filter(e => e.id !== id),
        subjectMarkConfigs: state.subjectMarkConfigs.filter(s => s.examId !== id),
        studentMarks: state.studentMarks.filter(m => m.examId !== id),
      })),

      toggleExamActive: (id) => set(state => ({
        examConfigs: state.examConfigs.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e)
      })),

      upsertSubjectMarkConfig: (config) => set(state => {
        const existing = state.subjectMarkConfigs.find(s => s.examId === config.examId && s.subjectId === config.subjectId)
        if (existing) {
          return { subjectMarkConfigs: state.subjectMarkConfigs.map(s => s.id === existing.id ? { ...s, ...config, id: existing.id } : s) }
        }
        return { subjectMarkConfigs: [...state.subjectMarkConfigs, { ...config, id: `SMC-${Date.now()}` }] }
      }),

      deleteSubjectMarkConfig: (id) => set(state => ({
        subjectMarkConfigs: state.subjectMarkConfigs.filter(s => s.id !== id)
      })),

      addSubExamToSubject: (configId, subExam) => set(state => ({
        subjectMarkConfigs: state.subjectMarkConfigs.map(s =>
          s.id === configId
            ? { ...s, subExams: [...s.subExams, { ...subExam, id: `SE-${Date.now()}` }] }
            : s
        )
      })),

      removeSubExam: (configId, subExamId) => set(state => ({
        subjectMarkConfigs: state.subjectMarkConfigs.map(s =>
          s.id === configId
            ? { ...s, subExams: s.subExams.filter(se => se.id !== subExamId) }
            : s
        )
      })),

      updateSubExam: (configId, subExamId, data) => set(state => ({
        subjectMarkConfigs: state.subjectMarkConfigs.map(s =>
          s.id === configId
            ? { ...s, subExams: s.subExams.map(se => se.id === subExamId ? { ...se, ...data } : se) }
            : s
        )
      })),

      saveStudentMark: (mark) => set(state => {
        const fullConfig = state.subjectMarkConfigs.find(s => s.examId === mark.examId && s.subjectId === mark.subjectId)
        const total = Object.values(mark.subExamMarks).reduce((a, b) => a + b, 0)
        const grade = computeGrade(total, fullConfig?.fullMarks || 100)
        const existing = state.studentMarks.find(m =>
          m.examId === mark.examId && m.studentId === mark.studentId && m.subjectId === mark.subjectId
        )
        if (existing) {
          return {
            studentMarks: state.studentMarks.map(m =>
              m.id === existing.id
                ? { ...m, ...mark, totalMarks: total, grade, updatedAt: new Date().toISOString() }
                : m
            )
          }
        }
        return {
          studentMarks: [...state.studentMarks, { ...mark, id: `SM-${Date.now()}-${mark.studentId}`, totalMarks: total, grade, updatedAt: new Date().toISOString() }]
        }
      }),

      saveBulkStudentMarks: (marks) => {
        const state = get()
        const updated = [...state.studentMarks]
        for (const mark of marks) {
          const fullConfig = state.subjectMarkConfigs.find(s => s.examId === mark.examId && s.subjectId === mark.subjectId)
          const total = Object.values(mark.subExamMarks).reduce((a, b) => a + b, 0)
          const grade = computeGrade(total, fullConfig?.fullMarks || 100)
          const existing = updated.find(m =>
            m.examId === mark.examId && m.studentId === mark.studentId && m.subjectId === mark.subjectId
          )
          if (existing) {
            const idx = updated.findIndex(m => m.id === existing.id)
            updated[idx] = { ...existing, ...mark, totalMarks: total, grade, updatedAt: new Date().toISOString() }
          } else {
            updated.push({ ...mark, id: `SM-${Date.now()}-${mark.studentId}`, totalMarks: total, grade, updatedAt: new Date().toISOString() })
          }
        }
        set({ studentMarks: updated })
      },

      deleteStudentMark: (id) => set(state => ({
        studentMarks: state.studentMarks.filter(m => m.id !== id)
      })),

      getStudentMarksForExam: (examId, classId, sectionId, subjectId) => {
        return get().studentMarks.filter(m =>
          m.examId === examId && m.classId === classId && m.sectionId === sectionId && m.subjectId === subjectId
        )
      },
    }),
    { name: 'edutech-exams', version: 1 }
  )
)
