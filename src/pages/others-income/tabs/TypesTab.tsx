import { useState, useMemo, useRef, useEffect } from 'react'
import { Pencil, Trash2, Plus, MoreVertical, Tag, FileSpreadsheet, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useOthersIncomeStore, type OthersIncomeCategory } from '@/store/othersIncomeStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { CategoryModal } from '../modals/CategoryModal'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

interface Props {
  searchQuery: string
}

export const TypesTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const { categories, deleteCategory, toggleCategoryActive } = useOthersIncomeStore()

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<OthersIncomeCategory | null>(null)
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

  const filtered = useMemo(() => {
    let list = categories
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.nameBn.includes(q))
    }
    return list
  }, [categories, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [searchQuery, perPage])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const handleExportExcel = () => {
    XLSX.export(`others-income-categories`, filtered.map((c) => ({
      [bn ? 'নাম' : 'Name']: bn ? c.nameBn : c.name,
      [bn ? 'পরিমাণ' : 'Amount']: c.amount,
      [bn ? 'ধরন' : 'Type']: c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'),
      [bn ? 'মোট মাস' : 'Total Months']: c.totalMonths || '—',
      [bn ? 'স্ট্যাটাস' : 'Status']: c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive'),
    })))
    setShowActionMenu(false)
  }

  const handlePdfExport = (opts: GenericPDFOptionsResult) => {
    setShowPdfModal(false)
    const b = getPDFBranding()
    const cols: PDFColumnDef[] = [
      { header: '#', field: '_idx', align: 'center', width: 8 },
      { header: bn ? 'নাম' : 'Name', field: 'name', align: 'left', width: 40 },
      { header: bn ? 'পরিমাণ' : 'Amount', field: 'amount', align: 'center', width: 18 },
      { header: bn ? 'ধরন' : 'Type', field: 'type', align: 'center', width: 18 },
      { header: bn ? 'মোট মাস' : 'Months', field: 'totalMonths', align: 'center', width: 16 },
    ]
    const rows = filtered.map((c, i) => ({
      _idx: i + 1,
      name: bn ? c.nameBn : c.name,
      amount: fmt(c.amount),
      type: c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time'),
      totalMonths: c.totalMonths || '—',
    }))
    openPrintWindow({
      title: bn ? 'অন্যান্য আয়ের ক্যাটাগরি' : 'Others Income Categories',
      html: `
        ${pdfLogoHTML(b)}
        <div style="text-align:center;margin-bottom:12px;font-size:16px;font-weight:700">${bn ? 'অন্যান্য আয়ের ক্যাটাগরি' : 'Others Income Categories'}</div>
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
          {bn ? `মোট: ${toBnNum(filtered.length)}টি ক্যাটাগরি` : `Total: ${filtered.length} categories`}
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
            <Plus size={13} /> {bn ? 'নতুন ক্যাটাগরি' : 'Add Category'}
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
                <th className="text-left px-4 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'নাম' : 'Name'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'পরিমাণ' : 'Amount'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'ধরন' : 'Type'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'মোট মাস' : 'Months'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="text-center px-3 py-3 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10 w-[8%]"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No categories found'}</td></tr>
              ) : paginated.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="text-center pl-3 pr-2 py-3"><input type="checkbox" className="accent-[var(--brand)] w-3.5 h-3.5 cursor-pointer" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand)18', color: 'var(--brand)' }}>
                        <Tag size={13} />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-[var(--text-primary)]">{bn ? c.nameBn : c.name}</div>
                        {c.description && <div className="text-[10px] text-[var(--text-muted)]">{bn ? c.descriptionBn : c.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-3 text-[12px] font-bold text-[var(--brand)]">{fmt(c.amount)}</td>
                  <td className="text-center px-3 py-3">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${c.type === 'monthly' ? 'bg-[var(--teal-light)] text-[var(--teal)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                      {c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3 text-[12px] text-[var(--text-primary)]">{c.totalMonths || '—'}</td>
                  <td className="text-center px-3 py-3">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${c.isActive ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
                      {c.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditItem(c); setShowModal(true) }} className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => toggleCategoryActive(c.id)} className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--amber)] transition-colors">
                        <span className="text-[10px] font-bold">{c.isActive ? 'ON' : 'OFF'}</span>
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="w-7 h-7 rounded-md flex items-center justify-center border-none cursor-pointer bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--red)] transition-colors">
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

      {showModal && <CategoryModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}
      {deleteId && <DeleteConfirmDialog onConfirm={() => { deleteCategory(deleteId); setDeleteId(null) }} onClose={() => setDeleteId(null)} />}
      {showPdfModal && <GenericPDFOptionsModal onExport={handlePdfExport} onClose={() => setShowPdfModal(false)} />}
    </div>
  )
}
