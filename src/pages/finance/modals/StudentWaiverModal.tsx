import { useState, useMemo, useEffect } from 'react'
import { Gift, Search, ChevronRight, X, Check, Calendar, DollarSign, Users } from 'lucide-react'
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

  // Derive effective class/section from selected students (for fee structure filtering)
  const effectiveClass = useMemo(() => {
    if (selectedStudentIds.size === 0) return fClass
    const selectedStudents = activeStudents.filter((s) => selectedStudentIds.has(s.id))
    const classes = new Set(selectedStudents.map((s) => s.class))
    if (classes.size === 1) return Array.from(classes)[0]
    return fClass
  }, [selectedStudentIds, activeStudents, fClass])

  const effectiveSection = useMemo(() => {
    if (selectedStudentIds.size === 0) return fSection
    const selectedStudents = activeStudents.filter((s) => selectedStudentIds.has(s.id))
    const sections = new Set(selectedStudents.map((s) => s.section))
    if (sections.size === 1) return Array.from(sections)[0]
    return fSection
  }, [selectedStudentIds, activeStudents, fSection])

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

  // Fee categories that have structures for the effective class+section
  const feeCategoriesForClass = useMemo(() => {
    let structs = activeStructures
    if (effectiveClass) structs = structs.filter((s) => s.class === effectiveClass)
    if (effectiveSection) structs = structs.filter((s) => !s.section || s.section === effectiveSection)
    const catIds = new Set(structs.filter((s) => s.categoryId).map((s) => s.categoryId))
    return activeFeeCategories.filter((c) => catIds.has(c.id))
  }, [activeStructures, activeFeeCategories, effectiveClass, effectiveSection])

  // Fee structures filtered by effective class, section, and selected fee category
  const filteredStructures = useMemo(() => {
    let list = activeStructures
    if (effectiveClass) list = list.filter((s) => s.class === effectiveClass)
    if (effectiveSection) list = list.filter((s) => !s.section || s.section === effectiveSection)
    if (selectedFeeCategoryId) list = list.filter((s) => s.categoryId === selectedFeeCategoryId)
    return list
  }, [activeStructures, effectiveClass, effectiveSection, selectedFeeCategoryId])

  // Auto-select class/section when students are selected
  useEffect(() => {
    if (selectedStudentIds.size > 0 && !fClass) {
      const selectedStudents = activeStudents.filter((s) => selectedStudentIds.has(s.id))
      const classes = new Set(selectedStudents.map((s) => s.class))
      if (classes.size === 1) {
        setFClass(Array.from(classes)[0])
        const sections = new Set(selectedStudents.map((s) => s.section))
        if (sections.size === 1) {
          setFSection(Array.from(sections)[0])
        }
      }
    }
  }, [selectedStudentIds, activeStudents, fClass])

  // Reset fee selection when effective class/section changes
  useEffect(() => {
    setSelectedFeeCategoryId('')
    setFeeStructureId('')
    setAmount('')
    setPercent('')
    setSelectedMonths(new Set())
  }, [effectiveClass, effectiveSection])

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

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === filteredStudents.length) setSelectedStudentIds(new Set())
    else setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)))
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
      <div className="modal-content w-[min(85vw,85rem)] h-[80vh] overflow-hidden flex flex-col rounded-2xl bg-[var(--bg-primary)] border border-[var(--glass-border)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--purple)] to-[var(--purple)]/70 flex items-center justify-center shadow-md shadow-[var(--purple)]/20">
              <Gift size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{bn ? 'শিক্ষার্থীর জন্য ছাড় যোগ করুন' : 'Add Student Waiver'}</h3>
              <p className="text-[0.75rem] text-[var(--text-muted)]">
                {step === 'category'
                  ? (bn ? 'একটি ক্যাটাগরি বাছাই করুন' : 'Select a category')
                  : (bn ? 'শিক্ষার্থী খুঁজুন, মাস ও পরিমাণ সেট করুন' : 'Find students, set months and amount')
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer border-0 bg-transparent transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)]/30">
          <div className="flex items-center gap-2.5 max-w-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.8rem] font-bold transition-all ${step === 'category' ? 'bg-[var(--purple)] text-white shadow-sm shadow-[var(--purple)]/30' : 'bg-[var(--purple-light)] text-[var(--purple)]'}`}>
                {step === 'details' ? <Check size={10} /> : '1'}
              </span>
              <span className={`text-[0.8rem] font-semibold ${step === 'category' ? 'text-[var(--purple)]' : 'text-[var(--text-muted)]'}`}>
                {bn ? 'ক্যাটাগরি' : 'Category'}
              </span>
            </div>
            <div className={`flex-1 h-0.5 rounded-full transition-colors ${step === 'details' ? 'bg-[var(--purple)]' : 'bg-[var(--border)]'}`} />
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.8rem] font-bold transition-all ${step === 'details' ? 'bg-[var(--purple)] text-white shadow-sm shadow-[var(--purple)]/30' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                2
              </span>
              <span className={`text-[0.8rem] font-semibold ${step === 'details' ? 'text-[var(--purple)]' : 'text-[var(--text-muted)]'}`}>
                {bn ? 'বিবরণ' : 'Details'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {step === 'category' ? (
            <div className="space-y-2">
              {activeCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {activeCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--purple)]/50 hover:bg-[var(--purple-light)]/10 cursor-pointer transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--purple-light)] flex items-center justify-center group-hover:bg-[var(--purple)]/20 transition-colors">
                        <Gift size={14} className="text-[var(--purple)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8rem] font-semibold text-[var(--text-primary)] truncate">{bn ? cat.nameBn || cat.name : cat.name}</p>
                        {cat.description && <p className="text-[0.8rem] text-[var(--text-muted)] mt-0.5 truncate">{bn ? cat.descriptionBn || cat.description : cat.description}</p>}
                      </div>
                      <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--purple)] transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-3">
                    <Gift size={24} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{bn ? 'কোনো ক্যাটাগরি নেই' : 'No categories found'}</p>
                  <p className="text-[0.75rem] text-[var(--text-muted)] mt-1">{bn ? 'প্রথমে ক্যাটাগরি তৈরি করুন' : 'Create a category first'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Back button */}
              <button type="button" onClick={() => setStep('category')} className="flex items-center gap-1 text-[0.8rem] text-[var(--brand)] hover:text-[var(--brand)]/80 cursor-pointer bg-transparent border-0 p-0 font-semibold transition-colors">
                <span className="text-sm leading-none">←</span> {bn ? 'ক্যাটাগরি পরিবর্তন' : 'Change category'}
              </button>

              {/* Two-column layout */}
              <div className="flex gap-4">
                {/* Left: Student Picker */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[0.8rem] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Users size={12} className="text-[var(--purple)]" />
                      {bn ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select Students'}
                    </label>
                    <button type="button" onClick={toggleAllStudents} className="text-[0.75rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
                      {selectedStudentIds.size === filteredStudents.length ? (bn ? 'পরিষ্কার' : 'Clear') : (bn ? 'সব নির্বাচন' : 'Select all')}
                    </button>
                  </div>

                  {/* Filters row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <select value={fSession} onChange={(e) => setFSession(e.target.value)} className={`${selectCls} !h-[28px] !text-[0.75rem]`}>
                      <option value="">{bn ? 'সব সেশন' : 'All Sessions'}</option>
                      {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection(''); setSelectedStudentIds(new Set()) }} className={`${selectCls} !h-[28px] !text-[0.75rem]`}>
                      <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
                      {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {fClass && (
                      <select value={fSection} onChange={(e) => { setFSection(e.target.value); setSelectedStudentIds(new Set()) }} className={`${selectCls} !h-[28px] !text-[0.75rem]`}>
                        <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                        {(sectionsMap[fClass] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={bn ? 'নাম বা রোল দিয়ে খুঁজুন...' : 'Search by name or roll...'}
                      className={`${inputCls} w-full !h-[28px] !text-[0.75rem] pl-7`}
                    />
                  </div>

                  {/* Selected count */}
                  {selectedStudentIds.size > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--purple-light)]/30 border border-[var(--purple)]/20">
                      <span className="text-[0.75rem] font-semibold text-[var(--purple)]">{selectedStudentIds.size}</span>
                      <span className="text-[0.8rem] text-[var(--purple)]/70">{bn ? 'জন শিক্ষার্থী নির্বাচিত' : 'students selected'}</span>
                    </div>
                  )}

                  {/* Student list */}
                  <div className="max-h-[260px] overflow-y-auto border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                    {filteredStudents.length === 0 ? (
                      <p className="text-[0.75rem] text-[var(--text-muted)] py-6 text-center">{bn ? 'কোনো শিক্ষার্থী নেই' : 'No students found'}</p>
                    ) : (
                      filteredStudents.map((s) => {
                        const isSelected = selectedStudentIds.has(s.id)
                        return (
                          <label
                            key={s.id}
                            onClick={() => toggleStudent(s.id)}
                            className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer transition-all ${isSelected ? 'bg-[var(--purple-light)]/20' : 'hover:bg-[var(--bg-secondary)]/50'}`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--purple)] border-[var(--purple)]' : 'border-[var(--border)]'}`}>
                              {isSelected && <Check size={10} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[0.8rem] font-medium text-[var(--text-primary)] truncate">{bn ? s.nameBn || s.nameEn : s.nameEn}</p>
                              <p className="text-[0.8rem] text-[var(--text-muted)]">{s.class}-{s.section} · Roll: {s.roll}</p>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Right: Waiver Configuration */}
                <div className="w-[45%] space-y-3">
                  {/* Fee Structure — Category-first flow */}
                  <div>
                    <label className="text-[0.8rem] font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mb-1.5">
                      <DollarSign size={12} className="text-[var(--purple)]" />
                      {bn ? 'ফি কাঠামো' : 'Fee Structure'}
                    </label>

                    {effectiveClass && (
                      <div className="flex items-center gap-1.5 mb-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-secondary)]/50 border border-[var(--border)]">
                        <span className="text-[0.8rem] text-[var(--text-muted)]">{bn ? 'শ্রেণি' : 'Class'}:</span>
                        <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{effectiveClass}{effectiveSection ? ` - ${effectiveSection}` : ''}</span>
                      </div>
                    )}

                    {selectedFeeCategoryId ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => { setSelectedFeeCategoryId(''); setFeeStructureId(''); setAmount(''); setPercent(''); setSelectedMonths(new Set()) }}
                          className="text-[0.75rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold"
                        >
                          ← {bn ? 'ফি ক্যাটাগরি পরিবর্তন' : 'Change fee category'}
                        </button>
                        {filteredStructures.length === 0 ? (
                          <p className="text-[0.75rem] text-[var(--text-muted)] py-2 text-center rounded-lg bg-[var(--bg-secondary)]/30">
                            {effectiveClass
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
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg border text-[0.75rem] cursor-pointer transition-all ${isSelected ? 'border-[var(--purple)] bg-[var(--purple-light)] shadow-sm' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--purple)]/50'}`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--purple)]' : 'border-[var(--text-muted)]'}`}>
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]" />}
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
                      <div className="space-y-1.5">
                        {feeCategoriesForClass.length === 0 ? (
                          <p className="text-[0.75rem] text-[var(--text-muted)] py-2 text-center rounded-lg bg-[var(--bg-secondary)]/30">
                            {effectiveClass
                              ? (bn ? 'এই শ্রেণির জন্য কোনো ফি ক্যাটাগরি নেই' : 'No fee categories for this class')
                              : (bn ? 'শিক্ষার্থী নির্বাচন করুন বা শ্রেণি বাছাই করুন' : 'Select students or choose a class')
                            }
                          </p>
                        ) : (
                          <div className="space-y-1 max-h-[120px] overflow-y-auto">
                            {feeCategoriesForClass.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedFeeCategoryId(cat.id)}
                                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--purple)]/50 cursor-pointer transition-all text-left group"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-md bg-[var(--purple-light)] flex items-center justify-center">
                                    <Gift size={12} className="text-[var(--purple)]" />
                                  </div>
                                  <div>
                                    <p className="text-[0.75rem] font-medium text-[var(--text-primary)]">{bn ? cat.nameBn || cat.name : cat.name}</p>
                                    {cat.description && <p className="text-[0.55rem] text-[var(--text-muted)] mt-0.5">{bn ? cat.descriptionBn || cat.description : cat.description}</p>}
                                  </div>
                                </div>
                                <ChevronRight size={12} className="text-[var(--text-muted)] group-hover:text-[var(--purple)] transition-colors" />
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
                        <label className="text-[0.8rem] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Calendar size={12} className="text-[var(--purple)]" />
                          {bn ? 'মাস বাছাই' : 'Select Months'}
                        </label>
                        <button type="button" onClick={toggleAllMonths} className="text-[0.8rem] text-[var(--brand)] hover:underline cursor-pointer bg-transparent border-0 p-0 font-semibold">
                          {selectedMonths.size === 12 ? (bn ? 'পরিষ্কার' : 'Clear') : (bn ? 'সব নির্বাচন' : 'Select all')}
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {MONTH_LABELS.map((label, m) => {
                          const isActive = selectedMonths.has(m)
                          return (
                            <button key={m} type="button" onClick={() => toggleMonth(m)} className={`px-1 py-1.5 rounded-md text-[0.8rem] font-semibold border cursor-pointer transition-all ${isActive ? 'bg-[var(--purple)] text-white border-[var(--purple)] shadow-sm shadow-[var(--purple)]/20' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]/50'}`}>
                              {bn ? label.bn : label.en}
                            </button>
                          )
                        })}
                      </div>
                      {selectedMonths.size > 0 && (
                        <p className="text-[0.8rem] text-[var(--purple)] mt-1 font-medium">
                          {selectedMonths.size} {bn ? 'মাস নির্বাচিত' : 'months selected'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Waiver Mode */}
                  {selectedFee && (
                    <div>
                      <label className="text-[0.8rem] font-semibold text-[var(--text-primary)] block mb-1.5">{bn ? 'ছাড়ের ধরন' : 'Waiver Type'}</label>
                      <div className="flex gap-1.5 mb-2">
                        <button
                          type="button"
                          onClick={() => { setWaiverMode('amount'); setPercent('') }}
                          className={`flex-1 py-1.5 rounded-lg text-[0.75rem] font-semibold border cursor-pointer transition-all ${waiverMode === 'amount' ? 'bg-[var(--purple)] text-white border-[var(--purple)] shadow-sm shadow-[var(--purple)]/20' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]/50'}`}
                        >
                          {bn ? 'পরিমাণ (৳)' : 'Amount (৳)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setWaiverMode('percent'); setAmount('') }}
                          className={`flex-1 py-1.5 rounded-lg text-[0.75rem] font-semibold border cursor-pointer transition-all ${waiverMode === 'percent' ? 'bg-[var(--purple)] text-white border-[var(--purple)] shadow-sm shadow-[var(--purple)]/20' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--purple)]/50'}`}
                        >
                          {bn ? 'শতাংশ (%)' : 'Percent (%)'}
                        </button>
                      </div>

                      {waiverMode === 'amount' ? (
                        <input type="number" min="1" max={selectedFee.amount} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} w-full !h-[28px] !text-[0.75rem]`} placeholder={bn ? `সর্বোচ্চ ${fmt(selectedFee.amount)}` : `Max ${fmt(selectedFee.amount)}`} />
                      ) : (
                        <div className="relative">
                          <input type="number" min="1" max="100" value={percent} onChange={(e) => setPercent(e.target.value)} className={`${inputCls} w-full !h-[28px] !text-[0.75rem] pr-6`} placeholder="10" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.75rem] text-[var(--text-muted)] font-semibold">%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="text-[0.8rem] font-semibold text-[var(--text-primary)] block mb-1.5">{bn ? 'কারণ' : 'Reason'}</label>
                    <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inputCls} w-full !h-[28px] !text-[0.75rem]`} placeholder={bn ? 'যেমন: বৃত্তি, এতিম' : 'e.g. Scholarship, Orphan'} />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[0.8rem] font-semibold text-[var(--text-primary)] block mb-1.5">{bn ? 'নোট (ঐচ্ছিক)' : 'Notes (optional)'}</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} w-full !text-[0.75rem] min-h-[40px] resize-none`} placeholder={bn ? 'অতিরিক্ত তথ্য...' : 'Additional info...'} rows={2} />
                  </div>

                  {/* Summary */}
                  {selectedFee && totalWaiver > 0 && (
                    <div className="p-2.5 rounded-lg bg-gradient-to-r from-[var(--purple-light)] to-[var(--purple)]/10 border border-[var(--purple)]/20">
                      <div className="flex justify-between items-center">
                        <span className="text-[0.75rem] font-semibold text-[var(--purple)]">{bn ? 'মোট ছাড়' : 'Total Waiver'}</span>
                        <span className="font-bold text-[var(--purple)] text-sm">{fmt(totalWaiver)}</span>
                      </div>
                      <p className="text-[0.8rem] text-[var(--purple)]/60 text-right mt-0.5">
                        {fmt(perPeriodAmount)} × {selectedStudentIds.size} {bn ? 'শিক্ষার্থী' : 'students'}
                        {isMonthly && selectedMonths.size > 1 && ` × ${selectedMonths.size} ${bn ? 'মাস' : 'months'}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/20">
          <button onClick={onClose} className="py-2 px-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-semibold hover:bg-[var(--bg-primary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          {step === 'details' && (
            <button onClick={handleSave} disabled={!canSave} className={`${btnPrimary} !py-2 !px-4 !text-xs !rounded-lg disabled:opacity-50`}>
              {bn ? 'সংরক্ষণ' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
