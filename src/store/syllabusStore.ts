import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'

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


export const useSyllabusStore = create<SyllabusState>()(
  persist(
    (set, get) => ({
      syllabi: [],

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
    { name: 'edutech-syllabus', storage: createNamespacedStorage('edutech-syllabus'), version: 1 }
  )
)

registerStoreReset(() => {
  useSyllabusStore.setState({ syllabi: [] })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-syllabus_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useSyllabusStore.setState(parsed.state)
    } else {
      useSyllabusStore.setState({ syllabi: [] })
    }
  } catch {
    useSyllabusStore.setState({ syllabi: [] })
  }
})
