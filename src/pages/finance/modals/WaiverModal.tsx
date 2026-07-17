import { useState, useMemo } from 'react'
import { Gift } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeeWaiver } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface Props {
  onSaved: (waiver: FeeWaiver) => void
  onClose: () => void
}

const MONTH_LABELS = [
  { en: 'Jan', bn: 'জানু' }, { en: 'Feb', bn: 'ফেব' }, { en: 'Mar', bn: 'মার্চ' },
  { en: 'Apr', bn: 'এপ্রি' }, { en: 'May', bn: 'মে' }, { en: 'Jun', bn: 'জুন' },
  { en: 'Jul', bn: 'জুলা' }, { en: 'Aug', bn: 'আগ' }, { en: 'Sep', bn: 'সেপ্ট' },
  { en: 'Oct', bn: 'অক্টো' }, { en: 'Nov', bn: 'নভে' }, { en: 'Dec', bn: 'ডিসে' },
]

export function WaiverModal({ onSaved, onClose }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { structures } = useFeeStore()
  const { institution } = useClassStore()
  const classes = useClassStore((s) => s.classes)

  const fSession = institution?.currentSession || ''
  const fYear = parseInt(fSession.split('-')[0]) || new Date().getFullYear()

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])
  const activeStructures = useMemo(() => structures.filter((s) => s.isActive), [structures])

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [studentId, setStudentId] = useState('')
  const [feeStructureId, setFeeStructureId] = useState('')
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set())
  const [waiverMode, setWaiverMode] = useState<'amount' | 'percent'>('amount')
  const [amount, setAmount] = useState('')
  const [percent, setPercent] = useState('')
  const [reason, setReason] = useState('')
  const [reasonBn, setReasonBn] = useState('')

  const filteredStudents = useMemo(() => {
    let list = activeStudents
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fSection) list = list.filter((s) => s.section === fSection)
    return list
  }, [activeStudents, fClass, fSection])

  const selectedStudent = useMemo(() => activeStudents.find((s) => s.id === studentId), [activeStudents, studentId])

  const studentFeeStructures = useMemo(() => {
    if (!selectedStudent) return []
    return activeStructures.filter((s) => s.class === selectedStudent.class)
  }, [activeStructures, selectedStudent])

  const selectedFee = useMemo(() => studentFeeStructures.find((s) => s.id === feeStructureId) || null, [studentFeeStructures, feeStructureId])
  const isMonthly = selectedFee?.type === 'monthly'

  const toggleMonth = (m: number) => {
    setSelectedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(m)) next.delete(m)
      else next.add(m)
      return next
    })
  }

  const toggleAllMonths = () => {
    if (selectedMonths.size === 12) setSelectedMonths(new Set())
    else setSelectedMonths(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]))
  }

  const perMonthAmount = useMemo(() => {
    if (!selectedFee) return 0
    if (waiverMode === 'percent') {
      const pct = Number(percent) || 0
      return Math.round(selectedFee.amount * pct / 100)
    }
    return Number(amount) || 0
  }, [selectedFee, waiverMode, amount, percent])

  const monthCount = isMonthly ? selectedMonths.size : 1
  const totalWaiver = perMonthAmount * monthCount

  const handleSave = () => {
    if (!studentId || !feeStructureId || !reason) return
    if (totalWaiver <= 0) return

    if (isMonthly) {
      if (selectedMonths.size === 0) return
      for (const m of selectedMonths) {
        const monthKey = `${fYear}-${String(m + 1).padStart(2, '0')}`
        onSaved({
          id: `WVR-${Date.now()}-${m}`,
          studentId,
          feeStructureId,
          amount: perMonthAmount,
          reason,
          reasonBn: reasonBn || reason,
          approvedBy: 'admin',
          createdAt: new Date().toISOString().split('T')[0],
          forMonth: monthKey,
        })
      }
    } else {
      onSaved({
        id: `WVR-${Date.now()}`,
        studentId,
        feeStructureId,
        amount: perMonthAmount,
        reason,
        reasonBn: reasonBn || reason,
        approvedBy: 'admin',
        createdAt: new Date().toISOString().split('T')[0],
      })
    }
  }

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const canSave = useMemo(() => {
    if (!studentId || !feeStructureId || !reason) return false
    if (totalWaiver <= 0) return false
    if (isMonthly && selectedMonths.size === 0) return false
    return true
  }, [studentId, feeStructureId, reason, totalWaiver, isMonthly, selectedMonths])

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[32rem] max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
            <Gift size={18} className="text-[var(--purple)]" />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'ফি ছাড় যোগ করুন' : 'Add Fee Waiver'}</h3>
            <p className="text-[0.7rem] text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থীর ফি থেকে ছাড় প্রদান করুন' : 'Grant a fee discount to a student'}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Class + Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'শ্রেণি' : 'Class'}</label>
              <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); setStudentId(''); setFeeStructureId(''); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }} className={`${selectCls} w-full text-xs`}>
                <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
                {classOptions.map((c) => <option key={c} value={c}>{bn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'সেকশন' : 'Section'}</label>
              <select value={fSection} onChange={(e) => { setFSection(e.target.value); setStudentId(''); setFeeStructureId(''); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }} className={`${selectCls} w-full text-xs`} disabled={!fClass}>
                <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                {fClass && (sectionsMap[fClass] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Student */}
          <div>
            <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'শিক্ষার্থী *' : 'Student *'}</label>
            <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setFeeStructureId(''); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }} className={`${selectCls} w-full text-xs`}>
              <option value="">{bn ? 'শিক্ষার্থী বাছাই' : 'Select student'} ({filteredStudents.length})</option>
              {filteredStudents.map((s) => <option key={s.id} value={s.id}>{s.nameEn} ({s.class} - {s.section})</option>)}
            </select>
          </div>

          {/* Fee Category Cards */}
          {selectedStudent && (
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1.5">{bn ? 'ফি ক্যাটাগরি *' : 'Fee Category *'}</label>
              {studentFeeStructures.length === 0 ? (
                <p className="text-[0.7rem] text-[var(--text-muted)] py-2">{bn ? 'এই শ্রেণিতে কোনো ফি কাঠামো নেই' : 'No fee structures for this class'}</p>
              ) : (
                <div className="space-y-1.5">
                  {studentFeeStructures.map((s) => {
                    const isSelected = feeStructureId === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setFeeStructureId(s.id); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${isSelected ? 'border-[var(--purple)] bg-[var(--purple-light)]' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--purple)]/50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--purple)]' : 'border-[var(--text-muted)]'}`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]" />}
                          </span>
                          <span className={`font-medium ${isSelected ? 'text-[var(--purple)]' : 'text-[var(--text-primary)]'}`}>
                            {bn ? s.nameBn || s.name : s.name}
                          </span>
                          <span className="text-[0.6rem] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)]">
                            {s.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')}
                          </span>
                        </div>
                        <span className={`font-semibold ${isSelected ? 'text-[var(--purple)]' : 'text-[var(--text-secondary)]'}`}>
                          {fmt(s.amount)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Month Selection for Monthly Fees */}
          {isMonthly && selectedFee && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)]">{bn ? 'মাস বাছাই করুন *' : 'Select Months *'}</label>
                <button type="button" onClick={toggleAllMonths} className="text-[0.65rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
                  {selectedMonths.size === 12 ? (bn ? 'পরিষ্কার' : 'Clear') : (bn ? 'সব নির্বাচন' : 'Select all')}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTH_LABELS.map((label, m) => {
                  const isActive = selectedMonths.has(m)
                  return (
                    <button key={m} type="button" onClick={() => toggleMonth(m)} className={`px-2 py-1.5 rounded-lg text-[0.65rem] font-medium border cursor-pointer transition-all ${isActive ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]'}`}>
                      {bn ? label.bn : label.en}
                    </button>
                  )
                })}
              </div>
              {selectedMonths.size > 0 && (
                <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">
                  {selectedMonths.size} {bn ? 'মাস নির্বাচিত' : 'months selected'}
                </p>
              )}
            </div>
          )}

          {/* Waiver Mode Toggle + Amount */}
          {selectedFee && (
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1.5">{bn ? 'ছাড়ের ধরন' : 'Waiver Type'}</label>
              <div className="flex gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => { setWaiverMode('amount'); setPercent('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${waiverMode === 'amount' ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]'}`}
                >
                  {bn ? 'পরিমাণ (৳)' : 'Amount (৳)'}
                </button>
                <button
                  type="button"
                  onClick={() => { setWaiverMode('percent'); setAmount('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${waiverMode === 'percent' ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]'}`}
                >
                  {bn ? 'শতাংশ (%)' : 'Percent (%)'}
                </button>
              </div>

              {waiverMode === 'amount' ? (
                <div>
                  <input
                    type="number"
                    min="1"
                    max={selectedFee.amount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`${inputCls} w-full text-xs`}
                    placeholder={bn ? `সর্বোচ্চ ${fmt(selectedFee.amount)}` : `Max ${fmt(selectedFee.amount)}`}
                  />
                  {Number(amount) > selectedFee.amount && (
                    <p className="text-[0.65rem] text-[var(--red)] mt-1">{bn ? 'ছাড় ফির পরিমাণের বেশি হতে পারে না' : 'Cannot exceed fee amount'}</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={percent}
                      onChange={(e) => setPercent(e.target.value)}
                      className={`${inputCls} w-full text-xs pr-8`}
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] text-[var(--text-muted)] font-semibold">%</span>
                  </div>
                  {Number(percent) > 100 && (
                    <p className="text-[0.65rem] text-[var(--red)] mt-1">{bn ? 'শতাংশ ১০০-এর বেশি হতে পারে না' : 'Cannot exceed 100%'}</p>
                  )}
                  {Number(percent) > 0 && Number(percent) <= 100 && (
                    <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">
                      {bn ? `প্রতি মাসে ${fmt(perMonthAmount)}` : `${fmt(perMonthAmount)} per month`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Total Waiver */}
          {selectedFee && totalWaiver > 0 && (
            <div className="p-2.5 rounded-lg bg-[var(--purple-light)] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--purple)] font-semibold">{bn ? 'মোট ছাড়' : 'Total Waiver'}</span>
                <span className="font-bold text-[var(--purple)] text-sm">{fmt(totalWaiver)}</span>
              </div>
              {isMonthly && selectedMonths.size > 1 && (
                <p className="text-[0.6rem] text-[var(--purple)]/70 text-right">
                  {fmt(perMonthAmount)} × {selectedMonths.size} {bn ? 'মাস' : 'months'}
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'কারণ (EN) *' : 'Reason *'}</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="Scholarship" />
            </div>
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'কারণ (BN)' : 'Reason (BN)'}</label>
              <input value={reasonBn} onChange={(e) => setReasonBn(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder="বৃত্তি" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{bn ? 'বাতিল' : 'Cancel'}</button>
          <button onClick={handleSave} disabled={!canSave} className={`${btnPrimary} disabled:opacity-50`}>{bn ? 'সংরক্ষণ' : 'Save'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
