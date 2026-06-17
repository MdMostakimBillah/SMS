import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  UserPlus,
  X,
  Search,
  Eye,
  Edit2,
  FileText,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown,
  MoreVertical,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { openPrintWindow } from '@/lib/pdf'
import { TeacherPDFOptionsModal } from '@/components/shared/TeacherPDFOptionsModal'
import { generateTeacherListPDF } from '@/pages/teachers/listPdfTemplate'
import type { TeacherListPDFOptions } from '@/pages/teachers/listPdfTemplate'
import type { Teacher, TeacherStatus } from '@/pages/teachers/types'

const PER_PAGE_OPTS = [10, 20, 30, 50, 100, 200, 500, 1000]
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function AllTeachersPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { teachers, departments, subjects, deleteTeacher } = useTeacherStore()

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
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false)
      }
    }
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActionMenu])

  useScrollLock(viewT !== null || delConfirm !== null || showPDF)

  const filtered = useMemo(
    () =>
      teachers.filter((t) => {
        if (search) {
          const q = search.toLowerCase()
          if (
            !t.nameEn.toLowerCase().includes(q) &&
            !t.nameBn.includes(search) &&
            !t.id.includes(q) &&
            !t.phone.includes(q) &&
            !t.email.toLowerCase().includes(q) &&
            !t.nid.includes(q) &&
            !t.fatherNameEn.toLowerCase().includes(q) &&
            !t.motherNameEn.toLowerCase().includes(q) &&
            !t.fatherPhone.includes(q) &&
            !t.motherPhone.includes(q)
          )
            return false
        }
        if (fDept && t.departmentId !== fDept) return false
        if (fGender && t.gender !== fGender) return false
        if (fStatus && t.status !== fStatus) return false
        if (fBlood && t.bloodGroup !== fBlood) return false
        if (fReligion && !t.religion.includes(fReligion)) return false
        return true
      }),
    [teachers, search, fDept, fGender, fStatus, fBlood, fReligion]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const sp = Math.min(page, totalPages)
  const paginated = useMemo(() => filtered.slice((sp - 1) * perPage, sp * perPage), [filtered, sp, perPage])

  const pageIds = paginated.map((t) => t.id)
  const allSel = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))

  const toggleAll = useCallback(
    () => setSelected((p) => (allSel ? p.filter((id) => !pageIds.includes(id)) : [...new Set([...p, ...pageIds])])),
    [allSel, pageIds]
  )
  const toggleOne = useCallback((id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])

  const stats = useMemo(
    () => ({
      total: filtered.length,
      active: filtered.filter((t) => t.status === 'active').length,
      inactive: filtered.filter((t) => t.status === 'inactive').length,
      onLeave: filtered.filter((t) => t.status === 'on-leave').length,
    }),
    [filtered]
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setFDept('')
    setFGender('')
    setFStatus('')
    setFBlood('')
    setFReligion('')
    setPage(1)
  }, [])
  const hasFilter = search || fDept || fGender || fStatus || fBlood || fReligion

  const getDeptName = (id: string) => {
    const d = departments.find((x) => x.id === id)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }
  const getSubjectNames = (ids: string[]) => {
    return (
      ids
        .map((id) => {
          const s = subjects.find((x) => x.id === id)
          return s ? (isBn ? s.nameBn : s.name) : ''
        })
        .filter(Boolean)
        .join(', ') || '—'
    )
  }

  const handleDelete = (id: string) => {
    deleteTeacher(id)
    setDelConfirm(null)
    setViewT(null)
  }

  const statusBadge = (st: TeacherStatus) => {
    const m: Record<TeacherStatus, { b: string; c: string; l: string; lb: string }> = {
      active: { b: 'var(--green-light)', c: 'var(--green)', l: 'Active', lb: 'সক্রিয়' },
      inactive: { b: 'var(--red-light)', c: 'var(--red)', l: 'Inactive', lb: 'নিষ্ক্রিয়' },
      'on-leave': { b: 'var(--amber-light)', c: 'var(--amber)', l: 'On Leave', lb: 'ছুটিতে' },
    }
    const x = m[st]
    return (
      <span
        className="text-[0.625rem] font-semibold px-[0.4375rem] py-[0.125rem] rounded-[0.625rem] whitespace-nowrap"
        style={{ background: x.b, color: x.c }}
      >
        {isBn ? x.lb : x.l}
      </span>
    )
  }

  const exportExcel = useCallback(() => {
    const instName = 'EduTech — Sunrise Academy'
    const instAddress = 'Dhaka, Bangladesh'

    const list = selected.length > 0 ? filtered.filter((t) => selected.includes(t.id)) : filtered
    const teachersData = list.map((t, i) => ({
      '#': i + 1,
      'Teacher ID': t.id,
      'Name EN': t.nameEn,
      'Name BN': t.nameBn,
      Gender: t.gender,
      Phone: t.phone,
      Email: t.email,
      Department: getDeptName(t.departmentId),
      Designation: t.designation,
      Qualification: t.qualification,
      Experience: t.experience,
      'Blood Group': t.bloodGroup,
      Religion: t.religion,
      'In Time': t.inTime,
      'Out Time': t.outTime,
      Salary: t.salary,
      'Joining Date': t.joiningDate,
      Status: t.status,
      Father: t.fatherNameEn,
      'Father Phone': t.fatherPhone,
      Mother: t.motherNameEn,
      'Mother Phone': t.motherPhone,
    }))

    const ws = XLSX.utils.json_to_sheet(teachersData)
    XLSX.utils.sheet_add_aoa(ws, [
      [instName],
      [instAddress],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers')
    XLSX.writeFile(wb, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [selected, filtered, departments, isBn])

  const handlePDF = useCallback(
    (opts: TeacherListPDFOptions) => {
      const list = selected.length > 0 ? filtered.filter((t) => selected.includes(t.id)) : filtered
      const html = generateTeacherListPDF(list, opts, departments)
      openPrintWindow(opts.title || 'Teacher List', html, {
        css: `@page{size:A4 ${opts.orientation || 'landscape'};margin:8mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a1a;background:#fff;padding:0}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:5px;text-align:left;font-size:8px;font-weight:700;border:0.5px solid #5356d4}td{padding:4px 5px;border:0.5px solid #e5e7eb;vertical-align:middle}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`,
      })
      setShowPDF(false)
    },
    [selected, filtered, departments]
  )

  const downloadSinglePDF = useCallback(
    (t: Teacher) => {
      const photoHtml = t.photo
        ? `<div style="text-align:center;margin-bottom:10px"><img src="${t.photo}" alt="${t.nameEn}" style="width:100px;height:120px;border-radius:8px;border:2px solid #6366f1;object-fit:cover" /></div>`
        : ''
      const html = `<div class="hdr"><div class="logo">ET</div><div><div style="font-size:14px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:9px;color:#888">Employee Profile</div></div></div>
${photoHtml}
<div class="ttl">${t.nameEn}</div>
<div class="sub">${t.nameBn} · ${t.id}</div>
<div class="info">
  <div><span class="lbl">${isBn ? 'পদবি' : 'Designation'}</span><span class="val">${t.designation || '—'}</span></div>
  <div><span class="lbl">${isBn ? 'বিভাগ' : 'Department'}</span><span class="val">${getDeptName(t.departmentId)}</span></div>
  <div><span class="lbl">${isBn ? 'বিষয়' : 'Subjects'}</span><span class="val">${getSubjectNames(t.subjectIds)}</span></div>
  <div><span class="lbl">${isBn ? 'লিঙ্গ' : 'Gender'}</span><span class="val">${t.gender === 'Male' ? (isBn ? 'পুরুষ' : 'Male') : isBn ? 'মহিলা' : 'Female'}</span></div>
  <div><span class="lbl">${isBn ? 'মোবাইল' : 'Phone'}</span><span class="val">${t.phone}</span></div>
  <div><span class="lbl">Email</span><span class="val">${t.email}</span></div>
  <div><span class="lbl">${isBn ? 'ঠিকানা' : 'Address'}</span><span class="val">${t.address}</span></div>
  <div><span class="lbl">${isBn ? 'জন্ম তারিখ' : 'DOB'}</span><span class="val">${t.dob}</span></div>
  <div><span class="lbl">${isBn ? 'রক্তের গ্রুপ' : 'Blood'}</span><span class="val">${t.bloodGroup}</span></div>
  <div><span class="lbl">${isBn ? 'ধর্ম' : 'Religion'}</span><span class="val">${t.religion}</span></div>
  <div><span class="lbl">${isBn ? 'যোগ্যতা' : 'Qualification'}</span><span class="val">${t.qualification}</span></div>
  <div><span class="lbl">${isBn ? 'অভিজ্ঞতা' : 'Experience'}</span><span class="val">${t.experience}</span></div>
  <div><span class="lbl">${isBn ? 'যোগদানের তারিখ' : 'Joining Date'}</span><span class="val">${t.joiningDate}</span></div>
  <div><span class="lbl">${isBn ? 'বেতন' : 'Salary'}</span><span class="val">৳${t.salary.toLocaleString()}</span></div>
  <div><span class="lbl">${isBn ? 'ইন টাইম' : 'In Time'}</span><span class="val">${t.inTime}</span></div>
  <div><span class="lbl">${isBn ? 'আউট টাইম' : 'Out Time'}</span><span class="val">${t.outTime}</span></div>
  <div><span class="lbl">${isBn ? 'জাতীয় পরিচয়' : 'NID'}</span><span class="val">${t.nid}</span></div>
  <div><span class="lbl">${isBn ? 'অবস্থা' : 'Status'}</span><span class="val"><b style="color:${t.status === 'active' ? '#10b981' : t.status === 'inactive' ? '#ef4444' : '#f59e0b'}">${t.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : t.status === 'inactive' ? (isBn ? 'নিষ্ক্রিয়' : 'Inactive') : isBn ? 'ছুটিতে' : 'On Leave'}</b></span></div>
</div>
<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb">
  <div style="font-size:11px;font-weight:600;margin-bottom:6px">${isBn ? 'অভিভাবক তথ্য' : 'Parent/Guardian Info'}</div>
  <div class="info">
    <div><span class="lbl">${isBn ? 'পিতার নাম' : 'Father'}</span><span class="val">${t.fatherNameEn}</span></div>
    <div><span class="lbl">${isBn ? 'পিতার মোবাইল' : 'Father Phone'}</span><span class="val">${t.fatherPhone}</span></div>
    <div><span class="lbl">${isBn ? 'মাতার নাম' : 'Mother'}</span><span class="val">${t.motherNameEn}</span></div>
    <div><span class="lbl">${isBn ? 'মাতার মোবাইল' : 'Mother Phone'}</span><span class="val">${t.motherPhone}</span></div>
  </div>
</div>
<div class="ftr"><span>EduTech School Management System</span><div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div>`
      openPrintWindow(t.nameEn, html, {
        css: '@page{size:A4 portrait;margin:12mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid #6366f1;margin-bottom:12px}.logo{width:36px;height:36px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700}.ttl{text-align:center;font-size:14px;font-weight:700;margin:10px 0 4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:12px}.info{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:12px}.info div{display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0}.info .lbl{font-size:10px;color:#888;width:100px;flex-shrink:0}.info .val{font-size:11px;font-weight:500;color:#1a1a1a}.ftr{margin-top:14px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}',
      })
    },
    [departments, isBn]
  )

  const sel =
    'px-[0.5625rem] py-[0.4375rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs outline-none cursor-pointer'
  const sc = (left: string) => (isMobile ? {} : { position: 'sticky' as const, left, zIndex: 4, background: 'var(--bg-primary)' })

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {showPDF && (
        <TeacherPDFOptionsModal
          count={selected.length || filtered.length}
          isBn={isBn}
          teachers={selected.length > 0 ? filtered.filter((t) => selected.includes(t.id)) : filtered}
          departments={departments}
          onClose={() => setShowPDF(false)}
          onDownload={handlePDF}
        />
      )}

      {viewT && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box max-h-[90vh] overflow-hidden flex flex-col shadow-[var(--shadow-lg)]" style={{ maxWidth: '35rem' }}>
            <div
              className="flex items-center justify-between px-[1.125rem] py-[0.875rem] border-b border-[var(--border)]"
              style={{ background: 'var(--brand-light)' }}
            >
              <div>
                <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? viewT.nameBn || viewT.nameEn : viewT.nameEn}
                </div>
                <div className="text-[0.6875rem] text-[var(--brand)] font-mono">{viewT.id}</div>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(viewT.status)}
                <button
                  onClick={() => setViewT(null)}
                  className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
                >
                  <X size={14} className="text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-[1.125rem]">
              <div className="flex gap-[0.875rem] mb-[0.875rem]">
                <div className="w-[5rem] h-[5.9375rem] rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                  {viewT.photo ? (
                    <img src={viewT.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{viewT.nameEn}</h3>
                  <p className="text-[0.8125rem] text-[var(--text-secondary)]">{viewT.nameBn}</p>
                  <div className="flex gap-[0.3125rem] mt-1.5 flex-wrap">
                    {[
                      { t: getDeptName(viewT.departmentId), c: 'var(--brand)', b: 'var(--brand-light)' },
                      { t: viewT.designation, c: 'var(--teal)', b: 'var(--teal-light)' },
                      {
                        t: viewT.gender === 'Male' ? (isBn ? 'পুরুষ' : 'Male') : isBn ? 'মহিলা' : 'Female',
                        c: 'var(--purple)',
                        b: 'var(--purple-light)',
                      },
                      { t: viewT.bloodGroup, c: 'var(--red)', b: 'var(--red-light)' },
                    ]
                      .filter((x) => x.t)
                      .map((x, i) => (
                        <span
                          key={i}
                          className="text-[0.6875rem] font-medium px-2 py-[0.125rem] rounded-[0.3125rem]"
                          style={{ color: x.c, background: x.b }}
                        >
                          {x.t}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              {[
                [isBn ? 'মোবাইল' : 'Phone', viewT.phone],
                ['Email', viewT.email],
                [isBn ? 'ঠিকানা' : 'Address', viewT.address],
                [isBn ? 'জন্ম তারিখ' : 'DOB', viewT.dob],
                [isBn ? 'রক্তের গ্রুপ' : 'Blood', viewT.bloodGroup],
                [isBn ? 'ধর্ম' : 'Religion', viewT.religion],
                [isBn ? 'বিভাগ' : 'Department', getDeptName(viewT.departmentId)],
                [isBn ? 'বিষয়' : 'Subjects', getSubjectNames(viewT.subjectIds)],
                [isBn ? 'পদবি' : 'Designation', viewT.designation],
                [isBn ? 'যোগ্যতা' : 'Qualification', viewT.qualification],
                [isBn ? 'অভিজ্ঞতা' : 'Experience', viewT.experience],
                [isBn ? 'যোগদানের তারিখ' : 'Joining Date', viewT.joiningDate],
                [isBn ? 'বেতন' : 'Salary', `৳${viewT.salary.toLocaleString()}`],
                [isBn ? 'বেতন শুরুর তারিখ' : 'Salary Start Date', viewT.salaryStartDate || '—'],
                [isBn ? 'প্রবেশ সময়' : 'In Time', viewT.inTime],
                [isBn ? 'প্রস্থান সময়' : 'Out Time', viewT.outTime],
                [isBn ? 'জাতীয় পরিচয়' : 'NID', viewT.nid],
                [isBn ? 'পিতার NID' : 'Father NID', viewT.fatherNid],
                [isBn ? 'জরুরি মোবাইল' : 'Emergency Phone', viewT.emergencyPhone],
                [isBn ? 'পিতার নাম' : 'Father', viewT.fatherNameEn],
                [isBn ? 'পিতার মোবাইল' : 'Father Phone', viewT.fatherPhone],
                [isBn ? 'মাতার নাম' : 'Mother', viewT.motherNameEn],
                [isBn ? 'মাতার মোবাইল' : 'Mother Phone', viewT.motherPhone],
                [isBn ? 'অভিভাবক' : 'Guardian', viewT.guardianName],
                [isBn ? 'অভিভাবক মোবাইল' : 'Guardian Phone', viewT.guardianPhone],
                [isBn ? 'অভিভাবক সম্পর্ক' : 'Guardian Relation', viewT.guardianRelation],
                [isBn ? 'অভিভাবক ঠিকানা' : 'Parent Address', viewT.parentAddress],
                [isBn ? 'ওভারটাইম (ঘণ্টা)' : 'Overtime Rate', viewT.overtime ? `৳${viewT.overtime}/hr` : ''],
                [isBn ? 'সিগনেচার' : 'Signature', viewT.signature || ''],
              ].map(([l, v]) =>
                v ? (
                  <div
                    key={String(l)}
                    className="flex gap-2 py-[0.3125rem] border-b border-[var(--border)]"
                    style={{ borderBottomWidth: '0.0313rem' }}
                  >
                    <span className="text-[0.6875rem] text-[var(--text-muted)] w-[7.5rem] shrink-0">{l}</span>
                    {String(l) === (isBn ? 'সিগনেচার' : 'Signature') ? (
                      <img src={v as string} alt="" className="h-[2.5rem] max-w-[10rem] object-contain" />
                    ) : (
                      <span className="text-xs font-medium text-[var(--text-primary)]">{v as string}</span>
                    )}
                  </div>
                ) : null
              )}
            </div>
            <div className="flex gap-2 justify-end flex-wrap px-[1.125rem] py-3 border-t border-[var(--border)]">
              <button
                onClick={() => downloadSinglePDF(viewT)}
                className="flex items-center gap-[0.3125rem] px-3.5 py-2 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.8125rem] font-medium cursor-pointer"
              >
                <FileText size={13} />
                PDF
              </button>
              <button
                onClick={() => setViewT(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button
                onClick={() => {
                  navigate(`/teachers/edit/${viewT.id}`)
                  setViewT(null)
                }}
                className="flex items-center gap-[0.3125rem] px-3.5 py-2 rounded-lg bg-[var(--amber)] border-0 text-white text-[0.8125rem] font-medium cursor-pointer"
              >
                <Edit2 size={13} />
                {isBn ? 'এডিট' : 'Edit'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {delConfirm && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
            <div className="flex items-center gap-[0.625rem] mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--red-light)] flex items-center justify-center">
                <AlertTriangle size={18} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{isBn ? 'মুছে ফেলুন?' : 'Delete?'}</h3>
            </div>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-4">
              {isBn ? 'এই শিক্ষককে স্থায়ীভাবে মুছে ফেলা হবে।' : 'This teacher will be permanently deleted.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDelConfirm(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(delConfirm)}
                className="px-3.5 py-2 rounded-lg bg-[var(--red)] border-0 text-white text-[0.8125rem] font-semibold cursor-pointer"
              >
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Top Section */}
      <div className="shrink-0">
        <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
          <button
            onClick={() => navigate('/teachers')}
            className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] shrink-0"
          >
            <ArrowLeft size={14} />
            {isBn ? 'ফিরে যান' : 'Back'}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={`${isMobile ? 'text-lg' : 'text-[1.375rem]'} font-semibold text-[var(--text-primary)]`}>
              {isBn ? 'সকল শিক্ষক' : 'All Teachers'}
            </h1>
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { label: isBn ? 'মোট' : 'Total', value: stats.total },
                { label: isBn ? 'সক্রিয়' : 'Active', value: stats.active, color: 'var(--green)' },
                { label: isBn ? 'নিষ্ক্রিয়' : 'Inactive', value: stats.inactive, color: 'var(--red)' },
                { label: isBn ? 'ছুটিতে' : 'On Leave', value: stats.onLeave, color: 'var(--amber)' },
              ].map((s) => (
                <span
                  key={s.label}
                  className={`text-xs whitespace-nowrap ${s.color ? 'font-semibold' : ''}`}
                  style={{ color: s.color || 'var(--text-secondary)' }}
                >
                  {s.label} {s.value}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('/teachers/add')}
            className="flex items-center gap-[0.3125rem] px-3.5 py-2 rounded-[0.5625rem] bg-[var(--teal-light)] border border-[var(--teal)] text-[var(--teal)] text-[0.8125rem] cursor-pointer font-medium"
          >
            <UserPlus size={14} />
            {isBn ? 'নতুন যোগ করুন' : 'Add Teacher'}
          </button>
        </div>

        <div className="sticky top-0 z-50 pt-0.5 pb-1 bg-transparent">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-[0.875rem] mb-2.5">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              <div className="flex items-center gap-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[0.625rem] py-[0.4375rem] min-w-0">
                <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={isBn ? 'নাম, আইডি, মোবাইল, পিতা, মাতা...' : 'Name, ID, phone, father, mother...'}
                  className="flex-1 min-w-0 border-none bg-transparent outline-none text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:text-[0.75rem] truncate"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="border-none bg-transparent cursor-pointer text-[var(--text-muted)] flex">
                    <X size={12} />
                  </button>
                )}
              </div>
              <select
                value={fDept}
                onChange={(e) => {
                  setFDept(e.target.value)
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব বিভাগ' : 'All Depts'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {isBn ? d.nameBn : d.name}
                  </option>
                ))}
              </select>
              <select
                value={fGender}
                onChange={(e) => {
                  setFGender(e.target.value)
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব লিঙ্গ' : 'All Genders'}</option>
                <option value="Male">{isBn ? 'পুরুষ' : 'Male'}</option>
                <option value="Female">{isBn ? 'মহিলা' : 'Female'}</option>
              </select>
              <select
                value={fReligion}
                onChange={(e) => {
                  setFReligion(e.target.value)
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব ধর্ম' : 'All Religions'}</option>
                <option value="Islam">{isBn ? 'ইসলাম' : 'Islam'}</option>
                <option value="Hinduism">{isBn ? 'হিন্দু' : 'Hinduism'}</option>
                <option value="Christianity">{isBn ? 'খ্রিস্টান' : 'Christianity'}</option>
                <option value="Buddhism">{isBn ? 'বৌদ্ধ' : 'Buddhism'}</option>
              </select>
              <select
                value={fBlood}
                onChange={(e) => {
                  setFBlood(e.target.value)
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'রক্তের গ্রুপ' : 'Blood'}</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={fStatus}
                onChange={(e) => {
                  setFStatus(e.target.value)
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব অবস্থা' : 'All Status'}</option>
                <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
                <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
                <option value="on-leave">{isBn ? 'ছুটিতে' : 'On Leave'}</option>
              </select>
            </div>
            {hasFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-[0.3125rem] px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.6875rem] cursor-pointer mt-2"
              >
                <X size={11} />
                {isBn ? 'ফিল্টার সরান' : 'Clear Filters'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-[var(--text-secondary)]">{isBn ? 'প্রতি পাতায়:' : 'Per page:'}</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className={`${sel} px-2 py-[0.3125rem]`}
              >
                {PER_PAGE_OPTS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {selected.length > 0 && (
                <span className="text-xs text-[var(--brand)] bg-[var(--brand-light)] px-[0.625rem] py-[0.1875rem] rounded-md font-medium">
                  {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative', display: 'flex', gap: '0.375rem' }}>
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-xs cursor-pointer font-medium"
              >
                <MoreVertical size={13} />
                {isBn ? 'অ্যাকশন' : 'Action'}
                <ChevronDown size={12} />
              </button>
              {showActionMenu && (
                <div
                  ref={actionMenuRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.375rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: '12.5rem',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => {
                      exportExcel()
                      setShowActionMenu(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                    {isBn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
                  <button
                    onClick={() => {
                      setShowPDF(true)
                      setShowActionMenu(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileText size={14} style={{ color: 'var(--red)' }} />
                    {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] mt-1">
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'max-h-[50vh]' : ''}`}>
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2.5 w-[2.25rem]" style={sc('0')}>
                  <input
                    type="checkbox"
                    checked={allSel}
                    onChange={toggleAll}
                    className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                  />
                </th>
                {[
                  { l: '#', w: '2.25rem', sticky: !isMobile, left: '2.25rem' },
                  { l: isBn ? 'ছবি' : 'Photo', w: '2.75rem', sticky: !isMobile, left: '4.5rem' },
                  { l: isBn ? 'আইডি' : 'ID', w: '8.125rem', sticky: !isMobile, left: '7.25rem' },
                  { l: isBn ? 'নাম' : 'Name', w: '10rem', sticky: !isMobile, left: '15.375rem' },
                  { l: isBn ? 'বিভাগ' : 'Dept', w: '6.25rem', sticky: !isMobile, left: '25.375rem' },
                  { l: isBn ? 'পদবি' : 'Designation', w: '7.5rem', sticky: !isMobile, left: '31.625rem' },
                  { l: isBn ? 'লিঙ্গ' : 'Gender', w: '4.0625rem', sticky: false },
                  { l: isBn ? 'রক্ত' : 'Blood', w: '3.4375rem', sticky: false },
                  { l: isBn ? 'মোবাইল' : 'Phone', w: '6.75rem', sticky: false },
                  { l: isBn ? 'ইন টাইম' : 'In Time', w: '4.375rem', sticky: false },
                  { l: isBn ? 'আউট টাইম' : 'Out Time', w: '4.6875rem', sticky: false },
                  { l: isBn ? 'অবস্থা' : 'Status', w: '5.3125rem', sticky: false },
                  { l: isBn ? 'অ্যাকশন' : 'Action', w: '4.375rem', sticky: false },
                ].map((h) => (
                  <th
                    key={h.l}
                    className="py-2.5 px-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap"
                    style={{ minWidth: h.w, ...(h.sticky ? sc(h.left || '0') : {}) }}
                  >
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-10 text-center text-[var(--text-muted)]">
                    <Users size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো শিক্ষক পাওয়া যায়নি' : 'No teachers found'}
                  </td>
                </tr>
              ) : (
                paginated.map((t, i) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border)] group"
                    style={{ background: selected.includes(t.id) ? 'rgba(99,102,241,0.04)' : undefined }}
                  >
                    <td className="p-2.5" style={sc('0')}>
                      <input
                        type="checkbox"
                        checked={selected.includes(t.id)}
                        onChange={() => toggleOne(t.id)}
                        className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                      />
                    </td>
                    <td className="p-2 text-[var(--text-muted)] font-semibold text-[0.6875rem]" style={sc('36px')}>
                      {(sp - 1) * perPage + i + 1}
                    </td>
                    <td className="p-2" style={sc('72px')}>
                      <div className="w-[1.875rem] h-[2.25rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                        {t.photo ? (
                          <img src={t.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={13} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                    </td>
                    <td className="p-2" style={sc('116px')}>
                      <span className="text-[0.625rem] font-mono text-[var(--brand)] bg-[var(--brand-light)] px-[0.3125rem] py-[0.125rem] rounded">
                        {t.id}
                      </span>
                    </td>
                    <td className="p-2" style={sc('246px')}>
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[9.6875rem]">
                        {isBn ? t.nameBn || t.nameEn : t.nameEn}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] truncate">{isBn ? t.nameEn : t.nameBn}</div>
                    </td>
                    <td className="p-2 text-[var(--text-secondary)] text-[0.6875rem]" style={sc('406px')}>
                      {getDeptName(t.departmentId)}
                    </td>
                    <td className="p-2 text-[var(--text-secondary)] text-[0.6875rem]" style={sc('506px')}>
                      {t.designation || '—'}
                    </td>
                    <td className="p-2">
                      <span
                        className="text-[0.625rem] px-[0.375rem] py-[0.125rem] rounded-[0.3125rem] font-medium"
                        style={{
                          background: t.gender === 'Female' ? 'var(--purple-light)' : 'var(--teal-light)',
                          color: t.gender === 'Female' ? 'var(--purple)' : 'var(--teal)',
                        }}
                      >
                        {t.gender === 'Female' ? (isBn ? 'মহিলা' : 'Female') : isBn ? 'পুরুষ' : 'Male'}
                      </span>
                    </td>
                    <td className="p-2 text-[0.6875rem] text-[var(--red)] font-medium">{t.bloodGroup || '—'}</td>
                    <td className="p-2 text-[var(--text-secondary)] font-mono text-[0.6875rem]">{t.phone}</td>
                    <td className="p-2 text-[var(--text-secondary)] text-[0.6875rem]">{t.inTime || '—'}</td>
                    <td className="p-2 text-[var(--text-secondary)] text-[0.6875rem]">{t.outTime || '—'}</td>
                    <td className="p-2">{statusBadge(t.status)}</td>
                    <td className="p-2">
                      <div className="flex gap-[0.1875rem]">
                        <button
                          onClick={() => setViewT(t)}
                          title="View"
                          className="w-[1.625rem] h-[1.625rem] rounded-[0.375rem] bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)]"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => navigate(`/teachers/edit/${t.id}`)}
                          title="Edit"
                          className="w-[1.625rem] h-[1.625rem] rounded-[0.375rem] bg-[var(--amber-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--amber)]"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center px-[0.875rem] py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex-wrap gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            {(sp - 1) * perPage + 1}–{Math.min(sp * perPage, filtered.length)} / {filtered.length}
          </span>
          <div className="flex gap-[0.1875rem]">
            {(
              [
                [<ChevronsLeft size={12} />, () => setPage(1), sp === 1] as const,
                [<ChevronLeft size={12} />, () => setPage((p) => Math.max(1, p - 1)), sp === 1] as const,
              ] as [React.ReactNode, () => void, boolean][]
            ).map(([ic, a, d], i) => (
              <button
                key={i}
                onClick={a}
                disabled={d}
                className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer disabled:cursor-default disabled:text-[var(--text-muted)]"
              >
                {ic}
              </button>
            ))}
            {(() => {
              const start = Math.max(1, Math.min(sp - 2, totalPages - 4))
              return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md border bg-[var(--bg-primary)] text-xs cursor-pointer ${p === sp ? 'border-[var(--brand)] bg-[var(--brand)] text-white font-semibold' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {p}
                </button>
              ))
            })()}
            {(
              [
                [<ChevronRight size={12} />, () => setPage((p) => Math.min(totalPages, p + 1)), sp === totalPages] as const,
                [<ChevronsRight size={12} />, () => setPage(totalPages), sp === totalPages] as const,
              ] as [React.ReactNode, () => void, boolean][]
            ).map(([ic, a, d], i) => (
              <button
                key={i}
                onClick={a}
                disabled={d}
                className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer disabled:cursor-default disabled:text-[var(--text-muted)]"
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
