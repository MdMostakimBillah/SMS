import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, User, Edit2, ArrowLeft, Layers, Search, FileSpreadsheet, FileText, Users, Eye, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore } from '@/store/admissionStore'
import { PDFOptionsModal } from '@/components/shared/PDFOptionsModal'
import { generateListPDF } from '@/pages/students/admission/listPdfTemplate'
import { generateA4HTML } from '@/pages/students/admission/a4Template'
import type { ListPDFOptions } from '@/pages/students/admission/listPdfTemplate'
import type { StudentAdmission } from '@/pages/students/admission/types'

const PER_PAGE_OPTS = [10, 20, 30, 50, 100, 200, 500, 1000]
const CLASSES = ['1','2','3','4','5','6','7','8','9','10']
const SECTIONS = ['A','B','C','D','E']
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export default function AllStudentsPage() {
  const navigate  = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { students } = useAdmissionStore()
  const isBn = language === 'bn'

  const [search,    setSearch]    = useState('')
  const [fClass,    setFClass]    = useState('')
  const [fSection,  setFSection]  = useState('')
  const [fGender,   setFGender]   = useState('')
  const [fActive,   setFActive]   = useState('')
  const [fReligion, setFReligion] = useState('')
  const [fBlood,    setFBlood]    = useState('')
  const [perPage,   setPerPage]   = useState(20)
  const [page,      setPage]      = useState(1)
  const [selected,  setSelected]  = useState<string[]>([])
  const [showPDF,   setShowPDF]   = useState(false)
  const [viewSt,    setViewSt]    = useState<StudentAdmission | null>(null)

  const filtered = useMemo(() => students.filter(s => {
    if (s.status !== 'approved') return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.nameEn.toLowerCase().includes(q) && !s.nameBn.includes(search) &&
          !s.id.includes(search) && !s.phone.includes(search) &&
          !s.roll.includes(search) && !s.fatherPhone.includes(search) &&
          !s.motherPhone.includes(search)) return false
    }
    if (fClass    && s.class !== fClass) return false
    if (fSection  && s.section !== fSection) return false
    if (fGender   && !s.gender.includes(fGender)) return false
    if (fActive === 'active' && s.status !== 'approved') return false
    if (fActive === 'inactive' && s.status === 'approved') return false
    if (fReligion && !s.religion.includes(fReligion)) return false
    if (fBlood    && s.bloodGroup !== fBlood) return false
    return true
  }), [students, search, fClass, fSection, fGender, fActive, fReligion, fBlood])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const sp = Math.min(page, totalPages)
  const paginated = useMemo(() => filtered.slice((sp - 1) * perPage, sp * perPage), [filtered, sp, perPage])

  const pageIds = paginated.map(s => s.id)
  const allSel  = pageIds.length > 0 && pageIds.every(id => selected.includes(id))

  const toggleAll = useCallback(() =>
    setSelected(p => allSel ? p.filter(id => !pageIds.includes(id)) : [...new Set([...p, ...pageIds])]),
    [allSel, pageIds])
  const toggleOne = useCallback((id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])

  const stats = useMemo(() => ({
    total:    filtered.length,
    approved: filtered.filter(s => s.status === 'approved').length,
    pending:  filtered.filter(s => s.status === 'pending').length,
    male:     filtered.filter(s => s.gender.includes('Male')).length,
    female:   filtered.filter(s => s.gender.includes('Female')).length,
  }), [filtered])

  const exportExcel = useCallback(() => {
    const list = selected.length > 0 ? filtered.filter(s => selected.includes(s.id)) : filtered
    const data = list.map((s, i) => ({
      '#': i + 1, 'Student ID': s.id,
      'Name EN': s.nameEn, 'Name BN': s.nameBn,
      'Class': `Class ${s.class}`, 'Section': s.section, 'Roll': s.roll,
      'Gender': s.gender.split(' / ')[0], 'DOB': s.dob,
      'Blood': s.bloodGroup, 'Religion': s.religion.split(' / ')[0],
      'Mobile': s.phone, 'Email': s.email, 'District': s.district,
      'Father': s.fatherNameEn, 'Father Mobile': s.fatherPhone,
      'Mother': s.motherNameEn, 'Mother Mobile': s.motherPhone,
      'Admission Date': s.admissionDate, 'Status': s.status,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, `students_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [selected, filtered])

  const handlePDF = useCallback((opts: ListPDFOptions) => {
    const list = selected.length > 0 ? filtered.filter(s => selected.includes(s.id)) : filtered
    const win  = window.open('', '_blank')
    if (!win) return
    win.document.write(generateListPDF(list, opts))
    win.document.close()
    setTimeout(() => win.print(), 800)
    setShowPDF(false)
  }, [selected, filtered])

  const clearFilters = useCallback(() => {
    setSearch(''); setFClass(''); setFSection(''); setFGender(''); setFActive('');
    setFReligion(''); setFBlood(''); setPage(1)
  }, [])
  const hasFilter = search || fClass || fSection || fGender || fActive || fReligion || fBlood

  const sel: React.CSSProperties = {
    padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
    fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
  }

  const statusBadge = (st: string) => {
    const m: Record<string,{b:string;c:string;l:string;lb:string}> = {
      pending:  { b:'var(--amber-light)', c:'var(--amber)',  l:'Pending',  lb:'অপেক্ষমান' },
      approved: { b:'var(--green-light)', c:'var(--green)',  l:'Approved', lb:'অনুমোদিত'  },
      rejected: { b:'var(--red-light)',   c:'var(--red)',    l:'Rejected', lb:'প্রত্যাখ্যাত' },
    }
    const x = m[st] || m.pending
    return <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'10px', background:x.b, color:x.c, whiteSpace:'nowrap' }}>{isBn?x.lb:x.l}</span>
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 60px)' }}>
      {/* Modals */}
      {showPDF && <PDFOptionsModal count={selected.length||filtered.length} isBn={isBn} onClose={() => setShowPDF(false)} onDownload={handlePDF} />}

      {/* View modal */}
      {viewSt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'16px', maxWidth:'560px', width:'100%', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)', margin:'0 auto' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--brand-light)' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{isBn ? viewSt.nameBn||viewSt.nameEn : viewSt.nameEn}</div>
                <div style={{ fontSize:'11px', color:'var(--brand)', fontFamily:'monospace' }}>{viewSt.id}</div>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {statusBadge(viewSt.status)}
                <button onClick={() => setViewSt(null)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={14} style={{ color:'var(--text-secondary)' }} />
                </button>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
              <div style={{ display:'flex', gap:'14px', marginBottom:'14px' }}>
                <div style={{ width:'80px', height:'95px', borderRadius:'8px', border:'1px solid var(--border)', overflow:'hidden', background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {viewSt.photo ? <img src={viewSt.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User size={28} style={{ color:'var(--text-muted)' }} />}
                </div>
                <div>
                  <h3 style={{ fontSize:'16px', fontWeight:600, color:'var(--text-primary)' }}>{viewSt.nameEn}</h3>
                  <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>{viewSt.nameBn}</p>
                  <div style={{ display:'flex', gap:'5px', marginTop:'6px', flexWrap:'wrap' }}>
                    {[
                      { t:`${isBn?'শ্রেণি':'Class'} ${viewSt.class}-${viewSt.section}`, c:'var(--brand)', b:'var(--brand-light)' },
                      { t:viewSt.gender.split(' / ')[0], c:'var(--teal)', b:'var(--teal-light)' },
                      { t:viewSt.bloodGroup, c:'var(--red)', b:'var(--red-light)' },
                    ].filter(x => x.t).map((x,i) => (
                      <span key={i} style={{ fontSize:'11px', fontWeight:500, padding:'2px 8px', borderRadius:'5px', color:x.c, background:x.b }}>{x.t}</span>
                    ))}
                  </div>
                </div>
              </div>
              {[
                [isBn?'মোবাইল':'Mobile', viewSt.phone],
                ['Email', viewSt.email],
                [isBn?'রোল':'Roll', viewSt.roll],
                [isBn?'জন্ম তারিখ':'DOB', viewSt.dob],
                [isBn?'ধর্ম':'Religion', viewSt.religion.split(' / ')[0]],
                [isBn?'জেলা':'District', viewSt.district],
                [isBn?'বর্তমান ঠিকানা':'Address', viewSt.presentAddress],
                [isBn?'পিতার নাম':"Father", viewSt.fatherNameEn],
                [isBn?'পিতার মোবাইল':"Father Mobile", viewSt.fatherPhone],
                [isBn?'মাতার নাম':"Mother", viewSt.motherNameEn],
                [isBn?'মাতার মোবাইল':"Mother Mobile", viewSt.motherPhone],
                [isBn?'ভর্তির তারিখ':'Admission Date', viewSt.admissionDate],
              ].map(([l,v]) => v ? (
                <div key={String(l)} style={{ display:'flex', gap:'8px', padding:'5px 0', borderBottom:'0.5px solid var(--border)' }}>
                  <span style={{ fontSize:'11px', color:'var(--text-muted)', width:'120px', flexShrink:0 }}>{l}</span>
                  <span style={{ fontSize:'12px', color:'var(--text-primary)', fontWeight:500 }}>{v}</span>
                </div>
              ) : null)}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:'8px', justifyContent:'flex-end', flexWrap:'wrap' }}>
              <button onClick={() => {
                const win = window.open('','_blank')
                if (!win) return
                win.document.write(generateA4HTML(viewSt, isBn))
                win.document.close()
                setTimeout(() => { win.print() }, 600)
              }}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', fontSize:'13px', fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                <FileText size={13} />PDF
              </button>
              <button onClick={() => setViewSt(null)}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বন্ধ':'Close'}
              </button>
              <button onClick={() => { navigate('/students/update', { state:{ studentId: viewSt.id } }); setViewSt(null) }}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:'var(--amber)', border:'none', color:'#fff', fontSize:'13px', fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                <Edit2 size={13} />{isBn?'এডিট':'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Section - fixed, does not scroll */}
      <div style={{ flexShrink:0 }}>
        {/* Page header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/students')}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px', background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'13px', color:'var(--text-secondary)', fontFamily:'inherit', flexShrink:0 }}>
          <ArrowLeft size={14} />
          {isBn?'ফিরে যান':'Back'}
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{ fontSize:isMobile?'18px':'22px', fontWeight:600, color:'var(--text-primary)' }}>
            {isBn?'সকল ছাত্র':'All Students'}
          </h1>
          <div style={{ display:'flex', flexWrap:'wrap', gap: isMobile ? '4px 10px' : '6px', marginTop:'4px' }}>
            {[
              { label: isBn?'মোট':'Total', value: stats.total },
              { label: isBn?'অনুমোদিত':'Approved', value: stats.approved, color:'var(--green)' },
              { label: isBn?'অপেক্ষমান':'Pending', value: stats.pending, color:'var(--amber)' },
              { label: isBn?'ছেলে':'Male', value: stats.male, color:'var(--teal)' },
              { label: isBn?'মেয়ে':'Female', value: stats.female, color:'var(--purple)' },
            ].map(s => (
              <span key={s.label} style={{ fontSize:'12px', color: s.color || 'var(--text-secondary)', fontWeight: s.color ? 600 : 400 }}>
                {s.label} {s.value}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/students/update')}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px', background:'var(--amber-light)', border:'1px solid var(--amber)', color:'var(--amber)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
            <Edit2 size={14} />{isBn?'আপডেট':'Update'}
          </button>
          <button onClick={() => navigate('/students/bulk-update')}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px', background:'var(--green-light)', border:'1px solid var(--green)', color:'var(--green)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
            <Layers size={14} />{isBn?'বাল্ক আপডেট':'Bulk Update'}
          </button>
        </div>
      </div>

      {/* Sticky Filters + Toolbar */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'var(--bg-primary)', paddingTop:'2px', paddingBottom:'4px' }}>
        {/* Filters */}
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 14px', marginBottom:'10px' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(160px, 1fr))', gap:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'8px', padding:'7px 10px' }}>
            <Search size={14} style={{ color:'var(--text-muted)', flexShrink:0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder={isBn?'নাম, আইডি, রোল, মোবাইল...':'Name, ID, roll, mobile...'}
              style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'13px', color:'var(--text-primary)', fontFamily:'inherit' }} />
            {search && <button onClick={() => setSearch('')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={12} /></button>}
          </div>
          <select value={fClass} onChange={e => { setFClass(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব শ্রেণি':'All Classes'}</option>
            {CLASSES.map(c => <option key={c} value={c}>{isBn?`শ্রেণি ${c}`:`Class ${c}`}</option>)}
          </select>
          <select value={fSection} onChange={e => { setFSection(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব সেকশন':'All Sections'}</option>
            {SECTIONS.map(s => <option key={s} value={s}>{isBn?`সেকশন ${s}`:`Section ${s}`}</option>)}
          </select>
          <select value={fGender} onChange={e => { setFGender(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব লিঙ্গ':'All Genders'}</option>
            <option value="Male">{isBn?'ছেলে':'Male'}</option>
            <option value="Female">{isBn?'মেয়ে':'Female'}</option>
          </select>
          <select value={fReligion} onChange={e => { setFReligion(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব ধর্ম':'All Religions'}</option>
            <option value="Islam">{isBn?'ইসলাম':'Islam'}</option>
            <option value="Hinduism">{isBn?'হিন্দু':'Hinduism'}</option>
            <option value="Christianity">{isBn?'খ্রিস্টান':'Christianity'}</option>
            <option value="Buddhism">{isBn?'বৌদ্ধ':'Buddhism'}</option>
          </select>
          <select value={fBlood} onChange={e => { setFBlood(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'রক্তের গ্রুপ':'Blood Group'}</option>
            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={fActive} onChange={e => { setFActive(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব অবস্থা':'All Status'}</option>
            <option value="active">{isBn?'সক্রিয়':'Active'}</option>
            <option value="inactive">{isBn?'নিষ্ক্রিয়':'Inactive'}</option>
          </select>
        </div>
        {hasFilter && (
          <button onClick={clearFilters}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'6px', background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', fontSize:'11px', cursor:'pointer', fontFamily:'inherit', marginTop:'8px' }}>
            <X size={11} />{isBn?'ফিল্টার সরান':'Clear Filters'}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
          <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{isBn?'প্রতি পাতায়:':'Per page:'}</span>
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }} style={{ ...sel, padding:'5px 8px' }}>
            {PER_PAGE_OPTS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {selected.length > 0 && (
            <span style={{ fontSize:'12px', color:'var(--brand)', background:'var(--brand-light)', padding:'3px 10px', borderRadius:'6px', fontWeight:500 }}>
              {selected.length} {isBn?'নির্বাচিত':'selected'}
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          <button onClick={exportExcel}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', background:'var(--green-light)', border:'1px solid var(--green)', color:'var(--green)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
            <FileSpreadsheet size={13} />Excel
          </button>
          <button onClick={() => setShowPDF(true)}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
            <FileText size={13} />PDF {selected.length>0?`(${selected.length})`:`(${filtered.length})`}
          </button>
        </div>
        </div>
      </div>
      </div>

      {/* Table - scrollable */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', marginTop:'4px' }}>
        <div style={{ flex:1, overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                <th style={{ padding:'10px 12px', width:'36px', ...(isMobile ? {} : { position:'sticky', left:0, zIndex:4, background:'var(--bg-primary)' }) }}>
                  <input type="checkbox" checked={allSel} onChange={toggleAll}
                    style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'var(--brand)' }} />
                </th>
                {[
                  { l:'#', w:'36px', sticky:!isMobile, left:'36px' },
                  { l:isBn?'ছবি':'Photo', w:'44px', sticky:!isMobile, left:'72px' },
                  { l:isBn?'ছাত্র আইডি':'Student ID', w:'140px', sticky:!isMobile, left:'116px' },
                  { l:isBn?'নাম':'Name', w:'160px', sticky:!isMobile, left:'256px' },
                  { l:isBn?'শ্রেণি/রোল':'Class/Roll', w:'90px', sticky:!isMobile, left:'416px' },
                  { l:isBn?'লিঙ্গ':'Gender', w:'65px' },
                  { l:isBn?'রক্ত':'Blood', w:'55px' },
                  { l:isBn?'মোবাইল':'Mobile', w:'108px' },
                  { l:isBn?'পিতার মোবাইল':"Father Mobile", w:'108px' },
                  { l:isBn?'জেলা':'District', w:'75px' },
                  { l:isBn?'অবস্থা':'Status', w:'85px' },
                  { l:isBn?'অ্যাকশন':'Action', w:'70px' },
                ].map(h => (
                  <th key={h.l} style={{ padding:'10px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', whiteSpace:'nowrap', minWidth:h.w, ...(h.sticky ? { position:'sticky', left:h.left, zIndex:4, background:'var(--bg-primary)' } : {}) }}>
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={13} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                    <Users size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                    {isBn?'কোনো ছাত্র পাওয়া যায়নি':'No students found'}
                  </td></tr>
                : paginated.map((s, i) => (
                  <tr key={s.id}
                    style={{ borderBottom:'0.5px solid var(--border)', background:selected.includes(s.id)?'rgba(99,102,241,0.04)':'transparent', cursor:'default' }}
                    onMouseEnter={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding:'8px 12px', ...(isMobile ? {} : { position:'sticky', left:0, zIndex:3, background:'var(--bg-primary)' }) }}>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)}
                        style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'var(--brand)' }} />
                    </td>
                    <td style={{ padding:'8px 8px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px', ...(isMobile ? {} : { position:'sticky', left:'36px', zIndex:3, background:'var(--bg-primary)' }) }}>{(sp-1)*perPage+i+1}</td>
                    <td style={{ padding:'7px 8px', ...(isMobile ? {} : { position:'sticky', left:'72px', zIndex:3, background:'var(--bg-primary)' }) }}>
                      <div style={{ width:'30px', height:'36px', borderRadius:'5px', overflow:'hidden', background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {s.photo ? <img src={s.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User size={13} style={{ color:'var(--text-muted)' }} />}
                      </div>
                    </td>
                    <td style={{ padding:'8px 8px', ...(isMobile ? {} : { position:'sticky', left:'116px', zIndex:3, background:'var(--bg-primary)' }) }}>
                      <span style={{ fontSize:'10px', fontFamily:'monospace', color:'var(--brand)', background:'var(--brand-light)', padding:'2px 5px', borderRadius:'4px' }}>{s.id}</span>
                    </td>
                    <td style={{ padding:'8px 8px', ...(isMobile ? {} : { position:'sticky', left:'256px', zIndex:3, background:'var(--bg-primary)' }) }}>
                      <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'155px' }}>{isBn?s.nameBn||s.nameEn:s.nameEn}</div>
                      <div style={{ fontSize:'10px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{isBn?s.nameEn:s.nameBn}</div>
                    </td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontSize:'11px', whiteSpace:'nowrap', ...(isMobile ? {} : { position:'sticky', left:'416px', zIndex:3, background:'var(--bg-primary)' }) }}>
                      {isBn?`শ্র ${s.class}`:`Cls ${s.class}`}{s.section?`-${s.section}`:''}{s.roll?` / ${s.roll}`:''}
                    </td>
                    <td style={{ padding:'8px 8px' }}>
                      <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'5px', background:s.gender.includes('Female')?'var(--purple-light)':'var(--teal-light)', color:s.gender.includes('Female')?'var(--purple)':'var(--teal)', fontWeight:500 }}>
                        {s.gender.includes('Female')?(isBn?'মেয়ে':'Female'):(isBn?'ছেলে':'Male')}
                      </span>
                    </td>
                    <td style={{ padding:'8px 8px', fontSize:'11px', color:'var(--red)', fontWeight:500 }}>{s.bloodGroup||'—'}</td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontFamily:'monospace', fontSize:'11px' }}>{s.phone}</td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontFamily:'monospace', fontSize:'11px' }}>{s.fatherPhone}</td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontSize:'11px' }}>{s.district||'—'}</td>
                    <td style={{ padding:'8px 8px' }}>{statusBadge(s.status)}</td>
                    <td style={{ padding:'8px 8px' }}>
                      <div style={{ display:'flex', gap:'3px' }}>
                        <button onClick={() => setViewSt(s)} title="View"
                          style={{ width:'26px', height:'26px', borderRadius:'6px', background:'var(--brand-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--brand)' }}>
                          <Eye size={12} />
                        </button>
                        <button onClick={() => navigate('/students/update', { state:{ studentId: s.id } })} title="Edit"
                          style={{ width:'26px', height:'26px', borderRadius:'6px', background:'var(--amber-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--amber)' }}>
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-secondary)', flexWrap:'wrap', gap:'8px' }}>
          <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>
            {(sp-1)*perPage+1}–{Math.min(sp*perPage,filtered.length)} / {filtered.length}
          </span>
          <div style={{ display:'flex', gap:'3px' }}>
            {([[<ChevronsLeft size={12} />,()=>setPage(1),sp===1] as [React.ReactNode,()=>void,boolean],[<ChevronLeft size={12} />,()=>setPage(p=>Math.max(1,p-1)),sp===1] as [React.ReactNode,()=>void,boolean]]).map(([ic,a,d],i)=>(
              <button key={i} onClick={a} disabled={d}
                style={{ width:'28px', height:'28px', borderRadius:'6px', border:'1px solid var(--border)', background:'var(--bg-primary)', color:d?'var(--text-muted)':'var(--text-secondary)', cursor:d?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {ic}
              </button>
            ))}
            {(()=>{
              const start = Math.max(1, Math.min(sp-2, totalPages-4))
              return Array.from({ length: Math.min(5, totalPages) }, (_,i) => start+i).map(p => (
                <button key={p} onClick={()=>setPage(p)}
                  style={{ width:'28px', height:'28px', borderRadius:'6px', border:`1px solid ${p===sp?'var(--brand)':'var(--border)'}`, background:p===sp?'var(--brand)':'var(--bg-primary)', color:p===sp?'#fff':'var(--text-secondary)', cursor:'pointer', fontSize:'12px', fontWeight:p===sp?600:400 }}>
                  {p}
                </button>
              ))
            })()}
            {([[<ChevronRight size={12} />,()=>setPage(p=>Math.min(totalPages,p+1)),sp===totalPages] as [React.ReactNode,()=>void,boolean],[<ChevronsRight size={12} />,()=>setPage(totalPages),sp===totalPages] as [React.ReactNode,()=>void,boolean]]).map(([ic,a,d],i)=>(
              <button key={i} onClick={a} disabled={d}
                style={{ width:'28px', height:'28px', borderRadius:'6px', border:'1px solid var(--border)', background:'var(--bg-primary)', color:d?'var(--text-muted)':'var(--text-secondary)', cursor:d?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {ic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
