import { useState, useMemo, useRef, useEffect } from 'react'
import { Pencil, Trash2, Plus, MoreVertical, Users, FileSpreadsheet, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useOthersIncomeStore, type OthersIncomeAssignment } from '@/store/othersIncomeStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
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

interface Props {
  searchQuery: string
}

export const AssignmentsTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { categories, assignments, deleteAssignment, toggleAssignmentActive } = useOthersIncomeStore()
  const students = useSessionStudents()
  const sessions = useClassStore((s) => s.institution.sessions) || []
  const currentSession = useClassStore((s) => s.institution.currentSession) || '2025-26'

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<OthersIncomeAssignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
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

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const handleExportExcel = () => {
    XLSX.export(`others-income-assignments`, filtered.map((a) => ({
      [bn ? 'ছাত্র' : 'Student']: bn ? a.studentNameBn : a.studentNameEn,
      [bn ? 'ক্যাটাগরি' : 'Category']: a.categoryName,
      [bn ? 'পরিমাণ' : 'Amount']: a.amount,
      [bn ? 'ধরন' : 'Type']: a.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'),
      [bn ? 'মাস' : 'Months']: a.monthLabels.join(', '),
      [bn ? 'স্ট্যাটাস' : 'Status']: a.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'),
    })))
    setShowActionMenu(false)
  }

  const handlePdfExport = (opts: GenericPDFOptionsResult) => {
    setShowPdfModal(false)
    const b = getPDFBranding()
    const cols: PDFColumnDef[] = [
      { header: '#', field: '_idx', align: 'center', width: 8 },
      { header: bn ? 'ছাত্র' : 'Student', field: 'studentName', align: 'left', width: 30 },
      { header: bn ? 'ক্যাটাগরি' : 'Category', field: 'categoryName', align: 'left', width: 22 },
      { header: bn ? 'পরিমাণ' : 'Amount', field: 'amount', align: 'center', width: 16 },
      { header: bn ? 'ধরন' : 'Type', field: 'type', align: 'center', width: 16 },
      { header: bn ? 'মাস' : 'Months', field: 'monthLabels', align: 'left', width: 30 },
    ]
    const rows = filtered.map((a, i) => ({
      _idx: i + 1,
      studentName: bn ? a.studentNameBn : a.studentNameEn,
      categoryName: a.categoryName,
      amount: fmt(a.amount),
      type: a.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'),
      monthLabels: a.type === 'monthly' ? a.monthLabels.join(', ') : '—',
    }))
    openPrintWindow({
      title: bn ? 'অন্যান্য আয় বরাদ্দ' : 'Others Income Assignments',
      html: `
        ${pdfLogoHTML(b)}
        <div style="text-align:center;margin-bottom:12px;font-size:16px;font-weight:700">${bn ? 'অন্যান্য আয় বরাদ্দ' : 'Others Income Assignments'}</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr>${cols.map((c) => `<th style="border:1px solid #333;padding:4px 6px;text-align:${c.align};background:${b.brandColor};color:#fff">${c.header}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td style="border:1px solid #ddd;padding:3px 6px;text-align:${c.align}">${r[c.field as keyof typeof r] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      `,
      opts,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--text-secondary)]">
          {bn ? `মোট: ${toBnNum(filtered.length)}টি বরাদ্দ` : `Total: ${filtered.length} assignments`}
        </span>
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
                <th className="text-center pl-3 pr-2 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[5%]">
                  <input type="checkbox" className="accent-[var(--brand)] w-3.5 h-3.5 cursor-pointer" />
                </th>
                <th className="text-left px-4 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'ছাত্র' : 'Student'}</th>
                <th className="text-left px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'ধরন' : 'Type'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'মাস' : 'Months'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[8%]"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো বরাদ্দ পাওয়া যায়নি' : 'No assignments found'}</td></tr>
              ) : paginated.map((a) => (
                <tr key={a.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="text-center pl-3 pr-2 py-3"><input type="checkbox" className="accent-[var(--brand)] w-3.5 h-3.5 cursor-pointer" /></td>
                  <td className="px-4 py-3">
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
                  <td className="px-3 py-3 text-[12px] text-[var(--text-primary)]">{a.categoryName}</td>
                  <td className="text-center px-3 py-3 text-[12px] font-bold text-[var(--brand)]">{fmt(a.amount)}</td>
                  <td className="text-center px-3 py-3">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${a.type === 'monthly' ? 'bg-[var(--teal-light)] text-[var(--teal)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                      {a.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    {a.type === 'monthly' ? (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {a.monthLabels.slice(0, 3).map((m, i) => (
                          <span key={i} className="text-[8px] px-1 py-px rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">{m}</span>
                        ))}
                        {a.monthLabels.length > 3 && <span className="text-[8px] px-1 py-px rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">+{a.monthLabels.length - 3}</span>}
                      </div>
                    ) : <span className="text-[10px] text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${a.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                      {a.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditItem(assignments.find((x) => x.id === a.id) || null); setShowModal(true) }} className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => toggleAssignmentActive(a.id)} className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--amber)] transition-colors">
                        <span className="text-[10px] font-bold">{a.isActive ? 'ON' : 'OFF'}</span>
                      </button>
                      <button onClick={() => setDeleteId(a.id)} className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--red)] transition-colors">
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
      {deleteId && <DeleteConfirmDialog onConfirm={() => { deleteAssignment(deleteId); setDeleteId(null) }} onClose={() => setDeleteId(null)} />}
      {showPdfModal && <GenericPDFOptionsModal onExport={handlePdfExport} onClose={() => setShowPdfModal(false)} />}
    </div>
  )
}
