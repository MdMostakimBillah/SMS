import React, { useState, useMemo, Fragment, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Clock,
  Users,
  Save,
  Check,
  X,
  Copy,
  ChevronDown,
  MoreVertical,
  FileSpreadsheet,
  FileText,
  BookOpen,
} from 'lucide-react'
import { RoutinePDFOptionsModal } from '@/components/shared/RoutinePDFOptionsModal'
import { generateRoutineGridPDF } from '@/pages/classes/routinePdfTemplate'
import type { RoutineListPDFOptions, RoutineGridData } from '@/pages/classes/routinePdfTemplate'
import { openPrintWindow } from '@/lib/pdf'
import { btnPrimary } from '@/lib/styles'
import * as XLSX from 'xlsx'

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAYS_BN = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার']

interface RoutineTabProps {
  classes: any[]
  routines: any[]
  teachers: any[]
  subjects: any[]
  institution: any
  updateRoutine: (classId: string, data: any) => void
  setRoutineSlot: (classId: string, day: number, period: number, slot: any) => void
  clearRoutineSlot: (classId: string, day: number, period: number, sectionId?: string) => void
  isBn: boolean
  isMobile: boolean
}

export default React.memo(function RoutineTab({
  classes,
  routines,
  teachers,
  subjects,
  institution,
  updateRoutine,
  setRoutineSlot,
  clearRoutineSlot,
  isBn,
  isMobile,
}: RoutineTabProps) {
  const navigate = useNavigate()
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '')
  const [selectedSection, setSelectedSection] = useState('')
  const [editSlot, setEditSlot] = useState<{ day: number; period: number } | null>(null)
  const [slotForm, setSlotForm] = useState({ subjectId: '', teacherId: '' })
  const [showCopyDay, setShowCopyDay] = useState(false)
  const [showCopyDayConfirm, setShowCopyDayConfirm] = useState(false)
  const [copyFrom, setCopyFrom] = useState(0)
  const [copyTo, setCopyTo] = useState(1)
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [showPDF, setShowPDF] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false)
      }
    }
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActionMenu])

  useEffect(() => {
    const lastRedirect = sessionStorage.getItem('edutech_lastRedirect')
    const now = Date.now()
    if (!lastRedirect || now - Number(lastRedirect) > 30000) {
      localStorage.removeItem('edutech_navChain')
    }
  }, [])

  const cls = classes.find((c) => c.id === selectedClass)
  const sections = cls?.sections || []
  const effectiveSection = selectedSection || sections[0]?.id || ''

  const editSlotFilteredSubjects = useMemo(() => {
    if (!editSlot || !cls) return subjects
    const currentSection = cls.sections?.find((s: any) => s.id === effectiveSection)
    const sectionSubjectIds = currentSection?.subjectIds || []
    if (sectionSubjectIds.length > 0) {
      return subjects.filter((s) => sectionSubjectIds.includes(s.id))
    }
    const classSubjectIds = [...new Set(cls.sections?.flatMap((s: any) => s.subjectIds || []) || [])]
    if (classSubjectIds.length > 0) {
      return subjects.filter((s) => classSubjectIds.includes(s.id))
    }
    return subjects
  }, [editSlot, cls, effectiveSection, subjects])

  const routine = routines.find((r) => r.classId === selectedClass && r.sectionId === effectiveSection)
  const defaultDuration = routine?.periodDuration || 40
  const weekendDays = routine?.weekendDays || [5]

  const periods = routine?.periods || []

  const resolvedPeriods = useMemo(() => {
    return periods.map((daySlots: any[]) =>
      (daySlots || []).map((slot: any) => {
        if (!slot?.teacherId) return slot
        if (slot.teacherName && !slot.teacherName.startsWith('TCH-')) return slot
        const teacher = teachers.find((t) => t.id === slot.teacherId)
        if (teacher) return { ...slot, teacherName: teacher.nameEn }
        return { ...slot, teacherName: slot.teacherName || slot.teacherId }
      })
    )
  }, [periods, teachers, routines])

  const startTime = cls?.startTime || institution.startTime || '07:30'

  const totalPeriods = useMemo(() => {
    const [sh, sm] = (cls?.startTime || institution.startTime || '07:30').split(':').map(Number)
    const [eh, em] = (cls?.endTime || institution.endTime || '14:30').split(':').map(Number)
    const totalMin = eh * 60 + em - (sh * 60 + sm)
    return Math.floor(totalMin / defaultDuration) || 7
  }, [cls, institution, defaultDuration])

  const periodDurations = useMemo(() => {
    const saved = routine?.periodDurations
    if (saved && saved.length > 0) {
      while (saved.length < totalPeriods) saved.push(defaultDuration)
      return saved.slice(0, totalPeriods)
    }
    return Array(totalPeriods).fill(defaultDuration)
  }, [routine?.periodDurations, defaultDuration, totalPeriods])

  const activeDays = useMemo(
    () => DAYS.map((d, i) => ({ name: d, nameBn: DAYS_BN[i], index: i })).filter((d) => !weekendDays.includes(d.index)),
    [weekendDays]
  )

  const getPeriodTime = (periodIndex: number) => {
    const [h, m] = startTime.split(':').map(Number)
    let startMin = h * 60 + m
    for (let i = 0; i < periodIndex; i++) {
      startMin += periodDurations[i] || defaultDuration
    }
    const endMin = startMin + (periodDurations[periodIndex] || defaultDuration)
    const pad = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
    return { start: pad(startMin), end: pad(endMin) }
  }

  const breakPositions = useMemo(() => {
    const breaks = institution.breaks || []
    if (breaks.length === 0) return []
    const [sh, sm] = startTime.split(':').map(Number)
    const schoolStartMin = sh * 60 + sm
    return breaks.map((brk: any) => {
      const [bh, bm] = brk.start.split(':').map(Number)
      const breakMin = bh * 60 + bm
      let elapsed = 0
      let periodIdx = 0
      while (periodIdx < totalPeriods) {
        elapsed += periodDurations[periodIdx] || defaultDuration
        if (schoolStartMin + elapsed > breakMin) break
        periodIdx++
      }
      return {
        ...brk,
        afterPeriod: Math.max(0, Math.min(periodIdx, totalPeriods - 1)),
      }
    }).sort((a: any, b: any) => a.afterPeriod - b.afterPeriod)
  }, [institution.breaks, startTime, periodDurations, defaultDuration, totalPeriods])

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || id
  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.nameEn || id

  const handleSaveSlot = () => {
    if (editSlot && slotForm.subjectId) {
      setRoutineSlot(selectedClass, editSlot.day, editSlot.period, { ...slotForm, sectionId: effectiveSection })
    }
    setEditSlot(null)
    setSlotForm({ subjectId: '', teacherId: '' })
  }

  const handlePeriodDurationChange = (val: number) => {
    updateRoutine(selectedClass, { sectionId: effectiveSection, periodDuration: val, periodDurations: Array(totalPeriods).fill(val) })
  }

  const handlePeriodDurationUpdate = (periodIndex: number, val: number) => {
    const newDurations = [...periodDurations]
    while (newDurations.length <= periodIndex) newDurations.push(defaultDuration)
    newDurations[periodIndex] = val
    updateRoutine(selectedClass, { sectionId: effectiveSection, periodDurations: newDurations })
  }

  const toggleWeekend = (dayIndex: number) => {
    const newWeekends = weekendDays.includes(dayIndex) ? weekendDays.filter((d: number) => d !== dayIndex) : [...weekendDays, dayIndex]
    updateRoutine(selectedClass, { sectionId: effectiveSection, weekendDays: newWeekends })
  }

  const handleCopyDay = () => {
    const sourceSlots = resolvedPeriods[copyFrom] || []
    sourceSlots.forEach((slot: any, periodIdx: number) => {
      if (slot?.subjectId) {
        setRoutineSlot(selectedClass, copyTo, periodIdx, { ...slot, sectionId: effectiveSection })
      }
    })
    setShowCopyDay(false)
  }

  const hasDayData = (dayIdx: number) => {
    return (resolvedPeriods[dayIdx] || []).some((s: any) => s?.subjectId)
  }

  const exportExcel = useCallback(() => {
    const clsObj = classes.find((c) => c.id === selectedClass)
    const secObj = clsObj?.sections.find((s: any) => s.id === effectiveSection)
    const secName = secObj?.name || ''
    const className = isBn ? clsObj?.nameBn : clsObj?.name

    const routineData = activeDays
      .map((d) => {
        return Array.from({ length: totalPeriods }, (_, p) => {
          const slot = resolvedPeriods[d.index]?.[p]
          const time = getPeriodTime(p)
          if (slot?.subjectId) {
            return {
              Day: isBn ? d.nameBn : d.name,
              Period: `P${p + 1}`,
              Time: `${time.start} - ${time.end}`,
              Subject: getSubjectName(slot.subjectId),
              Teacher: slot.teacherName || getTeacherName(slot.teacherId),
            }
          }
          return {
            Day: isBn ? d.nameBn : d.name,
            Period: `P${p + 1}`,
            Time: `${time.start} - ${time.end}`,
            Subject: '—',
            Teacher: '—',
          }
        })
      })
      .flat()

    const instName = institution.name || 'EduTech'
    const instAddress = institution.address || 'Dhaka, Bangladesh'

    const ws = XLSX.utils.json_to_sheet(routineData)
    XLSX.utils.sheet_add_aoa(ws, [
      [instName],
      [instAddress],
      [`Class: ${className} - Section: ${secName}`],
      [`Periods: ${totalPeriods}`],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Routine')
    XLSX.writeFile(wb, `routine_${className}_${secName}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [classes, selectedClass, effectiveSection, activeDays, totalPeriods, resolvedPeriods, institution, isBn])

  const routineGridData: RoutineGridData = useMemo(() => {
    const periodTimes = Array.from({ length: totalPeriods }, (_, p) => getPeriodTime(p))
    const grid = activeDays.map((d) => {
      return Array.from({ length: totalPeriods }, (_, p) => {
        const slot = resolvedPeriods[d.index]?.[p]
        return {
          subject: slot?.subjectId ? getSubjectName(slot.subjectId) : '',
          teacher: slot?.teacherId ? (slot.teacherName || getTeacherName(slot.teacherId)) : '',
        }
      })
    })
    return { activeDays, totalPeriods, periodTimes, grid }
  }, [activeDays, totalPeriods, resolvedPeriods, getSubjectName, getTeacherName, getPeriodTime])

  const handlePDF = useCallback(
    (opts: RoutineListPDFOptions) => {
      const html = generateRoutineGridPDF(routineGridData, { ...opts, institutionName: institution.name })
      openPrintWindow(opts.title || 'Routine', html)
      setShowPDF(false)
    },
    [routineGridData]
  )

  return (
    <div>
      {/* Class + Section selector + Period config */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '0.625rem', marginBottom: '0.875rem' }}>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.375rem' }}>
            {isBn ? 'শ্রেণি নির্বাচন' : 'Select Class'}
          </div>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value)
              setSelectedSection('')
              setEditSlot(null)
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontFamily: 'inherit',
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {isBn ? c.nameBn : c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.375rem' }}>
            {isBn ? 'সেকশন' : 'Section'}
          </div>
          <select
            value={effectiveSection}
            onChange={(e) => {
              setSelectedSection(e.target.value)
              setEditSlot(null)
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontFamily: 'inherit',
            }}
          >
            {sections.length === 0 && <option value="">{isBn ? 'কোনো সেকশন নেই' : 'No sections'}</option>}
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>
                {isBn ? 'সেকশন' : 'Section'} {s.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.375rem' }}>
            {isBn ? 'পিরিয়ড সময়কাল' : 'Period Duration'}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {[30, 35, 40, 45, 50, 60].map((d) => (
              <button
                key={d}
                onClick={() => handlePeriodDurationChange(d)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {d}m
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={showCustomDuration}
              onChange={(e) => setShowCustomDuration(e.target.checked)}
              style={{ width: '0.875rem', height: '0.875rem', accentColor: 'var(--purple)' }}
            />
            {isBn ? 'কাস্টম সময় সেট করুন' : 'Set custom time'}
          </label>
          {(() => {
            const [sh, sm] = startTime.split(':').map(Number)
            const [eh, em] = (cls?.endTime || institution.endTime || '14:30').split(':').map(Number)
            const totalMin = eh * 60 + em - (sh * 60 + sm)
            const usedMin = periodDurations.slice(0, totalPeriods).reduce((sum: number, d: number) => sum + d, 0)
            const remainder = totalMin - usedMin
            return (
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span>{isBn ? `মোট ${usedMin} মিনিট` : `Total ${usedMin} min`}</span>
                {remainder > 0 && (
                  <span style={{ color: 'var(--amber)', fontWeight: 500 }}>
                    · {isBn ? `বাকি ${remainder} মিনিট` : `${remainder} min left`}
                  </span>
                )}
                {remainder < 0 && (
                  <span style={{ color: 'var(--red)', fontWeight: 500 }}>
                    · {isBn ? `${Math.abs(remainder)} মিনিট বেশি` : `${Math.abs(remainder)} min over`}
                  </span>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Custom period durations */}
      {showCustomDuration && (
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '0.875rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem', marginBottom: '0.5rem' }}>
            {isBn ? 'প্রতি পিরিয়ডে সময় সেট করুন' : 'Set time per period'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.25rem' }}>
            {Array.from({ length: totalPeriods }, (_, i) => {
              const time = getPeriodTime(i)
              const dur = periodDurations[i] || defaultDuration
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '5px 8px', borderRadius: '0.375rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--purple)', minWidth: '1.25rem' }}>P{i + 1}</span>
                  <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', minWidth: '4.6875rem' }}>{time.start}-{time.end}</span>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={dur}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || defaultDuration
                        handlePeriodDurationUpdate(i, Math.max(10, Math.min(120, val)))
                      }}
                      style={{
                        width: '2.75rem',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.6875rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>min</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action button dropdown */}
      {resolvedPeriods.some((day: any) => day?.some((slot: any) => slot?.subjectId)) && (
        <div style={{ position: 'relative', marginBottom: '0.875rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
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
          {showActionMenu && (
            <div
              ref={actionMenuRef}
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
                onClick={() => {
                  exportExcel()
                  setShowActionMenu(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                {isBn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
              </button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
              <button
                onClick={() => {
                  setShowPDF(true)
                  setShowActionMenu(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
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

      {/* PDF Modal */}
      {showPDF && (
        <RoutinePDFOptionsModal
          count={activeDays.length}
          isBn={isBn}
          routineGridData={routineGridData}
          onClose={() => setShowPDF(false)}
          onDownload={handlePDF}
        />
      )}

      {/* Edit slot modal */}
      {editSlot && (
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--purple)',
            borderRadius: '0.875rem',
            padding: '1rem',
            marginBottom: '0.875rem',
            boxShadow: '0 8px 24px rgba(139,92,246,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.4375rem',
                  background: 'var(--purple-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={14} style={{ color: 'var(--purple)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isBn ? DAYS_BN[editSlot.day] : DAYS[editSlot.day]}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {isBn ? 'পিরিয়ড' : 'Period'} {editSlot.period + 1} · {getPeriodTime(editSlot.period).start} -{' '}
                  {getPeriodTime(editSlot.period).end}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditSlot(null)}
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '0.4375rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <BookOpen size={12} style={{ color: 'var(--purple)' }} />
                {isBn ? 'বিষয় নির্বাচন' : 'Select Subject'}
              </label>
              {editSlotFilteredSubjects.length === 0 ? (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px dashed var(--border)',
                  background: 'var(--bg-secondary)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {isBn ? 'কোনো বিষয় পাওয়া যায়নি' : 'No subjects found'}
                  </p>
                    <button
                      onClick={() => {
                        const chain = JSON.parse(localStorage.getItem('edutech_navChain') || '[]')
                        chain.push({ path: '/classes', label: isBn ? 'শ্রেণি' : 'Classes' })
                        localStorage.setItem('edutech_navChain', JSON.stringify(chain))
                        sessionStorage.setItem('edutech_lastRedirect', String(Date.now()))
                        navigate('/teachers/subjects')
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        background: 'var(--brand)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                    {isBn ? 'বিষয় তৈরি করুন' : 'Create Subjects'}
                    <ArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <select
                  value={slotForm.subjectId}
                  onChange={(e) => setSlotForm((p) => ({ ...p, subjectId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">{isBn ? 'বিষয় বাছুন' : 'Choose subject'}</option>
                  {editSlotFilteredSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isBn ? s.nameBn : s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Users size={12} style={{ color: 'var(--purple)' }} />
                {isBn ? 'শিক্ষক নির্বাচন' : 'Select Teacher'}
              </label>
              <select
                value={slotForm.teacherId}
                onChange={(e) => setSlotForm((p) => ({ ...p, teacherId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">{isBn ? 'শিক্ষক বাছুন' : 'Choose teacher'}</option>
                {(() => {
                  const active = teachers.filter((t) => t.status === 'active')
                  if (!slotForm.subjectId)
                    return active.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameEn} — {t.designation || ''}
                      </option>
                    ))
                  const related = active.filter((t) => t.subjectIds.includes(slotForm.subjectId))
                  const others = active.filter((t) => !t.subjectIds.includes(slotForm.subjectId))
                  return [
                    related.length > 0 && (
                      <optgroup key="related" label={isBn ? '★ সুপারিশকৃত' : '★ Recommended'}>
                        {related.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameEn} — {t.designation || ''}
                          </option>
                        ))}
                      </optgroup>
                    ),
                    others.length > 0 && (
                      <optgroup key="others" label={isBn ? 'অন্যান্য' : 'Others'}>
                        {others.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nameEn} — {t.designation || ''}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  ]
                })()}
              </select>
            </div>
          </div>

          {/* Preview */}
          {slotForm.subjectId && slotForm.teacherId && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                background: 'var(--purple-light)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
              }}
            >
              <Check size={16} style={{ color: 'var(--purple)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--purple)' }}>{getSubjectName(slotForm.subjectId)}</div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{getTeacherName(slotForm.teacherId)}</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                clearRoutineSlot(selectedClass, editSlot.day, editSlot.period, effectiveSection)
                setEditSlot(null)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
            <button
              onClick={handleSaveSlot}
              disabled={!slotForm.subjectId}
              style={{
                padding: '8px 20px',
                borderRadius: '0.5rem',
                background: slotForm.subjectId ? 'var(--purple)' : 'var(--border-2)',
                border: 'none',
                color: slotForm.subjectId ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: slotForm.subjectId ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3125rem',
              }}
            >
              <Save size={13} />
              {isBn ? 'সেভ করুন' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Routine grid */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.625rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.0313rem',
                  marginBottom: '0.375rem',
                }}
              >
                {isBn ? 'সাপ্তাহিক ছুটি দিন' : 'Weekend Days'}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {DAYS.map((d, i) => {
                  const isWeekend = weekendDays.includes(i)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleWeekend(i)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '0.375rem',
                        border: `1px solid ${isWeekend ? 'var(--red)' : 'var(--border)'}`,
                        background: isWeekend ? 'var(--red-light)' : 'var(--bg-primary)',
                        color: isWeekend ? 'var(--red)' : 'var(--text-secondary)',
                        fontSize: '0.6875rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: isWeekend ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isBn ? DAYS_BN[i] : d}
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => setShowCopyDay(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3125rem',
                padding: '6px 12px',
                borderRadius: '0.4375rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.6875rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand)'
                e.currentTarget.style.color = 'var(--brand)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <Copy size={12} />
              {isBn ? 'দিন কপি' : 'Copy Day'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6875rem', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th
                  style={{
                    padding: '10px 8px',
                    width: '5rem',
                    textAlign: 'left',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    position: 'sticky',
                    left: 0,
                    background: 'var(--bg-secondary)',
                    zIndex: 1,
                  }}
                >
                  {isBn ? 'সময়' : 'Time'}
                </th>
                {activeDays.map((d) => (
                  <th
                    key={d.index}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      minWidth: '7.5rem',
                    }}
                  >
                    {isBn ? d.nameBn : d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalPeriods }, (_, p) => {
                const time = getPeriodTime(p)
                const breakAfter = breakPositions.filter((b: any) => b.afterPeriod === p)
                return (
                  <Fragment key={p}>
                    <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <td
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.625rem',
                          color: 'var(--text-muted)',
                          position: 'sticky',
                          left: 0,
                          background: 'var(--bg-primary)',
                          zIndex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>P{p + 1}</div>
                        <div>{time.start}</div>
                        <div>{time.end}</div>
                      </td>
                      {activeDays.map((d) => {
                      const slot = resolvedPeriods[d.index]?.[p]
                        const hasSubject = slot?.subjectId

  return (
                          <td key={d.index} style={{ padding: '0.25rem', textAlign: 'center', verticalAlign: 'top' }}>
                            <button
                              onClick={() => {
                                setEditSlot({ day: d.index, period: p })
                                setSlotForm({ subjectId: slot?.subjectId || '', teacherId: slot?.teacherId || '' })
                              }}
                              style={{
                                width: '100%',
                                minHeight: '3rem',
                                padding: '0.375rem',
                                borderRadius: '0.375rem',
                                border: `1px solid ${hasSubject ? 'var(--purple)' : 'var(--border)'}`,
                                background: hasSubject ? 'var(--purple-light)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                textAlign: 'center',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--purple)'
                                e.currentTarget.style.transform = 'scale(1.02)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = hasSubject ? 'var(--purple)' : 'var(--border)'
                                e.currentTarget.style.transform = 'scale(1)'
                              }}
                            >
                              {hasSubject ? (
                                <>
                                  <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--purple)', lineHeight: 1.2 }}>
                                    {getSubjectName(slot.subjectId)}
                                  </div>
                                  <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.125rem', lineHeight: 1.2 }}>
                                    {slot.teacherName || getTeacherName(slot.teacherId)}
                                  </div>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>+</span>
                              )}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                    {breakAfter.map((brk: any) => (
                      <tr key={`break-${brk.id}`} style={{ borderBottom: '0.5px solid var(--border)' }}>
                        <td
                          style={{
                            padding: '0.5rem',
                            fontSize: '0.625rem',
                            color: 'var(--amber)',
                            position: 'sticky',
                            left: 0,
                            background: 'var(--bg-primary)',
                            zIndex: 1,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{isBn ? 'বিরতি' : 'Break'}</div>
                          <div>{brk.start}</div>
                          <div>{brk.end}</div>
                        </td>
                        {activeDays.map((d) => (
                          <td
                            key={d.index}
                            colSpan={1}
                            style={{
                              padding: '0.25rem',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                padding: '0.375rem',
                                borderRadius: '0.375rem',
                                border: '1px dashed var(--amber)',
                                background: 'var(--amber-light)',
                                fontSize: '0.625rem',
                                fontWeight: 600,
                                color: 'var(--amber)',
                              }}
                            >
                              {brk.label}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy Day Modal */}
      {showCopyDay && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box" style={{ maxWidth: '25rem' }}>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-[0.875rem]">
              {isBn ? 'দিন কপি করুন' : 'Copy Day Routine'}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-muted)] mb-4">
              {isBn ? 'একটি দিনের রুটিন অন্য দিনে কপি করুন' : 'Copy one day routine to another'}
            </p>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'কোন দিন থেকে' : 'From Day'}
                </label>
                <select
                  value={copyFrom}
                  onChange={(e) => setCopyFrom(Number(e.target.value))}
                  className="w-full h-[2.5rem] px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit]"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {isBn ? DAYS_BN[i] : d}
                      {!hasDayData(i) ? ` (${isBn ? 'খালি' : 'empty'})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 text-[var(--text-muted)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'কোন দিনে' : 'To Day'}
                </label>
                <select
                  value={copyTo}
                  onChange={(e) => setCopyTo(Number(e.target.value))}
                  className="w-full h-[2.5rem] px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit]"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {isBn ? DAYS_BN[i] : d}
                      {hasDayData(i) ? ` (${isBn ? 'আছে' : 'has data'})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {copyFrom === copyTo && (
              <div className="p-2 rounded-md bg-[var(--amber-light)] border border-[var(--amber)] mb-3">
                <span className="text-[0.6875rem] text-[var(--amber)] font-medium">
                  {isBn ? 'উৎস এবং গন্তব্য একই দিন হতে হবে না' : 'Source and destination must be different days'}
                </span>
              </div>
            )}

            {copyFrom !== copyTo && hasDayData(copyFrom) && (
              <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] mb-3">
                <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1.5">
                  {isBn ? 'পূর্বরূপ' : 'Preview'}
                </div>
                <div className="flex items-center gap-2 text-[0.6875rem]">
                  <span className="text-[var(--brand)] font-semibold">{isBn ? DAYS_BN[copyFrom] : DAYS[copyFrom]}</span>
                  <span className="text-[var(--text-muted)]">→</span>
                  <span className="text-[var(--teal)] font-semibold">{isBn ? DAYS_BN[copyTo] : DAYS[copyTo]}</span>
                  <span className="text-[var(--text-muted)] ml-auto">
                    {(resolvedPeriods[copyFrom] || []).filter((s: any) => s?.subjectId).length}{' '}
                    {isBn ? 'টি পিরিয়ড কপি হবে' : 'periods will copy'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCopyDay(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => setShowCopyDayConfirm(true)}
                disabled={copyFrom === copyTo || !hasDayData(copyFrom)}
                className="px-3.5 py-2 rounded-lg border-none text-white text-xs font-semibold cursor-pointer font-[inherit] flex items-center gap-1.5"
                style={{
                  background: copyFrom !== copyTo && hasDayData(copyFrom) ? 'var(--brand)' : 'var(--border)',
                  cursor: copyFrom !== copyTo && hasDayData(copyFrom) ? 'pointer' : 'not-allowed',
                }}
              >
                <Copy size={13} />
                {isBn ? 'কপি করুন' : 'Copy'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Copy Day Confirm Alert */}
      {showCopyDayConfirm && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content modal-box" style={{ maxWidth: '22rem', textAlign: 'center' }}>
            <div className="w-12 h-12 rounded-full bg-[var(--amber-light)] flex items-center justify-center mx-auto mb-4">
              <Copy size={22} className="text-[var(--amber)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'দিন কপি করতে চান?' : 'Copy Day Routine?'}
            </h3>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-5 leading-relaxed">
              {isBn
                ? `আপনি ${DAYS_BN[copyFrom]} থেকে ${DAYS_BN[copyTo]} এ রুটিন কপি করতে চলেছেন। এটি লক্ষ্য দিনের বিদ্যমান ডেটা ওভাররাইট করতে পারে।`
                : `You are about to copy ${DAYS[copyFrom]} routine to ${DAYS[copyTo]}. This may overwrite existing data on the target day.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCopyDayConfirm(false)}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => { setShowCopyDayConfirm(false); handleCopyDay() }}
                autoFocus
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--amber)] border-none text-white text-[0.8125rem] font-medium cursor-pointer font-[inherit]"
              >
                {isBn ? 'হ্যাঁ, কপি করুন' : 'Yes, Copy'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})
