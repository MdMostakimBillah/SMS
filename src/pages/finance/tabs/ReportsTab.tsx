import { useMemo, useState, useCallback } from 'react'
import React from 'react'
import { DollarSign, TrendingUp, AlertTriangle, Users, BarChart3, Gift, Filter, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import { inputCls } from '@/lib/styles'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'

type SortMode = 'default' | 'col-asc' | 'col-desc' | 'pend-asc' | 'pend-desc'

interface ClassRow {
  className: string
  section: string
  totalDue: number
  totalPaid: number
  studentCount: number
  pending: number
  pct: number
}

export const ReportsTab = React.memo(function ReportsTab() {
  const bn = useBn()
  const { canPrint } = usePermission()
  const students = useSessionStudents()
  const { structures, getCollectionSummary, getClassWiseSummary } = useFeeStore()

  const [sortBy, setSortBy] = useState<SortMode>('default')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [showPdfModal, setShowPdfModal] = useState(false)

  const summary = useMemo(() => getCollectionSummary(students), [structures, students])
  const classSummary = useMemo(() => getClassWiseSummary(students), [students, structures])

  const classNames = useMemo(() => [...new Set(classSummary.map((c) => c.className))].sort(), [classSummary])
  const sections = useMemo(() => {
    const filtered = fClass ? classSummary.filter((c) => c.className === fClass) : classSummary
    return [...new Set(filtered.map((c) => c.section).filter(Boolean))].sort()
  }, [classSummary, fClass])

  const sortedSummary = useMemo(() => {
    let list = classSummary.map((c) => {
      const pending = c.totalDue - c.totalPaid
      const pct = c.totalDue > 0 ? Math.round((c.totalPaid / c.totalDue) * 100) : 0
      return { ...c, pending, pct }
    })
    if (fClass) list = list.filter((c) => c.className === fClass)
    if (fSection) list = list.filter((c) => c.section === fSection)
    if (sortBy === 'col-asc') list.sort((a, b) => a.totalPaid - b.totalPaid)
    else if (sortBy === 'col-desc') list.sort((a, b) => b.totalPaid - a.totalPaid)
    else if (sortBy === 'pend-asc') list.sort((a, b) => a.pending - b.pending)
    else if (sortBy === 'pend-desc') list.sort((a, b) => b.pending - a.pending)
    else list.sort((a, b) => a.className.localeCompare(b.className) || a.section.localeCompare(b.section))
    return list
  }, [classSummary, fClass, fSection, sortBy])

  const fmt = (n: number) => n.toLocaleString()

  const pdfColumns = useMemo<PDFColumnDef[]>(() => [
    { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
    { key: 'class', label: 'Class', labelBn: 'শ্রেণি', default: true },
    { key: 'section', label: 'Section', labelBn: 'শাখা', default: true },
    { key: 'students', label: 'Students', labelBn: 'শিক্ষার্থী', default: true },
    { key: 'totalFee', label: 'Total Fee', labelBn: 'মোট ফি', default: true },
    { key: 'collected', label: 'Collected', labelBn: 'সংগৃহীত', default: true },
    { key: 'pending', label: 'Pending', labelBn: 'বকেয়', default: true },
    { key: 'pct', label: 'Collection %', labelBn: 'সংগ্রহ হার', default: true },
  ], [])

  const buildPdfRow = useCallback((c: ClassRow, selectedCols: string[], idx: number): Record<string, string | number> => {
    const row: Record<string, string | number> = {}
    if (selectedCols.includes('sn')) row[bn ? 'ক্রমিক' : 'S/N'] = idx + 1
    if (selectedCols.includes('class')) row[bn ? 'শ্রেণি' : 'Class'] = c.className
    if (selectedCols.includes('section')) row[bn ? 'শাখা' : 'Section'] = c.section || '—'
    if (selectedCols.includes('students')) row[bn ? 'শিক্ষার্থী' : 'Students'] = c.studentCount
    if (selectedCols.includes('totalFee')) row[bn ? 'মোট ফি' : 'Total Fee'] = c.totalDue
    if (selectedCols.includes('collected')) row[bn ? 'সংগৃহীত' : 'Collected'] = c.totalPaid
    if (selectedCols.includes('pending')) row[bn ? 'বকেয়' : 'Pending'] = c.pending
    if (selectedCols.includes('pct')) row[bn ? 'সংগ্রহ হার' : 'Collection %'] = `${c.pct}%`
    return row
  }, [bn])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const rows = sortedSummary.map((c, i) => buildPdfRow(c, opts.selectedCols, i))
    const totalDue = sortedSummary.reduce((s, c) => s + c.totalDue, 0)
    const totalPaid = sortedSummary.reduce((s, c) => s + c.totalPaid, 0)
    const totalPending = sortedSummary.reduce((s, c) => s + c.pending, 0)
    const totalStudents = sortedSummary.reduce((s, c) => s + c.studentCount, 0)
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('section')) summaryRow[bn ? 'শাখা' : 'Section'] = ''
    if (opts.selectedCols.includes('students')) summaryRow[bn ? 'শিক্ষার্থী' : 'Students'] = totalStudents
    if (opts.selectedCols.includes('totalFee')) summaryRow[bn ? 'মোট ফি' : 'Total Fee'] = totalDue
    if (opts.selectedCols.includes('collected')) summaryRow[bn ? 'সংগৃহীত' : 'Collected'] = totalPaid
    if (opts.selectedCols.includes('pending')) summaryRow[bn ? 'বকেয়' : 'Pending'] = totalPending
    if (opts.selectedCols.includes('pct')) summaryRow[bn ? 'সংগ্রহ হার' : 'Collection %'] = totalDue > 0 ? `${Math.round((totalPaid / totalDue) * 100)}%` : '0%'
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
  }, [sortedSummary, pdfColumns, bn, buildPdfRow])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const rows = sortedSummary.map((c, i) => buildPdfRow(c, opts.selectedCols, i))
    const totalDue = sortedSummary.reduce((s, c) => s + c.totalDue, 0)
    const totalPaid = sortedSummary.reduce((s, c) => s + c.totalPaid, 0)
    const totalPending = sortedSummary.reduce((s, c) => s + c.pending, 0)
    const totalStudents = sortedSummary.reduce((s, c) => s + c.studentCount, 0)
    const summaryRow: Record<string, string | number> = {}
    if (opts.selectedCols.includes('sn')) summaryRow[bn ? 'ক্রমিক' : 'S/N'] = ''
    if (opts.selectedCols.includes('class')) summaryRow[bn ? 'শ্রেণি' : 'Class'] = bn ? 'মোট' : 'Total'
    if (opts.selectedCols.includes('section')) summaryRow[bn ? 'শাখা' : 'Section'] = ''
    if (opts.selectedCols.includes('students')) summaryRow[bn ? 'শিক্ষার্থী' : 'Students'] = totalStudents
    if (opts.selectedCols.includes('totalFee')) summaryRow[bn ? 'মোট ফি' : 'Total Fee'] = totalDue
    if (opts.selectedCols.includes('collected')) summaryRow[bn ? 'সংগৃহীত' : 'Collected'] = totalPaid
    if (opts.selectedCols.includes('pending')) summaryRow[bn ? 'বকেয়' : 'Pending'] = totalPending
    if (opts.selectedCols.includes('pct')) summaryRow[bn ? 'সংগ্রহ হার' : 'Collection %'] = totalDue > 0 ? `${Math.round((totalPaid / totalDue) * 100)}%` : '0%'
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
  }, [sortedSummary, pdfColumns, bn, buildPdfRow])

  const stats = [
    { label: bn ? 'মোট সংগ্রহ' : 'Total Collected', value: fmt(summary.totalCollected), icon: DollarSign, bg: 'var(--green-light)', color: 'var(--green)' },
    { label: bn ? 'এই মাসে' : 'This Month', value: fmt(summary.collectedThisMonth), icon: TrendingUp, bg: 'var(--brand-light)', color: 'var(--brand)' },
    { label: bn ? 'অপেক্ষমাণ' : 'Pending', value: fmt(summary.totalPending), icon: AlertTriangle, bg: 'var(--amber-light)', color: 'var(--amber)' },
    { label: bn ? 'অতিক্রান্ত' : 'Overdue', value: fmt(summary.totalOverdue), icon: AlertTriangle, bg: 'var(--red-light)', color: 'var(--red)' },
    { label: bn ? 'মোট ছাড়' : 'Total Waived', value: fmt(summary.totalWaived), icon: Gift, bg: 'var(--purple-light)', color: 'var(--purple)' },
    { label: bn ? 'মোট পেমেন্ট' : 'Total Payments', value: String(summary.paymentCount), icon: BarChart3, bg: 'var(--teal-light)', color: 'var(--teal)' },
  ]

  const hasFilter = sortBy !== 'default' || fClass || fSection

  return (
    <div>
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-[0.625rem] mb-5">
        {stats.map((s, i) => {
          const IconComp = s.icon
          return (
            <div
              key={i}
              className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg }}
              >
                <IconComp size={15} style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{s.value}</div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={11} className="text-[var(--text-muted)]" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortMode)} className={`${inputCls} h-7 text-[0.65rem] px-2`}>
            <option value="default">{bn ? 'সব' : 'All'}</option>
            <option value="col-asc">{bn ? 'সংগ্রহ: কম → বেশি' : 'Collected: Min → Max'}</option>
            <option value="col-desc">{bn ? 'সংগ্রহ: বেশি → কম' : 'Collected: Max → Min'}</option>
            <option value="pend-asc">{bn ? 'বকেয়: কম → বেশি' : 'Pending: Min → Max'}</option>
            <option value="pend-desc">{bn ? 'বকেয়: বেশি → কম' : 'Pending: Max → Min'}</option>
          </select>
        </div>
        {classNames.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'শ্রেণি:' : 'Class:'}</span>
            <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection('') }} className={`${inputCls} h-7 text-[0.65rem] px-2`}>
              <option value="">{bn ? 'সব' : 'All'}</option>
              {classNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        {sections.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'শাখা:' : 'Section:'}</span>
            <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={`${inputCls} h-7 text-[0.65rem] px-2`}>
              <option value="">{bn ? 'সব' : 'All'}</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {hasFilter && (
          <button onClick={() => { setSortBy('default'); setFClass(''); setFSection('') }} className="px-2 py-1 rounded-lg text-[0.65rem] font-medium bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)]/20 cursor-pointer transition-all hover:bg-[var(--red)]/20">
            {bn ? 'মুছুন' : 'Clear'}
          </button>
        )}
        <div className="flex-1" />
        {sortedSummary.length > 0 && canPrint('finance.fees.reports.print') && (
          <button onClick={() => setShowPdfModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--red)] hover:text-[var(--red)] cursor-pointer transition-all">
            <FileText size={13} />
            {bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
          </button>
        )}
      </div>

      {/* Class-wise Summary */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--brand)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{bn ? 'শ্রেণি অনুযায়ী সারসংক্ষেপ' : 'Class-wise Summary'}</h3>
          {hasFilter && <span className="ml-auto text-[0.65rem] text-[var(--text-muted)]">{sortedSummary.length} {bn ? 'টি শ্রেণি' : 'classes'}</span>}
        </div>
        {sortedSummary.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] text-sm">
            {bn ? 'কোনো ডেটা নেই' : 'No data available'}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="text-left px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                <th className="text-left px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শাখা' : 'Section'}</th>
                <th className="text-center px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Students'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মোট ফি' : 'Total Fee'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'সংগৃহীত' : 'Collected'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'বকেয়' : 'Pending'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'সংগ্রহ হার' : 'Collection %'}</th>
              </tr>
            </thead>
            <tbody>
              {sortedSummary.map((c) => (
                <tr key={`${c.className}-${c.section}`} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{c.className}</td>
                  <td className="px-4 py-2.5 text-[var(--text-secondary)]">{c.section || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]"><Users size={11} />{c.studentCount}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{fmt(c.totalDue)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-[var(--green)]">{fmt(c.totalPaid)}</td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ color: c.pending > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{fmt(c.pending)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, background: c.pct >= 80 ? 'var(--green)' : c.pct >= 50 ? 'var(--amber)' : 'var(--red)' }} />
                      </div>
                      <span className="text-[0.65rem] font-medium" style={{ color: c.pct >= 80 ? 'var(--green)' : c.pct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{c.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PDF Options Modal */}
      {showPdfModal && (
        <GenericPDFOptionsModal
          columns={pdfColumns}
          defaultTitle="Class-wise Report"
          defaultTitleBn="শ্রেণি অনুযায়ী রিপোর্ট"
          recordLabel="class"
          recordLabelBn="শ্রেণি"
          count={sortedSummary.length}
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
