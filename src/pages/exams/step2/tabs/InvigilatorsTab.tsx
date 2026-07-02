import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  X,
  UserCheck,
  GraduationCap,
  MoreVertical,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import {
  addMonths,
  format,
  parseISO,
} from 'date-fns'
import { sectionCls, inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { openPrintWindow } from '@/lib/pdf'
import { XLSX } from '@/lib/excelExport'
import { generateInvigilatorGuardListPDF } from '../pdfTemplates/invigilatorPdfTemplate'
import type { InvigilatorGridData, InvigilatorGridDay, InvigilatorGridRow, InvigilatorPDFOptions } from '../pdfTemplates/invigilatorPdfTemplate'
import { InvigilatorPDFOptionsModal } from '@/components/shared/InvigilatorPDFOptionsModal'
import { useClassStore } from '@/store/classStore'
import type { ExamRoutine, ExamRoom, InvigilatorAssignment } from '@/store/examStore'

interface Props {
  isBn: boolean
  selectedExamId: string
  selectedExam: any
  filteredRoutines: ExamRoutine[]
  filteredInvigilators: InvigilatorAssignment[]
  subjectMap: Map<string, any>
  teacherMap: Map<string, any>
  roomMap: Map<string, any>
  students: any[]
  rooms: ExamRoom[]
  teachers: any[]
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  calendarRange: { start: Date; end: Date } | null
  currentMonth: Date
  setCurrentMonth: (d: Date) => void
  addInvigilator: (inv: any) => void
  removeInvigilator: (id: string) => void
  examDayCount: number
}

export default React.memo(function InvigilatorsTab({
  isBn,
  selectedExamId,
  selectedExam,
  filteredRoutines,
  filteredInvigilators,
  subjectMap,
  teacherMap,
  roomMap,
  students,
  rooms,
  teachers,
  classOptions,
  sectionsMap,
  calendarRange,
  currentMonth,
  setCurrentMonth,
  addInvigilator,
  removeInvigilator,
  examDayCount,
}: Props) {
  const [invigAssignType, setInvigAssignType] = useState<'room' | 'class'>('room')
  const [showInvigForm, setShowInvigForm] = useState(false)
  const [invigForm, setInvigForm] = useState({ roomId: '', teacherId: '', date: '', shift: 'morning' as 'morning' | 'afternoon', classSection: '' })
  const [showInvigPDF, setShowInvigPDF] = useState(false)
  const [invigGuardType, setInvigGuardType] = useState<'class' | 'room'>('class')
  const [showInvigActionMenu, setShowInvigActionMenu] = useState(false)
  const invigActionMenuRef = useRef<HTMLDivElement>(null)

  // Click-outside handler for invigilator action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (invigActionMenuRef.current && !invigActionMenuRef.current.contains(event.target as Node)) {
        setShowInvigActionMenu(false)
      }
    }
    if (showInvigActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showInvigActionMenu])

  const handleSaveInvig = () => {
    if (!selectedExamId || !invigForm.teacherId || !invigForm.date) return
    if (invigAssignType === 'room' && !invigForm.roomId) return
    if (invigAssignType === 'class' && !invigForm.classSection) return

    addInvigilator({
      examId: selectedExamId,
      teacherId: invigForm.teacherId,
      date: invigForm.date,
      shift: invigForm.shift,
      assignType: invigAssignType,
      roomId: invigAssignType === 'room' ? invigForm.roomId : '',
      classSection: invigAssignType === 'class' ? invigForm.classSection : '',
    })
    setShowInvigForm(false)
    setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning', classSection: '' })
  }

  // Invigilator guard list grid data
  const invigilatorGridData: InvigilatorGridData = useMemo(() => {
    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''

    const filtered = filteredInvigilators.filter((inv) => inv.assignType === invigGuardType)

    const byDate = new Map<string, typeof filtered>()
    for (const inv of filtered) {
      const existing = byDate.get(inv.date) || []
      existing.push(inv)
      byDate.set(inv.date, existing)
    }
    const sortedDates = Array.from(byDate.keys()).sort()

    const days: InvigilatorGridDay[] = sortedDates.map((date) => {
      const dayAssignments = byDate.get(date) || []
      const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

      const rows: InvigilatorGridRow[] = dayAssignments.map((inv) => {
        const teacher = teacherMap.get(inv.teacherId)
        const shiftLabel = inv.shift === 'morning' ? (isBn ? 'সকাল' : 'Morning') : (isBn ? 'বিকাল' : 'Afternoon')

        if (invigGuardType === 'class') {
          const [cls, sec] = inv.classSection.split('-')
          const dayRoutine = filteredRoutines.find((r) => r.date === date && r.classId === cls && r.sectionId === sec)
          const subject = dayRoutine ? subjectMap.get(dayRoutine.subjectId) : null
          const studentCount = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === cls && s.section === sec).length
          return {
            classSection: inv.classSection,
            teacher: teacher?.nameEn || inv.teacherId,
            subject: subject ? (isBn ? subject.nameBn : subject.name) : '-',
            students: studentCount,
            shift: shiftLabel,
          }
        } else {
          const room = roomMap.get(inv.roomId)
          const dayRoutines = filteredRoutines.filter((r) => r.date === date && r.roomNo === room?.roomNo)
          const subjectNames = [...new Set(dayRoutines.map((r) => {
            const subj = subjectMap.get(r.subjectId)
            return subj ? (isBn ? subj.nameBn : subj.name) : ''
          }).filter(Boolean))]
          return {
            room: room?.roomNo || inv.roomId,
            teacher: teacher?.nameEn || inv.teacherId,
            subject: subjectNames.join(', ') || '-',
            capacity: room?.capacity,
            shift: shiftLabel,
          }
        }
      })

      return { date, dateFormatted, rows }
    })

    return { type: invigGuardType, examName, days }
  }, [filteredInvigilators, invigGuardType, selectedExam, isBn, teacherMap, subjectMap, roomMap, filteredRoutines, students])

  const handleInvigPDF = useCallback(
    (opts: InvigilatorPDFOptions) => {
      const html = generateInvigilatorGuardListPDF(invigilatorGridData, { ...opts, institutionName: useClassStore.getState().institution.name })
      openPrintWindow(opts.title || invigilatorGridData.examName || 'Guard List', html)
      setShowInvigPDF(false)
    },
    [invigilatorGridData]
  )

  const handleInvigExcel = useCallback(() => {
    const { type, examName, days } = invigilatorGridData
    const isClass = type === 'class'

    const rows = days.flatMap((day) =>
      day.rows.map((row) => {
        const base: Record<string, string> = { Date: day.date }
        if (isClass) {
          base['Class-Sec'] = row.classSection || ''
          base['Teacher'] = row.teacher
          base['Subject'] = row.subject
          base['Students'] = String(row.students ?? '')
        } else {
          base['Room'] = row.room || ''
          base['Teacher'] = row.teacher
          base['Subject'] = row.subject
          base['Capacity'] = String(row.capacity ?? '')
        }
        base['Shift'] = row.shift
        return base
      })
    )

    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.sheet_add_aoa(ws, [
      [examName],
      [isClass ? 'Class / Section Wise Guard List' : 'Room / Hall Wise Guard List'],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Guard List')
    const fileName = `${examName.replace(/\s+/g, '_')}_${isClass ? 'Class' : 'Room'}_Guard_List_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }, [invigilatorGridData])

  return (
    <>
      {/* Exam Date Range Banner */}
      {selectedExam && (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3 border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[var(--amber)]" />
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
              {isBn ? 'শিক্ষক' : 'Teachers'}: <strong className="text-[var(--text-primary)]">{filteredInvigilators.length}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      {(() => {
        const hasRoomAssign = filteredInvigilators.some((i) => i.assignType === 'room')
        const hasClassAssign = filteredInvigilators.some((i) => i.assignType === 'class')
        return (
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => !hasClassAssign && setInvigAssignType('room')}
                disabled={hasClassAssign}
                className={`px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium border transition-all ${
                  hasClassAssign ? 'opacity-40 cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]' :
                  invigAssignType === 'room'
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] cursor-pointer'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)] cursor-pointer'
                }`}
              >
                <MapPin size={12} className="inline mr-1" />
                {isBn ? 'কক্ষ/হল ভিত্তিক' : 'Room / Hall Wise'}
              </button>
              <button
                onClick={() => !hasRoomAssign && setInvigAssignType('class')}
                disabled={hasRoomAssign}
                className={`px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium border transition-all ${
                  hasRoomAssign ? 'opacity-40 cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]' :
                  invigAssignType === 'class'
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)] cursor-pointer'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)] cursor-pointer'
                }`}
              >
                <GraduationCap size={12} className="inline mr-1" />
                {isBn ? 'শ্রেণি/সেকশন ভিত্তিক' : 'Class / Section Wise'}
              </button>
              <div className="flex-1" />
              {filteredInvigilators.length > 0 && (
                <div style={{ position: 'relative' }} ref={invigActionMenuRef}>
                  <button
                    onClick={() => setShowInvigActionMenu(!showInvigActionMenu)}
                    className={btnPrimary}
                    style={{
                      background: 'var(--brand-light)',
                      border: '1px solid var(--brand)',
                      color: 'var(--brand)',
                    }}
                  >
                    <MoreVertical size={15} />
                    {isBn ? 'অ্যাকশন' : 'Action'}
                    <ChevronDown size={12} />
                  </button>
                  {showInvigActionMenu && (
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
                        minWidth: '14rem',
                        zIndex: 100,
                        overflow: 'hidden',
                      }}
                    >
                      {filteredInvigilators.some((i) => i.assignType === 'class') && (
                        <>
                          <button
                            onClick={() => { setInvigGuardType('class'); handleInvigExcel(); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                            {isBn ? 'শ্রেণি গার্ড তালিকা (এক্সেল)' : 'Class Guard List (Excel)'}
                          </button>
                          <button
                            onClick={() => { setInvigGuardType('class'); setShowInvigPDF(true); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileText size={14} style={{ color: 'var(--red)' }} />
                            {isBn ? 'শ্রেণি গার্ড তালিকা (পিডিএফ)' : 'Class Guard List (PDF)'}
                          </button>
                        </>
                      )}
                      {filteredInvigilators.some((i) => i.assignType === 'class') && filteredInvigilators.some((i) => i.assignType === 'room') && (
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
                      )}
                      {filteredInvigilators.some((i) => i.assignType === 'room') && (
                        <>
                          <button
                            onClick={() => { setInvigGuardType('room'); handleInvigExcel(); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                            {isBn ? 'কক্ষ গার্ড তালিকা (এক্সেল)' : 'Room Guard List (Excel)'}
                          </button>
                          <button
                            onClick={() => { setInvigGuardType('room'); setShowInvigPDF(true); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileText size={14} style={{ color: 'var(--red)' }} />
                            {isBn ? 'কক্ষ গার্ড তালিকা (পিডিএফ)' : 'Room Guard List (PDF)'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  setShowInvigForm(true)
                  setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning', classSection: '' })
                }}
                className={btnPrimary}
              >
                <Plus size={14} />
                {isBn ? 'নতুন নিয়োগ' : 'New Assignment'}
              </button>
            </div>
            {(hasRoomAssign || hasClassAssign) && (
              <div className="text-[0.5625rem] text-[var(--text-muted)] mt-1.5">
                {isBn
                  ? `একটি ধরনের নিয়োগ আছে — অন্য ধরনে পরিবর্তন করতে সকল ${hasRoomAssign ? 'কক্ষ/হল' : 'শ্রেণি/সেকশন'} নিয়োগ মুছুন`
                  : `One type is active — remove all ${hasRoomAssign ? 'room' : 'class'} assignments to switch`}
              </div>
            )}
          </div>
        )
      })()}

      {/* Info hint */}
      <div className="text-[0.625rem] text-[var(--text-muted)] mb-3">
        {invigAssignType === 'room'
          ? (isBn ? 'প্রতিটি কক্ষ/হলে কোন শিক্ষক পরিদর্শক হবে তা নির্ধারণ করুন' : 'Assign which teacher guards each room/hall')
          : (isBn ? 'প্রতিটি শ্রেণি/সেকশনে কোন শিক্ষক পরিদর্শক হবে তা নির্ধারণ করুন' : 'Assign which teacher guards each class/section')
        }
      </div>

      {/* Calendar Grid */}
      {calendarRange ? (
        <div className={`${sectionCls} overflow-x-auto`}>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              className="w-7 h-7 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-[var(--brand)]"
            >
              ‹
            </button>
            <span className="text-[0.75rem] font-semibold text-[var(--text-primary)] min-w-[10rem] text-center">
              {currentMonth.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-7 h-7 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-[var(--brand)]"
            >
              ›
            </button>
          </div>

          {/* Get exam days in current month */}
          {(() => {
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            const daysInMonth = new Date(year, month + 1, 0).getDate()
            const examDays: number[] = []
            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              if (dateStr >= calendarRange.start.toISOString().slice(0, 10) && dateStr <= calendarRange.end.toISOString().slice(0, 10)) {
                const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr)
                if (dayRoutines.length > 0) examDays.push(d)
              }
            }

            if (invigAssignType === 'room') {
              // Room-wise grid: rows = rooms, columns = exam days
              const activeRooms = rooms.filter((r) => r.isActive)
              return (
                <div className="min-w-[40rem]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[0.625rem] font-semibold text-[var(--text-muted)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10 min-w-[8rem]">
                          {isBn ? 'কক্ষ/হল' : 'Room / Hall'}
                        </th>
                        {examDays.map((d) => {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                          const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr)
                          const subjectNames = [...new Set(dayRoutines.map((r) => {
                            const subj = subjectMap.get(r.subjectId)
                            return subj ? (isBn ? subj.nameBn : subj.name) : ''
                          }).filter(Boolean))]
                          return (
                            <th key={d} className="text-center text-[0.5625rem] p-2 border-b border-l border-[var(--border)] min-w-[6rem]">
                              <div className="font-semibold text-[var(--text-primary)]">{d}</div>
                              <div className="text-[0.5rem] text-[var(--text-muted)] mt-0.5">
                                {subjectNames.slice(0, 2).join(', ')}{subjectNames.length > 2 ? '...' : ''}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {activeRooms.map((room) => (
                        <tr key={room.id}>
                          <td className="text-[0.6875rem] font-medium text-[var(--text-primary)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10">
                            <div>{room.roomNo}</div>
                            <div className="text-[0.5rem] text-[var(--text-muted)]">{room.roomName} · {room.capacity} {isBn ? 'সিট' : 'seats'}</div>
                          </td>
                          {examDays.map((d) => {
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                            const assignedList = filteredInvigilators.filter((inv) => inv.assignType === 'room' && inv.roomId === room.id && inv.date === dateStr)
                            const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr && r.roomNo === room.roomNo)
                            const hasExam = dayRoutines.length > 0
                            const studentCount = dayRoutines.reduce((sum, r) => {
                              return sum + students.filter((s) => s.status === 'approved' && s.active !== false && s.class === r.classId && s.section === r.sectionId).length
                            }, 0)
                            const subjectNames = [...new Set(dayRoutines.map((r) => {
                              const subj = subjectMap.get(r.subjectId)
                              return subj ? (isBn ? subj.nameBn : subj.name) : ''
                            }).filter(Boolean))]
                            return (
                              <td key={d} className="text-center p-1.5 border-b border-l border-[var(--border)]">
                                {!hasExam ? (
                                  <div className="w-full h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[0.5rem] text-[var(--text-muted)] opacity-30">
                                    —
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {assignedList.map((inv) => {
                                      const teacher = teacherMap.get(inv.teacherId)
                                      return (
                                        <div
                                          key={inv.id}
                                          className="rounded-lg p-1.5 bg-[var(--brand-light)] border border-[var(--brand)]/20 cursor-pointer hover:shadow-sm transition-all"
                                          onClick={() => {
                                            if (confirm(isBn ? 'এই নিয়োগ মুছে ফেলবেন?' : 'Remove this assignment?')) removeInvigilator(inv.id)
                                          }}
                                        >
                                          <div className="text-[0.5625rem] font-semibold text-[var(--brand)] truncate">{teacher?.nameEn || inv.teacherId}</div>
                                        </div>
                                      )
                                    })}
                                    {subjectNames.length > 0 && assignedList.length > 0 && (
                                      <div className="text-[0.5rem] text-[var(--text-muted)] truncate">
                                        {subjectNames.join(', ')}
                                      </div>
                                    )}
                                    {studentCount > 0 && assignedList.length > 0 && (
                                      <div className="text-[0.5rem] text-[var(--text-muted)]">{studentCount} {isBn ? 'জন ছাত্র' : 'students'}</div>
                                    )}
                                    <button
                                      onClick={() => {
                                        setInvigForm((p) => ({ ...p, date: dateStr }))
                                        setShowInvigForm(true)
                                      }}
                                      className="w-full h-7 rounded-lg border border-dashed border-[var(--border)] text-[0.5rem] text-[var(--text-muted)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            } else {
              // Class-wise grid: rows = class-sections, columns = exam days
              const classSections = classOptions.flatMap((c) =>
                (sectionsMap[c] || []).map((s) => ({ classId: c, sectionId: s, label: `${c}-${s}` }))
              )
              return (
                <div className="min-w-[40rem]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[0.625rem] font-semibold text-[var(--text-muted)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10 min-w-[8rem]">
                          {isBn ? 'শ্রেণি-সেকশন' : 'Class-Section'}
                        </th>
                        {examDays.map((d) => {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                          const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr)
                          const subjectNames = [...new Set(dayRoutines.map((r) => {
                            const subj = subjectMap.get(r.subjectId)
                            return subj ? (isBn ? subj.nameBn : subj.name) : ''
                          }).filter(Boolean))]
                          return (
                            <th key={d} className="text-center text-[0.5625rem] p-2 border-b border-l border-[var(--border)] min-w-[6rem]">
                              <div className="font-semibold text-[var(--text-primary)]">{d}</div>
                              <div className="text-[0.5rem] text-[var(--text-muted)] mt-0.5">
                                {subjectNames.slice(0, 2).join(', ')}{subjectNames.length > 2 ? '...' : ''}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {classSections.map((cs) => {
                        const studentCount = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === cs.classId && s.section === cs.sectionId).length
                        return (
                          <tr key={cs.label}>
                            <td className="text-[0.6875rem] font-medium text-[var(--text-primary)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10">
                              <div>{cs.classId} - {cs.sectionId}</div>
                              <div className="text-[0.5rem] text-[var(--text-muted)]">{studentCount} {isBn ? 'জন ছাত্র' : 'students'}</div>
                            </td>
                            {examDays.map((d) => {
                              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                              const assignedList = filteredInvigilators.filter((inv) => inv.assignType === 'class' && inv.classSection === cs.label && inv.date === dateStr)
                              const dayRoutine = filteredRoutines.find((r) => r.date === dateStr && r.classId === cs.classId && r.sectionId === cs.sectionId)
                              const subject = dayRoutine ? subjectMap.get(dayRoutine.subjectId) : null
                              const hasExam = !!dayRoutine
                              return (
                                <td key={d} className="text-center p-1.5 border-b border-l border-[var(--border)]">
                                  {!hasExam ? (
                                    <div className="w-full h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[0.5rem] text-[var(--text-muted)] opacity-30">
                                      —
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {assignedList.map((inv) => {
                                        const teacher = teacherMap.get(inv.teacherId)
                                        return (
                                          <div
                                            key={inv.id}
                                            className="rounded-lg p-1.5 bg-[var(--brand-light)] border border-[var(--brand)]/20 cursor-pointer hover:shadow-sm transition-all"
                                            onClick={() => {
                                              if (confirm(isBn ? 'এই নিয়োগ মুছে ফেলবেন?' : 'Remove this assignment?')) removeInvigilator(inv.id)
                                            }}
                                          >
                                            <div className="text-[0.5625rem] font-semibold text-[var(--brand)] truncate">{teacher?.nameEn || inv.teacherId}</div>
                                          </div>
                                        )
                                      })}
                                      {subject && assignedList.length > 0 && (
                                        <div className="text-[0.5rem] text-[var(--text-muted)] truncate">
                                          {isBn ? subject.nameBn : subject.name}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => {
                                          setInvigForm((p) => ({ ...p, date: dateStr, classSection: cs.label }))
                                          setShowInvigForm(true)
                                        }}
                                        className="w-full h-7 rounded-lg border border-dashed border-[var(--border)] text-[0.5rem] text-[var(--text-muted)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all flex items-center justify-center"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          })()}
        </div>
      ) : (
        <div className={`${sectionCls} text-center py-10`}>
          <Calendar size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
          <p className="text-[0.8125rem] text-[var(--text-muted)]">
            {isBn ? 'পরীক্ষা নির্বাচন করুন এবং তারিখ সীমা সেট করুন' : 'Select an exam and set date range'}
          </p>
        </div>
      )}

      {/* Assigned list summary */}
      {filteredInvigilators.length > 0 && (
        <div className="mt-3">
          <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] mb-2">
            {isBn ? 'সকল নিয়োগ' : 'All Assignments'} ({filteredInvigilators.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredInvigilators.map((inv) => {
              const teacher = teacherMap.get(inv.teacherId)
              const room = inv.assignType === 'room' ? roomMap.get(inv.roomId) : null
              return (
                <div key={inv.id} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--brand-light)] flex items-center justify-center flex-shrink-0">
                    <UserCheck size={12} className="text-[var(--brand)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">{teacher?.nameEn || inv.teacherId}</div>
                    <div className="text-[0.5rem] text-[var(--text-muted)]">
                      {inv.assignType === 'room'
                        ? `${room?.roomNo || inv.roomId}`
                        : inv.classSection
                      } · {inv.date} · {inv.shift}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Remove?')) removeInvigilator(inv.id)
                    }}
                    className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)] flex-shrink-0"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {filteredInvigilators.length === 0 && calendarRange && (
        <div className={`${sectionCls} text-center py-6`}>
          <UserCheck size={28} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {isBn ? 'কোনো ইনভিজিলেটর নিয়োগ হয়নি' : 'No invigilators assigned'}
          </p>
        </div>
      )}

      {/* ═══ Invigilator Form Modal ═══ */}
      {showInvigForm && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '23.75rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ইনভিজিলেটর নিয়োগ' : 'Assign Invigilator'}</h3>
              <button
                onClick={() => setShowInvigForm(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                <select
                  value={invigForm.teacherId}
                  onChange={(e) => setInvigForm((p) => ({ ...p, teacherId: e.target.value }))}
                  className={`${selectCls} w-full`}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {teachers.filter((t) => {
                    if (t.status !== 'active') return false
                    if (!invigForm.date) return true
                    // Hide teachers already assigned on this date
                    return !filteredInvigilators.some((inv) => inv.teacherId === t.id && inv.date === invigForm.date)
                  }).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameEn}
                    </option>
                  ))}
                </select>
                {invigForm.date && teachers.filter((t) => t.status === 'active' && filteredInvigilators.some((inv) => inv.teacherId === t.id && inv.date === invigForm.date)).length > 0 && (
                  <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1">
                    {isBn ? 'অন্যান্য শ্রেণি/কক্ষে নিয়োগপ্রাপ্ত শিক্ষক লুকানো আছে' : 'Teachers assigned elsewhere on this date are hidden'}
                  </p>
                )}
              </div>
              {invigAssignType === 'room' ? (
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                  <select
                    value={invigForm.roomId}
                    onChange={(e) => {
                      const roomId = e.target.value
                      const room = rooms.find((r) => r.id === roomId)
                      if (room) {
                        const routine = filteredRoutines.find((r) => r.roomNo === room.roomNo)
                        if (routine) {
                          const shift: 'morning' | 'afternoon' = routine.startTime < '12:00' ? 'morning' : 'afternoon'
                          setInvigForm((p) => ({ ...p, roomId, date: routine.date, shift }))
                        } else {
                          setInvigForm((p) => ({ ...p, roomId }))
                        }
                      } else {
                        setInvigForm((p) => ({ ...p, roomId: '' }))
                      }
                    }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {rooms.filter((r) => r.isActive).map((r) => {
                      const routine = filteredRoutines.find((rt) => rt.roomNo === r.roomNo)
                      const subject = routine ? subjectMap.get(routine.subjectId) : null
                      return (
                        <option key={r.id} value={r.id}>
                          {r.roomNo} ({r.roomName}){subject ? ` - ${isBn ? subject.nameBn : subject.name}` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {invigForm.roomId && (() => {
                    const room = rooms.find((r) => r.id === invigForm.roomId)
                    const routine = room ? filteredRoutines.find((r) => r.roomNo === room.roomNo) : null
                    const subject = routine ? subjectMap.get(routine.subjectId) : null
                    if (!routine) return null
                    return (
                      <div className="mt-1.5 p-2 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]/20">
                        <div className="text-[0.5625rem] text-[var(--brand)] font-medium">
                          {subject ? (isBn ? subject.nameBn : subject.name) : ''} · {routine.date} · {routine.startTime} - {routine.endTime}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি-সেকশন' : 'Class-Section'}</label>
                  <select
                    value={invigForm.classSection}
                    onChange={(e) => {
                      const classSection = e.target.value
                      const [classId, sectionId] = classSection.split('-')
                      const routine = filteredRoutines.find((r) => r.classId === classId && r.sectionId === sectionId)
                      if (routine) {
                        const shift: 'morning' | 'afternoon' = routine.startTime < '12:00' ? 'morning' : 'afternoon'
                        setInvigForm((p) => ({ ...p, classSection, date: routine.date, shift }))
                      } else {
                        setInvigForm((p) => ({ ...p, classSection }))
                      }
                    }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.flatMap((c) =>
                      (sectionsMap[c] || []).map((s) => {
                        const label = `${c}-${s}`
                        const routine = filteredRoutines.find((r) => r.classId === c && r.sectionId === s)
                        const subject = routine ? subjectMap.get(routine.subjectId) : null
                        return (
                          <option key={label} value={label}>
                            {c} - {s}{subject ? ` (${isBn ? subject.nameBn : subject.name})` : ''}
                          </option>
                        )
                      })
                    )}
                  </select>
                  {invigForm.classSection && (() => {
                    const [classId, sectionId] = invigForm.classSection.split('-')
                    const routine = filteredRoutines.find((r) => r.classId === classId && r.sectionId === sectionId)
                    const subject = routine ? subjectMap.get(routine.subjectId) : null
                    if (!routine) return null
                    return (
                      <div className="mt-1.5 p-2 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]/20">
                        <div className="text-[0.5625rem] text-[var(--brand)] font-medium">
                          {subject ? (isBn ? subject.nameBn : subject.name) : ''} · {routine.date} · {routine.startTime} - {routine.endTime}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                  <input
                    type="date"
                    value={invigForm.date}
                    onChange={(e) => setInvigForm((p) => ({ ...p, date: e.target.value }))}
                    className={`${inputCls} w-full`}
                    min={selectedExam?.startDate || ''}
                    max={selectedExam?.endDate || ''}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিফট' : 'Shift'}</label>
                  <select
                    value={invigForm.shift}
                    onChange={(e) => setInvigForm((p) => ({ ...p, shift: e.target.value as 'morning' | 'afternoon' }))}
                    className={`${selectCls} w-full`}
                  >
                    <option value="morning">{isBn ? 'সকাল' : 'Morning'}</option>
                    <option value="afternoon">{isBn ? 'বিকাল' : 'Afternoon'}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowInvigForm(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveInvig} className={`${btnPrimary} text-[0.75rem]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Invigilator Guard List PDF Modal */}
      {showInvigPDF && (
        <InvigilatorPDFOptionsModal
          count={invigilatorGridData.days.reduce((sum, day) => sum + day.rows.length, 0)}
          isBn={isBn}
          gridData={invigilatorGridData}
          onClose={() => setShowInvigPDF(false)}
          onDownload={handleInvigPDF}
        />
      )}
    </>
  )
})
