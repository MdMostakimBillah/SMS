import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  FileText,
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
  ArrowRight,
  X,
  Layers,
  GraduationCap,
  Settings,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore, extractClassNumber } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useSyllabusStore } from '@/store/syllabusStore'
import type { SyllabusEntry, SyllabusChapter, SyllabusTopic } from '@/store/syllabusStore'
import { SyllabusPDFOptionsModal } from './SyllabusPDFOptionsModal'
import { useNavChain, useNavChainClearOnMount } from '@/hooks/useNavChain'
import { Skeleton, SkeletonCard, SkeletonLine } from '@/components/ui/Skeleton'

const btnPri =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all'
const inputCls =
  'px-3.5 py-2.5 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]'
const selectCls = inputCls + ' cursor-pointer'

function SyllabusPageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton variant="title" width="16rem" height="1.25rem" />
      <Skeleton variant="text" width="10rem" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i}>
            <SkeletonLine width="50%" />
            <SkeletonLine width="100%" />
            <SkeletonLine width="70%" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  )
}

type View = 'home' | 'sections' | 'subjects' | 'detail'

export default function SyllabusPage() {
  const isBn = useBn()
  const navigate = useNavigate()
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])
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
  const [showPDFModal, setShowPDFModal] = useState(false)

  const [chapterForm, setChapterForm] = useState({ title: '', titleBn: '', description: '', descriptionBn: '', order: '1' })
  const [chapterLangMode, setChapterLangMode] = useState<'both' | 'en' | 'bn'>('both')
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
  const [topicLangMode, setTopicLangMode] = useState<'both' | 'en' | 'bn'>('both')

  const chapterLangBtnRefs = useRef<Map<string, HTMLButtonElement | null>>(null)
  const chapterLangSliderRef = useRef<HTMLDivElement | null>(null)
  const topicLangBtnRefs = useRef<Map<string, HTMLButtonElement | null>>(null)
  const topicLangSliderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const slider = chapterLangSliderRef.current
    const btn = chapterLangBtnRefs.current?.get(chapterLangMode)
    if (!slider || !btn) return
    const container = slider.parentElement
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const scrollLeft = container.scrollLeft || 0
    slider.style.width = `${btnRect.width}px`
    slider.style.transform = `translateX(${btnRect.left - containerRect.left + scrollLeft}px)`
  }, [chapterLangMode])

  useEffect(() => {
    const slider = topicLangSliderRef.current
    const btn = topicLangBtnRefs.current?.get(topicLangMode)
    if (!slider || !btn) return
    const container = slider.parentElement
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const scrollLeft = container.scrollLeft || 0
    slider.style.width = `${btnRect.width}px`
    slider.style.transform = `translateX(${btnRect.left - containerRect.left + scrollLeft}px)`
  }, [topicLangMode])

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

  // Clear nav chain if user navigated directly (not via redirect button)
  // Redirect buttons set sessionStorage timestamp; if absent or stale, clear chain
  useEffect(() => {
    const lastRedirect = sessionStorage.getItem('edutech_lastRedirect')
    const now = Date.now()
    if (!lastRedirect || now - Number(lastRedirect) > 30000) {
      localStorage.removeItem('edutech_navChain')
    }
  }, [])

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

  const { popFromChain, getChain, pushToChain, setRedirectTimestamp } = useNavChain()
  useNavChainClearOnMount()

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
    setChapterLangMode('both')
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
    setChapterLangMode('both')
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
    const hasTitle = chapterLangMode === 'bn' ? !!chapterForm.titleBn : !!chapterForm.title
    if (!hasTitle || !selectedSyllabus) return
    const title = chapterForm.title || chapterForm.titleBn
    const titleBn = chapterForm.titleBn || chapterForm.title
    const description = chapterForm.description || chapterForm.descriptionBn
    const descriptionBn = chapterForm.descriptionBn || chapterForm.description
    if (editChapter) {
      updateChapter(selectedSyllabus.id, editChapter.id, {
        title,
        titleBn,
        description,
        descriptionBn,
        order: Number(chapterForm.order) || 1,
        langMode: chapterLangMode,
      })
    } else {
      addChapter(selectedSyllabus.id, {
        title,
        titleBn,
        description,
        descriptionBn,
        order: Number(chapterForm.order) || 1,
        langMode: chapterLangMode,
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
    const chapter = selectedSyllabus?.chapters.find((ch) => ch.id === chapterId)
    setTopicLangMode(chapter?.langMode || 'both')
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
    setTopicLangMode('both')
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
    const hasTitle = topicLangMode === 'bn' ? !!topicForm.titleBn : !!topicForm.title
    if (!hasTitle || !selectedSyllabus) return
    const data = {
      title: topicForm.title || topicForm.titleBn,
      titleBn: topicForm.titleBn || topicForm.title,
      description: topicForm.description || topicForm.descriptionBn,
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

  const openPDFModal = () => {
    if (!selectedSyllabus) return
    setShowPDFModal(true)
  }

  const handleDownloadPDF = (html: string, _filename: string) => {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 500)
    }
  }

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle size={14} className="text-[var(--green)]" />
    if (s === 'in-progress') return <Clock size={14} className="text-[var(--amber)]" />
    return <AlertCircle size={14} className="text-[var(--text-muted)]" />
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

  if (isLoading) return <SyllabusPageSkeleton />

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          {(() => {
            if (view === 'home') {
              const prev = popFromChain()
              if (prev) {
                return (
                  <button
                    onClick={() => navigate(prev.path)}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )
              }
              return null
            }
            return (
              <button
                onClick={goBack}
                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft size={16} />
              </button>
            )
          })()}
          <div>
            {/* Breadcrumb — only when redirected */}
            {(() => {
              const chain = getChain()
              if (chain.length === 0) return null
              return (
                <div className="flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)] mb-1 flex-wrap">
                  {chain.map((item: { path: string; label: string }, idx: number) => (
                    <span key={idx} className="flex items-center gap-1">
                      {idx > 0 && <span className="text-[var(--text-muted)]">›</span>}
                      <button
                        onClick={() => {
                          navigate(item.path)
                        }}
                        className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer text-[inherit] font-[inherit] transition-colors"
                      >
                        {item.label}
                      </button>
                    </span>
                  ))}
                  <span className="text-[var(--text-muted)]">›</span>
                  <span className="py-[0.1875rem] px-[0.5rem] rounded bg-[var(--brand)] text-white font-medium">
                    {isBn ? 'পাঠ্যক্রম' : 'Syllabus'}
                  </span>
                </div>
              )
            })()}
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
          <button onClick={openPDFModal} className={btnPri}>
            <Download size={14} />
            {isBn ? 'PDF' : 'PDF'}
          </button>
        )}
        {view === 'home' && classNumbers.length === 0 && (
          <button
            onClick={() => {
              pushToChain({ path: '/syllabus', label: isBn ? 'পাঠ্যক্রম' : 'Syllabus' })
              setRedirectTimestamp()
              navigate('/classes')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all"
          >
            <Settings size={14} />
            {isBn ? 'শ্রেণি ব্যবস্থাপনা' : 'Class Management'}
            <ArrowRight size={14} />
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
              {classNumbers.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <GraduationCap size={36} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1">
                    {isBn ? 'কোনো শ্রেণি তৈরি হয়নি' : 'No classes created yet'}
                  </p>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                    {isBn ? 'প্রথমে শ্রেণি ও সেকশন তৈরি করুন, তারপর সিলেবাস যোগ করুন।' : 'Create classes and sections first, then add syllabi.'}
                  </p>
                  <button
                    onClick={() => {
                      pushToChain({ path: '/syllabus', label: isBn ? 'পাঠ্যক্রম' : 'Syllabus' })
                      setRedirectTimestamp()
                      navigate('/classes')
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all"
                  >
                    <Settings size={14} />
                    {isBn ? 'শ্রেণি ব্যবস্থাপনায় যান' : 'Go to Class Management'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : classNumbers.map((classNum) => {
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
              {classSections.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Layers size={36} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1">
                    {isBn ? 'এই শ্রেণিতে কোনো সেকশন নেই' : 'No sections in this class'}
                  </p>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                    {isBn ? 'শ্রেণি ব্যবস্থাপনা থেকে সেকশন যোগ করুন।' : 'Add sections from Class Management.'}
                  </p>
                  <button
                    onClick={() => {
                      pushToChain({ path: '/syllabus', label: isBn ? 'পাঠ্যক্রম' : 'Syllabus' })
                      setRedirectTimestamp()
                      navigate('/classes')
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all"
                  >
                    <Settings size={14} />
                    {isBn ? 'শ্রেণি ব্যবস্থাপনায় যান' : 'Go to Class Management'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : classSections.map((section) => {
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
              {classSubjects.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <BookOpen size={36} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1">
                    {isBn ? 'এই সেকশনে কোনো বিষয় নেই' : 'No subjects for this section'}
                  </p>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                    {isBn ? 'প্রথমে বিষয় তৈরি করুন, তারপর সেকশনে যোগ করুন।' : 'Create subjects first, then add them to this section.'}
                  </p>
                  <button
                    onClick={() => {
                      pushToChain({ path: '/syllabus', label: isBn ? 'পাঠ্যক্রম' : 'Syllabus' })
                      setRedirectTimestamp()
                      navigate('/classes')
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all"
                  >
                    <Settings size={14} />
                    {isBn ? 'শ্রেণি ব্যবস্থাপনায় যান' : 'Go to Class Management'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : classSubjects.map((subject) => {
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
              <div className="space-y-4">
                {selectedSyllabus.chapters
                  .sort((a, b) => a.order - b.order)
                  .map((ch) => {
                    const isExpanded = expandedChapters.has(ch.id)
                    const chTotal = ch.topics.reduce((s, t) => s + t.marks, 0)
                    const chDone = ch.topics.filter((t) => t.status === 'completed').length
                    return (
                      <div key={ch.id} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
                        {/* Chapter Header */}
                        <div
                          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                          onClick={() => toggleChapter(ch.id)}
                        >
                          <div className="w-9 h-9 rounded-full bg-[var(--brand)] flex items-center justify-center text-white shrink-0">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                              {isBn ? ch.titleBn : ch.title}
                            </div>
                            <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                              {chDone}/{ch.topics.length} {isBn ? 'টপিক সম্পন্ন' : 'topics done'}
                              {chTotal > 0 && <> · {chTotal} {isBn ? 'মার্কস' : 'marks'}</>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEditChapter(ch)}
                              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(ch.id)}
                              className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)] hover:border-[var(--red)] transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Topics */}
                        {isExpanded && (
                          <div className="border-t border-[var(--border)]">
                            {ch.topics.length === 0 ? (
                              <div className="text-center py-8 text-[0.75rem] text-[var(--text-muted)]">
                                {isBn ? 'এই অধ্যায়ে কোনো টপিক নেই' : 'No topics in this chapter'}
                              </div>
                            ) : (
                              <div className="divide-y divide-[var(--border)]">
                                {ch.topics.map((t) => (
                                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors group">
                                    <button
                                      onClick={() => handleStatusToggle(ch.id, t.id, t.status)}
                                      className="cursor-pointer bg-transparent border-none p-0 flex items-center shrink-0"
                                      title={isBn ? 'অবস্থা পরিবর্তন' : 'Toggle status'}
                                    >
                                      {statusIcon(t.status)}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
                                        {isBn ? t.titleBn : t.title}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        {t.weekNo && (
                                          <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                                            {isBn ? 'সপ্তাহ' : 'Wk'} {t.weekNo}
                                          </span>
                                        )}
                                        {t.startDate && (
                                          <span className="text-[0.625rem] text-[var(--text-muted)]">
                                            {t.startDate}{t.endDate ? ' – ' + t.endDate : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[0.75rem] font-semibold text-[var(--brand)]">
                                        {t.marks} {isBn ? 'মা.' : 'mk'}
                                      </span>
                                      <span className={'text-[0.625rem] px-2 py-0.5 rounded-full font-medium ' + statusColor(t.status)}>
                                        {t.status === 'completed'
                                          ? isBn ? 'সম্পন্ন' : 'Done'
                                          : t.status === 'in-progress'
                                            ? isBn ? 'চলমান' : 'Running'
                                            : isBn ? 'বাকি' : 'Pending'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openEditTopic(ch.id, t)}
                                        className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)] hover:border-[var(--brand)]"
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTopic(ch.id, t.id)}
                                        className="w-7 h-7 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)] hover:border-[var(--red)]"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="px-4 py-3 border-t border-[var(--border)]">
                              <button
                                onClick={() => openAddTopic(ch.id)}
                                className="flex items-center gap-1.5 text-[0.6875rem] px-3 py-1.5 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] cursor-pointer font-medium hover:shadow-sm transition-all"
                              >
                                <Plus size={12} />
                                {isBn ? 'টপিক যোগ' : 'Add Topic'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Chapter Modal ═══ */}
      {showChapterModal && createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6" onClick={() => setShowChapterModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl w-full max-w-[40rem] shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                  <BookOpen size={20} className="text-[var(--brand)]" />
                </div>
                <div>
                  <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">
                    {editChapter ? (isBn ? 'অধ্যায় এডিট' : 'Edit Chapter') : isBn ? 'নতুন অধ্যায়' : 'New Chapter'}
                  </h3>
                  <p className="text-[0.75rem] text-[var(--text-muted)]">
                    {editChapter ? (isBn ? 'অধ্যায়ের তথ্য আপডেট করুন' : 'Update chapter information') : isBn ? 'একটি নতুন অধ্যায় তৈরি করুন' : 'Create a new chapter'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChapterModal(false)}
                className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 sm:px-8 py-6 space-y-5 overflow-y-auto">
              <div className="relative flex items-center gap-2 p-1 bg-[var(--bg-secondary)] rounded-xl w-fit">
                <div ref={chapterLangSliderRef} className="absolute top-1 bottom-1 bg-[var(--brand)] rounded-lg [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out] shadow-sm" />
                {(['both', 'en', 'bn'] as const).map((mode) => (
                  <button
                    key={mode}
                    ref={(el) => { if (!chapterLangBtnRefs.current) chapterLangBtnRefs.current = new Map(); chapterLangBtnRefs.current.set(mode, el) }}
                    type="button"
                    onClick={() => {
                      setChapterLangMode(mode)
                      if (mode === 'en') {
                        setChapterForm((p) => ({ ...p, titleBn: '', descriptionBn: '' }))
                      } else if (mode === 'bn') {
                        setChapterForm((p) => ({ ...p, title: '', description: '' }))
                      }
                    }}
                    className={`relative z-10 px-4 py-1.5 rounded-lg text-[0.8125rem] font-medium transition-colors duration-200 cursor-pointer ${
                      chapterLangMode === mode ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {mode === 'both' ? (isBn ? 'উভয়' : 'Both') : mode === 'en' ? 'English' : 'বাংলা'}
                  </button>
                ))}
              </div>
              <div className={`grid gap-5 ${chapterLangMode === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {chapterLangMode !== 'bn' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'নাম (EN)' : 'Name (EN)'}
                    </label>
                    <input
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm((p) => ({ ...p, title: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="e.g. Force & Motion"
                    />
                  </div>
                )}
                {chapterLangMode !== 'en' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'নাম (BN)' : 'Name (BN)'}
                    </label>
                    <input
                      value={chapterForm.titleBn}
                      onChange={(e) => setChapterForm((p) => ({ ...p, titleBn: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="e.g. বল ও গতি"
                    />
                  </div>
                )}
              </div>
              <div className={`grid gap-5 ${chapterLangMode === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {chapterLangMode !== 'bn' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'বিবরণ (EN)' : 'Description (EN)'}
                    </label>
                    <input
                      value={chapterForm.description}
                      onChange={(e) => setChapterForm((p) => ({ ...p, description: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="Brief description"
                    />
                  </div>
                )}
                {chapterLangMode !== 'en' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'বিবরণ (BN)' : 'Description (BN)'}
                    </label>
                    <input
                      value={chapterForm.descriptionBn}
                      onChange={(e) => setChapterForm((p) => ({ ...p, descriptionBn: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="সংক্ষিপ্ত বিবরণ"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">{isBn ? 'ক্রম' : 'Order'}</label>
                <input
                  type="number"
                  min="1"
                  value={chapterForm.order}
                  onChange={(e) => setChapterForm((p) => ({ ...p, order: e.target.value }))}
                  className={`${inputCls} w-28`}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end px-5 sm:px-8 py-5 border-t border-[var(--border)] shrink-0">
              <button
                onClick={() => setShowChapterModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.875rem] font-medium cursor-pointer hover:bg-[var(--bg-primary)] transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveChapter}
                disabled={chapterLangMode === 'bn' ? !chapterForm.titleBn : !chapterForm.title}
                className={`${btnPri} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ Topic Modal ═══ */}
      {showTopicModal && createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6" onClick={() => setShowTopicModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl w-full max-w-[40rem] shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                  <FileText size={20} className="text-[var(--brand)]" />
                </div>
                <div>
                  <h3 className="text-[1rem] font-semibold text-[var(--text-primary)]">
                    {editTopic ? (isBn ? 'টপিক এডিট' : 'Edit Topic') : isBn ? 'নতুন টপিক' : 'New Topic'}
                  </h3>
                  <p className="text-[0.75rem] text-[var(--text-muted)]">
                    {editTopic ? (isBn ? 'টপিকের তথ্য আপডেট করুন' : 'Update topic information') : isBn ? 'একটি নতুন টপিক যোগ করুন' : 'Add a new topic'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTopicModal(false)}
                className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 sm:px-8 py-6 space-y-5 overflow-y-auto">
              <div className="relative flex items-center gap-2 p-1 bg-[var(--bg-secondary)] rounded-xl w-fit">
                <div ref={topicLangSliderRef} className="absolute top-1 bottom-1 bg-[var(--brand)] rounded-lg [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out] shadow-sm" />
                {(['both', 'en', 'bn'] as const).map((mode) => (
                  <button
                    key={mode}
                    ref={(el) => { if (!topicLangBtnRefs.current) topicLangBtnRefs.current = new Map(); topicLangBtnRefs.current.set(mode, el) }}
                    type="button"
                    onClick={() => {
                      setTopicLangMode(mode)
                      if (mode === 'en') {
                        setTopicForm((p) => ({ ...p, titleBn: '', descriptionBn: '' }))
                      } else if (mode === 'bn') {
                        setTopicForm((p) => ({ ...p, title: '', description: '' }))
                      }
                    }}
                    className={`relative z-10 px-4 py-1.5 rounded-lg text-[0.8125rem] font-medium transition-colors duration-200 cursor-pointer ${
                      topicLangMode === mode ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {mode === 'both' ? (isBn ? 'উভয়' : 'Both') : mode === 'en' ? 'English' : 'বাংলা'}
                  </button>
                ))}
              </div>
              <div className={`grid gap-5 ${topicLangMode === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {topicLangMode !== 'bn' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'নাম (EN)' : 'Name (EN)'}
                    </label>
                    <input
                      value={topicForm.title}
                      onChange={(e) => setTopicForm((p) => ({ ...p, title: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="e.g. Newton's Laws"
                    />
                  </div>
                )}
                {topicLangMode !== 'en' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'নাম (BN)' : 'Name (BN)'}
                    </label>
                    <input
                      value={topicForm.titleBn}
                      onChange={(e) => setTopicForm((p) => ({ ...p, titleBn: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="e.g. নিউটনের সূত্র"
                    />
                  </div>
                )}
              </div>
              <div className={`grid gap-5 ${topicLangMode === 'both' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {topicLangMode !== 'bn' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'বিবরণ (EN)' : 'Description (EN)'}
                    </label>
                    <input
                      value={topicForm.description}
                      onChange={(e) => setTopicForm((p) => ({ ...p, description: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="Brief description"
                    />
                  </div>
                )}
                {topicLangMode !== 'en' && (
                  <div>
                    <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">
                      {isBn ? 'বিবরণ (BN)' : 'Description (BN)'}
                    </label>
                    <input
                      value={topicForm.descriptionBn}
                      onChange={(e) => setTopicForm((p) => ({ ...p, descriptionBn: e.target.value }))}
                      className={`${inputCls} w-full`}
                      placeholder="সংক্ষিপ্ত বিবরণ"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <div>
                  <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">{isBn ? 'মার্কস' : 'Marks'}</label>
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
                  <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">{isBn ? 'সপ্তাহ' : 'Week No'}</label>
                  <input
                    type="number"
                    min="1"
                    value={topicForm.weekNo}
                    onChange={(e) => setTopicForm((p) => ({ ...p, weekNo: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">{isBn ? 'অবস্থা' : 'Status'}</label>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">{isBn ? 'শুরু' : 'Start Date'}</label>
                  <input
                    type="date"
                    value={topicForm.startDate}
                    onChange={(e) => setTopicForm((p) => ({ ...p, startDate: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)] mb-2 block">{isBn ? 'শেষ' : 'End Date'}</label>
                  <input
                    type="date"
                    value={topicForm.endDate}
                    onChange={(e) => setTopicForm((p) => ({ ...p, endDate: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end px-5 sm:px-8 py-5 border-t border-[var(--border)] shrink-0">
              <button
                onClick={() => setShowTopicModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.875rem] font-medium cursor-pointer hover:bg-[var(--bg-primary)] transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveTopic}
                disabled={topicLangMode === 'bn' ? !topicForm.titleBn : !topicForm.title}
                className={`${btnPri} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ PDF Options Modal ═══ */}
      {showPDFModal && selectedSyllabus && (
        <SyllabusPDFOptionsModal
          className={`${getClassName(selectedClass)} - ${selectedSection}`}
          subjectName={getSubjectName(selectedSubject)}
          sessionId={selectedSyllabus.sessionId}
          chapters={selectedSyllabus.chapters.map((ch) => ({
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
          }))}
          isBn={isBn}
          onClose={() => setShowPDFModal(false)}
          onDownload={handleDownloadPDF}
        />
      )}
    </div>
  )
}
