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
  ChevronsDown,
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
import { usePermission } from '@/hooks/usePermission'
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
  bulkAddRoutines?: (routines: any[]) => void
  deleteRoutine: (id: string) => void
}

interface RoutineRow {
  id: string
  classId: string
  sectionId: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  roomNo: string
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
  bulkAddRoutines,
  deleteRoutine,
}: Props) {
  const { canCreate, canRead, canDelete } = usePermission()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [showRoutineForm, setShowRoutineForm] = useState(false)

  // Single-row batch table state for routines
  const [routineRows, setRoutineRows] = useState<RoutineRow[]>([
    {
      id: 'rt-1',
      classId: '',
      sectionId: '',
      subjectId: '',
      date: '',
      startTime: '10:00',
      endTime: '13:00',
      roomNo: '',
    },
  ])
  const [routineFormError, setRoutineFormError] = useState('')

  const [showExamRoutinePDF, setShowExamRoutinePDF] = useState(false)
  const [showExamRoutineActionMenu, setShowExamRoutineActionMenu] = useState(false)
  const examRoutineActionMenuRef = useRef<HTMLDivElement>(null)

  const getSubjectsForRow = useCallback(
    (classId: string, sectionId?: string) => {
      const allSubjects = useTeacherStore.getState().subjects
      if (!classId) return allSubjects
      const classObj = classes.find((c) => c.name === classId)
      if (!classObj) return allSubjects

      let classSubjects: typeof allSubjects = []
      if (sectionId) {
        const section = classObj.sections.find((s: any) => s.name === sectionId)
        if (section?.subjectIds && section.subjectIds.length > 0) {
          classSubjects = allSubjects.filter((s) => section.subjectIds!.includes(s.id))
        }
      }
      if (classSubjects.length === 0 && classObj.subjectIds?.length > 0) {
        classSubjects = allSubjects.filter((s) => classObj.subjectIds.includes(s.id))
      }
      if (classSubjects.length === 0) classSubjects = allSubjects
      return classSubjects
    },
    [classes]
  )

  const handleOpenNewRoutineModal = (initialDate?: string) => {
    const defaultDate = initialDate || (selectedExam?.startDate ? selectedExam.startDate.split('T')[0] : '')
    const defaultClass = classOptions[0] || ''
    const secs = defaultClass ? sectionsMap[defaultClass] || [] : []
    const defaultSection = secs[0] || 'A'
    const defaultRoom = rooms[0]?.roomNo || 'R-101'

    setRoutineRows([
      {
        id: `rt-${Date.now()}-1`,
        classId: defaultClass,
        sectionId: defaultSection,
        subjectId: '',
        date: defaultDate,
        startTime: '10:00',
        endTime: '13:00',
        roomNo: defaultRoom,
      },
    ])
    setRoutineFormError('')
    setShowRoutineForm(true)
  }

  const handleAddRoutineRow = () => {
    setRoutineRows((prev) => {
      const last = prev[prev.length - 1]
      const defaultClass = last?.classId || classOptions[0] || ''
      const secs = defaultClass ? sectionsMap[defaultClass] || [] : []
      return [
        ...prev,
        {
          id: `rt-${Date.now()}-${prev.length + 1}`,
          classId: defaultClass,
          sectionId: last?.sectionId || secs[0] || 'A',
          subjectId: '',
          date: last?.date || (selectedExam?.startDate ? selectedExam.startDate.split('T')[0] : ''),
          startTime: last?.startTime || '10:00',
          endTime: last?.endTime || '13:00',
          roomNo: last?.roomNo || rooms[0]?.roomNo || 'R-101',
        },
      ]
    })
    setRoutineFormError('')
  }

  const handleRemoveRoutineRow = (index: number) => {
    if (routineRows.length <= 1) return
    setRoutineRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateRoutineRow = (index: number, field: keyof RoutineRow, value: string) => {
    setRoutineRows((prev) => {
      const next = [...prev]
      const updated = { ...next[index], [field]: value }

      if (field === 'classId') {
        const secs = sectionsMap[value] || []
        updated.sectionId = secs[0] || 'A'
        updated.subjectId = ''

        const count = students.filter(
          (s) => s.status === 'approved' && s.active !== false && s.class === value
        ).length
        const rm = rooms.find((r) => r.isActive && r.capacity >= count)
        if (rm) updated.roomNo = rm.roomNo
      }

      next[index] = updated
      return next
    })
    setRoutineFormError('')
  }

  const applyRoutineColumnToAll = (
    field: 'classId' | 'sectionId' | 'date' | 'startTime' | 'endTime' | 'roomNo' | 'subjectId',
    fromIndex = 0
  ) => {
    const sourceValue = routineRows[fromIndex]?.[field]
    if (sourceValue === undefined) return

    setRoutineRows((prev) =>
      prev.map((r, i) => {
        if (i === fromIndex) return r
        const updated = { ...r, [field]: sourceValue }
        if (field === 'classId') {
          const secs = sectionsMap[sourceValue] || []
          updated.sectionId = secs[0] || 'A'
          updated.subjectId = ''
        }
        return updated
      })
    )
  }

  const handleSaveRoutines = useCallback(() => {
    if (!selectedExamId) return
    const validRows = routineRows.filter((r) => r.classId && r.subjectId && r.date)
    if (validRows.length === 0) {
      setRoutineFormError(
        isBn
          ? 'অনুগ্রহ করে অন্তত একটি রুটিনের শ্রেণি, বিষয় ও তারিখ পূরণ করুন'
          : 'Please select Class, Subject, and Date for at least one routine'
      )
      return
    }

    const routinesToSave = validRows.map((r) => ({
      examId: selectedExamId,
      classId: r.classId,
      sectionId: r.sectionId || 'A',
      subjectId: r.subjectId,
      date: r.date,
      startTime: r.startTime || '10:00',
      endTime: r.endTime || '13:00',
      roomNo: r.roomNo || (rooms.length > 0 ? rooms[0].roomNo : 'R-101'),
      status: getAutoStatus(r.date),
    }))

    if (bulkAddRoutines) {
      bulkAddRoutines(routinesToSave)
    } else {
      routinesToSave.forEach((r) => addRoutine(r))
    }

    setShowRoutineForm(false)
    setRoutineFormError('')
  }, [selectedExamId, routineRows, bulkAddRoutines, addRoutine, rooms, isBn])

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
        <div className="flex items-center gap-2">
          {canCreate('exams.create.create') && (
            <button
              onClick={() => handleOpenNewRoutineModal()}
              className={btnPrimary}
            >
              <Plus size={14} />
              {isBn ? 'নতুন রুটিন' : 'New Routine'}
            </button>
          )}
          {filteredRoutines.length > 0 && canRead('exams.read.view') && (
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
                {canCreate('exams.create.create') && (
                  <button
                    onClick={() => handleOpenNewRoutineModal(format(selectedDate!, 'yyyy-MM-dd'))}
                    className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium cursor-pointer border-none"
                  >
                    <Plus size={12} />
                    {isBn ? 'যোগ করুন' : 'Add'}
                  </button>
                )}
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
                        {canDelete('exams.delete.delete') && (
                          <button
                            onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoutine(routine.id) }}
                            className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
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

      {showRoutineForm &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-xs p-3"
            onClick={() => setShowRoutineForm(false)}
          >
            <div
              className="bg-[var(--bg-primary)] rounded-2xl w-[78rem] max-w-[96vw] max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0">
                      {isBn ? 'নতুন পরীক্ষার রুটিন তৈরি করুন' : 'Add Exam Routines'}
                    </h3>
                    <p className="text-[0.6875rem] text-[var(--text-muted)] m-0">
                      {isBn
                        ? 'প্রতিটি সারিতে শ্রেণি, সেকশন, বিষয়, তারিখ, সময় ও কক্ষ নির্ধারণ করুন। নিচে নতুন সারি যোগ এবং কলামের তীর চিহ্নে ক্লিক করে তথ্য প্রয়োগ করা যাবে।'
                        : 'Define class, section, subject, date, time & room in a single row. Add rows at the bottom and click column arrow icons to copy values down.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Body with Single Row Input Fields */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {routineFormError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)] text-[0.75rem] font-medium">
                    {routineFormError}
                  </div>
                )}

                <div className="overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
                  <table className="w-full text-left border-collapse text-[0.75rem]">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/70 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[9.5rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[var(--text-primary)]">
                              {isBn ? 'শ্রেণি' : 'Class'} <span className="text-[var(--red)]">*</span>
                            </span>
                            {routineRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyRoutineColumnToAll('classId', 0)}
                                title={isBn ? '১ম সারির শ্রেণি সব সারিতে প্রয়োগ করুন' : 'Apply 1st row class to all'}
                                className="p-1 rounded-md text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/30"
                              >
                                <ChevronsDown size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[7.5rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{isBn ? 'সেকশন' : 'Section'}</span>
                            {routineRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyRoutineColumnToAll('sectionId', 0)}
                                title={isBn ? '১ম সারির সেকশন সব সারিতে প্রয়োগ করুন' : 'Apply 1st row section to all'}
                                className="p-1 rounded-md text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/30"
                              >
                                <ChevronsDown size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[12rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[var(--text-primary)]">
                              {isBn ? 'বিষয়' : 'Subject'} <span className="text-[var(--red)]">*</span>
                            </span>
                            {routineRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyRoutineColumnToAll('subjectId', 0)}
                                title={isBn ? '১ম সারির বিষয় সব সারিতে প্রয়োগ করুন' : 'Apply 1st row subject to all'}
                                className="p-1 rounded-md text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/30"
                              >
                                <ChevronsDown size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[9.5rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[var(--text-primary)]">
                              {isBn ? 'তারিখ' : 'Date'} <span className="text-[var(--red)]">*</span>
                            </span>
                            {routineRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyRoutineColumnToAll('date', 0)}
                                title={isBn ? '১ম সারির তারিখ সব সারিতে প্রয়োগ করুন' : 'Apply 1st row date to all'}
                                className="p-1 rounded-md text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/30"
                              >
                                <ChevronsDown size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[8rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{isBn ? 'শুরু' : 'Start'}</span>
                            {routineRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyRoutineColumnToAll('startTime', 0)}
                                title={isBn ? '১ম সারির শুরুর সময় সব সারিতে প্রয়োগ করুন' : 'Apply 1st row start time to all'}
                                className="p-1 rounded-md text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/30"
                              >
                                <ChevronsDown size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[8rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{isBn ? 'শেষ' : 'End'}</span>
                            {routineRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyRoutineColumnToAll('endTime', 0)}
                                title={isBn ? '১ম সারির শেষ সময় সব সারিতে প্রয়োগ করুন' : 'Apply 1st row end time to all'}
                                className="p-1 rounded-md text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/30"
                              >
                                <ChevronsDown size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 min-w-[10rem]">
                          <div className="flex items-center justify-between gap-1.5">
                            <span>{isBn ? 'কক্ষ' : 'Room'}</span>
                            {routineRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => applyRoutineColumnToAll('roomNo', 0)}
                                title={isBn ? '১ম সারির কক্ষ সব সারিতে প্রয়োগ করুন' : 'Apply 1st row room to all'}
                                className="p-1 rounded-md text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer border border-[var(--brand)]/30"
                              >
                                <ChevronsDown size={13} />
                              </button>
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 w-16 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {routineRows.map((row, idx) => {
                        const rowSections = sectionsMap[row.classId] || []
                        const rowSubjects = getSubjectsForRow(row.classId, row.sectionId)
                        const count = students.filter(
                          (s) =>
                            s.status === 'approved' &&
                            s.active !== false &&
                            s.class === row.classId &&
                            (!row.sectionId || s.section === row.sectionId)
                        ).length

                        return (
                          <tr key={row.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                            <td className="py-2 px-3 text-center text-[var(--text-muted)] font-mono text-[0.6875rem]">
                              {idx + 1}
                            </td>
                            {/* Class */}
                            <td className="py-2 px-3">
                              <select
                                value={row.classId}
                                onChange={(e) => handleUpdateRoutineRow(idx, 'classId', e.target.value)}
                                className={`${selectCls} w-full font-semibold`}
                              >
                                <option value="">{isBn ? 'শ্রেণি...' : 'Select Class...'}</option>
                                {classOptions.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* Section */}
                            <td className="py-2 px-3">
                              <select
                                value={row.sectionId}
                                onChange={(e) => handleUpdateRoutineRow(idx, 'sectionId', e.target.value)}
                                className={`${selectCls} w-full`}
                                disabled={!row.classId}
                              >
                                <option value="">{isBn ? 'সব' : 'All'}</option>
                                {rowSections.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* Subject */}
                            <td className="py-2 px-3">
                              <select
                                value={row.subjectId}
                                onChange={(e) => handleUpdateRoutineRow(idx, 'subjectId', e.target.value)}
                                className={`${selectCls} w-full font-medium`}
                                disabled={!row.classId}
                              >
                                <option value="">{isBn ? 'বিষয় নির্বাচন...' : 'Select Subject...'}</option>
                                {rowSubjects.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {isBn ? s.nameBn : s.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {/* Date */}
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) => handleUpdateRoutineRow(idx, 'date', e.target.value)}
                                min={selectedExam?.startDate ? selectedExam.startDate.split('T')[0] : ''}
                                max={selectedExam?.endDate ? selectedExam.endDate.split('T')[0] : ''}
                                className={`${inputCls} w-full`}
                              />
                            </td>
                            {/* Start Time */}
                            <td className="py-2 px-3">
                              <input
                                type="time"
                                value={row.startTime}
                                onChange={(e) => handleUpdateRoutineRow(idx, 'startTime', e.target.value)}
                                className={`${inputCls} w-full`}
                              />
                            </td>
                            {/* End Time */}
                            <td className="py-2 px-3">
                              <input
                                type="time"
                                value={row.endTime}
                                onChange={(e) => handleUpdateRoutineRow(idx, 'endTime', e.target.value)}
                                className={`${inputCls} w-full`}
                              />
                            </td>
                            {/* Room */}
                            <td className="py-2 px-3">
                              <div className="flex flex-col gap-0.5">
                                <select
                                  value={row.roomNo}
                                  onChange={(e) => handleUpdateRoutineRow(idx, 'roomNo', e.target.value)}
                                  className={`${selectCls} w-full`}
                                >
                                  <option value="">{isBn ? 'কক্ষ...' : 'Select Room...'}</option>
                                  {rooms.map((r) => (
                                    <option key={r.id} value={r.roomNo}>
                                      {r.roomNo} ({r.capacity})
                                    </option>
                                  ))}
                                </select>
                                {row.classId && count > 0 && (
                                  <span className="text-[0.625rem] text-[var(--text-muted)] truncate">
                                    {isBn ? `শিক্ষার্থী: ${count} জন` : `Students: ${count}`}
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Action */}
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  disabled={routineRows.length <= 1}
                                  onClick={() => handleRemoveRoutineRow(idx)}
                                  title={isBn ? 'সারি মুছুন' : 'Remove Row'}
                                  className={`p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] transition-colors ${
                                    routineRows.length <= 1
                                      ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
                                      : 'text-[var(--text-muted)] hover:text-[var(--red)] hover:border-[var(--red)] cursor-pointer'
                                  }`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add Row Button under table */}
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddRoutineRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[var(--brand)] text-[var(--brand)] bg-[var(--brand)]/5 hover:bg-[var(--brand)]/10 text-[0.75rem] font-medium cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    {isBn ? '+ আরেকটি রুটিনের সারি যোগ করুন' : '+ Add Another Routine Row'}
                  </button>

                  <span className="text-[0.6875rem] text-[var(--text-muted)]">
                    {isBn ? `মোট ${routineRows.length}টি সারি` : `Total: ${routineRows.length} row(s)`}
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <button
                  type="button"
                  onClick={() => setShowRoutineForm(false)}
                  className="px-4 py-2 rounded-xl text-[0.75rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors cursor-pointer border-none bg-transparent"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoutines}
                  className={`${btnPrimary} text-[0.75rem] px-5 py-2 rounded-xl font-semibold shadow-xs`}
                >
                  {isBn
                    ? `সংরক্ষণ করুন (${routineRows.filter((r) => r.classId && r.subjectId && r.date).length || routineRows.length})`
                    : `Save Routines (${routineRows.filter((r) => r.classId && r.subjectId && r.date).length || routineRows.length})`}
                </button>
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
