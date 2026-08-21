import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, DollarSign, MoreVertical, ChevronDown, FileSpreadsheet, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useFeeStore } from '@/store/feeStore'
import { useOthersIncomeStore } from '@/store/othersIncomeStore'
import { useExpenseStore } from '@/store/expenseStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { toBnNum } from '@/lib/i18n'
import { XLSX } from '@/lib/excelExport'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { GenericPDFOptionsModal } from '@/components/shared/GenericPDFOptionsModal'
import type { PDFColumnDef, GenericPDFOptionsResult } from '@/components/shared/GenericPDFOptionsModal'

type View = 'income' | 'expenses' | 'profit-loss'

interface CategoryRow {
  name: string
  nameBn: string
  amount: number
  count: number
}

function StatCards({ stats, bn }: { stats: { totalIncome: number; totalExpenses: number; netProfit: number; margin: number }; bn: boolean }) {
  const isProfit = stats.netProfit >= 0
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { labelBn: 'মোট আয়', labelEn: 'Total Income', value: stats.totalIncome, icon: <TrendingUp size={14} />, color: 'var(--green)', prefix: '৳' },
        { labelBn: 'মোট খরচ', labelEn: 'Total Expenses', value: stats.totalExpenses, icon: <TrendingDown size={14} />, color: 'var(--red)', prefix: '৳' },
        { labelBn: isProfit ? 'নিট লাভ' : 'নিট ক্ষতি', labelEn: isProfit ? 'Net Profit' : 'Net Loss', value: Math.abs(stats.netProfit), icon: isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />, color: isProfit ? 'var(--green)' : 'var(--red)', prefix: isProfit ? '+' : '-' },
        { labelBn: 'লাভের হার', labelEn: 'Profit Margin', value: stats.margin, icon: <DollarSign size={14} />, color: 'var(--brand)', suffix: '%' },
      ].map((s) => (
        <div key={s.labelEn} className="flex items-center gap-3 p-3 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[1.125rem] text-[var(--text-primary)] leading-tight">
              {s.prefix || ''}{bn ? toBnNum(s.value) : s.value.toLocaleString()}{s.suffix || ''}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? s.labelBn : s.labelEn}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AccountingReportPage() {
  const bn = useBn()
  const feePayments = useFeeStore((s) => s.payments)
  const feeStructures = useFeeStore((s) => s.structures)
  const feeCategories = useFeeStore((s) => s.feeCategories)
  const otherCategories = useOthersIncomeStore((s) => s.categories)
  const otherAssignments = useOthersIncomeStore((s) => s.assignments)
  const expenseCategories = useExpenseStore((s) => s.categories)
  const expenses = useExpenseStore((s) => s.expenses)

  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<View>('income')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({ activeTab, tabRefs, sliderRef, getContainer: (slider) => slider?.parentElement ?? null })

  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t) }, [])

  useEffect(() => {
    if (!showActionMenu) return
    const h = (e: MouseEvent) => { if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showActionMenu])

  const filterByDate = useCallback((dateStr: string) => {
    if (!dateFrom && !dateTo) return true
    if (dateFrom && dateStr < dateFrom) return false
    if (dateTo && dateStr > dateTo) return false
    return true
  }, [dateFrom, dateTo])

  const incomeByCategory = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; amount: number; count: number }>()
    feePayments.filter((p) => filterByDate(p.paidAt.split('T')[0])).forEach((p) => {
      const struct = feeStructures.find((s) => s.id === p.feeStructureId)
      const catId = struct?.categoryId
      const cat = catId ? feeCategories.find((c) => c.id === catId) : null
      const name = cat ? (bn ? cat.nameBn : cat.name) : (struct ? (bn ? struct.nameBn : struct.name) : (bn ? 'ফি' : 'Fees'))
      const nameBn = cat?.nameBn || struct?.nameBn || 'ফি'
      const key = name
      const existing = map.get(key) || { name, nameBn, amount: 0, count: 0 }
      existing.amount += p.amount - p.discount
      existing.count += 1
      map.set(key, existing)
    })
    otherAssignments.filter((a) => a.isActive).forEach((a) => {
      const cat = otherCategories.find((c) => c.id === a.categoryId)
      if (!cat) return
      const months = a.months.length > 0 ? a.months : [0,1,2,3,4,5,6,7,8,9,10,11]
      const total = months.length * cat.amount
      const name = bn ? cat.nameBn : cat.name
      const existing = map.get(a.categoryId) || { name, nameBn: cat.nameBn, amount: 0, count: 0 }
      existing.amount += total
      existing.count += 1
      map.set(a.categoryId, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  }, [feePayments, feeStructures, feeCategories, otherAssignments, otherCategories, bn, filterByDate])

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; amount: number; count: number }>()
    expenses.filter((e) => e.isActive && filterByDate(e.date)).forEach((e) => {
      const cat = expenseCategories.find((c) => c.id === e.categoryId)
      const name = cat ? (bn ? cat.nameBn : cat.name) : (bn ? 'অন্যান্য' : 'Others')
      const nameBn = cat?.nameBn || 'অন্যান্য'
      const existing = map.get(e.categoryId) || { name, nameBn, amount: 0, count: 0 }
      existing.amount += e.amount
      existing.count += 1
      map.set(e.categoryId, existing)
    })
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  }, [expenses, expenseCategories, bn, filterByDate])

  const totalIncome = useMemo(() => incomeByCategory.reduce((s, r) => s + r.amount, 0), [incomeByCategory])
  const totalExpenses = useMemo(() => expensesByCategory.reduce((s, r) => s + r.amount, 0), [expensesByCategory])
  const netProfit = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0

  const profitLossByCategory = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; income: number; expense: number }>()
    incomeByCategory.forEach((r) => {
      const existing = map.get(r.name) || { name: r.name, nameBn: r.nameBn, income: 0, expense: 0 }
      existing.income += r.amount
      map.set(r.name, existing)
    })
    expensesByCategory.forEach((r) => {
      const existing = map.get(r.name) || { name: r.name, nameBn: r.nameBn, income: 0, expense: 0 }
      existing.expense += r.amount
      map.set(r.name, existing)
    })
    return Array.from(map.values()).map((r) => ({ ...r, profit: r.income - r.expense })).sort((a, b) => b.profit - a.profit)
  }, [incomeByCategory, expensesByCategory])

  const tabs = useMemo(() => [
    { id: 'income' as View, icon: TrendingUp, label: bn ? 'আয়' : 'Income' },
    { id: 'expenses' as View, icon: TrendingDown, label: bn ? 'খরচ' : 'Expenses' },
    { id: 'profit-loss' as View, icon: DollarSign, label: bn ? 'লাভ/ক্ষতি' : 'Profit/Loss' },
  ], [bn])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const navigateToDue = useCallback((categoryName: string) => {
    const params = new URLSearchParams({ view: 'dues', status: 'paid' })
    const struct = feeStructures.find((s) => (bn ? s.nameBn : s.name) === categoryName || s.name === categoryName)
    if (struct) {
      params.set('feeType', struct.type)
      params.set('category', struct.name)
    }
    const cat = feeCategories.find((c) => (bn ? c.nameBn : c.name) === categoryName || c.name === categoryName)
    if (cat) {
      params.set('feeType', cat.type)
    }
    navigate(`/finance?${params.toString()}`)
  }, [feeStructures, feeCategories, bn, navigate])

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()
    const addSheet = (data: Record<string, string | number>[], name: string) => {
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, name)
    }
    if (activeTab === 'income' || activeTab === 'profit-loss') {
      addSheet(incomeByCategory.map((r, i) => ({ [bn ? 'ক্রমিক' : 'S/N']: i + 1, [bn ? 'ক্যাটাগরি' : 'Category']: bn ? r.nameBn : r.name, [bn ? 'পরিমাণ' : 'Amount']: r.amount, [bn ? 'সংখ্যা' : 'Count']: r.count })), bn ? 'আয়' : 'Income')
    }
    if (activeTab === 'expenses' || activeTab === 'profit-loss') {
      addSheet(expensesByCategory.map((r, i) => ({ [bn ? 'ক্রমিক' : 'S/N']: i + 1, [bn ? 'ক্যাটাগরি' : 'Category']: bn ? r.nameBn : r.name, [bn ? 'পরিমাণ' : 'Amount']: r.amount, [bn ? 'সংখ্যা' : 'Count']: r.count })), bn ? 'খরচ' : 'Expenses')
    }
    if (activeTab === 'profit-loss') {
      addSheet(profitLossByCategory.map((r, i) => ({ [bn ? 'ক্রমিক' : 'S/N']: i + 1, [bn ? 'ক্যাটাগরি' : 'Category']: bn ? r.nameBn : r.name, [bn ? 'আয়' : 'Income']: r.income, [bn ? 'খরচ' : 'Expense']: r.expense, [bn ? 'লাভ/ক্ষতি' : 'Profit/Loss']: r.profit })), bn ? 'লাভ/ক্ষতি' : 'Profit-Loss')
    }
    XLSX.writeFile(wb, `accounting-report-${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowActionMenu(false)
  }

  const pdfColumns: PDFColumnDef[] = useMemo(() => {
    if (activeTab === 'profit-loss') {
      return [
        { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
        { key: 'category', label: 'Category', labelBn: 'ক্যাটাগরি', default: true },
        { key: 'income', label: 'Income', labelBn: 'আয়', default: true },
        { key: 'expense', label: 'Expense', labelBn: 'খরচ', default: true },
        { key: 'profit', label: 'Profit/Loss', labelBn: 'লাভ/ক্ষতি', default: true },
      ]
    }
    return [
      { key: 'sn', label: 'S/N', labelBn: 'ক্রমিক', default: true },
      { key: 'category', label: 'Category', labelBn: 'ক্যাটাগরি', default: true },
      { key: 'amount', label: 'Amount', labelBn: 'পরিমাণ', default: true },
      { key: 'count', label: 'Count', labelBn: 'সংখ্যা', default: true },
    ]
  }, [activeTab])

  const pdfPreviewRenderer = useCallback((opts: GenericPDFOptionsResult): string => {
    const data = activeTab === 'profit-loss' ? profitLossByCategory : (activeTab === 'income' ? incomeByCategory : expensesByCategory)
    const rows = data.slice(0, 20).map((r, i) => {
      const row: Record<string, string> = { '#': String(i + 1) }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'category': row[bn ? 'ক্যাটাগরি' : 'Category'] = bn ? r.nameBn : r.name; break
          case 'amount': row[bn ? 'পরিমাণ' : 'Amount'] = `৳${(r as CategoryRow).amount.toLocaleString()}`; break
          case 'count': row[bn ? 'সংখ্যা' : 'Count'] = String((r as CategoryRow).count); break
          case 'income': row[bn ? 'আয়' : 'Income'] = `৳${(r as { income: number }).income.toLocaleString()}`; break
          case 'expense': row[bn ? 'খরচ' : 'Expense'] = `৳${(r as { expense: number }).expense.toLocaleString()}`; break
          case 'profit': row[bn ? 'লাভ/ক্ষতি' : 'Profit/Loss'] = `৳${(r as { profit: number }).profit.toLocaleString()}`; break
        }
      }
      return row
    })
    const headers = ['#', ...opts.selectedCols.map((key) => { const col = pdfColumns.find((c) => c.key === key); return col ? (opts.isBn ? col.labelBn : col.label) : key })]
    const branding = getPDFBranding()
    const logo = pdfLogoHTML(branding, 28)
    const headerRow = headers.map((h) => `<th style="background:${branding.brandColor};color:#fff;padding:4px 6px;text-align:center">${h}</th>`).join('')
    const bodyRows = rows.map((r) => {
      const cells = [`<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r['#'] || ''}</td>`]
      for (const key of opts.selectedCols) { const col = pdfColumns.find((c) => c.key === key); const label = col ? (opts.isBn ? col.labelBn : col.label) : key; cells.push(`<td style="padding:3px 6px;border-bottom:1px solid #e0e0e0;text-align:center">${r[label] || ''}</td>`) }
      return `<tr>${cells.join('')}</tr>`
    }).join('')
    const overflowNote = data.length > 20 ? `<div style="font-size:9px;color:#999;margin-top:6px;text-align:center">... and ${data.length - 20} more</div>` : ''
    return `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a"><div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid ${branding.brandColor};padding-bottom:8px;margin-bottom:10px">${logo}<div><div style="font-size:14px;font-weight:700;color:${branding.brandColor}">${branding.schoolName}</div><div style="font-size:9px;color:#666">${branding.address}</div></div></div><div style="font-size:13px;font-weight:700;color:${branding.brandColor};margin:8px 0">${opts.title}</div><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>${overflowNote}</div>`
  }, [activeTab, incomeByCategory, expensesByCategory, profitLossByCategory, bn, pdfColumns])

  const handlePdfDownload = useCallback((opts: GenericPDFOptionsResult) => {
    const data = activeTab === 'profit-loss' ? profitLossByCategory : (activeTab === 'income' ? incomeByCategory : expensesByCategory)
    const headers = opts.selectedCols.map((c) => { const col = pdfColumns.find((p) => p.key === c); return col ? (opts.isBn ? col.labelBn : col.label) : c })
    const rows = data.map((r, i) => {
      const row: Record<string, string | number> = { '#': i + 1 }
      for (const key of opts.selectedCols) {
        switch (key) {
          case 'category': row[opts.isBn ? 'ক্যাটাগরি' : 'Category'] = bn ? r.nameBn : r.name; break
          case 'amount': row[opts.isBn ? 'পরিমাণ' : 'Amount'] = (r as CategoryRow).amount; break
          case 'count': row[opts.isBn ? 'সংখ্যা' : 'Count'] = (r as CategoryRow).count; break
          case 'income': row[opts.isBn ? 'আয়' : 'Income'] = (r as { income: number }).income; break
          case 'expense': row[opts.isBn ? 'খরচ' : 'Expense'] = (r as { expense: number }).expense; break
          case 'profit': row[opts.isBn ? 'লাভ/ক্ষতি' : 'Profit/Loss'] = (r as { profit: number }).profit; break
        }
      }
      return row
    })
    const pdfBranding = getPDFBranding()
    const logoHtml = pdfLogoHTML(pdfBranding)
    const css = `@page{size:${opts.orientation};margin:5mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${pdfBranding.brandColor};padding-bottom:10px;margin-bottom:12px}.sname{font-size:16px;font-weight:700;color:${pdfBranding.brandColor}}.saddr{font-size:10px;color:#666}.ttl{font-size:14px;font-weight:700;color:${pdfBranding.brandColor};margin:10px 0}table{width:100%;border-collapse:collapse;font-size:10px}th{background:${pdfBranding.brandColor};color:#fff;padding:5px 7px;text-align:center;font-weight:600}td{padding:4px 7px;border-bottom:1px solid #e0e0e0;text-align:center}tr:nth-child(even){background:#f8f9fa}.ftr{margin-top:12px;font-size:9px;color:#999;text-align:right}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact}}`
    const bodyRows = rows.map((r) => { const cells = headers.map((h) => `<td>${r[h] ?? ''}</td>`).join(''); return `<tr>${cells}</tr>` }).join('')
    const headerCells = headers.map((h) => `<th>${h}</th>`).join('')
    const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const title = activeTab === 'income' ? (bn ? 'আয় রিপোর্ট' : 'Income Report') : activeTab === 'expenses' ? (bn ? 'খরচ রিপোর্ট' : 'Expense Report') : (bn ? 'লাভ/ক্ষতি রিপোর্ট' : 'Profit/Loss Report')
    const bodyHTML = `<div class="hdr">${logoHtml}<div><div class="sname">${pdfBranding.schoolName}</div><div class="saddr">${pdfBranding.address}</div></div></div><div class="ttl">${opts.title}</div><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><div class="ftr">Generated: ${genDate}</div>`
    openPrintWindow(title, bodyHTML, { css })
  }, [activeTab, incomeByCategory, expensesByCategory, profitLossByCategory, bn, pdfColumns])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map((i) => <div key={i} className="skeleton h-[3.25rem] rounded-[0.625rem]" />)}</div>
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="skeleton h-64 w-full rounded-[0.625rem]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{bn ? 'হিসাব রিপোর্ট' : 'Accounting Report'}</h1></div>
      <StatCards stats={{ totalIncome, totalExpenses, netProfit, margin }} bn={bn} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">{bn ? 'থেকে' : 'From'}</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] font-[inherit] outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">{bn ? 'পর্যন্ত' : 'To'}</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] font-[inherit] outline-none" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] font-medium cursor-pointer hover:bg-[var(--border)] transition-colors">
            {bn ? 'পরিষ্কার' : 'Clear'}
          </button>
        )}
      </div>

      <div className="relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] w-full">
        <div ref={sliderRef} className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]" style={{ background: 'var(--brand)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', zIndex: 0 }} />
        {tabs.map((tab) => (
          <button key={tab.id} ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }} onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            style={{ background: 'transparent' }}>
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[var(--text-secondary)]">
          {activeTab === 'income' && (bn ? `মোট: ${toBnNum(incomeByCategory.length)}টি ক্যাটাগরি — ${fmt(totalIncome)}` : `Total: ${incomeByCategory.length} categories — ${fmt(totalIncome)}`)}
          {activeTab === 'expenses' && (bn ? `মোট: ${toBnNum(expensesByCategory.length)}টি ক্যাটাগরি — ${fmt(totalExpenses)}` : `Total: ${expensesByCategory.length} categories — ${fmt(totalExpenses)}`)}
          {activeTab === 'profit-loss' && (bn ? `মোট: ${toBnNum(profitLossByCategory.length)}টি ক্যাটাগরি` : `Total: ${profitLossByCategory.length} categories`)}
        </span>
        <div className="relative">
          <button onClick={() => setShowActionMenu(!showActionMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors cursor-pointer">
            <MoreVertical size={13} />{bn ? 'অ্যাকশন' : 'Action'}<ChevronDown size={12} />
          </button>
          {showActionMenu && (<>
            <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
            <div ref={actionMenuRef} className="absolute top-full right-0 mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] min-w-[12.5rem] z-50 overflow-hidden">
              <button onClick={handleExportExcel} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--green-light)] transition-colors">
                <FileSpreadsheet size={14} className="text-[var(--green)]" />{bn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
              </button>
              <div className="h-px bg-[var(--border)] mx-2" />
              <button onClick={() => { setShowPdfModal(true); setShowActionMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--red-light)] transition-colors">
                <FileText size={14} className="text-[var(--red)]" />{bn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
              </button>
            </div>
          </>)}
        </div>
      </div>

      <div className="rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                {activeTab === 'profit-loss' ? (
                  <>
                    <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'আয়' : 'Income'}</th>
                    <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'খরচ' : 'Expense'}</th>
                    <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'লাভ/ক্ষতি' : 'Profit/Loss'}</th>
                  </>
                ) : (
                  <>
                    <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'সংখ্যা' : 'Count'}</th>
                    <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'শতাংশ' : 'Share'}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'income' && (
                incomeByCategory.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো আয়ের তথ্য পাওয়া যায়নি' : 'No income data found'}</td></tr>
                ) : incomeByCategory.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-tertiary)]">
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)]">{i + 1}</td>
                    <td className="py-3 px-4 text-[0.8125rem] font-semibold text-[var(--text-primary)]">{bn ? r.nameBn : r.name}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => navigateToDue(r.name)} className="text-[0.8125rem] font-bold text-[var(--green)] hover:underline cursor-pointer bg-transparent border-none p-0 font-[inherit]">{fmt(r.amount)}</button>
                    </td>
                    <td className="py-3 px-4 text-center text-[0.8125rem] text-[var(--text-primary)]">{r.count}</td>
                    <td className="py-3 px-4 text-right text-[0.8125rem] text-[var(--text-secondary)]">{totalIncome > 0 ? `${((r.amount / totalIncome) * 100).toFixed(1)}%` : '0%'}</td>
                  </tr>
                ))
              )}
              {activeTab === 'expenses' && (
                expensesByCategory.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো খরচের তথ্য পাওয়া যায়নি' : 'No expense data found'}</td></tr>
                ) : expensesByCategory.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-tertiary)]">
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)]">{i + 1}</td>
                    <td className="py-3 px-4 text-[0.8125rem] font-semibold text-[var(--text-primary)]">{bn ? r.nameBn : r.name}</td>
                    <td className="py-3 px-4 text-right text-[0.8125rem] font-bold text-[var(--red)]">{fmt(r.amount)}</td>
                    <td className="py-3 px-4 text-center text-[0.8125rem] text-[var(--text-primary)]">{r.count}</td>
                    <td className="py-3 px-4 text-right text-[0.8125rem] text-[var(--text-secondary)]">{totalExpenses > 0 ? `${((r.amount / totalExpenses) * 100).toFixed(1)}%` : '0%'}</td>
                  </tr>
                ))
              )}
              {activeTab === 'profit-loss' && (
                profitLossByCategory.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-[13px] text-[var(--text-muted)]">{bn ? 'কোনো তথ্য পাওয়া যায়নি' : 'No data found'}</td></tr>
                ) : profitLossByCategory.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-tertiary)]">
                    <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)]">{i + 1}</td>
                    <td className="py-3 px-4 text-[0.8125rem] font-semibold text-[var(--text-primary)]">{bn ? r.nameBn : r.name}</td>
                    <td className="py-3 px-4 text-right text-[0.8125rem] font-bold text-[var(--green)]">{fmt(r.income)}</td>
                    <td className="py-3 px-4 text-right text-[0.8125rem] font-bold text-[var(--red)]">{fmt(r.expense)}</td>
                    <td className="py-3 px-4 text-right text-[0.8125rem] font-bold" style={{ color: r.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{r.profit >= 0 ? '+' : ''}{fmt(r.profit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPdfModal && <GenericPDFOptionsModal columns={pdfColumns} defaultTitle={activeTab === 'income' ? (bn ? 'আয় রিপোর্ট' : 'Income Report') : activeTab === 'expenses' ? (bn ? 'খরচ রিপোর্ট' : 'Expense Report') : (bn ? 'লাভ/ক্ষতি রিপোর্ট' : 'Profit/Loss Report')} defaultTitleBn={activeTab === 'income' ? 'আয় রিপোর্ট' : activeTab === 'expenses' ? 'খরচ রিপোর্ট' : 'লাভ/ক্ষতি রিপোর্ট'} recordLabel={bn ? 'ক্যাটাগরি' : 'category'} recordLabelBn="ক্যাটাগরি" count={activeTab === 'income' ? incomeByCategory.length : activeTab === 'expenses' ? expensesByCategory.length : profitLossByCategory.length} isBn={bn} previewRenderer={pdfPreviewRenderer} onDownload={(opts: GenericPDFOptionsResult) => { setShowPdfModal(false); handlePdfDownload(opts) }} onClose={() => setShowPdfModal(false)} />}
    </div>
  )
}
