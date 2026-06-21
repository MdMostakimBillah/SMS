import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, FileText, AlertCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

export default function TeacherDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isBn = useBn()
  const { teachers, departments, subjects } = useTeacherStore()

  const teacher = useMemo(() => teachers.find((t) => t.id === id), [teachers, id])

  const getDeptName = (deptId: string) => {
    const d = departments.find((x) => x.id === deptId)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }

  const getSubjectNames = (ids: string[]) => {
    return (
      ids
        .map((subId) => {
          const s = subjects.find((x) => x.id === subId)
          return s ? (isBn ? s.nameBn : s.name) : ''
        })
        .filter(Boolean)
        .join(', ') || '—'
    )
  }

  const statusBadge = (st: string) => {
    const m: Record<string, { bg: string; tc: string; l: string; lb: string }> = {
      active: { bg: 'bg-[var(--green-light)]', tc: 'text-[var(--green)]', l: 'Active', lb: 'সক্রিয়' },
      inactive: { bg: 'bg-[var(--red-light)]', tc: 'text-[var(--red)]', l: 'Inactive', lb: 'নিষ্ক্রিয়' },
      'on-leave': { bg: 'bg-[var(--amber-light)]', tc: 'text-[var(--amber)]', l: 'On Leave', lb: 'ছুটিতে' },
    }
    const x = m[st] || m['active']
    return <span className={`text-xs font-semibold py-1 px-3 rounded-xl ${x.bg} ${x.tc}`}>{isBn ? x.lb : x.l}</span>
  }

  const downloadPDF = () => {
    if (!teacher) return
    const brand = getPDFBranding()
    const photoHtml = teacher.photo ? `<div class="photo"><img src="${teacher.photo}" alt="${teacher.nameEn}" /></div>` : ''
    const bodyHTML = `<div class="hdr">${pdfLogoHTML(brand, 36)}<div><div style="font-size:14px;font-weight:700;color:${brand.brandColor}">${brand.schoolName}</div><div style="font-size:9px;color:#888">Employee Profile</div></div></div>
${photoHtml}
<div class="ttl">${teacher.nameEn}</div>
<div class="sub">${teacher.nameBn} · ${teacher.id}</div>
<div class="info">
  <div><span class="lbl">${isBn ? 'পদবি' : 'Designation'}</span><span class="val">${teacher.designation || '—'}</span></div>
  <div><span class="lbl">${isBn ? 'বিভাগ' : 'Department'}</span><span class="val">${getDeptName(teacher.departmentId)}</span></div>
  <div><span class="lbl">${isBn ? 'বিষয়' : 'Subjects'}</span><span class="val">${getSubjectNames(teacher.subjectIds)}</span></div>
  <div><span class="lbl">${isBn ? 'লিঙ্গ' : 'Gender'}</span><span class="val">${teacher.gender === 'Male' ? (isBn ? 'পুরুষ' : 'Male') : isBn ? 'মহিলা' : 'Female'}</span></div>
  <div><span class="lbl">${isBn ? 'মোবাইল' : 'Phone'}</span><span class="val">${teacher.phone}</span></div>
  <div><span class="lbl">Email</span><span class="val">${teacher.email}</span></div>
  <div><span class="lbl">${isBn ? 'ঠিকানা' : 'Address'}</span><span class="val">${teacher.address}</span></div>
  <div><span class="lbl">${isBn ? 'জন্ম তারিখ' : 'DOB'}</span><span class="val">${teacher.dob}</span></div>
  <div><span class="lbl">${isBn ? 'রক্তের গ্রুপ' : 'Blood'}</span><span class="val">${teacher.bloodGroup}</span></div>
  <div><span class="lbl">${isBn ? 'ধর্ম' : 'Religion'}</span><span class="val">${teacher.religion}</span></div>
  <div><span class="lbl">${isBn ? 'যোগ্যতা' : 'Qualification'}</span><span class="val">${teacher.qualification}</span></div>
  <div><span class="lbl">${isBn ? 'অভিজ্ঞতা' : 'Experience'}</span><span class="val">${teacher.experience}</span></div>
  <div><span class="lbl">${isBn ? 'যোগদানের তারিখ' : 'Joining Date'}</span><span class="val">${teacher.joiningDate}</span></div>
  <div><span class="lbl">${isBn ? 'বেতন' : 'Salary'}</span><span class="val">৳${teacher.salary.toLocaleString()}</span></div>
  <div><span class="lbl">${isBn ? 'ইন টাইম' : 'In Time'}</span><span class="val">${teacher.inTime}</span></div>
  <div><span class="lbl">${isBn ? 'আউট টাইম' : 'Out Time'}</span><span class="val">${teacher.outTime}</span></div>
  <div><span class="lbl">${isBn ? 'জাতীয় পরিচয়' : 'NID'}</span><span class="val">${teacher.nid}</span></div>
  <div><span class="lbl">${isBn ? 'অবস্থা' : 'Status'}</span><span class="val"><b style="color:${teacher.status === 'active' ? '#10b981' : teacher.status === 'inactive' ? '#ef4444' : '#f59e0b'}">${teacher.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : teacher.status === 'inactive' ? (isBn ? 'নিষ্ক্রিয়' : 'Inactive') : isBn ? 'ছুটিতে' : 'On Leave'}</b></span></div>
</div>
<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb">
  <div style="font-size:11px;font-weight:600;margin-bottom:6px">${isBn ? 'অভিভাবক তথ্য' : 'Parent/Guardian Info'}</div>
  <div class="info">
    <div><span class="lbl">${isBn ? 'পিতার নাম' : 'Father'}</span><span class="val">${teacher.fatherNameEn}</span></div>
    <div><span class="lbl">${isBn ? 'পিতার মোবাইল' : 'Father Phone'}</span><span class="val">${teacher.fatherPhone}</span></div>
    <div><span class="lbl">${isBn ? 'মাতার নাম' : 'Mother'}</span><span class="val">${teacher.motherNameEn}</span></div>
    <div><span class="lbl">${isBn ? 'মাতার মোবাইল' : 'Mother Phone'}</span><span class="val">${teacher.motherPhone}</span></div>
    ${teacher.guardianName ? `<div><span class="lbl">${isBn ? 'অভিভাবক' : 'Guardian'}</span><span class="val">${teacher.guardianName}</span></div>` : ''}
    ${teacher.guardianPhone ? `<div><span class="lbl">${isBn ? 'অভিভাবক মোবাইল' : 'Guardian Phone'}</span><span class="val">${teacher.guardianPhone}</span></div>` : ''}
  </div>
</div>
<div class="ftr"><span>${brand.schoolName}</span><div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div>`
    openPrintWindow(teacher.nameEn, bodyHTML, {
      css: `@page{size:A4 portrait;margin:12mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid ${brand.brandColor};margin-bottom:12px}.ttl{text-align:center;font-size:14px;font-weight:700;margin:10px 0 4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:12px}.photo{text-align:center;margin-bottom:12px}.photo img{width:100px;height:120px;border-radius:8px;border:2px solid ${brand.brandColor};object-fit:cover}.info{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:12px}.info div{display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0}.info .lbl{font-size:10px;color:#888;width:100px;flex-shrink:0}.info .val{font-size:11px;font-weight:500;color:#1a1a1a}.ftr{margin-top:14px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`,
    })
  }

  if (!teacher) {
    return (
      <div className="p-10 text-center">
        <AlertCircle size={40} className="text-[var(--text-muted)] mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">{isBn ? 'শিক্ষক পাওয়া যায়নি' : 'Teacher not found'}</p>
        <button
          onClick={() => navigate('/teachers/all')}
          className="mt-3 py-2 px-4 rounded-lg bg-[var(--border)] border-none text-white text-[0.8125rem] cursor-pointer font-inherit"
        >
          {isBn ? 'ফিরে যান' : 'Go Back'}
        </button>
      </div>
    )
  }

  const infoItems = [
    [isBn ? 'মোবাইল' : 'Phone', teacher.phone],
    ['Email', teacher.email],
    [isBn ? 'ঠিকানা' : 'Address', teacher.address],
    [isBn ? 'জন্ম তারিখ' : 'DOB', teacher.dob],
    [isBn ? 'রক্তের গ্রুপ' : 'Blood Group', teacher.bloodGroup],
    [isBn ? 'ধর্ম' : 'Religion', teacher.religion],
    [isBn ? 'বিভাগ' : 'Department', getDeptName(teacher.departmentId)],
    [isBn ? 'বিষয়' : 'Subjects', getSubjectNames(teacher.subjectIds)],
    [isBn ? 'পদবি' : 'Designation', teacher.designation],
    [isBn ? 'যোগ্যতা' : 'Qualification', teacher.qualification],
    [isBn ? 'অভিজ্ঞতা' : 'Experience', teacher.experience],
    [isBn ? 'যোগদানের তারিখ' : 'Joining Date', teacher.joiningDate],
    [isBn ? 'বেতন' : 'Salary', `৳${teacher.salary.toLocaleString()}`],
    [isBn ? 'বেতন শুরুর তারিখ' : 'Salary Start Date', teacher.salaryStartDate || '—'],
    [isBn ? 'প্রবেশ সময়' : 'In Time', teacher.inTime],
    [isBn ? 'প্রস্থান সময়' : 'Out Time', teacher.outTime],
    [isBn ? 'জাতীয় পরিচয়' : 'NID', teacher.nid],
    [isBn ? 'জরুরি মোবাইল' : 'Emergency Phone', teacher.emergencyPhone],
  ]

  const parentItems = [
    [isBn ? 'পিতার নাম' : 'Father', teacher.fatherNameEn],
    [isBn ? 'পিতার মোবাইল' : 'Father Phone', teacher.fatherPhone],
    [isBn ? 'মাতার নাম' : 'Mother', teacher.motherNameEn],
    [isBn ? 'মাতার মোবাইল' : 'Mother Phone', teacher.motherPhone],
    [isBn ? 'অভিভাবক' : 'Guardian', teacher.guardianName],
    [isBn ? 'অভিভাবক মোবাইল' : 'Guardian Phone', teacher.guardianPhone],
    [isBn ? 'অভিভাবক সম্পর্ক' : 'Guardian Relation', teacher.guardianRelation],
    [isBn ? 'অভিভাবক ঠিকানা' : 'Parent Address', teacher.parentAddress],
  ]

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <button
          onClick={() => navigate('/teachers/all')}
          className="flex items-center gap-1.5 py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-inherit shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'শিক্ষক প্রোফাইল' : 'Teacher Profile'}</h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {teacher.id} · {getDeptName(teacher.departmentId)}
          </p>
        </div>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-[0.5625rem] bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.8125rem] cursor-pointer font-inherit font-medium"
        >
          <FileText size={14} />
          PDF
        </button>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
        <div className="p-5 bg-[var(--brand-light)] border-b border-[var(--border)] flex gap-5 items-start flex-wrap">
          <div className="w-[6.25rem] h-[7.5rem] rounded-[0.625rem] border-2 border-[var(--brand)] overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
            {teacher.photo ? (
              <img src={teacher.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-[var(--text-muted)]" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{teacher.nameEn}</h2>
              {statusBadge(teacher.status)}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">{teacher.nameBn}</p>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { t: getDeptName(teacher.departmentId), c: 'var(--brand)', b: 'var(--brand-light)' },
                { t: teacher.designation, c: 'var(--teal)', b: 'var(--teal-light)' },
                {
                  t: teacher.gender === 'Male' ? (isBn ? 'পুরুষ' : 'Male') : isBn ? 'মহিলা' : 'Female',
                  c: 'var(--purple)',
                  b: 'var(--purple-light)',
                },
                { t: teacher.bloodGroup, c: 'var(--red)', b: 'var(--red-light)' },
              ]
                .filter((x) => x.t)
                .map((x, i) => (
                  <span key={i} className={`text-xs font-medium py-[0.1875rem] px-2.5 rounded-md text-[${x.c}] bg-[${x.b}]`}>
                    {x.t}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {infoItems.map(([l, v]) =>
              v ? (
                <div key={String(l)} className="flex gap-2.5 py-2 px-3 rounded-lg bg-[var(--bg-secondary)]">
                  <span className="text-[0.6875rem] text-[var(--text-muted)] w-[6.875rem] shrink-0">{l}</span>
                  <span className="text-xs text-[var(--text-primary)] font-medium">{v}</span>
                </div>
              ) : null
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              {isBn ? 'অভিভাবক তথ্য' : 'Parent/Guardian Information'}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {parentItems.map(([l, v]) =>
                v ? (
                  <div key={String(l)} className="flex gap-2.5 py-2 px-3 rounded-lg bg-[var(--bg-secondary)]">
                    <span className="text-[0.6875rem] text-[var(--text-muted)] w-[6.875rem] shrink-0">{l}</span>
                    <span className="text-xs text-[var(--text-primary)] font-medium">{v}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
