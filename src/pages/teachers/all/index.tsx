import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, UserPlus, X, Search, Eye, Edit2, FileText, Trash2, AlertTriangle, FileSpreadsheet, Users, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { TeacherPDFOptionsModal } from '@/components/shared/TeacherPDFOptionsModal'
import { generateTeacherListPDF } from '@/pages/teachers/listPdfTemplate'
import type { TeacherListPDFOptions } from '@/pages/teachers/listPdfTemplate'
import type { Teacher, TeacherStatus } from '@/pages/teachers/types'

const PER_PAGE_OPTS = [10, 20, 30, 50, 100, 200, 500, 1000]
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

export default function AllTeachersPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { teachers, departments, subjects, deleteTeacher } = useTeacherStore()
  const isBn = language === 'bn'

  const [search, setSearch] = useState('')
  const [fDept, setFDept] = useState('')
  const [fGender, setFGender] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fBlood, setFBlood] = useState('')
  const [fReligion, setFReligion] = useState('')
  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)
  const { isMobile } = useWindowSize()
  const [viewT, setViewT] = useState<Teacher | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)
  const [showPDF, setShowPDF] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = useMemo(() => teachers.filter(t => {
    if (search) {
      const q = search.toLowerCase()
      if (!t.nameEn.toLowerCase().includes(q) && !t.nameBn.includes(search) &&
          !t.id.includes(q) && !t.phone.includes(q) &&
          !t.email.toLowerCase().includes(q) && !t.nid.includes(q) &&
          !t.fatherNameEn.toLowerCase().includes(q) && !t.motherNameEn.toLowerCase().includes(q) &&
          !t.fatherPhone.includes(q) && !t.motherPhone.includes(q)) return false
    }
    if (fDept && t.departmentId !== fDept) return false
    if (fGender && t.gender !== fGender) return false
    if (fStatus && t.status !== fStatus) return false
    if (fBlood && t.bloodGroup !== fBlood) return false
    if (fReligion && !t.religion.includes(fReligion)) return false
    return true
  }), [teachers, search, fDept, fGender, fStatus, fBlood, fReligion])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const sp = Math.min(page, totalPages)
  const paginated = useMemo(() => filtered.slice((sp - 1) * perPage, sp * perPage), [filtered, sp, perPage])

  const pageIds = paginated.map(t => t.id)
  const allSel  = pageIds.length > 0 && pageIds.every(id => selected.includes(id))

  const toggleAll = useCallback(() =>
    setSelected(p => allSel ? p.filter(id => !pageIds.includes(id)) : [...new Set([...p, ...pageIds])]),
    [allSel, pageIds])
  const toggleOne = useCallback((id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), [])

  const stats = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter(t => t.status === 'active').length,
    inactive: filtered.filter(t => t.status === 'inactive').length,
    onLeave: filtered.filter(t => t.status === 'on-leave').length,
  }), [filtered])

  const clearFilters = useCallback(() => {
    setSearch(''); setFDept(''); setFGender(''); setFStatus(''); setFBlood(''); setFReligion(''); setPage(1)
  }, [])
  const hasFilter = search || fDept || fGender || fStatus || fBlood || fReligion

  const getDeptName = (id: string) => {
    const d = departments.find(x => x.id === id)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }
  const getSubjectNames = (ids: string[]) => {
    return ids.map(id => {
      const s = subjects.find(x => x.id === id)
      return s ? (isBn ? s.nameBn : s.name) : ''
    }).filter(Boolean).join(', ') || '—'
  }

  const handleDelete = (id: string) => {
    deleteTeacher(id)
    setDelConfirm(null)
    setViewT(null)
  }

  const statusBadge = (st: TeacherStatus) => {
    const m: Record<TeacherStatus, {b:string;c:string;l:string;lb:string}> = {
      'active': { b:'var(--green-light)', c:'var(--green)', l:'Active', lb:'সক্রিয়' },
      'inactive': { b:'var(--red-light)', c:'var(--red)', l:'Inactive', lb:'নিষ্ক্রিয়' },
      'on-leave': { b:'var(--amber-light)', c:'var(--amber)', l:'On Leave', lb:'ছুটিতে' },
    }
    const x = m[st]
    return <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'10px', background:x.b, color:x.c, whiteSpace:'nowrap' }}>{isBn?x.lb:x.l}</span>
  }

  const exportExcel = useCallback(() => {
    const list = selected.length > 0 ? filtered.filter(t => selected.includes(t.id)) : filtered
    const data = list.map((t, i) => ({
      '#': i + 1, 'Teacher ID': t.id,
      'Name EN': t.nameEn, 'Name BN': t.nameBn,
      'Gender': t.gender, 'Phone': t.phone, 'Email': t.email,
      'Department': getDeptName(t.departmentId), 'Designation': t.designation,
      'Qualification': t.qualification, 'Experience': t.experience,
      'Blood Group': t.bloodGroup, 'Religion': t.religion,
      'In Time': t.inTime, 'Out Time': t.outTime,
      'Salary': t.salary, 'Joining Date': t.joiningDate, 'Status': t.status,
      'Father': t.fatherNameEn, 'Father Phone': t.fatherPhone,
      'Mother': t.motherNameEn, 'Mother Phone': t.motherPhone,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers')
    XLSX.writeFile(wb, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [selected, filtered, departments, isBn])

  const handlePDF = useCallback((opts: TeacherListPDFOptions) => {
    const list = selected.length > 0 ? filtered.filter(t => selected.includes(t.id)) : filtered
    const win  = window.open('', '_blank')
    if (!win) return
    win.document.write(generateTeacherListPDF(list, opts, departments))
    win.document.close()
    setTimeout(() => win.print(), 800)
    setShowPDF(false)
  }, [selected, filtered, departments])

  const downloadSinglePDF = useCallback((t: Teacher) => {
    const win = window.open('', '_blank')
    if (!win) return
    const photoHtml = t.photo ? `<div style="text-align:center;margin-bottom:10px"><img src="${t.photo}" alt="${t.nameEn}" style="width:100px;height:120px;border-radius:8px;border:2px solid #6366f1;object-fit:cover" /></div>` : ''
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t.nameEn}</title>
<style>@page{size:A4 portrait;margin:12mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid #6366f1;margin-bottom:12px}.logo{width:36px;height:36px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700}.ttl{text-align:center;font-size:14px;font-weight:700;margin:10px 0 4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:12px}.info{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:12px}.info div{display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0}.info .lbl{font-size:10px;color:#888;width:100px;flex-shrink:0}.info .val{font-size:11px;font-weight:500;color:#1a1a1a}.ftr{margin-top:14px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:14px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:9px;color:#888">Employee Profile</div></div></div>
${photoHtml}
<div class="ttl">${t.nameEn}</div>
<div class="sub">${t.nameBn} · ${t.id}</div>
<div class="info">
  <div><span class="lbl">${isBn?'পদবি':'Designation'}</span><span class="val">${t.designation || '—'}</span></div>
  <div><span class="lbl">${isBn?'বিভাগ':'Department'}</span><span class="val">${getDeptName(t.departmentId)}</span></div>
  <div><span class="lbl">${isBn?'বিষয়':'Subjects'}</span><span class="val">${getSubjectNames(t.subjectIds)}</span></div>
  <div><span class="lbl">${isBn?'লিঙ্গ':'Gender'}</span><span class="val">${t.gender === 'Male' ? (isBn?'পুরুষ':'Male') : (isBn?'মহিলা':'Female')}</span></div>
  <div><span class="lbl">${isBn?'মোবাইল':'Phone'}</span><span class="val">${t.phone}</span></div>
  <div><span class="lbl">Email</span><span class="val">${t.email}</span></div>
  <div><span class="lbl">${isBn?'ঠিকানা':'Address'}</span><span class="val">${t.address}</span></div>
  <div><span class="lbl">${isBn?'জন্ম তারিখ':'DOB'}</span><span class="val">${t.dob}</span></div>
  <div><span class="lbl">${isBn?'রক্তের গ্রুপ':'Blood'}</span><span class="val">${t.bloodGroup}</span></div>
  <div><span class="lbl">${isBn?'ধর্ম':'Religion'}</span><span class="val">${t.religion}</span></div>
  <div><span class="lbl">${isBn?'যোগ্যতা':'Qualification'}</span><span class="val">${t.qualification}</span></div>
  <div><span class="lbl">${isBn?'অভিজ্ঞতা':'Experience'}</span><span class="val">${t.experience}</span></div>
  <div><span class="lbl">${isBn?'যোগদানের তারিখ':'Joining Date'}</span><span class="val">${t.joiningDate}</span></div>
  <div><span class="lbl">${isBn?'বেতন':'Salary'}</span><span class="val">৳${t.salary.toLocaleString()}</span></div>
  <div><span class="lbl">${isBn?'ইন টাইম':'In Time'}</span><span class="val">${t.inTime}</span></div>
  <div><span class="lbl">${isBn?'আউট টাইম':'Out Time'}</span><span class="val">${t.outTime}</span></div>
  <div><span class="lbl">${isBn?'জাতীয় পরিচয়':'NID'}</span><span class="val">${t.nid}</span></div>
  <div><span class="lbl">${isBn?'অবস্থা':'Status'}</span><span class="val"><b style="color:${t.status==='active'?'#10b981':t.status==='inactive'?'#ef4444':'#f59e0b'}">${t.status==='active'?(isBn?'সক্রিয়':'Active'):t.status==='inactive'?(isBn?'নিষ্ক্রিয়':'Inactive'):(isBn?'ছুটিতে':'On Leave')}</b></span></div>
</div>
<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb">
  <div style="font-size:11px;font-weight:600;margin-bottom:6px">${isBn?'অভিভাবক তথ্য':'Parent/Guardian Info'}</div>
  <div class="info">
    <div><span class="lbl">${isBn?'পিতার নাম':'Father'}</span><span class="val">${t.fatherNameEn}</span></div>
    <div><span class="lbl">${isBn?'পিতার মোবাইল':'Father Phone'}</span><span class="val">${t.fatherPhone}</span></div>
    <div><span class="lbl">${isBn?'মাতার নাম':'Mother'}</span><span class="val">${t.motherNameEn}</span></div>
    <div><span class="lbl">${isBn?'মাতার মোবাইল':'Mother Phone'}</span><span class="val">${t.motherPhone}</span></div>
  </div>
</div>
<div class="ftr"><span>EduTech School Management System</span><div>${isBn?'মুদ্রণ:':'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [departments, isBn])

  const sel: React.CSSProperties = {
    padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
    fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
  }

  return (
    <div>
      {/* PDF Modal */}
      {showPDF && <TeacherPDFOptionsModal count={selected.length||filtered.length} isBn={isBn} onClose={() => setShowPDF(false)} onDownload={handlePDF} />}

      {/* View Modal */}
      {viewT && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-primary)', borderRadius:'16px', maxWidth:'560px', width:'100%', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--brand-light)' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{isBn?viewT.nameBn||viewT.nameEn:viewT.nameEn}</div>
                <div style={{ fontSize:'11px', color:'var(--brand)', fontFamily:'monospace' }}>{viewT.id}</div>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {statusBadge(viewT.status)}
                <button onClick={() => setViewT(null)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
<X size={14} style={{ color:'var(--text-secondary)' }} />
                </button>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
              <div style={{ display:'flex', gap:'14px', marginBottom:'14px' }}>
                <div style={{ width:'80px', height:'95px', borderRadius:'8px', border:'1px solid var(--border)', overflow:'hidden', background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {viewT.photo ? <img src={viewT.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User size={28} style={{ color:'var(--text-muted)' }} />}
                </div>
                <div>
                  <h3 style={{ fontSize:'16px', fontWeight:600, color:'var(--text-primary)' }}>{viewT.nameEn}</h3>
                  <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>{viewT.nameBn}</p>
                  <div style={{ display:'flex', gap:'5px', marginTop:'6px', flexWrap:'wrap' }}>
                    {[
                      { t:getDeptName(viewT.departmentId), c:'var(--brand)', b:'var(--brand-light)' },
                      { t:viewT.designation, c:'var(--teal)', b:'var(--teal-light)' },
                      { t:viewT.gender==='Male'?(isBn?'পুরুষ':'Male'):(isBn?'মহিলা':'Female'), c:'var(--purple)', b:'var(--purple-light)' },
                      { t:viewT.bloodGroup, c:'var(--red)', b:'var(--red-light)' },
                    ].filter(x => x.t).map((x,i) => (
                      <span key={i} style={{ fontSize:'11px', fontWeight:500, padding:'2px 8px', borderRadius:'5px', color:x.c, background:x.b }}>{x.t}</span>
                    ))}
                  </div>
                </div>
              </div>
              {[
                [isBn?'মোবাইল':'Phone', viewT.phone],
                ['Email', viewT.email],
                [isBn?'ঠিকানা':'Address', viewT.address],
                [isBn?'জন্ম তারিখ':'DOB', viewT.dob],
                [isBn?'রক্তের গ্রুপ':'Blood', viewT.bloodGroup],
                [isBn?'ধর্ম':'Religion', viewT.religion],
                [isBn?'বিভাগ':'Department', getDeptName(viewT.departmentId)],
                [isBn?'বিষয়':'Subjects', getSubjectNames(viewT.subjectIds)],
                [isBn?'পদবি':'Designation', viewT.designation],
                [isBn?'যোগ্যতা':'Qualification', viewT.qualification],
                [isBn?'অভিজ্ঞতা':'Experience', viewT.experience],
                [isBn?'যোগদানের তারিখ':'Joining Date', viewT.joiningDate],
                [isBn?'বেতন':'Salary', `৳${viewT.salary.toLocaleString()}`],
                [isBn?'প্রবেশ সময়':'In Time', viewT.inTime],
                [isBn?'প্রস্থান সময়':'Out Time', viewT.outTime],
                [isBn?'জাতীয় পরিচয়':'NID', viewT.nid],
                [isBn?'জরুরি মোবাইল':'Emergency Phone', viewT.emergencyPhone],
                [isBn?'পিতার নাম':'Father', viewT.fatherNameEn],
                [isBn?'পিতার মোবাইল':'Father Phone', viewT.fatherPhone],
                [isBn?'মাতার নাম':'Mother', viewT.motherNameEn],
                [isBn?'মাতার মোবাইল':'Mother Phone', viewT.motherPhone],
                [isBn?'অভিভাবক':'Guardian', viewT.guardianName],
                [isBn?'অভিভাবক মোবাইল':'Guardian Phone', viewT.guardianPhone],
                [isBn?'অভিভাবক ঠিকানা':'Parent Address', viewT.parentAddress],
              ].map(([l,v]) => v ? (
                <div key={String(l)} style={{ display:'flex', gap:'8px', padding:'5px 0', borderBottom:'0.5px solid var(--border)' }}>
                  <span style={{ fontSize:'11px', color:'var(--text-muted)', width:'120px', flexShrink:0 }}>{l}</span>
                  <span style={{ fontSize:'12px', color:'var(--text-primary)', fontWeight:500 }}>{v}</span>
                </div>
              ) : null)}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => downloadSinglePDF(viewT)}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px',
                  background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)',
                  fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                <FileText size={13} />PDF
              </button>
              <button onClick={() => { setDelConfirm(viewT.id) }}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px',
                  background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)',
                  fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                <Trash2 size={13} />{isBn?'মুছুন':'Delete'}
              </button>
              <button onClick={() => { navigate(`/teachers/edit/${viewT.id}`); setViewT(null) }}
                style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px',
                  background:'var(--amber)', border:'none', color:'#fff', fontSize:'13px', fontWeight:500,
                  cursor:'pointer', fontFamily:'inherit' }}>
                <Edit2 size={13} />{isBn?'এডিট':'Edit'}
              </button>
              <button onClick={() => setViewT(null)}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)',
                  border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px',
                  cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বন্ধ':'Close'}
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
              {isBn?'এই শিক্ষককে স্থায়ীভাবে মুছে ফেলা হবে।':'This teacher will be permanently deleted.'}
            </p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setDelConfirm(null)}
                style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                {isBn?'বাতিল':'Cancel'}
              </button>
              <button onClick={() => handleDelete(delConfirm)}
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
            {isBn?'সকল শিক্ষক':'All Teachers'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {isBn
              ? `মোট ${stats.total} জন · সক্রিয় ${stats.active} · নিষ্ক্রিয় ${stats.inactive} · ছুটিতে ${stats.onLeave}`
              : `Total ${stats.total} · Active ${stats.active} · Inactive ${stats.inactive} · On Leave ${stats.onLeave}`}
          </p>
        </div>
        <button onClick={() => navigate('/teachers/add')}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px',
            background:'var(--teal-light)', border:'1px solid var(--teal)', color:'var(--teal)',
            fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
          <UserPlus size={14} />{isBn?'নতুন যোগ করুন':'Add Teacher'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 14px', marginBottom:'10px' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 1fr 1fr', gap:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'8px', padding:'7px 10px' }}>
            <Search size={14} style={{ color:'var(--text-muted)', flexShrink:0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder={isBn?'নাম, আইডি, মোবাইল, পিতা, মাতা...':'Name, ID, phone, father, mother...'}
              style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'13px', color:'var(--text-primary)', fontFamily:'inherit' }} />
            {search && <button onClick={() => setSearch('')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={12} /></button>}
          </div>
          <select value={fDept} onChange={e => { setFDept(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব বিভাগ':'All Depts'}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{isBn?d.nameBn:d.name}</option>)}
          </select>
          <select value={fGender} onChange={e => { setFGender(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব লিঙ্গ':'All Genders'}</option>
            <option value="Male">{isBn?'পুরুষ':'Male'}</option>
            <option value="Female">{isBn?'মহিলা':'Female'}</option>
          </select>
          <select value={fReligion} onChange={e => { setFReligion(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব ধর্ম':'All Religions'}</option>
            <option value="Islam">{isBn?'ইসলাম':'Islam'}</option>
            <option value="Hinduism">{isBn?'হিন্দু':'Hinduism'}</option>
            <option value="Christianity">{isBn?'খ্রিস্টান':'Christianity'}</option>
            <option value="Buddhism">{isBn?'বৌদ্ধ':'Buddhism'}</option>
          </select>
          <select value={fBlood} onChange={e => { setFBlood(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'রক্তের গ্রুপ':'Blood'}</option>
            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1) }} style={sel}>
            <option value="">{isBn?'সব অবস্থা':'All Status'}</option>
            <option value="active">{isBn?'সক্রিয়':'Active'}</option>
            <option value="inactive">{isBn?'নিষ্ক্রিয়':'Inactive'}</option>
            <option value="on-leave">{isBn?'ছুটিতে':'On Leave'}</option>
          </select>
        </div>
        {hasFilter && (
          <button onClick={clearFilters}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'6px',
              background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)',
              fontSize:'11px', cursor:'pointer', fontFamily:'inherit', marginTop:'8px' }}>
            <X size={11} />{isBn?'ফিল্টার সরান':'Clear Filters'}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px', flexWrap:'wrap', gap:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
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
        <div style={{ display:'flex', gap:'6px' }}>
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

      {/* Table */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        <div style={{ overflowX:'auto', ...(isMobile ? { maxHeight:'60vh', overflowY:'auto' } : {}) }}>
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
                    { l:isBn?'আইডি':'ID', w:'130px', sticky:!isMobile, left:'116px' },
                    { l:isBn?'নাম':'Name', w:'160px', sticky:!isMobile, left:'246px' },
                    { l:isBn?'বিভাগ':'Dept', w:'100px', sticky:!isMobile, left:'406px' },
                    { l:isBn?'পদবি':'Designation', w:'120px', sticky:!isMobile, left:'506px' },
                    { l:isBn?'লিঙ্গ':'Gender', w:'65px' },
                    { l:isBn?'রক্ত':'Blood', w:'55px' },
                    { l:isBn?'মোবাইল':'Phone', w:'108px' },
                    { l:isBn?'ইন টাইম':'In Time', w:'70px' },
                    { l:isBn?'আউট টাইম':'Out Time', w:'75px' },
                    { l:isBn?'অবস্থা':'Status', w:'85px' },
                    { l:isBn?'অ্যাকশন':'Action', w:'70px' },
                  ].map(h => (
                    <th key={h.l} style={{ padding:'10px 8px', textAlign:'left', fontSize:'10px', fontWeight:600,
                      color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px',
                      whiteSpace:'nowrap', minWidth:h.w, ...(h.sticky ? { position:'sticky', left:h.left, zIndex:4, background:'var(--bg-primary)' } : {}) }}>
                      {h.l}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={14} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                    <Users size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                    {isBn?'কোনো শিক্ষক পাওয়া যায়নি':'No teachers found'}
                  </td></tr>
                : paginated.map((t, i) => (
                  <tr key={t.id}
                    style={{ borderBottom:'0.5px solid var(--border)', background:selected.includes(t.id)?'rgba(99,102,241,0.04)':'transparent', cursor:'default' }}
                    onMouseEnter={e => { if (!selected.includes(t.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { if (!selected.includes(t.id)) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding:'8px 12px', ...(isMobile ? {} : { position:'sticky', left:0, zIndex:3, background:'var(--bg-primary)' }) }}>
                      <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggleOne(t.id)}
                        style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'var(--brand)' }} />
                    </td>
                    <td style={{ padding:'8px 8px', color:'var(--text-muted)', fontWeight:600, fontSize:'11px', ...(isMobile ? {} : { position:'sticky', left:'36px', zIndex:3, background:'var(--bg-primary)' }) }}>{(sp-1)*perPage+i+1}</td>
                    <td style={{ padding:'7px 8px', ...(isMobile ? {} : { position:'sticky', left:'72px', zIndex:3, background:'var(--bg-primary)' }) }}>
                      <div style={{ width:'30px', height:'36px', borderRadius:'5px', overflow:'hidden', background:'var(--bg-secondary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {t.photo ? <img src={t.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User size={13} style={{ color:'var(--text-muted)' }} />}
                      </div>
                    </td>
                    <td style={{ padding:'8px 8px', ...(isMobile ? {} : { position:'sticky', left:'116px', zIndex:3, background:'var(--bg-primary)' }) }}>
                      <span style={{ fontSize:'10px', fontFamily:'monospace', color:'var(--brand)', background:'var(--brand-light)', padding:'2px 5px', borderRadius:'4px' }}>{t.id}</span>
                    </td>
                    <td style={{ padding:'8px 8px', ...(isMobile ? {} : { position:'sticky', left:'246px', zIndex:3, background:'var(--bg-primary)' }) }}>
                      <div style={{ fontSize:'12px', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'155px' }}>{isBn?t.nameBn||t.nameEn:t.nameEn}</div>
                      <div style={{ fontSize:'10px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{isBn?t.nameEn:t.nameBn}</div>
                    </td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontSize:'11px', ...(isMobile ? {} : { position:'sticky', left:'406px', zIndex:3, background:'var(--bg-primary)' }) }}>{getDeptName(t.departmentId)}</td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontSize:'11px', ...(isMobile ? {} : { position:'sticky', left:'506px', zIndex:3, background:'var(--bg-primary)' }) }}>{t.designation || '—'}</td>
                    <td style={{ padding:'8px 8px' }}>
                      <span style={{ fontSize:'10px', padding:'2px 6px', borderRadius:'5px', background:t.gender==='Female'?'var(--purple-light)':'var(--teal-light)', color:t.gender==='Female'?'var(--purple)':'var(--teal)', fontWeight:500 }}>
                        {t.gender==='Female'?(isBn?'মহিলা':'Female'):(isBn?'পুরুষ':'Male')}
                      </span>
                    </td>
                    <td style={{ padding:'8px 8px', fontSize:'11px', color:'var(--red)', fontWeight:500 }}>{t.bloodGroup||'—'}</td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontFamily:'monospace', fontSize:'11px' }}>{t.phone}</td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontSize:'11px' }}>{t.inTime || '—'}</td>
                    <td style={{ padding:'8px 8px', color:'var(--text-secondary)', fontSize:'11px' }}>{t.outTime || '—'}</td>
                    <td style={{ padding:'8px 8px' }}>{statusBadge(t.status)}</td>
                    <td style={{ padding:'8px 8px' }}>
                      <div style={{ display:'flex', gap:'3px' }}>
                        <button onClick={() => navigate(`/teachers/all/${t.id}`)} title="View"
                          style={{ width:'26px', height:'26px', borderRadius:'6px', background:'var(--brand-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--brand)' }}>
                          <Eye size={12} />
                        </button>
                        <button onClick={() => navigate(`/teachers/edit/${t.id}`)} title="Edit"
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


