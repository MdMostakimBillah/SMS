import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'


type Op = 'photo'|'roll'|'class'|'section'|'bloodGroup'|'religion'|'academicYear'

const OPS: { id:Op; icon:string; bn:string; en:string; color:string; bg:string }[] = [
  { id:'photo',       icon:'lucide:image',     bn:'ছবি আপলোড',    en:'Photo Upload',   color:'var(--brand)',  bg:'var(--brand-light)'  },
  { id:'roll',        icon:'lucide:hash',       bn:'রোল পরিবর্তন', en:'Roll Number',    color:'var(--teal)',   bg:'var(--teal-light)'   },
  { id:'class',       icon:'lucide:school',     bn:'শ্রেণি পরিবর্তন',en:'Change Class',  color:'var(--amber)',  bg:'var(--amber-light)'  },
  { id:'section',     icon:'lucide:grid-3x3',   bn:'সেকশন পরিবর্তন',en:'Change Section', color:'var(--purple)', bg:'var(--purple-light)' },
  { id:'bloodGroup',  icon:'lucide:droplets',   bn:'রক্তের গ্রুপ',  en:'Blood Group',   color:'var(--red)',    bg:'var(--red-light)'    },
  { id:'religion',    icon:'lucide:star',       bn:'ধর্ম পরিবর্তন', en:'Change Religion',color:'var(--green)',  bg:'var(--green-light)'  },
  { id:'academicYear',icon:'lucide:calendar',   bn:'শিক্ষাবর্ষ',   en:'Academic Year',  color:'var(--teal)',   bg:'var(--teal-light)'   },
]

const OPTS: Record<string,string[]> = {
  class:       ['1','2','3','4','5','6','7','8','9','10'],
  section:     ['A','B','C','D','E'],
  bloodGroup:  ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
  religion:    ['Islam / ইসলাম','Hinduism / হিন্দু','Christianity / খ্রিস্টান','Buddhism / বৌদ্ধ','Other / অন্যান্য'],
  academicYear:['2024-25','2025-26','2026-27'],
}

// ✅ OUTSIDE — prevents cell focus loss on re-render
interface CellProps { value:string; onChange:(v:string)=>void; type?:string; opts?:string[] }
const EditCell = React.memo(function EditCell({ value, onChange, type='text', opts }: CellProps) {
  const s: React.CSSProperties = { width:'100%', padding:'6px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none' }
  if (opts) return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...s, cursor:'pointer' }}>
      <option value="">—</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={s}
    onFocus={e=>(e.target.style.borderColor='var(--brand)')}
    onBlur={e=>(e.target.style.borderColor='var(--border)')} />
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve,reject) => {
    const img=new Image(), url=URL.createObjectURL(file)
    img.onload=()=>{
      const c=document.createElement('canvas'), max=300, r=Math.min(max/img.width,max/img.height)
      c.width=Math.round(img.width*r); c.height=Math.round(img.height*r)
      c.getContext('2d')!.drawImage(img,0,0,c.width,c.height)
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg',0.82))
    }
    img.onerror=reject; img.src=url
  })
}

export default function BulkUpdatePage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { students, updateStudent } = useAdmissionStore()
  const isBn = language === 'bn'

  const [op,       setOp]       = useState<Op>('roll')
  const [search,   setSearch]   = useState('')
  const [fClass,   setFClass]   = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [batchVal, setBatchVal] = useState('')
  const [rowEdits, setRowEdits] = useState<Record<string,string>>({})
  const [photoMap, setPhotoMap] = useState<Record<string,string>>({})
  const [applied,  setApplied]  = useState(false)
  const [autoStart,setAutoStart]= useState(1)
  const fileRefs = useRef<Record<string, HTMLInputElement|null>>({})

  const opInfo = OPS.find(x=>x.id===op)!

  const filtered = useMemo(() => students.filter(s => {
    if (fClass && s.class !== fClass) return false
    if (search) {
      const q = search.toLowerCase()
      return s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(search) || s.id.includes(search) || s.roll.includes(search)
    }
    return true
  }), [students, search, fClass])

  const allSel = filtered.length > 0 && filtered.every(s => selected.includes(s.id))
  const toggleAll = useCallback(() =>
    setSelected(allSel ? [] : filtered.map(s=>s.id)), [allSel, filtered])
  const toggleOne = useCallback((id: string) =>
    setSelected(p => p.includes(id)?p.filter(x=>x!==id):[...p,id]), [])

  const updateRowEdit = useCallback((id: string, val: string) =>
    setRowEdits(p=>({...p,[id]:val})), [])

const handlePhotoUpload = useCallback(
  async (id: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert(
        isBn ? "ছবি ২ এমবি এর বেশি হতে পারবে না" : "Photo must be under 2MB",
      );
      return;
    }

    try {
      const base64 = await compressImage(file);
      setPhotoMap((prev) => ({ ...prev, [id]: base64 }));
    } catch (error) {
      console.error("Image compression failed:", error);
      alert(isBn ? "ছবি প্রসেস করতে সমস্যা হয়েছে" : "Failed to process image");
    }
  },
  [isBn],
);

  const applyBatch = useCallback(() => {
    if (!batchVal || selected.length===0) return
    const edits: Record<string,string> = {}
    selected.forEach(id => { edits[id] = batchVal })
    setRowEdits(p=>({...p,...edits}))
  }, [batchVal, selected])

  const applyAutoRoll = useCallback(() => {
    const ids = selected.length>0 ? selected : filtered.map(s=>s.id)
    const edits: Record<string,string> = {}
    ids.forEach((id,i) => { edits[id] = String(autoStart+i) })
    setRowEdits(p=>({...p,...edits}))
  }, [selected, filtered, autoStart])

  const applyChanges = useCallback(() => {
    const ids = selected.length>0 ? selected : filtered.map(s=>s.id)
    let count = 0
    ids.forEach(id => {
      if (op==='photo') {
        if (photoMap[id]) { updateStudent(id,{photo:photoMap[id]}); count++ }
      } else {
        const val = rowEdits[id]
        if (val) { updateStudent(id,{[op]:val}); count++ }
      }
    })
    if (count===0) { alert(isBn?'কোনো পরিবর্তন নেই':'No changes to apply'); return }
    setApplied(true); setTimeout(()=>setApplied(false), 3000)
  }, [selected, filtered, op, photoMap, rowEdits, updateStudent, isBn])

  const clearAll = useCallback(() => {
    setRowEdits({}); setPhotoMap({}); setSelected([]); setBatchVal('')
  }, [])

  const readyCount = op==='photo'
    ? Object.keys(photoMap).length
    : Object.keys(rowEdits).filter(k=>rowEdits[k]).length

  const inp: React.CSSProperties = { padding:'7px 9px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-secondary)', fontSize:'12px', fontFamily:'inherit', cursor:'pointer', outline:'none' }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/students')}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px', background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'13px', color:'var(--text-secondary)', fontFamily:'inherit', flexShrink:0 }}>
          <Icon icon="lucide:arrow-left" width={14} />
          {isBn?'ফিরে যান':'Back'}
        </button>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:600, color:'var(--text-primary)' }}>
            {isBn?'বাল্ক আপডেট':'Bulk Update'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {isBn?'একসাথে অনেক ছাত্রের তথ্য পরিবর্তন করুন':'Update multiple students at once'}
          </p>
        </div>
      </div>

      {/* ① Operation selector */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', padding:'14px 16px', marginBottom:'12px' }}>
        <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
          ① {isBn?'কোন তথ্য পরিবর্তন করতে চান?':'What do you want to update?'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(4,1fr)':'repeat(7,1fr)', gap:'6px' }}>
          {OPS.map(o => (
            <button key={o.id} onClick={() => { setOp(o.id); setRowEdits({}); setPhotoMap({}); setBatchVal('') }}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', padding:'10px 6px', borderRadius:'10px', border:`2px solid ${op===o.id?o.color:'var(--border)'}`, background:op===o.id?o.bg:'var(--bg-secondary)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
              <Icon icon={o.icon} width={18} style={{ color:op===o.id?o.color:'var(--text-muted)' }} />
              <span style={{ fontSize:'10px', fontWeight:op===o.id?600:400, color:op===o.id?o.color:'var(--text-secondary)', textAlign:'center', lineHeight:1.2 }}>
                {isBn?o.bn:o.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ② Filter + Batch apply row */}
      <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'240px 1fr', gap:'10px', marginBottom:'10px' }}>

        {/* Filter */}
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 14px' }}>
          <div style={{ fontSize:'11px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>
            ② {isBn?'ছাত্র ফিল্টার':'Filter Students'}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'8px', padding:'6px 9px' }}>
              <Icon icon="lucide:search" width={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={isBn?'নাম বা আইডি...':'Name or ID...'}
                style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'12px', color:'var(--text-primary)', fontFamily:'inherit' }} />
            </div>
            <select value={fClass} onChange={e=>setFClass(e.target.value)} style={inp}>
              <option value="">{isBn?'সব শ্রেণি':'All Classes'}</option>
              {['1','2','3','4','5','6','7','8','9','10'].map(c=><option key={c} value={c}>{isBn?`শ্রেণি ${c}`:`Class ${c}`}</option>)}
            </select>
            <div style={{ display:'flex', gap:'5px' }}>
              <button onClick={toggleAll}
                style={{ flex:1, padding:'6px 8px', borderRadius:'7px', border:`1px solid ${allSel?'var(--brand)':'var(--border)'}`, background:allSel?'var(--brand-light)':'var(--bg-secondary)', color:allSel?'var(--brand)':'var(--text-secondary)', fontSize:'11px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
                {allSel?(isBn?'সব বাদ':'Deselect All'):(isBn?'সব বাছুন':'Select All')} ({filtered.length})
              </button>
              {selected.length>0 && (
                <button onClick={()=>setSelected([])}
                  style={{ padding:'6px 10px', borderRadius:'7px', border:'1px solid var(--red)', background:'var(--red-light)', color:'var(--red)', fontSize:'11px', cursor:'pointer', fontFamily:'inherit' }}>
                  {selected.length} ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Batch operation */}
        <div style={{ background:'var(--bg-primary)', border:`1px solid ${opInfo.color}`, borderRadius:'12px', padding:'12px 14px' }}>
          <div style={{ fontSize:'11px', fontWeight:600, color:opInfo.color, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
            ③ {isBn?`এক সাথে ${opInfo.bn}`:` Batch ${opInfo.en}`}
            {selected.length>0 && <span style={{ marginLeft:'6px', fontWeight:700 }}>— {selected.length} {isBn?'জন':'selected'}</span>}
          </div>

          {op === 'photo' ? (
            <div style={{ padding:'10px', background:opInfo.bg, borderRadius:'8px', fontSize:'13px', color:opInfo.color }}>
              <Icon icon="lucide:info" width={14} style={{ display:'inline', marginRight:'5px', verticalAlign:'middle' }} />
              {isBn?'নিচের টেবিলে প্রতিটি ছাত্রের পাশের বাটনে ক্লিক করে ছবি আপলোড করুন':'Click the upload button next to each student in the table below'}
            </div>
          ) : op === 'roll' ? (
            <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                <span style={{ fontSize:'12px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{isBn?'শুরু থেকে:':'Start from:'}</span>
                <input type="number" min={1} value={autoStart} onChange={e=>setAutoStart(Math.max(1,Number(e.target.value)))}
                  style={{ width:'60px', padding:'6px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'13px', fontFamily:'inherit', outline:'none', textAlign:'center' }} />
              </div>
              <button onClick={applyAutoRoll}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:opInfo.color, border:'none', color:'#fff', fontSize:'12px', fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                <Icon icon="lucide:wand-2" width={13} />
                {isBn?'ক্রমানুসারে রোল দিন':'Auto-assign Sequential Rolls'}
              </button>
              <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>
                {isBn?'অথবা নিচে সরাসরি রোল লিখুন':'Or type rolls directly below'}
              </span>
            </div>
          ) : (
            <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
              {OPTS[op] ? (
                <select value={batchVal} onChange={e=>setBatchVal(e.target.value)}
                  style={{ ...inp, flex:1, color:batchVal?'var(--text-primary)':'var(--text-secondary)' }}>
                  <option value="">{isBn?'নতুন মান বেছে নিন':'Select new value'}</option>
                  {OPTS[op].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input value={batchVal} onChange={e=>setBatchVal(e.target.value)}
                  placeholder={isBn?'নতুন মান লিখুন':'Enter new value'}
                  style={{ ...inp, flex:1, color:'var(--text-primary)' }} />
              )}
              <button onClick={applyBatch} disabled={!batchVal||selected.length===0}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:(!batchVal||selected.length===0)?'var(--border-2)':opInfo.color, border:'none', color:'#fff', fontSize:'12px', fontWeight:500, cursor:(!batchVal||selected.length===0)?'not-allowed':'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                <Icon icon="lucide:zap" width={13} />
                {isBn?`${selected.length} জনে লাগান`:`Apply to ${selected.length}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden', marginBottom:'12px' }}>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-secondary)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:opInfo.color }} />
            <span style={{ fontSize:'13px', fontWeight:500, color:'var(--text-primary)' }}>
              {filtered.length} {isBn?'জন ছাত্র':'students'}
              {selected.length>0 && <span style={{ color:opInfo.color, marginLeft:'8px' }}>· {selected.length} {isBn?'নির্বাচিত':'selected'}</span>}
            </span>
          </div>
          {readyCount>0 && (
            <span style={{ fontSize:'12px', color:opInfo.color, background:opInfo.bg, padding:'3px 10px', borderRadius:'6px', fontWeight:500 }}>
              {readyCount} {isBn?'টি পরিবর্তন প্রস্তুত':'changes ready'}
            </span>
          )}
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                <th style={{ padding:'10px 12px', width:'36px' }}>
                  <input type="checkbox" checked={allSel} onChange={toggleAll}
                    style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:opInfo.color }} />
                </th>
                <th style={{ padding:'10px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', width:'36px' }}>#</th>
                <th style={{ padding:'10px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', minWidth:'50px' }}>{isBn?'ছবি':'Photo'}</th>
                <th style={{ padding:'10px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', minWidth:'165px' }}>{isBn?'নাম / আইডি':'Name / ID'}</th>
                <th style={{ padding:'10px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', minWidth:'80px' }}>{isBn?'বর্তমান মান':'Current'}</th>
                <th style={{ padding:'10px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:opInfo.color, textTransform:'uppercase', minWidth:'200px', background:`${opInfo.bg}55` }}>
                  ✏️ {isBn?opInfo.bn:opInfo.en}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={6} style={{ padding:'30px', textAlign:'center', color:'var(--text-muted)' }}>
                    {isBn?'কোনো ছাত্র পাওয়া যায়নি':'No students found'}
                  </td></tr>
                : filtered.map((s,i) => (
                  <tr key={s.id}
                    style={{ borderBottom:'0.5px solid var(--border)', background:selected.includes(s.id)?`${opInfo.bg}44`:'transparent' }}
                    onMouseEnter={e=>{if(!selected.includes(s.id))e.currentTarget.style.background='var(--bg-secondary)'}}
                    onMouseLeave={e=>{if(!selected.includes(s.id))e.currentTarget.style.background='transparent'}}>
                    <td style={{ padding:'8px 12px' }}>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={()=>toggleOne(s.id)}
                        style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:opInfo.color }} />
                    </td>
                    <td style={{ padding:'8px 8px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px' }}>{i+1}</td>
                    <td style={{ padding:'7px 8px' }}>
                      <div style={{ position:'relative', width:'32px', height:'38px', borderRadius:'6px', overflow:'visible', background:'var(--bg-secondary)', border:`1px solid ${photoMap[s.id]?opInfo.color:'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {(photoMap[s.id]||s.photo)
                          ? <img src={photoMap[s.id]||s.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'5px' }} />
                          : <Icon icon="lucide:user" width={14} style={{ color:'var(--text-muted)' }} />}
                        {photoMap[s.id] && (
                          <button onClick={()=>setPhotoMap(p=>{const n={...p};delete n[s.id];return n})}
                            title={isBn?'ছবি সরান':'Remove photo'}
                            style={{ position:'absolute', top:'-5px', right:'-5px', width:'18px', height:'18px', borderRadius:'50%', background:'var(--red)', border:'2px solid var(--bg-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}>
                            <Icon icon="lucide:x" width={10} style={{ color:'#fff' }} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding:'8px 8px' }}>
                      <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px' }}>
                        {isBn?s.nameBn||s.nameEn:s.nameEn}
                      </div>
                      <div style={{ fontSize:'10px', color:'var(--brand)', fontFamily:'monospace' }}>{s.id}</div>
                    </td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontSize:'11px' }}>
                      {op==='photo'
                        ? (s.photo?(isBn?'ছবি আছে':'Has photo'):(isBn?'নেই':'None'))
                        : (String((s as any)[op]||'—'))}
                    </td>
                    <td style={{ padding:'6px 8px', background:selected.includes(s.id)?`${opInfo.bg}33`:'transparent' }}>
                      {op==='photo' ? (
                        <label style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 10px', borderRadius:'7px', background:photoMap[s.id]?'var(--green-light)':opInfo.bg, border:`1px solid ${photoMap[s.id]?'var(--green)':opInfo.color}`, color:photoMap[s.id]?'var(--green)':opInfo.color, fontSize:'11px', cursor:'pointer', fontWeight:500, width:'fit-content' }}>
                          <Icon icon={photoMap[s.id]?'lucide:check-circle':'lucide:upload'} width={12} />
                          {photoMap[s.id]?(isBn?'আপলোড হয়েছে ✓':'Uploaded ✓'):(isBn?'ছবি বেছে নিন':'Choose Photo')}
                          <input ref={el=>{fileRefs.current[s.id]=el}} type="file" accept="image/*"
                            onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoUpload(s.id,f)}}
                            style={{ display:'none' }} />
                        </label>
                      ) : (
                        <EditCell
                          value={rowEdits[s.id]!==undefined ? rowEdits[s.id] : ((s as any)[op]||'')}
                          onChange={v=>updateRowEdit(s.id,v)}
                          opts={OPTS[op]}
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
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
        <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>
          {readyCount>0
            ? `${readyCount} ${isBn?'টি পরিবর্তন সেভের জন্য প্রস্তুত':'changes ready to save'}`
            : (isBn?'কোনো পরিবর্তন নেই — উপরে তথ্য দিন':'No changes yet — add values above')}
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={clearAll}
            style={{ padding:'10px 18px', borderRadius:'9px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
            {isBn?'পরিষ্কার করুন':'Clear All'}
          </button>
          <button onClick={applyChanges} disabled={readyCount===0}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 22px', borderRadius:'9px', background:readyCount===0?'var(--border-2)':opInfo.color, border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:readyCount===0?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:readyCount>0?`0 4px 14px ${opInfo.color}50`:'none' }}>
            <Icon icon={applied?'lucide:check':'lucide:save'} width={15} />
            {applied
              ? (isBn?'✓ সফলভাবে আপডেট হয়েছে!':'✓ Updated Successfully!')
              : (isBn?`${readyCount} টি পরিবর্তন সেভ করুন`:`Save ${readyCount} Changes`)}
          </button>
        </div>
      </div>
    </div>
  )
}
