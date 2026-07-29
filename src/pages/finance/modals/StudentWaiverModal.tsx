import { useState, useMemo } from 'react'
import { Gift, Search, ChevronRight } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore, type StudentWaiver } from '@/store/feeStore'
import { inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { modalOverlayCls } from '@/pages/hr/utils'
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

export function StudentWaiverModal({ onSaved, onClose }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { structures, feeCategories: feeCategoriesAll, waiverCategories, addStudentWaiver } = useFeeStore()
  const { institution, classes } = useClassStore()
  const sessions = institution?.sessions || []

  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])
  const activeStructures = useMemo(() => structures.filter((s) => s.isActive), [structures])
  const activeCategories = useMemo(() => waiverCategories.filter((c) => c.isActive), [waiverCategories])
  const activeFeeCategories = useMemo(() => feeCategoriesAll.filter((c) => c.isActive), [feeCategoriesAll])

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const [step, setStep] = useState<'category' | 'details'>('category')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  const [fSession, setFSession] = useState(() => institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [search, setSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [selectedFeeCategoryId, setSelectedFeeCategoryId] = useState('')
  const [feeStructureId, setFeeStructureId] = useState('')
  const [waiverMode, setWaiverMode] = useState<'amount' | 'percent'>('amount')
  const [amount, setAmount] = useState('')
  const [percent, setPercent] = useState('')
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(new Set())
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const filteredStudents = useMemo(() => {
    let list = activeStudents
    if (fSession) list = list.filter((s) => s.academicYear === fSession)
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fSection) list = list.filter((s) => s.section === fSection)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(q) || s.roll.includes(q))
    }
    return list.sort((a, b) => a.nameEn.localeCompare(b.nameEn))
  }, [activeStudents, fSession, fClass, fSection, search])

  // Fee categories that have structures for the selected class+section
  const feeCategoriesForClass = useMemo(() => {
    let structs = activeStructures
    if (fClass) structs = structs.filter((s) => s.class === fClass)
    if (fSection) structs = structs.filter((s) => !s.section || s.section === fSection)
    const catIds = new Set(structs.filter((s) => s.categoryId).map((s) => s.categoryId))
    return activeFeeCategories.filter((c) => catIds.has(c.id))
  }, [activeStructures, activeFeeCategories, fClass, fSection])

  // Fee structures filtered by class, section, and selected fee category
  const filteredStructures = useMemo(() => {
    let list = activeStructures
    if (fClass) list = list.filter((s) => s.class === fClass)
    if (fSection) list = list.filter((s) => !s.section || s.section === fSection)
    if (selectedFeeCategoryId) list = list.filter((s) => s.categoryId === selectedFeeCategoryId)
    return list
  }, [activeStructures, fClass, fSection, selectedFeeCategoryId])

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

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id)
    setStep('details')
  }

  const handleSave = () => {
    if (!selectedCategoryId || selectedStudentIds.size === 0 || !feeStructureId || totalPerStudent <= 0 || !reason) return

    const selectedStructure = structures.find((s) => s.id === feeStructureId)
    const feeCategoryId = selectedStructure?.categoryId || ''

    const swEntries: StudentWaiver[] = Array.from(selectedStudentIds).map((sid) => ({
      id: `SWVR-${Date.now()}-${sid.slice(-4)}`,
      studentId: sid,
      waiverCategoryId: selectedCategoryId,
      feeCategoryId,
      mode: waiverMode,
      value: waiverMode === 'amount' ? Number(amount) : Number(percent),
      academicYear: institution?.currentSession || '',
      isActive: true,
      reason,
      reasonBn: reason,
      notes: notes || undefined,
      approvedBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
    }))
    swEntries.forEach((w) => addStudentWaiver(w))

    onSaved()
  }

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const canSave = selectedCategoryId && selectedStudentIds.size > 0 && feeStructureId && totalPerStudent > 0 && reason &&
    (!isMonthly || selectedMonths.size > 0) &&
    (waiverMode === 'amount' ? Number(amount) > 0 : Number(percent) > 0 && Number(percent) <= 100)

  return createPortal(
    <div className={modalOverlayCls} onClick={onClose}>
      <div className="modal-content w-[min(80vw,80rem)] max-h-[90vh] overflow-y-auto p-5 rounded-[0.875rem] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
            <Gift size={18} className="text-[var(--purple)]" />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{bn ? 'শিক্ষার্থীর জন্য ছাড় যোগ করুন' : 'Add Student Waiver'}</h3>
            <p className="text-[0.7rem] text-[var(--text-secondary)]">
              {step === 'category'
                ? (bn ? 'একটি ক্যাটাগরি বাছাই বা তৈরি করুন' : 'Select or create a category')
                : (bn ? 'শিক্ষার্থী খুঁজুন, মাস ও পরিমাণ সেট করুন' : 'Find students, set months and amount')
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
            {activeCategories.length > 0 && (
              <div className="space-y-1.5">
                {activeCategories.map((cat) => (
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
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Back button */}
            <button type="button" onClick={() => setStep('category')} className="text-[0.7rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
              ← {bn ? 'ক্যাটাগরি পরিবর্তন' : 'Change category'}
            </button>

            {/* Two-column layout */}
            <div className="flex gap-4">
              {/* Left: Student Picker */}
              <div className="flex-1 min-w-0 space-y-2">
                <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block">{bn ? 'শিক্ষার্থী নির্বাচন করুন *' : 'Select Students *'}</label>

                {/* Filters row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <select value={fSession} onChange={(e) => setFSession(e.target.value)} className={`${selectCls} !h-[30px] !text-[11px]`}>
                    <option value="">{bn ? 'সব সেশন' : 'All Sessions'}</option>
                    {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                   <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedStudentIds(new Set()); setSelectedFeeCategoryId(''); setFeeStructureId(''); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }} className={`${selectCls} !h-[30px] !text-[11px]`}>
                    <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
                    {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {fClass && (
                    <select value={fSection} onChange={(e) => { setFSection(e.target.value); setSelectedStudentIds(new Set()); setSelectedFeeCategoryId(''); setFeeStructureId(''); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }} className={`${selectCls} !h-[30px] !text-[11px]`}>
                      <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                      {(sectionsMap[fClass] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={bn ? 'নাম বা রোল দিয়ে খুঁজুন...' : 'Search by name or roll...'}
                    className={`${inputCls} w-full !h-[30px] !text-[11px] pl-8`}
                  />
                </div>

                {/* Select All / Clear */}
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] text-[var(--text-muted)]">
                    {selectedStudentIds.size > 0
                      ? `${selectedStudentIds.size} ${bn ? 'নির্বাচিত' : 'selected'}`
                      : `${filteredStudents.length} ${bn ? 'জন শিক্ষার্থী' : 'students'}`
                    }
                  </span>
                  <button type="button" onClick={toggleAllStudents} className="text-[0.65rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
                    {selectedStudentIds.size === filteredStudents.length ? (bn ? 'পরিষ্কার' : 'Clear') : (bn ? 'সব নির্বাচন' : 'Select all')}
                  </button>
                </div>

                {/* Student list */}
                <div className="max-h-[260px] overflow-y-auto border border-[var(--border)] rounded-lg">
                  {filteredStudents.length === 0 ? (
                    <p className="text-[0.7rem] text-[var(--text-muted)] py-6 text-center">{bn ? 'কোনো শিক্ষার্থী নেই' : 'No students found'}</p>
                  ) : (
                    filteredStudents.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-[var(--bg-secondary)]/50 transition-colors border-b border-[var(--border)] last:border-0 ${selectedStudentIds.has(s.id) ? 'bg-[var(--purple-light)]/30' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.has(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="accent-[var(--purple)] w-3.5 h-3.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.7rem] font-medium text-[var(--text-primary)] truncate">{bn ? s.nameBn || s.nameEn : s.nameEn}</p>
                          <p className="text-[0.6rem] text-[var(--text-muted)]">{s.class}-{s.section} · Roll: {s.roll}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Waiver Configuration */}
              <div className="w-[50%] space-y-3">
                {/* Fee Structure — Category-first flow */}
                <div>
                  <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1.5">{bn ? 'ফি কাঠামো *' : 'Fee Structure *'}</label>

                  {selectedFeeCategoryId ? (
                    /* Stage 2: Show structures within selected fee category */
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedFeeCategoryId(''); setFeeStructureId(''); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }}
                        className="text-[0.65rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold"
                      >
                        ← {bn ? 'ফি ক্যাটাগরি পরিবর্তন' : 'Change fee category'}
                      </button>
                      {filteredStructures.length === 0 ? (
                        <p className="text-[0.7rem] text-[var(--text-muted)] py-2">
                          {fClass
                            ? (bn ? `এই শ্রেণির জন্য কোনো ফি কাঠামো নেই` : 'No structures for this class')
                            : (bn ? 'কোনো ফি কাঠামো নেই' : 'No fee structures found')
                          }
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-[120px] overflow-y-auto">
                          {filteredStructures.map((s) => {
                            const isSelected = feeStructureId === s.id
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => { setFeeStructureId(s.id); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[0.7rem] cursor-pointer transition-all ${isSelected ? 'border-[var(--purple)] bg-[var(--purple-light)]' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--purple)]/50'}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--purple)]' : 'border-[var(--text-muted)]'}`}>
                                    {isSelected && <span className="w-1 h-1 rounded-full bg-[var(--purple)]" />}
                                  </span>
                                  <span className={`font-medium ${isSelected ? 'text-[var(--purple)]' : 'text-[var(--text-primary)]'}`}>
                                    {bn ? s.nameBn || s.name : s.name}
                                  </span>
                                  <span className="text-[0.55rem] text-[var(--text-muted)] px-1 py-0.5 rounded bg-[var(--bg-secondary)]">
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
                  ) : (
                    /* Stage 1: Show fee categories filtered by class */
                    <div className="space-y-1.5">
                      {fClass && (
                        <p className="text-[0.6rem] text-[var(--text-muted)]">
                          {bn ? `শ্রেণি ${fClass} এর জন্য` : `For class ${fClass}`}
                        </p>
                      )}
                      {feeCategoriesForClass.length === 0 ? (
                        <p className="text-[0.7rem] text-[var(--text-muted)] py-2">
                          {fClass
                            ? (bn ? 'এই শ্রেণির জন্য কোনো ফি ক্যাটাগরি নেই' : 'No fee categories for this class')
                            : (bn ? 'প্রথমে শ্রেণি নির্বাচন করুন' : 'Select a class first')
                          }
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-[120px] overflow-y-auto">
                          {feeCategoriesForClass.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedFeeCategoryId(cat.id)}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--purple)]/50 cursor-pointer transition-all text-left"
                            >
                              <div>
                                <p className="text-[0.7rem] font-medium text-[var(--text-primary)]">{bn ? cat.nameBn || cat.name : cat.name}</p>
                                {cat.description && <p className="text-[0.55rem] text-[var(--text-muted)] mt-0.5">{bn ? cat.descriptionBn || cat.description : cat.description}</p>}
                              </div>
                              <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Month Selection */}
                {isMonthly && selectedFee && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)]">{bn ? 'মাস বাছাই *' : 'Select Months *'}</label>
                      <button type="button" onClick={toggleAllMonths} className="text-[0.65rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
                        {selectedMonths.size === 12 ? (bn ? 'পরিষ্কার' : 'Clear') : (bn ? 'সব নির্বাচন' : 'Select all')}
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {MONTH_LABELS.map((label, m) => {
                        const isActive = selectedMonths.has(m)
                        return (
                          <button key={m} type="button" onClick={() => toggleMonth(m)} className={`px-1.5 py-1.5 rounded-lg text-[0.6rem] font-medium border cursor-pointer transition-all ${isActive ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]'}`}>
                            {bn ? label.bn : label.en}
                          </button>
                        )
                      })}
                    </div>
                    {selectedMonths.size > 0 && (
                      <p className="text-[0.6rem] text-[var(--text-muted)] mt-1">
                        {selectedMonths.size} {bn ? 'মাস নির্বাচিত' : 'months selected'}
                      </p>
                    )}
                  </div>
                )}

                {/* Waiver Mode */}
                {selectedFee && (
                  <div>
                    <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'ছাড়ের ধরন' : 'Waiver Type'}</label>
                    <div className="flex gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => { setWaiverMode('amount'); setPercent('') }}
                        className={`flex-1 py-1.5 rounded-lg text-[0.65rem] font-semibold border cursor-pointer transition-all ${waiverMode === 'amount' ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]'}`}
                      >
                        {bn ? 'পরিমাণ (৳)' : 'Amount (৳)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWaiverMode('percent'); setAmount('') }}
                        className={`flex-1 py-1.5 rounded-lg text-[0.65rem] font-semibold border cursor-pointer transition-all ${waiverMode === 'percent' ? 'bg-[var(--purple)] text-white border-[var(--purple)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]'}`}
                      >
                        {bn ? 'শতাংশ (%)' : 'Percent (%)'}
                      </button>
                    </div>

                    {waiverMode === 'amount' ? (
                      <input type="number" min="1" max={selectedFee.amount} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full !h-[30px] !text-[11px]`} placeholder={bn ? `সর্বোচ্চ ${fmt(selectedFee.amount)}` : `Max ${fmt(selectedFee.amount)}`} />
                    ) : (
                      <div className="relative">
                        <input type="number" min="1" max="100" value={percent} onChange={(e) => setPercent(e.target.value)} className={`${inputCls} w-full !h-[30px] !text-[11px] pr-7`} placeholder="10" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.7rem] text-[var(--text-muted)] font-semibold">%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'কারণ *' : 'Reason *'}</label>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} w-full !h-[30px] !text-[11px]`} placeholder={bn ? 'যেমন: বৃত্তি, এতিম' : 'e.g. Scholarship, Orphan'} />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[0.7rem] font-semibold text-[var(--text-secondary)] block mb-1">{bn ? 'নোট (ঐচ্ছিক)' : 'Notes (optional)'}</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} w-full !text-[11px] min-h-[48px] resize-none`} placeholder={bn ? 'অতিরিক্ত তথ্য...' : 'Additional info...'} rows={2} />
                </div>

                {/* Summary */}
                {selectedFee && totalWaiver > 0 && (
                  <div className="p-2.5 rounded-lg bg-[var(--purple-light)] text-[0.7rem] space-y-1">
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
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-[var(--border)]">
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
