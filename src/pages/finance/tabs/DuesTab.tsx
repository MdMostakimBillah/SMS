import { useState, useMemo, useCallback } from 'react'
import React from 'react'
import { Search, DollarSign, Users, CalendarDays, Ban, CheckCircle2 } from 'lucide-react'
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

export const DuesTab = React.memo(function DuesTab({ onCollect }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const { structures, payments, waivers } = useFeeStore()

  const [fCategory, setFCategory] = useState('')
  const [fFee, setFFee] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fMonth, setFMonth] = useState(() => new Date().getMonth())
  const [fYear, setFYear] = useState(() => new Date().getFullYear())
  const [fType, setFType] = useState<'monthly' | 'onetime' | ''>('')
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

  const feeOptions = useMemo(() => {
    let list = activeStructures
    if (fCategory) list = list.filter((s) => s.name === fCategory)
    if (fType) list = list.filter((s) => s.type === fType)
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fSection) list = list.filter((s) => !s.section || s.section === fSection)
    return list
  }, [activeStructures, fCategory, fType, fClass, fSection])

  const selectedMonthKey = useMemo(
    () => `${fYear}-${String(fMonth + 1).padStart(2, '0')}`,
    [fYear, fMonth]
  )

  const showMonthPicker = fType === 'monthly' || (!fType && feeOptions.some((s) => s.type === 'monthly'))

  const results = useMemo<FeeDue[]>(() => {
    if (!showResults) return []
    if (feeOptions.length === 0 || activeStudents.length === 0) return []

    const dues: FeeDue[] = []
    const filteredStudents = activeStudents.filter((s) => {
      if (fClass && s.class !== fClass) return false
      if (fSection && s.section !== fSection) return false
      return true
    })

    for (const fee of feeOptions) {
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
            dues.push({
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
              totalAmount: fee.amount,
              paidAmount: paid,
              waivedAmount: waived,
              dueAmount: Math.max(0, due),
              isActive: true,
            })
          }
        } else {
          const monthPayments = payments.filter((p) => {
            if (p.studentId !== student.id || p.feeStructureId !== fee.id) return false
            if (p.forMonth) return p.forMonth === selectedMonthKey
            const d = new Date(p.paidAt)
            return d.getFullYear() === fYear && d.getMonth() === fMonth
          })
          const paid = monthPayments.reduce((sum, p) => sum + p.amount, 0)
          const discount = monthPayments.reduce((sum, p) => sum + (p.discount || 0), 0)
          const monthWaivers = waivers.filter((w) => {
            if (w.studentId !== student.id || w.feeStructureId !== fee.id) return false
            const d = new Date(w.createdAt)
            return d.getFullYear() === fYear && d.getMonth() === fMonth
          })
          const waived = monthWaivers.reduce((sum, w) => sum + w.amount, 0)
          const receivable = fee.amount - paid - discount - waived
          if (receivable > 0) {
            dues.push({
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
              totalAmount: fee.amount,
              paidAmount: paid + discount,
              waivedAmount: waived,
              dueAmount: Math.max(0, receivable),
              isActive: true,
            })
          }
        }
      }
    }

    return dues
  }, [showResults, feeOptions, activeStudents, fClass, fSection, payments, waivers, fMonth, fYear, selectedMonthKey])

  const totalDue = useMemo(() => results.reduce((sum, d) => sum + d.dueAmount, 0), [results])
  const studentCount = useMemo(() => new Set(results.map((d) => d.studentId)).size, [results])

  const handleFindDue = useCallback(() => {
    setShowResults(true)
  }, [])

  const fmt = (n: number) => n.toLocaleString()

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5">
        {/* Row 1: Type + Category + Fee + Find Due */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fType}
            onChange={(e) => { setFType(e.target.value as '' | 'monthly' | 'onetime'); setFCategory(''); setFFee(''); setShowResults(false) }}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
          >
            <option value="">{bn ? 'সব ধরন' : 'All types'}</option>
            <option value="monthly">{bn ? 'মাসিক' : 'Monthly'}</option>
            <option value="onetime">{bn ? 'এককালীন' : 'One-time'}</option>
          </select>
          <select
            value={fCategory}
            onChange={(e) => { setFCategory(e.target.value); setFFee(''); setShowResults(false) }}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
          >
            <option value="">{bn ? 'সব ক্যাটাগরি' : 'All categories'}</option>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={fFee}
            onChange={(e) => { setFFee(e.target.value); setShowResults(false) }}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
          >
            <option value="">{bn ? 'সব ফি' : 'All fees'}</option>
            {feeOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {bn ? f.nameBn : f.name} ({f.class}{f.section ? `-${f.section}` : ''}) — {fmt(f.amount)}
              </option>
            ))}
          </select>
          <div className="ml-auto">
            <button
              onClick={handleFindDue}
              className="h-[34px] px-4 rounded-lg bg-[var(--brand)] text-white font-semibold text-[13px] border-0 cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Search size={14} />{bn ? 'বকেয় খুঁজুন' : 'Find due'}
            </button>
          </div>
        </div>
        {/* Row 2: Class + Section + Month */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fClass}
            onChange={(e) => { setFClass(e.target.value); setFSection(''); setShowResults(false) }}
            className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
          >
            <option value="">{bn ? 'সব শ্রেণি' : 'All classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {fClass && (
            <select
              value={fSection}
              onChange={(e) => { setFSection(e.target.value); setShowResults(false) }}
              className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
            >
              <option value="">{bn ? 'সব সেকশন' : 'All sections'}</option>
              {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {showMonthPicker && (
            <>
              <div className="w-px h-5 bg-[var(--border)]" />
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-[var(--text-muted)]" />
                <select
                  value={fMonth}
                  onChange={(e) => { setFMonth(Number(e.target.value)); setShowResults(false) }}
                  className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
                >
                  {MONTH_LABELS.map((m, i) => (
                    <option key={i} value={i}>{bn ? m.bn : m.en}</option>
                  ))}
                </select>
                <select
                  value={fYear}
                  onChange={(e) => { setFYear(Number(e.target.value)); setShowResults(false) }}
                  className="h-[34px] text-[13px] px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
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
        <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-[360px] overflow-y-auto bg-[var(--bg-primary)]">
          <table className="w-full text-[12.5px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '24%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="text-left px-3 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'রোল' : 'Roll'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'শ্রেণি' : 'Class'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'ফি' : 'Fee'}</th>
                <th className="text-center px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'ধরন' : 'Type'}</th>
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'মোট' : 'Total'}</th>
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'পরিশোধিত' : 'Paid'}</th>
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10">{bn ? 'বকেয়' : 'Due'}</th>
                <th className="text-right px-2 py-2 text-[10px] uppercase text-[var(--text-muted)] font-bold sticky top-0 bg-[var(--bg-secondary)] z-10"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((d, i) => (
                <tr key={`${d.studentId}-${d.feeStructureId}-${i}`} className="border-t border-[var(--border)] hover:bg-[var(--brand-light)]/40 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-[var(--text-primary)] text-[12px]">{bn ? d.studentNameBn || d.studentName : d.studentName}</p>
                  </td>
                  <td className="text-center px-2 py-2 text-[var(--text-secondary)]">{d.roll}</td>
                  <td className="text-center px-2 py-2 text-[var(--text-secondary)]">{d.class}{d.section ? `-${d.section}` : ''}</td>
                  <td className="text-center px-2 py-2">
                    <span className="font-semibold text-[var(--text-primary)] text-[11px]">{bn ? d.feeNameBn || d.feeName : d.feeName}</span>
                  </td>
                  <td className="text-center px-2 py-2">
                    <span className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                      background: feeOptions.find((f) => f.id === d.feeStructureId)?.type === 'onetime' ? 'var(--amber-light)' : 'var(--brand-light)',
                      color: feeOptions.find((f) => f.id === d.feeStructureId)?.type === 'onetime' ? 'var(--amber)' : 'var(--brand)',
                    }}>
                      {feeOptions.find((f) => f.id === d.feeStructureId)?.type === 'onetime'
                        ? (bn ? 'এককালীন' : 'One-time')
                        : (bn ? 'মাসিক' : 'Monthly')}
                    </span>
                  </td>
                  <td className="text-right px-2 py-2 text-[var(--text-secondary)]">{fmt(d.totalAmount)}</td>
                  <td className="text-right px-2 py-2 text-[var(--green)]">{fmt(d.paidAmount)}</td>
                  <td className="text-right px-2 py-2 font-semibold text-[var(--amber)]">{fmt(d.dueAmount)}</td>
                  <td className="text-right px-2 py-2">
                    <button onClick={() => onCollect(d)} className="h-7 px-2.5 rounded-lg bg-[var(--green-light)] text-[var(--green)] text-[11px] font-semibold border-0 cursor-pointer hover:bg-[var(--green)] hover:text-white transition-colors flex items-center gap-1">
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
