import React, { useState, useCallback, useMemo } from 'react'
import { CheckCircle, Info, Trash2, Plus, Upload, Check, Calendar } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import type { StudentAdmission } from './types'

interface Row {
  id: string
  nameEn: string
  nameBn: string
  dob: string
  gender: string
  class: string
  section: string
  phone: string
}

function makeRow(nextNum: number): Row {
  const year = new Date().getFullYear()
  return {
    id: `ET-${year}-${String(10000 + nextNum).padStart(5, '0')}`,
    nameEn: '',
    nameBn: '',
    dob: '',
    gender: '',
    class: '',
    section: '',
    phone: '',
  }
}

interface CellProps {
  value: string
  onChange: (v: string) => void
  type?: string
  options?: string[]
  placeholder?: string
}
const Cell = React.memo(function Cell({ value, onChange, type = 'text', options, placeholder }: CellProps) {
  const cls =
    'w-full px-2 py-1.5 rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] outline-none'
  if (options)
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} cursor-pointer`}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
      onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  )
})

export default function BulkAdmission() {
  const addStudent = useAdmissionStore((s) => s.addStudent)
  const existing = useAdmissionStore((s) => s.students)
  const { classes, institution } = useClassStore()
  const isBn = useBn()

  const currentSession = institution.currentSession
  const sessions = institution.sessions

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [rows, setRows] = useState<Row[]>(() => {
    const base = existing.length
    return [makeRow(base + 1), makeRow(base + 2), makeRow(base + 3)]
  })
  const [done, setDone] = useState(false)
  const [count, setCount] = useState(0)
  const [session, setSession] = useState(currentSession)

  const update = useCallback((i: number, key: keyof Row, val: string) => {
    setRows((p) => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)))
  }, [])

  const addRow = useCallback(() => {
    setRows((p) => [...p, makeRow(existing.length + p.length + 1)])
  }, [existing.length])

  const removeRow = useCallback((i: number) => {
    setRows((p) => p.filter((_, idx) => idx !== i))
  }, [])

  const handleSubmit = useCallback(() => {
    const valid = rows.filter((r) => r.nameEn && r.class && r.phone)
    if (valid.length === 0) return alert(isBn ? 'কমপক্ষে ১টি সম্পূর্ণ সারি দরকার' : 'At least 1 complete row required')
    const now = new Date().toISOString().split('T')[0]
    valid.forEach((r) => {
      addStudent({
        id: r.id,
        createdAt: now,
        updatedAt: now,
        status: 'pending',
        photo: '',
        nameEn: r.nameEn,
        nameBn: r.nameBn,
        dob: r.dob,
        gender: r.gender,
        bloodGroup: '',
        religion: '',
        nationality: 'Bangladeshi',
        phone: r.phone,
        email: '',
        class: r.class,
        section: r.section,
        roll: '',
        academicYear: session,
        previousSchool: '',
        admissionDate: now,
        presentAddress: '',
        permanentAddress: '',
        district: '',
        fatherNameEn: '',
        fatherNameBn: '',
        fatherOccupation: '',
        fatherPhone: '',
        fatherNid: '',
        motherNameEn: '',
        motherNameBn: '',
        motherOccupation: '',
        motherPhone: '',
        motherNid: '',
        guardianName: '',
        guardianRelation: '',
        guardianPhone: '',
      } as StudentAdmission)
      console.log(`📱 SMS → ${r.phone}: আবেদন ID ${r.id}`)
    })
    setCount(valid.length)
    setDone(true)
  }, [rows, addStudent, isBn])

  if (done)
    return (
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-10 text-center">
        <div className="w-[3.75rem] h-[3.75rem] rounded-full bg-[var(--green-light)] flex items-center justify-center mx-auto mb-[0.875rem]">
          <CheckCircle size={30} className="text-[var(--green)]" />
        </div>
        <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)] mb-2">
          {isBn ? `${count} জন ছাত্র ভর্তি হয়েছে!` : `${count} Students Submitted!`}
        </h2>
        <p className="text-[0.8125rem] text-[var(--teal)] mb-5">✅ {isBn ? 'সকলের নম্বরে SMS পাঠানো হয়েছে' : 'SMS sent to all numbers'}</p>
        <button
          onClick={() => {
            setDone(false)
            setRows([makeRow(existing.length + 1)])
          }}
          className="px-5 py-2.5 rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-medium cursor-pointer font-[inherit]"
        >
          {isBn ? 'আবার করুন' : 'Do Again'}
        </button>
      </div>
    )

  const cols = [
    { key: 'nameEn', bn: 'নাম (EN)', en: 'Name (EN)', w: '9.375rem' },
    { key: 'nameBn', bn: 'নাম (BN)', en: 'Name (BN)', w: '8.125rem' },
    { key: 'dob', bn: 'জন্ম তারিখ', en: 'DOB', w: '7.5rem', type: 'date' },
    { key: 'gender', bn: 'লিঙ্গ', en: 'Gender', w: '6.25rem', opts: ['Male / পুরুষ', 'Female / মহিলা'] },
    { key: 'class', bn: 'শ্রেণি', en: 'Class', w: '5.625rem', opts: classOptions },
    { key: 'section', bn: 'সেকশন', en: 'Section', w: '5rem', opts: [] },
    { key: 'phone', bn: 'মোবাইল', en: 'Mobile', w: '7.5rem', type: 'tel' },
  ]

  return (
    <div>
      <div className="flex items-center gap-2.5 bg-[var(--brand-light)] border border-[var(--brand)] rounded-[0.625rem] px-3.5 py-2.5 mb-3">
        <Info size={16} className="text-[var(--brand)] shrink-0" />
        <p className="text-[0.8125rem] text-[var(--brand)]">
          {isBn ? 'প্রয়োজনীয় তথ্য দিন। বিস্তারিত পরে আপডেট করা যাবে।' : 'Enter essential info. Details can be updated later.'}
        </p>
      </div>

      {/* Session Selector */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[var(--brand)]" />
          <span className="text-[0.75rem] font-medium text-[var(--text-secondary)]">
            {isBn ? 'সেশন' : 'Session'}:
          </span>
        </div>
        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-[0.75rem] border border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] outline-none cursor-pointer font-medium"
        >
          {sessions.map((s) => (
            <option key={s} value={s}>
              {s} {s === currentSession ? (isBn ? '(সক্রিয়)' : '(Active)') : ''}
            </option>
          ))}
        </select>
        <span className="text-[0.625rem] text-[var(--text-muted)]">
          {isBn ? 'সকল ছাত্র এই সেশনে ভর্তি হবে' : 'All students will be admitted to this session'}
        </span>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden mb-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.75rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="px-2.5 py-2.5 text-left text-[var(--text-muted)] text-[0.6875rem] font-semibold w-[2.25rem]">#</th>
                <th className="px-2.5 py-2.5 text-left text-[var(--text-muted)] text-[0.6875rem] font-semibold min-w-[9.6875rem]">
                  {isBn ? 'ছাত্র আইডি' : 'Student ID'}
                </th>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className="px-2 py-2.5 text-left text-[var(--text-muted)] text-[0.6875rem] font-semibold"
                    style={{ minWidth: c.w }}
                  >
                    {isBn ? c.bn : c.en} <span className="text-[var(--red)]">*</span>
                  </th>
                ))}
                <th className="w-[2.5rem]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b border-[var(--border)] border-b-[0.0313rem]">
                  <td className="px-2.5 py-[0.4375rem] text-[var(--text-muted)] font-semibold text-[0.75rem]">{i + 1}</td>
                  <td className="px-2.5 py-[0.4375rem]">
                    <span className="text-[0.6875rem] font-mono text-[var(--brand)] bg-[var(--brand-light)] px-[0.4375rem] py-[0.1875rem] rounded-[0.3125rem]">
                      {row.id}
                    </span>
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className="px-1.5 py-[0.3125rem]">
                      <Cell
                        value={(row as any)[c.key]}
                        onChange={(v) => update(i, c.key as keyof Row, v)}
                        type={c.type}
                        options={c.key === 'section' ? sectionsMap[row.class] || [] : c.opts}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-[0.3125rem] text-center">
                    {rows.length > 1 && (
                      <button
                        onClick={() => removeRow(i)}
                        type="button"
                        className="w-[1.625rem] h-[1.625rem] rounded-[0.4375rem] bg-[var(--red-light)] border-none cursor-pointer flex items-center justify-center text-[var(--red)]"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2.5">
        <button
          onClick={addRow}
          type="button"
          className="flex items-center gap-1.5 px-4 py-[0.5625rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-dashed border-[var(--brand)] text-[var(--brand)] text-[0.8125rem] cursor-pointer font-[inherit] font-medium"
        >
          <Plus size={14} />
          {isBn ? 'সারি যোগ করুন' : 'Add Row'}
        </button>
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 px-3.5 py-[0.5625rem] rounded-[0.5625rem] bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.8125rem] cursor-pointer font-medium">
            <Upload size={14} />
            {isBn ? 'CSV আপলোড' : 'CSV Upload'}
            <input type="file" accept=".csv" className="hidden" />
          </label>
          <button
            onClick={handleSubmit}
            type="button"
            className="flex items-center gap-1.5 px-5 py-[0.5625rem] rounded-[0.5625rem] bg-[var(--brand)] border-none text-white text-[0.8125rem] font-semibold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
          >
            <Check size={14} />
            {isBn ? `${rows.length} জনকে ভর্তি করুন` : `Admit ${rows.length} Students`}
          </button>
        </div>
      </div>
    </div>
  )
}
