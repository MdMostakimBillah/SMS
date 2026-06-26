import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SyllabusTopic {
  id: string
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  marks: number
  status: 'pending' | 'in-progress' | 'completed'
  weekNo?: number
  startDate?: string
  endDate?: string
}

export interface SyllabusChapter {
  id: string
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  order: number
  langMode?: 'both' | 'en' | 'bn'
  topics: SyllabusTopic[]
}

export interface SyllabusEntry {
  id: string
  classId: string
  sectionId: string
  subjectId: string
  sessionId: string
  totalChapters: number
  totalTopics: number
  completedTopics: number
  chapters: SyllabusChapter[]
  createdAt: string
  updatedAt: string
}

interface SyllabusState {
  syllabi: SyllabusEntry[]

  addSyllabus: (
    entry: Omit<SyllabusEntry, 'id' | 'createdAt' | 'updatedAt' | 'totalChapters' | 'totalTopics' | 'completedTopics'>
  ) => string
  updateSyllabus: (id: string, data: Partial<SyllabusEntry>) => void
  deleteSyllabus: (id: string) => void

  addChapter: (syllabusId: string, chapter: Omit<SyllabusChapter, 'id' | 'topics'>) => void
  updateChapter: (syllabusId: string, chapterId: string, data: Partial<SyllabusChapter>) => void
  deleteChapter: (syllabusId: string, chapterId: string) => void
  reorderChapters: (syllabusId: string, chapterIds: string[]) => void

  addTopic: (syllabusId: string, chapterId: string, topic: Omit<SyllabusTopic, 'id'>) => void
  updateTopic: (syllabusId: string, chapterId: string, topicId: string, data: Partial<SyllabusTopic>) => void
  deleteTopic: (syllabusId: string, chapterId: string, topicId: string) => void
  updateTopicStatus: (syllabusId: string, chapterId: string, topicId: string, status: SyllabusTopic['status']) => void

  getSyllabusForClass: (classId: string, sectionId: string, subjectId: string) => SyllabusEntry | undefined
}

function recalcStats(chapters: SyllabusChapter[]) {
  let totalTopics = 0
  let completedTopics = 0
  chapters.forEach((ch) => {
    totalTopics += ch.topics.length
    completedTopics += ch.topics.filter((t) => t.status === 'completed').length
  })
  return { totalChapters: chapters.length, totalTopics, completedTopics }
}

const demoSyllabi: SyllabusEntry[] = [
  {
    id: 'SYL-001',
    classId: '6',
    sectionId: 'A',
    subjectId: 'SUB-001',
    sessionId: '2025-26',
    totalChapters: 2,
    totalTopics: 5,
    completedTopics: 2,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    chapters: [
      {
        id: 'CH-001',
        title: 'Force & Motion',
        titleBn: 'বল ও গতি',
        description: 'Introduction to forces and types of motion',
        descriptionBn: 'বল ও গতির ধরন পরিচিতি',
        order: 1,
        topics: [
          {
            id: 'TP-001',
            title: 'Types of Force',
            titleBn: 'বলের প্রকারভেদ',
            description: 'Contact and non-contact forces',
            descriptionBn: 'স্পর্শ ও অস্পর্শ বল',
            marks: 10,
            status: 'completed',
            weekNo: 1,
            startDate: '2025-01-05',
            endDate: '2025-01-11',
          },
          {
            id: 'TP-002',
            title: "Newton's Laws",
            titleBn: 'নিউটনের সূত্র',
            description: 'Three laws of motion',
            descriptionBn: 'গতির তিনটি সূত্র',
            marks: 15,
            status: 'completed',
            weekNo: 2,
            startDate: '2025-01-12',
            endDate: '2025-01-18',
          },
          {
            id: 'TP-003',
            title: 'Friction',
            titleBn: '�র্ষণ',
            description: 'Types and effects of friction',
            descriptionBn: 'ঘর্ষণের ধরন ও প্রভাব',
            marks: 10,
            status: 'in-progress',
            weekNo: 3,
            startDate: '2025-01-19',
            endDate: '2025-01-25',
          },
        ],
      },
      {
        id: 'CH-002',
        title: 'Energy',
        titleBn: 'শক্তি',
        description: 'Forms and conservation of energy',
        descriptionBn: 'শক্তির রূপ ও সংরক্ষণ',
        order: 2,
        topics: [
          {
            id: 'TP-004',
            title: 'Kinetic & Potential Energy',
            titleBn: 'গতিশক্তি ও স্থিতিশক্তি',
            description: 'Understanding different forms of energy',
            descriptionBn: 'শক্তির বিভিন্ন রূপ',
            marks: 10,
            status: 'pending',
            weekNo: 4,
            startDate: '2025-01-26',
            endDate: '2025-02-01',
          },
          {
            id: 'TP-005',
            title: 'Conservation of Energy',
            titleBn: 'শক্তির সংরক্ষণ',
            description: 'Energy cannot be created or destroyed',
            descriptionBn: 'শক্তি সৃষ্টি বা ধ্বংস করা যায় না',
            marks: 10,
            status: 'pending',
            weekNo: 5,
            startDate: '2025-02-02',
            endDate: '2025-02-08',
          },
        ],
      },
    ],
  },
  {
    id: 'SYL-002',
    classId: '6',
    sectionId: 'B',
    subjectId: 'SUB-003',
    sessionId: '2025-26',
    totalChapters: 1,
    totalTopics: 3,
    completedTopics: 1,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    chapters: [
      {
        id: 'CH-003',
        title: 'Number System',
        titleBn: 'সংখ্যা পদ্ধতি',
        description: 'Whole numbers, fractions, decimals',
        descriptionBn: 'পূর্ণ সংখ্যা, ভগ্নাংশ, দশমিক',
        order: 1,
        topics: [
          {
            id: 'TP-006',
            title: 'Whole Numbers',
            titleBn: 'পূর্ণ সংখ্যা',
            description: 'Operations with whole numbers',
            descriptionBn: 'পূর্ণ সংখ্যায় কার্যক্রম',
            marks: 15,
            status: 'completed',
            weekNo: 1,
            startDate: '2025-01-05',
            endDate: '2025-01-11',
          },
          {
            id: 'TP-007',
            title: 'Fractions',
            titleBn: 'ভগ্নাংশ',
            description: 'Adding, subtracting, multiplying fractions',
            descriptionBn: 'ভগ্নাংশের যোগ, বিয়োগ, গুণ',
            marks: 15,
            status: 'in-progress',
            weekNo: 2,
            startDate: '2025-01-12',
            endDate: '2025-01-18',
          },
          {
            id: 'TP-008',
            title: 'Decimals',
            titleBn: 'দশমিক',
            description: 'Decimal numbers and operations',
            descriptionBn: 'দশমিক সংখ্যা ও কার্যক্রম',
            marks: 15,
            status: 'pending',
            weekNo: 3,
            startDate: '2025-01-19',
            endDate: '2025-01-25',
          },
        ],
      },
    ],
  },
]

export const useSyllabusStore = create<SyllabusState>()(
  persist(
    (set, get) => ({
      syllabi: demoSyllabi,

      addSyllabus: (entry) => {
        const id = `SYL-${Date.now()}`
        const now = new Date().toISOString()
        const stats = recalcStats(entry.chapters || [])
        set((state) => ({
          syllabi: [...state.syllabi, { ...entry, id, createdAt: now, updatedAt: now, ...stats }],
        }))
        return id
      },

      updateSyllabus: (id, data) =>
        set((state) => {
          const syllabi = state.syllabi.map((s) => {
            if (s.id !== id) return s
            const updated = { ...s, ...data }
            if (data.chapters) {
              const stats = recalcStats(data.chapters)
              return { ...updated, ...stats, updatedAt: new Date().toISOString() }
            }
            return { ...updated, updatedAt: new Date().toISOString() }
          })
          return { syllabi }
        }),

      deleteSyllabus: (id) =>
        set((state) => ({
          syllabi: state.syllabi.filter((s) => s.id !== id),
        })),

      addChapter: (syllabusId, chapter) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const newChapter: SyllabusChapter = { ...chapter, id: `CH-${Date.now()}`, topics: [] }
            const chapters = [...s.chapters, newChapter].sort((a, b) => a.order - b.order)
            const stats = recalcStats(chapters)
            return { ...s, chapters, ...stats, updatedAt: new Date().toISOString() }
          }),
        })),

      updateChapter: (syllabusId, chapterId, data) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const chapters = s.chapters.map((ch) => (ch.id === chapterId ? { ...ch, ...data } : ch))
            const stats = recalcStats(chapters)
            return { ...s, chapters, ...stats, updatedAt: new Date().toISOString() }
          }),
        })),

      deleteChapter: (syllabusId, chapterId) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const chapters = s.chapters.filter((ch) => ch.id !== chapterId)
            const stats = recalcStats(chapters)
            return { ...s, chapters, ...stats, updatedAt: new Date().toISOString() }
          }),
        })),

      reorderChapters: (syllabusId, chapterIds) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const chapterMap = new Map(s.chapters.map((ch) => [ch.id, ch]))
            const chapters = chapterIds
              .map((id, i) => {
                const ch = chapterMap.get(id)
                return ch ? { ...ch, order: i + 1 } : null
              })
              .filter(Boolean) as SyllabusChapter[]
            return { ...s, chapters, updatedAt: new Date().toISOString() }
          }),
        })),

      addTopic: (syllabusId, chapterId, topic) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const chapters = s.chapters.map((ch) => {
              if (ch.id !== chapterId) return ch
              const newTopic: SyllabusTopic = { ...topic, id: `TP-${Date.now()}` }
              return { ...ch, topics: [...ch.topics, newTopic] }
            })
            const stats = recalcStats(chapters)
            return { ...s, chapters, ...stats, updatedAt: new Date().toISOString() }
          }),
        })),

      updateTopic: (syllabusId, chapterId, topicId, data) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const chapters = s.chapters.map((ch) => {
              if (ch.id !== chapterId) return ch
              const topics = ch.topics.map((t) => (t.id === topicId ? { ...t, ...data } : t))
              return { ...ch, topics }
            })
            const stats = recalcStats(chapters)
            return { ...s, chapters, ...stats, updatedAt: new Date().toISOString() }
          }),
        })),

      deleteTopic: (syllabusId, chapterId, topicId) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const chapters = s.chapters.map((ch) => {
              if (ch.id !== chapterId) return ch
              return { ...ch, topics: ch.topics.filter((t) => t.id !== topicId) }
            })
            const stats = recalcStats(chapters)
            return { ...s, chapters, ...stats, updatedAt: new Date().toISOString() }
          }),
        })),

      updateTopicStatus: (syllabusId, chapterId, topicId, status) =>
        set((state) => ({
          syllabi: state.syllabi.map((s) => {
            if (s.id !== syllabusId) return s
            const chapters = s.chapters.map((ch) => {
              if (ch.id !== chapterId) return ch
              const topics = ch.topics.map((t) => (t.id === topicId ? { ...t, status } : t))
              return { ...ch, topics }
            })
            const stats = recalcStats(chapters)
            return { ...s, chapters, ...stats, updatedAt: new Date().toISOString() }
          }),
        })),

      getSyllabusForClass: (classId, sectionId, subjectId) => {
        return get().syllabi.find((s) => s.classId === classId && s.sectionId === sectionId && s.subjectId === subjectId)
      },
    }),
    { name: 'edutech-syllabus', version: 1 }
  )
)
