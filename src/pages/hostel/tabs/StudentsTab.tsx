import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Users, UserPlus, Pencil, Trash2, Home, BedDouble, FileSpreadsheet, FileText, Filter, X, CalendarDays, MoreVertical, ChevronDown } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useHostelStore, type HostelAssignment } from '@/store/hostelStore'
import { MONTH_NAMES, MONTH_NAMES_BN } from '@/store/transportStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { AssignmentModal } from '../modals/AssignmentModal'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  searchQuery: string
}

export const StudentsTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { rooms, assignments, deleteAssignment } = useHostelStore()
  const students = useSessionStudents()
  const currentSession = useClassStore((s) => s.institution.currentSession) || '2025-26'

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<HostelAssignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filterRoom, setFilterRoom] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const enrichedAssignments = useMemo(() => {
    return assignments.map((a) => {
      const student = students.find((s) => s.id === a.studentId)
      const room = rooms.find((r) => r.id === a.roomId)
      return { ...a, student, room }
    })
  }, [assignments, students, rooms])

  const filtered = useMemo(() => {
    let list = enrichedAssignments
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) =>
          a.student?.nameEn?.toLowerCase().includes(q) ||
          a.student?.nameBn?.includes(q) ||
          a.student?.class?.toLowerCase().includes(q) ||
          a.room?.roomNumber?.toLowerCase().includes(q) ||
          a.bedNumber?.toLowerCase().includes(q)
      )
    }
    if (filterRoom) {
      list = list.filter((a) => a.roomId === filterRoom)
    }
    return list.sort((a, b) => {
      const aName = a.student?.nameEn || ''
      const bName = b.student?.nameEn || ''
      return aName.localeCompare(bName)
    })
  }, [enrichedAssignments, searchQuery, filterRoom])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const totalRent = filtered.reduce((sum, a) => sum + a.monthlyRent, 0)

  const handleDelete = () => {
    if (deleteId) {
      deleteAssignment(deleteId)
      setDeleteId(null)
    }
  }

  const exportExcel = useCallback(() => {
    const rows = filtered.map((a, i) => ({
      '#': i + 1,
      [bn ? 'ছাত্র' : 'Student']: a.student ? (bn ? a.student.nameBn : a.student.nameEn) : '',
      [bn ? 'আইডি' : 'ID']: a.studentId,
      [bn ? 'শ্রেণি' : 'Class']: a.student ? `${a.student.class}-${a.student.section}` : '',
      [bn ? 'রুম' : 'Room']: a.room?.roomNumber || '',
      [bn ? 'বেড' : 'Bed']: a.bedNumber,
      [bn ? 'বছর' : 'Year']: a.academicYear,
      [bn ? 'মাস' : 'Months']: (a.months || []).map((m) => (bn ? MONTH_NAMES_BN[m] : MONTH_NAMES[m])).join(', '),
      [bn ? 'ভাড়া (৳)' : 'Rent (৳)']: a.monthlyRent,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'হোস্টেল ছাত্র' : 'Hostel Students')
    XLSX.writeFile(wb, `hostel-students-${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filtered, bn])

  const monthName = useCallback((m: number) => bn ? MONTH_NAMES_BN[m] : MONTH_NAMES[m], [bn])

  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'student', label: 'Student', labelBn: 'ছাত্র', default: true },
    { key: 'id', label: 'ID', labelBn: 'আইডি', default: true },
    { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
    { key: 'room', label: 'Room', labelBn: 'রুম', default: true },
    { key: 'bed', label: 'Bed', labelBn: 'বেড', default: true },
    { key: 'year', label: 'Year', labelBn: 'বছর', default: true },
    { key: 'months', label: 'Months', labelBn: 'মাস', default: true },
    { key: 'rent', label: 'Rent', labelBn: 'ভাড়া', default: true },
  ], [])

  const buildPdfRow = useCallback((a: (typeof filtered)[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('student')) row[bn ? 'ছাত্র' : 'Student'] = a.student ? (bn ? a.student.nameBn : a.student.nameEn) : ''
    if (cols.includes('id')) row[bn ? 'আইডি' : 'ID'] = a.studentId
    if (cols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = a.student ? `${a.student.class}-${a.student.section}` : ''
    if (cols.includes('room')) row[bn ? 'রুম' : 'Room'] = a.room?.roomNumber || ''
    if (cols.includes('bed')) row[bn ? 'বেড' : 'Bed'] = a.bedNumber
    if (cols.includes('year')) row[bn ? 'বছর' : 'Year'] = a.academicYear
    if (cols.includes('months')) row[bn ? 'মাস' : 'Months'] = (a.months || []).map(monthName).join(', ')
    if (cols.includes('rent')) row[bn ? 'ভাড়া' : 'Rent (৳)'] = a.monthlyRent
    return row
  }, [bn, monthName])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = filtered.map((a, i) => buildPdfRow(a, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const emptyRow = '<td>&nbsp;</td>'
    const bodyRows = rows.map((r) => {
      const cells = headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')
      const empties = opts.emptyColumns.map(() => emptyRow).join('')
      return `<tr>${cells}${empties}</tr>`
    }).join('')
    const fillerRows = Array.from({ length: opts.emptyRows }).map(() => {
      const cells = headers.map(() => `<td>&nbsp;</td>`).join('')
      const empties = opts.emptyColumns.map(() => emptyRow).join('')
      return `<tr>${cells}${empties}</tr>`
    }).join('')
    const colgroup = opts.emptyColumns.length > 0
      ? `<colgroup>${opts.emptyColumns.map(() => '<col style="width:24px">').join('')}</colgroup>`
      : ''
    const headerCells = headers.map((h) => `<th>${h}</th>`).join('')
    const emptyHeaders = opts.emptyColumns.map((ec) => `<th>${ec}</th>`).join('')
    const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table>${colgroup}<thead><tr>${headerCells}${emptyHeaders}</tr></thead><tbody>${bodyRows}${fillerRows}</tbody></table><div class="ftr">Generated: ${genDate}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = filtered.slice(0, 20).map((a, i) => buildPdfRow(a, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const branding = getPDFBranding()
    const headerRow = headers.map((h) => `<th style="background:${branding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')
    const bodyRows = rows.map((r) => {
      const cells = headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    const overflowNote = filtered.length > 20
      ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${filtered.length - 20} more records</div>`
      : ''
    const logo = pdfLogoHTML(branding, 28)
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${branding.brandColor};padding-bottom:8px;margin-bottom:10px">${logo}<div><div style="font-size:14px;font-weight:700;color:${branding.brandColor}">${branding.schoolName}</div><div style="font-size:9px;color:#666">${branding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${branding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>${overflowNote}</div>`
  }, [filtered, pdfColumns, bn, buildPdfRow])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[0.8125rem] text-[var(--text-secondary)] hidden sm:inline">
            {bn ? `${filtered.length} জন ছাত্র বরাদ্দ` : `${filtered.length} students assigned`}
          </span>
          {filtered.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--brand)]/8 text-[var(--brand)] text-[0.75rem] font-semibold whitespace-nowrap">
              {bn ? 'মোট ভাড়া' : 'Total'}: ৳{bn ? toBnNum(totalRent) : totalRent.toLocaleString()}
            </span>
          )}
          <button onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium border transition-colors cursor-pointer ${showFilters || filterRoom ? 'bg-[var(--brand)]/5 text-[var(--brand)] border-[var(--brand)]/20' : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]'}`}>
            <Filter size={14} />
            {bn ? 'ফিল্টার' : 'Filters'}
            {filterRoom && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />}
          </button>
          {filterRoom && (
            <button onClick={() => { setFilterRoom(''); setPage(1) }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer">
              <X size={12} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer">
                <MoreVertical size={14} />
                {bn ? 'অ্যাকশন' : 'Action'}
                <ChevronDown size={12} />
              </button>
              {showActionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                  <div ref={actionMenuRef}
                    className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-50 overflow-hidden">
                    <button onClick={() => { exportExcel(); setShowActionMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors">
                      <FileSpreadsheet size={14} className="text-[var(--green)]" />
                      {bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
                    </button>
                    <div className="h-px bg-[var(--border)] mx-2" />
                    <button onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors">
                      <FileText size={14} className="text-[var(--red)]" />
                      {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90"
          >
            <UserPlus size={15} />
            {bn ? 'ছাত্র যোগ' : 'Assign'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <select value={filterRoom} onChange={(e) => { setFilterRoom(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--text-muted)] transition-colors cursor-pointer">
            <option value="">{bn ? 'সব রুম' : 'All Rooms'}</option>
            {rooms.filter((r) => r.isActive).map((r) => (
              <option key={r.id} value={r.id}>{r.roomNumber} — {bn ? r.nameBn : r.name}</option>
            ))}
          </select>
          {filterRoom && (
            <button onClick={() => { setFilterRoom(''); setPage(1) }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer">
              <X size={12} />{bn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Users size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো ছাত্র বরাদ্দ করা হয়নি' : 'No students assigned yet'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম ছাত্র বরাদ্দ করুন' : '+ Assign your first student'}
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ছাত্র' : 'Student'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুম' : 'Room'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বেড' : 'Bed'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'মাস' : 'Months'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ভাড়া' : 'Rent'}</th>
                  <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a, i) => (
                  <tr key={a.id}
                    className="border-b border-[var(--border)] last:border-0 transition-colors hover:!bg-[var(--brand)]/5"
                    style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">{(page - 1) * perPage + i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--brand)]/10 text-[var(--brand)] text-[0.75rem] font-bold">
                          {a.student ? (a.student.nameEn || '?')[0] : '?'}
                        </div>
                        <div>
                          <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
                            {a.student ? (bn ? a.student.nameBn : a.student.nameEn) : '—'}
                          </div>
                          <div className="text-[0.6875rem] text-[var(--text-muted)]">{a.studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[0.75rem] font-medium text-[var(--text-secondary)]">
                        {a.student ? `${a.student.class} - ${a.student.section}` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                        <Home size={12} className="text-[var(--text-muted)] shrink-0" />
                        {a.room?.roomNumber || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-[0.8125rem] text-[var(--text-secondary)]">
                        <BedDouble size={12} className="text-[var(--text-muted)]" />
                        {a.bedNumber || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                          {(() => {
                            const mArr = a.months || []
                            if (mArr.length === 0) return bn ? 'কোনো মাস নির্বাচিত হয়নি' : 'No months'
                            return bn ? `${toBnNum(mArr.length)} মাস` : `${mArr.length} ${mArr.length === 1 ? 'mo' : 'mos'}`
                          })()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.625rem] font-medium whitespace-nowrap ${
                          !a.isActive || a.academicYear !== currentSession
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-[var(--green-light)] text-[var(--green)]'
                        }`}>
                          <CalendarDays size={9} />
                          {!a.isActive || a.academicYear !== currentSession
                            ? (bn ? `নিষ্ক্রিয় ${a.academicYear}` : `Inactive ${a.academicYear}`)
                            : (() => {
                                const mArr = a.months || []
                                if (mArr.length === 0) return a.academicYear || '—'
                                const first = bn ? MONTH_NAMES_BN[mArr[0]].slice(0, 3) : MONTH_NAMES[mArr[0]].slice(0, 3)
                                const last = bn ? MONTH_NAMES_BN[mArr[mArr.length - 1]].slice(0, 3) : MONTH_NAMES[mArr[mArr.length - 1]].slice(0, 3)
                                return mArr.length === 1 ? first : `${first}–${last}`
                              })()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        ৳{bn ? toBnNum(a.monthlyRent) : a.monthlyRent}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setEditItem(a); setShowModal(true) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(a.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            total={filtered.length}
            totalPages={totalPages}
            isBn={bn}
          />
        </>
      )}

      {showModal && <AssignmentModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null); setPage(1) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}

      {deleteId && (
        <DeleteConfirmDialog
          title={bn ? 'বরাদ্দ মুছে ফেলুন?' : 'Delete Assignment?'}
          message={bn ? 'এই ছাত্রের হোস্টেল বরাদ্দ মুছে ফেলা হবে।' : "This student's hostel assignment will be removed."}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isBn={bn}
        />
      )}

      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle={bn ? 'হোস্টেল ছাত্র' : 'Hostel Students'}
          defaultTitleBn="হোস্টেল ছাত্র"
          recordLabel={bn ? 'ছাত্র' : 'Student'}
          recordLabelBn="ছাত্র"
          count={filtered.length}
          previewRenderer={pdfPreviewRenderer}
          onClose={() => setShowPdfModal(false)}
          onDownload={handlePdfDownload}
          isBn={bn}
        />
      )}
    </div>
  )
}
