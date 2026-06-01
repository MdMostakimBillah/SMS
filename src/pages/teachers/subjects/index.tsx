import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertTriangle, BookOpen, Filter, X, Edit2, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import type { Subject } from '@/pages/teachers/types'

const sel: React.CSSProperties = {
  padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
  fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
}

export default function SubjectsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { subjects, departments, teachers, addSubject, updateSubject, deleteSubject } = useTeacherStore()
  const { isMobile } = useWindowSize()
  const isBn = language === 'bn'

  const [fDept, setFDept] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editS, setEditS] = useState<Subject | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newDeptIds, setNewDeptIds] = useState<string[]>([])

  const filtered = useMemo(() =>
    fDept ? subjects.filter(s => s.departmentIds?.includes(fDept) || s.departmentId === fDept) : subjects
  , [subjects, fDept])

  const getDeptName = (id: string) => {
    const d = departments.find(x => x.id === id)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }

  const getSubjectTeacherCount = (id: string) => teachers.filter(t => t.subjectIds.includes(id)).length

  const handleAdd = () => {
    if (!newName.trim() || newDeptIds.length === 0) return
    const now = new Date().toISOString().split('T')[0]
    addSubject({
      id: `SUB-${String(subjects.length + 1).padStart(3, '0')}`,
      name: newName.trim(), nameBn: newNameBn.trim(), departmentId: newDeptIds[0], departmentIds: newDeptIds,
      createdAt: now, updatedAt: now,
    })
    setNewName(''); setNewNameBn(''); setNewDeptIds([]); setShowAdd(false)
  }

  const handleEdit = () => {
    if (!editS || !newName.trim() || newDeptIds.length === 0) return
    updateSubject(editS.id, { name: newName.trim(), nameBn: newNameBn.trim(), departmentId: newDeptIds[0], departmentIds: newDeptIds })
    setEditS(null); setNewName(''); setNewNameBn(''); setNewDeptIds([])
  }

  const startEdit = (s: Subject) => {
    setNewName(s.name); setNewNameBn(s.nameBn); setNewDeptIds(s.departmentIds || [s.departmentId]); setEditS(s)
  }

  const toggleDept = (deptId: string) => {
    setNewDeptIds(prev => prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId])
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div>
      {/* Add/Edit Modal */}
      {(showAdd || editS) && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'400px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)', marginBottom:'14px' }}>
              {editS ? (isBn?'বিষয় এডিট করুন':'Edit Subject') : (isBn?'নতুন বিষয়':'New Subject')}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'4px', display:'block' }}>
                  {isBn?'নাম (ইংরেজি) *':'Name (English) *'}
                </label>
                <input value={newName} onChange={e => setNewName(e.target.value)} style={input}
                  placeholder={isBn?'বিষয়ের নাম':'Subject name'} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'4px', display:'block' }}>
                  {isBn?'নাম (বাংলা)':'Name (Bangla)'}
                </label>
                <input value={newNameBn} onChange={e => setNewNameBn(e.target.value)} style={input}
                  placeholder={isBn?'বাংলায় নাম':'Bangla name'} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'4px', display:'block' }}>
                  {isBn?'বিভাগ * (একাধিক নির্বাচন করতে পারেন)':'Departments * (select multiple)'}
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', padding:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'8px', minHeight:'40px' }}>
                  {departments.map(d => (
                    <label key={d.id} style={{ display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', padding:'4px 8px', borderRadius:'6px', background: newDeptIds.includes(d.id) ? 'var(--brand-light)' : 'var(--bg-primary)', border:`1px solid ${newDeptIds.includes(d.id) ? 'var(--brand)' : 'var(--border)'}`, fontSize:'12px', color: newDeptIds.includes(d.id) ? 'var(--brand)' : 'var(--text-secondary)', transition:'all 0.15s' }}>
                      <input type="checkbox" checked={newDeptIds.includes(d.id)} onChange={() => toggleDept(d.id)} style={{ width:'14px', height:'14px', accentColor:'var(--brand)', cursor:'pointer' }} />
                      {isBn?d.nameBn:d.name}
                    </label>
                  ))}
                </div>
                {newDeptIds.length === 0 && <div style={{ fontSize:'10px', color:'var(--red)', marginTop:'4px' }}>{isBn?'কমপক্ষে একটি বিভাগ নির্বাচন করুন':'Select at least one department'}</div>}
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'16px' }}>
              <button onClick={() => { setShowAdd(false); setEditS(null); setNewName(''); setNewNameBn(''); setNewDeptIds([]) }}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বাতিল':'Cancel'}
              </button>
              <button onClick={editS ? handleEdit : handleAdd}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--brand)', border:'none', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {editS ? (isBn?'সংরক্ষণ':'Save') : (isBn?'যোগ করুন':'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {delConfirm && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'380px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'var(--red-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertTriangle size={18} style={{ color:'var(--red)' }} />
              </div>
              <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{isBn?'মুছে ফেলুন?':'Delete?'}</h3>
            </div>
            <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'16px' }}>
              {isBn?'এই বিষয়টি স্থায়ীভাবে মুছে ফেলা হবে।':'This subject will be permanently deleted.'}
            </p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setDelConfirm(null)}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বাতিল':'Cancel'}
              </button>
              <button onClick={() => { deleteSubject(delConfirm); setDelConfirm(null) }}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--red)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'মুছে ফেলুন':'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/teachers')}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px',
            background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'13px',
            color:'var(--text-secondary)', fontFamily:'inherit', flexShrink:0 }}>
          <ArrowLeft size={14} />
          {isBn?'ফিরে যান':'Back'}
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:'22px', fontWeight:600, color:'var(--text-primary)' }}>
            {isBn?'বিষয় ব্যবস্থাপনা':'Subjects'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {isBn?`মোট ${filtered.length} টি বিষয়`:`${filtered.length} subjects`}
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setNewName(''); setNewNameBn(''); setNewDeptIds([]) }}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px',
            background:'var(--green-light)', border:'1px solid var(--green)', color:'var(--green)',
            fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
          <Plus size={14} />{isBn?'নতুন যোগ করুন':'Add Subject'}
        </button>
      </div>

      {/* Filter */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 14px', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <Filter size={14} style={{ color:'var(--text-muted)' }} />
          <select value={fDept} onChange={e => setFDept(e.target.value)} style={sel}>
            <option value="">{isBn?'সব বিভাগ':'All Departments'}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{isBn?d.nameBn:d.name}</option>)}
          </select>
          {fDept && (
            <button onClick={() => setFDept('')}
              style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'6px',
                background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)',
                fontSize:'11px', cursor:'pointer', fontFamily:'inherit' }}>
              <X size={11} />{isBn?'ফিল্টার সরান':'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        <div style={{ overflowX:'auto', ...(isMobile ? { maxHeight:'60vh', overflowY:'auto' } : {}) }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', minWidth: isMobile ? '500px' : undefined }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                {[
                  { l:'#', w:'50px', align:'center' as const },
                  { l:isBn?'নাম (ইংরেজি)':'Name (EN)', align:'left' as const },
                  { l:isBn?'নাম (বাংলা)':'Name (BN)', align:'left' as const },
                  { l:isBn?'বিভাগ':'Department', align:'left' as const },
                  { l:isBn?'শিক্ষক':'Teachers', w:'80px', align:'center' as const },
                  { l:isBn?'অ্যাকশন':'Action', w:'90px', align:'center' as const },
                ].map(h => (
                  <th key={h.l} style={{ padding:'10px 12px', textAlign:h.align, fontSize:'10px', fontWeight:600,
                    color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px',
                    whiteSpace:'nowrap' }}>
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                    <BookOpen size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                    {isBn?'কোনো বিষয় পাওয়া যায়নি':'No subjects found'}
                  </td></tr>
                : filtered.map((s, i) => (
                  <tr key={s.id}
                    style={{ borderBottom:'0.5px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'10px 12px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px', textAlign:'center' }}>{i+1}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <BookOpen size={16} style={{ color:'var(--green)' }} />
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:500, color:'var(--text-primary)' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:'12px', color:'var(--text-secondary)' }}>{s.nameBn || '—'}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                        {(s.departmentIds || [s.departmentId]).map(deptId => (
                          <span key={deptId} style={{ fontSize:'10px', fontWeight:500, padding:'2px 6px', borderRadius:'4px', background:'var(--amber-light)', color:'var(--amber)' }}>
                            {getDeptName(deptId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'var(--brand)', background:'var(--brand-light)', padding:'3px 8px', borderRadius:'6px' }}>
                        {getSubjectTeacherCount(s.id)}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <div style={{ display:'flex', gap:'4px', justifyContent:'center' }}>
                        <button onClick={() => startEdit(s)} title={isBn?'এডিট':'Edit'}
                          style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--amber-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--amber)' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDelConfirm(s.id)} title={isBn?'মুছুন':'Delete'}
                          style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--red-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
