import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import React from 'react'
import { User, Search, ChevronDown, X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeDue, FeeStructure } from '@/store/feeStore'
import { inputCls, selectCls } from '@/lib/styles'

interface Props {
  onCollect: (due: FeeDue) => void
}

interface MonthRow {
  key: string
  feeName: string
  feeNameBn: string
  dateRange: string
  dateRangeBn: string
  amount: number
  discount: number
  remarks: string
  receivable: number
  receive: number
  structureId: string
  isOnetime: boolean
}

function generateMonthRows(
  structures: FeeStructure[],
  payments: { feeStructureId: string; amount: number; paidAt: string }[],
  waivers: { feeStructureId: string; amount: number }[],
  studentId: string,
  academicYear: string,
  monthCount: number,
  billingDate?: string
): MonthRow[] {
  const rows: MonthRow[] = []
  const months = [
    { month: 0, label: 'Jan', labelBn: 'জানুয়াঁরি', days: 31 },
    { month: 1, label: 'Feb', labelBn: 'ফেব্রুয়ারি', days: 28 },
    { month: 2, label: 'Mar', labelBn: 'মার্চ', days: 31 },
    { month: 3, label: 'Apr', labelBn: 'এপ্রিল', days: 30 },
    { month: 4, label: 'May', labelBn: 'মে', days: 31 },
    { month: 5, label: 'Jun', labelBn: 'জুন', days: 30 },
    { month: 6, label: 'Jul', labelBn: 'জুলাই', days: 31 },
    { month: 7, label: 'Aug', labelBn: 'আগস্ট', days: 31 },
    { month: 8, label: 'Sep', labelBn: 'সেপ্টেম্বর', days: 30 },
    { month: 9, label: 'Oct', labelBn: 'অক্টোবর', days: 31 },
    { month: 10, label: 'Nov', labelBn: 'নভেম্বর', days: 30 },
    { month: 11, label: 'Dec', labelBn: 'ডিসেম্বর', days: 31 },
  ]

  const year = parseInt(academicYear.split('-')[0]) || 2026
  const startMonth = billingDate ? new Date(billingDate).getMonth() : 0

  for (const struct of structures) {
    if (!struct.isActive) continue
    if (struct.type === 'onetime') {
      const paid = payments.filter((p) => p.feeStructureId === struct.id).reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers.filter((w) => w.feeStructureId === struct.id).reduce((sum, w) => sum + w.amount, 0)
      const receivable = struct.amount - paid - waived
      if (receivable <= 0) continue
      rows.push({
        key: `${struct.id}-onetime`,
        feeName: struct.name,
        feeNameBn: struct.nameBn,
        dateRange: `${academicYear}`,
        dateRangeBn: `${academicYear}`,
        amount: struct.amount,
        discount: 0,
        remarks: '',
        receivable,
        receive: receivable,
        structureId: struct.id,
        isOnetime: true,
      })
    } else {
      for (let i = 0; i < monthCount; i++) {
        const monthIdx = (startMonth + i) % 12
        const yearOffset = Math.floor((startMonth + i) / 12)
        const m = months[monthIdx]
        const currentYear = year + yearOffset
        const paid = payments
          .filter((p) => {
            if (p.feeStructureId !== struct.id) return false
            const d = new Date(p.paidAt)
            return d.getFullYear() === currentYear && d.getMonth() === monthIdx
          })
          .reduce((sum, p) => sum + p.amount, 0)
        const waived = waivers
          .filter((w) => w.feeStructureId === struct.id)
          .reduce((sum, w) => sum + w.amount, 0)
        const monthWaived = Math.min(waived, struct.amount)
        const receivable = struct.amount - paid - monthWaived
        if (receivable <= 0) continue

        const startDate = `01 ${m.label} ${currentYear}`
        const endDate = `${m.days} ${m.label} ${currentYear}`
        const startDateBn = `০১ ${m.labelBn} ${currentYear}`
        const endDateBn = `${m.days} ${m.labelBn} ${currentYear}`

        rows.push({
          key: `${struct.id}-${currentYear}-${monthIdx}`,
          feeName: struct.name,
          feeNameBn: struct.nameBn,
          dateRange: `(${startDate} - ${endDate})`,
          dateRangeBn: `(${startDateBn} - ${endDateBn})`,
          amount: struct.amount,
          discount: 0,
          remarks: '',
          receivable,
          receive: receivable,
          structureId: struct.id,
          isOnetime: false,
        })
      }
    }
  }

  return rows
}

export const CollectTab = React.memo(function CollectTab({ onCollect }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  const { structures, payments, waivers } = useFeeStore()

  const [fSession, setFSession] = useState(institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fStatus, setFStatus] = useState('all')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [monthCount, setMonthCount] = useState(3)
  const [selectedFeeType, setSelectedFeeType] = useState('')
  const [findDueTrigger, setFindDueTrigger] = useState(0)

  const [studentSearch, setStudentSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const sessionStudents = useMemo(() => {
    let list = students.filter((s) => s.academicYear === fSession)
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fSection) list = list.filter((s) => s.section === fSection)
    if (fStatus === 'active') list = list.filter((s) => s.active !== false)
    if (fStatus === 'inactive') list = list.filter((s) => s.active === false)
    return list
  }, [students, fSession, fClass, fSection, fStatus])

  const selectedStudent = useMemo(() =>
    students.find((s) => s.id === selectedStudentId) || null,
  [students, selectedStudentId])

  const dropdownStudents = useMemo(() => {
    if (!studentSearch) return sessionStudents.slice(0, 20)
    const q = studentSearch.toLowerCase()
    return sessionStudents.filter((s) =>
      s.nameEn.toLowerCase().includes(q) ||
      s.nameBn.includes(studentSearch) ||
      s.id.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [sessionStudents, studentSearch])

  const selectStudent = useCallback((id: string) => {
    const student = students.find((s) => s.id === id)
    if (student) {
      setFSession(student.academicYear || '')
      setFClass(student.class || '')
      setFSection(student.section || '')
    }
    setSelectedStudentId(id)
    setStudentSearch('')
    setIsDropdownOpen(false)
    setHighlightedIndex(-1)
    setFindDueTrigger(0)
  }, [students])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setIsDropdownOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = Math.min(prev + 1, dropdownStudents.length - 1)
          const el = dropdownRef.current?.querySelector(`[data-index="${next}"]`)
          el?.scrollIntoView({ block: 'nearest' })
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => {
          const next = Math.max(prev - 1, 0)
          const el = dropdownRef.current?.querySelector(`[data-index="${next}"]`)
          el?.scrollIntoView({ block: 'nearest' })
          return next
        })
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < dropdownStudents.length) {
          selectStudent(dropdownStudents[highlightedIndex].id)
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [isDropdownOpen, highlightedIndex, dropdownStudents, selectStudent])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const monthlyStructures = useMemo(() =>
    structures.filter((s) => s.type === 'monthly' && s.isActive && s.class === selectedStudent?.class && (!s.section || s.section === selectedStudent?.section)),
  [structures, selectedStudent])

  const feeTypes = useMemo(() => {
    const types = new Set(monthlyStructures.map((s) => s.name))
    return Array.from(types)
  }, [monthlyStructures])

  const filteredStructures = useMemo(() => {
    if (!selectedFeeType) return monthlyStructures
    return monthlyStructures.filter((s) => s.name === selectedFeeType)
  }, [monthlyStructures, selectedFeeType])

  const monthRows = useMemo(() => {
    if (!selectedStudent || findDueTrigger === 0) return []
    const studentPayments = payments.filter((p) => p.studentId === selectedStudent.id)
    const studentWaivers = waivers.filter((w) => w.studentId === selectedStudent.id)
    return generateMonthRows(filteredStructures, studentPayments, studentWaivers, selectedStudent.id, fSession, monthCount, selectedStudent.billingDate)
  }, [selectedStudent, filteredStructures, payments, waivers, fSession, monthCount, findDueTrigger])

  const totalReceivable = useMemo(() => monthRows.reduce((sum, r) => sum + r.receivable, 0), [monthRows])
  const totalReceive = useMemo(() => monthRows.reduce((sum, r) => sum + r.receive, 0), [monthRows])

  const updateRow = useCallback((_key: string, _field: 'discount' | 'remarks' | 'receive', _value: number | string) => {
    // TODO: implement local row editing state
  }, [])

  const displayRows = monthRows

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  return (
    <div className="flex flex-col h-full">
      {/* Top Filter Bar */}
      <div className="flex items-end gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'সেশন ফিল্টার' : 'Filter by Session'}</label>
          <select
            value={fSession}
            onChange={(e) => { setFSession(e.target.value); setSelectedStudentId(null) }}
            className={`${selectCls} h-9 text-xs w-full`}
          >
            {(institution?.sessions || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শ্রেণি ফিল্টার' : 'Filter by Class'}</label>
          <select
            value={fClass}
            onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedStudentId(null) }}
            className={`${selectCls} h-9 text-xs w-full`}
          >
            <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'সেকশন ফিল্টার' : 'Filter by Section'}</label>
          <select
            value={fSection}
            onChange={(e) => { setFSection(e.target.value); setSelectedStudentId(null) }}
            className={`${selectCls} h-9 text-xs w-full`}
          >
            <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'স্ট্যাটাস ফিল্টার' : 'Filter by Status'}</label>
          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className={`${selectCls} h-9 text-xs w-full`}
          >
            <option value="all">{bn ? 'সব স্ট্যাটাস' : 'All Status'}</option>
            <option value="active">{bn ? 'সক্রিয়' : 'Active'}</option>
            <option value="inactive">{bn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
          </select>
        </div>
      </div>

      {/* Student Profile Section */}
      <div className="flex items-end gap-4 mb-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
        {/* Photo */}
        <div className="w-[5rem] h-[5.5rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden flex-shrink-0">
          {selectedStudent?.photo ? (
            <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={24} className="text-[var(--text-muted)]" />
            </div>
          )}
        </div>

        {/* Student Dropdown */}
        <div className="flex-1 relative mr-2" ref={dropdownRef}>
          <label className="block text-[0.65rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শিক্ষার্থী' : 'Student'}</label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={isDropdownOpen ? studentSearch : (selectedStudent ? `${selectedStudent.nameEn} (${selectedStudent.id})` : '')}
              placeholder={bn ? 'শিক্ষার্থীর নাম বা আইডি লিখুন...' : 'Type student name or ID...'}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                setSelectedStudentId(null)
                setIsDropdownOpen(true)
                setHighlightedIndex(0)
              }}
              onFocus={() => {
                setIsDropdownOpen(true)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className={`${inputCls} h-9 text-xs w-full pr-8`}
            />
            {selectedStudent && !isDropdownOpen ? (
              <button
                onClick={() => { setSelectedStudentId(null); setStudentSearch('') }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--bg-secondary)] cursor-pointer border-0 bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={14} />
              </button>
            ) : (
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            )}
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-[12rem] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg">
              {dropdownStudents.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--text-muted)]">
                  {bn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}
                </div>
              ) : (
                dropdownStudents.map((s, i) => (
                  <button
                    key={s.id}
                    data-index={i}
                    onClick={() => selectStudent(s.id)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left border-0 cursor-pointer transition-colors ${
                      i === highlightedIndex
                        ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                        : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <img src={s.photo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.nameEn} ({s.id})</p>
                      <p className="text-[0.6rem] text-[var(--text-muted)]">{s.class} - {s.section}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Find Due Button */}
        <button
          onClick={() => { setFindDueTrigger((t) => t + 1) }}
          disabled={!selectedStudentId}
          className="flex items-center gap-1.5 px-3 h-[2.05rem] rounded-lg bg-[var(--brand)] text-white text-xs font-medium border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Search size={14} />
          {bn ? 'বকেয় খুঁজুন' : 'Find Due'}
        </button>
      </div>

      {/* Main Content: Table + Sidebar */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Fee Details Table */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-[var(--brand-light)] flex items-center justify-center">
              <span className="text-[0.65rem] font-bold text-[var(--brand)]">₹</span>
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{bn ? 'ফি বিবরণ' : 'Fee Details'}</p>
          </div>

          {!selectedStudent ? (
            <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
              <div className="text-center">
                <User size={32} className="mx-auto mb-2 opacity-50" />
                <p>{bn ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select a student to view fee details'}</p>
              </div>
            </div>
          ) : findDueTrigger === 0 ? (
            <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
              <div className="text-center">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p>{bn ? '"বকেয় খুঁজুন" বাটনে ক্লিক করুন' : 'Click "Find Due" to view dues'}</p>
              </div>
            </div>
          ) : displayRows.length === 0 ? (
            <div className="h-[14rem] flex items-center justify-center text-[var(--text-muted)] text-sm border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
              <div className="text-center">
                <p>{bn ? 'কোনো বকেয় নেই' : 'No dues found for this student'}</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[20rem] overflow-y-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[var(--bg-secondary)]">
                    <th className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={displayRows.length > 0 && displayRows.every((r) => r.receive > 0)}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--brand)]"
                      />
                    </th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[var(--text-secondary)] w-[28%]">{bn ? 'বিবরণ' : 'Particular'}</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[var(--text-secondary)] w-[12%]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[var(--text-secondary)] w-[12%]">{bn ? 'ছাড়' : 'Discount'}</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[var(--text-secondary)] w-[18%]">{bn ? 'মন্তব্য' : 'Remarks'}</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[var(--text-secondary)] w-[12%]">{bn ? 'প্রাপ্য' : 'Receivable'}</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[var(--text-secondary)] w-[12%]">{bn ? 'গ্রহণ' : 'Receive'}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, idx) => (
                    <tr key={row.key} className={`border-t border-[var(--border)] transition-colors ${idx % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/30'} hover:bg-[var(--brand-light)]/20`}>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.receive > 0}
                          onChange={() => updateRow(row.key, 'receive', row.receive > 0 ? 0 : row.receivable)}
                          className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--brand)]"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-[var(--text-primary)]">{bn ? row.feeNameBn : row.feeName}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{bn ? row.dateRangeBn : row.dateRange}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-[var(--text-primary)]">{fmt(row.amount)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          value={row.discount || ''}
                          onChange={(e) => updateRow(row.key, 'discount', Number(e.target.value) || 0)}
                          className="w-full h-7 text-[0.7rem] text-right px-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => updateRow(row.key, 'remarks', e.target.value)}
                          className="w-full h-7 text-[0.7rem] px-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20"
                          placeholder={bn ? 'মন্তব্য...' : 'Remarks...'}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[var(--text-primary)]">{fmt(row.receivable)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          value={row.receive || ''}
                          onChange={(e) => updateRow(row.key, 'receive', Number(e.target.value) || 0)}
                          className="w-full h-7 text-[0.7rem] text-right px-2 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)]/20"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Summary Footer */}
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] bg-[var(--bg-secondary)]">
                    <td colSpan={2} className="px-3 py-2.5 text-right font-semibold text-[var(--text-secondary)]">
                      {bn ? 'মোট' : 'Total'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                      {fmt(displayRows.reduce((sum, r) => sum + r.amount, 0))}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[var(--amber)]">
                      {fmt(displayRows.reduce((sum, r) => sum + r.discount, 0))}
                    </td>
                    <td></td>
                    <td className="px-3 py-2.5 text-right font-bold text-[var(--text-primary)]">
                      {fmt(displayRows.reduce((sum, r) => sum + r.receivable, 0))}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-[var(--green)]">
                      {fmt(displayRows.reduce((sum, r) => sum + r.receive, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        {selectedStudent && displayRows.length > 0 && (
          <div className="w-[12rem] flex-shrink-0">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">{bn ? 'পুনরাবৃত্ত ফি' : 'Recurring Fee'}</p>
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
              <label className="block text-[0.6rem] text-[var(--text-muted)] mb-1">{bn ? 'ফি ধরন' : 'Fee Type'}</label>
              <select
                value={selectedFeeType}
                onChange={(e) => setSelectedFeeType(e.target.value)}
                className={`${selectCls} h-7 text-[0.7rem] w-full mb-3`}
              >
                <option value="">{bn ? 'সব ফি' : 'All Fees'}</option>
                {feeTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <label className="block text-[0.6rem] text-[var(--text-muted)] mb-1">{bn ? 'মাস সংখ্যা' : 'Month Count'}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={monthCount}
                  onChange={(e) => setMonthCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                  min={1}
                  max={12}
                  className="w-12 h-7 text-[0.7rem] text-center px-1 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
                />
                <div className="flex flex-col gap-px">
                  <button
                    onClick={() => setMonthCount((c) => Math.min(12, c + 1))}
                    className="w-5 h-3.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-primary)] text-[0.55rem] text-[var(--text-muted)] leading-none"
                  >▲</button>
                  <button
                    onClick={() => setMonthCount((c) => Math.max(1, c - 1))}
                    className="w-5 h-3.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer hover:bg-[var(--bg-primary)] text-[0.55rem] text-[var(--text-muted)] leading-none"
                  >▼</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
