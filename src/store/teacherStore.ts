import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Teacher, Department, Subject } from '@/pages/teachers/types'

const sampleDepartments: Department[] = [
  { id: 'DEPT-001', name: 'Science', nameBn: 'বিজ্ঞান', head: 'Dr. Rafiqul Islam', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'DEPT-002', name: 'Humanities', nameBn: 'মানবিক', head: 'Prof. Salma Khatun', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'DEPT-003', name: 'Commerce', nameBn: 'বাণিজ্য', head: 'Md. Habibur Rahman', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'DEPT-004', name: 'Languages', nameBn: 'ভাষা', head: 'Farhana Rahman', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

const sampleSubjects: Subject[] = [
  { id: 'SUB-001', name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', departmentId: 'DEPT-001', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'SUB-002', name: 'Chemistry', nameBn: 'রসায়ন', departmentId: 'DEPT-001', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'SUB-003', name: 'Mathematics', nameBn: 'গণিত', departmentId: 'DEPT-001', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'SUB-004', name: 'Bangla', nameBn: 'বাংলা', departmentId: 'DEPT-004', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'SUB-005', name: 'English', nameBn: 'ইংরেজি', departmentId: 'DEPT-004', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'SUB-006', name: 'History', nameBn: 'ইতিহাস', departmentId: 'DEPT-002', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'SUB-007', name: 'Accounting', nameBn: 'হিসাববিজ্ঞান', departmentId: 'DEPT-003', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'SUB-008', name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', departmentId: 'DEPT-001', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

const sampleTeachers: Teacher[] = [
  {
    id: 'TCH-2026-001', createdAt: '2026-01-10', updatedAt: '2026-01-10', status: 'active', photo: '',
    nameEn: 'Dr. Rafiqul Islam', nameBn: 'ড. রফিকুল ইসলাম', gender: 'Male', dob: '1975-03-15',
    bloodGroup: 'A+', religion: 'Islam', phone: '01711-100001', email: 'rafiq@edutech.com',
    address: 'Mirpur-10, Dhaka', nid: '1234567890123', emergencyPhone: '01711-100002',
    departmentId: 'DEPT-001', subjectIds: ['SUB-001', 'SUB-002'], designation: 'Head of Department',
    qualification: 'PhD in Physics', experience: '18 years', joiningDate: '2008-01-01', salary: 65000,
    inTime: '07:30', outTime: '14:30',
    fatherNameEn: 'Abdul Islam', fatherNameBn: 'আব্দুল ইসলাম', fatherPhone: '01711-111111', fatherNid: '1111111111111',
    motherNameEn: 'Rahima Islam', motherNameBn: 'রহিমা ইসলাম', motherPhone: '01711-222222',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    parentAddress: 'Mirpur-10, Dhaka',
  },
  {
    id: 'TCH-2026-002', createdAt: '2026-01-10', updatedAt: '2026-01-10', status: 'active', photo: '',
    nameEn: 'Prof. Salma Khatun', nameBn: 'প্রো. সালমা খাতুন', gender: 'Female', dob: '1980-07-22',
    bloodGroup: 'B+', religion: 'Islam', phone: '01722-200001', email: 'salma@edutech.com',
    address: 'Dhanmondi, Dhaka', nid: '2345678901234', emergencyPhone: '01722-200002',
    departmentId: 'DEPT-002', subjectIds: ['SUB-006'], designation: 'Professor',
    qualification: 'MA in History', experience: '14 years', joiningDate: '2012-01-01', salary: 55000,
    inTime: '08:00', outTime: '15:00',
    fatherNameEn: 'Karim Khatun', fatherNameBn: 'করিম খাতুন', fatherPhone: '01722-111111', fatherNid: '2222222222222',
    motherNameEn: 'Nasreen Khatun', motherNameBn: 'নাসরিন খাতুন', motherPhone: '01722-222222',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    parentAddress: 'Dhanmondi, Dhaka',
  },
  {
    id: 'TCH-2026-003', createdAt: '2026-02-01', updatedAt: '2026-02-01', status: 'active', photo: '',
    nameEn: 'Md. Habibur Rahman', nameBn: 'মো. হাবিবুর রহমান', gender: 'Male', dob: '1982-11-10',
    bloodGroup: 'O+', religion: 'Islam', phone: '01733-300001', email: 'habib@edutech.com',
    address: 'Uttara, Dhaka', nid: '3456789012345', emergencyPhone: '01733-300002',
    departmentId: 'DEPT-003', subjectIds: ['SUB-007'], designation: 'Head of Department',
    qualification: 'MBA in Accounting', experience: '12 years', joiningDate: '2014-01-01', salary: 52000,
    inTime: '07:45', outTime: '14:45',
    fatherNameEn: 'Abdur Rahman', fatherNameBn: 'আব্দুর রহমান', fatherPhone: '01733-111111', fatherNid: '3333333333333',
    motherNameEn: 'Anowara Rahman', motherNameBn: 'আনোয়ারা রহমান', motherPhone: '01733-222222',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    parentAddress: 'Uttara, Dhaka',
  },
  {
    id: 'TCH-2026-004', createdAt: '2026-02-15', updatedAt: '2026-02-15', status: 'active', photo: '',
    nameEn: 'Farhana Rahman', nameBn: 'ফারহানা রহমান', gender: 'Female', dob: '1985-04-05',
    bloodGroup: 'AB+', religion: 'Islam', phone: '01744-400001', email: 'farhana@edutech.com',
    address: 'Banani, Dhaka', nid: '4567890123456', emergencyPhone: '01744-400002',
    departmentId: 'DEPT-004', subjectIds: ['SUB-004', 'SUB-005'], designation: 'Head of Department',
    qualification: 'MA in English Literature', experience: '10 years', joiningDate: '2016-01-01', salary: 48000,
    inTime: '08:00', outTime: '15:00',
    fatherNameEn: 'Monir Rahman', fatherNameBn: 'মনির রহমান', fatherPhone: '01744-111111', fatherNid: '4444444444444',
    motherNameEn: 'Razia Rahman', motherNameBn: 'রাজিয়া রহমান', motherPhone: '01744-222222',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    parentAddress: 'Banani, Dhaka',
  },
  {
    id: 'TCH-2026-005', createdAt: '2026-03-01', updatedAt: '2026-03-01', status: 'on-leave', photo: '',
    nameEn: 'Tanvir Ahmed', nameBn: 'তানভীর আহমেদ', gender: 'Male', dob: '1990-09-18',
    bloodGroup: 'B-', religion: 'Islam', phone: '01755-500001', email: 'tanvir@edutech.com',
    address: 'Gulshan, Dhaka', nid: '5678901234567', emergencyPhone: '01755-500002',
    departmentId: 'DEPT-001', subjectIds: ['SUB-003', 'SUB-008'], designation: 'Lecturer',
    qualification: 'MSc in Mathematics', experience: '5 years', joiningDate: '2021-01-01', salary: 38000,
    inTime: '08:30', outTime: '15:30',
    fatherNameEn: 'Nur Ahmed', fatherNameBn: 'নুর আহমেদ', fatherPhone: '01755-111111', fatherNid: '5555555555555',
    motherNameEn: 'Jesmin Ahmed', motherNameBn: 'জেসমিন আহমেদ', motherPhone: '01755-222222',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    parentAddress: 'Gulshan, Dhaka',
  },
]

export type AttendanceStatus = 'present' | 'absent' | 'on-leave'

export interface PunchRecord {
  time: string
  type: 'in' | 'out'
}

export interface DayAttendance {
  status: AttendanceStatus
  punches: PunchRecord[]
}

// Generate demo attendance for last 28 days with punch times
function generateDemoAttendance(): Record<string, Record<string, DayAttendance>> {
  const att: Record<string, Record<string, DayAttendance>> = {}
  const teacherIds = sampleTeachers.map(t => t.id)
  const inTimes = ['07:20','07:25','07:28','07:30','07:32','07:35','07:38','07:40','07:42','07:45','07:50','07:55','08:00','08:01','08:05']
  const now = new Date()
  for (let i = 1; i <= 28; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const day = d.getDay()
    if (day === 0) continue
    const dateStr = d.toISOString().split('T')[0]
    const dayAtt: Record<string, DayAttendance> = {}
    teacherIds.forEach(tid => {
      const rand = Math.random()
      let status: AttendanceStatus
      if (tid === 'TCH-2026-005') {
        status = rand < 0.3 ? 'present' : rand < 0.5 ? 'on-leave' : 'absent'
      } else {
        status = rand < 0.85 ? 'present' : rand < 0.95 ? 'absent' : 'on-leave'
      }
      const punches: PunchRecord[] = []
      if (status === 'present') {
        const inTime = inTimes[Math.floor(Math.random() * inTimes.length)]
        const outHour = 14 + Math.floor(Math.random() * 2)
        const outMin = Math.floor(Math.random() * 60)
        const outTime = `${String(outHour).padStart(2,'0')}:${String(outMin).padStart(2,'0')}`
        punches.push({ time: inTime, type: 'in' })
        if (Math.random() > 0.3) punches.push({ time: `${String(10+Math.floor(Math.random()*2)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`, type: 'out' })
        if (Math.random() > 0.3) punches.push({ time: `${String(11+Math.floor(Math.random()*2)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`, type: 'in' })
        punches.push({ time: outTime, type: 'out' })
      }
      dayAtt[tid] = { status, punches }
    })
    att[dateStr] = dayAtt
  }
  return att
}

interface TeacherState {
  teachers: Teacher[]
  departments: Department[]
  subjects: Subject[]
  attendance: Record<string, Record<string, DayAttendance>>
  addTeacher: (teacher: Teacher) => void
  updateTeacher: (id: string, data: Partial<Teacher>) => void
  deleteTeacher: (id: string) => void
  getNextTeacherId: () => string
  addDepartment: (dept: Department) => void
  updateDepartment: (id: string, data: Partial<Department>) => void
  deleteDepartment: (id: string) => void
  addSubject: (sub: Subject) => void
  updateSubject: (id: string, data: Partial<Subject>) => void
  deleteSubject: (id: string) => void
  markAttendance: (date: string, teacherId: string, status: AttendanceStatus) => void
  markAllPresent: (date: string) => void
  getAttendanceStats: (date: string) => { present: number; absent: number; onLeave: number }
}

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set, get) => ({
      teachers: sampleTeachers,
      departments: sampleDepartments,
      subjects: sampleSubjects,
      attendance: generateDemoAttendance(),

      addTeacher: (teacher) =>
        set(state => ({ teachers: [teacher, ...state.teachers] })),

      updateTeacher: (id, data) =>
        set(state => ({
          teachers: state.teachers.map(t =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString().split('T')[0] } : t
          ),
        })),

      deleteTeacher: (id) =>
        set(state => ({ teachers: state.teachers.filter(t => t.id !== id) })),

      getNextTeacherId: () => {
        const year = new Date().getFullYear()
        const count = get().teachers.length + 1
        const num = String(100 + count).padStart(3, '0')
        return `TCH-${year}-${num}`
      },

      addDepartment: (dept) =>
        set(state => ({ departments: [...state.departments, dept] })),

      updateDepartment: (id, data) =>
        set(state => ({
          departments: state.departments.map(d =>
            d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString().split('T')[0] } : d
          ),
        })),

      deleteDepartment: (id) =>
        set(state => ({ departments: state.departments.filter(d => d.id !== id) })),

      addSubject: (sub) =>
        set(state => ({ subjects: [...state.subjects, sub] })),

      updateSubject: (id, data) =>
        set(state => ({
          subjects: state.subjects.map(s =>
            s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString().split('T')[0] } : s
          ),
        })),

      deleteSubject: (id) =>
        set(state => ({ subjects: state.subjects.filter(s => s.id !== id) })),

      markAttendance: (date, teacherId, status) =>
        set(state => ({
          attendance: {
            ...state.attendance,
            [date]: {
              ...(state.attendance[date] || {}),
              [teacherId]: { status, punches: state.attendance[date]?.[teacherId]?.punches || [] },
            },
          },
        })),

      markAllPresent: (date) =>
        set(state => {
          const allPresent: Record<string, DayAttendance> = {}
          state.teachers.forEach(t => { allPresent[t.id] = { status: 'present', punches: [] } })
          return {
            attendance: {
              ...state.attendance,
              [date]: allPresent,
            },
          }
        }),

      getAttendanceStats: (date) => {
        const dayAtt = get().attendance[date] || {}
        const teachers = get().teachers.filter(t => t.status === 'active')
        let present = 0, absent = 0, onLeave = 0
        teachers.forEach(t => {
          const d = dayAtt[t.id]
          const s = d?.status
          if (s === 'present') present++
          else if (s === 'absent') absent++
          else if (s === 'on-leave') onLeave++
        })
        return { present, absent, onLeave }
      },
    }),
    { name: 'edutech-teachers' }
  )
)
