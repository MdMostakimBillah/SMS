import { useState, useMemo, useCallback } from 'react'
import React from 'react'
import { Search, DollarSign, Users, Filter, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import { inputCls, selectCls } from '@/lib/styles'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

type SortMode = 'default' | 'due-desc' | 'due-asc'
type FilterStatus = 'all' | 'paid' | 'due'

export const InactiveDuesTab = React.memo(function InactiveDuesTab() {
  const bn = useBn()
  const { canPrint } = usePermission()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const { structures, payments, waiverEntries, calculateDues } = useFeeStore()
  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [sortBy, setSortBy] = useState<SortMode>('default')
  const [fStatus, setFStatus] = useState<FilterStatus>('all')
  const [showPdfModal, setShowPdfModal] = useState(false)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const inactiveStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active === false), [students])

  const dues = useMemo(() => calculateDues(inactiveStudents, fClass || undefined, fSection || undefined, true), [inactiveStudents, fClass, fSection, structures, payments, waiverEntries])

  const filteredDues = useMemo(() => {
    let list = dues
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((d) => d.studentName.toLowerCase().includes(q) || d.roll.includes(q) || d.feeName.toLowerCase().includes(q) || d.studentNameBn.includes(q))
    }
    if (fStatus === 'paid') list = list.filter((d) => d.dueAmount === 0)
    else if (fStatus === 'due') list = list.filter((d) => d.dueAmount > 0)
    if (sortBy === 'due-desc') list = [...list].sort((a, b) => b.dueAmount - a.dueAmount)
    else if (sortBy === 'due-asc') list = [...list].sort((a, b) => a.dueAmount - b.dueAmount)
    return list
  }, [dues, search, fStatus, sortBy])

  const totalDue = useMemo(() => dues.reduce((sum, d) => sum + d.dueAmount, 0), [dues])
  const studentCount = useMemo(() => new Set(dues.map((d) => d.studentId)).size, [dues])

  const fmt = (n: number) => n.toLocaleString()

  const pdfColumns = useMemo<PDFColumnDef[]>(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'student', label: 'Student', labelBn: 'শিক্ষার্থী', default: true },
    { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
    { key: 'fee', label: 'Fee', labelBn: 'ফি', default: true },
    { key: 'total', label: 'Total', labelBn: 'মোট', default: true },
    { key: 'paid', label: 'Paid', labelBn: 'পরিশোধিত', default: true },
    { key: 'due', label: 'Due', labelBn: 'বকেয়', default: true },
    { key: 'reason', label: 'Reason', labelBn: 'কারণ', default: true },
  ], [])

  const buildPdfRow = useCallback((d: typeof filteredDues[0], selectedCols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (selectedCols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (selectedCols.includes('student')) row[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? d.studentNameBn || d.studentName : d.studentName
    if (selectedCols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = `${d.class}${d.section ? `-${d.section}` : ''}`
    if (selectedCols.includes('fee')) row[bn ? 'ফি' : 'Fee'] = bn ? d.feeNameBn || d.feeName : d.feeName
    if (selectedCols.includes('total')) row[bn ? 'মোট' : 'Total'] = d.totalAmount
    if (selectedCols.includes('paid')) row[bn ? 'পরিশোধিত' : 'Paid'] = d.paidAmount
    if (selectedCols.includes('due')) row[bn ? 'বকেয়' : 'Due'] = d.dueAmount
    if (selectedCols.includes('reason')) row[bn ? 'কারণ' : 'Reason'] = d.inactiveReason || '-'
    return row
  }, [bn])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = filteredDues.map((d, i) => buildPdfRow(d, opts.selectedCols, i))
    const totalPaid = filteredDues.reduce((s, d) => s + d.paidAmount, 0)
    const totalAmount = filteredDues.reduce((s, d) => s + d.totalAmount, 0)
    const totalDueSum = filteredDues.reduce((s, d) => s + d.dueAmount, 0)
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('student')) summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = ''
    if (opts.selectedCols.includes('fee')) summaryRow[bn ? 'ফি' : 'Fee'] = ''
    if (opts.selectedCols.includes('total')) summaryRow[bn ? 'মোট' : 'Total'] = totalAmount
    if (opts.selectedCols.includes('paid')) summaryRow[bn ? 'পরিশোধিত' : 'Paid'] = totalPaid
    if (opts.selectedCols.includes('due')) summaryRow[bn ? 'বকেয়' : 'Due'] = totalDueSum
    if (opts.selectedCols.includes('reason')) summaryRow[bn ? 'কারণ' : 'Reason'] = ''
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}`
    const headers = opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${i === rows.length - 1 ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); const h = col ? (opts.isBn ? col.labelBn : col.label) : c; return `<td>${r[h] ?? ''}</td>` }).join('')}</tr>`).join('')}</tbody></table><div class="ftr">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`
    openPrintWindow(opts.title, bodyHTML, { css })
  }, [filteredDues, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = filteredDues.map((d, i) => buildPdfRow(d, opts.selectedCols, i))
    const totalPaid = filteredDues.reduce((s, d) => s + d.paidAmount, 0)
    const totalAmount = filteredDues.reduce((s, d) => s + d.totalAmount, 0)
    const totalDueSum = filteredDues.reduce((s, d) => s + d.dueAmount, 0)
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('student')) summaryRow[bn ? 'শিক্ষার্থী' : 'Student'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = ''
    if (opts.selectedCols.includes('fee')) summaryRow[bn ? 'ফি' : 'Fee'] = ''
    if (opts.selectedCols.includes('total')) summaryRow[bn ? 'মোট' : 'Total'] = totalAmount
    if (opts.selectedCols.includes('paid')) summaryRow[bn ? 'পরিশোধিত' : 'Paid'] = totalPaid
    if (opts.selectedCols.includes('due')) summaryRow[bn ? 'বকেয়' : 'Due'] = totalDueSum
    if (opts.selectedCols.includes('reason')) summaryRow[bn ? 'কারণ' : 'Reason'] = ''
    rows.push(summaryRow)
    const pdfBranding = getPDFBranding()
    const headers = opts.selectedCols.map((c) => {
      const col = pdfColumns.find((p) => p.key === c)
      return col ? (opts.isBn ? col.labelBn : col.label) : c
    })
    const totalRowIdx = rows.length - 1
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:8px;margin-bottom:10px">
        ${pdfLogoHTML(pdfBranding, 28)}
        <div><div style="font-size:14px;font-weight:700;color:${pdfBranding.brandColor}">${pdfBranding.schoolName}</div>
        <div style="font-size:9px;color:#666">${pdfBranding.address}</div></div>
      </div>
      <div style="font-size:12px;font-weight:700;color:${pdfBranding.brandColor};margin-bottom:8px">${opts.title}</div>
      <table style="width:100%;border-collapse:collapse;font-size:9px">
        <thead><tr>${headers.map((h) => `<th style="background:${pdfBranding.brandColor};color:#fff;padding:4px 6px;text-align:center;font-weight:600">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.slice(0, 20).map((r, i) => `<tr${i === totalRowIdx ? ' style="font-weight:700;border-top:2px solid #333;background:#f0f0f0"' : ''}>${headers.map((h) => `<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}
        ${rows.length > 21 ? `<tr><td colspan="${headers.length}" style="padding:4px;text-align:center;color:#999;font-style:italic">... ${rows.length - 21} more rows</td></tr>` : ''}
        </tbody>
      </table>
    </div>`
  }, [filteredDues, pdfColumns, bn, buildPdfRow])

  const hasFilter = sortBy !== 'default' || fStatus !== 'all' || fClass || fSection || search

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-[0.625rem] mb-4">
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-light)' }}>
            <DollarSign size={15} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(totalDue)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'মোট বকেয়' : 'Total Due'}</div>
          </div>
        </div>
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-light)' }}>
            <Users size={15} style={{ color: 'var(--amber)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{String(studentCount)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'নিষ্ক্রিয় শিক্ষার্থী' : 'Inactive Students'}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={bn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9 h-8 text-xs`}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={11} className="text-[var(--text-muted)]" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortMode)} className={`${selectCls} h-7 text-[0.65rem] px-2`}>
            <option value="default">{bn ? 'সব' : 'All'}</option>
            <option value="due-desc">{bn ? 'বকেয়: বেশি → কম' : 'Due: Max → Min'}</option>
            <option value="due-asc">{bn ? 'বকেয়: কম → বেশি' : 'Due: Min → Max'}</option>
          </select>
        </div>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value as FilterStatus)} className={`${selectCls} h-7 text-[0.65rem] px-2`}>
          <option value="all">{bn ? 'সব' : 'All'}</option>
          <option value="paid">{bn ? 'পরিশোধিত' : 'Paid'}</option>
          <option value="due">{bn ? 'বকেয়' : 'Due'}</option>
        </select>
        <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection('') }} className={`${selectCls} h-7 text-[0.65rem] px-2`}>
          <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {fClass && (
          <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={`${selectCls} h-7 text-[0.65rem] px-2`}>
            <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {hasFilter && (
          <button onClick={() => { setSearch(''); setFClass(''); setFSection(''); setSortBy('default'); setFStatus('all') }} className="px-2 py-1 rounded-lg text-[0.65rem] font-medium bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)]/20 cursor-pointer transition-all hover:bg-[var(--red)]/20">
            {bn ? 'মুছুন' : 'Clear'}
          </button>
        )}
        <div className="flex-1" />
        {filteredDues.length > 0 && canPrint('finance.fees.dues.print') && (
          <button onClick={() => setShowPdfModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--red)] hover:text-[var(--red)] cursor-pointer transition-all">
            <FileText size={13} />
            {bn ? 'পিডিএফ' : 'PDF'}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        {filteredDues.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {bn ? 'নিষ্ক্রিয় শিক্ষার্থীদের কোনো বকেয় নেই' : 'No dues for inactive students'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মোট' : 'Total'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিশোধিত' : 'Paid'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'বকেয়' : 'Due'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কারণ' : 'Reason'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((d, i) => (
                  <tr key={`${d.studentId}-${d.feeStructureId}-${i}`} className="border-t border-[var(--border)] opacity-70 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-medium text-[var(--text-primary)]">{bn ? d.studentNameBn || d.studentName : d.studentName}</p>
                      <p className="text-[0.65rem] text-[var(--text-muted)]">Roll: {d.roll}</p>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{d.class} - {d.section}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{bn ? d.feeNameBn || d.feeName : d.feeName}</td>
                    <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{fmt(d.totalAmount)}</td>
                    <td className="px-3 py-2 text-right text-[var(--green)]">{fmt(d.paidAmount)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[var(--red)]">{fmt(d.dueAmount)}</td>
                    <td className="px-3 py-2">
                      <span className="text-[0.65rem] text-[var(--red)] bg-[var(--red-light)] px-1.5 py-0.5 rounded">{d.inactiveReason || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Options Modal */}
      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Inactive Dues"
          defaultTitleBn="নিষ্ক্রিয় বকেয়"
          recordLabel="record"
          recordLabelBn="টি রেকর্ড"
          count={filteredDues.length}
          isBn={bn}
          showColumns={true}
          previewRenderer={pdfPreviewRenderer}
          onClose={() => setShowPdfModal(false)}
          onDownload={handlePdfDownload}
        />
      )}
    </div>
  )
})
