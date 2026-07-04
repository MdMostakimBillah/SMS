import { useState, useMemo } from 'react'
import { ScanFace, User, GraduationCap } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import type { AttendanceStatus } from '@/store/teacherStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useFaceApi, type RegisteredFace } from '@/hooks/useFaceApi'
import { logAuditEvent } from '@/lib/faceAudit'
import RegistrationPopup from './kiosk/RegistrationPopup'
import AttendancePopup from './kiosk/AttendancePopup'
import RegisteredFacesTable from './kiosk/RegisteredFacesTable'
import AuditLog from './kiosk/AuditLog'
import ExportImport from './kiosk/ExportImport'

const STORAGE_KEY = 'kioskFaces'

function loadFaces(): RegisteredFace[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveFaces(faces: RegisteredFace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(faces))
}

export default function KioskMode({ isBn, date }: { isBn: boolean; date: string }) {
  const { teachers, attendance } = useTeacherStore(
    useShallow((s) => ({
      teachers: s.teachers,
      attendance: s.attendance,
    }))
  )
  const students = useSessionStudents()
  const { institution } = useClassStore()
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])
  const { loaded: faceApiLoaded, error: faceApiError } = useFaceApi()

  const [kioskMode, setKioskMode] = useState<'register' | 'attendance'>('register')
  const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>(loadFaces)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [search, setSearch] = useState('')
  const [regSearch, setRegSearch] = useState('')
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const [regPopupOpen, setRegPopupOpen] = useState(false)
  const [attendanceOpen, setAttendanceOpen] = useState(false)

  const allPeople = useMemo(() => {
    const staff = activeTeachers.map((t) => ({
      id: t.id,
      name: isBn ? (t.nameBn || t.nameEn) : t.nameEn,
      nameEn: t.nameEn,
      photo: t.photo || '',
      type: 'staff' as const,
    }))
    const stu = activeStudents.map((s) => ({
      id: s.id,
      name: isBn ? (s.nameBn || s.nameEn) : s.nameEn,
      nameEn: s.nameEn,
      photo: s.photo || '',
      type: 'student' as const,
    }))
    return [...staff, ...stu]
  }, [activeTeachers, activeStudents, isBn])

  const filteredPeople = useMemo(() => {
    if (!regSearch) return allPeople
    const q = regSearch.toLowerCase()
    return allPeople.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
  }, [allPeople, regSearch])

  const handleDeleteFace = (staffId: string) => {
    const updated = registeredFaces.filter((f) => f.staffId !== staffId)
    setRegisteredFaces(updated)
    saveFaces(updated)
    logAuditEvent({ type: 'deleted', personId: staffId })
  }

  const handlePunch = (staffId: string, _staffName: string, _photo: string, punchType: 'in' | 'out', time: string) => {
    const existing = attendance[date]?.[staffId]
    const punches = existing?.punches || []
    const punchesNew = [...punches, { time, type: punchType }]
    const status = punchType === 'in' ? 'present' : existing?.status || 'present'
    const updatedAttendance = {
      ...attendance,
      [date]: {
        ...attendance[date],
        [staffId]: { status: status as AttendanceStatus, punches: punchesNew },
      },
    }
    useTeacherStore.setState({ attendance: updatedAttendance })
  }

  const selectedPerson = allPeople.find((p) => p.id === selectedStaff)

  return (
    <>
      {regPopupOpen && selectedPerson && (
        <RegistrationPopup
          isBn={isBn}
          person={selectedPerson}
          existingFaces={registeredFaces}
          onEnrolled={setRegisteredFaces}
          onClose={() => { setRegPopupOpen(false); setSelectedStaff(''); setRegSearch('') }}
        />
      )}

      {attendanceOpen && (
        <AttendancePopup
          isBn={isBn}
          date={date}
          registeredFaces={registeredFaces}
          institution={institution}
          onPunch={handlePunch}
          onClose={() => setAttendanceOpen(false)}
        />
      )}

      {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
        <div className="mb-4 py-3 px-4 rounded-xl bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] font-medium text-center">
          <span className="font-bold">🔒 {isBn ? 'HTTPS প্রয়োজন!' : 'HTTPS Required!'}</span>
          <br />
          {isBn ? 'বায়োমেট্রিক কাজ করতে https:// দিয়ে খুলুন।' : 'Open with https:// for camera to work.'}
        </div>
      )}

      <div className={`mb-4 py-3 px-4 rounded-xl text-[0.75rem] font-medium text-center ${
        faceApiLoaded
          ? 'bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)]'
          : faceApiError
            ? 'bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)]'
            : 'bg-[var(--amber-light)] border border-[var(--amber)] text-[var(--amber)]'
      }`}>
        {faceApiLoaded
          ? (isBn ? 'মডেল লোডেড — লাইভনেস চেক সক্রিয়' : 'Model loaded — Liveness check active')
          : faceApiError
            ? faceApiError
            : (isBn ? 'মডেল লোড হচ্ছে...' : 'Loading model...')}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setKioskMode('register'); setAttendanceOpen(false) }}
          className={`flex-1 py-2.5 rounded-lg text-[0.8125rem] font-semibold border transition-all ${kioskMode === 'register' ? 'bg-[var(--green)] text-white border-[var(--green)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--green)]'}`}
        >
          <span className="flex items-center justify-center gap-2">
            <ScanFace size={16} />
            {isBn ? 'মুখ নিবন্ধন' : 'Register Face'}
          </span>
        </button>
        <button
          onClick={() => { setKioskMode('attendance'); setAttendanceOpen(true) }}
          className={`flex-1 py-2.5 rounded-lg text-[0.8125rem] font-semibold border transition-all ${kioskMode === 'attendance' ? 'bg-[var(--teal)] text-white border-[var(--teal)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--teal)]'}`}
        >
          <span className="flex items-center justify-center gap-2">
            <ScanFace size={16} />
            {isBn ? 'উপস্থিতি নিন' : 'Take Attendance'}
          </span>
        </button>
      </div>

      {kioskMode === 'register' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {isBn ? 'মুখ নিবন্ধন' : 'Register Face'}
              </div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                {isBn ? 'লাইভনেস চেক + বহু-কোণ ক্যাপচার' : 'Liveness check + multi-angle capture'}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2">
                  <span className="text-[var(--text-muted)] shrink-0">🔍</span>
                  <input
                    value={regSearch}
                    onChange={(e) => { setRegSearch(e.target.value); setSelectedStaff(''); setHighlightedIdx(-1) }}
                    onKeyDown={(e) => {
                      if (!regSearch || selectedStaff) return
                      const max = Math.min(filteredPeople.length, 20) - 1
                      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIdx((p) => (p < max ? p + 1 : 0)) }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIdx((p) => (p > 0 ? p - 1 : max)) }
                      else if (e.key === 'Enter' && highlightedIdx >= 0 && highlightedIdx <= max) {
                        e.preventDefault()
                        const p = filteredPeople[highlightedIdx]
                        if (p) { setSelectedStaff(p.id); setRegSearch(p.name); setHighlightedIdx(-1) }
                      }
                      else if (e.key === 'Escape') setHighlightedIdx(-1)
                    }}
                    placeholder={isBn ? 'নাম, আইডি লিখুন...' : 'Type name or ID...'}
                    className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
                  />
                  {regSearch && (
                    <button onClick={() => { setRegSearch(''); setSelectedStaff('') }} className="border-none bg-transparent cursor-pointer text-[var(--text-muted)]">✕</button>
                  )}
                </div>
                {regSearch && !selectedStaff && filteredPeople.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-[14rem] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl">
                    {filteredPeople.slice(0, 20).map((p, idx) => {
                      const registered = registeredFaces.find((f) => f.staffId === p.id)
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedStaff(p.id); setRegSearch(p.name) }}
                          onMouseEnter={() => setHighlightedIdx(idx)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer border-none ${idx === highlightedIdx ? 'bg-[var(--brand-light)]' : 'bg-transparent hover:bg-[var(--bg-secondary)]'}`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                            {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" />
                              : p.type === 'staff' ? <User size={12} className="text-[var(--text-muted)]" />
                                : <GraduationCap size={12} className="text-[var(--text-muted)]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">
                              {p.name}{registered && <span className="text-[var(--green)] ml-1">✓</span>}
                            </div>
                            <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{p.id}</div>
                          </div>
                          <span className={`text-[0.4375rem] px-1.5 py-0.5 rounded font-semibold ${p.type === 'student' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--brand-light)] text-[var(--brand)]'}`}>
                            {p.type === 'student' ? 'STU' : 'STAFF'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {selectedStaff && (
                <button
                  onClick={() => setRegPopupOpen(true)}
                  className="w-full py-2.5 rounded-lg text-[0.75rem] font-semibold bg-[var(--green)] text-white border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <ScanFace size={14} />
                  {isBn ? 'ক্যামেরা খুলুন' : 'Open Camera'}
                </button>
              )}
            </div>
          </div>

          <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] flex flex-col justify-center items-center text-center min-h-[12rem] p-6">
            <ScanFace size={40} className="text-[var(--text-muted)] mb-3 opacity-30" />
            <div className="text-[0.875rem] font-semibold text-[var(--text-secondary)] mb-1">
              {isBn ? 'উন্নত মুখ সনাক্তকরণ' : 'Advanced Face Detection'}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] max-w-[16rem]">
              {isBn
                ? 'লাইভনেস চেক, বহু-কোণ ক্যাপচার, মান নিয়ন্ত্রণ, এনক্রিপ্টেড সংরক্ষণ'
                : 'Liveness check, multi-angle capture, quality control, encrypted storage'}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-[var(--brand)]" />
                <span className="text-[0.6875rem] text-[var(--text-muted)]">{activeTeachers.length} {isBn ? 'স্টাফ' : 'Staff'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap size={13} className="text-[var(--green)]" />
                <span className="text-[0.6875rem] text-[var(--text-muted)]">{activeStudents.length} {isBn ? 'শিক্ষার্থী' : 'Students'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <RegisteredFacesTable
          isBn={isBn}
          faces={registeredFaces}
          date={date}
          attendance={attendance}
          search={search}
          onSearchChange={setSearch}
          onDelete={handleDeleteFace}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <AuditLog isBn={isBn} />
        <ExportImport
          isBn={isBn}
          faces={registeredFaces}
          onImport={setRegisteredFaces}
        />
      </div>
    </>
  )
}
