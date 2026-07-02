import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  X,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MoreVertical,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { sectionCls, sectionTitleCls, inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { openPrintWindow } from '@/lib/pdf'
import { XLSX } from '@/lib/excelExport'
import { generateExamRoutineGridPDF } from '../pdfTemplates/examRoutinePdfTemplate'
import type { ExamRoutineGridData, ExamRoutineGridCell, ExamRoutinePDFOptions } from '../pdfTemplates/examRoutinePdfTemplate'
import { ExamRoutinePDFOptionsModal } from '@/components/shared/ExamRoutinePDFOptionsModal'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { statusStyles, WEEKDAYS_EN, WEEKDAYS_BN } from './types'
import type { ExamRoutine } from '@/store/examStore'

function getAutoStatus(dateStr: string): 'completed' | 'in-progress' | 'upcoming' {
  const examDate = startOfDay(parseISO(dateStr))
  const today = startOfDay(new Date())
  if (isBefore(examDate, today)) return 'completed'
  if (isSameDay(examDate, today)) return 'in-progress'
  return 'upcoming'
}

interface Props {
  isBn: boolean
  selectedExamId: string
  selectedExam: any
  filteredRoutines: ExamRoutine[]
  subjectMap: Map<string, any>
  roomMap: Map<string, any>
  rooms: any[]
  students: any[]
  classes: any[]
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  calendarRange: { start: Date; end: Date } | null
  examDayCount: number
  completedDays: number
  upcomingDays: number
  currentMonth: Date
  setCurrentMonth: (d: Date) => void
  addRoutine: (r: any) => void
  deleteRoutine: (id: string) => void
}

export default React.memo(function RoutineTab({
  isBn,
  selectedExamId,
  selectedExam,
  filteredRoutines,
  subjectMap,
  rooms,
  students,
  classes,
  classOptions,
  sectionsMap,
  calendarRange,
  examDayCount,
  completedDays,
  upcomingDays,
  currentMonth,
  setCurrentMonth,
  addRoutine,
  deleteRoutine,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [showRoutineForm, setShowRoutineForm] = useState(false)
  const [routineForm, setRoutineForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    date: '',
    startTime: '',
    endTime: '',
    roomNo: '',
  })
  const [showExamRoutinePDF, setShowExamRoutinePDF] = useState(false)
  const [showExamRoutineActionMenu, setShowExamRoutineActionMenu] = useState(false)
  const examRoutineActionMenuRef = useRef<HTMLDivElement>(null)

  const routineStudentCount = useMemo(() => {
    if (!routineForm.classId) return 0
    return students.filter(
      (s) => s.status === 'approved' && s.active !== false && s.class === routineForm.classId && (!routineForm.sectionId || s.section === routineForm.sectionId)
    ).length
  }, [students, routineForm.classId, routineForm.sectionId])

  const suggestedRoom = useMemo(() => {
    if (routineStudentCount === 0) return null
    return rooms.find((r) => r.isActive && r.capacity >= routineStudentCount) || null
  }, [rooms, routineStudentCount])

  const roomUsage = useMemo(() => {
    if (!routineForm.date) return {}
    const usage: Record<string, number> = {}
    const dayRoutines = filteredRoutines.filter((r) => r.date === routineForm.date)
    for (const r of dayRoutines) {
      usage[r.roomNo] = (usage[r.roomNo] || 0) + 1
    }
    return usage
  }, [filteredRoutines, routineForm.date])

  const routineFormSections = useMemo(
    () => (routineForm.classId ? sectionsMap[routineForm.classId] || [] : []),
    [routineForm.classId, sectionsMap]
  )

  const routineFormSubjects = useMemo(() => {
    if (!routineForm.classId) return useTeacherStore.getState().subjects
    const classObj = classes.find((c) => c.name === routineForm.classId)
    if (!classObj) return useTeacherStore.getState().subjects
    const allSubjects = useTeacherStore.getState().subjects

    let classSubjects: typeof allSubjects = []
    if (routineForm.sectionId) {
      const section = classObj.sections.find((s: any) => s.name === routineForm.sectionId)
      if (section?.subjectIds && section.subjectIds.length > 0) {
        classSubjects = allSubjects.filter((s) => section.subjectIds!.includes(s.id))
      }
    }
    if (classSubjects.length === 0 && classObj.subjectIds?.length > 0) {
      classSubjects = allSubjects.filter((s) => classObj.subjectIds.includes(s.id))
    }
    if (classSubjects.length === 0) classSubjects = allSubjects

    const scheduledSubjectIds = new Set(
      filteredRoutines
        .filter((r) => r.classId === routineForm.classId && r.sectionId === (routineForm.sectionId || 'A'))
        .map((r) => r.subjectId)
    )
    return classSubjects.filter((s) => !scheduledSubjectIds.has(s.id))
  }, [classes, routineForm.classId, routineForm.sectionId, routineForm.date, filteredRoutines])

  const handleSaveRoutine = useCallback(() => {
    if (!selectedExamId || !routineForm.classId || !routineForm.subjectId || !routineForm.date) return
    addRoutine({
      examId: selectedExamId,
      classId: routineForm.classId,
      sectionId: routineForm.sectionId || 'A',
      subjectId: routineForm.subjectId,
      date: routineForm.date,
      startTime: routineForm.startTime || '09:00',
      endTime: routineForm.endTime || '12:00',
      roomNo: routineForm.roomNo || 'R-101',
      status: getAutoStatus(routineForm.date),
    })
    setShowRoutineForm(false)
    setRoutineForm({ classId: '', sectionId: '', subjectId: '', date: '', startTime: '', endTime: '', roomNo: '' })
  }, [selectedExamId, routineForm, addRoutine])

  const calendarDays = useMemo(() => {
    if (!calendarRange) {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: calStart, end: calEnd })
    }
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const rangeStart = calendarRange.start < monthStart ? monthStart : calendarRange.start
    const rangeEnd = calendarRange.end > monthEnd ? monthEnd : calendarRange.end
    if (rangeStart > rangeEnd) return []
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  }, [currentMonth, calendarRange])

  const routinesByDate = useMemo(() => {
    const map = new Map<string, ExamRoutine[]>()
    for (const r of filteredRoutines) {
      const existing = map.get(r.date) || []
      existing.push(r)
      map.set(r.date, existing)
    }
    return map
  }, [filteredRoutines])

  const getRoutinesForDay = useCallback(
    (day: Date) => {
      const key = format(day, 'yyyy-MM-dd')
      return routinesByDate.get(key) || []
    },
    [routinesByDate]
  )

  const selectedDayRoutines = useMemo(() => {
    if (!selectedDate) return []
    return getRoutinesForDay(selectedDate)
  }, [selectedDate, getRoutinesForDay])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examRoutineActionMenuRef.current && !examRoutineActionMenuRef.current.contains(event.target as Node)) {
        setShowExamRoutineActionMenu(false)
      }
    }
    if (showExamRoutineActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExamRoutineActionMenu])

  const examRoutineGridData: ExamRoutineGridData = useMemo(() => {
    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''
    const examDateRange = selectedExam ? `${selectedExam.startDate} — ${selectedExam.endDate}` : ''

    const byDate = new Map<string, ExamRoutine[]>()
    for (const r of filteredRoutines) {
      const existing = byDate.get(r.date) || []
      existing.push(r)
      byDate.set(r.date, existing)
    }
    const sortedDates = [...byDate.keys()].sort()

    const dates = sortedDates.map((date) => {
      const weekday = new Date(date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'short' })
      return { date, weekday }
    })

    const classNames = [...new Set(filteredRoutines.map((r) => r.classId))].sort()

    const grid: Record<string, Record<string, ExamRoutineGridCell[]>> = {}
    for (const date of sortedDates) {
      grid[date] = {}
      const dayRoutines = byDate.get(date) || []
      for (const cls of classNames) {
        const cellRoutines = dayRoutines.filter((r) => r.classId === cls)
        grid[date][cls] = cellRoutines.map((r) => {
          const subject = subjectMap.get(r.subjectId)
          const subjName = isBn ? subject?.nameBn : subject?.name || ''
          return {
            subject: subjName || '',
            section: `Sec ${r.sectionId}`,
            time: `${r.startTime}–${r.endTime}`,
            room: r.roomNo,
          }
        })
      }
    }

    return { dates, classNames, grid, examName, examDateRange }
  }, [filteredRoutines, selectedExam, isBn, subjectMap])

  const handleExamRoutinePDF = useCallback(
    (opts: ExamRoutinePDFOptions) => {
      const html = generateExamRoutineGridPDF(examRoutineGridData, { ...opts, institutionName: useClassStore.getState().institution.name })
      openPrintWindow(opts.title || examRoutineGridData.examName || 'Exam Routine', html)
      setShowExamRoutinePDF(false)
    },
    [examRoutineGridData]
  )

  const handleExamRoutineExcel = useCallback(() => {
    const { dates, classNames, grid, examName } = examRoutineGridData
    const rows = dates.map((d) => {
      const row: Record<string, string> = { Date: d.date, Day: d.weekday }
      for (const cls of classNames) {
        const cells = grid[d.date]?.[cls] || []
        row[cls] = cells.map((c) => `${c.subject} (${c.section}) ${c.time} ${c.room}`).join('\n')
      }
      return row
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.sheet_add_aoa(ws, [[examName], [examRoutineGridData.examDateRange], []], { origin: 'A1' })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Routine')
    XLSX.writeFile(wb, `${examName.replace(/\s+/g, '_')}_Routine_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [examRoutineGridData])

  return (
    <div className="flex flex-col h-full">
      {selectedExam && (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3 border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[var(--brand)]" />
            <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
              {format(parseISO(selectedExam.startDate), 'MMM d, yyyy')}
            </span>
            <span className="text-[0.625rem] text-[var(--text-muted)] mx-1">→</span>
            <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
              {format(parseISO(selectedExam.endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="h-3 w-px bg-[var(--border)]" />
          <div className="flex gap-3 text-[0.6875rem]">
            <span className="text-[var(--text-muted)]">
              {isBn ? 'মোট' : 'Total'}: <strong className="text-[var(--text-primary)]">{examDayCount}</strong> {isBn ? 'দিন' : 'days'}
            </span>
            <span className="text-[var(--text-muted)]">
              {isBn ? 'রুটিন' : 'Routines'}: <strong className="text-[var(--text-primary)]">{filteredRoutines.length}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-5 mb-4 flex-wrap">
        {[
          { icon: <Calendar size={14} />, value: examDayCount, label: isBn ? 'পরীক্ষার দিন' : 'Exam Days', color: 'var(--brand)' },
          { icon: <BookOpen size={14} />, value: filteredRoutines.length, label: isBn ? 'মোট রুটিন' : 'Total Routines', color: 'var(--teal)' },
          { icon: <CheckCircle size={14} />, value: completedDays, label: isBn ? 'সম্পন্ন' : 'Completed', color: 'var(--green)' },
          { icon: <Clock size={14} />, value: upcomingDays, label: isBn ? 'আসন্ন' : 'Upcoming', color: 'var(--amber)' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span style={{ color: s.color }}>{s.icon}</span>
            <span className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{s.value}</span>
            <span className="text-[0.6875rem] text-[var(--text-muted)]">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)] min-w-[10rem] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(new Date())
              setSelectedDate(new Date())
            }}
            className="ml-2 px-3 py-1.5 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] text-[0.6875rem] font-medium cursor-pointer border border-[var(--brand)] hover:shadow-sm"
          >
            {isBn ? 'আজ' : 'Today'}
          </button>
        </div>
        {filteredRoutines.length > 0 && (
          <div style={{ position: 'relative' }} ref={examRoutineActionMenuRef}>
            <button
              onClick={() => setShowExamRoutineActionMenu(!showExamRoutineActionMenu)}
              className={btnPrimary}
              style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)', color: 'var(--brand)' }}
            >
              <MoreVertical size={15} />
              {isBn ? 'অ্যাকশন' : 'Action'}
              <ChevronDown size={12} />
            </button>
            {showExamRoutineActionMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.375rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: '12.5rem',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => { handleExamRoutineExcel(); setShowExamRoutineActionMenu(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                  {isBn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                </button>
                <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
                <button
                  onClick={() => { setShowExamRoutinePDF(true); setShowExamRoutineActionMenu(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileText size={14} style={{ color: 'var(--red)' }} />
                  {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`${sectionCls} !mb-0 flex-1 flex flex-col`}>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((day) => (
            <div key={day} className="text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {calendarDays.map((day, idx) => {
            const dayRoutines = getRoutinesForDay(day)
            const today = isToday(day)
            const selected = selectedDate && isSameDay(day, selectedDate)
            const hasRoutine = dayRoutines.length > 0
            const hasCompleted = dayRoutines.some((r) => getAutoStatus(r.date) === 'completed')
            const hasInProgress = dayRoutines.some((r) => getAutoStatus(r.date) === 'in-progress')
            const hasUpcoming = dayRoutines.some((r) => getAutoStatus(r.date) === 'upcoming')

            let borderStyle = ''
            if (hasCompleted) borderStyle = 'border-[var(--green)]'
            else if (hasInProgress) borderStyle = 'border-[var(--amber)]'
            else if (hasUpcoming) borderStyle = 'border-[var(--brand)]'

            return (
              <div
                key={idx}
                onClick={() => { setSelectedDate(day); setShowDayDetail(true) }}
                className={`
                  relative min-h-[4.5rem] p-1.5 rounded-xl border-2 cursor-pointer transition-all
                  ${today ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-md ring-1 ring-[var(--brand)]/30' : ''}
                  ${!today && !hasRoutine ? 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)] hover:shadow-sm' : ''}
                  ${!today && hasRoutine ? `${borderStyle} bg-[var(--bg-primary)] hover:shadow-md` : ''}
                  ${selected ? 'ring-2 ring-[var(--brand)] ring-offset-1' : ''}
                `}
              >
                {today && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-[0.0625rem] rounded-full bg-[var(--brand)] text-white text-[0.4375rem] font-bold uppercase tracking-wider">
                    {isBn ? 'আজ' : 'Today'}
                  </div>
                )}
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[0.6875rem] font-semibold ${today ? 'w-5 h-5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[0.625rem]' : 'text-[var(--text-primary)]'}`}>
                    {format(day, 'd')}
                  </span>
                  {hasRoutine && <span className="text-[0.5625rem] font-bold text-[var(--text-muted)]">{dayRoutines.length}</span>}
                </div>
                {hasRoutine && (
                  <div className="space-y-0.5">
                    {dayRoutines.slice(0, 3).map((r) => {
                      const st = statusStyles[getAutoStatus(r.date)]
                      const subject = subjectMap.get(r.subjectId)
                      return (
                        <div key={r.id} className="flex items-center gap-1 px-1 py-0.5 rounded-md text-[0.5rem] font-medium truncate" style={{ background: st.bg, color: st.color }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.dot }} />
                          <span className="truncate">{isBn ? subject?.nameBn : subject?.name}</span>
                          {r.classId && <span className="opacity-70 shrink-0">{r.classId}</span>}
                        </div>
                      )
                    })}
                    {dayRoutines.length > 3 && (
                      <div className="text-[0.5rem] text-[var(--text-muted)] text-center">
                        +{dayRoutines.length - 3} {isBn ? 'আরও' : 'more'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showDayDetail && selectedDate && (
        <div className="mt-3">
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-3">
              <div className={sectionTitleCls}>
                <Calendar size={15} className="text-[var(--brand)]" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRoutineForm({ classId: '', sectionId: '', subjectId: '', date: format(selectedDate!, 'yyyy-MM-dd'), startTime: '', endTime: '', roomNo: '' })
                    setShowRoutineForm(true)
                  }}
                  className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium cursor-pointer border-none"
                >
                  <Plus size={12} />
                  {isBn ? 'যোগ করুন' : 'Add'}
                </button>
                <button onClick={() => setShowDayDetail(false)} className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={14} />
                </button>
              </div>
            </div>
            {selectedDayRoutines.length > 0 ? (
              <div className="space-y-2">
                {selectedDayRoutines.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((routine) => {
                  const subject = subjectMap.get(routine.subjectId)
                  const st = statusStyles[getAutoStatus(routine.date)]
                  return (
                    <div key={routine.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:shadow-sm transition-all">
                      <div className="flex flex-col items-center shrink-0 w-12">
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{routine.startTime}</div>
                        <div className="w-px h-3 bg-[var(--border)]" />
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{routine.endTime}</div>
                      </div>
                      <div className="w-px h-10 rounded-full shrink-0" style={{ background: st.dot }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{isBn ? subject?.nameBn : subject?.name}</span>
                          <span className="text-[0.5625rem] py-[0.0625rem] px-[0.3125rem] rounded-[0.25rem] font-medium" style={{ background: st.bg, color: st.color }}>
                            {isBn ? st.labelBn : st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[0.625rem] text-[var(--text-muted)]">
                          <span className="flex items-center gap-1"><MapPin size={9} />{routine.roomNo}</span>
                          <span>{routine.classId} {routine.sectionId}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoutine(routine.id) }}
                          className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
                <Calendar size={24} className="mx-auto mb-2 opacity-30" />
                {isBn ? 'এই দিনে কোনো রুটিন নেই' : 'No routines on this day'}
              </div>
            )}
          </div>
        </div>
      )}

      {showRoutineForm && createPortal(
        <div className="modal-overlay" onClick={() => setShowRoutineForm(false)}>
          <div className="modal-box modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '26.25rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'নতুন রুটিন' : 'New Routine'}</h3>
              <button onClick={() => setShowRoutineForm(false)} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select
                    value={routineForm.classId}
                    onChange={(e) => {
                      const classId = e.target.value
                      const count = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === classId).length
                      const room = rooms.find((r) => r.isActive && r.capacity >= count)
                      setRoutineForm((p) => ({ ...p, classId, sectionId: '', subjectId: '', roomNo: room?.roomNo || '' }))
                    }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select
                    value={routineForm.sectionId}
                    onChange={(e) => {
                      const sectionId = e.target.value
                      const count = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === routineForm.classId && s.section === sectionId).length
                      const room = rooms.find((r) => r.isActive && r.capacity >= count)
                      setRoutineForm((p) => ({ ...p, sectionId, subjectId: '', roomNo: room?.roomNo || '' }))
                    }}
                    className={`${selectCls} w-full`}
                    disabled={!routineForm.classId}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {routineFormSections.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                <select
                  value={routineForm.subjectId}
                  onChange={(e) => setRoutineForm((p) => ({ ...p, subjectId: e.target.value }))}
                  className={`${selectCls} w-full`}
                  disabled={!routineForm.classId}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {routineFormSubjects.map((s) => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                <input type="date" value={routineForm.date} onChange={(e) => setRoutineForm((p) => ({ ...p, date: e.target.value }))} className={`${inputCls} w-full`} min={selectedExam?.startDate || ''} max={selectedExam?.endDate || ''} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start'}</label>
                  <input type="time" value={routineForm.startTime} onChange={(e) => setRoutineForm((p) => ({ ...p, startTime: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End'}</label>
                  <input type="time" value={routineForm.endTime} onChange={(e) => setRoutineForm((p) => ({ ...p, endTime: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                <select value={routineForm.roomNo} onChange={(e) => setRoutineForm((p) => ({ ...p, roomNo: e.target.value }))} className={`${selectCls} w-full`}>
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {rooms.map((r) => {
                    const used = roomUsage[r.roomNo] || 0
                    const pct = r.capacity > 0 ? Math.round((used / r.capacity) * 100) : 0
                    return <option key={r.id} value={r.roomNo}>{r.roomNo} ({r.capacity}) {used > 0 ? `- ${pct}% ${isBn ? 'ব্যবহৃত' : 'used'}` : ''}</option>
                  })}
                </select>
                {routineForm.classId && routineStudentCount > 0 && (
                  <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                    {isBn ? `শিক্ষার্থী: ${routineStudentCount} জন` : `Students: ${routineStudentCount}`}
                    {suggestedRoom && routineForm.roomNo !== suggestedRoom.roomNo && (
                      <span className="text-[var(--brand)] ml-1 cursor-pointer hover:underline" onClick={() => setRoutineForm((p) => ({ ...p, roomNo: suggestedRoom.roomNo }))}>
                        {isBn ? `(${suggestedRoom.roomNo} সাজেস্টেড)` : `(Suggest: ${suggestedRoom.roomNo})`}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowRoutineForm(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveRoutine} className={`${btnPrimary} text-[0.75rem]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showExamRoutinePDF && (
        <ExamRoutinePDFOptionsModal
          count={examRoutineGridData.dates.length}
          isBn={isBn}
          gridData={examRoutineGridData}
          onClose={() => setShowExamRoutinePDF(false)}
          onDownload={handleExamRoutinePDF}
        />
      )}
    </div>
  )
})
