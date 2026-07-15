import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { Search, DollarSign, Users, CalendarDays, Ban, CheckCircle2, ChevronDown, CircleCheck } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeDue } from '@/store/feeStore'

interface Props {
  onCollect: (due: FeeDue) => void
}

const MONTH_LABELS = [
  { en: 'Jan', bn: 'জানুয়ারি' },
  { en: 'Feb', bn: 'ফেব্রুয়ারি' },
  { en: 'Mar', bn: 'মার্চ' },
  { en: 'Apr', bn: 'এপ্রিল' },
  { en: 'May', bn: 'মে' },
  { en: 'Jun', bn: 'জুন' },
  { en: 'Jul', bn: 'জুলাই' },
  { en: 'Aug', bn: 'আগস্ট' },
  { en: 'Sep', bn: 'সেপ্টেম্বর' },
  { en: 'Oct', bn: 'অক্টোবর' },
  { en: 'Nov', bn: 'নভেম্বর' },
  { en: 'Dec', bn: 'ডিসেম্বর' },
]

const selectCls = 'h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer'

interface MonthCell {
  paid: boolean
  amount: number
}

interface DueMatrixRow {
  studentId: string
  studentName: string
  studentNameBn: string
  class: string
  section: string
  roll: string
  photo: string
  feeStructureId: string
  feeName: string
  feeNameBn: string
  feeType: 'monthly' | 'onetime'
  totalAmount: number
  months: Record<number, MonthCell>
  totalDue: number
  totalPaid: number
}

export const DuesTab = React.memo(function DuesTab({ onCollect }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const { structures, payments, waivers } = useFeeStore()

  const [fType, setFType] = useState<'monthly' | 'onetime' | ''>('')
  const [fCategory, setFCategory] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fYear, setFYear] = useState(() => new Date().getFullYear())
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set([new Date().getMonth()]))
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const monthDropdownRef = useRef<HTMLDivElement>(null)
  const [showResults, setShowResults] = useState(false)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === 'approved' && s.active !== false),
    [students]
  )

  const activeStructures = useMemo(
    () => structures.filter((s) => s.isActive),
    [structures]
  )

  const categoryOptions = useMemo(() => {
    let list = activeStructures
    if (fType) list = list.filter((s) => s.type === fType)
    const names = new Set(list.map((s) => s.name))
    return Array.from(names)
  }, [activeStructures, fType])

  const feeStructuresForCategory = useMemo(() => {
    let list = activeStructures
    if (fCategory) list = list.filter((s) => s.name === fCategory)
    if (fType) list = list.filter((s) => s.type === fType)
    return list
  }, [activeStructures, fCategory, fType])

  const showMonthPicker = fType === 'monthly' || (!fType && feeStructuresForCategory.some((s) => s.type === 'monthly'))

  const sortedMonths = useMemo(() => Array.from(selectedMonths).sort((a, b) => a - b), [selectedMonths])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setShowMonthDropdown(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggleMonth = useCallback((m: number) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(m)) next.delete(m)
      else next.add(m)
      return next
    })
    setShowResults(false)
  }, [])

  const selectAllMonths = useCallback(() => {
    setSelectedMonths(new Set(MONTH_LABELS.map((_, i) => i)))
    setShowResults(false)
  }, [])

  const clearAllMonths = useCallback(() => {
    setSelectedMonths(new Set())
    setShowResults(false)
  }, [])

  const monthDisplayText = useMemo(() => {
    if (selectedMonths.size === 0) return bn ? 'মাস বাছাই করুন' : 'Select months'
    if (selectedMonths.size === 12) return bn ? 'সব মাস' : 'All months'
    const labels = sortedMonths.map((m) => bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en)
    if (labels.length <= 3) return labels.join(', ')
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
  }, [selectedMonths, sortedMonths, bn])

  const results = useMemo<DueMatrixRow[]>(() => {
    if (!showResults) return []
    if (feeStructuresForCategory.length === 0 || activeStudents.length === 0) return []

    const rows: DueMatrixRow[] = []
    const filteredStudents = activeStudents.filter((s) => {
      if (fClass && s.class !== fClass) return false
      if (fSection && s.section !== fSection) return false
      return true
    })

    const monthsToShow = showMonthPicker ? sortedMonths : []

    for (const fee of feeStructuresForCategory) {
      for (const student of filteredStudents) {
        if (fee.class !== student.class) continue
        if (fee.section && fee.section !== student.section) continue

        if (fee.type === 'onetime') {
          const paid = payments
            .filter((p) => p.studentId === student.id && p.feeStructureId === fee.id)
            .reduce((sum, p) => sum + p.amount, 0)
          const waived = waivers
            .filter((w) => w.studentId === student.id && w.feeStructureId === fee.id)
            .reduce((sum, w) => sum + w.amount, 0)
          const due = fee.amount - paid - waived
          if (due > 0) {
            rows.push({
              studentId: student.id,
              studentName: student.nameEn,
              studentNameBn: student.nameBn,
              class: student.class,
              section: student.section,
              roll: student.roll,
              photo: student.photo,
              feeStructureId: fee.id,
              feeName: fee.name,
              feeNameBn: fee.nameBn,
              feeType: 'onetime',
              totalAmount: fee.amount,
              months: {},
              totalDue: Math.max(0, due),
              totalPaid: paid,
            })
          }
        } else {
          const monthCells: Record<number, MonthCell> = {}
          let anyDue = false

          for (const m of monthsToShow) {
            const monthKey = `${fYear}-${String(m + 1).padStart(2, '0')}`
            const monthPayments = payments.filter((p) => {
              if (p.studentId !== student.id || p.feeStructureId !== fee.id) return false
              if (p.forMonth) return p.forMonth === monthKey
              const d = new Date(p.paidAt)
              return d.getFullYear() === fYear && d.getMonth() === m
            })
            const paid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
            const discount = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0)
            const monthWaivers = waivers.filter((w) => {
              if (w.studentId !== student.id || w.feeStructureId !== fee.id) return false
              const d = new Date(w.createdAt)
              return d.getFullYear() === fYear && d.getMonth() === m
            })
            const waived = monthWaivers.reduce((sum, w) => sum + w.amount, 0)
            const receivable = fee.amount - paid - discount - waived
            const isPaid = receivable <= 0
            monthCells[m] = { paid: isPaid, amount: Math.max(0, receivable) }
            if (!isPaid) anyDue = true
          }

          if (anyDue) {
            const totalPaidCount = Object.values(monthCells).filter((c) => c.paid).length
            const totalDueAmount = Object.values(monthCells).reduce((sum, c) => sum + c.amount, 0)
            rows.push({
              studentId: student.id,
              studentName: student.nameEn,
              studentNameBn: student.nameBn,
              class: student.class,
              section: student.section,
              roll: student.roll,
              photo: student.photo,
              feeStructureId: fee.id,
              feeName: fee.name,
              feeNameBn: fee.nameBn,
              feeType: 'monthly',
              totalAmount: fee.amount,
              months: monthCells,
              totalDue: totalDueAmount,
              totalPaid: totalPaidCount,
            })
          }
        }
      }
    }

    return rows
  }, [showResults, feeStructuresForCategory, activeStudents, fClass, fSection, payments, waivers, fYear, sortedMonths, showMonthPicker])

  const totalDue = useMemo(() => results.reduce((sum, r) => sum + r.totalDue, 0), [results])
  const studentCount = useMemo(() => new Set(results.map((r) => r.studentId)).size, [results])

  const handleFindDue = useCallback(() => {
    setShowResults(true)
  }, [])

  const buildCollectDue = useCallback((row: DueMatrixRow, monthIdx?: number): FeeDue | null => {
    const fee = feeStructuresForCategory.find((f) => f.id === row.feeStructureId)
    if (!fee) return null
    return {
      studentId: row.studentId,
      studentName: row.studentName,
      studentNameBn: row.studentNameBn,
      class: row.class,
      section: row.section,
      roll: row.roll,
      photo: row.photo,
      feeStructureId: row.feeStructureId,
      feeName: fee.name,
      feeNameBn: fee.nameBn,
      totalAmount: fee.amount,
      paidAmount: 0,
      waivedAmount: 0,
      dueAmount: monthIdx !== undefined ? (row.months[monthIdx]?.amount || 0) : row.totalDue,
      isActive: true,
    }
  }, [feeStructuresForCategory])

  const fmt = (n: number) => n.toLocaleString()

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5">
        {/* Row 1: Year + Type + Category + Month + Find Due */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fYear}
            onChange={(e) => { setFYear(Number(e.target.value)); setShowResults(false) }}
            className={selectCls}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={fType}
            onChange={(e) => { setFType(e.target.value as '' | 'monthly' | 'onetime'); setFCategory(''); setShowResults(false) }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব ধরন' : 'All types'}</option>
            <option value="monthly">{bn ? 'মাসিক' : 'Monthly'}</option>
            <option value="onetime">{bn ? 'এককালীন' : 'One-time'}</option>
          </select>
          <select
            value={fCategory}
            onChange={(e) => { setFCategory(e.target.value); setShowResults(false) }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব ক্যাটাগরি' : 'All categories'}</option>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {showMonthPicker && (
            <div className="relative" ref={monthDropdownRef}>
              <button
                onClick={() => setShowMonthDropdown((p) => !p)}
                className="h-[34px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] cursor-pointer flex items-center gap-1.5 min-w-[160px] outline-none focus:border-[var(--brand)]"
              >
                <CalendarDays size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="truncate text-left flex-1">{monthDisplayText}</span>
                <ChevronDown size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              </button>
              {showMonthDropdown && (
                <div className="absolute z-50 mt-1 w-[220px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-[0_12px_30px_rgba(20,23,33,0.12)] p-2">
                  <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-[var(--border)]">
                    <button onClick={selectAllMonths} className="text-[11px] font-semibold text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0">{bn ? 'সব নির্বাচন' : 'Select all'}</button>
                    <span className="text-[var(--text-muted)]">·</span>
                    <button onClick={clearAllMonths} className="text-[11px] font-semibold text-[var(--text-muted)] hover:underline cursor-pointer bg-transparent border-0 p-0">{bn ? 'পরিষ্কার' : 'Clear'}</button>
                    <span className="text-[11px] text-[var(--text-muted)] ml-auto">{selectedMonths.size}/12</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTH_LABELS.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => toggleMonth(i)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${
                          selectedMonths.has(i)
                            ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]'
                            : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border ${selectedMonths.has(i) ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--border)]'}`}>
                          {selectedMonths.has(i) && <CheckCircle2 size={9} className="text-white" />}
                        </div>
                        {bn ? m.bn : m.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="ml-auto">
            <button
              onClick={handleFindDue}
              className="h-[34px] px-4 rounded-lg bg-[var(--brand)] text-white font-semibold text-[13px] border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Search size={14} />{bn ? 'বকেয় খুঁজুন' : 'Find due'}
            </button>
          </div>
        </div>
        {/* Row 2: Class + Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fClass}
            onChange={(e) => { setFClass(e.target.value); setFSection(''); setShowResults(false) }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব শ্রেণি' : 'All classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {fClass && (
            <select
              value={fSection}
              onChange={(e) => { setFSection(e.target.value); setShowResults(false) }}
              className={selectCls}
            >
              <option value="">{bn ? 'সব সেকশন' : 'All sections'}</option>
              {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Stats — only shown after Find Due */}
      {showResults && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)]"><DollarSign size={16} /></span>
              <span className="text-[0.7rem] text-[var(--text-secondary)]">{bn ? 'মোট বকেয়' : 'Total Due'}</span>
            </div>
            <p className="text-lg font-bold text-[var(--brand)]">{fmt(totalDue)}</p>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--amber-light)] text-[var(--amber)]"><Users size={16} /></span>
              <span className="text-[0.7rem] text-[var(--text-secondary)]">{bn ? 'বকেয় শিক্ষার্থী' : 'Students with Dues'}</span>
            </div>
            <p className="text-lg font-bold text-[var(--amber)]">{studentCount}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!showResults ? (
        <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
          <div className="text-center">
            <Search size={32} className="mx-auto mb-2 opacity-50" />
            <p>{bn ? 'ফিল্টার নির্বাচন করে "বকেয় খুঁজুন" ক্লিক করুন' : 'Select filters and click "Find due" to view dues'}</p>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
          <div className="text-center">
            <Ban size={32} className="mx-auto mb-2 opacity-50" />
            <p>{bn ? 'কোনো বকেয় পাওয়া যায়নি' : 'No dues found for the selected filters'}</p>
          </div>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-xl overflow-auto max-h-[400px] bg-[var(--bg-primary)]">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky left-0 bg-[var(--bg-secondary)] z-20">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky left-0 bg-[var(--bg-secondary)] z-20">{bn ? 'রোল' : 'Roll'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'শ্রেণি' : 'Class'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফি' : 'Fee'}</th>
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'ফির পরিমাণ' : 'Fee Amt'}</th>
                {showMonthPicker && sortedMonths.map((m) => (
                  <th key={m} className="text-center px-2 py-2 text-[10px] uppercase font-bold sticky top-0 z-10" style={{ background: 'var(--bg-secondary)', color: 'var(--brand)', minWidth: '70px' }}>
                    {bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en}
                  </th>
                ))}
                {!showMonthPicker && (
                  <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'বকেয়' : 'Due'}</th>
                )}
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold">{bn ? 'মোট বকেয়' : 'Total Due'}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={`${row.studentId}-${row.feeStructureId}-${i}`} className="border-t border-[var(--border)] hover:bg-[var(--brand-light)]/40 transition-colors">
                  <td className="px-3 py-2 sticky left-0 bg-[var(--bg-primary)] z-10">
                    <p className="font-semibold text-[var(--text-primary)] text-[12px]">{bn ? row.studentNameBn || row.studentName : row.studentName}</p>
                  </td>
                  <td className="text-center px-2 py-2 text-[var(--text-secondary)] sticky left-0 bg-[var(--bg-primary)] z-10">{row.roll}</td>
                  <td className="text-center px-2 py-2 text-[var(--text-secondary)]">{row.class}{row.section ? `-${row.section}` : ''}</td>
                  <td className="text-center px-2 py-2">
                    <span className="font-semibold text-[var(--text-primary)] text-[11px]">{bn ? row.feeNameBn : row.feeName}</span>
                  </td>
                  <td className="text-right px-2 py-2 text-[var(--text-secondary)]">{fmt(row.totalAmount)}</td>
                  {showMonthPicker && sortedMonths.map((m) => {
                    const cell = row.months[m]
                    if (!cell) return <td key={m} className="text-center px-2 py-2 text-[var(--text-muted)]">—</td>
                    return (
                      <td key={m} className="text-center px-2 py-2">
                        {cell.paid ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--green-light)]">
                            <CircleCheck size={14} className="text-[var(--green)]" />
                          </span>
                        ) : (
                          <button
                            onClick={() => { const due = buildCollectDue(row, m); if (due) onCollect(due) }}
                            className="font-bold text-[12px] text-[var(--amber)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-0 p-0 transition-colors"
                            title={bn ? 'পরিশোধ করুন' : 'Collect'}
                          >
                            {fmt(cell.amount)}
                          </button>
                        )}
                      </td>
                    )
                  })}
                  {!showMonthPicker && (
                    <td className="text-center px-2 py-2 font-bold text-[var(--amber)]">{fmt(row.totalDue)}</td>
                  )}
                  <td className="text-right px-2 py-2">
                    <button
                      onClick={() => { const due = buildCollectDue(row); if (due) onCollect(due) }}
                      className="h-7 px-2.5 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-[11px] font-semibold border-0 cursor-pointer hover:bg-[var(--green)] hover:text-white transition-colors flex items-center gap-1 ml-auto"
                    >
                      <CheckCircle2 size={12} />{bn ? 'পরিশোধ' : 'Collect'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})
