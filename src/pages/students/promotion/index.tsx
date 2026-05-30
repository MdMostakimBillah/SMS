import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpCircle, Check, Info, User, Users } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import type { StudentAdmission } from '@/pages/students/admission/types'

const CLASSES = ['1','2','3','4','5','6','7','8','9','10']
const SECTIONS = ['A','B','C','D','E']
const SESSIONS = ['2024-25','2025-26','2026-27','2027-28']

// OUTSIDE — prevents input focus loss on re-render
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
      style={{
        width: '50px', padding: '4px 6px', borderRadius: '6px',
        border: '1px solid var(--border)', background: 'var(--bg-secondary)',
        color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'monospace',
        outline: 'none', textAlign: 'center',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
    />
  )
})

export default function ClassPromotionPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { students, updateStudent } = useAdmissionStore()
  const isBn = language === 'bn'

  const approved = useMemo(() => students.filter(s => s.status === 'approved'), [students])

  const [fromClass, setFromClass] = useState('')
  const [fromSection, setFromSection] = useState('')
  const [toClass, setToClass] = useState('')
  const [toSection, setToSection] = useState('')
  const [newSession, setNewSession] = useState('2026-27')
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

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/students')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit', flexShrink: 0 }}>
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'ক্লাস প্রমোশন' : 'Class Promotion'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {isBn ? 'পরবর্তী শ্রেণিতে ছাত্রদের প্রমোট করুন' : 'Promote students to the next class'}
          </p>
        </div>
        <button onClick={promote}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '9px', background: promoted ? 'var(--green)' : 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          {promoted ? <Check size={14} /> : <ArrowUpCircle size={14} />}
          {promoted
            ? (isBn ? `✓ ${promotedCount} জন প্রমোট হয়েছে!` : `✓ ${promotedCount} Promoted!`)
            : (isBn ? `${selected.length} জন প্রমোট করুন` : `Promote ${selected.length}`)}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Left: Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* From class */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              ① {isBn ? 'বর্তমান শ্রেণি' : 'From Class'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>{isBn ? 'শ্রেণি' : 'Class'}</label>
                <select value={fromClass} onChange={e => { setFromClass(e.target.value); setSelected([]); setRollMap({}) }} style={inp}>
                  <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
                  {CLASSES.map(c => <option key={c} value={c}>{isBn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>{isBn ? 'সেকশন' : 'Section'}</label>
                <select value={fromSection} onChange={e => { setFromSection(e.target.value); setSelected([]); setRollMap({}) }} style={inp}>
                  <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* To class */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--brand)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              ② {isBn ? 'লক্ষ্য শ্রেণি' : 'To Class'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>{isBn ? 'শ্রেণি' : 'Class'} <span style={{ color: 'var(--red)' }}>*</span></label>
                <select value={toClass} onChange={e => setToClass(e.target.value)} style={{ ...inp, borderColor: toClass ? 'var(--brand)' : 'var(--border)' }}>
                  <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
                  {CLASSES.map(c => <option key={c} value={c}>{isBn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>{isBn ? 'সেকশন' : 'Section'}</label>
                <select value={toSection} onChange={e => setToSection(e.target.value)} style={inp}>
                  <option value="">{isBn ? 'একই সেকশন' : 'Same Section'}</option>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>{isBn ? 'নতুন সেশন' : 'New Session'}</label>
                <select value={newSession} onChange={e => setNewSession(e.target.value)} style={inp}>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Roll info */}
          <div style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Info size={14} style={{ color: 'var(--brand)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)' }}>{isBn ? 'রোল নম্বর' : 'Roll Numbers'}</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--brand)', lineHeight: 1.5 }}>
              {isBn
                ? 'প্রতিটি ছাত্রের নতুন রোল নম্বর ম্যানুয়ালি লিখুন। টেবিলের "নতুন রোল" কলামে টাইপ করুন।'
                : 'Write new roll numbers manually for each student in the "New Roll" column.'}
            </p>
          </div>
        </div>

        {/* Right: Student list */}
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          {/* List header */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: fromClass ? 'var(--brand)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {filtered.length} {isBn ? 'জন ছাত্র' : 'students'}
                {selected.length > 0 && <span style={{ color: 'var(--brand)', marginLeft: '8px' }}>· {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}</span>}
              </span>
            </div>
            <button onClick={toggleAll}
              style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${allSel ? 'var(--brand)' : 'var(--border)'}`, background: allSel ? 'var(--brand-light)' : 'var(--bg-primary)', color: allSel ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              {allSel ? (isBn ? 'সব বাদ' : 'Deselect') : (isBn ? 'সব বাছুন' : 'Select All')}
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 10px', width: '36px' }}>
                    <input type="checkbox" checked={allSel} onChange={toggleAll}
                      style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                  </th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '30px' }}>#</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '38px' }}>{isBn ? 'ছবি' : 'Photo'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isBn ? 'নাম / আইডি' : 'Name / ID'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isBn ? 'বর্তমান' : 'Current'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase' }}>{isBn ? 'লক্ষ্য' : 'Target'}</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', minWidth: '70px' }}>{isBn ? 'নতুন রোল' : 'New Roll'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={28} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    {isBn ? 'উপরে শ্রেণি নির্বাচন করুন' : 'Select a class above to view students'}
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id}
                    style={{ borderBottom: '0.5px solid var(--border)', background: selected.includes(s.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                    onMouseEnter={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)}
                        style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--brand)' }} />
                    </td>
                    <td style={{ padding: '8px 6px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>{i + 1}</td>
                    <td style={{ padding: '6px' }}>
                      <div style={{ width: '28px', height: '34px', borderRadius: '5px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {s.photo
                          ? <img src={s.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <User size={12} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{s.nameEn}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.id}</div>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '5px', background: 'var(--brand-light)', color: 'var(--brand)' }}>
                          {isBn ? `শ্র ${s.class}` : `Cls ${s.class}`}
                        </span>
                        <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '5px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          {s.section}
                        </span>
                        {s.roll && <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '5px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>R{s.roll}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '8px 6px' }}>
                      {toClass ? (
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '5px', background: 'var(--green-light)', color: 'var(--green)' }}>
                            {isBn ? `শ্র ${toClass}` : `Cls ${toClass}`}
                          </span>
                          <span style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '5px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            {toSection || s.section}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 6px' }}>
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
