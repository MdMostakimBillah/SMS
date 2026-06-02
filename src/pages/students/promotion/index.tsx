import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpCircle, Check, Info, User, Users } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore, useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import type { StudentAdmission } from '@/pages/students/admission/types'

interface RollCellProps {
  value: string; onChange: (v: string) => void; isBn: boolean
}
const RollCell = React.memo(function RollCell({ value, onChange, isBn }: RollCellProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={isBn ? 'রোল' : 'Roll'}
      className="w-[50px] p-[4px_6px] rounded-[6px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] font-mono outline-none text-center"
      onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
    />
  )
})

export default function ClassPromotionPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { updateStudent } = useAdmissionStore()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const isBn = language === 'bn'

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const approved = useMemo(() => students.filter(s => s.status === 'approved'), [students])

  const currentSession = institution.currentSession
  const sessions = institution.sessions
  const nextSession = useMemo(() => {
    const idx = sessions.indexOf(currentSession)
    return sessions[idx + 1] || ''
  }, [sessions, currentSession])

  const [fromClass, setFromClass] = useState('')
  const [fromSection, setFromSection] = useState('')
  const [toClass, setToClass] = useState('')
  const [toSection, setToSection] = useState('')
  const [newSession, setNewSession] = useState(nextSession)
  const [selected, setSelected] = useState<string[]>([])
  const [rollMap, setRollMap] = useState<Record<string, string>>({})
  const [promoted, setPromoted] = useState(false)
  const [promotedCount, setPromotedCount] = useState(0)

  const filtered = useMemo(() => approved.filter(s => {
    if (fromClass && s.class !== fromClass) return false
    if (fromSection && s.section !== fromSection) return false
    return true
  }), [approved, fromClass, fromSection])

  const allSel = filtered.length > 0 && filtered.every(s => selected.includes(s.id))

  const toggleAll = useCallback(() => {
    setSelected(allSel ? [] : filtered.map(s => s.id))
  }, [allSel, filtered])

  const toggleOne = useCallback((id: string) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }, [])

  const updateRoll = useCallback((id: string, val: string) => {
    setRollMap(p => ({ ...p, [id]: val }))
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

    let count = 0
    selected.forEach(id => {
      const newRoll = rollMap[id]
      const updates: Partial<StudentAdmission> = {
        class: toClass,
        section: toSection || undefined,
        academicYear: newSession,
      }
      if (newRoll !== undefined && newRoll.trim() !== '') {
        updates.roll = newRoll.trim()
      }
      updateStudent(id, updates)
      count++
    })

    setPromotedCount(count)
    setPromoted(true)
    setTimeout(() => setPromoted(false), 3000)
  }, [selected, toClass, toSection, newSession, rollMap, updateStudent, isBn])

  return (
    <div>
      <div className="flex items-center gap-[10px] mb-[18px] flex-wrap">
        <button onClick={() => navigate('/students')}
          className="flex items-center gap-[5px] py-[7px] px-[12px] rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-[inherit] shrink-0">
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-[18px]' : 'text-[22px]'}`}>
            {isBn ? 'ক্লাস প্রমোশন' : 'Class Promotion'}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-[3px]">
            {isBn ? `${currentSession} থেকে পরবর্তী সেশনে ছাত্রদের প্রমোট করুন` : `Promote students from ${currentSession} to next session`}
          </p>
        </div>
        <button onClick={promote}
          className={`flex items-center gap-[6px] py-[9px] px-[18px] rounded-[9px] border-none text-white text-[13px] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_12px_rgba(99,102,241,0.3)] ${promoted ? 'bg-[var(--green)]' : 'bg-[var(--brand)]'}`}>
          {promoted ? <Check size={14} /> : <ArrowUpCircle size={14} />}
          {promoted
            ? (isBn ? `✓ ${promotedCount} জন প্রমোট হয়েছে!` : `✓ ${promotedCount} Promoted!`)
            : (isBn ? `${selected.length} জন প্রমোট করুন` : `Promote ${selected.length}`)}
        </button>
      </div>

      <div className={`grid gap-[16px] items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-[300px_1fr]'}`}>

        <div className="flex flex-col gap-[12px]">

          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[12px] p-[14px]">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-[10px]">
              ① {isBn ? 'বর্তমান শ্রেণি' : 'From Class'}
            </div>
            <div className="flex items-center gap-2 mb-[10px] py-[6px] px-3 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]">
              <span className="text-[11px] font-semibold text-[var(--brand)]">{currentSession}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{isBn ? 'বর্তমান সেশন' : 'Current Session'}</span>
            </div>
            <div className="flex flex-col gap-[8px]">
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] mb-[4px] block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                <select value={fromClass} onChange={e => { setFromClass(e.target.value); setSelected([]); setRollMap({}) }} className="w-full py-[7px] px-[10px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer">
                  <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] mb-[4px] block">{isBn ? 'সেকশন' : 'Section'}</label>
                <select value={fromSection} onChange={e => { setFromSection(e.target.value); setSelected([]); setRollMap({}) }} className="w-full py-[7px] px-[10px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer">
                  <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
                  {(sectionsMap[fromClass] || classOptions.flatMap(c => sectionsMap[c] || [])).filter((s, i, a) => a.indexOf(s) === i).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-primary)] border border-[var(--brand)] rounded-[12px] p-[14px]">
            <div className="text-[11px] font-semibold text-[var(--brand)] uppercase tracking-[0.5px] mb-[10px]">
              ② {isBn ? 'লক্ষ্য শ্রেণি' : 'To Class'}
            </div>
            <div className="flex flex-col gap-[8px]">
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] mb-[4px] block">{isBn ? 'শ্রেণি' : 'Class'} <span className="text-[var(--red)]">*</span></label>
                <select value={toClass} onChange={e => setToClass(e.target.value)} className={`w-full py-[7px] px-[10px] rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer ${toClass ? 'border-[var(--brand)]' : 'border-[var(--border)]'}`}>
                  <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] mb-[4px] block">{isBn ? 'সেকশন' : 'Section'}</label>
                <select value={toSection} onChange={e => setToSection(e.target.value)} className="w-full py-[7px] px-[10px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer">
                  <option value="">{isBn ? 'একই সেকশন' : 'Same Section'}</option>
                  {(sectionsMap[toClass] || classOptions.flatMap(c => sectionsMap[c] || [])).filter((s, i, a) => a.indexOf(s) === i).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-secondary)] mb-[4px] block">{isBn ? 'নতুন সেশন' : 'New Session'}</label>
                <select value={newSession} onChange={e => setNewSession(e.target.value)} className="w-full py-[7px] px-[10px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer">
                  <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
                  {sessions.filter(s => s !== currentSession).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {nextSession && newSession !== nextSession && (
                  <p className="text-[10px] text-[var(--amber)] mt-1">{isBn ? `পরবর্তী সেশন: ${nextSession}` : `Next session: ${nextSession}`}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[var(--brand-light)] border border-[var(--brand)] rounded-[12px] p-[14px]">
            <div className="flex items-center gap-[8px] mb-[6px]">
              <Info size={14} className="text-[var(--brand)]" />
              <span className="text-[11px] font-semibold text-[var(--brand)]">{isBn ? 'রোল নম্বর' : 'Roll Numbers'}</span>
            </div>
            <p className="text-[11px] text-[var(--brand)] leading-[1.5]">
              {isBn
                ? 'প্রতিটি ছাত্রের নতুন রোল নম্বর ম্যানুয়ালি লিখুন। টেবিলের "নতুন রোল" কলামে টাইপ করুন।'
                : 'Write new roll numbers manually for each student in the "New Roll" column.'}
            </p>
          </div>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden">
          <div className="py-[10px] px-[14px] border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-[8px]">
              <div className={`w-[8px] h-[8px] rounded-full ${fromClass ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'}`} />
              <span className="text-[13px] font-medium text-[var(--text-primary)]">
                {filtered.length} {isBn ? 'জন ছাত্র' : 'students'}
                {selected.length > 0 && <span className="text-[var(--brand)] ml-[8px]">· {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}</span>}
              </span>
            </div>
            <button onClick={toggleAll}
              className={`py-[5px] px-[10px] rounded-[6px] border cursor-pointer text-[11px] font-[inherit] font-medium ${allSel ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>
              {allSel ? (isBn ? 'সব বাদ' : 'Deselect') : (isBn ? 'সব বাছুন' : 'Select All')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="p-[8px_10px] w-[36px]">
                    <input type="checkbox" checked={allSel} onChange={toggleAll}
                      className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                  </th>
                  <th className="p-[8px_6px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase w-[30px]">#</th>
                  <th className="p-[8px_6px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase w-[38px]">{isBn ? 'ছবি' : 'Photo'}</th>
                  <th className="p-[8px_6px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">{isBn ? 'নাম / আইডি' : 'Name / ID'}</th>
                  <th className="p-[8px_6px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">{isBn ? 'বর্তমান' : 'Current'}</th>
                  <th className="p-[8px_6px] text-left text-[10px] font-semibold text-[var(--brand)] uppercase">{isBn ? 'লক্ষ্য' : 'Target'}</th>
                  <th className="p-[8px_6px] text-left text-[10px] font-semibold text-[var(--amber)] uppercase min-w-[70px]">{isBn ? 'নতুন রোল' : 'New Roll'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-[40px] text-center text-[var(--text-muted)]">
                    <Users size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'উপরে শ্রেণি নির্বাচন করুন' : 'Select a class above to view students'}
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id}
                    className={`border-b-[0.5px] border-[var(--border)] ${selected.includes(s.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                    onMouseEnter={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td className="p-[8px_10px]">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" />
                    </td>
                    <td className="p-[8px_6px] text-[var(--text-muted)] font-semibold text-[11px]">{i + 1}</td>
                    <td className="p-[6px]">
                      <div className="w-[28px] h-[34px] rounded-[5px] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                        {s.photo
                          ? <img src={s.photo} alt="" className="w-full h-full object-cover" />
                          : <User size={12} className="text-[var(--text-muted)]" />}
                      </div>
                    </td>
                    <td className="p-[8px_6px]">
                      <div className="text-xs font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]">{s.nameEn}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{s.id}</div>
                    </td>
                    <td className="p-[8px_6px]">
                      <div className="flex gap-[3px] flex-wrap">
                        <span className="text-[10px] font-semibold py-[2px] px-[6px] rounded-[5px] bg-[var(--brand-light)] text-[var(--brand)]">
                          {s.class}
                        </span>
                        <span className="text-[10px] py-[2px] px-[5px] rounded-[5px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {s.section}
                        </span>
                        {s.roll && <span className="text-[10px] py-[2px] px-[5px] rounded-[5px] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">R{s.roll}</span>}
                      </div>
                    </td>
                    <td className="p-[8px_6px]">
                      {toClass ? (
                        <div className="flex gap-[3px] flex-wrap">
                          <span className="text-[10px] font-semibold py-[2px] px-[6px] rounded-[5px] bg-[var(--green-light)] text-[var(--green)]">
                            {toClass}
                          </span>
                          <span className="text-[10px] py-[2px] px-[5px] rounded-[5px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                            {toSection || s.section}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="p-[8px_6px]">
                      {toClass && (
                        <RollCell
                          value={rollMap[s.id] !== undefined ? rollMap[s.id] : (s.roll || '')}
                          onChange={v => updateRoll(s.id, v)}
                          isBn={isBn}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
