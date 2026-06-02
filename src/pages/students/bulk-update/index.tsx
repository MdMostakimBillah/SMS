import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, CheckCircle, Droplets, Grid3X3, Hash, Image, Info, Save, School, Search, Star, Upload, User, Wand2, X, Zap } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore, useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'


type Op = 'photo'|'roll'|'class'|'section'|'bloodGroup'|'religion'|'academicYear'

const OPS: { id:Op; Icon:React.ComponentType<{size?:number;style?:React.CSSProperties}>; bn:string; en:string; color:string; bg:string }[] = [
  { id:'photo',       Icon:Image,     bn:'ছবি আপলোড',    en:'Photo Upload',   color:'var(--brand)',  bg:'var(--brand-light)'  },
  { id:'roll',        Icon:Hash,       bn:'রোল পরিবর্তন', en:'Roll Number',    color:'var(--teal)',   bg:'var(--teal-light)'   },
  { id:'class',       Icon:School,     bn:'শ্রেণি পরিবর্তন',en:'Change Class',  color:'var(--amber)',  bg:'var(--amber-light)'  },
  { id:'section',     Icon:Grid3X3,   bn:'সেকশন পরিবর্তন',en:'Change Section', color:'var(--purple)', bg:'var(--purple-light)' },
  { id:'bloodGroup',  Icon:Droplets,   bn:'রক্তের গ্রুপ',  en:'Blood Group',   color:'var(--red)',    bg:'var(--red-light)'    },
  { id:'religion',    Icon:Star,       bn:'ধর্ম পরিবর্তন', en:'Change Religion',color:'var(--green)',  bg:'var(--green-light)'  },
  { id:'academicYear',Icon:Calendar,   bn:'শিক্ষাবর্ষ',   en:'Academic Year',  color:'var(--teal)',   bg:'var(--teal-light)'   },
]

const STATIC_OPTS: Record<string,string[]> = {
  bloodGroup:  ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
  religion:    ['Islam / ইসলাম','Hinduism / হিন্দু','Christianity / খ্রিস্টান','Buddhism / বৌদ্ধ','Other / অন্যান্য'],
  academicYear:['2024-25','2025-26','2026-27'],
}

// ✅ OUTSIDE — prevents cell focus loss on re-render
interface CellProps { value:string; onChange:(v:string)=>void; type?:string; opts?:string[] }
const EditCell = React.memo(function EditCell({ value, onChange, type='text', opts }: CellProps) {
  if (opts) return (
    <select value={value} onChange={e=>onChange(e.target.value)} className="w-full px-2 py-1.5 rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer">
      <option value="">—</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full px-2 py-1.5 rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none"
    onFocus={e=>(e.target.style.borderColor='var(--brand)')}
    onBlur={e=>(e.target.style.borderColor='var(--border)')} />
})

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve,reject) => {
    const img=document.createElement('img'), url=URL.createObjectURL(file)
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
  const { updateStudent } = useAdmissionStore()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const isBn = language === 'bn'

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const set = new Set<string>()
    classes.forEach(cls => cls.sections.forEach(s => set.add(s.name)))
    return Array.from(set).sort()
  }, [classes])

  const OPTS: Record<string, string[]> = useMemo(() => ({
    ...STATIC_OPTS,
    class: classOptions,
    section: allSections,
  }), [classOptions, allSections])

  const [op,       setOp]       = useState<Op>('roll')
  const [search,   setSearch]   = useState('')
  const [fClass,   setFClass]   = useState('')
  const [fSection, setFSection] = useState('')
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
    if (fSection && s.section !== fSection) return false
    if (search) {
      const q = search.toLowerCase()
      return s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(search) || s.id.includes(search) || s.roll.includes(search)
    }
    return true
  }), [students, search, fClass, fSection])

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
      alert(isBn ? "ছবি প্রসেস করতে সমস্যা হয়েছে" : "Failed to process image");
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

  return (
    <div>
      <div className="flex items-center gap-[10px] mb-[18px] flex-wrap">
        <button onClick={() => navigate('/students')}
          className="flex items-center gap-[5px] px-3 py-[7px] rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] font-[inherit] flex-shrink-0">
          <ArrowLeft size={14} />
          {isBn?'ফিরে যান':'Back'}
        </button>
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)]">
            {isBn?'বাল্ক আপডেট':'Bulk Update'}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-[3px]">
            {isBn?'একসাথে অনেক ছাত্রের তথ্য পরিবর্তন করুন':'Update multiple students at once'}
          </p>
        </div>
      </div>

      {/* ① Operation selector */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] px-4 py-[14px] mb-3">
        <div className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-[10px]">
          ① {isBn?'কোন তথ্য পরিবর্তন করতে চান?':'What do you want to update?'}
        </div>
        <div className={`grid gap-[6px] ${isMobile ? 'grid-cols-4' : 'grid-cols-7'}`}>
          {OPS.map(o => (
            <button key={o.id} onClick={() => { setOp(o.id); setRowEdits({}); setPhotoMap({}); setBatchVal('') }}
              className={`flex flex-col items-center gap-[5px] py-[10px] px-[6px] rounded-[10px] border-2 font-[inherit] transition-all ${op===o.id ? `border-[${o.color}] bg-[${o.bg}]` : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}>
              <o.Icon size={18} style={{color: op===o.id ? o.color : undefined}} />
              <span className={`text-[10px] text-center leading-[1.2] ${op===o.id ? `font-semibold text-[${o.color}]` : 'font-normal text-[var(--text-secondary)]'}`}>
                {isBn?o.bn:o.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ② Filter + Batch apply row */}
      <div className={`grid gap-[10px] mb-[10px] ${isMobile ? 'grid-cols-1' : 'grid-cols-[240px_1fr]'}`}>

        {/* Filter */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-[14px] py-3">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            ② {isBn?'ছাত্র ফিল্টার':'Filter Students'}
          </div>
          <div className="flex flex-col gap-[6px]">
            <div className="flex items-center gap-[7px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[8px] px-[9px] py-1.5">
              <Search size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={isBn?'নাম বা আইডি...':'Name or ID...'}
                className="flex-1 border-none bg-transparent outline-none text-[12px] text-[var(--text-primary)] font-[inherit]" />
            </div>
            <select value={fClass} onChange={e=>{ setFClass(e.target.value); setFSection('') }} className="px-[9px] py-[7px] rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[12px] font-[inherit] cursor-pointer outline-none">
              <option value="">{isBn?'সব শ্রেণি':'All Classes'}</option>
              {classOptions.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={fSection} onChange={e=>setFSection(e.target.value)} className="px-[9px] py-[7px] rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[12px] font-[inherit] cursor-pointer outline-none">
              <option value="">{isBn?'সব সেকশন':'All Sections'}</option>
              {(fClass ? (sectionsMap[fClass] || []) : allSections).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-[5px]">
              <button onClick={toggleAll}
                className={`flex-1 px-2 py-1.5 rounded-[7px] border bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit] font-medium ${allSel ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]' : 'border-[var(--border)]'}`}>
                {allSel?(isBn?'সব বাদ':'Deselect All'):(isBn?'সব বাছুন':'Select All')} ({filtered.length})
              </button>
              {selected.length>0 && (
                <button onClick={()=>setSelected([])}
                  className="px-[10px] py-1.5 rounded-[7px] border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] text-[11px] cursor-pointer font-[inherit]">
                  {selected.length} ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Batch operation */}
        <div className="bg-[var(--bg-primary)] border rounded-xl px-[14px] py-3" style={{ borderColor: opInfo.color }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-[10px]" style={{ color: opInfo.color }}>
            ③ {isBn?`এক সাথে ${opInfo.bn}`:` Batch ${opInfo.en}`}
            {selected.length>0 && <span className="ml-[6px] font-bold">— {selected.length} {isBn?'জন':'selected'}</span>}
          </div>

          {op === 'photo' ? (
            <div className="py-[10px] px-[10px] rounded-[8px] text-[13px]" style={{ background: opInfo.bg, color: opInfo.color }}>
              <Info size={14} className="inline mr-[5px] align-middle" />
              {isBn?'নিচের টেবিলে প্রতিটি ছাত্রের পাশের বাটনে ক্লিক করে ছবি আপলোড করুন':'Click the upload button next to each student in the table below'}
            </div>
          ) : op === 'roll' ? (
            <div className="flex gap-[10px] items-center flex-wrap">
              <div className="flex items-center gap-[7px]">
                <span className="text-[12px] text-[var(--text-muted)] whitespace-nowrap">{isBn?'শুরু থেকে:':'Start from:'}</span>
                <input type="number" min={1} value={autoStart} onChange={e=>setAutoStart(Math.max(1,Number(e.target.value)))}
                  className="w-[60px] px-2 py-[6px] rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-[inherit] outline-none text-center" />
              </div>
              <button onClick={applyAutoRoll}
                className="flex items-center gap-[5px] px-[14px] py-2 rounded-[8px] text-white text-[12px] font-medium cursor-pointer font-[inherit]" style={{ background: opInfo.color }}>
                <Wand2 size={13} />
                {isBn?'ক্রমানুসারে রোল দিন':'Auto-assign Sequential Rolls'}
              </button>
              <span className="text-[11px] text-[var(--text-muted)]">
                {isBn?'অথবা নিচে সরাসরি রোল লিখুন':'Or type rolls directly below'}
              </span>
            </div>
          ) : (
            <div className="flex gap-2 items-center flex-wrap">
              {OPTS[op] ? (
                <select value={batchVal} onChange={e=>setBatchVal(e.target.value)}
                  className="px-[9px] py-[7px] rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] font-[inherit] cursor-pointer outline-none flex-1" style={{ color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  <option value="">{isBn?'নতুন মান বেছে নিন':'Select new value'}</option>
                  {OPTS[op].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input value={batchVal} onChange={e=>setBatchVal(e.target.value)}
                  placeholder={isBn?'নতুন মান লিখুন':'Enter new value'}
                  className="flex-1 px-[9px] py-[7px] rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[12px] font-[inherit] outline-none" />
              )}
              <button onClick={applyBatch} disabled={!batchVal||selected.length===0}
                className="flex items-center gap-[5px] px-[14px] py-2 rounded-[8px] border-none text-white text-[12px] font-medium font-[inherit] whitespace-nowrap disabled:cursor-not-allowed" style={{ background: (!batchVal || selected.length===0) ? 'var(--border-2)' : opInfo.color, cursor: (!batchVal || selected.length===0) ? 'not-allowed' : 'pointer' }}>
                <Zap size={13} />
                {isBn?`${selected.length} জনে লাগান`:`Apply to ${selected.length}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden mb-3">
        <div className="px-[14px] py-[10px] border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: opInfo.color }} />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {filtered.length} {isBn?'জন ছাত্র':'students'}
              {selected.length>0 && <span className="ml-2" style={{ color: opInfo.color }}>· {selected.length} {isBn?'নির্বাচিত':'selected'}</span>}
            </span>
          </div>
          {readyCount>0 && (
            <span className="text-[12px] px-[10px] py-[3px] rounded-[6px] font-medium" style={{ color: opInfo.color, background: opInfo.bg }}>
              {readyCount} {isBn?'টি পরিবর্তন প্রস্তুত':'changes ready'}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="px-3 py-[10px] w-[36px]">
                  <input type="checkbox" checked={allSel} onChange={toggleAll}
                    className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]" style={{ accentColor: opInfo.color }} />
                </th>
                <th className="px-2 py-[10px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase w-[36px]">#</th>
                <th className="px-2 py-[10px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase min-w-[50px]">{isBn?'ছবি':'Photo'}</th>
                <th className="px-2 py-[10px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase min-w-[165px]">{isBn?'নাম / আইডি':'Name / ID'}</th>
                <th className="px-2 py-[10px] text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase min-w-[80px]">{isBn?'বর্তমান মান':'Current'}</th>
                <th className="px-2 py-[10px] text-left text-[10px] font-semibold uppercase min-w-[200px]" style={{ color: opInfo.color, background: `${opInfo.bg}55` }}>
                  ✏️ {isBn?opInfo.bn:opInfo.en}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={6} className="px-[30px] py-[30px] text-center text-[var(--text-muted)]">
                    {isBn?'কোনো ছাত্র পাওয়া যায়নি':'No students found'}
                  </td></tr>
                : filtered.map((s,i) => (
                  <tr key={s.id}
                    className="border-b border-[var(--border)]"
                    style={{ borderBottomWidth: '0.5px', background: selected.includes(s.id) ? `${opInfo.bg}44` : 'transparent' }}
                    onMouseEnter={e=>{if(!selected.includes(s.id))e.currentTarget.style.background='var(--bg-secondary)'}}
                    onMouseLeave={e=>{if(!selected.includes(s.id))e.currentTarget.style.background='transparent'}}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={()=>toggleOne(s.id)}
                        className="w-[13px] h-[13px] cursor-pointer" style={{ accentColor: opInfo.color }} />
                    </td>
                    <td className="px-2 py-2 text-[var(--text-muted)] font-semibold text-[11px]">{i+1}</td>
                    <td className="px-2 py-[7px]">
                      <div className="relative w-[32px] h-[38px] rounded-[6px] overflow-visible bg-[var(--bg-secondary)] border flex items-center justify-center" style={{ borderColor: photoMap[s.id] ? opInfo.color : 'var(--border)' }}>
                        {(photoMap[s.id]||s.photo)
                          ? <img src={photoMap[s.id]||s.photo} alt="" className="w-full h-full object-cover rounded-[5px]" />
                          : <User size={14} className="text-[var(--text-muted)]" />}
                        {photoMap[s.id] && (
                          <button onClick={()=>setPhotoMap(p=>{const n={...p};delete n[s.id];return n})}
                            title={isBn?'ছবি সরান':'Remove photo'}
                            className="absolute -top-[5px] -right-[5px] w-[18px] h-[18px] rounded-full bg-[var(--red)] border-2 border-[var(--bg-primary)] cursor-pointer flex items-center justify-center z-10 shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                            <X size={10} className="text-white" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-[12px] font-medium text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px]">
                        {isBn?s.nameBn||s.nameEn:s.nameEn}
                      </div>
                      <div className="text-[10px] text-[var(--brand)] font-mono">{s.id}</div>
                    </td>
                    <td className="px-2 py-2 text-[var(--text-secondary)] text-[11px]">
                      {op==='photo'
                        ? (s.photo?(isBn?'ছবি আছে':'Has photo'):(isBn?'নেই':'None'))
                        : (String((s as any)[op]||'—'))}
                    </td>
                    <td className="px-2 py-[6px]" style={{ background: selected.includes(s.id) ? `${opInfo.bg}33` : 'transparent' }}>
                      {op==='photo' ? (
                        <label className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[7px] border text-[11px] cursor-pointer font-medium w-fit" style={{ background: photoMap[s.id] ? 'var(--green-light)' : opInfo.bg, borderColor: photoMap[s.id] ? 'var(--green)' : opInfo.color, color: photoMap[s.id] ? 'var(--green)' : opInfo.color }}>
                          {photoMap[s.id] ? <CheckCircle size={12} /> : <Upload size={12} />}
                          {photoMap[s.id]?(isBn?'আপলোড হয়েছে ✓':'Uploaded ✓'):(isBn?'ছবি বেছে নিন':'Choose Photo')}
                          <input ref={el=>{fileRefs.current[s.id]=el}} type="file" accept="image/*"
                            onChange={e=>{const f=e.target.files?.[0];if(f)handlePhotoUpload(s.id,f)}}
                            className="hidden" />
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
      <div className="flex items-center justify-between flex-wrap gap-[10px]">
        <div className="text-[12px] text-[var(--text-muted)]">
          {readyCount>0
            ? `${readyCount} ${isBn?'টি পরিবর্তন সেভের জন্য প্রস্তুত':'changes ready to save'}`
            : (isBn?'কোনো পরিবর্তন নেই — উপরে তথ্য দিন':'No changes yet — add values above')}
        </div>
        <div className="flex gap-2">
          <button onClick={clearAll}
            className="px-[18px] py-[10px] rounded-[9px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer font-[inherit]">
            {isBn?'পরিষ্কার করুন':'Clear All'}
          </button>
          <button onClick={applyChanges} disabled={readyCount===0}
            className="flex items-center gap-[7px] px-[22px] py-[10px] rounded-[9px] border-none text-white text-[13px] font-semibold font-[inherit] disabled:cursor-not-allowed" style={{ background: readyCount===0 ? 'var(--border-2)' : opInfo.color, cursor: readyCount===0 ? 'not-allowed' : 'pointer', boxShadow: readyCount>0 ? `0 4px 14px ${opInfo.color}50` : 'none' }}>
            {applied ? <Check size={15} /> : <Save size={15} />}
            {applied
              ? (isBn?'✓ সফলভাবে আপডেট হয়েছে!':'✓ Updated Successfully!')
              : (isBn?`${readyCount} টি পরিবর্তন সেভ করুন`:`Save ${readyCount} Changes`)}
          </button>
        </div>
      </div>
    </div>
  )
}
