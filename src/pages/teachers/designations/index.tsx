import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertTriangle, Briefcase, Edit2, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import type { Designation } from '@/pages/teachers/types'

export default function DesignationsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { designations, teachers, addDesignation, updateDesignation, deleteDesignation } = useTeacherStore()
  const { isMobile } = useWindowSize()
  const isBn = language === 'bn'

  const [showAdd, setShowAdd] = useState(false)
  const [editD, setEditD] = useState<Designation | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newNameBn, setNewNameBn] = useState('')

  const getDesignationTeacherCount = (name: string) => teachers.filter(t => t.designation === name).length

  const handleAdd = () => {
    if (!newName.trim()) return
    const now = new Date().toISOString().split('T')[0]
    addDesignation({
      id: `DES-${String(designations.length + 1).padStart(3, '0')}`,
      name: newName.trim(), nameBn: newNameBn.trim(),
      createdAt: now, updatedAt: now,
    })
    setNewName(''); setNewNameBn(''); setShowAdd(false)
  }

  const handleEdit = () => {
    if (!editD || !newName.trim()) return
    updateDesignation(editD.id, { name: newName.trim(), nameBn: newNameBn.trim() })
    setEditD(null); setNewName(''); setNewNameBn('')
  }

  const startEdit = (d: Designation) => {
    setNewName(d.name); setNewNameBn(d.nameBn); setEditD(d)
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
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'400px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)', marginBottom:'14px' }}>
              {editD ? (isBn?'পদবি এডিট করুন':'Edit Designation') : (isBn?'নতুন পদবি':'New Designation')}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'4px', display:'block' }}>
                  {isBn?'নাম (ইংরেজি) *':'Name (English) *'}
                </label>
                <input value={newName} onChange={e => setNewName(e.target.value)} style={input}
                  placeholder={isBn?'পদবির নাম':'Designation name'} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:500, color:'var(--text-secondary)', marginBottom:'4px', display:'block' }}>
                  {isBn?'নাম (বাংলা)':'Name (Bangla)'}
                </label>
                <input value={newNameBn} onChange={e => setNewNameBn(e.target.value)} style={input}
                  placeholder={isBn?'বাংলায় নাম':'Bangla name'} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'16px' }}>
              <button onClick={() => { setShowAdd(false); setEditD(null); setNewName(''); setNewNameBn('') }}
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
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'380px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'var(--red-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertTriangle size={18} style={{ color:'var(--red)' }} />
              </div>
              <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{isBn?'মুছে ফেলুন?':'Delete?'}</h3>
            </div>
            <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'16px' }}>
              {isBn?'এই পদবিটি স্থায়ীভাবে মুছে ফেলা হবে।':'This designation will be permanently deleted.'}
            </p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setDelConfirm(null)}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বাতিল':'Cancel'}
              </button>
              <button onClick={() => { deleteDesignation(delConfirm); setDelConfirm(null) }}
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
            {isBn?'পদবি ব্যবস্থাপনা':'Designations'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {isBn?`মোট ${designations.length} টি পদবি`:`${designations.length} designations`}
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setNewName(''); setNewNameBn('') }}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px',
            background:'var(--purple-light)', border:'1px solid var(--purple)', color:'var(--purple)',
            fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
          <Plus size={14} />{isBn?'নতুন যোগ করুন':'Add Designation'}
        </button>
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
              {designations.length === 0
                ? <tr><td colSpan={5} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                    <Briefcase size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                    {isBn?'কোনো পদবি পাওয়া যায়নি':'No designations found'}
                  </td></tr>
                : designations.map((d, i) => (
                  <tr key={d.id}
                    style={{ borderBottom:'0.5px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'10px 12px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px', textAlign:'center' }}>{i+1}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--purple-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Briefcase size={16} style={{ color:'var(--purple)' }} />
                        </div>
                        <span style={{ fontSize:'13px', fontWeight:500, color:'var(--text-primary)' }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:'12px', color:'var(--text-secondary)' }}>{d.nameBn || '—'}</td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}>
                      <span style={{ fontSize:'12px', fontWeight:600, color:'var(--brand)', background:'var(--brand-light)', padding:'3px 8px', borderRadius:'6px' }}>
                        {getDesignationTeacherCount(d.name)}
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
