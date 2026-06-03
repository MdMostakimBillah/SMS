import { useState, useMemo, useCallback } from 'react'
import {
  BookOpen, Plus, Trash2, Edit2, ChevronDown, ChevronRight,
  CheckCircle, Clock, AlertCircle, Download, ArrowLeft, X,
  FileText, Layers,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useClassStore, getClassOptions } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useSyllabusStore } from '@/store/syllabusStore'
import type { SyllabusEntry, SyllabusChapter, SyllabusTopic } from '@/store/syllabusStore'
import { generateSyllabusPDF } from './pdfTemplate'

const btnPri = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all'
const inputCls = 'px-2.5 py-1.5 rounded-lg text-[11px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]'
const selectCls = `${inputCls} cursor-pointer`
const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'

type View = 'list' | 'detail'

export default function SyllabusPage() {
  const { language } = useAppStore()
  const isBn = language === 'bn'
  const classes = useClassStore(s => s.classes)
  const subjects = useTeacherStore(s => s.subjects)
  const { syllabi, addSyllabus, deleteSyllabus, addChapter, updateChapter, deleteChapter, addTopic, updateTopic, deleteTopic, updateTopicStatus } = useSyllabusStore()

  const [view, setView] = useState<View>('list')
  const [selectedSyllabus, setSelectedSyllabus] = useState<SyllabusEntry | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [editChapter, setEditChapter] = useState<SyllabusChapter | null>(null)
  const [editTopic, setEditTopic] = useState<SyllabusTopic | null>(null)
  const [activeChapterId, setActiveChapterId] = useState('')

  const [syllabusForm, setSyllabusForm] = useState({ classId: '', subjectId: '', sessionId: '2025-26' })
  const [chapterForm, setChapterForm] = useState({ title: '', titleBn: '', description: '', descriptionBn: '', order: '1' })
  const [topicForm, setTopicForm] = useState({ title: '', titleBn: '', description: '', descriptionBn: '', marks: '', status: 'pending' as SyllabusTopic['status'], weekNo: '', startDate: '', endDate: '' })

  const classOptions = useMemo(() => getClassOptions(classes), [classes])

  const getSubjectName = useCallback((id: string) => {
    const s = subjects.find(s => s.id === id)
    return s ? (isBn ? s.nameBn : s.name) : id
  }, [subjects, isBn])

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openDetail = (s: SyllabusEntry) => {
    setSelectedSyllabus(s)
    setView('detail')
    setExpandedChapters(new Set(s.chapters.map(c => c.id)))
  }

  const openCreateModal = () => {
    setSyllabusForm({ classId: classOptions[0] || '', subjectId: '', sessionId: '2025-26' })
    setShowCreateModal(true)
  }

  const handleCreateSyllabus = () => {
    if (!syllabusForm.classId || !syllabusForm.subjectId) return
    const existing = syllabi.find(s => s.classId === syllabusForm.classId && s.subjectId === syllabusForm.subjectId)
    if (existing) {
      alert(isBn ? 'এই শ্রেণি ও বিষয়ের জন্য ইতিমধ্যে সিলেবাস আছে!' : 'Syllabus already exists for this class and subject!')
      return
    }
    const id = addSyllabus({ classId: syllabusForm.classId, subjectId: syllabusForm.subjectId, sessionId: syllabusForm.sessionId, chapters: [] })
    const created = useSyllabusStore.getState().syllabi.find(s => s.id === id)
    if (created) {
      setSelectedSyllabus(created)
      setView('detail')
    }
    setShowCreateModal(false)
  }

  const openAddChapter = () => {
    setEditChapter(null)
    setChapterForm({ title: '', titleBn: '', description: '', descriptionBn: '', order: String((selectedSyllabus?.chapters.length || 0) + 1) })
    setShowChapterModal(true)
  }

  const openEditChapter = (ch: SyllabusChapter) => {
    setEditChapter(ch)
    setChapterForm({ title: ch.title, titleBn: ch.titleBn, description: ch.description, descriptionBn: ch.descriptionBn, order: String(ch.order) })
    setShowChapterModal(true)
  }

  const handleSaveChapter = () => {
    if (!chapterForm.title || !selectedSyllabus) return
    if (editChapter) {
      updateChapter(selectedSyllabus.id, editChapter.id, { title: chapterForm.title, titleBn: chapterForm.titleBn || chapterForm.title, description: chapterForm.description, descriptionBn: chapterForm.descriptionBn || chapterForm.description, order: Number(chapterForm.order) || 1 })
    } else {
      addChapter(selectedSyllabus.id, { title: chapterForm.title, titleBn: chapterForm.titleBn || chapterForm.title, description: chapterForm.description, descriptionBn: chapterForm.descriptionBn || chapterForm.description, order: Number(chapterForm.order) || 1 })
    }
    setShowChapterModal(false)
    const updated = useSyllabusStore.getState().syllabi.find(s => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleDeleteChapter = (chapterId: string) => {
    if (!selectedSyllabus) return
    if (!confirm(isBn ? 'অধ্যায় মুছে ফেলবেন?' : 'Delete chapter?')) return
    deleteChapter(selectedSyllabus.id, chapterId)
    const updated = useSyllabusStore.getState().syllabi.find(s => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const openAddTopic = (chapterId: string) => {
    setEditTopic(null)
    setActiveChapterId(chapterId)
    setTopicForm({ title: '', titleBn: '', description: '', descriptionBn: '', marks: '', status: 'pending', weekNo: '', startDate: '', endDate: '' })
    setShowTopicModal(true)
  }

  const openEditTopic = (chapterId: string, t: SyllabusTopic) => {
    setEditTopic(t)
    setActiveChapterId(chapterId)
    setTopicForm({ title: t.title, titleBn: t.titleBn, description: t.description, descriptionBn: t.descriptionBn, marks: String(t.marks), status: t.status, weekNo: String(t.weekNo || ''), startDate: t.startDate || '', endDate: t.endDate || '' })
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
    const updated = useSyllabusStore.getState().syllabi.find(s => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleDeleteTopic = (chapterId: string, topicId: string) => {
    if (!selectedSyllabus) return
    if (!confirm(isBn ? 'টপিক মুছে ফেলবেন?' : 'Delete topic?')) return
    deleteTopic(selectedSyllabus.id, chapterId, topicId)
    const updated = useSyllabusStore.getState().syllabi.find(s => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleStatusToggle = (chapterId: string, topicId: string, current: SyllabusTopic['status']) => {
    if (!selectedSyllabus) return
    const next: SyllabusTopic['status'] = current === 'pending' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'pending'
    updateTopicStatus(selectedSyllabus.id, chapterId, topicId, next)
    const updated = useSyllabusStore.getState().syllabi.find(s => s.id === selectedSyllabus.id)
    if (updated) setSelectedSyllabus(updated)
  }

  const handleDeleteSyllabus = (id: string) => {
    if (!confirm(isBn ? 'সিলেবাস মুছে ফেলবেন?' : 'Delete syllabus?')) return
    deleteSyllabus(id)
    if (selectedSyllabus?.id === id) {
      setSelectedSyllabus(null)
      setView('list')
    }
  }

  const handleDownloadPDF = (s?: SyllabusEntry) => {
    const target = s || selectedSyllabus
    if (!target) return
    generateSyllabusPDF({
      className: target.classId,
      subjectName: getSubjectName(target.subjectId),
      sessionId: target.sessionId,
      chapters: target.chapters.map(ch => ({
        title: ch.title, titleBn: ch.titleBn, description: ch.description, descriptionBn: ch.descriptionBn,
        topics: ch.topics.map(t => ({ title: t.title, titleBn: t.titleBn, description: t.description, descriptionBn: t.descriptionBn, marks: t.marks, status: t.status, weekNo: t.weekNo, startDate: t.startDate, endDate: t.endDate }))
      }))
    }, isBn)
  }

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle size={10} className="text-[var(--green)]" />
    if (s === 'in-progress') return <Clock size={10} className="text-[var(--amber)]" />
    return <AlertCircle size={10} className="text-[var(--text-muted)]" />
  }

  const statusColor = (s: string) => s === 'completed' ? 'bg-[var(--green-light)] text-[var(--green)]' : s === 'in-progress' ? 'bg-[var(--amber-light)] text-[var(--amber)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          {view === 'detail' && (
            <button onClick={() => { setView('list'); setSelectedSyllabus(null) }} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen size={18} className="text-[var(--brand)]" />
              {isBn ? 'পাঠ্যক্রম ব্যবস্থাপনা' : 'Syllabus Management'}
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              {view === 'detail' && selectedSyllabus
                ? `${selectedSyllabus.classId} — ${getSubjectName(selectedSyllabus.subjectId)}`
                : isBn ? 'শ্রেণি ও বিষয় অনুযায়ী পাঠ্যক্রম তৈরি ও পরিচালনা করুন' : 'Create and manage syllabus by class and subject'}
            </p>
          </div>
        </div>
        {view === 'list' ? (
          <button onClick={openCreateModal} className={btnPri}><Plus size={14} />{isBn ? 'নতুন সিলেবাস' : 'New Syllabus'}</button>
        ) : selectedSyllabus && (
          <button onClick={() => handleDownloadPDF()} className={btnPri}><Download size={14} />{isBn ? 'PDF ডাউনলোড' : 'Download PDF'}</button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === 'list' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: isBn ? 'মোট সিলেবাস' : 'Total Syllabi', value: syllabi.length, color: 'var(--brand)' },
                { label: isBn ? 'মোট অধ্যায়' : 'Total Chapters', value: syllabi.reduce((s, sy) => s + sy.totalChapters, 0), color: 'var(--green)' },
                { label: isBn ? 'মোট টপিক' : 'Total Topics', value: syllabi.reduce((s, sy) => s + sy.totalTopics, 0), color: 'var(--amber)' },
                { label: isBn ? 'সম্পন্ন' : 'Completed', value: syllabi.reduce((s, sy) => s + sy.completedTopics, 0), color: 'var(--purple)' },
              ].map((st, i) => (
                <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3">
                  <div className="text-[18px] font-bold" style={{ color: st.color }}>{st.value}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{st.label}</div>
                </div>
              ))}
            </div>

            {/* Syllabus Cards */}
            {syllabi.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'কোনো সিলেবাস নেই' : 'No syllabi yet'}</p>
                <button onClick={openCreateModal} className={`${btnPri} mt-3 mx-auto`}><Plus size={14} />{isBn ? 'প্রথম সিলেবাস তৈরি করুন' : 'Create First Syllabus'}</button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {syllabi.map(s => {
                  const totalTopics = s.totalTopics
                  const completed = s.completedTopics
                  const pct = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0
                  const totalMarks = s.chapters.reduce((sum, ch) => sum + ch.topics.reduce((ts, t) => ts + t.marks, 0), 0)
                  return (
                    <div key={s.id} className={`${sectionCls} cursor-pointer hover:shadow-md transition-all`} onClick={() => openDetail(s)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{s.classId}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] font-medium">{getSubjectName(s.subjectId)}</span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] mb-2">{isBn ? 'সেশন' : 'Session'}: {s.sessionId}</div>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                            <span>{s.totalChapters} {isBn ? 'অধ্যায়' : 'chapters'}</span>
                            <span>{totalTopics} {isBn ? 'টপিক' : 'topics'}</span>
                            <span>{totalMarks} {isBn ? 'মার্কস' : 'marks'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-[18px] font-bold" style={{ color: pct === 100 ? 'var(--green)' : pct > 0 ? 'var(--amber)' : 'var(--text-muted)' }}>{pct}%</div>
                          <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--brand)' }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(s) }} className="text-[9px] px-2 py-1 rounded-md bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] cursor-pointer font-medium hover:shadow-sm flex items-center gap-1">
                            <Download size={9} />{isBn ? 'PDF' : 'PDF'}
                          </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSyllabus(s.id) }} className="text-[9px] px-2 py-1 rounded-md bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)] cursor-pointer font-medium hover:shadow-sm">
                          {isBn ? 'মুছুন' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* DETAIL VIEW */
          selectedSyllabus && (
            <div className="grid gap-3">
              {/* Chapter Header */}
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[var(--text-muted)]">
                  {isBn ? `মোট ${selectedSyllabus.chapters.length}টি অধ্যায়` : `${selectedSyllabus.chapters.length} chapters`}
                </div>
                <button onClick={openAddChapter} className={btnPri}><Plus size={14} />{isBn ? 'অধ্যায় যোগ' : 'Add Chapter'}</button>
              </div>

              {/* Chapters */}
              {selectedSyllabus.chapters.length === 0 ? (
                <div className="text-center py-12">
                  <Layers size={36} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
                  <p className="text-[12px] text-[var(--text-muted)]">{isBn ? 'কোনো অধ্যায় নেই' : 'No chapters yet'}</p>
                  <button onClick={openAddChapter} className={`${btnPri} mt-3 mx-auto`}><Plus size={14} />{isBn ? 'প্রথম অধ্যায় যোগ' : 'Add First Chapter'}</button>
                </div>
              ) : (
                selectedSyllabus.chapters.sort((a, b) => a.order - b.order).map(ch => {
                  const isExpanded = expandedChapters.has(ch.id)
                  const chTotal = ch.topics.reduce((s, t) => s + t.marks, 0)
                  const chDone = ch.topics.filter(t => t.status === 'completed').length
                  return (
                    <div key={ch.id} className={sectionCls}>
                      {/* Chapter Header */}
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleChapter(ch.id)}>
                        <button className="text-[var(--text-muted)]">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <span className="text-[9px] font-bold text-white bg-[var(--brand)] rounded-md px-1.5 py-0.5">{ch.order}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold text-[var(--text-primary)]">{isBn ? ch.titleBn : ch.title}</div>
                          <div className="text-[9px] text-[var(--text-muted)] truncate">{isBn ? ch.descriptionBn : ch.description}</div>
                        </div>
                        <span className="text-[9px] text-[var(--text-muted)]">{chDone}/{ch.topics.length} {isBn ? 'টপিক' : 'topics'}</span>
                        <span className="text-[9px] font-semibold text-[var(--brand)]">{chTotal} {isBn ? 'মা.' : 'mk'}</span>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditChapter(ch)} className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]">
                            <Edit2 size={10} />
                          </button>
                          <button onClick={() => handleDeleteChapter(ch.id)} className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Topics */}
                      {isExpanded && (
                        <div className="mt-3 ml-6">
                          {ch.topics.length === 0 ? (
                            <div className="text-center py-6 text-[10px] text-[var(--text-muted)] italic">
                              {isBn ? 'এই অধ্যায়ে কোনো টপিক নেই' : 'No topics in this chapter'}
                            </div>
                          ) : (
                            <div className="divide-y divide-[var(--border)]">
                              {ch.topics.map(t => (
                                <div key={t.id} className="flex items-center gap-2 py-2 group">
                                  <button onClick={() => handleStatusToggle(ch.id, t.id, t.status)} className="cursor-pointer bg-transparent border-none p-0 flex items-center" title={isBn ? 'অবস্থা পরিবর্তন' : 'Toggle status'}>
                                    {statusIcon(t.status)}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-medium text-[var(--text-primary)]">{isBn ? t.titleBn : t.title}</div>
                                    <div className="text-[9px] text-[var(--text-muted)]">{isBn ? t.descriptionBn : t.description}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {t.weekNo && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">{isBn ? 'সপ্তাহ' : 'Wk'} {t.weekNo}</span>}
                                      {t.startDate && <span className="text-[8px] text-[var(--text-muted)]">{t.startDate}{t.endDate ? ` – ${t.endDate}` : ''}</span>}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-semibold text-[var(--brand)] whitespace-nowrap">{t.marks} {isBn ? 'মা.' : 'mk'}</span>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>
                                    {t.status === 'completed' ? (isBn ? 'সম্পন্ন' : 'Done') : t.status === 'in-progress' ? (isBn ? 'চলমান' : 'Running') : (isBn ? 'বাকি' : 'Pending')}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditTopic(ch.id, t)} className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]">
                                      <Edit2 size={8} />
                                    </button>
                                    <button onClick={() => handleDeleteTopic(ch.id, t.id)} className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                                      <Trash2 size={8} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={() => openAddTopic(ch.id)} className="mt-2 flex items-center gap-1 text-[9px] px-2 py-1 rounded-md bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)] cursor-pointer font-medium hover:shadow-sm">
                            <Plus size={9} />{isBn ? 'টপিক যোগ' : 'Add Topic'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )
        )}
      </div>

      {/* ═══ Create Syllabus Modal ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-2xl p-5 w-full max-w-sm shadow-xl border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold text-[var(--text-primary)]">{isBn ? 'নতুন সিলেবাস' : 'New Syllabus'}</span>
              <button onClick={() => setShowCreateModal(false)} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                <select value={syllabusForm.classId} onChange={e => setSyllabusForm(p => ({ ...p, classId: e.target.value }))} className={`${selectCls} w-full`}>
                  <option value="">{isBn ? '-- শ্রেণি নির্বাচন --' : '-- Select Class --'}</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                <select value={syllabusForm.subjectId} onChange={e => setSyllabusForm(p => ({ ...p, subjectId: e.target.value }))} className={`${selectCls} w-full`}>
                  <option value="">{isBn ? '-- বিষয় নির্বাচন --' : '-- Select Subject --'}</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেশন' : 'Session'}</label>
                <input value={syllabusForm.sessionId} onChange={e => setSyllabusForm(p => ({ ...p, sessionId: e.target.value }))} className={`${inputCls} w-full`} placeholder="2025-26" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowCreateModal(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleCreateSyllabus} disabled={!syllabusForm.classId || !syllabusForm.subjectId} className={`${btnPri} disabled:opacity-40 disabled:cursor-not-allowed`}>{isBn ? 'তৈরি করুন' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Chapter Modal ═══ */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowChapterModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-2xl p-5 w-full max-w-md shadow-xl border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold text-[var(--text-primary)]">{editChapter ? (isBn ? 'অধ্যায় এডিট' : 'Edit Chapter') : (isBn ? 'নতুন অধ্যায়' : 'New Chapter')}</span>
              <button onClick={() => setShowChapterModal(false)} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (EN)' : 'Name (EN)'}</label>
                  <input value={chapterForm.title} onChange={e => setChapterForm(p => ({ ...p, title: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. Force & Motion" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (BN)' : 'Name (BN)'}</label>
                  <input value={chapterForm.titleBn} onChange={e => setChapterForm(p => ({ ...p, titleBn: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. বল ও গতি" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিবরণ (EN)' : 'Description (EN)'}</label>
                  <input value={chapterForm.description} onChange={e => setChapterForm(p => ({ ...p, description: e.target.value }))} className={`${inputCls} w-full`} placeholder="Brief description" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিবরণ (BN)' : 'Description (BN)'}</label>
                  <input value={chapterForm.descriptionBn} onChange={e => setChapterForm(p => ({ ...p, descriptionBn: e.target.value }))} className={`${inputCls} w-full`} placeholder="সংক্ষিপ্ত বিবরণ" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ক্রম' : 'Order'}</label>
                <input type="number" min="1" value={chapterForm.order} onChange={e => setChapterForm(p => ({ ...p, order: e.target.value }))} className={`${inputCls} w-20`} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowChapterModal(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleSaveChapter} disabled={!chapterForm.title} className={`${btnPri} disabled:opacity-40 disabled:cursor-not-allowed`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Topic Modal ═══ */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowTopicModal(false)}>
          <div className="bg-[var(--bg-primary)] rounded-2xl p-5 w-full max-w-lg shadow-xl border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold text-[var(--text-primary)]">{editTopic ? (isBn ? 'টপিক এডিট' : 'Edit Topic') : (isBn ? 'নতুন টপিক' : 'New Topic')}</span>
              <button onClick={() => setShowTopicModal(false)} className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (EN)' : 'Name (EN)'}</label>
                  <input value={topicForm.title} onChange={e => setTopicForm(p => ({ ...p, title: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. Newton's Laws" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'নাম (BN)' : 'Name (BN)'}</label>
                  <input value={topicForm.titleBn} onChange={e => setTopicForm(p => ({ ...p, titleBn: e.target.value }))} className={`${inputCls} w-full`} placeholder="e.g. নিউটনের সূত্র" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিবরণ (EN)' : 'Description (EN)'}</label>
                  <input value={topicForm.description} onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))} className={`${inputCls} w-full`} placeholder="Brief description" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিবরণ (BN)' : 'Description (BN)'}</label>
                  <input value={topicForm.descriptionBn} onChange={e => setTopicForm(p => ({ ...p, descriptionBn: e.target.value }))} className={`${inputCls} w-full`} placeholder="সংক্ষিপ্ত বিবরণ" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'মার্কস' : 'Marks'}</label>
                  <input type="number" min="0" value={topicForm.marks} onChange={e => setTopicForm(p => ({ ...p, marks: e.target.value }))} className={`${inputCls} w-full`} placeholder="10" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সপ্তাহ' : 'Week No'}</label>
                  <input type="number" min="1" value={topicForm.weekNo} onChange={e => setTopicForm(p => ({ ...p, weekNo: e.target.value }))} className={`${inputCls} w-full`} placeholder="1" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'অবস্থা' : 'Status'}</label>
                  <select value={topicForm.status} onChange={e => setTopicForm(p => ({ ...p, status: e.target.value as SyllabusTopic['status'] }))} className={`${selectCls} w-full`}>
                    <option value="pending">{isBn ? 'বাকি' : 'Pending'}</option>
                    <option value="in-progress">{isBn ? 'চলমান' : 'In Progress'}</option>
                    <option value="completed">{isBn ? 'সম্পন্ন' : 'Completed'}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start Date'}</label>
                  <input type="date" value={topicForm.startDate} onChange={e => setTopicForm(p => ({ ...p, startDate: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End Date'}</label>
                  <input type="date" value={topicForm.endDate} onChange={e => setTopicForm(p => ({ ...p, endDate: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowTopicModal(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleSaveTopic} disabled={!topicForm.title} className={`${btnPri} disabled:opacity-40 disabled:cursor-not-allowed`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
