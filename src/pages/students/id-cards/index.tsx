import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, IdCard, Printer, Search, User } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import type { StudentAdmission } from '@/pages/students/admission/types'

const TEMPLATES = [
  { id: 'classic',  name: 'Classic',  nameBn: 'ক্লাসিক',  primary: '#6366f1', secondary: '#eef2ff', accent: '#4f46e5', radius: 12 },
  { id: 'ocean',    name: 'Ocean',    nameBn: 'ওশান',     primary: '#0ea5e9', secondary: '#e0f2fe', accent: '#0284c7', radius: 16 },
  { id: 'forest',   name: 'Forest',   nameBn: 'ফরেস্ট',   primary: '#10b981', secondary: '#d1fae5', accent: '#059669', radius: 12 },
  { id: 'sunset',   name: 'Sunset',   nameBn: 'সানসেট',   primary: '#f59e0b', secondary: '#fef3c7', accent: '#d97706', radius: 14 },
  { id: 'rose',     name: 'Rose',     nameBn: 'রোজ',      primary: '#f43f5e', secondary: '#ffe4e6', accent: '#e11d48', radius: 10 },
  { id: 'midnight', name: 'Midnight', nameBn: 'মিডনাইট',  primary: '#1e293b', secondary: '#f1f5f9', accent: '#0f172a', radius: 16 },
]

const FIELDS = [
  { key: 'photo',          label: 'Photo',           labelBn: 'ছবি',              default: true  },
  { key: 'nameEn',         label: 'Name (EN)',       labelBn: 'নাম (ইং)',          default: true  },
  { key: 'nameBn',         label: 'Name (BN)',       labelBn: 'নাম (বাং)',          default: true  },
  { key: 'class',          label: 'Class & Section',  labelBn: 'শ্রেণি ও সেকশন',    default: true  },
  { key: 'roll',           label: 'Roll',            labelBn: 'রোল',               default: true  },
  { key: 'id',             label: 'Student ID',      labelBn: 'ছাত্র আইডি',        default: true  },
  { key: 'bloodGroup',     label: 'Blood Group',     labelBn: 'রক্তের গ্রুপ',      default: true  },
  { key: 'fatherNameEn',   label: "Father's Name",   labelBn: 'পিতার নাম',         default: false },
  { key: 'fatherPhone',    label: "Father's Mobile", labelBn: 'পিতার মোবাইল',      default: false },
  { key: 'motherNameEn',   label: "Mother's Name",   labelBn: 'মাতার নাম',         default: false },
  { key: 'phone',          label: 'Student Mobile',  labelBn: 'ছাত্রের মোবাইল',    default: false },
  { key: 'dob',            label: 'Date of Birth',   labelBn: 'জন্ম তারিখ',        default: false },
  { key: 'religion',       label: 'Religion',        labelBn: 'ধর্ম',              default: false },
  { key: 'address',        label: 'Address',         labelBn: 'ঠিকানা',            default: false },
]

const CLASSES = ['1','2','3','4','5','6','7','8','9','10']

function IDCard({ student, template, fields, institution, isBn }: {
  student: StudentAdmission; template: typeof TEMPLATES[0]; fields: string[]; institution: string; isBn: boolean
}) {
  const t = template
  const show = (k: string) => fields.includes(k)

  return (
    <div style={{
      width: '340px', height: '210px', borderRadius: `${t.radius}px`,
      border: `2px solid ${t.primary}`, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0,
      background: '#fff',
    }}>
      {/* Header */}
      <div style={{ background: t.primary, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
          ET
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>{institution}</div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>Student Identity Card</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', padding: '8px 12px', gap: '10px', background: t.secondary }}>
        {/* Photo */}
        {show('photo') && (
          <div style={{ width: '65px', height: '80px', borderRadius: '8px', border: `2px solid ${t.primary}`, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {student.photo
              ? <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={24} style={{ color: t.primary, opacity: 0.4 }} />}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {show('nameEn') && (
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {student.nameEn}
            </div>
          )}
          {show('nameBn') && student.nameBn && (
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>{student.nameBn}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
            {show('class') && (
              <span style={{ fontSize: '8px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: t.primary, color: '#fff' }}>
                {isBn ? `শ্র ${student.class}-${student.section}` : `Cls ${student.class}-${student.section}`}
              </span>
            )}
            {show('roll') && student.roll && (
              <span style={{ fontSize: '8px', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', background: '#fff', color: t.primary, border: `1px solid ${t.primary}` }}>
                {isBn ? `রোল ${student.roll}` : `Roll ${student.roll}`}
              </span>
            )}
            {show('bloodGroup') && student.bloodGroup && (
              <span style={{ fontSize: '8px', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                {student.bloodGroup}
              </span>
            )}
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {show('id') && (
              <div style={{ fontSize: '8px', color: '#888', fontFamily: 'monospace' }}>ID: {student.id}</div>
            )}
            {show('fatherNameEn') && student.fatherNameEn && (
              <div style={{ fontSize: '8px', color: '#666' }}>{isBn ? 'পিতা' : 'Father'}: {student.fatherNameEn}</div>
            )}
            {show('fatherPhone') && student.fatherPhone && (
              <div style={{ fontSize: '8px', color: '#666' }}>{isBn ? 'পিতার মোবাইল' : 'Father Mobile'}: {student.fatherPhone}</div>
            )}
            {show('motherNameEn') && student.motherNameEn && (
              <div style={{ fontSize: '8px', color: '#666' }}>{isBn ? 'মাতা' : 'Mother'}: {student.motherNameEn}</div>
            )}
            {show('phone') && student.phone && (
              <div style={{ fontSize: '8px', color: '#666' }}>{isBn ? 'মোবাইল' : 'Mobile'}: {student.phone}</div>
            )}
            {show('dob') && student.dob && (
              <div style={{ fontSize: '8px', color: '#666' }}>{isBn ? 'জন্ম' : 'DOB'}: {student.dob}</div>
            )}
            {show('religion') && student.religion && (
              <div style={{ fontSize: '8px', color: '#666' }}>{isBn ? 'ধর্ম' : 'Religion'}: {student.religion.split(' / ')[0]}</div>
            )}
            {show('address') && student.presentAddress && (
              <div style={{ fontSize: '8px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isBn ? 'ঠিকানা' : 'Address'}: {student.presentAddress}</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 12px', background: t.accent, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.7)' }}>Academic Year 2025–26</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '50px', height: '1px', background: 'rgba(255,255,255,0.5)', marginBottom: '1px' }} />
            <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.7)' }}>Principal</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '50px', height: '1px', background: 'rgba(255,255,255,0.5)', marginBottom: '1px' }} />
            <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.7)' }}>Seal</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IDCardsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { students } = useAdmissionStore()
  const isBn = language === 'bn'

  const approved = useMemo(() => students.filter(s => s.status === 'approved'), [students])

  const [template, setTemplate] = useState(TEMPLATES[0])
  const [fields, setFields] = useState<string[]>(FIELDS.filter(f => f.default).map(f => f.key))
  const [institution, setInstitution] = useState('EduTech — Sunrise Academy')
  const [fClass, setFClass] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const filtered = useMemo(() => approved.filter(s => {
    if (fClass && s.class !== fClass) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.nameEn.toLowerCase().includes(q) && !s.nameBn.includes(search) && !s.id.includes(search)) return false
    }
    return true
  }), [approved, fClass, search])

  const displayList = selected.length > 0 ? approved.filter(s => selected.includes(s.id)) : filtered

  const toggleField = useCallback((key: string) => {
    setFields(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])
  }, [])

  const selectAll = useCallback(() => {
    setSelected(p => p.length === filtered.length ? [] : filtered.map(s => s.id))
  }, [filtered])

  const printCards = useCallback(() => {
    const win = window.open('', '_blank')
    if (!win) return
    const cards = displayList.map(s => {
      const t = template
      const show = (k: string) => fields.includes(k)
      return `<div style="width:340px;height:210px;border-radius:${t.radius}px;border:2px solid ${t.primary};overflow:hidden;display:inline-flex;flex-direction:column;font-family:Arial,sans-serif;margin:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);page-break-inside:avoid;background:#fff">
        <div style="background:${t.primary};padding:8px 14px;display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff">ET</div>
          <div><div style="font-size:11px;font-weight:700;color:#fff">${institution}</div><div style="font-size:8px;color:rgba(255,255,255,0.7)">Student Identity Card</div></div>
        </div>
        <div style="flex:1;display:flex;padding:8px 12px;gap:10px;background:${t.secondary}">
          ${show('photo') ? `<div style="width:65px;height:80px;border-radius:8px;border:2px solid ${t.primary};overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">${s.photo ? `<img src="${s.photo}" style="width:100%;height:100%;object-fit:cover" />` : `<span style="font-size:24px;color:${t.primary};opacity:0.4">👤</span>`}</div>` : ''}
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
            ${show('nameEn') ? `<div style="font-size:13px;font-weight:700;color:#1a1a1a">${s.nameEn}</div>` : ''}
            ${show('nameBn') && s.nameBn ? `<div style="font-size:10px;color:#666">${s.nameBn}</div>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:2px">
              ${show('class') ? `<span style="font-size:8px;font-weight:600;padding:2px 6px;border-radius:4px;background:${t.primary};color:#fff">Cls ${s.class}-${s.section}</span>` : ''}
              ${show('roll') && s.roll ? `<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:#fff;color:${t.primary};border:1px solid ${t.primary}">Roll ${s.roll}</span>` : ''}
              ${show('bloodGroup') && s.bloodGroup ? `<span style="font-size:8px;padding:2px 6px;border-radius:4px;background:#fef2f2;color:#ef4444;border:1px solid #fecaca">${s.bloodGroup}</span>` : ''}
            </div>
            <div style="margin-top:auto;display:flex;flex-direction:column;gap:1px">
              ${show('id') ? `<div style="font-size:8px;color:#888;font-family:monospace">ID: ${s.id}</div>` : ''}
              ${show('fatherNameEn') && s.fatherNameEn ? `<div style="font-size:8px;color:#666">Father: ${s.fatherNameEn}</div>` : ''}
              ${show('fatherPhone') && s.fatherPhone ? `<div style="font-size:8px;color:#666">Father Mobile: ${s.fatherPhone}</div>` : ''}
              ${show('motherNameEn') && s.motherNameEn ? `<div style="font-size:8px;color:#666">Mother: ${s.motherNameEn}</div>` : ''}
              ${show('phone') && s.phone ? `<div style="font-size:8px;color:#666">Mobile: ${s.phone}</div>` : ''}
            </div>
          </div>
        </div>
        <div style="padding:4px 12px;background:${t.accent};display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:7px;color:rgba(255,255,255,0.7)">Academic Year 2025–26</span>
          <div style="display:flex;gap:20px"><div style="text-align:center"><div style="width:50px;height:1px;background:rgba(255,255,255,0.5)"></div><span style="font-size:6px;color:rgba(255,255,255,0.7)">Principal</span></div><div style="text-align:center"><div style="width:50px;height:1px;background:rgba(255,255,255,0.5)"></div><span style="font-size:6px;color:rgba(255,255,255,0.7)">Seal</span></div></div>
        </div>
      </div>`
    }).join('')

    win.document.write(`<!DOCTYPE html><html><head><title>ID Cards</title><style>@page{size:auto;margin:10mm}body{margin:0;padding:0;font-family:Arial,sans-serif}.cards{display:flex;flex-wrap:wrap;justify-content:center;gap:0}</style></head><body><div class="cards">${cards}</div><script>setTimeout(()=>window.print(),500)</script></body></html>`)
    win.document.close()
  }, [displayList, template, fields, institution])

  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }

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
            {isBn ? 'আইডি কার্ড' : 'ID Cards'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {isBn ? `${displayList.length} জন ছাত্রের আইডি কার্ড তৈরি করুন` : `Generate ID cards for ${displayList.length} students`}
          </p>
        </div>
        <button onClick={printCards} disabled={displayList.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '9px', background: displayList.length === 0 ? 'var(--border-2)' : 'var(--brand)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: displayList.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: displayList.length > 0 ? '0 4px 12px rgba(99,102,241,0.3)' : 'none' }}>
          <Printer size={14} />
          {isBn ? 'প্রিন্ট করুন' : 'Print'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Institution name */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ① {isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'}
            </div>
            <input value={institution} onChange={e => setInstitution(e.target.value)} style={inp} />
          </div>

          {/* Template selector */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ② {isBn ? 'ডিজাইন টেমপ্লেট' : 'Design Template'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t)}
                  style={{ padding: '8px', borderRadius: '8px', border: `2px solid ${template.id === t.id ? t.primary : 'var(--border)'}`, background: template.id === t.id ? t.secondary : 'var(--bg-secondary)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.12s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.primary }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: template.id === t.id ? t.primary : 'var(--text-secondary)' }}>{isBn ? t.nameBn : t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Field toggles */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ③ {isBn ? 'তথ্য অপশন' : 'Field Options'} ({fields.length}/{FIELDS.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', border: `1px solid ${fields.includes(f.key) ? 'var(--brand)' : 'var(--border)'}`, background: fields.includes(f.key) ? 'var(--brand-light)' : 'transparent', cursor: 'pointer', transition: 'all 0.1s' }}>
                  <input type="checkbox" checked={fields.includes(f.key)} onChange={() => toggleField(f.key)}
                    style={{ width: '12px', height: '12px', accentColor: 'var(--brand)', cursor: 'pointer' }} />
                  <span style={{ fontSize: '11px', color: fields.includes(f.key) ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: fields.includes(f.key) ? 500 : 400 }}>
                    {isBn ? f.labelBn : f.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ④ {isBn ? 'ফিল্টার' : 'Filter'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 8px' }}>
                <Search size={12} style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              </div>
              <select value={fClass} onChange={e => setFClass(e.target.value)} style={inp}>
                <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
                {CLASSES.map(c => <option key={c} value={c}>{isBn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
              </select>
              <button onClick={selectAll}
                style={{ padding: '6px', borderRadius: '7px', border: `1px solid ${selected.length > 0 ? 'var(--brand)' : 'var(--border)'}`, background: selected.length > 0 ? 'var(--brand-light)' : 'var(--bg-secondary)', color: selected.length > 0 ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                {selected.length > 0 ? `${selected.length} ${isBn ? 'নির্বাচিত' : 'selected'}` : (isBn ? `সব বাছুন (${filtered.length})` : `Select All (${filtered.length})`)}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'প্রিভিউ' : 'Preview'} ({displayList.length} {isBn ? 'জন' : 'cards'})
            </span>
          </div>
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <IdCard size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
              {isBn ? 'কোনো ছাত্র নির্বাচন করুন' : 'Select students to preview'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-start' }}>
              {displayList.map(s => (
                <IDCard key={s.id} student={s} template={template} fields={fields} institution={institution} isBn={isBn} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
