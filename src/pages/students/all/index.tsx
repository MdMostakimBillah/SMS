import React, { useState, useMemo, useCallback } from 'react'
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
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { PDFOptionsModal } from '@/components/shared/PDFOptionsModal'
import { generateListPDF } from '@/pages/students/admission/listPdfTemplate'
import { generateA4HTML } from '@/pages/students/admission/a4Template'
import type { ListPDFOptions } from '@/pages/students/admission/listPdfTemplate'
import type { StudentAdmission } from '@/pages/students/admission/types'

const PER_PAGE_OPTS = [10, 20, 30, 50, 100, 200, 500, 1000]
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function AllStudentsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const currentSession = institution.currentSession
  const isBn = language === 'bn'

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
  const [fActive, setFActive] = useState('')
  const [fReligion, setFReligion] = useState('')
  const [fBlood, setFBlood] = useState('')
  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [showPDF, setShowPDF] = useState(false)
  const [viewSt, setViewSt] = useState<StudentAdmission | null>(null)
  useScrollLock(showPDF || viewSt !== null)

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (s.academicYear !== currentSession) return false
        if (s.status !== 'approved') return false
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
        if (fActive === 'active' && s.status !== 'approved') return false
        if (fActive === 'inactive' && s.status === 'approved') return false
        if (fReligion && !s.religion.includes(fReligion)) return false
        if (fBlood && s.bloodGroup !== fBlood) return false
        return true
      }),
    [students, currentSession, search, fClass, fSection, fGender, fActive, fReligion, fBlood]
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
      male: filtered.filter((s) => s.gender.includes('Male')).length,
      female: filtered.filter((s) => s.gender.includes('Female')).length,
    }),
    [filtered]
  )

  const exportExcel = useCallback(() => {
    const list = selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered
    const data = list.map((s, i) => ({
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
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, `students_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [selected, filtered])

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
    setFActive('')
    setFReligion('')
    setFBlood('')
    setPage(1)
  }, [])
  const hasFilter = search || fClass || fSection || fGender || fActive || fReligion || fBlood

  const sel =
    'px-2 py-[7px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs outline-none cursor-pointer'

  const statusBadge = (st: string) => {
    const m: Record<string, { b: string; c: string; l: string; lb: string }> = {
      pending: { b: 'var(--amber-light)', c: 'var(--amber)', l: 'Pending', lb: 'অপেক্ষমান' },
      approved: { b: 'var(--green-light)', c: 'var(--green)', l: 'Approved', lb: 'অনুমোদিত' },
      rejected: { b: 'var(--red-light)', c: 'var(--red)', l: 'Rejected', lb: 'প্রত্যাখ্যাত' },
    }
    const x = m[st] || m.pending
    return (
      <span
        className="text-[10px] font-semibold px-[7px] py-[2px] rounded-[10px] whitespace-nowrap"
        style={{ background: x.b, color: x.c }}
      >
        {isBn ? x.lb : x.l}
      </span>
    )
  }

  // sticky col style helpers
  const sc = (left: string) => (isMobile ? {} : { position: 'sticky' as const, left, zIndex: 4, background: 'var(--bg-primary)' })

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {showPDF && (
        <PDFOptionsModal count={selected.length || filtered.length} isBn={isBn} onClose={() => setShowPDF(false)} onDownload={handlePDF} />
      )}

      {viewSt && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-[var(--bg-primary)] rounded-2xl max-w-[560px] w-full max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)] shadow-[var(--shadow-lg)] modal-content">
            <div
              className="flex items-center justify-between px-[18px] py-[14px] border-b border-[var(--border)]"
              style={{ background: 'var(--brand-light)' }}
            >
              <div>
                <div className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {isBn ? viewSt.nameBn || viewSt.nameEn : viewSt.nameEn}
                </div>
                <div className="text-[11px] text-[var(--brand)] font-mono">{viewSt.id}</div>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(viewSt.status)}
                <button
                  onClick={() => setViewSt(null)}
                  className="w-7 h-7 rounded-[7px] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
                >
                  <X size={14} className="text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-[18px]">
              <div className="flex gap-[14px] mb-[14px]">
                <div className="w-[80px] h-[95px] rounded-lg border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
                  {viewSt.photo ? (
                    <img src={viewSt.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{viewSt.nameEn}</h3>
                  <p className="text-[13px] text-[var(--text-secondary)]">{viewSt.nameBn}</p>
                  <div className="flex gap-[5px] mt-1.5 flex-wrap">
                    {[
                      { t: `${classNameMap[viewSt.class] ? (isBn ? classNameMap[viewSt.class].bn : classNameMap[viewSt.class].en) : viewSt.class}-${viewSt.section}`, c: 'var(--brand)', b: 'var(--brand-light)' },
                      { t: viewSt.gender.split(' / ')[0], c: 'var(--teal)', b: 'var(--teal-light)' },
                      { t: viewSt.bloodGroup, c: 'var(--red)', b: 'var(--red-light)' },
                    ]
                      .filter((x) => x.t)
                      .map((x, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium px-2 py-[2px] rounded-[5px]"
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
                    className="flex gap-2 py-[5px] border-b border-[var(--border)]"
                    style={{ borderBottomWidth: '0.5px' }}
                  >
                    <span className="text-[11px] text-[var(--text-muted)] w-[120px] shrink-0">{l}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{v}</span>
                  </div>
                ) : null
              )}
            </div>
            <div className="flex gap-2 justify-end flex-wrap px-[18px] py-3 border-t border-[var(--border)]">
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
                className="flex items-center gap-[5px] px-3.5 py-2 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[13px] font-medium cursor-pointer"
              >
                <FileText size={13} />
                PDF
              </button>
              <button
                onClick={() => setViewSt(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button
                onClick={() => {
                  navigate('/students/update', { state: { studentId: viewSt.id } })
                  setViewSt(null)
                }}
                className="flex items-center gap-[5px] px-3.5 py-2 rounded-lg bg-[var(--amber)] border-0 text-white text-[13px] font-medium cursor-pointer"
              >
                <Edit2 size={13} />
                {isBn ? 'এডিট' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Section - fixed */}
      <div className="shrink-0">
        {/* Page header */}
        <div className="flex items-center gap-[10px] mb-4 flex-wrap">
          <button
            onClick={() => navigate('/students')}
            className="flex items-center gap-[5px] px-3 py-[7px] rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] shrink-0"
          >
            <ArrowLeft size={14} />
            {isBn ? 'ফিরে যান' : 'Back'}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={`${isMobile ? 'text-lg' : 'text-[22px]'} font-semibold text-[var(--text-primary)]`}>
              {isBn ? 'সকল ছাত্র' : 'All Students'}
            </h1>
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { label: isBn ? 'মোট' : 'Total', value: stats.total },
                { label: isBn ? 'অনুমোদিত' : 'Approved', value: stats.approved, color: 'var(--green)' },
                { label: isBn ? 'অপেক্ষমান' : 'Pending', value: stats.pending, color: 'var(--amber)' },
                { label: isBn ? 'ছেলে' : 'Male', value: stats.male, color: 'var(--teal)' },
                { label: isBn ? 'মেয়ে' : 'Female', value: stats.female, color: 'var(--purple)' },
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => navigate('/students/update')}
              className="flex items-center gap-[5px] px-3.5 py-2 rounded-[9px] bg-[var(--amber-light)] border border-[var(--amber)] text-[var(--amber)] text-[13px] cursor-pointer font-medium"
            >
              <Edit2 size={14} />
              {isBn ? 'আপডেট' : 'Update'}
            </button>
            <button
              onClick={() => navigate('/students/bulk-update')}
              className="flex items-center gap-[5px] px-3.5 py-2 rounded-[9px] bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[13px] cursor-pointer font-medium"
            >
              <Layers size={14} />
              {isBn ? 'বাল্ক আপডেট' : 'Bulk Update'}
            </button>
          </div>
        </div>

        {/* Sticky Filters + Toolbar */}
        <div className="sticky top-0 z-50 bg-[var(--bg-primary)] pt-0.5 pb-1">
          {/* Filters */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-[14px] mb-2.5">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))' }}
            >
              <div className="flex items-center gap-[7px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[10px] py-[7px]">
                <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={isBn ? 'নাম, আইডি, রোল, মোবাইল...' : 'Name, ID, roll, mobile...'}
                  className="flex-1 border-none bg-transparent outline-none text-[13px] text-[var(--text-primary)]"
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
                  setFActive(e.target.value)
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
                className="flex items-center gap-[5px] px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[11px] cursor-pointer mt-2"
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
                className={`${sel} px-2 py-[5px]`}
              >
                {PER_PAGE_OPTS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {selected.length > 0 && (
                <span className="text-xs text-[var(--brand)] bg-[var(--brand-light)] px-[10px] py-[3px] rounded-md font-medium">
                  {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={exportExcel}
                className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-xs cursor-pointer font-medium"
              >
                <FileSpreadsheet size={13} />
                Excel
              </button>
              <button
                onClick={() => setShowPDF(true)}
                className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs cursor-pointer font-medium"
              >
                <FileText size={13} />
                PDF {selected.length > 0 ? `(${selected.length})` : `(${filtered.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table - scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] mt-1">
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'max-h-[50vh]' : ''}`}>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2.5 w-[36px]" style={sc('0')}>
                  <input
                    type="checkbox"
                    checked={allSel}
                    onChange={toggleAll}
                    className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                  />
                </th>
                {[
                  { l: '#', w: '36px', sticky: true, left: '36px' },
                  { l: isBn ? 'ছবি' : 'Photo', w: '44px', sticky: true, left: '72px' },
                  { l: isBn ? 'ছাত্র আইডি' : 'Student ID', w: '140px', sticky: true, left: '116px' },
                  { l: isBn ? 'নাম' : 'Name', w: '160px', sticky: true, left: '256px' },
                  { l: isBn ? 'শ্রেণি/রোল' : 'Class/Roll', w: '90px', sticky: true, left: '416px' },
                  { l: isBn ? 'লিঙ্গ' : 'Gender', w: '65px', sticky: false },
                  { l: isBn ? 'রক্ত' : 'Blood', w: '55px', sticky: false },
                  { l: isBn ? 'মোবাইল' : 'Mobile', w: '108px', sticky: false },
                  { l: isBn ? 'পিতার মোবাইল' : 'Father Mobile', w: '108px', sticky: false },
                  { l: isBn ? 'জেলা' : 'District', w: '75px', sticky: false },
                  { l: isBn ? 'অবস্থা' : 'Status', w: '85px', sticky: false },
                  { l: isBn ? 'অ্যাকশন' : 'Action', w: '70px', sticky: false },
                ].map((h) => (
                  <th
                    key={h.l}
                    className="py-2.5 px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap"
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
                    style={{ background: selected.includes(s.id) ? 'rgba(99,102,241,0.04)' : undefined }}
                  >
                    <td className="p-2.5" style={sc('0')}>
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                      />
                    </td>
                    <td className="p-2 text-[var(--text-muted)] font-semibold text-[11px]" style={sc('36px')}>
                      {(sp - 1) * perPage + i + 1}
                    </td>
                    <td className="p-2" style={sc('72px')}>
                      <div className="w-[30px] h-[36px] rounded-[5px] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
                        {s.photo ? (
                          <img src={s.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={13} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                    </td>
                    <td className="p-2" style={sc('116px')}>
                      <span className="text-[10px] font-mono text-[var(--brand)] bg-[var(--brand-light)] px-[5px] py-[2px] rounded">
                        {s.id}
                      </span>
                    </td>
                    <td className="p-2" style={sc('256px')}>
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[155px]">
                        {isBn ? s.nameBn || s.nameEn : s.nameEn}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">{isBn ? s.nameEn : s.nameBn}</div>
                    </td>
                    <td className="p-2 text-[var(--text-secondary)] text-[11px] whitespace-nowrap" style={sc('416px')}>
                      {classNameMap[s.class] ? (isBn ? classNameMap[s.class].bn : classNameMap[s.class].en) : s.class}
                      {s.section ? `-${s.section}` : ''}
                      {s.roll ? ` / ${s.roll}` : ''}
                    </td>
                    <td className="p-2">
                      <span
                        className="text-[10px] px-[6px] py-[2px] rounded-[5px] font-medium"
                        style={{
                          background: s.gender.includes('Female') ? 'var(--purple-light)' : 'var(--teal-light)',
                          color: s.gender.includes('Female') ? 'var(--purple)' : 'var(--teal)',
                        }}
                      >
                        {s.gender.includes('Female') ? (isBn ? 'মেয়ে' : 'Female') : isBn ? 'ছেলে' : 'Male'}
                      </span>
                    </td>
                    <td className="p-2 text-[11px] text-[var(--red)] font-medium">{s.bloodGroup || '—'}</td>
                    <td className="p-2 text-[var(--text-secondary)] font-mono text-[11px]">{s.phone}</td>
                    <td className="p-2 text-[var(--text-secondary)] font-mono text-[11px]">{s.fatherPhone}</td>
                    <td className="p-2 text-[var(--text-secondary)] text-[11px]">{s.district || '—'}</td>
                    <td className="p-2">{statusBadge(s.status)}</td>
                    <td className="p-2">
                      <div className="flex gap-[3px]">
                        <button
                          onClick={() => setViewSt(s)}
                          title="View"
                          className="w-[26px] h-[26px] rounded-[6px] bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)]"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => navigate('/students/update', { state: { studentId: s.id } })}
                          title="Edit"
                          className="w-[26px] h-[26px] rounded-[6px] bg-[var(--amber-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--amber)]"
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
        <div className="flex justify-between items-center px-[14px] py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex-wrap gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            {(sp - 1) * perPage + 1}–{Math.min(sp * perPage, filtered.length)} / {filtered.length}
          </span>
          <div className="flex gap-[3px]">
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
