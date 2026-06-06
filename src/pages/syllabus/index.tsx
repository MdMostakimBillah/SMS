import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ArrowLeft,
  X,
  Layers,
  GraduationCap,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore, extractClassNumber } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useSyllabusStore } from '@/store/syllabusStore'
import type { SyllabusEntry, SyllabusChapter, SyllabusTopic } from '@/store/syllabusStore'
import { generateSyllabusPDF } from './pdfTemplate'

const btnPri =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all'
const inputCls =
  'px-2.5 py-1.5 rounded-lg text-[0.6875rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]'
const selectCls = `${inputCls} cursor-pointer`
const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-[0.875rem] mb-[0.875rem]'

type View = 'home' | 'sections' | 'subjects' | 'detail'

export default function SyllabusPage() {
  const isBn = useBn()
  const classes = useClassStore((s) => s.classes)
  const currentSession = useClassStore((s) => s.institution.currentSession)
  const subjects = useTeacherStore((s) => s.subjects)
  const {
    syllabi: allSyllabi,
    addSyllabus,
    addChapter,
    updateChapter,
    deleteChapter,
    addTopic,
    updateTopic,
    deleteTopic,
    updateTopicStatus,
  } = useSyllabusStore()

  const syllabi = useMemo(() => allSyllabi.filter((s) => s.sessionId === currentSession), [allSyllabi, currentSession])

  const [view, setView] = useState<View>('home')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedSyllabus, setSelectedSyllabus] = useState<SyllabusEntry | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [editChapter, setEditChapter] = useState<SyllabusChapter | null>(null)
  const [editTopic, setEditTopic] = useState<SyllabusTopic | null>(null)
  const [activeChapterId, setActiveChapterId] = useState('')

  const [chapterForm, setChapterForm] = useState({ title: '', titleBn: '', description: '', descriptionBn: '', order: '1' })
  const [topicForm, setTopicForm] = useState({
    title: '',
    titleBn: '',
    description: '',
    descriptionBn: '',
    marks: '',
    status: 'pending' as SyllabusTopic['status'],
    weekNo: '',
    startDate: '',
    endDate: '',
  })

  // Get class numbers
  const classNumbers = useMemo(() => {
    return classes.map((cls) => extractClassNumber(cls.name))
  }, [classes])

  // Get sections for selected class
  const classSections = useMemo(() => {
    const cls = classes.find((c) => extractClassNumber(c.name) === selectedClass)
    return cls ? cls.sections.map((s) => s.name) : []
  }, [classes, selectedClass])

  // Get subjects for selected class
  const classSubjects = useMemo(() => {
    const cls = classes.find((c) => extractClassNumber(c.name) === selectedClass)
    if (!cls) return subjects
    // Filter subjects by class-level subjectIds if available
    const classSubjectIds = cls.sections[0]?.subjectIds || []
    if (classSubjectIds.length > 0) {
      return subjects.filter((s) => classSubjectIds.includes(s.id))
    }
    return subjects
  }, [classes, selectedClass, subjects])

  // Get syllabus for current selection
  useEffect(() => {
    if (!selectedClass || !selectedSection || !selectedSubject) return
    const s = syllabi.find(
      (sy) => sy.classId === selectedClass && sy.sectionId === selectedSection && sy.subjectId === selectedSubject
    ) || null
    setSelectedSyllabus(s)
  }, [syllabi, selectedClass, selectedSection, selectedSubject])

  const getSubjectName = useCallback(
    (id: string) => {
      const s = subjects.find((s) => s.id === id)
      return s ? (isBn ? s.nameBn : s.name) : id
    },
    [subjects, isBn]
  )

  const getClassName = useCallback(
    (classNum: string) => {
      const cls = classes.find((c) => extractClassNumber(c.name) === classNum)
      if (!cls) return classNum
      return isBn ? cls.nameBn : cls.name
    },
    [classes, isBn]
  )

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Navigation handlers
  const selectClass = (classNum: string) => {
    setSelectedClass(classNum)
    setSelectedSection('')
    setSelectedSubject('')
    setSelectedSyllabus(null)
    setView('sections')
  }

  const selectSection = (section: string) => {
    setSelectedSection(section)
    setSelectedSubject('')
    setSelectedSyllabus(null)
    setView('subjects')
  }

  const selectSubject = (subjectId: string) => {
    setSelectedSubject(subjectId)
    // Find or create syllabus
    const existing = syllabi.find(
      (s) => s.classId === selectedClass && s.sectionId === selectedSection && s.subjectId === subjectId
    )
    if (existing) {
      setSelectedSyllabus(existing)
      setExpandedChapters(new Set(existing.chapters.map((c) => c.id)))
    } else {
      // Create new syllabus
      const id = addSyllabus({
        classId: selectedClass,
        sectionId: selectedSection,
        subjectId,
        sessionId: currentSession,
        chapters: [],
      })
      const created = useSyllabusStore.getState().syllabi.find((s) => s.id === id)
      if (created) setSelectedSyllabus(created)
    }
    setView('detail')
  }

  const goBack = () => {
    if (view === 'detail') {
      setView('subjects')
      setSelectedSyllabus(null)
    } else if (view === 'subjects') {
      setView('sections')
      setSelectedSection('')
    } else if (view === 'sections') {
      setView('home')
      setSelectedClass('')
    }
  }

  // Chapter handlers
  const openAddChapter = () => {
    setEditChapter(null)
    setChapterForm({
      title: '',
      titleBn: '',
      description: '',
      descriptionBn: '',
      order: String((selectedSyllabus?.chapters.length || 0) + 1),
    })
    setShowChapterModal(true)
  }

  const openEditChapter = (ch: SyllabusChapter) => {
    setEditChapter(ch)
    setChapterForm({
      title: ch.title,
      titleBn: ch.titleBn,
      description: ch.description,
      descriptionBn: ch.descriptionBn,
      order: String(ch.order),
    })
    setShowChapterModal(true)
  }

  const handleSaveChapter = () => {
    if (!chapterForm.title || !selectedSyllabus) return
    if (editChapter) {
      updateChapter(selectedSyllabus.id, editChapter.id, {
        title: chapterForm.title,
        titleBn: chapterForm.titleBn || chapterForm.title,
        description: chapterForm.description,
        descriptionBn: chapterForm.descriptionBn || chapterForm.description,
        order: Number(chapterForm.order) || 1,
      })
    } else {
      addChapter(selectedSyllabus.id, {
        title: chapterForm.title,
        titleBn: chapterForm.titleBn || chapterForm.title,
        description: chapterForm.description,
        descriptionBn: chapterForm.descriptionBn || chapterForm.description,
        order: Number(chapterForm.order) || 1,
      })
    }
    setShowChapterModal(false)
    const updated = useSyllabusStore.getState().syllabi.find((s) => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleDeleteChapter = (chapterId: string) => {
    if (!selectedSyllabus) return
    if (!confirm(isBn ? 'অধ্যায় মুছে ফেলবেন?' : 'Delete chapter?')) return
    deleteChapter(selectedSyllabus.id, chapterId)
    const updated = useSyllabusStore.getState().syllabi.find((s) => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  // Topic handlers
  const openAddTopic = (chapterId: string) => {
    setEditTopic(null)
    setActiveChapterId(chapterId)
    setTopicForm({
      title: '',
      titleBn: '',
      description: '',
      descriptionBn: '',
      marks: '',
      status: 'pending',
      weekNo: '',
      startDate: '',
      endDate: '',
    })
    setShowTopicModal(true)
  }

  const openEditTopic = (chapterId: string, t: SyllabusTopic) => {
    setEditTopic(t)
    setActiveChapterId(chapterId)
    setTopicForm({
      title: t.title,
      titleBn: t.titleBn,
      description: t.description,
      descriptionBn: t.descriptionBn,
      marks: String(t.marks),
      status: t.status,
      weekNo: String(t.weekNo || ''),
      startDate: t.startDate || '',
      endDate: t.endDate || '',
    })
    setShowTopicModal(true)
  }

  const handleSaveTopic = () => {
    if (!topicForm.title || !selectedSyllabus) return
    const data = {
      title: topicForm.title,
      titleBn: topicForm.titleBn || topicForm.title,
      description: topicForm.description,
      descriptionBn: topicForm.descriptionBn || topicForm.description,
      marks: Number(topicForm.marks) || 0,
      status: topicForm.status,
      weekNo: topicForm.weekNo ? Number(topicForm.weekNo) : undefined,
      startDate: topicForm.startDate || undefined,
      endDate: topicForm.endDate || undefined,
    }
    if (editTopic) {
      updateTopic(selectedSyllabus.id, activeChapterId, editTopic.id, data)
    } else {
      addTopic(selectedSyllabus.id, activeChapterId, data)
    }
    setShowTopicModal(false)
    const updated = useSyllabusStore.getState().syllabi.find((s) => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleDeleteTopic = (chapterId: string, topicId: string) => {
    if (!selectedSyllabus) return
    if (!confirm(isBn ? 'টপিক মুছে ফেলবেন?' : 'Delete topic?')) return
    deleteTopic(selectedSyllabus.id, chapterId, topicId)
    const updated = useSyllabusStore.getState().syllabi.find((s) => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleStatusToggle = (chapterId: string, topicId: string, current: SyllabusTopic['status']) => {
    if (!selectedSyllabus) return
    const next: SyllabusTopic['status'] = current === 'pending' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'pending'
    updateTopicStatus(selectedSyllabus.id, chapterId, topicId, next)
    const updated = useSyllabusStore.getState().syllabi.find((s) => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleDownloadPDF = () => {
    if (!selectedSyllabus) return
    generateSyllabusPDF(
      {
        className: `${getClassName(selectedClass)} - ${selectedSection}`,
        subjectName: getSubjectName(selectedSubject),
        sessionId: selectedSyllabus.sessionId,
        chapters: selectedSyllabus.chapters.map((ch) => ({
          title: ch.title,
          titleBn: ch.titleBn,
          description: ch.description,
          descriptionBn: ch.descriptionBn,
          topics: ch.topics.map((t) => ({
            title: t.title,
            titleBn: t.titleBn,
            description: t.description,
            descriptionBn: t.descriptionBn,
            marks: t.marks,
            status: t.status,
            weekNo: t.weekNo,
            startDate: t.startDate,
            endDate: t.endDate,
          })),
        })),
      },
      isBn
    )
  }

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle size={10} className="text-[var(--green)]" />
    if (s === 'in-progress') return <Clock size={10} className="text-[var(--amber)]" />
    return <AlertCircle size={10} className="text-[var(--text-muted)]" />
  }

  const statusColor = (s: string) =>
    s === 'completed'
      ? 'bg-[var(--green-light)] text-[var(--green)]'
      : s === 'in-progress'
        ? 'bg-[var(--amber-light)] text-[var(--amber)]'
        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'

  // Get syllabus count for a class
  const getSyllabusCount = (classNum: string) => {
    return syllabi.filter((s) => s.classId === classNum).length
  }

  // Get syllabus count for a class+section
  const getSectionSyllabusCount = (classNum: string, section: string) => {
    return syllabi.filter((s) => s.classId === classNum && s.sectionId === section).length
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button
              onClick={goBack}
              className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-[1rem] font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen size={18} className="text-[var(--brand)]" />
              {isBn ? 'পাঠ্যক্রম ব্যবস্থাপনা' : 'Syllabus Management'}
            </h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">
              {view === 'home' && (isBn ? 'শ্রেণি নির্বাচন করুন' : 'Select a class')}
              {view === 'sections' && `${getClassName(selectedClass)} — ${isBn ? 'সেকশন নির্বাচন করুন' : 'Select Section'}`}
              {view === 'subjects' && `${getClassName(selectedClass)} - ${selectedSection} — ${isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subject'}`}
              {view === 'detail' && selectedSyllabus && `${getClassName(selectedClass)} - ${selectedSection} — ${getSubjectName(selectedSubject)}`}
            </p>
          </div>
        </div>
        {view === 'detail' && selectedSyllabus && (
          <button onClick={handleDownloadPDF} className={btnPri}>
            <Download size={14} />
            {isBn ? 'PDF' : 'PDF'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ HOME VIEW - Class Cards ═══ */}
        {view === 'home' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: isBn ? 'মোট শ্রেণি' : 'Total Classes', value: classes.length, color: 'var(--brand)' },
                { label: isBn ? 'মোট সিলেবাস' : 'Total Syllabi', value: syllabi.length, color: 'var(--green)' },
                { label: isBn ? 'মোট অধ্যায়' : 'Total Chapters', value: syllabi.reduce((s, sy) => s + sy.totalChapters, 0), color: 'var(--amber)' },
                { label: isBn ? 'সম্পন্ন' : 'Completed', value: syllabi.reduce((s, sy) => s + sy.completedTopics, 0), color: 'var(--purple)' },
              ].map((st, i) => (
                <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3">
                  <div className="text-[1.125rem] font-bold" style={{ color: st.color }}>
                    {st.value}
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-muted)]">{st.label}</div>
                </div>
              ))}
            </div>

            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-3">
              {isBn ? 'শ্রেণি নির্বাচন করুন' : 'Select Class'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {classNumbers.map((classNum) => {
                const count = getSyllabusCount(classNum)
                return (
                  <div
                    key={classNum}
                    onClick={() => selectClass(classNum)}
                    className="bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border)] rounded-2xl p-5 cursor-pointer hover:border-[var(--brand)] hover:shadow-md transition-all text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--brand-light)] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <GraduationCap size={24} className="text-[var(--brand)]" />
                    </div>
                    <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-1">
                      {getClassName(classNum)}
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">
                      {count} {isBn ? 'টি সিলেবাস' : 'syllabi'}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ═══ SECTIONS VIEW ═══ */}
        {view === 'sections' && (
          <>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-3">
              {isBn ? 'সেকশন নির্বাচন করুন' : 'Select Section'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {classSections.map((section) => {
                const count = getSectionSyllabusCount(selectedClass, section)
                return (
                  <div
                    key={section}
                    onClick={() => selectSection(section)}
                    className="bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border)] rounded-2xl p-5 cursor-pointer hover:border-[var(--teal)] hover:shadow-md transition-all text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--teal-light)] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <span className="text-[1.125rem] font-bold text-[var(--teal)]">{section}</span>
                    </div>
                    <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-1">
                      {isBn ? 'সেকশন' : 'Section'} {section}
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">
                      {count} {isBn ? 'টি সিলেবাস' : 'syllabi'}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ═══ SUBJECTS VIEW ═══ */}
        {view === 'subjects' && (
          <>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-3">
              {isBn ? 'বিষয় নির্বাচন করুন' : 'Select Subject'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {classSubjects.map((subject) => {
                const existing = syllabi.find(
                  (s) => s.classId === selectedClass && s.sectionId === selectedSection && s.subjectId === subject.id
                )
                const pct = existing && existing.totalTopics > 0
                  ? Math.round((existing.completedTopics / existing.totalTopics) * 100)
                  : 0

                return (
                  <div
                    key={subject.id}
                    onClick={() => selectSubject(subject.id)}
                    className="bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border)] rounded-2xl p-5 cursor-pointer hover:border-[var(--purple)] hover:shadow-md transition-all text-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--purple-light)] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <BookOpen size={22} className="text-[var(--purple)]" />
                    </div>
                    <div className="text-[0.8125rem] font-bold text-[var(--text-primary)] mb-1">
                      {isBn ? subject.nameBn : subject.name}
                    </div>
                    {existing ? (
                      <div className="mt-2">
                        <div className="text-[0.6875rem] font-semibold mb-1" style={{ color: pct === 100 ? 'var(--green)' : 'var(--brand)' }}>
                          {pct}%
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--brand)' }}
                          />
                        </div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] mt-1">
                          {existing.totalChapters} {isBn ? 'অধ্যায়' : 'ch'} · {existing.totalTopics} {isBn ? 'টপিক' : 'tp'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[0.625rem] text-[var(--text-muted)] mt-2 italic">
                        {isBn ? 'নতুন সিলেবাস' : 'New syllabus'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ═══ DETAIL VIEW ═══ */}
        {view === 'detail' && selectedSyllabus && (
          <div className="grid gap-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[
                { label: isBn ? 'অধ্যায়' : 'Chapters', value: selectedSyllabus.totalChapters, color: 'var(--brand)' },
                { label: isBn ? 'টপিক' : 'Topics', value: selectedSyllabus.totalTopics, color: 'var(--amber)' },
                { label: isBn ? 'সম্পন্ন' : 'Done', value: selectedSyllabus.completedTopics, color: 'var(--green)' },
              ].map((st, i) => (
                <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-center">
                  <div className="text-[1rem] font-bold" style={{ color: st.color }}>{st.value}</div>
                  <div className="text-[0.625rem] text-[var(--text-muted)]">{st.label}</div>
                </div>
              ))}
            </div>

            {/* Chapter Header */}
            <div className="flex items-center justify-between">
              <div className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? `মোট ${selectedSyllabus.chapters.length}টি অধ্যায়` : `${selectedSyllabus.chapters.length} chapters`}
              </div>
              <button onClick={openAddChapter} className={btnPri}>
                <Plus size={14} />
                {isBn ? 'অধ্যায় যোগ' : 'Add Chapter'}
              </button>
            </div>

            {/* Chapters */}
            {selectedSyllabus.chapters.length === 0 ? (
              <div className="text-center py-12">
                <Layers size={36} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                <p className="text-[0.75rem] text-[var(--text-muted)]">{isBn ? 'কোনো অধ্যায় নেই' : 'No chapters yet'}</p>
                <button onClick={openAddChapter} className={`${btnPri} mt-3 mx-auto`}>
                  <Plus size={14} />
                  {isBn ? 'প্রথম অধ্যায় যোগ' : 'Add First Chapter'}
                </button>
              </div>
            ) : (
              selectedSyllabus.chapters
                .sort((a, b) => a.order - b.order)
                .map((ch) => {
                  const isExpanded = expandedChapters.has(ch.id)
                  const chTotal = ch.topics.reduce((s, t) => s + t.marks, 0)
                  const chDone = ch.topics.filter((t) => t.status === 'completed').length
                  return (
                    <div key={ch.id} className={sectionCls}>
                      {/* Chapter Header */}
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleChapter(ch.id)}>
                        <button className="text-[var(--text-muted)]">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <span className="text-[0.5625rem] font-bold text-white bg-[var(--brand)] rounded-md px-1.5 py-0.5">{ch.order}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{isBn ? ch.titleBn : ch.title}</div>
                          <div className="text-[0.5625rem] text-[var(--text-muted)] truncate">{isBn ? ch.descriptionBn : ch.description}</div>
                        </div>
                        <span className="text-[0.5625rem] text-[var(--text-muted)]">
                          {chDone}/{ch.topics.length} {isBn ? 'টপিক' : 'topics'}
                        </span>
                        <span className="text-[0.5625rem] font-semibold text-[var(--brand)]">
                          {chTotal} {isBn ? 'মা.' : 'mk'}
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditChapter(ch)}
                            className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button
                            onClick={() => handleDeleteChapter(ch.id)}
                            className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Topics */}
                      {isExpanded && (
                        <div className="mt-3 ml-6">
                          {ch.topics.length === 0 ? (
                            <div className="text-center py-6 text-[0.625rem] text-[var(--text-muted)] italic">
                              {isBn ? 'এই অধ্যায়ে কোনো টপিক নেই' : 'No topics in this chapter'}
                            </div>
                          ) : (
                            <div className="divide-y divide-[var(--border)]">
                              {ch.topics.map((t) => (
                                <div key={t.id} className="flex items-center gap-2 py-2 group">
                                  <button
                                    onClick={() => handleStatusToggle(ch.id, t.id, t.status)}
                                    className="cursor-pointer bg-transparent border-none p-0 flex items-center"
                                    title={isBn ? 'অবস্থা পরিবর্তন' : 'Toggle status'}
                                  >
                                    {statusIcon(t.status)}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{isBn ? t.titleBn : t.title}</div>
                                    <div className="text-[0.5625rem] text-[var(--text-muted)]">{isBn ? t.descriptionBn : t.description}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {t.weekNo && (
                                        <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                                          {isBn ? 'সপ্তাহ' : 'Wk'} {t.weekNo}
                                        </span>
                                      )}
                                      {t.startDate && (
                                        <span className="text-[0.5rem] text-[var(--text-muted)]">
                                          {t.startDate}
                                          {t.endDate ? ` – ${t.endDate}` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[0.625rem] font-semibold text-[var(--brand)] whitespace-nowrap">
                                    {t.marks} {isBn ? 'মা.' : 'mk'}
                                  </span>
                                  <span className={`text-[0.5rem] px-1.5 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>
                                    {t.status === 'completed'
                                      ? isBn ? 'সম্পন্ন' : 'Done'
                                      : t.status === 'in-progress'
                                        ? isBn ? 'চলমান' : 'Running'
                                        : isBn ? 'বাকি' : 'Pending'}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditTopic(ch.id, t)}
                                      className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                                    >
                                      <Edit2 size={8} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTopic(ch.id, t.id)}
                                      className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                                    >
                                      <Trash2 size={8} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => openAddTopic(ch.id)}
                            className="mt-2 flex items-center gap-1 text-[0.5625rem] px-2 py-1 rounded-md bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] cursor-pointer font-medium hover:shadow-sm"
                          >
                            <Plus size={9} />
                            {isBn ? 'টপিক যোগ' : 'Add Topic'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
            )}
          </div>
        )}
      </div>

      {/* ═══ Chapter Modal ═══ */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowChapterModal(false)}>
          <div
            className="bg-[var(--bg-primary)] rounded-2xl p-5 w-full max-w-md shadow-xl border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                {editChapter ? (isBn ? 'অধ্যায় এডিট' : 'Edit Chapter') : isBn ? 'নতুন অধ্যায়' : 'New Chapter'}
              </span>
              <button
                onClick={() => setShowChapterModal(false)}
                className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'নাম (EN)' : 'Name (EN)'}
                  </label>
                  <input
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm((p) => ({ ...p, title: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="e.g. Force & Motion"
                  />
                </div>
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'নাম (BN)' : 'Name (BN)'}
                  </label>
                  <input
                    value={chapterForm.titleBn}
                    onChange={(e) => setChapterForm((p) => ({ ...p, titleBn: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="e.g. বল ও গতি"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'বিবরণ (EN)' : 'Description (EN)'}
                  </label>
                  <input
                    value={chapterForm.description}
                    onChange={(e) => setChapterForm((p) => ({ ...p, description: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'বিবরণ (BN)' : 'Description (BN)'}
                  </label>
                  <input
                    value={chapterForm.descriptionBn}
                    onChange={(e) => setChapterForm((p) => ({ ...p, descriptionBn: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="সংক্ষিপ্ত বিবরণ"
                  />
                </div>
              </div>
              <div>
                <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ক্রম' : 'Order'}</label>
                <input
                  type="number"
                  min="1"
                  value={chapterForm.order}
                  onChange={(e) => setChapterForm((p) => ({ ...p, order: e.target.value }))}
                  className={`${inputCls} w-20`}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowChapterModal(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveChapter}
                disabled={!chapterForm.title}
                className={`${btnPri} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Topic Modal ═══ */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowTopicModal(false)}>
          <div
            className="bg-[var(--bg-primary)] rounded-2xl p-5 w-full max-w-lg shadow-xl border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                {editTopic ? (isBn ? 'টপিক এডিট' : 'Edit Topic') : isBn ? 'নতুন টপিক' : 'New Topic'}
              </span>
              <button
                onClick={() => setShowTopicModal(false)}
                className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'নাম (EN)' : 'Name (EN)'}
                  </label>
                  <input
                    value={topicForm.title}
                    onChange={(e) => setTopicForm((p) => ({ ...p, title: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="e.g. Newton's Laws"
                  />
                </div>
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'নাম (BN)' : 'Name (BN)'}
                  </label>
                  <input
                    value={topicForm.titleBn}
                    onChange={(e) => setTopicForm((p) => ({ ...p, titleBn: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="e.g. নিউটনের সূত্র"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'বিবরণ (EN)' : 'Description (EN)'}
                  </label>
                  <input
                    value={topicForm.description}
                    onChange={(e) => setTopicForm((p) => ({ ...p, description: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'বিবরণ (BN)' : 'Description (BN)'}
                  </label>
                  <input
                    value={topicForm.descriptionBn}
                    onChange={(e) => setTopicForm((p) => ({ ...p, descriptionBn: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="সংক্ষিপ্ত বিবরণ"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'মার্কস' : 'Marks'}</label>
                  <input
                    type="number"
                    min="0"
                    value={topicForm.marks}
                    onChange={(e) => setTopicForm((p) => ({ ...p, marks: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সপ্তাহ' : 'Week No'}</label>
                  <input
                    type="number"
                    min="1"
                    value={topicForm.weekNo}
                    onChange={(e) => setTopicForm((p) => ({ ...p, weekNo: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অবস্থা' : 'Status'}</label>
                  <select
                    value={topicForm.status}
                    onChange={(e) => setTopicForm((p) => ({ ...p, status: e.target.value as SyllabusTopic['status'] }))}
                    className={`${selectCls} w-full`}
                  >
                    <option value="pending">{isBn ? 'বাকি' : 'Pending'}</option>
                    <option value="in-progress">{isBn ? 'চলমান' : 'In Progress'}</option>
                    <option value="completed">{isBn ? 'সম্পন্ন' : 'Completed'}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start Date'}</label>
                  <input
                    type="date"
                    value={topicForm.startDate}
                    onChange={(e) => setTopicForm((p) => ({ ...p, startDate: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[0.625rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End Date'}</label>
                  <input
                    type="date"
                    value={topicForm.endDate}
                    onChange={(e) => setTopicForm((p) => ({ ...p, endDate: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowTopicModal(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveTopic}
                disabled={!topicForm.title}
                className={`${btnPri} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
