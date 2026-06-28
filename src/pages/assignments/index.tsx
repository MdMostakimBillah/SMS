import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Eye,
  BookOpen,
  FileText,
  X,
} from 'lucide-react'
import gsap from 'gsap'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAssignmentStore } from '@/store/assignmentStore'
import type { Assignment, AssignmentStatus } from '@/store/assignmentStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { useScrollLock } from '@/hooks/useScrollLock'

const inputCls =
  'w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'
const selectCls = inputCls + ' cursor-pointer'
const btnPri =
  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all'
const btnSec =
  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:shadow-sm transition-all'

function toBnNum(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bn[+d])
}

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']

interface AssignmentForm {
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  subjectId: string
  classId: string
  sectionId: string
  teacherId: string
  dueDate: string
  maxMarks: string
  status: AssignmentStatus
}

const emptyForm: AssignmentForm = {
  title: '',
  titleBn: '',
  description: '',
  descriptionBn: '',
  subjectId: '',
  classId: '',
  sectionId: '',
  teacherId: '',
  dueDate: '',
  maxMarks: '',
  status: 'active',
}

function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton variant="title" width="14rem" height="1.25rem" />
      <Skeleton variant="text" width="9rem" />
      <Skeleton variant="rect" width="100%" height="20rem" />
    </div>
  )
}

export default function AssignmentPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { isMobile } = useWindowSize()
  const classes = useClassStore((s) => s.classes)
  const teachers = useTeacherStore((s) => s.teachers)
  const subjects = useTeacherStore((s) => s.subjects)
  const assignments = useAssignmentStore((s) => s.assignments)
  const submissions = useAssignmentStore((s) => s.submissions)
  const addAssignment = useAssignmentStore((s) => s.addAssignment)
  const updateAssignment = useAssignmentStore((s) => s.updateAssignment)
  const deleteAssignment = useAssignmentStore((s) => s.deleteAssignment)

  const [isLoading, setIsLoading] = useState(true)
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Assignment | null>(null)
  const [form, setForm] = useState<AssignmentForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)
  const [detailItem, setDetailItem] = useState<Assignment | null>(null)
  const [showTypeSelect, setShowTypeSelect] = useState(false)
  const [showHwForm, setShowHwForm] = useState(false)
  const [hwForm, setHwForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    dueDate: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [hwErrors, setHwErrors] = useState<Record<string, string>>({})
  const [teacherQuery, setTeacherQuery] = useState('')
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState(false)
  const [teacherSelected, setTeacherSelected] = useState(false)

  useScrollLock(showForm || !!detailItem || !!deleteTarget || showTypeSelect || showHwForm)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const els = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' })
  }, [isLoading])

  const getClassName = useCallback(
    (classId: string) => classes.find((c) => c.id === classId)?.name || classId,
    [classes]
  )
  const getSubjectName = useCallback(
    (subjectId: string) => {
      const s = subjects.find((s) => s.id === subjectId)
      return s ? (isBn ? s.nameBn : s.name) : subjectId
    },
    [subjects, isBn]
  )
  const getTeacherName = useCallback(
    (teacherId: string) => {
      const t = teachers.find((t) => t.id === teacherId)
      return t ? (isBn ? t.nameBn : t.nameEn) : teacherId
    },
    [teachers, isBn]
  )

  // Calendar logic
  const today = new Date().toISOString().split('T')[0]
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1)
    const last = new Date(calYear, calMonth + 1, 0)
    const startPad = first.getDay()
    const days: { date: string; day: number; inMonth: boolean }[] = []
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(calYear, calMonth, -i)
      days.push({ date: d.toISOString().split('T')[0], day: d.getDate(), inMonth: false })
    }
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(calYear, calMonth, i)
      days.push({ date: d.toISOString().split('T')[0], day: i, inMonth: true })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calYear, calMonth + 1, i)
      days.push({ date: d.toISOString().split('T')[0], day: i, inMonth: false })
    }
    return days
  }, [calMonth, calYear])

  const assignmentsOnDate = useMemo(
    () => assignments.filter((a) => a.dueDate === selectedDate),
    [assignments, selectedDate]
  )

  const assignmentsWithDots = useMemo(() => {
    const map = new Map<string, number>()
    assignments.forEach((a) => map.set(a.dueDate, (map.get(a.dueDate) || 0) + 1))
    return map
  }, [assignments])

  // Form cascading selects
  const selectedClass = useMemo(() => classes.find((c) => c.id === form.classId), [classes, form.classId])
  const availableSections = useMemo(() => selectedClass?.sections || [], [selectedClass])
  const selectedSection = useMemo(() => availableSections.find((s) => s.id === form.sectionId), [availableSections, form.sectionId])

  // HW form cascading
  const hwSelectedClass = useMemo(() => classes.find((c) => c.id === hwForm.classId), [classes, hwForm.classId])
  const hwAvailableSections = useMemo(() => hwSelectedClass?.sections || [], [hwSelectedClass])
  const hwSelectedSection = useMemo(() => hwAvailableSections.find((s) => s.id === hwForm.sectionId), [hwAvailableSections, hwForm.sectionId])
  const hwAvailableSubjects = useMemo(() => {
    if (hwSelectedSection?.subjectIds?.length) {
      return subjects.filter((s) => hwSelectedSection.subjectIds!.includes(s.id))
    }
    if (hwSelectedClass?.subjectIds?.length) {
      return subjects.filter((s) => hwSelectedClass.subjectIds!.includes(s.id))
    }
    return subjects
  }, [hwSelectedSection, hwSelectedClass, subjects])
  const availableSubjects = useMemo(() => {
    const ids = selectedSection?.subjectIds?.length ? selectedSection.subjectIds : selectedClass?.subjectIds || []
    return subjects.filter((s) => ids.includes(s.id))
  }, [selectedSection, selectedClass, subjects])

  const openCreate = (date?: string) => {
    setEditItem(null)
    setForm({ ...emptyForm, dueDate: date || today })
    setFormErrors({})
    setTeacherQuery('')
    setTeacherSelected(false)
    setShowForm(true)
  }

  const openEdit = (item: Assignment) => {
    setEditItem(item)
    setForm({
      title: item.title,
      titleBn: item.titleBn,
      description: item.description,
      descriptionBn: item.descriptionBn,
      subjectId: item.subjectId,
      classId: item.classId,
      sectionId: item.sectionId,
      teacherId: item.teacherId,
      dueDate: item.dueDate,
      maxMarks: String(item.maxMarks),
      status: item.status,
    })
    setFormErrors({})
    setTeacherQuery('')
    setTeacherSelected(!!item.teacherId)
    setShowForm(true)
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.classId) errors.classId = isBn ? 'শ্রেণি নির্বাচন করুন' : 'Select a class'
    if (!form.sectionId) errors.sectionId = isBn ? 'শাখা নির্বাচন করুন' : 'Select a section'
    if (!form.subjectId) errors.subjectId = isBn ? 'বিষয় নির্বাচন করুন' : 'Select a subject'
    if (!form.teacherId) errors.teacherId = isBn ? 'শিক্ষক নির্বাচন করুন' : 'Select a teacher'
    if (!form.title.trim() && !form.titleBn.trim()) errors.title = isBn ? 'একটি শিরোনাম আবশ্যক' : 'At least one title is required'
    if (!form.dueDate) errors.dueDate = isBn ? 'তারিখ আবশ্যক' : 'Date is required'
    if (!form.maxMarks || +form.maxMarks <= 0) errors.maxMarks = isBn ? 'নম্বর দিন' : 'Enter marks'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const data = {
      title: form.title,
      titleBn: form.titleBn,
      description: form.description,
      descriptionBn: '',
      subjectId: form.subjectId,
      classId: form.classId,
      sectionId: form.sectionId,
      teacherId: form.teacherId,
      dueDate: form.dueDate,
      maxMarks: +form.maxMarks,
      status: form.status,
      attachments: editItem?.attachments || [],
    }
    if (editItem) {
      updateAssignment(editItem.id, data)
    } else {
      addAssignment(data)
    }
    setShowForm(false)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      deleteAssignment(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const statusColor = (s: AssignmentStatus) => {
    if (s === 'active') return 'var(--green)'
    if (s === 'draft') return 'var(--amber)'
    return 'var(--text-muted)'
  }

  if (isLoading) return <PageSkeleton />

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div className="gsap-fade-up" style={{ marginBottom: isMobile ? '12px' : '1rem' }}>
        <div className="flex items-center gap-[0.625rem] mb-1 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit]"
          >
            <ArrowLeft size={14} />
            {isBn ? 'ফিরে যান' : 'Back'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
              {isBn ? 'অ্যাসাইনমেন্ট' : 'Assignments'}
            </h1>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.125rem]">
              {isBn ? 'তারিখ ক্লিক করে অ্যাসাইনমেন্ট তৈরি করুন' : 'Click a date to create assignment'}
            </p>
          </div>
          <button
            onClick={() => setShowTypeSelect(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Assignments List + Calendar Side by Side */}
      <div className="gsap-fade-up" style={{ display: 'flex', gap: isMobile ? '12px' : '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Day assignments list */}
        <div style={{ flex: isMobile ? 'none' : '1 1 65%', minWidth: 0, order: isMobile ? 2 : 0 }}>
          {assignmentsOnDate.length === 0 ? (
            <div className="glass flex flex-col items-center justify-center" style={{ borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {isBn ? 'এই তারিখে কোনো অ্যাসাইনমেন্ট নেই' : 'No assignments on this date'}
              </div>
              <button onClick={() => openCreate(selectedDate)} className={btnPri}>
                <Plus size={14} />
                {isBn ? 'অ্যাসাইনমেন্ট তৈরি করুন' : 'Create Assignment'}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {assignmentsOnDate.map((item) => {
                const subs = submissions.filter((s) => s.assignmentId === item.id)
                return (
                  <div
                    key={item.id}
                    className="glass"
                    style={{
                      borderRadius: '0.625rem',
                      padding: isMobile ? '10px' : '0.75rem',
                      borderLeft: `3px solid ${statusColor(item.status)}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => setDetailItem(item)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? '0.8125rem' : '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {isBn ? item.titleBn : item.title}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1"><BookOpen size={10} />{getSubjectName(item.subjectId)}</span>
                          <span>•</span>
                          <span>{getClassName(item.classId)}-{item.sectionId}</span>
                          <span>•</span>
                          <span>{isBn ? `${toBnNum(item.maxMarks)} নম্বর` : `${item.maxMarks} marks`}</span>
                          {subs.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{isBn ? `${toBnNum(subs.length)} জমা` : `${subs.length} submitted`}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setDetailItem(item)} className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer">
                          <Eye size={13} style={{ color: 'var(--text-muted)' }} />
                        </button>
                        <button onClick={() => openEdit(item)} className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer">
                          <Edit2 size={13} style={{ color: 'var(--text-muted)' }} />
                        </button>
                        <button onClick={() => setDeleteTarget(item)} className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer">
                          <Trash2 size={13} style={{ color: 'var(--red)' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Calendar — compact on right */}
        <div className="glass" style={{ borderRadius: '0.875rem', padding: isMobile ? '10px' : '0.75rem', flex: isMobile ? 'none' : '0 0 16rem', minWidth: 0, order: isMobile ? 1 : 0 }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
                else setCalMonth((m) => m - 1)
              }}
              className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer"
            >
              <ChevronLeft size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? `${MONTHS_BN[calMonth]} ${toBnNum(calYear)}` : `${MONTHS_EN[calMonth]} ${calYear}`}
            </span>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
                else setCalMonth((m) => m + 1)
              }}
              className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer"
            >
              <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {(isBn ? DAYS_BN : DAYS_EN).map((d) => (
              <div key={d} style={{ fontSize: '0.5625rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((d) => {
              const isToday = d.date === today
              const isSelected = d.date === selectedDate
              const dotCount = assignmentsWithDots.get(d.date) || 0
              return (
                <button
                  key={d.date}
                  onClick={() => {
                    setSelectedDate(d.date)
                  }}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 0',
                    borderRadius: '0.375rem',
                    border: isSelected ? '1.5px solid var(--brand)' : isToday ? '1.5px solid var(--brand)' : '1.5px solid transparent',
                    background: isSelected ? 'var(--brand-light)' : isToday ? 'var(--brand-light)' : 'transparent',
                    opacity: d.inMonth ? 1 : 0.3,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontSize: '0.6875rem',
                    fontWeight: isToday || isSelected ? 700 : 400,
                    color: isToday || isSelected ? 'var(--brand)' : 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {isBn ? toBnNum(d.day) : String(d.day)}
                  {dotCount > 0 && (
                    <div className="flex gap-px mt-px">
                      {Array.from({ length: Math.min(dotCount, 3) }).map((_, i) => (
                        <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--brand)' }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Today button */}
          <div className="flex justify-center mt-2">
            <button
              onClick={() => {
                const now = new Date()
                setCalMonth(now.getMonth())
                setCalYear(now.getFullYear())
                setSelectedDate(now.toISOString().split('T')[0])
              }}
              style={{
                fontSize: '0.625rem',
                fontWeight: 500,
                color: 'var(--brand)',
                background: 'var(--brand-light)',
                border: 'none',
                borderRadius: '9999px',
                padding: '2px 10px',
                cursor: 'pointer',
              }}
            >
              {isBn ? 'আজ' : 'Today'}
            </button>
          </div>
        </div>
      </div>

      {/* Type Select Popup */}
      {showTypeSelect &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowTypeSelect(false)}>
            <div
              className="modal-content modal-box"
              style={{ maxWidth: '18rem', padding: '1rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textAlign: 'center' }}>
                {isBn ? 'ধরন নির্বাচন করুন' : 'Select Type'}
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => { setShowTypeSelect(false); setShowHwForm(true) }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)] transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--amber-light)]">
                    <BookOpen size={18} style={{ color: 'var(--amber)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {isBn ? 'গৃহকাজ' : 'Home Work'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                      {isBn ? 'বাড়ির কাজ তৈরি করুন' : 'Create homework'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => { setShowTypeSelect(false); openCreate() }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)] transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--brand-light)]">
                    <FileText size={18} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {isBn ? 'অ্যাসাইনমেন্ট' : 'Assignment'}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                      {isBn ? 'অ্যাসাইনমেন্ট তৈরি করুন' : 'Create assignment'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Home Work Form Modal */}
      {showHwForm &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowHwForm(false)}>
            <div
              className="modal-content modal-box"
              style={{ maxWidth: isMobile ? '95vw' : '36rem', maxHeight: '85vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'গৃহকাজ তৈরি করুন' : 'Create Home Work'}
                </h3>
                <button onClick={() => setShowHwForm(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer">
                  <X size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শ্রেণি' : 'Class'} *</label>
                    <select value={hwForm.classId} onChange={(e) => setHwForm({ ...hwForm, classId: e.target.value, sectionId: '', subjectId: '' })} className={selectCls} style={{ padding: '0.625rem 0.75rem', borderColor: hwErrors.classId ? 'var(--red)' : undefined }}>
                      <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শাখা' : 'Section'} *</label>
                    <select value={hwForm.sectionId} onChange={(e) => setHwForm({ ...hwForm, sectionId: e.target.value, subjectId: '' })} className={selectCls} style={{ padding: '0.625rem 0.75rem', borderColor: hwErrors.sectionId ? 'var(--red)' : undefined }}>
                      <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                      {hwAvailableSections.map((sec) => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'বিষয়' : 'Subject'} *</label>
                    <select value={hwForm.subjectId} onChange={(e) => setHwForm({ ...hwForm, subjectId: e.target.value })} className={selectCls} style={{ padding: '0.625rem 0.75rem', borderColor: hwErrors.subjectId ? 'var(--red)' : undefined }}>
                      <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                      {hwAvailableSubjects.map((s) => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'তারিখ' : 'Date'} *</label>
                  <input type="date" value={hwForm.dueDate} onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })} className={inputCls} style={{ padding: '0.625rem 0.75rem' }} />
                </div>

                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'গৃহকাজের বিবরণ' : 'Homework Description'} *</label>
                  <textarea
                    value={hwForm.description}
                    onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                    className={inputCls}
                    rows={4}
                    style={{ resize: 'vertical', padding: '0.625rem 0.75rem', borderColor: hwErrors.description ? 'var(--red)' : undefined }}
                    placeholder={isBn ? 'গৃহকাজের বিস্তারিত লিখুন...' : 'Write homework details...'}
                  />
                  {hwErrors.description && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{hwErrors.description}</div>}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowHwForm(false)} className="flex-1 py-2 px-3 rounded-xl text-[0.8125rem] font-medium border border-[var(--border)] bg-transparent text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    const errors: Record<string, string> = {}
                    if (!hwForm.classId) errors.classId = isBn ? 'শ্রেণি আবশ্যক' : 'Required'
                    if (!hwForm.sectionId) errors.sectionId = isBn ? 'শাখা আবশ্যক' : 'Required'
                    if (!hwForm.subjectId) errors.subjectId = isBn ? 'বিষয় আবশ্যক' : 'Required'
                    if (!hwForm.description.trim()) errors.description = isBn ? 'বিবরণ আবশ্যক' : 'Required'
                    setHwErrors(errors)
                    if (Object.keys(errors).length > 0) return

                    const cls = classes.find((c) => c.id === hwForm.classId)
                    const sub = subjects.find((s) => s.id === hwForm.subjectId)
                    const titleBn = `${cls?.nameBn || ''} ${sub?.nameBn || ''} - গৃহকাজ`
                    const titleEn = `${cls?.name || ''} ${sub?.name || ''} - Homework`
                    addAssignment({
                      title: titleEn,
                      titleBn,
                      description: hwForm.description,
                      descriptionBn: '',
                      subjectId: hwForm.subjectId,
                      classId: hwForm.classId,
                      sectionId: hwForm.sectionId,
                      teacherId: teachers[0]?.id || '',
                      dueDate: hwForm.dueDate,
                      maxMarks: 0,
                      status: 'active',
                      attachments: [],
                    })
                    setHwForm({ classId: '', sectionId: '', subjectId: '', dueDate: new Date().toISOString().split('T')[0], description: '' })
                    setHwErrors({})
                    setShowHwForm(false)
                  }}
                  className="flex-1 py-2 px-3 rounded-xl text-[0.8125rem] font-medium border-none bg-[var(--brand)] text-white cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {isBn ? 'তৈরি করুন' : 'Create'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Create/Edit Modal */}
      {showForm &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div
              className="modal-content modal-box"
              style={{ maxWidth: isMobile ? '95vw' : '36rem', maxHeight: '85vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                  {editItem ? (isBn ? 'সম্পাদনা' : 'Edit') : (isBn ? 'নতুন অ্যাসাইনমেন্ট' : 'New Assignment')}
                </h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer">
                  <X size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* Class + Section + Subject */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শ্রেণি' : 'Class'} *</label>
                    <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: '', subjectId: '' })} className={selectCls} style={{ padding: '0.625rem 0.75rem', borderColor: formErrors.classId ? 'var(--red)' : undefined }}>
                      <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.name}</option>)}
                    </select>
                    {formErrors.classId && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.classId}</div>}
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শাখা' : 'Section'} *</label>
                    <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value, subjectId: '' })} className={selectCls} style={{ padding: '0.625rem 0.75rem', borderColor: formErrors.sectionId ? 'var(--red)' : undefined }}>
                      <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                      {availableSections.map((sec) => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                    </select>
                    {formErrors.sectionId && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.sectionId}</div>}
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'বিষয়' : 'Subject'} *</label>
                    <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className={selectCls} style={{ padding: '0.625rem 0.75rem', borderColor: formErrors.subjectId ? 'var(--red)' : undefined }}>
                      <option value="">{isBn ? 'নির্বাচন' : 'Select'}</option>
                      {availableSubjects.map((s) => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
                    </select>
                    {formErrors.subjectId && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.subjectId}</div>}
                  </div>
                </div>

                {/* Teacher */}
                <div className="relative">
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শিক্ষক' : 'Teacher'} *</label>
                  <input
                    type="text"
                    value={teacherSelected ? (isBn ? teachers.find((t) => t.id === form.teacherId)?.nameBn : teachers.find((t) => t.id === form.teacherId)?.nameEn) || '' : teacherQuery}
                    onChange={(e) => {
                      setTeacherQuery(e.target.value)
                      setTeacherSelected(false)
                      setShowTeacherSuggestions(true)
                      if (!e.target.value) setForm({ ...form, teacherId: '' })
                    }}
                    onFocus={() => { if (!teacherSelected) setShowTeacherSuggestions(true) }}
                    onBlur={() => setTimeout(() => setShowTeacherSuggestions(false), 200)}
                    className={inputCls}
                    style={{ padding: '0.625rem 0.75rem', borderColor: formErrors.teacherId ? 'var(--red)' : undefined }}
                    placeholder={isBn ? 'শিক্ষকের নাম লিখুন...' : 'Type teacher name...'}
                  />
                  {showTeacherSuggestions && !teacherSelected && teacherQuery && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg max-h-40 overflow-auto">
                      {teachers
                        .filter((t) => {
                          const q = teacherQuery.toLowerCase()
                          return (t.nameEn?.toLowerCase().includes(q) || t.nameBn?.includes(q) || t.id.toLowerCase().includes(q))
                        })
                        .slice(0, 8)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="px-3 py-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                            style={{ fontSize: '0.8125rem' }}
                            onMouseDown={() => {
                              setForm({ ...form, teacherId: t.id })
                              setTeacherQuery('')
                              setTeacherSelected(true)
                              setShowTeacherSuggestions(false)
                            }}
                          >
                            <div className="font-medium text-[var(--text-primary)]">{isBn ? t.nameBn : t.nameEn}</div>
                            {t.nameEn && t.nameBn && isBn && <div className="text-[0.6875rem] text-[var(--text-muted)]">{t.nameEn}</div>}
                          </div>
                        ))}
                      {teachers.filter((t) => {
                        const q = teacherQuery.toLowerCase()
                        return (t.nameEn?.toLowerCase().includes(q) || t.nameBn?.includes(q) || t.id.toLowerCase().includes(q))
                      }).length === 0 && (
                        <div className="px-3 py-2 text-[0.75rem] text-[var(--text-muted)]">{isBn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No teachers found'}</div>
                      )}
                    </div>
                  )}
                  {formErrors.teacherId && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.teacherId}</div>}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শিরোনাম (ইং)' : 'Title (En)'}</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} style={{ padding: '0.625rem 0.75rem' }} placeholder={isBn ? 'ইংরেজি শিরোনাম' : 'English title'} />
                </div>
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'শিরোনাম (বাং)' : 'Title (Bn)'}</label>
                  <input type="text" value={form.titleBn} onChange={(e) => setForm({ ...form, titleBn: e.target.value })} className={inputCls} style={{ padding: '0.625rem 0.75rem' }} placeholder={isBn ? 'বাংলা শিরোনাম' : 'Bengali title'} />
                  {formErrors.title && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.title}</div>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'বিবরণ' : 'Description'}</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={2} style={{ resize: 'vertical', padding: '0.625rem 0.75rem' }} placeholder={isBn ? 'অ্যাসাইনমেন্টের বিবরণ' : 'Assignment details'} />
                </div>

                {/* Date + Marks */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'তারিখ' : 'Date'} *</label>
                    <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} style={{ padding: '0.625rem 0.75rem', borderColor: formErrors.dueDate ? 'var(--red)' : undefined }} />
                    {formErrors.dueDate && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.dueDate}</div>}
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'নম্বর' : 'Marks'} *</label>
                    <input type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} className={inputCls} style={{ padding: '0.625rem 0.75rem', borderColor: formErrors.maxMarks ? 'var(--red)' : undefined }} min={1} placeholder="100" />
                    {formErrors.maxMarks && <div className="text-[0.625rem] text-[var(--red)] mt-0.5">{formErrors.maxMarks}</div>}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1">{isBn ? 'অবস্থা' : 'Status'}</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AssignmentStatus })} className={selectCls} style={{ padding: '0.625rem 0.75rem' }}>
                    <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
                    <option value="draft">{isBn ? 'খসড়া' : 'Draft'}</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                <button onClick={() => setShowForm(false)} className={btnSec}>{isBn ? 'বাতিল' : 'Cancel'}</button>
                <button onClick={handleSave} className={btnPri}>{editItem ? (isBn ? 'আপডেট' : 'Update') : (isBn ? 'তৈরি করুন' : 'Create')}</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Detail Modal */}
      {detailItem &&
        createPortal(
          <div className="modal-overlay" onClick={() => setDetailItem(null)}>
            <div
              className="modal-content modal-box"
              style={{ maxWidth: isMobile ? '95vw' : '36rem', maxHeight: '85vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{isBn ? detailItem.titleBn : detailItem.title}</h3>
                <button onClick={() => setDetailItem(null)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer">
                  <X size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { l: isBn ? 'বিষয়' : 'Subject', v: getSubjectName(detailItem.subjectId) },
                  { l: isBn ? 'শ্রেণি' : 'Class', v: `${getClassName(detailItem.classId)}-${detailItem.sectionId}` },
                  { l: isBn ? 'শিক্ষক' : 'Teacher', v: getTeacherName(detailItem.teacherId) },
                  { l: isBn ? 'তারিখ' : 'Date', v: detailItem.dueDate },
                  { l: isBn ? 'নম্বর' : 'Marks', v: isBn ? toBnNum(detailItem.maxMarks) : String(detailItem.maxMarks) },
                ].map((row) => (
                  <div key={row.l} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.l}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{row.v}</span>
                  </div>
                ))}
                {detailItem.description && (
                  <div className="pt-1">
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>{isBn ? 'বিবরণ' : 'Description'}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{detailItem.description}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                <button onClick={() => { setDetailItem(null); openEdit(detailItem) }} className={btnSec}><Edit2 size={12} />{isBn ? 'সম্পাদনা' : 'Edit'}</button>
                <button onClick={() => setDetailItem(null)} className={btnPri}>{isBn ? 'বন্ধ' : 'Close'}</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={isBn ? 'মুছে ফেলুন?' : 'Delete?'}
          message={isBn ? `"${deleteTarget.titleBn}" মুছে ফেলা হবে।` : `"${deleteTarget.title}" will be deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isBn={isBn}
        />
      )}
    </div>
  )
}
