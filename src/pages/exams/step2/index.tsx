import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Calendar,
  Building,
  LayoutGrid,
  UserCheck,
  Users,
  IdCard,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'
import { format, parseISO } from 'date-fns'
import { selectCls } from '@/lib/styles'
import { generateScheduleReportHTML } from './pdfTemplates/scheduleReport'
import AdmitCardsTab from './AdmitCardsTab'
import RoutineTab from './tabs/RoutineTab'
import RoomsTab from './tabs/RoomsTab'
import SeatsTab from './tabs/SeatsTab'
import InvigilatorsTab from './tabs/InvigilatorsTab'
import { AttendanceTab } from './tabs/AttendanceTab'
import type { SubTab } from './tabs/types'

export default function Step2Schedule() {
  const navigate = useNavigate()
  const teachers = useTeacherStore((s) => s.teachers)
  const subjects = useTeacherStore((s) => s.subjects)
  const students = useSessionStudents()
  const isBn = useBn()
  const { isMobile, isTablet } = useWindowSize()

  const currentSession = useClassStore((s) => s.institution.currentSession)

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
  const routines = useExamStore((s) => s.routines)
  const rooms = useExamStore((s) => s.rooms)
  const seatPlans = useExamStore((s) => s.seatPlans)
  const invigilators = useExamStore((s) => s.invigilators)
  const attendances = useExamStore((s) => s.attendances)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)

  const sessionExamIds = useMemo(() => new Set(examConfigs.map((e) => e.id)), [examConfigs])
  const sessionRoutines = useMemo(() => routines.filter((r) => sessionExamIds.has(r.examId)), [routines, sessionExamIds])
  const sessionSeatPlans = useMemo(() => seatPlans.filter((sp) => sessionExamIds.has(sp.examId)), [seatPlans, sessionExamIds])
  const sessionInvigilators = useMemo(() => invigilators.filter((i) => sessionExamIds.has(i.examId)), [invigilators, sessionExamIds])
  const sessionAttendances = useMemo(() => attendances.filter((a) => sessionExamIds.has(a.examId)), [attendances, sessionExamIds])
  const sessionSubjectMarkConfigs = useMemo(() => subjectMarkConfigs.filter((s) => sessionExamIds.has(s.examId)), [subjectMarkConfigs, sessionExamIds])
  const deleteRoutine = useExamStore((s) => s.deleteRoutine)
  const addRoutine = useExamStore((s) => s.addRoutine)
  const addRoom = useExamStore((s) => s.addRoom)
  const updateRoom = useExamStore((s) => s.updateRoom)
  const deleteRoom = useExamStore((s) => s.deleteRoom)
  const addSeatPlan = useExamStore((s) => s.addSeatPlan)
  const removeSeatPlan = useExamStore((s) => s.removeSeatPlan)
  const addInvigilator = useExamStore((s) => s.addInvigilator)
  const removeInvigilator = useExamStore((s) => s.removeInvigilator)
  const addAttendance = useExamStore((s) => s.addAttendance)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('rooms')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find((e) => e.isActive)?.id || '')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab: activeSubTab,
    tabRefs,
    sliderRef,
    scrollIntoView: true,
  })

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const active = examConfigs.find((e) => e.isActive)
    if (active?.startDate) {
      try { return new Date(parseISO(active.startDate).getFullYear(), parseISO(active.startDate).getMonth(), 1) } catch {}
    }
    return new Date()
  })

  const selectedExam = useMemo(() => examConfigs.find((e) => e.id === selectedExamId) || null, [examConfigs, selectedExamId])

  const calendarRange = useMemo(() => {
    if (!selectedExam?.startDate || !selectedExam?.endDate) return null
    try {
      return { start: parseISO(selectedExam.startDate), end: parseISO(selectedExam.endDate) }
    } catch { return null }
  }, [selectedExam])

  useEffect(() => {
    if (calendarRange) {
      const d = calendarRange.start
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
    }
  }, [calendarRange])

  const filteredRoutines = useMemo(
    () => (selectedExamId ? sessionRoutines.filter((r) => r.examId === selectedExamId) : sessionRoutines),
    [sessionRoutines, selectedExamId]
  )
  const filteredSeatPlans = useMemo(
    () => (selectedExamId ? sessionSeatPlans.filter((sp) => sp.examId === selectedExamId) : sessionSeatPlans),
    [sessionSeatPlans, selectedExamId]
  )
  const filteredInvigilators = useMemo(
    () => (selectedExamId ? sessionInvigilators.filter((i) => i.examId === selectedExamId) : sessionInvigilators),
    [sessionInvigilators, selectedExamId]
  )
  const filteredAttendances = useMemo(
    () => (selectedExamId ? sessionAttendances.filter((a) => a.examId === selectedExamId) : sessionAttendances),
    [sessionAttendances, selectedExamId]
  )

  const subjectMap = useMemo(() => {
    const map = new Map<string, (typeof subjects)[0]>()
    for (const s of subjects) map.set(s.id, s)
    return map
  }, [subjects])

  const roomMap = useMemo(() => {
    const map = new Map<string, (typeof rooms)[0]>()
    for (const r of rooms) map.set(r.id, r)
    return map
  }, [rooms])

  const teacherMap = useMemo(() => {
    const map = new Map<string, (typeof teachers)[0]>()
    for (const t of teachers) map.set(t.id, t)
    return map
  }, [teachers])

  const roomCapacityMap = useMemo(() => {
    const map = new Map<string, { date: string; count: number }[]>()
    const dateCountMap = new Map<string, Map<string, number>>()
    for (const r of filteredRoutines) {
      const studentCount = students.filter(
        (s) => s.status === 'approved' && s.active !== false && s.class === r.classId && (!r.sectionId || s.section === r.sectionId)
      ).length
      if (!dateCountMap.has(r.roomNo)) dateCountMap.set(r.roomNo, new Map())
      const dayMap = dateCountMap.get(r.roomNo)!
      dayMap.set(r.date, (dayMap.get(r.date) || 0) + studentCount)
    }
    for (const [roomNo, dayMap] of dateCountMap) {
      const entries = Array.from(dayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
      map.set(roomNo, entries)
    }
    return map
  }, [filteredRoutines, students])

  const { classes } = useClassStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const examDayCount = useMemo(() => {
    if (!calendarRange) return 0
    const { eachDayOfInterval } = require('date-fns')
    return eachDayOfInterval({ start: calendarRange.start, end: calendarRange.end }).length
  }, [calendarRange])

  const completedDays = useMemo(() => {
    const { isBefore, startOfDay, parseISO: p } = require('date-fns')
    return filteredRoutines.filter((r) => {
      const examDate = startOfDay(p(r.date))
      const today = startOfDay(new Date())
      return isBefore(examDate, today)
    }).length
  }, [filteredRoutines])

  const upcomingDays = useMemo(() => {
    const { isBefore, isSameDay, startOfDay, parseISO: p } = require('date-fns')
    return filteredRoutines.filter((r) => {
      const examDate = startOfDay(p(r.date))
      const today = startOfDay(new Date())
      return !isBefore(examDate, today) && !isSameDay(examDate, today)
    }).length
  }, [filteredRoutines])

  const handleDownloadReport = () => {
    if (!selectedExam) {
      alert(isBn ? 'প্রথমে একটি সক্রিয় পরীক্ষা নির্বাচন করুন' : 'Select an active exam first')
      return
    }
    const inst = useClassStore.getState().institution
    const teacherList = useTeacherStore.getState().teachers
    const html = generateScheduleReportHTML({
      exam: selectedExam,
      routines: filteredRoutines,
      rooms,
      seatPlans: filteredSeatPlans,
      invigilators: filteredInvigilators,
      subjects,
      teachers: teacherList,
      classes,
      isBn,
      schoolName: inst.name,
      schoolNameBn: inst.nameBn,
      schoolAddress: inst.address,
    })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${isBn ? 'পরীক্ষার সময়সূচি প্রতিবেদন' : 'Exam Schedule Report'}</title>
      <style>
        @page{size:A4 landscape;margin:12mm}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:20px}
        @media print{
          body{background:#fff;padding:0}
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        }
      </style>
    </head><body>${html}
      <script>setTimeout(()=>window.print(),600)</script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/exams')}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[1rem] font-bold text-[var(--text-primary)] truncate">
              {isBn ? 'ধাপ ২: সময়সূচী ও আসন পরিকল্পনা' : 'Step 2: Schedule & Seat Planning'}
            </h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {isBn ? 'রুটিন, কক্ষ, আসন ও ইনভিজিলেটর ব্যবস্থাপনা' : 'Routine, rooms, seating & invigilator management'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.75rem] font-medium cursor-pointer font-[inherit] hover:bg-[var(--green)]/15 transition-all shrink-0"
        >
          <Download size={14} />
          {isBn ? 'রিপোর্ট' : 'Report'}
        </button>
      </div>

      {/* Exam Selector */}
      <div className="px-4 py-2 border-b border-[var(--bg-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className={`${selectCls} max-w-[18.75rem]`}>
            <option value="">{isBn ? 'সকল পরীক্ষা' : 'All Exams'}</option>
            {examConfigs.map((e) => (
              <option key={e.id} value={e.id}>
                {isBn ? e.nameBn : e.name} {e.isActive ? '(Active)' : ''}
              </option>
            ))}
          </select>
          {selectedExam && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
                <Calendar size={12} className="text-[var(--brand)]" />
                <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">
                  {format(parseISO(selectedExam.startDate), 'MMM d')} — {format(parseISO(selectedExam.endDate), 'MMM d, yyyy')}
                </span>
              </div>
              <span className="text-[0.625rem] text-[var(--text-muted)]">
                ({examDayCount} {isBn ? 'দিন' : 'days'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className={`relative glass rounded-xl mt-3 mb-3 w-full`}>
        <div className={`relative flex gap-[0.375rem] p-[0.3125rem] rounded-[inherit] ${isMobile || isTablet ? 'overflow-x-auto flex-nowrap' : 'flex-wrap'}`}>
          <div
            ref={sliderRef}
            className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] transition-all duration-300 ease-out z-0"
            style={{
              background: activeSubTab === 'rooms' ? 'var(--brand)' : activeSubTab === 'routine' ? 'var(--teal)' : activeSubTab === 'seats' ? 'var(--purple)' : activeSubTab === 'invigilators' ? 'var(--amber)' : activeSubTab === 'admit-cards' ? 'var(--brand)' : 'var(--green)',
              boxShadow: activeSubTab === 'rooms' ? '0 2px 8px rgba(99,102,241,0.3)' : activeSubTab === 'routine' ? '0 2px 8px rgba(20,184,166,0.3)' : activeSubTab === 'seats' ? '0 2px 8px rgba(168,85,247,0.3)' : activeSubTab === 'invigilators' ? '0 2px 8px rgba(245,158,11,0.3)' : activeSubTab === 'admit-cards' ? '0 2px 8px rgba(99,102,241,0.3)' : '0 2px 8px rgba(34,197,94,0.3)',
            }}
          />
          {[
            { key: 'rooms' as SubTab, label: isBn ? 'কক্ষ' : 'Rooms', icon: <Building size={14} />, count: rooms.length },
            { key: 'routine' as SubTab, label: isBn ? 'রুটিন' : 'Routine', icon: <Calendar size={14} />, count: filteredRoutines.length },
            { key: 'seats' as SubTab, label: isBn ? 'আসন পরিকল্পনা' : 'Seat Plan', icon: <LayoutGrid size={14} />, count: filteredSeatPlans.length },
            { key: 'invigilators' as SubTab, label: isBn ? 'ইনভিজিলেটর' : 'Invigilators', icon: <UserCheck size={14} />, count: filteredInvigilators.length },
            { key: 'admit-cards' as SubTab, label: isBn ? 'প্রবেশপত্র' : 'Admit Cards', icon: <IdCard size={14} /> },
            { key: 'attendance' as SubTab, label: isBn ? 'পরীক্ষার উপস্থিতি' : 'Exam Attendance', icon: <Users size={14} /> },
          ].map((t) => (
            <button
              key={t.key}
              ref={(el) => { if (el) tabRefs.current.set(t.key, el) }}
              onClick={() => setActiveSubTab(t.key)}
              className={`relative z-10 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${isMobile || isTablet ? 'shrink-0' : 'flex-1'} ${
                activeSubTab === t.key ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{ background: 'transparent' }}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && <span className="text-[0.625rem] opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSubTab === 'routine' && (
          <RoutineTab
            isBn={isBn}
            selectedExamId={selectedExamId}
            selectedExam={selectedExam}
            filteredRoutines={filteredRoutines}
            subjectMap={subjectMap}
            roomMap={roomMap}
            rooms={rooms}
            students={students}
            classes={classes}
            classOptions={classOptions}
            sectionsMap={sectionsMap}
            calendarRange={calendarRange}
            examDayCount={examDayCount}
            completedDays={completedDays}
            upcomingDays={upcomingDays}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            addRoutine={addRoutine}
            deleteRoutine={deleteRoutine}
          />
        )}

        {activeSubTab === 'rooms' && (
          <RoomsTab
            isBn={isBn}
            rooms={rooms}
            roomCapacityMap={roomCapacityMap}
            addRoom={addRoom}
            updateRoom={updateRoom}
            deleteRoom={deleteRoom}
          />
        )}

        {activeSubTab === 'seats' && (
          <SeatsTab
            isBn={isBn}
            selectedExamId={selectedExamId}
            selectedExam={selectedExam}
            students={students}
            rooms={rooms}
            seatPlans={filteredSeatPlans}
            classOptions={classOptions}
            sectionsMap={sectionsMap}
            addSeatPlan={addSeatPlan}
            removeSeatPlan={removeSeatPlan}
          />
        )}

        {activeSubTab === 'invigilators' && (
          <InvigilatorsTab
            isBn={isBn}
            selectedExamId={selectedExamId}
            selectedExam={selectedExam}
            filteredRoutines={filteredRoutines}
            filteredInvigilators={filteredInvigilators}
            subjectMap={subjectMap}
            teacherMap={teacherMap}
            roomMap={roomMap}
            students={students}
            rooms={rooms}
            teachers={teachers}
            classOptions={classOptions}
            sectionsMap={sectionsMap}
            calendarRange={calendarRange}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            addInvigilator={addInvigilator}
            removeInvigilator={removeInvigilator}
            examDayCount={examDayCount}
          />
        )}

        {activeSubTab === 'attendance' && (
          <AttendanceTab
            isBn={isBn}
            selectedExamId={selectedExamId}
            selectedExam={selectedExam}
            filteredAttendances={filteredAttendances}
            students={students}
            classOptions={classOptions}
            sectionsMap={sectionsMap}
            addAttendance={addAttendance}
          />
        )}

        {activeSubTab === 'admit-cards' && (
          <AdmitCardsTab
            students={students}
            selectedExamId={selectedExamId}
            examConfigs={examConfigs}
            routines={sessionRoutines}
            subjectMarkConfigs={sessionSubjectMarkConfigs}
          />
        )}
      </div>
    </div>
  )
}
