import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CheckCircle, Clock, DollarSign, Building2, Briefcase, Image, Info, Phone, Save, Search, Upload, Zap } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'

type Op = 'salary'|'phone'|'photo'|'department'|'designation'|'inTime'|'outTime'

const OPS: { id:Op; Icon:React.ComponentType<{size?:number;style?:React.CSSProperties}>; bn:string; en:string; color:string; bg:string }[] = [
  { id:'photo',       Icon:Image,       bn:'ছবি পরিবর্তন',    en:'Photo',       color:'var(--brand)',  bg:'var(--brand-light)'  },
  { id:'salary',      Icon:DollarSign,   bn:'বেতন পরিবর্তন',  en:'Salary',      color:'var(--green)',  bg:'var(--green-light)'  },
  { id:'phone',       Icon:Phone,        bn:'মোবাইল নম্বর',   en:'Phone',       color:'var(--teal)',   bg:'var(--teal-light)'   },
  { id:'department',  Icon:Building2,    bn:'বিভাগ পরিবর্তন', en:'Department',  color:'var(--amber)',  bg:'var(--amber-light)'  },
  { id:'designation', Icon:Briefcase,    bn:'পদবি পরিবর্তন',  en:'Designation', color:'var(--purple)', bg:'var(--purple-light)' },
  { id:'inTime',      Icon:Clock,        bn:'ইন টাইম',        en:'In Time',     color:'var(--teal)',   bg:'var(--teal-light)'   },
  { id:'outTime',     Icon:Clock,        bn:'আউট টাইম',       en:'Out Time',    color:'var(--red)',    bg:'var(--red-light)'    },
]

interface CellProps { value:string; onChange:(v:string)=>void; type?:string }
const EditCell = React.memo(function EditCell({ value, onChange, type='text' }: CellProps) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)}
    style={{ width:'100%', padding:'6px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none' }}
    onFocus={e=>(e.target.style.borderColor='var(--brand)')}
    onBlur={e=>(e.target.style.borderColor='var(--border)')} />
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img'), url = URL.createObjectURL(file)
    img.onload = () => {
      const c = document.createElement('canvas'), max = 300, r = Math.min(max / img.width, max / img.height)
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject; img.src = url
  })
}

export default function TeacherBulkUpdatePage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { teachers, updateTeacher, departments, designations } = useTeacherStore()
  const isBn = language === 'bn'

  const [op,       setOp]       = useState<Op>('salary')
  const [search,   setSearch]   = useState('')
  const [fDept,    setFDept]    = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [batchVal, setBatchVal] = useState('')
  const [rowEdits, setRowEdits] = useState<Record<string, string>>({})
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({})
  const [applied,  setApplied]  = useState(false)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const opInfo = OPS.find(x => x.id === op)!

  const filtered = useMemo(() => teachers.filter(t => {
    if (fDept && t.departmentId !== fDept) return false
    if (search) {
      const q = search.toLowerCase()
      return t.nameEn.toLowerCase().includes(q) || t.nameBn.includes(search) || t.id.includes(search) || t.phone.includes(search)
    }
    return true
  }), [teachers, search, fDept])

  const allSel = filtered.length > 0 && filtered.every(t => selected.includes(t.id))
  const toggleAll = useCallback(() =>
    setSelected(allSel ? [] : filtered.map(t => t.id)), [allSel, filtered])
  const toggleOne = useCallback((id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])

  const updateRowEdit = useCallback((id: string, val: string) =>
    setRowEdits(p => ({ ...p, [id]: val })), [])

  const handlePhotoUpload = useCallback(async (id: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert(isBn ? 'ছবি ২ এমবি এর বেশি হতে পারবে না' : 'Image must be under 2MB')
      return
    }
    try {
      const base64 = await compressImage(file)
      setPhotoMap(p => ({ ...p, [id]: base64 }))
    } catch {
      alert(isBn ? 'ছবি প্রসেস করতে সমস্যা হয়েছে' : 'Failed to process image')
    }
  }, [isBn])

  const applyBatch = useCallback(() => {
    if (!batchVal || selected.length === 0) return
    const edits: Record<string, string> = {}
    selected.forEach(id => { edits[id] = batchVal })
    setRowEdits(p => ({ ...p, ...edits }))
  }, [batchVal, selected])

  const applyChanges = useCallback(() => {
    const ids = selected.length > 0 ? selected : filtered.map(t => t.id)
    let count = 0
    ids.forEach(id => {
      if (op === 'photo') {
        if (photoMap[id]) { updateTeacher(id, { photo: photoMap[id] }); count++ }
      } else {
        const val = rowEdits[id]
        if (val) {
          const update: Record<string, any> = {}
          if (op === 'salary') update[op] = Number(val) || 0
          else update[op] = val
          updateTeacher(id, update); count++
        }
      }
    })
    if (count === 0) { alert(isBn ? 'কোনো পরিবর্তন নেই' : 'No changes to apply'); return }
    setApplied(true); setTimeout(() => setApplied(false), 3000)
  }, [selected, filtered, op, photoMap, rowEdits, updateTeacher, isBn])

  const clearAll = useCallback(() => {
    setRowEdits({}); setPhotoMap({}); setSelected([]); setBatchVal('')
  }, [])

  const readyCount = op === 'photo'
    ? Object.keys(photoMap).length
    : Object.keys(rowEdits).filter(k => rowEdits[k]).length

  const inp: React.CSSProperties = { padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/teachers')}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit', flexShrink: 0 }}>
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'বাল্ক আপডেট শিক্ষক' : 'Bulk Update Teachers'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {isBn ? 'একসাথে অনেক শিক্ষকের তথ্য পরিবর্তন করুন' : 'Update multiple teachers at once'}
          </p>
        </div>
      </div>

      {/* Operation selector */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          ① {isBn ? 'কোন তথ্য পরিবর্তন করতে চান?' : 'What do you want to update?'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: '6px' }}>
          {OPS.map(o => (
            <button key={o.id} onClick={() => { setOp(o.id); setRowEdits({}); setPhotoMap({}); setBatchVal('') }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px 6px', borderRadius: '10px', border: `2px solid ${op === o.id ? o.color : 'var(--border)'}`, background: op === o.id ? o.bg : 'var(--bg-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              <o.Icon size={18} style={{ color: op === o.id ? o.color : 'var(--text-muted)' }} />
              <span style={{ fontSize: '10px', fontWeight: op === o.id ? 600 : 400, color: op === o.id ? o.color : 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>
                {isBn ? o.bn : o.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter + Batch */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: '10px', marginBottom: '10px' }}>
        {/* Filter */}
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            ② {isBn ? 'শিক্ষক ফিল্টার' : 'Filter Teachers'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 9px' }}>
              <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
            </div>
            <select value={fDept} onChange={e => setFDept(e.target.value)} style={inp}>
              <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={toggleAll}
                style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', border: `1px solid ${allSel ? 'var(--brand)' : 'var(--border)'}`, background: allSel ? 'var(--brand-light)' : 'var(--bg-secondary)', color: allSel ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                {allSel ? (isBn ? 'সব বাদ' : 'Deselect All') : (isBn ? 'সব বাছুন' : 'Select All')} ({filtered.length})
              </button>
              {selected.length > 0 && (
                <button onClick={() => setSelected([])}
                  style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid var(--red)', background: 'var(--red-light)', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {selected.length} ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Batch operation */}
        <div style={{ background: 'var(--bg-primary)', border: `1px solid ${opInfo.color}`, borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: opInfo.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            ③ {isBn ? `এক সাথে ${opInfo.bn}` : `Batch ${opInfo.en}`}
            {selected.length > 0 && <span style={{ marginLeft: '6px', fontWeight: 700 }}>— {selected.length} {isBn ? 'জন' : 'selected'}</span>}
          </div>

          {op === 'photo' ? (
            <div style={{ padding: '10px', background: opInfo.bg, borderRadius: '8px', fontSize: '13px', color: opInfo.color }}>
              <Info size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
              {isBn ? 'নিচের টেবিলে প্রতিটি শিক্ষকের পাশের বাটনে ক্লিক করে ছবি আপলোড করুন' : 'Click the upload button next to each teacher in the table below'}
            </div>
          ) : op === 'department' ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={batchVal} onChange={e => setBatchVal(e.target.value)}
                style={{ ...inp, flex: 1, color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                <option value="">{isBn ? 'নতুন বিভাগ বেছে নিন' : 'Select new department'}</option>
                {departments.map(d => <option key={d.id} value={d.id}>{isBn ? d.nameBn : d.name}</option>)}
              </select>
              <button onClick={applyBatch} disabled={!batchVal || selected.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', background: (!batchVal || selected.length === 0) ? 'var(--border-2)' : opInfo.color, border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: (!batchVal || selected.length === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                <Zap size={13} />
                {isBn ? `${selected.length} জনে লাগান` : `Apply to ${selected.length}`}
              </button>
            </div>
          ) : op === 'designation' ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={batchVal} onChange={e => setBatchVal(e.target.value)}
                style={{ ...inp, flex: 1, color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                <option value="">{isBn ? 'নতুন পদবি বেছে নিন' : 'Select new designation'}</option>
                {designations.map(d => <option key={d.id} value={d.name}>{isBn?d.nameBn:d.name}</option>)}
              </select>
              <button onClick={applyBatch} disabled={!batchVal || selected.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', background: (!batchVal || selected.length === 0) ? 'var(--border-2)' : opInfo.color, border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: (!batchVal || selected.length === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                <Zap size={13} />
                {isBn ? `${selected.length} জনে লাগান` : `Apply to ${selected.length}`}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {op === 'inTime' || op === 'outTime' ? (
                <input type="time" value={batchVal} onChange={e => setBatchVal(e.target.value)}
                  style={{ ...inp, flex: 1, color: 'var(--text-primary)' }} />
              ) : op === 'salary' ? (
                <input type="number" value={batchVal} onChange={e => setBatchVal(e.target.value)}
                  placeholder={isBn ? 'নতুন বেতন লিখুন' : 'Enter new salary'}
                  style={{ ...inp, flex: 1, color: 'var(--text-primary)' }} />
              ) : (
                <input value={batchVal} onChange={e => setBatchVal(e.target.value)}
                  placeholder={isBn ? 'নতুন মান লিখুন' : 'Enter new value'}
                  style={{ ...inp, flex: 1, color: 'var(--text-primary)' }} />
              )}
              <button onClick={applyBatch} disabled={!batchVal || selected.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', background: (!batchVal || selected.length === 0) ? 'var(--border-2)' : opInfo.color, border: 'none', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: (!batchVal || selected.length === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                <Zap size={13} />
                {isBn ? `${selected.length} জনে লাগান` : `Apply to ${selected.length}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: opInfo.color }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {filtered.length} {isBn ? 'জন শিক্ষক' : 'teachers'}
              {selected.length > 0 && <span style={{ color: opInfo.color, marginLeft: '8px' }}>· {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}</span>}
            </span>
          </div>
          {readyCount > 0 && (
            <span style={{ fontSize: '12px', color: opInfo.color, background: opInfo.bg, padding: '3px 10px', borderRadius: '6px', fontWeight: 500 }}>
              {readyCount} {isBn ? 'টি পরিবর্তন প্রস্তুত' : 'changes ready'}
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', width: '36px' }}>
                  <input type="checkbox" checked={allSel} onChange={toggleAll}
                    style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: opInfo.color }} />
                </th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '36px' }}>#</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '50px' }}>{isBn ? 'ছবি' : 'Photo'}</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '165px' }}>{isBn ? 'নাম / আইডি' : 'Name / ID'}</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', minWidth: '80px' }}>{isBn ? 'বর্তমান মান' : 'Current'}</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: opInfo.color, textTransform: 'uppercase', minWidth: '200px', background: `${opInfo.bg}55` }}>
                  ✏️ {isBn ? opInfo.bn : opInfo.en}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isBn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No teachers found'}
                  </td></tr>
                : filtered.map((t, i) => (
                  <tr key={t.id}
                    style={{ borderBottom: '0.5px solid var(--border)', background: selected.includes(t.id) ? `${opInfo.bg}44` : 'transparent' }}
                    onMouseEnter={e => { if (!selected.includes(t.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selected.includes(t.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleOne(t.id)}
                        style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: opInfo.color }} />
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px' }}>{i + 1}</td>
                    <td style={{ padding: '7px 8px' }}>
                      <div style={{ width: '32px', height: '38px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.photo ? <img src={t.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.nameEn.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                        {isBn ? t.nameBn || t.nameEn : t.nameEn}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--brand)', fontFamily: 'monospace' }}>{t.id}</div>
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {op === 'salary' ? `৳${t.salary.toLocaleString()}`
                        : op === 'phone' ? t.phone
                        : op === 'photo' ? (t.photo ? (isBn ? 'ছবি আছে' : 'Has photo') : (isBn ? 'নেই' : 'None'))
                        : op === 'department' ? departments.find(d => d.id === t.departmentId)?.name || t.departmentId
                        : op === 'designation' ? t.designation || '—'
                        : op === 'inTime' ? t.inTime
                        : op === 'outTime' ? t.outTime
                        : '—'}
                    </td>
                    <td style={{ padding: '6px 8px', background: selected.includes(t.id) ? `${opInfo.bg}33` : 'transparent' }}>
                      {op === 'photo' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '7px', background: photoMap[t.id] ? 'var(--green-light)' : opInfo.bg, border: `1px solid ${photoMap[t.id] ? 'var(--green)' : opInfo.color}`, color: photoMap[t.id] ? 'var(--green)' : opInfo.color, fontSize: '11px', cursor: 'pointer', fontWeight: 500, width: 'fit-content' }}>
                          {photoMap[t.id] ? <CheckCircle size={12} /> : <Upload size={12} />}
                          {photoMap[t.id] ? (isBn ? 'আপলোড হয়েছে ✓' : 'Uploaded ✓') : (isBn ? 'ছবি বেছে নিন' : 'Choose Photo')}
                          <input ref={el => { fileRefs.current[t.id] = el }} type="file" accept="image/*"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(t.id, f) }}
                            style={{ display: 'none' }} />
                        </label>
                      ) : (
                        <EditCell
                          value={rowEdits[t.id] !== undefined ? rowEdits[t.id] : (op === 'salary' ? String(t.salary) : (t as any)[op] || '')}
                          onChange={v => updateRowEdit(t.id, v)}
                          type={op === 'salary' ? 'number' : 'text'}
                        />
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {readyCount > 0
            ? `${readyCount} ${isBn ? 'টি পরিবর্তন সেভের জন্য প্রস্তুত' : 'changes ready to save'}`
            : (isBn ? 'কোনো পরিবর্তন নেই — উপরে তথ্য দিন' : 'No changes yet — add values above')}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={clearAll}
            style={{ padding: '10px 18px', borderRadius: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {isBn ? 'পরিষ্কার করুন' : 'Clear All'}
          </button>
          <button onClick={applyChanges} disabled={readyCount === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '9px', background: readyCount === 0 ? 'var(--border-2)' : opInfo.color, border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: readyCount === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: readyCount > 0 ? `0 4px 14px ${opInfo.color}50` : 'none' }}>
            {applied ? <Check size={15} /> : <Save size={15} />}
            {applied
              ? (isBn ? '✓ সফলভাবে আপডেট হয়েছে!' : '✓ Updated Successfully!')
              : (isBn ? `${readyCount} টি পরিবর্তন সেভ করুন` : `Save ${readyCount} Changes`)}
          </button>
        </div>
      </div>
    </div>
  )
}
