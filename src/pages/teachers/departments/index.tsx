import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertTriangle, Building2, Crown, Edit2, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import type { Department } from '@/pages/teachers/types'

export default function DepartmentsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { departments, subjects, teachers, addDepartment, updateDepartment, deleteDepartment } = useTeacherStore()
  const { isMobile } = useWindowSize()
  const isBn = language === 'bn'

  const [showAdd, setShowAdd] = useState(false)
  const [editD, setEditD] = useState<Department | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newHead, setNewHead] = useState('')

  const getDeptTeacherCount = (id: string) => teachers.filter(t => t.departmentId === id).length
  const getDeptSubjectCount = (id: string) => subjects.filter(s => s.departmentId === id).length

  const handleAdd = () => {
    if (!newName.trim()) return
    const now = new Date().toISOString().split('T')[0]
    addDepartment({
      id: `DEPT-${String(departments.length + 1).padStart(3, '0')}`,
      name: newName.trim(), nameBn: newNameBn.trim(), head: newHead.trim(),
      createdAt: now, updatedAt: now,
    })
    setNewName(''); setNewNameBn(''); setNewHead(''); setShowAdd(false)
  }

  const handleEdit = () => {
    if (!editD || !newName.trim()) return
    updateDepartment(editD.id, { name: newName.trim(), nameBn: newNameBn.trim(), head: newHead.trim() })
    setEditD(null); setNewName(''); setNewNameBn(''); setNewHead('')
  }

  const startEdit = (d: Department) => {
    setNewName(d.name); setNewNameBn(d.nameBn); setNewHead(d.head); setEditD(d)
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div>
      {/* Add/Edit Modal */}
      {(showAdd || editD) && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'400px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)', marginBottom:'14px' }}>
              {editD ? (isBn?'বিভাগ এডিট করুন':'Edit Department') : (isBn?'নতুন বিভাগ':'New Department')}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'4px', display:'block' }}>
                  {isBn?'নাম (ইংরেজি) *':'Name (English) *'}
                </label>
                <input value={newName} onChange={e => setNewName(e.target.value)} style={input}
                  placeholder={isBn?'বিভাগের নাম':'Department name'} />
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
                  {isBn?'বিভাগ প্রধান':'Head of Department'}
                </label>
                <select value={newHead} onChange={e => setNewHead(e.target.value)} style={input}>
                  <option value="">{isBn?'নির্বাচন করুন':'Select Head'}</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.nameEn}>{t.nameEn} ({t.designation})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'16px' }}>
              <button onClick={() => { setShowAdd(false); setEditD(null); setNewName(''); setNewNameBn(''); setNewHead('') }}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বাতিল':'Cancel'}
              </button>
              <button onClick={editD ? handleEdit : handleAdd}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--brand)', border:'none', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {editD ? (isBn?'সংরক্ষণ':'Save') : (isBn?'যোগ করুন':'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {delConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'380px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'var(--red-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertTriangle size={18} style={{ color:'var(--red)' }} />
              </div>
              <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{isBn?'মুছে ফেলুন?':'Delete?'}</h3>
            </div>
            <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'16px' }}>
              {isBn?'এই বিভাগটি স্থায়ীভাবে মুছে ফেলা হবে।':'This department will be permanently deleted.'}
            </p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setDelConfirm(null)}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বাতিল':'Cancel'}
              </button>
              <button onClick={() => { deleteDepartment(delConfirm); setDelConfirm(null) }}
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
            {isBn?'বিভাগ ব্যবস্থাপনা':'Departments'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {isBn?`মোট ${departments.length} টি বিভাগ`:`${departments.length} departments`}
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setNewName(''); setNewNameBn(''); setNewHead('') }}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px',
            background:'var(--amber-light)', border:'1px solid var(--amber)', color:'var(--amber)',
            fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
          <Plus size={14} />{isBn?'নতুন যোগ করুন':'Add Department'}
        </button>
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        <div style={{ overflowX:'auto', ...(isMobile ? { maxHeight:'60vh', overflowY:'auto' } : {}) }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px', minWidth: isMobile ? '600px' : undefined }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                {[
                  { l:'#', w:'50px', align:'center' as const },
                  { l:isBn?'নাম (ইংরেজি)':'Name (EN)', align:'left' as const },
                  { l:isBn?'নাম (বাংলা)':'Name (BN)', align:'left' as const },
                  { l:isBn?'বিভাগ প্রধান':'Head of Dept', align:'left' as const },
                  { l:isBn?'শিক্ষক':'Teachers', w:'80px', align:'center' as const },
                  { l:isBn?'বিষয়':'Subjects', w:'80px', align:'center' as const },
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
              {departments.length === 0
                ? <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                    <Building2 size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                    {isBn?'কোনো বিভাগ পাওয়া যায়নি':'No departments found'}
                  </td></tr>
                : departments.map((d, i) => (
                  <tr key={d.id}
                    style={{ borderBottom:'0.5px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'10px 12px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px', textAlign:'center' }}>{i+1}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--amber-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Building2 size={16} style={{ color:'var(--amber)' }} />
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:500, color:'var(--text-primary)' }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:'12px', color:'var(--text-secondary)' }}>{d.nameBn || '—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:'12px', color:'var(--text-secondary)' }}>
                      {d.head ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          <Crown size={12} style={{ color:'var(--amber)' }} />
                          {d.head}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'var(--brand)', background:'var(--brand-light)', padding:'3px 8px', borderRadius:'6px' }}>
                        {getDeptTeacherCount(d.id)}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'var(--green)', background:'var(--green-light)', padding:'3px 8px', borderRadius:'6px' }}>
                        {getDeptSubjectCount(d.id)}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <div style={{ display:'flex', gap:'4px', justifyContent:'center' }}>
                        <button onClick={() => startEdit(d)} title={isBn?'এডিট':'Edit'}
                          style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--amber-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--amber)' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setDelConfirm(d.id)} title={isBn?'মুছুন':'Delete'}
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
