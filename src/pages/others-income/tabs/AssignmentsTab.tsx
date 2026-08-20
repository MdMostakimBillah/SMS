import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Pencil, Trash2, Plus, MoreVertical, FileSpreadsheet, FileText, Eye } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useOthersIncomeStore, type OthersIncomeAssignment } from '@/store/othersIncomeStore'
import { useSessionStudents } from '@/store/admissionStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { AssignmentModal } from '../modals/AssignmentModal'
import { toBnNum } from '@/lib/i18n'
import { MONTH_NAMES, MONTH_NAMES_BN } from '@/store/transportStore'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import ModernCheckbox from '@/components/ui/ModernCheckbox'

interface Props {
  searchQuery: string
}

export const AssignmentsTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { categories, assignments, deleteAssignment, toggleAssignmentActive } = useOthersIncomeStore()
  const students = useSessionStudents()

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<OthersIncomeAssignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const enriched = useMemo(() => {
    return assignments.map((a) => {
      const student = students.find((s) => s.id === a.studentId)
      const cat = categories.find((c) => c.id === a.categoryId)
      return {
        ...a,
        studentName: student ? (bn ? student.nameBn : student.nameEn) : a.studentId,
        studentNameBn: student?.nameBn || a.studentId,
        studentNameEn: student?.nameEn || a.studentId,
        className: student?.class || '',
        section: student?.section || '',
        categoryName: cat ? (bn ? cat.nameBn : cat.name) : '—',
        categoryNameBn: cat?.nameBn || '—',
        amount: cat?.amount || 0,
        type: cat?.type || 'monthly',
        monthLabels: a.months.map((m) => bn ? MONTH_NAMES_BN[m] : MONTH_NAMES[m]),
      }
    })
  }, [assignments, students, categories, bn])

  const filtered = useMemo(() => {
    let list = enriched
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) => a.studentName.toLowerCase().includes(q) || a.studentNameBn.includes(q) || a.studentNameEn.toLowerCase().includes(q) || a.categoryName.toLowerCase().includes(q) || a.categoryNameBn.includes(q)
      )
    }
    return list
  }, [enriched, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [searchQuery, perPage])

  useEffect(() => { setSelected(new Set()) }, [searchQuery, perPage])

  useEffect(() => {
    if (selected.size === 0) return
    const validIds = new Set(paginated.map((a) => a.id))
    setSelected((prev) => {
      const next = new Set<string>()
      for (const id of prev) { if (validIds.has(id)) next.add(id) }
      return next.size === prev.size ? prev : next
    })
  }, [paginated])

  const toggleAll = useCallback(() => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map((a) => a.id)))
    }
  }, [selected.size, paginated])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const handleExportExcel = () => {
    const data = selected.size > 0 ? filtered.filter((a) => selected.has(a.id)) : filtered
    const rows = data.map((a) => ({
      [bn ? 'ছাত্র' : 'Student']: bn ? a.studentNameBn : a.studentNameEn,
      [bn ? 'ক্যাটাগরি' : 'Category']: a.categoryName,
      [bn ? 'পরিমাণ' : 'Amount']: a.amount,
      [bn ? 'ধরন' : 'Type']: a.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'),
      [bn ? 'মাস' : 'Months']: a.monthLabels.join(', '),
      [bn ? 'স্ট্যাটাস' : 'Status']: a.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, bn ? 'অন্যান্য আয় বরাদ্দ' : 'Others Income Assignments')
    XLSX.writeFile(wb, `others-income-assignments-${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowActionMenu(false)
  }

  const pdfColumns: PDFColumnDef[] = useMemo(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'student', label: 'Student', labelBn: 'ছাত্র', default: true },
    { key: 'category', label: 'Category', labelBn: 'ক্যাটাগরি', default: true },
    { key: 'amount', label: 'Amount', labelBn: 'পরিমাণ', default: true },
    { key: 'type', label: 'Type', labelBn: 'ধরন', default: true },
    { key: 'months', label: 'Months', labelBn: 'মাস', default: true },
  ], [])

  const buildPdfRow = useCallback((a: (typeof filtered)[number], cols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (cols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (cols.includes('student')) row[bn ? 'ছাত্র' : 'Student'] = bn ? a.studentNameBn : a.studentNameEn
    if (cols.includes('category')) row[bn ? 'ক্যাটাগরি' : 'Category'] = a.categoryName
    if (cols.includes('amount')) row[bn ? 'পরিমাণ' : 'Amount'] = a.amount
    if (cols.includes('type')) row[bn ? 'ধরন' : 'Type'] = a.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')
    if (cols.includes('months')) row[bn ? 'মাস' : 'Months'] = a.type === 'monthly' ? a.monthLabels.join(', ') : '—'
    return row
  }, [bn])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = selected.size > 0 ? filtered.filter((a) => selected.has(a.id)) : filtered
    const rows = data.map((a, i) => buildPdfRow(a, opts.selectedCols, i))
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyRows = rows.map((r) => {
      const cells = headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    const headerCells = headers.map((h) => `<th>${h}</th>`).join('')
    const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><div class="ftr">Generated: ${genDate}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filtered, selected, pdfColumns, bn, buildPdfRow])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <span className="text-[11px] text-[var(--brand)] font-medium">{bn ? `${toBnNum(selected.size)} টি নির্বাচিত` : `${selected.size} selected`}</span>
          )}
          <span className="text-[12px] text-[var(--text-secondary)]">
            {bn ? `মোট: ${toBnNum(filtered.length)}টি বরাদ্দ` : `Total: ${filtered.length} assignments`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={actionMenuRef}>
            <button onClick={() => setShowActionMenu(!showActionMenu)}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] font-medium text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--border)] transition-colors">
              {bn ? 'একশন' : 'Actions'} <MoreVertical size={12} />
            </button>
            {showActionMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg py-1">
                <button onClick={handleExportExcel} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer border-none bg-transparent">
                  <FileSpreadsheet size={13} className="text-[var(--green)]" /> {bn ? 'এক্সেল' : 'Excel'}
                </button>
                <button onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer border-none bg-transparent">
                  <FileText size={13} className="text-[var(--red)]" /> PDF
                </button>
              </div>
            )}
          </div>
          <button onClick={() => { setEditItem(null); setShowModal(true) }}
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-medium border-none cursor-pointer hover:opacity-90 transition-opacity">
            <Plus size={13} /> {bn ? 'বরাদ্দ করুন' : 'Assign'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2.5 pl-3 pr-2">
                  <ModernCheckbox checked={selected.size === paginated.length && paginated.length > 0} onChange={toggleAll} />
                </th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'ধরন' : 'Type'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'মাস' : 'Months'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো বরাদ্দ পাওয়া যায়নি' : 'No assignments found'}</td></tr>
              ) : paginated.map((a) => (
                <tr key={a.id} className={`border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface)] ${selected.has(a.id) ? 'bg-[var(--brand)]/5' : ''}`}>
                  <td className="py-2.5 pl-3 pr-2">
                    <ModernCheckbox checked={selected.has(a.id)} onChange={() => {
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (next.has(a.id)) next.delete(a.id)
                        else next.add(a.id)
                        return next
                      })
                    }} />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{ background: 'var(--brand)' }}>
                        {a.studentNameEn?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-[var(--text-primary)]">{bn ? a.studentNameBn : a.studentNameEn}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{a.className}{a.section ? ` - ${a.section}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-[var(--text-primary)]">{a.categoryName}</td>
                  <td className="py-2.5 px-3 text-center text-[12px] font-bold text-[var(--brand)]">{fmt(a.amount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${a.type === 'monthly' ? 'bg-[var(--teal-light)] text-[var(--teal)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                      {a.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {a.type === 'monthly' ? (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {a.monthLabels.slice(0, 3).map((m, i) => (
                          <span key={i} className="text-[8px] px-1 py-px rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">{m}</span>
                        ))}
                        {a.monthLabels.length > 3 && <span className="text-[8px] px-1 py-px rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">+{a.monthLabels.length - 3}</span>}
                      </div>
                    ) : <span className="text-[10px] text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${a.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                      {a.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={() => { setEditItem(assignments.find((x) => x.id === a.id) || null); setShowModal(true) }} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => toggleAssignmentActive(a.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors" title={a.isActive ? (bn ? 'নিষ্ক্রিয়' : 'Deactivate') : (bn ? 'সক্রিয়' : 'Activate')}>
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setDeleteId(a.id)} className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} total={filtered.length} totalPages={totalPages} />

      {showModal && <AssignmentModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
      {deleteId && <DeleteConfirmDialog title={bn ? 'বরাদ্দ মুছে ফেলুন?' : 'Delete assignment?'} message={bn ? 'এই বরাদ্দটি স্থায়ীভাবে মুছে ফেলা হবে।' : 'This assignment will be permanently deleted.'} onConfirm={() => { deleteAssignment(deleteId); setDeleteId(null) }} onCancel={() => setDeleteId(null)} isBn={bn} />}
      {showPdfModal && <GenericPDFOptionsModal columns={pdfColumns} defaultTitle={bn ? 'অন্যান্য আয় বরাদ্দ' : 'Others Income Assignments'} defaultTitleBn="অন্যান্য আয় বরাদ্দ" recordLabel={bn ? 'বরাদ্দ' : 'assignment'} recordLabelBn="বরাদ্দ" count={selected.size > 0 ? selected.size : filtered.length} isBn={bn} onDownload={(opts: GenericPDFOptionsResult) => { setShowPdfModal(false); handlePdfDownload(opts) }} onClose={() => setShowPdfModal(false)} />}
    </div>
  )
}
