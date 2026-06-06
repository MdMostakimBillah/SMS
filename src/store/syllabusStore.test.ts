import { describe, it, expect, beforeEach } from 'vitest'
import { useSyllabusStore } from './syllabusStore'

describe('syllabusStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSyllabusStore.persist.clearStorage()
    useSyllabusStore.setState({ syllabi: [] })
  })

  it('addSyllabus returns ID and computes stats', () => {
    const id = useSyllabusStore.getState().addSyllabus({
      classId: '1',
      sectionId: 'A',
      subjectId: 'SUB-1',
      sessionId: '2025-26',
      chapters: [
        {
          id: 'ch1',
          title: 'Ch1',
          titleBn: 'Ch1',
          description: '',
          descriptionBn: '',
          order: 1,
          topics: [
            { id: 't1', title: 'T1', titleBn: 'T1', description: '', descriptionBn: '', marks: 10, status: 'completed' },
            { id: 't2', title: 'T2', titleBn: 'T2', description: '', descriptionBn: '', marks: 10, status: 'pending' },
          ],
        },
      ],
    } as any)
    expect(id).toMatch(/^SYL-/)
    const s = useSyllabusStore.getState().syllabi.find(s => s.id === id)!
    expect(s.totalChapters).toBe(1)
    expect(s.totalTopics).toBe(2)
    expect(s.completedTopics).toBe(1)
  })

  it('deleteSyllabus removes entry', () => {
    const id = useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    useSyllabusStore.getState().deleteSyllabus(id)
    expect(useSyllabusStore.getState().syllabi).toHaveLength(0)
  })

  it('addChapter appends and recomputes stats', () => {
    const id = useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    useSyllabusStore.getState().addChapter(id, { title: 'Ch1', titleBn: 'Ch1', description: '', descriptionBn: '', order: 1 })
    const s = useSyllabusStore.getState().syllabi.find(s => s.id === id)!
    expect(s.totalChapters).toBe(1)
    expect(s.chapters).toHaveLength(1)
  })

  it('deleteChapter removes chapter and recomputes', () => {
    const sid = useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    useSyllabusStore.getState().addChapter(sid, { title: 'Ch1', titleBn: 'Ch1', description: '', descriptionBn: '', order: 1 })
    const chId = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.chapters[0].id
    useSyllabusStore.getState().deleteChapter(sid, chId)
    expect(useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.totalChapters).toBe(0)
  })

  it('reorderChapters reorders and updates order field', () => {
    const sid = useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    useSyllabusStore.getState().addChapter(sid, { title: 'Ch1', titleBn: '', description: '', descriptionBn: '', order: 2 })
    useSyllabusStore.getState().addChapter(sid, { title: 'Ch2', titleBn: '', description: '', descriptionBn: '', order: 1 })
    const chapters = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.chapters
    if (chapters.length < 2) return
    const reversed = [chapters[1].id, chapters[0].id]
    useSyllabusStore.getState().reorderChapters(sid, reversed)
    const reordered = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.chapters
    expect(reordered).toHaveLength(2)
    expect(reordered[0].order).toBe(1)
    expect(reordered[1].order).toBe(2)
  })

  it('addTopic adds topic to chapter and recomputes', () => {
    const sid = useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    useSyllabusStore.getState().addChapter(sid, { title: 'Ch1', titleBn: '', description: '', descriptionBn: '', order: 1 })
    const chId = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.chapters[0].id
    useSyllabusStore.getState().addTopic(sid, chId, { title: 'T1', titleBn: '', description: '', descriptionBn: '', marks: 10, status: 'pending' })
    const s = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!
    expect(s.totalTopics).toBe(1)
  })

  it('updateTopicStatus recomputes completedTopics', () => {
    const sid = useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    useSyllabusStore.getState().addChapter(sid, { title: 'Ch1', titleBn: '', description: '', descriptionBn: '', order: 1 })
    const chId = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.chapters[0].id
    useSyllabusStore.getState().addTopic(sid, chId, { title: 'T1', titleBn: '', description: '', descriptionBn: '', marks: 10, status: 'pending' })
    const tpId = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.chapters[0].topics[0].id
    useSyllabusStore.getState().updateTopicStatus(sid, chId, tpId, 'completed')
    expect(useSyllabusStore.getState().syllabi.find(s => s.id === sid)!.completedTopics).toBe(1)
  })

  it('getSyllabusForClass finds correct entry', () => {
    useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    const result = useSyllabusStore.getState().getSyllabusForClass('1', 'A', 'SUB-1')
    expect(result).toBeDefined()
    expect(result!.classId).toBe('1')
    expect(useSyllabusStore.getState().getSyllabusForClass('1', 'B', 'SUB-1')).toBeUndefined()
  })

  it('updateSyllabus with chapters recomputes stats', () => {
    const sid = useSyllabusStore.getState().addSyllabus({
      classId: '1', sectionId: 'A', subjectId: 'SUB-1', sessionId: '2025-26', chapters: [],
    } as any)
    useSyllabusStore.getState().updateSyllabus(sid, {
      chapters: [
        { id: 'ch1', title: 'Ch1', titleBn: '', description: '', descriptionBn: '', order: 1, topics: [
          { id: 't1', title: 'T1', titleBn: '', description: '', descriptionBn: '', marks: 10, status: 'completed' },
        ]},
      ] as any,
    })
    const s = useSyllabusStore.getState().syllabi.find(s => s.id === sid)!
    expect(s.totalChapters).toBe(1)
    expect(s.totalTopics).toBe(1)
    expect(s.completedTopics).toBe(1)
  })
})
