import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, X, AlertCircle, Search, ChevronDown, BedDouble, Check } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useHostelStore, type HostelAssignment } from '@/store/hostelStore'
import { MONTH_NAMES, MONTH_NAMES_BN } from '@/store/transportStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { labelCls } from '@/pages/hr/utils'
import { getAvatarGradient, toBnNum } from '@/lib/i18n'

const inputFieldCls =
  'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'
const selectFieldCls = `${inputFieldCls} appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.75rem_center] bg-[size:12px]`

interface Props {
  existing?: HostelAssignment | null
  onSaved: () => void
  onClose: () => void
}

export function AssignmentModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { rooms, assignments, addAssignment, updateAssignment } = useHostelStore()
  const students = useSessionStudents()
  const currentSession = useClassStore((s) => s.institution.currentSession) || '2025-26'
  const sessions = useClassStore((s) => s.institution.sessions) || [currentSession]

  const searchRef = useRef<HTMLInputElement>(null)
  const activeRooms = useMemo(() => rooms.filter((r) => r.isActive), [rooms])

  const [studentId, setStudentId] = useState(existing?.studentId || '')
  const [roomId, setRoomId] = useState(existing?.roomId || '')
  const [bedNumber, setBedNumber] = useState(existing?.bedNumber || '')
  const [monthlyRent, setMonthlyRent] = useState(existing?.monthlyRent?.toString() || '')
  const [academicYear, setAcademicYear] = useState(existing?.academicYear || currentSession)
  const [months, setMonths] = useState<number[]>(
    existing?.months && existing.months.length > 0 ? [...existing.months] : []
  )
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedRoom = useMemo(() => activeRooms.find((r) => r.id === roomId), [activeRooms, roomId])

  const assignedStudentIds = useMemo(
    () => assignments.filter((a) => a.isActive && a.id !== existing?.id).map((a) => a.studentId),
    [assignments, existing?.id]
  )

  const studentClasses = useMemo(() => {
    const classSet = new Set(students.filter((s) => s.status === 'approved' && s.active !== false).map((s) => s.class))
    return Array.from(classSet).sort()
  }, [students])

  const studentSections = useMemo(() => {
    if (!filterClass) return []
    const sectionSet = new Set(
      students.filter((s) => s.status === 'approved' && s.active !== false && s.class === filterClass).map((s) => s.section)
    )
    return Array.from(sectionSet).sort()
  }, [students, filterClass])

  const filteredStudents = useMemo(() => {
    let list = students.filter((s) => s.status === 'approved' && s.active !== false && !assignedStudentIds.includes(s.id))
    if (filterClass) list = list.filter((s) => s.class === filterClass)
    if (filterSection) list = list.filter((s) => s.section === filterSection)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (s) => s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(q) || s.id.toLowerCase().includes(q) || s.roll.includes(q)
      )
    }
    return list.sort((a, b) => a.nameEn.localeCompare(b.nameEn))
  }, [students, assignedStudentIds, filterClass, filterSection, searchQuery])

  const assignedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])

  const fareValue = useMemo(() => Number(monthlyRent) || 0, [monthlyRent])
  const totalCost = useMemo(() => fareValue * months.length, [fareValue, months.length])
  const allMonthsSelected = months.length === 12

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelectStudent = (id: string) => {
    setStudentId(id)
    setShowDropdown(false)
    setSearchQuery('')
    setErrors((p) => ({ ...p, student: false }))
  }

  const handleRoomChange = (id: string) => {
    setRoomId(id)
    setBedNumber('')
    const room = activeRooms.find((r) => r.id === id)
    if (room) setMonthlyRent(room.monthlyRent.toString())
    setErrors((p) => ({ ...p, room: false }))
  }

  const toggleMonth = (idx: number) => {
    setMonths((prev) => prev.includes(idx) ? prev.filter((m) => m !== idx) : [...prev, idx].sort((a, b) => a - b))
    setErrors((p) => ({ ...p, months: false }))
  }

  const toggleAllMonths = () => {
    setMonths(allMonthsSelected ? [] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    setErrors((p) => ({ ...p, months: false }))
  }

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!studentId) e.student = true
    if (!roomId) e.room = true
    if (months.length === 0) e.months = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const data: HostelAssignment = {
      id: existing?.id || `HA-${Date.now()}`,
      studentId,
      roomId,
      bedNumber: bedNumber.trim(),
      monthlyRent: fareValue,
      academicYear,
      months,
      assignedDate: existing?.assignedDate || new Date().toISOString().split('T')[0],
      isActive: existing?.isActive ?? true,
    }
    if (existing) {
      updateAssignment(existing.id, data)
    } else {
      addAssignment(data)
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-[50rem] max-h-[92vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden [animation:modalPopIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/25">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {existing ? (bn ? 'বরাদ্দ আপডেট' : 'Update Assignment') : (bn ? 'ছাত্রকে হোস্টেলে বরাদ্দ করুন' : 'Assign Student to Hostel')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                {existing ? (bn ? 'বরাদ্দ তথ্য আপডেট করুন' : 'Update assignment details') : (bn ? 'ছাত্রকে রুমে বরাদ্দ করুন' : 'Assign a student to a room')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[calc(92vh-8rem)] pb-8">
          {/* Student Selection */}
          <div>
            <label className={labelCls}>{bn ? 'ছাত্র নির্বাচন' : 'Select Student'}<span className="text-red-400 ml-0.5">*</span></label>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1 block">{bn ? 'শ্রেণি ফিল্টার' : 'Filter by Class'}</label>
                <select
                  value={filterClass}
                  onChange={(e) => { setFilterClass(e.target.value); setFilterSection('') }}
                  className={selectFieldCls}
                >
                  <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
                  {studentClasses.map((c) => (
                    <option key={c} value={c}>{bn ? `শ্রেণি ${c}` : `Class ${c}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1 block">{bn ? 'সেকশন ফিল্টার' : 'Filter by Section'}</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className={selectFieldCls}
                  disabled={!filterClass}
                >
                  <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                  {studentSections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  className={`${inputFieldCls} pl-9 pr-8 ${errors.student ? 'border-red-400' : ''}`}
                  placeholder={bn ? 'ছাত্রের নাম, ID বা রোল দিয়ে খুঁজুন...' : 'Search by name, ID or roll...'}
                />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>

              {assignedStudent && !showDropdown && (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-[var(--brand)]/5 border border-[var(--brand)]/20">
                  {assignedStudent.photo ? (
                    <img src={assignedStudent.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[0.875rem] shrink-0" style={{ background: getAvatarGradient(assignedStudent.id) }}>
                      {(assignedStudent.nameEn || '?')[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{bn ? assignedStudent.nameBn : assignedStudent.nameEn}</div>
                    <div className="text-[0.6875rem] text-[var(--text-secondary)]">{assignedStudent.class} - {assignedStudent.section} · {bn ? 'রোল' : 'Roll'}: {assignedStudent.roll}</div>
                  </div>
                  <button
                    onClick={() => { setStudentId(''); setSearchQuery('') }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-xl max-h-[280px] overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-[0.8125rem] text-[var(--text-muted)]">{bn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-3 py-2 border-b border-[var(--border)]">
                        <span className="text-[0.6875rem] text-[var(--text-muted)]">
                          {bn ? `${filteredStudents.length} জন ছাত্র পাওয়া গেছে` : `${filteredStudents.length} students found`}
                        </span>
                      </div>
                      {filteredStudents.slice(0, 50).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudent(s.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
                        >
                          {s.photo ? (
                            <img src={s.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[0.75rem] shrink-0" style={{ background: getAvatarGradient(s.id) }}>
                              {(s.nameEn || '?')[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">{bn ? s.nameBn : s.nameEn}</div>
                            <div className="text-[0.6875rem] text-[var(--text-secondary)]">{s.class} - {s.section} · {bn ? 'রোল' : 'Roll'}: {s.roll} · {s.id}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {errors.student && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'ছাত্র নির্বাচন করুন' : 'Select a student'}</p>}
          </div>

          {/* Room & Bed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{bn ? 'রুম' : 'Room'}<span className="text-red-400 ml-0.5">*</span></label>
              <select
                value={roomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className={`${selectFieldCls} ${errors.room ? 'border-red-400' : ''}`}
              >
                <option value="">{bn ? 'রুম নির্বাচন করুন' : 'Select a room'}</option>
                {activeRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.roomNumber} — {bn ? r.nameBn : r.name} (৳{r.monthlyRent})</option>
                ))}
              </select>
              {errors.room && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'রুম নির্বাচন করুন' : 'Select a room'}</p>}
            </div>
            <div>
              <label className={labelCls}>{bn ? 'বেড নম্বর' : 'Bed Number'}</label>
              <input
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                className={inputFieldCls}
                placeholder={bn ? 'যেমন: ১' : 'e.g. 1'}
              />
            </div>
          </div>

          {/* Monthly Rent + Room Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{bn ? 'মাসিক ভাড়া (৳)' : 'Monthly Rent (৳)'}</label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className={inputFieldCls}
                min="0"
                placeholder="0"
              />
              {selectedRoom && (
                <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
                  {bn ? 'রুমের ভাড়া: ৳' : 'Room rent: ৳'}{selectedRoom.monthlyRent}
                </p>
              )}
            </div>
            {selectedRoom && (
              <div className="rounded-xl bg-[var(--brand)]/5 border border-[var(--brand)]/20 p-3 flex flex-col justify-center">
                <div className="text-[0.6875rem] text-[var(--text-muted)] uppercase tracking-wider mb-1">{bn ? 'কক্ষ তথ্য' : 'Room Details'}</div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{selectedRoom.name || selectedRoom.nameBn}</div>
                <div className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'ধারণ ক্ষমতা' : 'Capacity'}: {selectedRoom.capacity} {bn ? 'জন' : 'beds'}, {selectedRoom.floor}</div>
              </div>
            )}
          </div>

          {/* Month Selection */}
          <div className={`p-3 rounded-xl border bg-gradient-to-br from-[var(--brand)]/5 via-transparent to-transparent transition-colors mb-2 ${
            errors.months ? 'border-red-400' : 'border-[var(--brand)]/15'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <label className={`${labelCls} mb-0`}>
                {bn ? 'হোস্টেল মাস নির্বাচন' : 'Select Hostel Months'}
                <span className="text-red-400 ml-0.5">*</span>
              </label>
              <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">
                {bn ? `${toBnNum(months.length)}টি মাস নির্বাচিত` : `${months.length} months selected`}
              </span>
            </div>
            <p className="text-[0.6875rem] text-[var(--text-muted)] mb-2">
              {bn ? `শিক্ষাবর্ষ ${academicYear} - কোন মাসে ছাত্রটি হোস্টেলে থাকবে তা নির্বাচন করুন` : `Academic year ${academicYear} — select which months the student will stay`}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className={`${selectFieldCls} !w-auto min-w-[7.5rem] py-2`}
              >
                <option value={currentSession}>{currentSession}</option>
                {sessions.filter((s) => s !== currentSession).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={toggleAllMonths}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold cursor-pointer transition-colors border border-[var(--brand)]/30 bg-[var(--brand)]/8 text-[var(--brand)] hover:bg-[var(--brand)]/15"
              >
                <Check size={13} />
                {allMonthsSelected ? (bn ? 'সব বাদ দিন' : 'Clear all') : (bn ? 'সব মাস নির্বাচন' : 'Select all')}
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {MONTH_NAMES.map((name, idx) => {
                const active = months.includes(idx)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleMonth(idx)}
                    className={`relative py-1.5 px-1.5 rounded-lg text-[0.6875rem] font-semibold cursor-pointer transition-all border flex items-center justify-center gap-1 ${
                      active
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-lg shadow-[var(--brand)]/25'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]'
                    }`}
                  >
                    {active && <Check size={10} className="shrink-0" />}
                    {bn ? MONTH_NAMES_BN[idx] : name}
                  </button>
                )
              })}
            </div>

            {errors.months && (
              <p className="text-[0.6875rem] text-red-400 mt-2 flex items-center gap-1">
                <AlertCircle size={10} />{bn ? 'কমপক্ষে ১টি মাস নির্বাচন করুন' : 'Select at least one month'}
              </p>
            )}
          </div>

          {/* Preview */}
          {assignedStudent && selectedRoom && (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase mb-3">{bn ? 'বরাদ্দ পূর্বরূপ' : 'Assignment Preview'}</div>
              <div className="flex flex-wrap items-center gap-4">
                {assignedStudent.photo ? (
                  <img src={assignedStudent.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[1rem] shrink-0" style={{ background: getAvatarGradient(assignedStudent.id) }}>
                    {(assignedStudent.nameEn || '?')[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? assignedStudent.nameBn : assignedStudent.nameEn}</div>
                  <div className="text-[0.75rem] text-[var(--text-secondary)]">{assignedStudent.class} - {assignedStudent.section} · {bn ? 'রোল' : 'Roll'}: {assignedStudent.roll}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--text-secondary)]"><BedDouble size={11} />{selectedRoom.roomNumber} — {bedNumber || '—'}</span>
                    {months.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--text-secondary)]">
                        {bn ? `${toBnNum(months.length)} মাস` : `${months.length} ${months.length === 1 ? 'month' : 'months'}`}
                        <span className="text-[var(--text-muted)]">
                          ({months.map((m) => (bn ? MONTH_NAMES_BN[m].slice(0, 3) : MONTH_NAMES[m].slice(0, 3))).join(', ')})
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[0.875rem] font-bold text-[var(--brand)]">{selectedRoom.roomNumber}</div>
                  <div className="text-[0.75rem] font-semibold text-[var(--amber)] mt-1">৳{bn ? toBnNum(fareValue) : fareValue.toLocaleString()}/{bn ? 'মাস' : 'mo'}</div>
                </div>
              </div>
              {fareValue > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[0.75rem] text-[var(--text-secondary)]">
                    {bn ? `${toBnNum(months.length)} মাসের মোট খরচ` : `Total for ${months.length} ${months.length === 1 ? 'month' : 'months'}`}
                  </span>
                  <span className="text-[0.9375rem] font-bold text-[var(--brand)]">৳{bn ? toBnNum(totalCost) : totalCost.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!studentId || !roomId}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]"
          >
            <UserPlus size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update') : (bn ? 'বরাদ্দ করুন' : 'Assign Student')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
