import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, FileText, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'

export default function TeacherDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { language } = useAppStore()
  const { teachers, departments, subjects } = useTeacherStore()
  const isBn = language === 'bn'

  const teacher = useMemo(() => teachers.find(t => t.id === id), [teachers, id])

  const getDeptName = (deptId: string) => {
    const d = departments.find(x => x.id === deptId)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }

  const getSubjectNames = (ids: string[]) => {
    return ids.map(subId => {
      const s = subjects.find(x => x.id === subId)
      return s ? (isBn ? s.nameBn : s.name) : ''
    }).filter(Boolean).join(', ') || '—'
  }

  const statusBadge = (st: string) => {
    const m: Record<string, {b:string;c:string;l:string;lb:string}> = {
      'active': { b:'var(--green-light)', c:'var(--green)', l:'Active', lb:'সক্রিয়' },
      'inactive': { b:'var(--red-light)', c:'var(--red)', l:'Inactive', lb:'নিষ্ক্রিয়' },
      'on-leave': { b:'var(--amber-light)', c:'var(--amber)', l:'On Leave', lb:'ছুটিতে' },
    }
    const x = m[st] || m['active']
    return <span style={{ fontSize:'12px', fontWeight:600, padding:'4px 12px', borderRadius:'12px', background:x.b, color:x.c }}>{isBn?x.lb:x.l}</span>
  }

  const downloadPDF = () => {
    if (!teacher) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${teacher.nameEn}</title>
<style>@page{size:A4 portrait;margin:12mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid #6366f1;margin-bottom:12px}.logo{width:36px;height:36px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700}.ttl{text-align:center;font-size:14px;font-weight:700;margin:10px 0 4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:12px}.photo{text-align:center;margin-bottom:12px}.photo img{width:100px;height:120px;border-radius:8px;border:2px solid #6366f1;object-fit:cover}.info{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:12px}.info div{display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0}.info .lbl{font-size:10px;color:#888;width:100px;flex-shrink:0}.info .val{font-size:11px;font-weight:500;color:#1a1a1a}.ftr{margin-top:14px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:14px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:9px;color:#888">Employee Profile</div></div></div>
${teacher.photo ? `<div class="photo"><img src="${teacher.photo}" alt="${teacher.nameEn}" /></div>` : ''}
<div class="ttl">${teacher.nameEn}</div>
<div class="sub">${teacher.nameBn} · ${teacher.id}</div>
<div class="info">
  <div><span class="lbl">${isBn?'পদবি':'Designation'}</span><span class="val">${teacher.designation || '—'}</span></div>
  <div><span class="lbl">${isBn?'বিভাগ':'Department'}</span><span class="val">${getDeptName(teacher.departmentId)}</span></div>
  <div><span class="lbl">${isBn?'বিষয়':'Subjects'}</span><span class="val">${getSubjectNames(teacher.subjectIds)}</span></div>
  <div><span class="lbl">${isBn?'লিঙ্গ':'Gender'}</span><span class="val">${teacher.gender === 'Male' ? (isBn?'পুরুষ':'Male') : (isBn?'মহিলা':'Female')}</span></div>
  <div><span class="lbl">${isBn?'মোবাইল':'Phone'}</span><span class="val">${teacher.phone}</span></div>
  <div><span class="lbl">Email</span><span class="val">${teacher.email}</span></div>
  <div><span class="lbl">${isBn?'ঠিকানা':'Address'}</span><span class="val">${teacher.address}</span></div>
  <div><span class="lbl">${isBn?'জন্ম তারিখ':'DOB'}</span><span class="val">${teacher.dob}</span></div>
  <div><span class="lbl">${isBn?'রক্তের গ্রুপ':'Blood'}</span><span class="val">${teacher.bloodGroup}</span></div>
  <div><span class="lbl">${isBn?'ধর্ম':'Religion'}</span><span class="val">${teacher.religion}</span></div>
  <div><span class="lbl">${isBn?'যোগ্যতা':'Qualification'}</span><span class="val">${teacher.qualification}</span></div>
  <div><span class="lbl">${isBn?'অভিজ্ঞতা':'Experience'}</span><span class="val">${teacher.experience}</span></div>
  <div><span class="lbl">${isBn?'যোগদানের তারিখ':'Joining Date'}</span><span class="val">${teacher.joiningDate}</span></div>
  <div><span class="lbl">${isBn?'বেতন':'Salary'}</span><span class="val">৳${teacher.salary.toLocaleString()}</span></div>
  <div><span class="lbl">${isBn?'ইন টাইম':'In Time'}</span><span class="val">${teacher.inTime}</span></div>
  <div><span class="lbl">${isBn?'আউট টাইম':'Out Time'}</span><span class="val">${teacher.outTime}</span></div>
  <div><span class="lbl">${isBn?'জাতীয় পরিচয়':'NID'}</span><span class="val">${teacher.nid}</span></div>
  <div><span class="lbl">${isBn?'অবস্থা':'Status'}</span><span class="val"><b style="color:${teacher.status==='active'?'#10b981':teacher.status==='inactive'?'#ef4444':'#f59e0b'}">${teacher.status==='active'?(isBn?'সক্রিয়':'Active'):teacher.status==='inactive'?(isBn?'নিষ্ক্রিয়':'Inactive'):(isBn?'ছুটিতে':'On Leave')}</b></span></div>
</div>
<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb">
  <div style="font-size:11px;font-weight:600;margin-bottom:6px">${isBn?'অভিভাবক তথ্য':'Parent/Guardian Info'}</div>
  <div class="info">
    <div><span class="lbl">${isBn?'পিতার নাম':'Father'}</span><span class="val">${teacher.fatherNameEn}</span></div>
    <div><span class="lbl">${isBn?'পিতার মোবাইল':'Father Phone'}</span><span class="val">${teacher.fatherPhone}</span></div>
    <div><span class="lbl">${isBn?'মাতার নাম':'Mother'}</span><span class="val">${teacher.motherNameEn}</span></div>
    <div><span class="lbl">${isBn?'মাতার মোবাইল':'Mother Phone'}</span><span class="val">${teacher.motherPhone}</span></div>
    ${teacher.guardianName ? `<div><span class="lbl">${isBn?'অভিভাবক':'Guardian'}</span><span class="val">${teacher.guardianName}</span></div>` : ''}
    ${teacher.guardianPhone ? `<div><span class="lbl">${isBn?'অভিভাবক মোবাইল':'Guardian Phone'}</span><span class="val">${teacher.guardianPhone}</span></div>` : ''}
  </div>
</div>
<div class="ftr"><span>EduTech School Management System</span><div>${isBn?'মুদ্রণ:':'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
  }

  if (!teacher) {
    return (
      <div style={{ padding:'40px', textAlign:'center' }}>
        <AlertCircle size={40} style={{ color:'var(--text-muted)', marginBottom:'12px' }} />
        <p style={{ fontSize:'14px', color:'var(--text-secondary)' }}>{isBn?'শিক্ষক পাওয়া যায়নি':'Teacher not found'}</p>
        <button onClick={() => navigate('/teachers/all')} style={{ marginTop:'12px', padding:'8px 16px', borderRadius:'8px', background:'var(--brand)', border:'none', color:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
          {isBn?'ফিরে যান':'Go Back'}
        </button>
      </div>
    )
  }

  const infoItems = [
    [isBn?'মোবাইল':'Phone', teacher.phone],
    ['Email', teacher.email],
    [isBn?'ঠিকানা':'Address', teacher.address],
    [isBn?'জন্ম তারিখ':'DOB', teacher.dob],
    [isBn?'রক্তের গ্রুপ':'Blood Group', teacher.bloodGroup],
    [isBn?'ধর্ম':'Religion', teacher.religion],
    [isBn?'বিভাগ':'Department', getDeptName(teacher.departmentId)],
    [isBn?'বিষয়':'Subjects', getSubjectNames(teacher.subjectIds)],
    [isBn?'পদবি':'Designation', teacher.designation],
    [isBn?'যোগ্যতা':'Qualification', teacher.qualification],
    [isBn?'অভিজ্ঞতা':'Experience', teacher.experience],
    [isBn?'যোগদানের তারিখ':'Joining Date', teacher.joiningDate],
    [isBn?'বেতন':'Salary', `৳${teacher.salary.toLocaleString()}`],
    [isBn?'প্রবেশ সময়':'In Time', teacher.inTime],
    [isBn?'প্রস্থান সময়':'Out Time', teacher.outTime],
    [isBn?'জাতীয় পরিচয়':'NID', teacher.nid],
    [isBn?'জরুরি মোবাইল':'Emergency Phone', teacher.emergencyPhone],
  ]

  const parentItems = [
    [isBn?'পিতার নাম':'Father', teacher.fatherNameEn],
    [isBn?'পিতার মোবাইল':'Father Phone', teacher.fatherPhone],
    [isBn?'মাতার নাম':'Mother', teacher.motherNameEn],
    [isBn?'মাতার মোবাইল':'Mother Phone', teacher.motherPhone],
    [isBn?'অভিভাবক':'Guardian', teacher.guardianName],
    [isBn?'অভিভাবক মোবাইল':'Guardian Phone', teacher.guardianPhone],
    [isBn?'অভিভাবক সম্পর্ক':'Guardian Relation', teacher.guardianRelation],
    [isBn?'অভিভাবক ঠিকানা':'Parent Address', teacher.parentAddress],
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/teachers/all')}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'9px',
            background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'13px',
            color:'var(--text-secondary)', fontFamily:'inherit', flexShrink:0 }}>
          <ArrowLeft size={14} />
          {isBn?'ফিরে যান':'Back'}
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:'22px', fontWeight:600, color:'var(--text-primary)' }}>
            {isBn?'শিক্ষক প্রোফাইল':'Teacher Profile'}
          </h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>
            {teacher.id} · {getDeptName(teacher.departmentId)}
          </p>
        </div>
        <button onClick={downloadPDF}
          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'9px',
            background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)',
            fontSize:'13px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
          <FileText size={14} />PDF
        </button>
      </div>

      {/* Profile Card */}
      <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
        {/* Top Section */}
        <div style={{ padding:'20px', background:'var(--brand-light)', borderBottom:'1px solid var(--border)', display:'flex', gap:'20px', alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ width:'100px', height:'120px', borderRadius:'10px', border:'2px solid var(--brand)', overflow:'hidden', background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {teacher.photo ? <img src={teacher.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <User size={36} style={{ color:'var(--text-muted)' }} />}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px', flexWrap:'wrap' }}>
              <h2 style={{ fontSize:'20px', fontWeight:600, color:'var(--text-primary)' }}>{teacher.nameEn}</h2>
              {statusBadge(teacher.status)}
            </div>
            <p style={{ fontSize:'14px', color:'var(--text-secondary)', marginBottom:'8px' }}>{teacher.nameBn}</p>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {[
                { t:getDeptName(teacher.departmentId), c:'var(--brand)', b:'var(--brand-light)' },
                { t:teacher.designation, c:'var(--teal)', b:'var(--teal-light)' },
                { t:teacher.gender==='Male'?(isBn?'পুরুষ':'Male'):(isBn?'মহিলা':'Female'), c:'var(--purple)', b:'var(--purple-light)' },
                { t:teacher.bloodGroup, c:'var(--red)', b:'var(--red-light)' },
              ].filter(x => x.t).map((x,i) => (
                <span key={i} style={{ fontSize:'12px', fontWeight:500, padding:'3px 10px', borderRadius:'6px', color:x.c, background:x.b }}>{x.t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ padding:'20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
            {infoItems.map(([l, v]) => v ? (
              <div key={String(l)} style={{ display:'flex', gap:'10px', padding:'8px 12px', borderRadius:'8px', background:'var(--bg-secondary)' }}>
                <span style={{ fontSize:'11px', color:'var(--text-muted)', width:'110px', flexShrink:0 }}>{l}</span>
                <span style={{ fontSize:'12px', color:'var(--text-primary)', fontWeight:500 }}>{v}</span>
              </div>
            ) : null)}
          </div>

          {/* Parent Info */}
          <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'14px', fontWeight:600, color:'var(--text-primary)', marginBottom:'12px' }}>
              {isBn?'অভিভাবক তথ্য':'Parent/Guardian Information'}
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
              {parentItems.map(([l, v]) => v ? (
                <div key={String(l)} style={{ display:'flex', gap:'10px', padding:'8px 12px', borderRadius:'8px', background:'var(--bg-secondary)' }}>
                  <span style={{ fontSize:'11px', color:'var(--text-muted)', width:'110px', flexShrink:0 }}>{l}</span>
                  <span style={{ fontSize:'12px', color:'var(--text-primary)', fontWeight:500 }}>{v}</span>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
