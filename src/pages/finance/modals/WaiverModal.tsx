import { useState, useMemo } from 'react'
import { Gift, Plus } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore, type WaiverCategory, type WaiverEntry } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls, modalStyleCls } from '@/pages/hr/utils'
import { createPortal } from 'react-dom'

interface Props {
  onSaved: () => void
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
  const { structures, waiverCategories, addWaiverCategory, addWaiverEntries } = useFeeStore()
  const classes = useClassStore((s) => s.classes)

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])
  const activeStructures = useMemo(() => structures.filter((s) => s.isActive), [structures])
  const activeCategories = useMemo(() => waiverCategories.filter((c) => c.isActive), [waiverCategories])

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [step, setStep] = useState<'category' | 'details'>('category')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatNameBn, setNewCatNameBn] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [newCatDescBn, setNewCatDescBn] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [feeStructureId, setFeeStructureId] = useState('')
  const [waiverMode, setWaiverMode] = useState<'amount' | 'percent'>('amount')
  const [amount, setAmount] = useState('')
  const [percent, setPercent] = useState('')
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set())
  const [reason, setReason] = useState('')
  const [reasonBn, setReasonBn] = useState('')

  const filteredStudents = useMemo(() => {
    let list = activeStudents
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fSection) list = list.filter((s) => s.section === fSection)
    return list
  }, [activeStudents, fClass, fSection])

  const selectedFee = useMemo(() => activeStructures.find((s) => s.id === feeStructureId) || null, [activeStructures, feeStructureId])
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

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === filteredStudents.length) setSelectedStudentIds(new Set())
    else setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)))
  }

  const perPeriodAmount = useMemo(() => {
    if (!selectedFee) return 0
    if (waiverMode === 'percent') {
      const pct = Number(percent) || 0
      return Math.round(selectedFee.amount * pct / 100)
    }
    return Number(amount) || 0
  }, [selectedFee, waiverMode, amount, percent])

  const monthCount = isMonthly ? selectedMonths.size : 1
  const totalPerStudent = perPeriodAmount * monthCount
  const totalWaiver = totalPerStudent * selectedStudentIds.size

  const handleCreateCategory = () => {
    if (!newCatName) return
    const cat: WaiverCategory = {
      id: `WCAT-${Date.now()}`,
      name: newCatName,
      nameBn: newCatNameBn || newCatName,
      description: newCatDesc,
      descriptionBn: newCatDescBn || newCatDesc,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    }
    addWaiverCategory(cat)
    setSelectedCategoryId(cat.id)
    setShowNewCategory(false)
    setNewCatName('')
    setNewCatNameBn('')
    setNewCatDesc('')
    setNewCatDescBn('')
    setStep('details')
  }

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id)
    setStep('details')
  }

  const handleSave = () => {
    if (!selectedCategoryId || selectedStudentIds.size === 0 || !feeStructureId || totalPerStudent <= 0 || !reason) return
    const entries: WaiverEntry[] = Array.from(selectedStudentIds).map((sid) => ({
      id: `WENT-${Date.now()}-${sid.slice(-4)}`,
      categoryId: selectedCategoryId,
      studentId: sid,
      feeStructureId,
      mode: waiverMode,
      value: waiverMode === 'amount' ? Number(amount) : Number(percent),
      months: isMonthly ? Array.from(selectedMonths) : [],
      reason,
      reasonBn: reasonBn || reason,
      approvedBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
    }))
    addWaiverEntries(entries)
    onSaved()
  }

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const canSave = selectedCategoryId && selectedStudentIds.size > 0 && feeStructureId && totalPerStudent > 0 && reason &&
    (!isMonthly || selectedMonths.size > 0) &&
    (waiverMode === 'amount' ? Number(amount) > 0 : Number(percent) > 0 && Number(percent) <= 100)

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className={`modal-content ${modalStyleCls} max-w-[34rem] max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
            <Gift size={18} className="text-[var(--purple)]" />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'ফি ছাড় যোগ করুন' : 'Add Fee Waiver'}</h3>
            <p className="text-[0.7rem] text-[var(--text-secondary)]">
              {step === 'category'
                ? (bn ? 'একটি ক্যাটাগরি বাছাই বা তৈরি করুন' : 'Select or create a category')
                : (bn ? 'শিক্ষার্থী এবং ফি নির্বাচন করুন' : 'Select students and fee')
              }
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-1.5 text-[0.7rem] font-semibold ${step === 'category' ? 'text-[var(--purple)]' : 'text-[var(--text-muted)]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${step === 'category' ? 'bg-[var(--purple)] text-white' : 'bg-[var(--purple-light)] text-[var(--purple)]'}`}>1</span>
            {bn ? 'ক্যাটাগরি' : 'Category'}
          </div>
          <div className="flex-1 h-px bg-[var(--border)]" />
          <div className={`flex items-center gap-1.5 text-[0.7rem] font-semibold ${step === 'details' ? 'text-[var(--purple)]' : 'text-[var(--text-muted)]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold ${step === 'details' ? 'bg-[var(--purple)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>2</span>
            {bn ? 'বিবরণ' : 'Details'}
          </div>
        </div>

        {step === 'category' ? (
          <div className="space-y-3">
            {/* Existing Categories */}
            {activeCategories.length > 0 && (
              <div className="space-y-1.5">
                {activeCategories.map((cat) => {
                  const entryCount = /* will be computed from store */ 0
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--purple)]/50 cursor-pointer transition-all text-left"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{bn ? cat.nameBn || cat.name : cat.name}</p>
                        {cat.description && <p className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{bn ? cat.descriptionBn || cat.description : cat.description}</p>}
                      </div>
                      <span className="text-[0.65rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded">{entryCount} {bn ? 'জন' : 'students'}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Create New Category */}
            {showNewCategory ? (
              <div className="p-3 rounded-xl border border-[var(--purple)] bg-[var(--purple-light)]/30 space-y-2">
                <p className="text-[0.7rem] font-semibold text-[var(--purple)]">{bn ? 'নতুন ক্যাটাগরি তৈরি' : 'Create New Category'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[0.65rem] text-[var(--text-muted)] block mb-0.5">Name *</label>
                    <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className={`${inputCls} w-full text-xs h-8`} placeholder="e.g. Orphan" />
                  </div>
                  <div>
                    <label className="text-[0.65rem] text-[var(--text-muted)] block mb-0.5">নাম</label>
                    <input value={newCatNameBn} onChange={(e) => setNewCatNameBn(e.target.value)} className={`${inputCls} w-full text-xs h-8`} placeholder="e.g. এতিম" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[0.65rem] text-[var(--text-muted)] block mb-0.5">Description</label>
                    <input value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} className={`${inputCls} w-full text-xs h-8`} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="text-[0.65rem] text-[var(--text-muted)] block mb-0.5">বিবরণ</label>
                    <input value={newCatDescBn} onChange={(e) => setNewCatDescBn(e.target.value)} className={`${inputCls} w-full text-xs h-8`} placeholder="ঐচ্ছিক" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNewCategory(false)} className="text-[0.7rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-0">{bn ? 'বাতিল' : 'Cancel'}</button>
                  <button onClick={handleCreateCategory} disabled={!newCatName} className={`${btnPrimary} text-xs py-1.5 px-3 disabled:opacity-50`}>{bn ? 'তৈরি করুন' : 'Create'}</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[var(--purple)] text-[var(--purple)] text-xs font-medium cursor-pointer hover:bg-[var(--purple-light)]/30 transition-all"
              >
                <Plus size={13} /> {bn ? 'নতুন ক্যাটাগরি তৈরি করুন' : 'Create New Category'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Back button */}
            <button type="button" onClick={() => setStep('category')} className="text-[0.7rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
              ← {bn ? 'ক্যাটাগরি পরিবর্তন' : 'Change category'}
            </button>

            {/* Class + Section */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'শ্রেণি' : 'Class'}</label>
                <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedStudentIds(new Set()) }} className={`${selectCls} w-full text-xs`}>
                  <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
                  {classOptions.map((c) => <option key={c} value={c}>{bn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'সেকশন' : 'Section'}</label>
                <select value={fSection} onChange={(e) => { setFSection(e.target.value); setSelectedStudentIds(new Set()) }} className={`${selectCls} w-full text-xs`} disabled={!fClass}>
                  <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                  {fClass && (sectionsMap[fClass] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Student Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)]">{bn ? `শিক্ষার্থী * (${selectedStudentIds.size} নির্বাচিত)` : `Students * (${selectedStudentIds.size} selected)`}</label>
                <button type="button" onClick={toggleAllStudents} className="text-[0.65rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
                  {selectedStudentIds.size === filteredStudents.length ? (bn ? 'পরিষ্কার' : 'Clear') : (bn ? 'সব নির্বাচন' : 'Select all')}
                </button>
              </div>
              <div className="max-h-[120px] overflow-y-auto border border-[var(--border)] rounded-lg">
                {filteredStudents.length === 0 ? (
                  <p className="text-[0.7rem] text-[var(--text-muted)] py-3 text-center">{bn ? 'কোনো শিক্ষার্থী নেই' : 'No students found'}</p>
                ) : (
                  filteredStudents.map((s) => (
                    <label key={s.id} className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-[var(--bg-secondary)]/50 transition-colors border-b border-[var(--border)] last:border-0 ${selectedStudentIds.has(s.id) ? 'bg-[var(--purple-light)]/30' : ''}`}>
                      <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleStudent(s.id)} className="accent-[var(--purple)] w-3.5 h-3.5" />
                      <span className="text-[0.7rem] text-[var(--text-primary)]">{s.nameEn}</span>
                      <span className="text-[0.6rem] text-[var(--text-muted)] ml-auto">{s.class}-{s.section}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Fee Category Cards */}
            <div>
              <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1.5">{bn ? 'ফি ক্যাটাগরি *' : 'Fee Category *'}</label>
              {activeStructures.length === 0 ? (
                <p className="text-[0.7rem] text-[var(--text-muted)] py-2">{bn ? 'কোনো ফি কাঠামো নেই' : 'No fee structures found'}</p>
              ) : (
                <div className="space-y-1.5">
                  {activeStructures.map((s) => {
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
                    <input type="number" min="1" max={selectedFee.amount} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full text-xs`} placeholder={bn ? `সর্বোচ্চ ${fmt(selectedFee.amount)}` : `Max ${fmt(selectedFee.amount)}`} />
                    {Number(amount) > selectedFee.amount && <p className="text-[0.65rem] text-[var(--red)] mt-1">{bn ? 'ছাড় ফির পরিমাণের বেশি হতে পারে না' : 'Cannot exceed fee amount'}</p>}
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <input type="number" min="1" max="100" value={percent} onChange={(e) => setPercent(e.target.value)} className={`${inputCls} w-full text-xs pr-8`} placeholder="10" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.7rem] text-[var(--text-muted)] font-semibold">%</span>
                    </div>
                    {Number(percent) > 100 && <p className="text-[0.65rem] text-[var(--red)] mt-1">{bn ? 'শতাংশ ১০০-এর বেশি হতে পারে না' : 'Cannot exceed 100%'}</p>}
                    {Number(percent) > 0 && Number(percent) <= 100 && (
                      <p className="text-[0.65rem] text-[var(--text-muted)] mt-1">{bn ? `প্রতি মাসে ${fmt(perPeriodAmount)}` : `${fmt(perPeriodAmount)} per month`}</p>
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
                <p className="text-[0.6rem] text-[var(--purple)]/70 text-right">
                  {fmt(perPeriodAmount)} × {selectedStudentIds.size} {bn ? 'শিক্ষার্থী' : 'students'}
                  {isMonthly && selectedMonths.size > 1 && ` × ${selectedMonths.size} ${bn ? 'মাস' : 'months'}`}
                </p>
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
        )}

        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer font-[inherit]">{bn ? 'বাতিল' : 'Cancel'}</button>
          {step === 'details' && (
            <button onClick={handleSave} disabled={!canSave} className={`${btnPrimary} disabled:opacity-50`}>{bn ? 'সংরক্ষণ' : 'Save'}</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
