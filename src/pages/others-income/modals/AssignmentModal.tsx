import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, X, Search, Check } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useOthersIncomeStore, otherIncomeAssignmentId, type OthersIncomeAssignment } from '@/store/othersIncomeStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { MONTH_NAMES, MONTH_NAMES_BN } from '@/store/transportStore'

const inputCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'
const selectCls = `${inputCls} appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.75rem_center] bg-[size:12px]`
const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'

interface Props {
  existing?: OthersIncomeAssignment | null
  onSaved: () => void
  onClose: () => void
}

export function AssignmentModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { categories, assignments, addAssignment, updateAssignment } = useOthersIncomeStore()
  const students = useSessionStudents()
  const currentSession = useClassStore((s) => s.institution.currentSession) || '2025-26'

  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories])

  const [categoryId, setCategoryId] = useState(existing?.categoryId || '')
  const [studentId, setStudentId] = useState(existing?.studentId || '')
  const [months, setMonths] = useState<number[]>(existing?.months && existing.months.length > 0 ? [...existing.months] : [])
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedCategory = useMemo(() => activeCategories.find((c) => c.id === categoryId), [activeCategories, categoryId])

  const assignedStudentIds = useMemo(
    () => {
      if (!categoryId) return assignments.filter((a) => a.isActive && a.id !== existing?.id).map((a) => a.studentId)
      return assignments.filter((a) => a.isActive && a.id !== existing?.id && a.categoryId === categoryId).map((a) => a.studentId)
    },
    [assignments, existing?.id, categoryId]
  )

  const duplicateError = useMemo(() => {
    if (!categoryId || !studentId) return false
    return assignments.some((a) => a.isActive && a.id !== existing?.id && a.categoryId === categoryId && a.studentId === studentId)
  }, [assignments, existing?.id, categoryId, studentId])

  const studentClasses = useMemo(() => {
    const classSet = new Set(students.filter((s) => s.status === 'approved' && s.active !== false).map((s) => s.class))
    return Array.from(classSet).sort()
  }, [students])

  const studentSections = useMemo(() => {
    if (!filterClass) return []
    const sectionSet = new Set(
      students.filter((s) => s.status === 'approved' && s.active !== false && s.class === filterClass).map((s) => s.section)
    )
    return Array.from(sectionSet).sort()
  }, [students, filterClass])

  const filteredStudents = useMemo(() => {
    let list = students.filter((s) => s.status === 'approved' && s.active !== false && !assignedStudentIds.includes(s.id))
    if (filterClass) list = list.filter((s) => s.class === filterClass)
    if (filterSection) list = list.filter((s) => s.section === filterSection)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (s) => s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(q) || s.id.toLowerCase().includes(q) || s.roll.includes(q)
      )
    }
    return list.sort((a, b) => a.nameEn.localeCompare(b.nameEn))
  }, [students, assignedStudentIds, filterClass, filterSection, searchQuery])

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])

  useEffect(() => {
    if (!showDropdown) return
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showDropdown])

  useEffect(() => {
    if (selectedCategory?.type === 'onetime') setMonths([])
  }, [selectedCategory?.type])

  const toggleMonth = (m: number) => {
    setMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  const selectAllMonths = () => {
    if (selectedCategory?.totalMonths && selectedCategory.totalMonths.length > 0) {
      setMonths([...selectedCategory.totalMonths])
    } else {
      setMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    }
  }
  const clearMonths = () => setMonths([])

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!categoryId) e.categoryId = true
    if (!studentId) e.studentId = true
    if (duplicateError) e.duplicate = true
    if (selectedCategory?.type === 'monthly' && months.length === 0) e.months = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString().split('T')[0]
    if (existing) {
      updateAssignment(existing.id, {
        categoryId,
        studentId,
        academicYear: existing.academicYear,
        months: selectedCategory?.type === 'monthly' ? months : [],
      })
    } else {
      addAssignment({
        id: otherIncomeAssignmentId(),
        categoryId,
        studentId,
        academicYear: currentSession,
        months: selectedCategory?.type === 'monthly' ? months : [],
        assignedDate: now,
        isActive: true,
      })
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-primary)] rounded-2xl w-[540px] max-w-[90vw] max-h-[85vh] flex flex-col shadow-2xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)18', color: 'var(--brand)' }}>
              <UserPlus size={15} />
            </div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)] m-0">
              {existing ? (bn ? 'বরাদ্দ সম্পাদনা' : 'Edit Assignment') : (bn ? 'নতুন বরাদ্দ' : 'New Assignment')}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>{bn ? 'ক্যাটাগরি' : 'Category'}</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${selectCls} ${errors.categoryId ? 'border-[var(--red)]' : ''}`}>
              <option value="">{bn ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select category'}</option>
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>{bn ? c.nameBn : c.name} — ৳{c.amount.toLocaleString()} ({c.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')})</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'ছাত্র' : 'Student'}</label>
            <div className="relative" ref={dropdownRef}>
              <input type="text" readOnly value={selectedStudent ? `${bn ? selectedStudent.nameBn : selectedStudent.nameEn} (${selectedStudent.class})` : ''} onClick={() => setShowDropdown(!showDropdown)}
                className={`${inputCls} cursor-pointer ${errors.studentId ? 'border-[var(--red)]' : ''}`}
                placeholder={bn ? 'ছাত্র নির্বাচন করুন' : 'Select student'} />
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[280px] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg">
                  <div className="sticky top-0 bg-[var(--bg-primary)] p-2 border-b border-[var(--border)]">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-8 pl-8 pr-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none" placeholder={bn ? 'খুঁজুন...' : 'Search...'} autoFocus />
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection('') }} className="flex-1 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] px-1 outline-none">
                        <option value="">{bn ? 'সব ক্লাস' : 'All classes'}</option>
                        {studentClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {studentSections.length > 0 && (
                        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="flex-1 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] px-1 outline-none">
                          <option value="">{bn ? 'সব সেকশন' : 'All sections'}</option>
                          {studentSections.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-[var(--text-muted)]">{bn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}</div>
                  ) : filteredStudents.map((s) => (
                    <div key={s.id} onClick={() => { setStudentId(s.id); setShowDropdown(false); setSearchQuery('') }}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors ${s.id === studentId ? 'bg-[var(--brand)]/10' : ''}`}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: 'var(--brand)' }}>
                        {s.nameEn.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">{bn ? s.nameBn : s.nameEn}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">{s.class}{s.section ? ` - ${s.section}` : ''} | {s.id}</div>
                      </div>
                      {s.id === studentId && <Check size={12} className="text-[var(--brand)] flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {duplicateError && (
            <div className="p-2.5 rounded-xl bg-[var(--red-light)] border border-[var(--red)]/20">
              <p className="text-[11px] text-[var(--red)] font-medium">{bn ? 'এই ছাত্র ইতিমধ্যে এই ক্যাটাগরিতে বরাদ্দ আছে।' : 'This student is already assigned to this category.'}</p>
            </div>
          )}

          {selectedCategory && (
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'পরিমাণ' : 'Amount'}</span>
                <span className="text-[13px] font-bold text-[var(--brand)]">৳{selectedCategory.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">{bn ? 'ধরন' : 'Type'}</span>
                <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${selectedCategory.type === 'monthly' ? 'bg-[var(--teal-light)] text-[var(--teal)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                  {selectedCategory.type === 'monthly' ? (bn ? 'মাসিক' : 'Monthly') : (bn ? 'এককালীন' : 'One-time')}
                </span>
              </div>
            </div>
          )}

          {selectedCategory && selectedCategory.type === 'monthly' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls} style={{ marginBottom: 0 }}>{bn ? 'মাস নির্বাচন' : 'Select Months'}</label>
                <div className="flex gap-1">
                  <button onClick={selectAllMonths} type="button" className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--border)] transition-colors">
                    {bn ? 'সব' : 'All'}
                  </button>
                  <button onClick={clearMonths} type="button" className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer hover:bg-[var(--border)] transition-colors">
                    {bn ? 'পরিষ্কার' : 'Clear'}
                  </button>
                </div>
              </div>
              <div className={`grid grid-cols-4 gap-1.5 p-2.5 rounded-xl border ${errors.months ? 'border-[var(--red)]' : 'border-[var(--border)]'} bg-[var(--bg-primary)]`}>
                {MONTH_NAMES.map((m, i) => (
                  <button key={i} type="button" onClick={() => toggleMonth(i)}
                    className={`flex items-center justify-center gap-1 h-8 rounded-lg border text-[10px] font-medium cursor-pointer transition-all ${
                      months.includes(i)
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] hover:border-[var(--brand)]/30'
                    }`}>
                    {bn ? MONTH_NAMES_BN[i] : m.slice(0, 3)}
                  </button>
                ))}
              </div>
              {errors.months && <p className="text-[10px] text-[var(--red)] mt-1">{bn ? 'অন্তত একটি মাস নির্বাচন করুন' : 'Select at least one month'}</p>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[12px] font-medium cursor-pointer hover:bg-[var(--border)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button onClick={handleSave} className="h-9 px-5 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity">
            {existing ? (bn ? 'সংরক্ষণ' : 'Save') : (bn ? 'বরাদ্দ করুন' : 'Assign')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
