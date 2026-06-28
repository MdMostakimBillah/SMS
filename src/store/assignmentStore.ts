import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AssignmentStatus = 'active' | 'draft' | 'closed' | 'archived'
export type SubmissionStatus = 'submitted' | 'reviewed' | 'returned' | 'late'

export interface Assignment {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  subjectId: string
  classId: string
  sectionId: string
  teacherId: string
  dueDate: string
  maxMarks: number
  status: AssignmentStatus
  attachments: string[]
}

export interface AssignmentSubmission {
  id: string
  createdAt: string
  updatedAt: string
  assignmentId: string
  studentId: string
  studentName: string
  studentNameBn: string
  submittedAt: string
  fileUrl: string
  marks: number | null
  feedback: string
  feedbackBn: string
  status: SubmissionStatus
}

interface AssignmentState {
  assignments: Assignment[]
  submissions: AssignmentSubmission[]
  addAssignment: (a: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAssignment: (id: string, data: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  addSubmission: (s: Omit<AssignmentSubmission, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSubmission: (id: string, data: Partial<AssignmentSubmission>) => void
  deleteSubmission: (id: string) => void
}

const today = () => new Date().toISOString().split('T')[0]

const sampleAssignments: Assignment[] = [
  {
    id: 'ASN-2026-001',
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    title: 'Chapter 3 Homework',
    titleBn: 'অধ্যায় ৩ গৃহকাজ',
    description: 'Complete exercises 3.1 to 3.5 from the textbook.',
    descriptionBn: 'পাঠ্যপুস্তকের ৩.১ থেকে ৩.৫ পর্যন্ত অনুশীলন সম্পূর্ণ করুন।',
    subjectId: 'SUB-001',
    classId: 'Class-6',
    sectionId: 'A',
    teacherId: 'TCH-2026-001',
    dueDate: '2026-06-15',
    maxMarks: 20,
    status: 'active',
    attachments: [],
  },
  {
    id: 'ASN-2026-002',
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
    title: 'Science Project Report',
    titleBn: 'বিজ্ঞান প্রকল্প প্রতিবেদন',
    description: 'Write a report on the water cycle experiment conducted in class.',
    descriptionBn: 'শ্রেণিতে পরিচালিত জলচক্র পরীক্ষার উপর একটি প্রতিবেদন লিখুন।',
    subjectId: 'SUB-002',
    classId: 'Class-7',
    sectionId: 'B',
    teacherId: 'TCH-2026-002',
    dueDate: '2026-06-20',
    maxMarks: 30,
    status: 'active',
    attachments: [],
  },
  {
    id: 'ASN-2026-003',
    createdAt: '2026-05-20',
    updatedAt: '2026-06-05',
    title: 'English Essay Writing',
    titleBn: 'ইংরেজি প্রবন্ধ লেখা',
    description: 'Write a 500-word essay on "My Favorite Teacher".',
    descriptionBn: '"আমার প্রিয় শিক্ষক" শীর্ষক ৫০০ শব্দের প্রবন্ধ লিখুন।',
    subjectId: 'SUB-003',
    classId: 'Class-8',
    sectionId: 'A',
    teacherId: 'TCH-2026-003',
    dueDate: '2026-06-01',
    maxMarks: 25,
    status: 'closed',
    attachments: [],
  },
  {
    id: 'ASN-2026-004',
    createdAt: '2026-06-10',
    updatedAt: '2026-06-10',
    title: 'Math Practice Set',
    titleBn: 'গণিত অনুশীলন সেট',
    description: 'Solve the practice problems from Chapter 5.',
    descriptionBn: 'অধ্যায় ৫ থেকে অনুশীলন সমস্যা সমাধান করুন।',
    subjectId: 'SUB-001',
    classId: 'Class-6',
    sectionId: 'B',
    teacherId: 'TCH-2026-001',
    dueDate: '2026-06-25',
    maxMarks: 15,
    status: 'active',
    attachments: [],
  },
  {
    id: 'ASN-2026-005',
    createdAt: '2026-05-15',
    updatedAt: '2026-05-28',
    title: 'History Presentation',
    titleBn: 'ইতিহাস উপস্থাপনা',
    description: 'Prepare a presentation on the Mughal Empire in Bangladesh.',
    descriptionBn: 'বাংলাদেশে মুঘল সাম্রাজ্য নিয়ে একটি উপস্থাপনা প্রস্তুত করুন।',
    subjectId: 'SUB-004',
    classId: 'Class-9',
    sectionId: 'A',
    teacherId: 'TCH-2026-004',
    dueDate: '2026-05-25',
    maxMarks: 40,
    status: 'closed',
    attachments: [],
  },
  {
    id: 'ASN-2026-006',
    createdAt: '2026-06-12',
    updatedAt: '2026-06-12',
    title: 'Physics Lab Report',
    titleBn: 'পদার্থবিজ্ঞান ল্যাব রিপোর্ট',
    description: 'Write a lab report on the pendulum experiment.',
    descriptionBn: 'লম্ব পরীক্ষার উপর ল্যাব রিপোর্ট লিখুন।',
    subjectId: 'SUB-005',
    classId: 'Class-9',
    sectionId: 'B',
    teacherId: 'TCH-2026-005',
    dueDate: '2026-06-22',
    maxMarks: 25,
    status: 'active',
    attachments: [],
  },
]

const sampleSubmissions: AssignmentSubmission[] = [
  {
    id: 'SUB-2026-001',
    createdAt: '2026-06-10',
    updatedAt: '2026-06-10',
    assignmentId: 'ASN-2026-001',
    studentId: 'ET-2026-10000',
    studentName: 'Rahim Uddin',
    studentNameBn: 'রহিম উদ্দিন',
    submittedAt: '2026-06-10',
    fileUrl: '',
    marks: null,
    feedback: '',
    feedbackBn: '',
    status: 'submitted',
  },
  {
    id: 'SUB-2026-002',
    createdAt: '2026-06-11',
    updatedAt: '2026-06-12',
    assignmentId: 'ASN-2026-001',
    studentId: 'ET-2026-10001',
    studentName: 'Karim Ahmed',
    studentNameBn: 'করিম আহমেদ',
    submittedAt: '2026-06-11',
    fileUrl: '',
    marks: 18,
    feedback: 'Good work!',
    feedbackBn: 'ভালো কাজ!',
    status: 'reviewed',
  },
  {
    id: 'SUB-2026-003',
    createdAt: '2026-06-14',
    updatedAt: '2026-06-14',
    assignmentId: 'ASN-2026-001',
    studentId: 'ET-2026-10002',
    studentName: 'Fatima Begum',
    studentNameBn: 'ফাতিমা বেগম',
    submittedAt: '2026-06-14',
    fileUrl: '',
    marks: null,
    feedback: '',
    feedbackBn: '',
    status: 'late',
  },
  {
    id: 'SUB-2026-004',
    createdAt: '2026-06-05',
    updatedAt: '2026-06-08',
    assignmentId: 'ASN-2026-003',
    studentId: 'ET-2026-10003',
    studentName: 'Salam Khan',
    studentNameBn: 'সালাম খান',
    submittedAt: '2026-06-05',
    fileUrl: '',
    marks: 22,
    feedback: 'Excellent essay!',
    feedbackBn: 'চমৎকার প্রবন্ধ!',
    status: 'reviewed',
  },
  {
    id: 'SUB-2026-005',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20',
    assignmentId: 'ASN-2026-002',
    studentId: 'ET-2026-10004',
    studentName: 'Nusrat Jahan',
    studentNameBn: 'নুসরাত জাহান',
    submittedAt: '2026-06-20',
    fileUrl: '',
    marks: null,
    feedback: '',
    feedbackBn: '',
    status: 'submitted',
  },
]

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set) => ({
      assignments: sampleAssignments,
      submissions: sampleSubmissions,
      addAssignment: (a) =>
        set((state) => {
          const id = `ASN-${new Date().getFullYear()}-${String(state.assignments.length + 1).padStart(3, '0')}`
          const now = today()
          return {
            assignments: [{ ...a, id, createdAt: now, updatedAt: now }, ...state.assignments],
          }
        }),
      updateAssignment: (id, data) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: today() } : a
          ),
        })),
      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
          submissions: state.submissions.filter((s) => s.assignmentId !== id),
        })),
      addSubmission: (s) =>
        set((state) => {
          const id = `SUB-${new Date().getFullYear()}-${String(state.submissions.length + 1).padStart(3, '0')}`
          const now = today()
          return {
            submissions: [{ ...s, id, createdAt: now, updatedAt: now }, ...state.submissions],
          }
        }),
      updateSubmission: (id, data) =>
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: today() } : s
          ),
        })),
      deleteSubmission: (id) =>
        set((state) => ({
          submissions: state.submissions.filter((s) => s.id !== id),
        })),
    }),
    { name: 'edutech-assignments', version: 1 }
  )
)
