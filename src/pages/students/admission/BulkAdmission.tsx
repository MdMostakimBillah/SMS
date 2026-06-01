import React, { useState, useCallback, useMemo } from 'react'
import { CheckCircle, Info, Trash2, Plus, Upload, Check } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import type { StudentAdmission } from './types'

interface Row {
  id: string; nameEn: string; nameBn: string; dob: string
  gender: string; class: string; section: string; phone: string
}

function makeRow(nextNum: number): Row {
  const year = new Date().getFullYear()
  return {
    id: `ET-${year}-${String(10000 + nextNum).padStart(5, '0')}`,
    nameEn: '', nameBn: '', dob: '', gender: '', class: '', section: '', phone: '',
  }
}

// ✅ OUTSIDE parent — fixes input focus
interface CellProps {
  value: string; onChange: (v: string) => void
  type?: string; options?: string[]; placeholder?: string
}
const Cell = React.memo(function Cell({ value, onChange, type = 'text', options, placeholder }: CellProps) {
  const s: React.CSSProperties = {
    width: '100%', padding: '6px 8px', borderRadius: '7px',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
  }
  if (options) return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s, cursor: 'pointer' }}>
      <option value="">—</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  return (
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={s}
      onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
  )
})

export default function BulkAdmission() {
  const { language } = useAppStore()
  const { addStudent, students: existing } = useAdmissionStore()
  const { classes } = useClassStore()
  const isBn = language === 'bn'

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [rows, setRows] = useState<Row[]>(() => {
    const base = existing.length
    return [makeRow(base + 1), makeRow(base + 2), makeRow(base + 3)]
  })
  const [done, setDone] = useState(false)
  const [count, setCount] = useState(0)

  const update = useCallback((i: number, key: keyof Row, val: string) => {
    setRows(p => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }, [])

  const addRow = useCallback(() => {
    setRows(p => [...p, makeRow(existing.length + p.length + 1)])
  }, [existing.length])

  const removeRow = useCallback((i: number) => {
    setRows(p => p.filter((_, idx) => idx !== i))
  }, [])

  const handleSubmit = useCallback(() => {
    const valid = rows.filter(r => r.nameEn && r.class && r.phone)
    if (valid.length === 0) return alert(isBn ? 'কমপক্ষে ১টি সম্পূর্ণ সারি দরকার' : 'At least 1 complete row required')
    const now = new Date().toISOString().split('T')[0]
    valid.forEach(r => {
      addStudent({
        id: r.id, createdAt: now, updatedAt: now, status: 'pending',
        photo: '', nameEn: r.nameEn, nameBn: r.nameBn, dob: r.dob,
        gender: r.gender, bloodGroup: '', religion: '', nationality: 'Bangladeshi',
        phone: r.phone, email: '', class: r.class, section: r.section,
        roll: '', academicYear: '2025-26', previousSchool: '',
        admissionDate: now, presentAddress: '', permanentAddress: '', district: '',
        fatherNameEn: '', fatherNameBn: '', fatherOccupation: '', fatherPhone: '', fatherNid: '',
        motherNameEn: '', motherNameBn: '', motherOccupation: '', motherPhone: '', motherNid: '',
        guardianName: '', guardianRelation: '', guardianPhone: '',
      } as StudentAdmission)
      console.log(`📱 SMS → ${r.phone}: আবেদন ID ${r.id}`)
    })
    setCount(valid.length)
    setDone(true)
  }, [rows, addStudent, isBn])

  if (done) return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <CheckCircle size={30} style={{ color: 'var(--green)' }} />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {isBn ? `${count} জন ছাত্র ভর্তি হয়েছে!` : `${count} Students Submitted!`}
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--teal)', marginBottom: '20px' }}>
        ✅ {isBn ? 'সকলের নম্বরে SMS পাঠানো হয়েছে' : 'SMS sent to all numbers'}
      </p>
      <button onClick={() => { setDone(false); setRows([makeRow(existing.length + 1)]) }}
        style={{ padding: '10px 20px', borderRadius: '9px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
        {isBn ? 'আবার করুন' : 'Do Again'}
      </button>
    </div>
  )

  const cols = [
    { key: 'nameEn',  bn: 'নাম (EN)',     en: 'Name (EN)',  w: '150px' },
    { key: 'nameBn',  bn: 'নাম (BN)',     en: 'Name (BN)',  w: '130px' },
    { key: 'dob',     bn: 'জন্ম তারিখ',  en: 'DOB',        w: '120px', type: 'date' },
    { key: 'gender',  bn: 'লিঙ্গ',        en: 'Gender',     w: '100px', opts: ['Male / পুরুষ', 'Female / মহিলা'] },
    { key: 'class',   bn: 'শ্রেণি',       en: 'Class',      w: '90px',  opts: classOptions },
    { key: 'section', bn: 'সেকশন',        en: 'Section',    w: '80px',  opts: [] },
    { key: 'phone',   bn: 'মোবাইল',       en: 'Mobile',     w: '120px', type: 'tel' },
  ]

  return (
    <div>
      {/* Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
        <Info size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <p style={{ fontSize: '13px', color: 'var(--brand)' }}>
          {isBn ? 'প্রয়োজনীয় তথ্য দিন। বিস্তারিত পরে আপডেট করা যাবে।' : 'Enter essential info. Details can be updated later.'}
        </p>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 10px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, width: '36px' }}>#</th>
                <th style={{ padding: '10px 10px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, minWidth: '155px' }}>
                  {isBn ? 'ছাত্র আইডি' : 'Student ID'}
                </th>
                {cols.map(c => (
                  <th key={c.key} style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, minWidth: c.w }}>
                    {isBn ? c.bn : c.en} <span style={{ color: 'var(--red)' }}>*</span>
                  </th>
                ))}
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '7px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px' }}>{i + 1}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--brand)', background: 'var(--brand-light)', padding: '3px 7px', borderRadius: '5px' }}>
                      {row.id}
                    </span>
                  </td>
                  {cols.map(c => (
                    <td key={c.key} style={{ padding: '5px 6px' }}>
                      <Cell
                        value={(row as any)[c.key]}
                        onChange={v => update(i, c.key as keyof Row, v)}
                        type={c.type}
                        options={c.key === 'section' ? (sectionsMap[row.class] || []) : c.opts}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(i)} type="button"
                        style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'var(--red-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
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

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={addRow} type="button"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px dashed var(--brand)', color: 'var(--brand)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
          <Plus size={14} />
          {isBn ? 'সারি যোগ করুন' : 'Add Row'}
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', background: 'var(--green-light)', border: '1px solid var(--green)', color: 'var(--green)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
            <Upload size={14} />
            {isBn ? 'CSV আপলোড' : 'CSV Upload'}
            <input type="file" accept=".csv" style={{ display: 'none' }} />
          </label>
          <button onClick={handleSubmit} type="button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '9px', background: 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            <Check size={14} />
            {isBn ? `${rows.length} জনকে ভর্তি করুন` : `Admit ${rows.length} Students`}
          </button>
        </div>
      </div>
    </div>
  )
}
