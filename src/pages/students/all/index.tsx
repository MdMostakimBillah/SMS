import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  X,
  User,
  Edit2,
  ArrowLeft,
  Layers,
  Search,
  FileSpreadsheet,
  FileText,
  Users,
  Eye,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  UserX,
  UserCheck,
  ChevronDown,
  MoreVertical,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useSessionStudents, useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { PDFOptionsModal } from '@/components/shared/PDFOptionsModal'
import { InactivationModal } from '@/components/shared/InactivationModal'
import { generateListPDF } from '@/pages/students/admission/listPdfTemplate'
import { generateA4HTML } from '@/pages/students/admission/a4Template'
import type { ListPDFOptions } from '@/pages/students/admission/listPdfTemplate'
import type { StudentAdmission } from '@/pages/students/admission/types'

const PER_PAGE_OPTS = [10, 20, 30, 50, 100, 200, 500, 1000]
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function AllStudentsPage() {
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const students = useSessionStudents()
  const deactivateStudent = useAdmissionStore((s) => s.deactivateStudent)
  const reactivateStudent = useAdmissionStore((s) => s.reactivateStudent)
  const { classes, institution } = useClassStore()
  const currentSession = institution.currentSession
  const isBn = useBn()

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const sectionSet = new Set<string>()
    classes.forEach((cls) => cls.sections.forEach((s) => sectionSet.add(s.name)))
    return Array.from(sectionSet).sort()
  }, [classes])

  // Map class number to full class name (e.g., "1" → { en: "Class 1", bn: "শ্রেণি ১" })
  const classNameMap = useMemo(() => {
    const map: Record<string, { en: string; bn: string }> = {}
    classes.forEach((cls) => {
      const match = cls.name.match(/\d+/)
      const classNum = match ? match[0] : cls.name
      map[classNum] = { en: cls.name, bn: cls.nameBn || cls.name }
    })
    return map
  }, [classes])

  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fGender, setFGender] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fActive, setFActive] = useState<'active' | 'inactive' | ''>('active')
  const setFActiveState = useCallback((v: 'active' | 'inactive' | '') => setFActive(v), [])
  const [fReligion, setFReligion] = useState('')
  const [fBlood, setFBlood] = useState('')
  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [showPDF, setShowPDF] = useState(false)
  const [viewSt, setViewSt] = useState<StudentAdmission | null>(null)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [inactiveTarget, setInactiveTarget] = useState<StudentAdmission | null>(null)
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

  useScrollLock(showPDF || viewSt !== null || inactiveTarget !== null)

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (s.academicYear !== currentSession) return false
        // Default: show approved + inactive students; exclude rejected
        if (!fStatus) {
          if (s.status !== 'approved' && s.active !== false) return false
        } else {
          if (s.status !== fStatus) return false
        }
        if (search) {
          const q = search.toLowerCase()
          if (
            !s.nameEn.toLowerCase().includes(q) &&
            !s.nameBn.includes(search) &&
            !s.id.includes(search) &&
            !s.phone.includes(search) &&
            !s.roll.includes(search) &&
            !s.fatherPhone.includes(search) &&
            !s.motherPhone.includes(search)
          )
            return false
        }
        if (fClass && s.class !== fClass) return false
        if (fSection && s.section !== fSection) return false
        if (fGender && !s.gender.includes(fGender)) return false
        if (fActive === 'active' && s.active === false) return false
        if (fActive === 'inactive' && s.active !== false) return false
        if (fReligion && !s.religion.includes(fReligion)) return false
        if (fBlood && s.bloodGroup !== fBlood) return false
        return true
      }),
    [students, currentSession, search, fClass, fSection, fGender, fStatus, fActive, fReligion, fBlood]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const sp = Math.min(page, totalPages)
  const paginated = useMemo(() => filtered.slice((sp - 1) * perPage, sp * perPage), [filtered, sp, perPage])

  const pageIds = paginated.map((s) => s.id)
  const allSel = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))

  const toggleAll = useCallback(
    () => setSelected((p) => (allSel ? p.filter((id) => !pageIds.includes(id)) : [...new Set([...p, ...pageIds])])),
    [allSel, pageIds]
  )
  const toggleOne = useCallback((id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), [])

  const stats = useMemo(
    () => ({
      total: filtered.length,
      approved: filtered.filter((s) => s.status === 'approved').length,
      pending: filtered.filter((s) => s.status === 'pending').length,
      rejected: filtered.filter((s) => s.status === 'rejected').length,
      male: filtered.filter((s) => s.gender.includes('Male')).length,
      female: filtered.filter((s) => s.gender.includes('Female')).length,
    }),
    [filtered]
  )

  const exportExcel = useCallback(() => {
    const instName = institution.name || 'Institution'
    const instNameBn = institution.nameBn || ''
    const instAddress = institution.address || ''
    const instPhone = institution.phone || ''
    const instEmail = institution.email || ''

    const list = selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered
    const studentsData = list.map((s, i) => ({
      '#': i + 1,
      'Student ID': s.id,
      'Name EN': s.nameEn,
      'Name BN': s.nameBn,
      Class: classNameMap[s.class] ? (isBn ? classNameMap[s.class].bn : classNameMap[s.class].en) : s.class,
      Section: s.section,
      Roll: s.roll,
      Gender: s.gender.split(' / ')[0],
      DOB: s.dob,
      Blood: s.bloodGroup,
      Religion: s.religion.split(' / ')[0],
      Mobile: s.phone,
      Email: s.email,
      District: s.district,
      Father: s.fatherNameEn,
      'Father Mobile': s.fatherPhone,
      Mother: s.motherNameEn,
      'Mother Mobile': s.motherPhone,
      'Admission Date': s.admissionDate,
      Status: s.status,
    }))

    const ws = XLSX.utils.json_to_sheet(studentsData)
    XLSX.utils.sheet_add_aoa(ws, [
      [instName],
      [instNameBn],
      [instAddress],
      [`Phone: ${instPhone} | Email: ${instEmail}`],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, `students_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [selected, filtered, institution, isBn, classNameMap])

  const handlePDF = useCallback(
    (opts: ListPDFOptions) => {
      const list = selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(generateListPDF(list, opts))
      win.document.close()
      setTimeout(() => win.print(), 800)
      setShowPDF(false)
    },
    [selected, filtered]
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setFClass('')
    setFSection('')
    setFGender('')
    setFStatus('')
    setFActive('active')
    setFReligion('')
    setFBlood('')
    setPage(1)
  }, [])
  const hasFilter = search || fClass || fSection || fGender || fStatus || fActive || fReligion || fBlood

  const sel =
    'w-full min-w-0 px-2 py-[0.4375rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs outline-none cursor-pointer truncate'

  const statusBadge = (st: string, active?: boolean) => {
    const m: Record<string, { b: string; c: string; l: string; lb: string }> = {
      pending: { b: 'var(--amber-light)', c: 'var(--amber)', l: 'Pending', lb: 'অপেক্ষমান' },
      approved: { b: 'var(--green-light)', c: 'var(--green)', l: 'Active', lb: 'সক্রিয়' },
      rejected: { b: 'var(--red-light)', c: 'var(--red)', l: 'Rejected', lb: 'প্রত্যাখ্যাত' },
    }
    const x = m[st] || m.pending
    const inactive = st === 'approved' && active === false
    return (
      <span
        className="text-[0.625rem] font-semibold px-[0.4375rem] py-[0.125rem] rounded-[0.625rem] whitespace-nowrap"
        style={{ background: inactive ? 'var(--red-light)' : x.b, color: inactive ? 'var(--red)' : x.c }}
      >
        {inactive ? (isBn ? 'নিষ্ক্রিয়' : 'Inactive') : isBn ? x.lb : x.l}
      </span>
    )
  }

  // sticky col style helpers
  const sc = (left: string) => (isMobile ? {} : { position: 'sticky' as const, left, zIndex: 4, background: 'var(--bg-primary)' })

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {showPDF && (
        <PDFOptionsModal
          count={selected.length || filtered.length}
          isBn={isBn}
          students={selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered}
          onClose={() => setShowPDF(false)}
          onDownload={handlePDF}
        />
      )}

      {viewSt && createPortal(
        <div
          className="modal-overlay"
        >
          <div className="modal-box modal-content" style={{ maxWidth: '35rem' }}>
            <div
              className="flex items-center justify-between px-[1.125rem] py-[0.875rem] border-b border-[var(--border)]"
              style={{ background: 'var(--brand-light)' }}
            >
              <div>
                <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? viewSt.nameBn || viewSt.nameEn : viewSt.nameEn}
                </div>
                <div className="text-[0.6875rem] text-[var(--brand)] font-mono">{viewSt.id}</div>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(viewSt.status, viewSt.active)}
                <button
                  onClick={() => setViewSt(null)}
                  className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
                >
                  <X size={14} className="text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-[1.125rem]">
              <div className="flex gap-[0.875rem] mb-[0.875rem]">
                <div className="w-[5rem] h-[5.9375rem] rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                  {viewSt.photo ? (
                    <img src={viewSt.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{viewSt.nameEn}</h3>
                  <p className="text-[0.8125rem] text-[var(--text-secondary)]">{viewSt.nameBn}</p>
                  <div className="flex gap-[0.3125rem] mt-1.5 flex-wrap">
                    {[
                      { t: `${classNameMap[viewSt.class] ? (isBn ? classNameMap[viewSt.class].bn : classNameMap[viewSt.class].en) : viewSt.class}-${viewSt.section}`, c: 'var(--brand)', b: 'var(--brand-light)' },
                      { t: viewSt.gender.split(' / ')[0], c: 'var(--teal)', b: 'var(--teal-light)' },
                      { t: viewSt.bloodGroup, c: 'var(--red)', b: 'var(--red-light)' },
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
                [isBn ? 'মোবাইল' : 'Mobile', viewSt.phone],
                ['Email', viewSt.email],
                [isBn ? 'রোল' : 'Roll', viewSt.roll],
                [isBn ? 'জন্ম তারিখ' : 'DOB', viewSt.dob],
                [isBn ? 'ধর্ম' : 'Religion', viewSt.religion.split(' / ')[0]],
                [isBn ? 'জেলা' : 'District', viewSt.district],
                [isBn ? 'বর্তমান ঠিকানা' : 'Address', viewSt.presentAddress],
                [isBn ? 'পিতার নাম' : 'Father', viewSt.fatherNameEn],
                [isBn ? 'পিতার মোবাইল' : 'Father Mobile', viewSt.fatherPhone],
                [isBn ? 'মাতার নাম' : 'Mother', viewSt.motherNameEn],
                [isBn ? 'মাতার মোবাইল' : 'Mother Mobile', viewSt.motherPhone],
                [isBn ? 'ভর্তির তারিখ' : 'Admission Date', viewSt.admissionDate],
              ].map(([l, v]) =>
                v ? (
                  <div
                    key={String(l)}
                    className="flex gap-2 py-[0.3125rem] border-b border-[var(--border)]"
                    style={{ borderBottomWidth: '0.0313rem' }}
                  >
                    <span className="text-[0.6875rem] text-[var(--text-muted)] w-[7.5rem] shrink-0">{l}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{v}</span>
                  </div>
                ) : null
              )}
            </div>
            <div className="flex gap-2 justify-end flex-wrap px-[1.125rem] py-3 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  const win = window.open('', '_blank')
                  if (!win) return
                  win.document.write(generateA4HTML(viewSt, isBn))
                  win.document.close()
                  setTimeout(() => {
                    win.print()
                  }, 600)
                }}
                className="flex items-center gap-[0.3125rem] px-3.5 py-2 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.8125rem] font-medium cursor-pointer"
              >
                <FileText size={13} />
                PDF
              </button>
              <button
                onClick={() => setViewSt(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button
                onClick={() => {
                  navigate('/students/update', { state: { studentId: viewSt.id } })
                  setViewSt(null)
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

      {/* Top Section - fixed */}
      <div className="shrink-0">
        {/* Page header */}
        <div className="mb-4">
          <div className="flex items-center gap-[0.625rem] mb-2">
            <button
              onClick={() => navigate('/students')}
              className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] shrink-0"
            >
              <ArrowLeft size={14} />
              {isBn ? 'ফিরে যান' : 'Back'}
            </button>
            <h1 className={`${isMobile ? 'text-lg' : 'text-[1.375rem]'} font-semibold text-[var(--text-primary)] flex-1 min-w-0`}>
              {isBn ? 'সকল ছাত্র' : 'All Students'}
            </h1>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate('/students/update')}
                className="flex items-center gap-[0.3125rem] px-3 py-2 rounded-[0.5625rem] bg-[var(--amber-light)] border border-[var(--amber)] text-[var(--amber)] text-[0.8125rem] cursor-pointer font-medium"
              >
                <Edit2 size={14} />
                {!isMobile && (isBn ? 'আপডেট' : 'Update')}
              </button>
              <button
                onClick={() => navigate('/students/bulk-update')}
                className="flex items-center gap-[0.3125rem] px-3 py-2 rounded-[0.5625rem] bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.8125rem] cursor-pointer font-medium"
              >
                <Layers size={14} />
                {!isMobile && (isBn ? 'বাল্ক আপডেট' : 'Bulk Update')}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-0.5 mt-1 overflow-x-auto">
            {[
              { label: isBn ? 'মোট' : 'Total', value: stats.total, bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' },
              { label: isBn ? 'অনুমোদিত' : 'Approved', value: stats.approved, bg: 'var(--green-light)', color: 'var(--green)' },
              { label: isBn ? 'অপেক্ষমান' : 'Pending', value: stats.pending, bg: 'var(--amber-light)', color: 'var(--amber)' },
              { label: isBn ? 'প্রত্যাখ্যাত' : 'Rejected', value: stats.rejected, bg: 'var(--red-light)', color: 'var(--red)' },
              { label: isBn ? 'ছেলে' : 'Male', value: stats.male, bg: 'var(--teal-light)', color: 'var(--teal)' },
              { label: isBn ? 'মেয়ে' : 'Female', value: stats.female, bg: 'var(--purple-light)', color: 'var(--purple)' },
            ].map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-0.5 text-[0.5625rem] font-medium px-1 py-0.5 rounded whitespace-nowrap"
                style={{ background: s.bg, color: s.color }}
              >
                <span className="font-semibold">{s.value}</span>
                <span>{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Sticky Filters + Toolbar */}
        <div className="sticky top-0 z-50 pt-0.5 pb-1" style={{ background: 'transparent' }}>
          {/* Filters */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-[0.875rem] mb-2.5">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              <div className="flex items-center gap-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[0.625rem] py-[0.4375rem]">
                <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={isBn ? 'নাম, আইডি, রোল, মোবাইল...' : 'Name, ID, roll, mobile...'}
                  className="flex-1 border-none bg-transparent outline-none text-[0.8125rem] text-[var(--text-primary)]"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="border-none bg-transparent cursor-pointer text-[var(--text-muted)] flex">
                    <X size={12} />
                  </button>
                )}
              </div>
              <select
                value={fClass}
                onChange={(e) => {
                  setFClass(e.target.value)
                  setFSection('')
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={fSection}
                onChange={(e) => {
                  setFSection(e.target.value)
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
                {fClass
                  ? (sectionsMap[fClass] || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  : allSections.map((s) => (
                      <option key={s} value={s}>
                        {s}
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
                <option value="Male">{isBn ? 'ছেলে' : 'Male'}</option>
                <option value="Female">{isBn ? 'মেয়ে' : 'Female'}</option>
              </select>
              <select
                value={fStatus}
                onChange={(e) => {
                  setFStatus(e.target.value)
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব স্ট্যাটাস' : 'All Status'}</option>
                <option value="approved">{isBn ? 'অনুমোদিত' : 'Approved'}</option>
                <option value="pending">{isBn ? 'অপেক্ষমান' : 'Pending'}</option>
                <option value="rejected">{isBn ? 'প্রত্যাখ্যাত' : 'Rejected'}</option>
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
                <option value="">{isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={fActive}
                onChange={(e) => {
                  setFActiveState(e.target.value as 'active' | 'inactive' | '')
                  setPage(1)
                }}
                className={sel}
              >
                <option value="">{isBn ? 'সব অবস্থা' : 'All Status'}</option>
                <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
                <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
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

          {/* Toolbar */}
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

      {/* Table - scrollable */}
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
                  { l: '#', w: '2.25rem', sticky: true, left: '2.25rem' },
                  { l: isBn ? 'ছবি' : 'Photo', w: '2.75rem', sticky: true, left: '4.5rem' },
                  { l: isBn ? 'ছাত্র আইডি' : 'Student ID', w: '8.75rem', sticky: true, left: '7.25rem' },
                  { l: isBn ? 'নাম' : 'Name', w: '10rem', sticky: true, left: '16rem' },
                  { l: isBn ? 'শ্রেণি/রোল' : 'Class/Roll', w: '5.625rem', sticky: true, left: '26rem' },
                  { l: isBn ? 'লিঙ্গ' : 'Gender', w: '4.0625rem', sticky: false },
                  { l: isBn ? 'রক্ত' : 'Blood', w: '3.4375rem', sticky: false },
                  { l: isBn ? 'মোবাইল' : 'Mobile', w: '6.75rem', sticky: false },
                  { l: isBn ? 'পিতার মোবাইল' : 'Father Mobile', w: '6.75rem', sticky: false },
                  { l: isBn ? 'জেলা' : 'District', w: '4.6875rem', sticky: false },
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
                  <td colSpan={13} className="p-10 text-center text-[var(--text-muted)]">
                    <Users size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}
                  </td>
                </tr>
              ) : (
                paginated.map((s, i) => (
                  <tr
                    key={s.id}
                    className="border-b border-[var(--border)] group"
                    style={{
                      background: selected.includes(s.id) ? 'rgba(99,102,241,0.04)' : s.active === false ? 'rgba(239,68,68,0.04)' : undefined,
                      opacity: s.active === false ? 0.6 : 1,
                    }}
                  >
                    <td className="p-2.5" style={sc('0')}>
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                      />
                    </td>
                    <td className="p-2 text-[var(--text-muted)] font-semibold text-[0.6875rem]" style={sc('36px')}>
                      {(sp - 1) * perPage + i + 1}
                    </td>
                    <td className="p-2" style={sc('72px')}>
                      <div className="w-[1.875rem] h-[2.25rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                        {s.photo ? (
                          <img src={s.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={13} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                    </td>
                    <td className="p-2" style={sc('116px')}>
                      <span className="text-[0.625rem] font-mono text-[var(--brand)] bg-[var(--brand-light)] px-[0.3125rem] py-[0.125rem] rounded">
                        {s.id}
                      </span>
                    </td>
                    <td className="p-2" style={sc('256px')}>
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[9.6875rem]">
                        {isBn ? s.nameBn || s.nameEn : s.nameEn}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] truncate">{isBn ? s.nameEn : s.nameBn}</div>
                    </td>
                    <td className="p-2 text-[var(--text-secondary)] text-[0.6875rem] whitespace-nowrap" style={sc('416px')}>
                      {classNameMap[s.class] ? (isBn ? classNameMap[s.class].bn : classNameMap[s.class].en) : s.class}
                      {s.section ? `-${s.section}` : ''}
                      {s.roll ? ` / ${s.roll}` : ''}
                    </td>
                    <td className="p-2">
                      <span
                        className="text-[0.625rem] px-[0.375rem] py-[0.125rem] rounded-[0.3125rem] font-medium"
                        style={{
                          background: s.gender.includes('Female') ? 'var(--purple-light)' : 'var(--teal-light)',
                          color: s.gender.includes('Female') ? 'var(--purple)' : 'var(--teal)',
                        }}
                      >
                        {s.gender.includes('Female') ? (isBn ? 'মেয়ে' : 'Female') : isBn ? 'ছেলে' : 'Male'}
                      </span>
                    </td>
                    <td className="p-2 text-[0.6875rem] text-[var(--red)] font-medium">{s.bloodGroup || '—'}</td>
                    <td className="p-2 text-[var(--text-secondary)] font-mono text-[0.6875rem]">{s.phone}</td>
                    <td className="p-2 text-[var(--text-secondary)] font-mono text-[0.6875rem]">{s.fatherPhone}</td>
                    <td className="p-2 text-[var(--text-secondary)] text-[0.6875rem]">{s.district || '—'}</td>
                    <td className="p-2">{statusBadge(s.status, s.active)}</td>
                    <td className="p-2">
                      <div className="flex gap-[0.1875rem]">
                        <button
                          onClick={() => setViewSt(s)}
                          title="View"
                          className="w-[1.625rem] h-[1.625rem] rounded-[0.375rem] bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)]"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => navigate('/students/update', { state: { studentId: s.id } })}
                          title="Edit"
                          className="w-[1.625rem] h-[1.625rem] rounded-[0.375rem] bg-[var(--amber-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--amber)]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => s.active === false ? reactivateStudent(s.id) : setInactiveTarget(s)}
                          title={s.active === false ? 'Reactivate' : 'Inactive'}
                          className={`w-[1.625rem] h-[1.625rem] rounded-[0.375rem] border-0 cursor-pointer flex items-center justify-center ${
                            s.active === false
                              ? 'bg-[var(--green-light)] text-[var(--green)]'
                              : 'bg-[var(--red-light)] text-[var(--red)]'
                          }`}
                        >
                          {s.active === false ? <UserCheck size={12} /> : <UserX size={12} />}
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
      {/* Inactivation Modal */}
      {inactiveTarget && (
        <InactivationModal
          studentName={inactiveTarget.nameEn}
          isBn={isBn}
          onConfirm={(date, reason) => {
            deactivateStudent(inactiveTarget.id, date, reason)
            setInactiveTarget(null)
          }}
          onCancel={() => setInactiveTarget(null)}
        />
      )}
    </div>
  )
}
