import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Edit2, Calendar, MapPin, Users,
  X, Clock, CheckCircle, UserCheck,
  LayoutGrid, Building,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'
import type { ExamRoom } from '@/store/examStore'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'
const sectionTitleCls = 'flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]'
const inputCls = 'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const btnPrimary = 'flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

type SubTab = 'routine' | 'rooms' | 'seats' | 'invigilators' | 'attendance'

const statusStyles: Record<string, { bg: string; color: string; label: string; labelBn: string }> = {
  'completed': { bg: 'var(--green-light)', color: 'var(--green)', label: 'Completed', labelBn: 'সম্পন্ন' },
  'in-progress': { bg: 'var(--amber-light)', color: 'var(--amber)', label: 'In Progress', labelBn: 'চলমান' },
  'upcoming': { bg: 'var(--brand-light)', color: 'var(--brand)', label: 'Upcoming', labelBn: 'আসন্ন' },
}

export default function Step2Schedule() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const teachers = useTeacherStore(s => s.teachers)
  const subjects = useTeacherStore(s => s.subjects)
  const { classes } = useClassStore()
  const students = useSessionStudents()
  const isBn = language === 'bn'

  const examConfigs = useExamStore(s => s.examConfigs)
  const routines = useExamStore(s => s.routines)
  const rooms = useExamStore(s => s.rooms)
  const seatPlans = useExamStore(s => s.seatPlans)
  const invigilators = useExamStore(s => s.invigilators)
  const addRoutine = useExamStore(s => s.addRoutine)
  const updateRoutine = useExamStore(s => s.updateRoutine)
  const deleteRoutine = useExamStore(s => s.deleteRoutine)
  const addRoom = useExamStore(s => s.addRoom)
  const updateRoom = useExamStore(s => s.updateRoom)
  const deleteRoom = useExamStore(s => s.deleteRoom)
  const autoAssignSeats = useExamStore(s => s.autoAssignSeats)
  const removeSeatPlan = useExamStore(s => s.removeSeatPlan)
  const addInvigilator = useExamStore(s => s.addInvigilator)
  const removeInvigilator = useExamStore(s => s.removeInvigilator)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('routine')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find(e => e.isActive)?.id || '')

  // Routine form
  const [showRoutineForm, setShowRoutineForm] = useState(false)
  const [routineForm, setRoutineForm] = useState({ classId: '', sectionId: '', subjectId: '', date: '', startTime: '', endTime: '', roomNo: '', status: 'upcoming' as 'upcoming' | 'in-progress' | 'completed' })

  // Room form
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [editRoom, setEditRoom] = useState<ExamRoom | null>(null)
  const [roomForm, setRoomForm] = useState({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })

  // Seat plan
  const [seatClassId, setSeatClassId] = useState('')
  const [seatSectionId, setSeatSectionId] = useState('')

  // Invigilator form
  const [showInvigForm, setShowInvigForm] = useState(false)
  const [invigForm, setInvigForm] = useState({ roomId: '', teacherId: '', date: '', shift: 'morning' as 'morning' | 'afternoon' })

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => routineForm.classId ? (sectionsMap[routineForm.classId] || []) : [], [routineForm.classId, sectionsMap])

  const filteredRoutines = useMemo(() =>
    selectedExamId ? routines.filter(r => r.examId === selectedExamId) : routines
  , [routines, selectedExamId])

  const filteredSeatPlans = useMemo(() =>
    selectedExamId ? seatPlans.filter(sp => sp.examId === selectedExamId) : seatPlans
  , [seatPlans, selectedExamId])

  const filteredInvigilators = useMemo(() =>
    selectedExamId ? invigilators.filter(i => i.examId === selectedExamId) : invigilators
  , [invigilators, selectedExamId])

  const classStudents = useMemo(() => {
    if (!seatClassId || !seatSectionId) return []
    return students.filter(s => s.status === 'approved' && s.class === seatClassId && s.section === seatSectionId)
  }, [students, seatClassId, seatSectionId])

  const handleSaveRoutine = () => {
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
      status: routineForm.status,
    })
    setShowRoutineForm(false)
    setRoutineForm({ classId: '', sectionId: '', subjectId: '', date: '', startTime: '', endTime: '', roomNo: '', status: 'upcoming' })
  }

  const handleSaveRoom = () => {
    if (!roomForm.roomNo || !roomForm.roomName) return
    if (editRoom) {
      updateRoom(editRoom.id, { ...roomForm, capacity: Number(roomForm.capacity) || 40, isActive: true })
    } else {
      addRoom({ ...roomForm, capacity: Number(roomForm.capacity) || 40, isActive: true })
    }
    setShowRoomForm(false)
    setEditRoom(null)
    setRoomForm({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })
  }

  const handleAutoSeat = () => {
    if (!selectedExamId || !seatClassId || !seatSectionId) return
    const activeRooms = rooms.filter(r => r.isActive).map(r => r.id)
    const studentIds = classStudents.map(s => s.id)
    if (studentIds.length === 0 || activeRooms.length === 0) return
    autoAssignSeats(selectedExamId, seatClassId, seatSectionId, studentIds, activeRooms)
  }

  const handleSaveInvig = () => {
    if (!selectedExamId || !invigForm.roomId || !invigForm.teacherId || !invigForm.date) return
    addInvigilator({
      examId: selectedExamId,
      roomId: invigForm.roomId,
      teacherId: invigForm.teacherId,
      date: invigForm.date,
      session: invigForm.shift,
      shift: invigForm.shift,
    })
    setShowInvigForm(false)
    setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning' })
  }

  const sortedRoutines = useMemo(() =>
    [...filteredRoutines].sort((a, b) => a.date.localeCompare(b.date))
  , [filteredRoutines])

  const subjectMap = useMemo(() => {
    const map = new Map<string, typeof subjects[0]>()
    for (const s of subjects) map.set(s.id, s)
    return map
  }, [subjects])

  const studentMap = useMemo(() => {
    const map = new Map<string, typeof students[0]>()
    for (const s of students) map.set(s.id, s)
    return map
  }, [students])

  const roomMap = useMemo(() => {
    const map = new Map<string, typeof rooms[0]>()
    for (const r of rooms) map.set(r.id, r)
    return map
  }, [rooms])

  const teacherMap = useMemo(() => {
    const map = new Map<string, typeof teachers[0]>()
    for (const t of teachers) map.set(t.id, t)
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers])

  const roomCapacityMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const sp of seatPlans) {
      map.set(sp.roomId, (map.get(sp.roomId) || 0) + 1)
    }
    return map
  }, [seatPlans])

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/exams')} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text-primary)]">{isBn ? 'ধাপ ২: সময়সূচী ও আসন পরিকল্পনা' : 'Step 2: Schedule & Seat Planning'}</h1>
            <p className="text-[11px] text-[var(--text-muted)]">{isBn ? 'রুটিন, কক্ষ, আসন ও ইনভিজিলেটর ব্যবস্থাপনা' : 'Routine, rooms, seating & invigilator management'}</p>
          </div>
        </div>
      </div>

      {/* Exam Selector */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className={`${inputCls} max-w-[300px]`}>
          <option value="">{isBn ? 'সকল পরীক্ষা' : 'All Exams'}</option>
          {examConfigs.map(e => <option key={e.id} value={e.id}>{isBn ? e.nameBn : e.name} {e.isActive ? '(Active)' : ''}</option>)}
        </select>
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {([
          { key: 'routine' as SubTab, label: isBn ? 'রুটিন' : 'Routine', icon: <Calendar size={14} />, count: filteredRoutines.length },
          { key: 'rooms' as SubTab, label: isBn ? 'কক্ষ' : 'Rooms', icon: <Building size={14} />, count: rooms.length },
          { key: 'seats' as SubTab, label: isBn ? 'আসন পরিকল্পনা' : 'Seat Plan', icon: <LayoutGrid size={14} />, count: filteredSeatPlans.length },
          { key: 'invigilators' as SubTab, label: isBn ? 'ইনভিজিলেটর' : 'Invigilators', icon: <UserCheck size={14} />, count: filteredInvigilators.length },
          { key: 'attendance' as SubTab, label: isBn ? 'উপস্থিতি' : 'Attendance', icon: <Users size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
            {t.icon}{t.label}
            {t.count !== undefined && <span className="text-[10px] opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ ROUTINE TAB ═══ */}
        {activeSubTab === 'routine' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{filteredRoutines.length} {isBn ? 'টি রুটিন' : 'routines'}</span>
              <button onClick={() => { setShowRoutineForm(true); setRoutineForm({ classId: '', sectionId: '', subjectId: '', date: '', startTime: '', endTime: '', roomNo: '', status: 'upcoming' }) }}
                className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন রুটিন' : 'New Routine'}</button>
            </div>

            {/* Timeline view */}
            <div className="space-y-2">
              {sortedRoutines.map(routine => {
                const subject = subjectMap.get(routine.subjectId)
                const st = statusStyles[routine.status]
                return (
                  <div key={routine.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="text-[10px] font-semibold text-[var(--text-muted)]">{new Date(routine.date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'short' })}</div>
                        <div className="text-[16px] font-bold text-[var(--text-primary)]">{new Date(routine.date).getDate()}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">{new Date(routine.date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'short' })}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? subject?.nameBn : subject?.name}</span>
                          <span className="text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium" style={{ background: st.bg, color: st.color }}>
                            {isBn ? st.labelBn : st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={11} />{routine.startTime} – {routine.endTime}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} />{routine.roomNo}</span>
                          <span>{routine.classId} {routine.sectionId}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => updateRoutine(routine.id, { status: routine.status === 'completed' ? 'upcoming' : routine.status === 'upcoming' ? 'in-progress' : 'completed' })}
                          className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--green)]">
                          <CheckCircle size={12} />
                        </button>
                        <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoutine(routine.id) }}
                          className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredRoutines.length === 0 && (
                <div className={`${sectionCls} text-center py-10`}>
                  <Calendar size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                  <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'কোনো রুটিন নেই' : 'No routines scheduled'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ ROOMS TAB ═══ */}
        {activeSubTab === 'rooms' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{rooms.length} {isBn ? 'টি কক্ষ' : 'rooms'}</span>
              <button onClick={() => { setShowRoomForm(true); setEditRoom(null); setRoomForm({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' }) }}
                className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন কক্ষ' : 'New Room'}</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {rooms.map(room => {
                const assignedSeats = roomCapacityMap.get(room.id) || 0
                const utilization = room.capacity > 0 ? Math.round((assignedSeats / room.capacity) * 100) : 0
                return (
                  <div key={room.id} className={`${sectionCls} transition-all hover:shadow-sm`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{room.roomNo}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{room.roomName} · {room.building} · {room.floor}</div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditRoom(room); setRoomForm({ roomNo: room.roomNo, roomName: room.roomName, capacity: String(room.capacity), building: room.building, floor: room.floor }); setShowRoomForm(true) }}
                          className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]">
                          <Edit2 size={11} />
                        </button>
                        <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoom(room.id) }}
                          className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{assignedSeats}/{room.capacity} {isBn ? 'আসন' : 'seats'}</span>
                      <span className="font-medium" style={{ color: utilization > 90 ? 'var(--red)' : utilization > 70 ? 'var(--amber)' : 'var(--green)' }}>
                        {utilization}% {isBn ? 'ব্যবহৃত' : 'used'}
                      </span>
                    </div>
                    <div className="mt-2 h-[4px] bg-[var(--border)] rounded-[2px]">
                      <div className="h-full rounded-[2px] transition-all" style={{ width: `${utilization}%`, background: utilization > 90 ? 'var(--red)' : utilization > 70 ? 'var(--amber)' : 'var(--green)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ═══ SEATS TAB ═══ */}
        {activeSubTab === 'seats' && (
          <>
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <LayoutGrid size={15} className="text-[var(--brand)]" />{isBn ? 'আসন বরাদ্দ' : 'Seat Assignment'}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select value={seatClassId} onChange={e => { setSeatClassId(e.target.value); setSeatSectionId('') }} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select value={seatSectionId} onChange={e => setSeatSectionId(e.target.value)} className={`${inputCls} w-full`} disabled={!seatClassId}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {(sectionsMap[seatClassId] || []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={handleAutoSeat} disabled={!seatClassId || !seatSectionId || !selectedExamId}
                    className={`${btnPrimary} text-[11px] ${!seatClassId || !seatSectionId || !selectedExamId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <LayoutGrid size={13} />{isBn ? 'অটো বরাদ্দ' : 'Auto Assign'}
                  </button>
                </div>
              </div>
            </div>

            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <MapPin size={15} className="text-[var(--teal)]" />{isBn ? 'বরাদ্দ আসন' : 'Assigned Seats'} ({filteredSeatPlans.length})
              </div>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs min-w-[400px]">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                      <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)]">#{isBn ? 'আসন' : 'Seat'}</th>
                      <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'শিক্ষার্থী' : 'Student'}</th>
                      <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'কক্ষ' : 'Room'}</th>
                      <th className="py-2 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'শ্রেণি' : 'Class'}</th>
                      <th className="py-2 px-2 text-center text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'কাজ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSeatPlans.map(sp => {
                      const student = studentMap.get(sp.studentId)
                      const room = roomMap.get(sp.roomId)

  return (
                        <tr key={sp.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                          <td className="py-2 px-2 font-semibold text-[var(--brand)]">{sp.seatNo}</td>
                          <td className="py-2 px-2 text-[var(--text-primary)]">{student?.nameEn || sp.studentId}</td>
                          <td className="py-2 px-2 text-[var(--text-secondary)]">{room?.roomNo || sp.roomId}</td>
                          <td className="py-2 px-2 text-[var(--text-secondary)]">{sp.classId} {sp.sectionId}</td>
                          <td className="py-2 px-2 text-center">
                            <button onClick={() => removeSeatPlan(sp.id)} className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)] mx-auto">
                              <Trash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredSeatPlans.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                  <LayoutGrid size={24} className="mx-auto mb-2 opacity-30" />
                  {isBn ? 'কোনো আসন বরাদ্দ হয়নি' : 'No seats assigned yet'}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ INVIGILATORS TAB ═══ */}
        {activeSubTab === 'invigilators' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">{filteredInvigilators.length} {isBn ? 'জন ইনভিজিলেটর' : 'invigilators'}</span>
              <button onClick={() => { setShowInvigForm(true); setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning' }) }}
                className={btnPrimary}><Plus size={14} />{isBn ? 'নতুন নিয়োগ' : 'New Assignment'}</button>
            </div>
            <div className="space-y-2">
              {filteredInvigilators.map(inv => {
                const teacher = teacherMap.get(inv.teacherId)
                const room = roomMap.get(inv.roomId)
                return (
                  <div key={inv.id} className={`${sectionCls} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center">
                        <UserCheck size={14} className="text-[var(--brand)]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{teacher?.nameEn || inv.teacherId}</div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                          <span className="flex items-center gap-1"><MapPin size={10} />{room?.roomNo || inv.roomId}</span>
                          <span className="flex items-center gap-1"><Calendar size={10} />{inv.date}</span>
                          <span className="flex items-center gap-1"><Clock size={10} />{inv.shift}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Remove?')) removeInvigilator(inv.id) }}
                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]">
                      <Trash2 size={11} />
                    </button>
                  </div>
                )
              })}
              {filteredInvigilators.length === 0 && (
                <div className={`${sectionCls} text-center py-10`}>
                  <UserCheck size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                  <p className="text-[13px] text-[var(--text-muted)]">{isBn ? 'কোনো ইনভিজিলেটর নিয়োগ হয়নি' : 'No invigilators assigned'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ ATTENDANCE TAB ═══ */}
        {activeSubTab === 'attendance' && (
          <div className={sectionCls}>
            <div className={sectionTitleCls}>
              <Users size={15} className="text-[var(--brand)]" />{isBn ? 'পরীক্ষাভিত্তিক উপস্থিতি' : 'Exam-wise Student Attendance'}
            </div>
            <div className="text-center py-10 text-[var(--text-muted)] text-[12px]">
              <Users size={24} className="mx-auto mb-2 opacity-30" />
              {isBn ? 'পরীক্ষার দিনে উপস্থিতি নেওয়া হবে' : 'Attendance will be taken on exam day'}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Routine Form Modal ═══ */}
      {showRoutineForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? 'নতুন রুটিন' : 'New Routine'}</h3>
              <button onClick={() => setShowRoutineForm(false)} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select value={routineForm.classId} onChange={e => setRoutineForm(p => ({ ...p, classId: e.target.value, sectionId: '' }))} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select value={routineForm.sectionId} onChange={e => setRoutineForm(p => ({ ...p, sectionId: e.target.value }))} className={`${inputCls} w-full`}>
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                <select value={routineForm.subjectId} onChange={e => setRoutineForm(p => ({ ...p, subjectId: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                <input type="date" value={routineForm.date} onChange={e => setRoutineForm(p => ({ ...p, date: e.target.value }))} className={`${inputCls} w-full`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start'}</label>
                  <input type="time" value={routineForm.startTime} onChange={e => setRoutineForm(p => ({ ...p, startTime: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End'}</label>
                  <input type="time" value={routineForm.endTime} onChange={e => setRoutineForm(p => ({ ...p, endTime: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                <select value={routineForm.roomNo} onChange={e => setRoutineForm(p => ({ ...p, roomNo: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {rooms.map(r => <option key={r.id} value={r.roomNo}>{r.roomNo} ({r.capacity})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowRoutineForm(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleSaveRoutine} className={`${btnPrimary} text-[12px]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Room Form Modal ═══ */}
      {showRoomForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{editRoom ? (isBn ? 'কক্ষ এডিট' : 'Edit Room') : (isBn ? 'নতুন কক্ষ' : 'New Room')}</h3>
              <button onClick={() => { setShowRoomForm(false); setEditRoom(null) }} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ নম্বর' : 'Room No'}</label>
                  <input value={roomForm.roomNo} onChange={e => setRoomForm(p => ({ ...p, roomNo: e.target.value }))} className={`${inputCls} w-full`} placeholder="R-101" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষের নাম' : 'Room Name'}</label>
                  <input value={roomForm.roomName} onChange={e => setRoomForm(p => ({ ...p, roomName: e.target.value }))} className={`${inputCls} w-full`} placeholder="Room 101" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ধারণক্ষমতা' : 'Capacity'}</label>
                <input type="number" value={roomForm.capacity} onChange={e => setRoomForm(p => ({ ...p, capacity: e.target.value }))} className={`${inputCls} w-full`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিল্ডিং' : 'Building'}</label>
                  <input value={roomForm.building} onChange={e => setRoomForm(p => ({ ...p, building: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফ্লোর' : 'Floor'}</label>
                  <input value={roomForm.floor} onChange={e => setRoomForm(p => ({ ...p, floor: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setShowRoomForm(false); setEditRoom(null) }} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleSaveRoom} className={`${btnPrimary} text-[12px]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Invigilator Form Modal ═══ */}
      {showInvigForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? 'ইনভিজিলেটর নিয়োগ' : 'Assign Invigilator'}</h3>
              <button onClick={() => setShowInvigForm(false)} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                <select value={invigForm.teacherId} onChange={e => setInvigForm(p => ({ ...p, teacherId: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                <select value={invigForm.roomId} onChange={e => setInvigForm(p => ({ ...p, roomId: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNo}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                  <input type="date" value={invigForm.date} onChange={e => setInvigForm(p => ({ ...p, date: e.target.value }))} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিফট' : 'Shift'}</label>
                  <select value={invigForm.shift} onChange={e => setInvigForm(p => ({ ...p, shift: e.target.value as 'morning' | 'afternoon' }))} className={`${inputCls} w-full`}>
                    <option value="morning">{isBn ? 'সকাল' : 'Morning'}</option>
                    <option value="afternoon">{isBn ? 'বিকাল' : 'Afternoon'}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowInvigForm(false)} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer">{isBn ? 'বাতিল' : 'Cancel'}</button>
              <button onClick={handleSaveInvig} className={`${btnPrimary} text-[12px]`}>{isBn ? 'সংরক্ষণ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
