import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpCircle, Check, Info, User, Users } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'

interface RollCellProps {
  value: string
  onChange: (v: string) => void
  isBn: boolean
}
const RollCell = React.memo(function RollCell({ value, onChange, isBn }: RollCellProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isBn ? 'রোল' : 'Roll'}
      className="w-[3.125rem] p-[4px_6px] rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] font-mono outline-none text-center"
      onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  )
})

export default function ClassPromotionPage() {
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const addStudent = useAdmissionStore((s) => s.addStudent)
  const allStudents = useAdmissionStore((s) => s.students)
  const { classes, institution, sessionClasses } = useClassStore()
  const isBn = useBn()

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const currentSession = institution.currentSession
  const sessions = institution.sessions

  const [fSession, setFSession] = useState(currentSession)

  const students = useMemo(
    () => allStudents.filter((s) => s.academicYear === fSession),
    [allStudents, fSession]
  )

  const approved = useMemo(() => students.filter((s) => s.status === 'approved'), [students])

  const [fromClass, setFromClass] = useState('')
  const [fromSection, setFromSection] = useState('')
  const [toClass, setToClass] = useState('')
  const [toSection, setToSection] = useState('')
  const [newSession, setNewSession] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [rollMap, setRollMap] = useState<Record<string, string>>({})
  const [promoted, setPromoted] = useState(false)
  const [promotedCount, setPromotedCount] = useState(0)

  const toClassOptions = useMemo(() => {
    const targetClasses = newSession ? sessionClasses[newSession] || [] : classes
    return getClassOptions(targetClasses)
  }, [newSession, sessionClasses, classes])

  const toSectionsMap = useMemo(() => {
    const targetClasses = newSession ? sessionClasses[newSession] || [] : classes
    return buildSectionsMap(targetClasses)
  }, [newSession, sessionClasses, classes])

  useEffect(() => {
    setToClass('')
    setToSection('')
  }, [newSession])

  const filtered = useMemo(
    () =>
      approved.filter((s) => {
        if (fromClass && s.class !== fromClass) return false
        if (fromSection && s.section !== fromSection) return false
        return true
      }),
    [approved, fromClass, fromSection]
  )

  const allSel = filtered.length > 0 && filtered.every((s) => selected.includes(s.id))

  const toggleAll = useCallback(() => {
    setSelected(allSel ? [] : filtered.map((s) => s.id))
  }, [allSel, filtered])

  const toggleOne = useCallback((id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }, [])

  const updateRoll = useCallback((id: string, val: string) => {
    setRollMap((p) => ({ ...p, [id]: val }))
  }, [])

  const promote = useCallback(() => {
    if (selected.length === 0) {
      alert(isBn ? 'অনুগ্রহ করে কমপক্ষে একজন ছাত্র নির্বাচন করুন' : 'Please select at least one student')
      return
    }
    if (!toClass) {
      alert(isBn ? 'অনুগ্রহ করে লক্ষ্য শ্রেণি নির্বাচন করুন' : 'Please select target class')
      return
    }
    if (!newSession) {
      alert(isBn ? 'অনুগ্রহ করে নতুন সেশন নির্বাচন করুন' : 'Please select new session')
      return
    }

    const now = new Date().toISOString()
    const today = now.split('T')[0]

    // Count existing students in the target session to avoid duplicate IDs
    const sessionPrefix = `ET-${newSession.replace('-', '')}-`
    const existingInSession = allStudents.filter((s) => s.id.startsWith(sessionPrefix))
    let count = existingInSession.length

    selected.forEach((id) => {
      const student = students.find((s) => s.id === id)
      if (!student) return

      const newRoll = rollMap[id]
      // Generate new student ID for the new session (avoid duplicates)
      count++
      const newId = `${sessionPrefix}${String(count).padStart(4, '0')}`

      // Copy all student data to new session
      addStudent({
        ...student,
        id: newId,
        createdAt: now,
        updatedAt: now,
        class: toClass,
        section: toSection || student.section,
        academicYear: newSession,
        roll: newRoll !== undefined && newRoll.trim() !== '' ? newRoll.trim() : student.roll,
        status: 'approved',
        approvedAt: today,
      })
    })

    setPromotedCount(count)
    setPromoted(true)
    setTimeout(() => setPromoted(false), 3000)
  }, [selected, toClass, toSection, newSession, rollMap, students, allStudents, addStudent, isBn])

  return (
    <div>
      <div className="flex items-center gap-[0.625rem] mb-[1.125rem] flex-wrap">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.75rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-[1.125rem]' : 'text-[1.375rem]'}`}>
            {isBn ? 'ক্লাস প্রমোশন' : 'Class Promotion'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? `${fSession} থেকে পরবর্তী সেশনে ছাত্রদের প্রমোট করুন` : `Promote students from ${fSession} to next session`}
          </p>
        </div>
        <button
          onClick={promote}
          className={`flex items-center gap-[0.375rem] py-[0.5625rem] px-[1.125rem] rounded-[0.5625rem] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_12px_rgba(99,102,241,0.3)] ${promoted ? 'bg-[var(--green)]' : 'bg-[var(--brand)]'}`}
        >
          {promoted ? <Check size={14} /> : <ArrowUpCircle size={14} />}
          {promoted
            ? isBn
              ? `✓ ${promotedCount} জন প্রমোট হয়েছে!`
              : `✓ ${promotedCount} Promoted!`
            : isBn
              ? `${selected.length} জন প্রমোট করুন`
              : `Promote ${selected.length}`}
        </button>
      </div>

      <div className={`grid gap-[1rem] items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-[300px_1fr]'}`}>
        <div className="flex flex-col gap-[0.75rem]">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.75rem] p-[0.875rem]">
            <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
              ① {isBn ? 'বর্তমান শ্রেণি' : 'From Class'}
            </div>
            <div className="flex flex-col gap-[0.5rem] mb-[0.625rem]">
              <div>
                <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">{isBn ? 'সেশন' : 'Session'}</label>
                <select
                  value={fSession}
                  onChange={(e) => {
                    setFSession(e.target.value)
                    setSelected([])
                    setRollMap({})
                    setFromClass('')
                    setFromSection('')
                  }}
                  className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] text-xs font-[inherit] outline-none cursor-pointer font-medium"
                >
                  {sessions.map((s) => (
                    <option key={s} value={s}>
                      {s} {s === currentSession ? (isBn ? '(বর্তমান)' : '(Current)') : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-[0.5rem]">
              <div>
                <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                <select
                  value={fromClass}
                  onChange={(e) => {
                    setFromClass(e.target.value)
                    setSelected([])
                    setRollMap({})
                  }}
                  className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer"
                >
                  <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">{isBn ? 'সেকশন' : 'Section'}</label>
                <select
                  value={fromSection}
                  onChange={(e) => {
                    setFromSection(e.target.value)
                    setSelected([])
                    setRollMap({})
                  }}
                  className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer"
                >
                  <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
                  {(sectionsMap[fromClass] || classOptions.flatMap((c) => sectionsMap[c] || []))
                    .filter((s, i, a) => a.indexOf(s) === i)
                    .map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-primary)] border border-[var(--brand)] rounded-[0.75rem] p-[0.875rem]">
            <div className="text-[0.6875rem] font-semibold text-[var(--brand)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
              ② {isBn ? 'লক্ষ্য শ্রেণি' : 'To Class'}
            </div>
            <div className="flex flex-col gap-[0.5rem]">
              <div>
                <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">
                  {isBn ? 'শ্রেণি' : 'Class'} <span className="text-[var(--red)]">*</span>
                </label>
                <select
                  value={toClass}
                  onChange={(e) => setToClass(e.target.value)}
                  className={`w-full py-[0.4375rem] px-[0.625rem] rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer ${toClass ? 'border-[var(--brand)]' : 'border-[var(--border)]'}`}
                >
                  <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
                  {toClassOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">{isBn ? 'সেকশন' : 'Section'}</label>
                <select
                  value={toSection}
                  onChange={(e) => setToSection(e.target.value)}
                  className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer"
                >
                  <option value="">{isBn ? 'একই সেকশন' : 'Same Section'}</option>
                  {(toSectionsMap[toClass] || toClassOptions.flatMap((c) => toSectionsMap[c] || []))
                    .filter((s, i, a) => a.indexOf(s) === i)
                    .map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">{isBn ? 'নতুন সেশন' : 'New Session'}</label>
                <select
                  value={newSession}
                  onChange={(e) => setNewSession(e.target.value)}
                  className={`w-full py-[0.4375rem] px-[0.625rem] rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer ${newSession ? 'border-[var(--brand)]' : 'border-[var(--border)]'}`}
                >
                  <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
                  {sessions.map((s) => (
                    <option key={s} value={s}>
                      {s} {s === currentSession ? (isBn ? '(বর্তমান)' : '(Current)') : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[var(--brand-light)] border border-[var(--brand)] rounded-[0.75rem] p-[0.875rem]">
            <div className="flex items-center gap-[0.5rem] mb-[0.375rem]">
              <Info size={14} className="text-[var(--brand)]" />
              <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">{isBn ? 'প্রমোশন পদ্ধতি' : 'Promotion Method'}</span>
            </div>
            <p className="text-[0.6875rem] text-[var(--brand)] leading-[1.5]">
              {isBn
                ? 'ছাত্রদের ডেটা কপি করা হবে। পূর্ববর্তী সেশনের সকল তথ্য (শ্রেণি, রুটিন, পরীক্ষা, উপস্থিতি) অক্ষুণ্ণ থাকবে। নতুন সেশনে ছাত্র নতুন আইডিসহ যুক্ত হবে।'
                : 'Student data will be copied. Previous session data (class, routine, exams, attendance) remains intact. Student is added to new session with a new ID.'}
            </p>
          </div>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
          <div className="py-[0.625rem] px-[0.875rem] border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-[0.5rem]">
              <div className={`w-[0.5rem] h-[0.5rem] rounded-full ${fromClass ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'}`} />
              <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
                {filtered.length} {isBn ? 'জন ছাত্র' : 'students'}
                {selected.length > 0 && (
                  <span className="text-[var(--brand)] ml-[0.5rem]">
                    · {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={toggleAll}
              className={`py-[0.3125rem] px-[0.625rem] rounded-[0.375rem] border cursor-pointer text-[0.6875rem] font-[inherit] font-medium ${allSel ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
            >
              {allSel ? (isBn ? 'সব বাদ' : 'Deselect') : isBn ? 'সব বাছুন' : 'Select All'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="p-[8px_10px] w-[2.25rem]">
                    <input
                      type="checkbox"
                      checked={allSel}
                      onChange={toggleAll}
                      className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    />
                  </th>
                  <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[1.875rem]">#</th>
                  <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[2.375rem]">
                    {isBn ? 'ছবি' : 'Photo'}
                  </th>
                  <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                    {isBn ? 'নাম / আইডি' : 'Name / ID'}
                  </th>
                  <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                    {isBn ? 'বর্তমান' : 'Current'}
                  </th>
                  <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--brand)] uppercase">
                    {isBn ? 'লক্ষ্য' : 'Target'}
                  </th>
                  <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--amber)] uppercase min-w-[4.375rem]">
                    {isBn ? 'নতুন রোল' : 'New Roll'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-[2.5rem] text-center text-[var(--text-muted)]">
                      <Users size={28} className="block mx-auto mb-2 opacity-30" />
                      {isBn ? 'উপরে শ্রেণি নির্বাচন করুন' : 'Select a class above to view students'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b-[0.0313rem] border-[var(--border)] ${selected.includes(s.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                      onMouseEnter={(e) => {
                        if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                      }}
                      onMouseLeave={(e) => {
                        if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <td className="p-[8px_10px]">
                        <input
                          type="checkbox"
                          checked={selected.includes(s.id)}
                          onChange={() => toggleOne(s.id)}
                          className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                        />
                      </td>
                      <td className="p-[8px_6px] text-[var(--text-muted)] font-semibold text-[0.6875rem]">{i + 1}</td>
                      <td className="p-[0.375rem]">
                        <div className="w-[1.75rem] h-[2.125rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                          {s.photo ? (
                            <img src={s.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={12} className="text-[var(--text-muted)]" />
                          )}
                        </div>
                      </td>
                      <td className="p-[8px_6px]">
                        <div className="text-xs font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[8.75rem]">
                          {s.nameEn}
                        </div>
                        <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">{s.id}</div>
                      </td>
                      <td className="p-[8px_6px]">
                        <div className="flex gap-[0.1875rem] flex-wrap">
                          <span className="text-[0.625rem] font-semibold py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] bg-[var(--brand-light)] text-[var(--brand)]">
                            {s.class}
                          </span>
                          <span className="text-[0.625rem] py-[0.125rem] px-[0.3125rem] rounded-[0.3125rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                            {s.section}
                          </span>
                          {s.roll && (
                            <span className="text-[0.625rem] py-[0.125rem] px-[0.3125rem] rounded-[0.3125rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                              R{s.roll}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-[8px_6px]">
                        {toClass ? (
                          <div className="flex gap-[0.1875rem] flex-wrap">
                            <span className="text-[0.625rem] font-semibold py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] bg-[var(--green-light)] text-[var(--green)]">
                              {toClass}
                            </span>
                            <span className="text-[0.625rem] py-[0.125rem] px-[0.3125rem] rounded-[0.3125rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                              {toSection || s.section}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="p-[8px_6px]">
                        {toClass && (
                          <RollCell
                            value={rollMap[s.id] !== undefined ? rollMap[s.id] : s.roll || ''}
                            onChange={(v) => updateRoll(s.id, v)}
                            isBn={isBn}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
