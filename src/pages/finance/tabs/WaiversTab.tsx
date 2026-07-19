import { useState, useMemo, useRef } from 'react'
import React from 'react'
import { Search, Trash2, Plus, Gift, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { inputCls } from '@/lib/styles'

interface Props {
  onAddWaiver: () => void
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

export const WaiversTab = React.memo(function WaiversTab({ onAddWaiver }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { waiverCategories, waiverEntries, structures, deleteWaiverCategory, deleteWaiverEntry } = useFeeStore()
  const { institution, classes } = useClassStore()
  const sessions = institution?.sessions || []

  const [subTab, setSubTab] = useState<'categories' | 'students'>('students')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  const [fSession, setFSession] = useState(() => institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fCategory, setFCategory] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useTabSlider({ activeTab: subTab, tabRefs, sliderRef, getContainer: (s) => s.parentElement })

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const studentMap = useMemo(() => {
    const map: Record<string, { nameEn: string; nameBn: string; class: string; section: string; roll: string; academicYear: string }> = {}
    students.forEach((s) => { map[s.id] = { nameEn: s.nameEn, nameBn: s.nameBn, class: s.class, section: s.section, roll: s.roll, academicYear: s.academicYear || '' } })
    return map
  }, [students])

  const structureMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string; type: string; amount: number }> = {}
    structures.forEach((s) => { map[s.id] = { name: s.name, nameBn: s.nameBn, type: s.type, amount: s.amount } })
    return map
  }, [structures])

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string }> = {}
    waiverCategories.forEach((c) => { map[c.id] = { name: c.name, nameBn: c.nameBn } })
    return map
  }, [waiverCategories])

  const generateWaivers = useFeeStore((s) => s.generateWaivers)
  const allWaivers = useMemo(() => generateWaivers(), [generateWaivers, waiverEntries, structures])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  // Categories data
  const categoryStats = useMemo(() => {
    return waiverCategories.map((cat) => {
      const entries = waiverEntries.filter((e) => e.categoryId === cat.id)
      const entryCount = new Set(entries.map((e) => e.studentId)).size
      const waivers = allWaivers.filter((w) => entries.some((e) => {
        if (e.studentId !== w.studentId || e.feeStructureId !== w.feeStructureId) return false
        if (e.months.length > 0 && w.forMonth) {
          const mIdx = parseInt(w.forMonth.split('-')[1]) - 1
          return e.months.includes(mIdx)
        }
        return true
      }))
      const totalWaived = waivers.reduce((sum, w) => sum + w.amount, 0)
      return { ...cat, entryCount, totalWaived }
    })
  }, [waiverCategories, waiverEntries, allWaivers])

  // Students grouped data
  const groupedStudents = useMemo(() => {
    const groups = new Map<string, {
      studentId: string
      studentName: string
      studentNameBn: string
      class: string
      section: string
      roll: string
      entries: typeof waiverEntries
      totalWaived: number
    }>()

    let filtered = waiverEntries
    if (fCategory) filtered = filtered.filter((e) => e.categoryId === fCategory)
    if (fClass) filtered = filtered.filter((e) => {
      const sn = studentMap[e.studentId]
      return sn?.class === fClass
    })
    if (fSection) filtered = filtered.filter((e) => {
      const sn = studentMap[e.studentId]
      return sn?.section === fSection
    })
    if (fSession) filtered = filtered.filter((e) => {
      const sn = studentMap[e.studentId]
      return sn?.academicYear === fSession
    })

    for (const entry of filtered) {
      const sn = studentMap[entry.studentId]
      if (!sn) continue
      const key = entry.studentId
      if (!groups.has(key)) {
        groups.set(key, {
          studentId: entry.studentId,
          studentName: sn.nameEn,
          studentNameBn: sn.nameBn,
          class: sn.class,
          section: sn.section,
          roll: sn.roll,
          entries: [],
          totalWaived: 0,
        })
      }
      const group = groups.get(key)!
      group.entries.push(entry)
    }

    // Compute totalWaived for each group
    for (const group of groups.values()) {
      for (const entry of group.entries) {
        const struct = structures.find((s) => s.id === entry.feeStructureId)
        if (!struct) continue
        let perPeriod = entry.mode === 'percent' ? Math.round(struct.amount * entry.value / 100) : entry.value
        if (entry.months.length > 0) {
          group.totalWaived += perPeriod * entry.months.length
        } else {
          group.totalWaived += perPeriod
        }
      }
    }

    let list = Array.from(groups.values()).sort((a, b) => a.studentName.localeCompare(b.studentName))

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((g) =>
        g.studentName.toLowerCase().includes(q) ||
        g.studentNameBn.includes(q) ||
        g.roll.includes(q)
      )
    }

    return list
  }, [waiverEntries, studentMap, structures, fClass, fSection, fCategory, fSession, search])

  const totalWaived = useMemo(() => groupedStudents.reduce((sum, g) => sum + g.totalWaived, 0), [groupedStudents])

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--purple-light)]"><Gift size={16} className="text-[var(--purple)]" /></span>
          <div>
            <p className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'মোট ছাড়' : 'Total Waived'}</p>
            <p className="text-sm font-bold text-[var(--purple)]">{fmt(totalWaived)}</p>
          </div>
        </div>
        <button onClick={onAddWaiver} className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer">
          <Plus size={13} /> {bn ? 'ছাড় যোগ করুন' : 'Add Waiver'}
        </button>
      </div>

      {/* Sub-tab Bar */}
      <div className="relative flex gap-1 p-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] mb-3">
        <div
          ref={sliderRef}
          className="absolute top-1 bottom-1 rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{
            background: 'var(--brand)',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            zIndex: 0,
          }}
        />
        <button
          ref={(el) => { if (el) tabRefs.current.set('categories', el) }}
          onClick={() => setSubTab('categories')}
          className={`relative z-10 flex-1 py-2 rounded-[0.5625rem] text-xs font-semibold cursor-pointer border-none transition-colors duration-200 ${
            subTab === 'categories' ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Tag size={12} className="inline mr-1" />
          {bn ? 'ক্যাটাগরি' : 'Categories'}
        </button>
        <button
          ref={(el) => { if (el) tabRefs.current.set('students', el) }}
          onClick={() => setSubTab('students')}
          className={`relative z-10 flex-1 py-2 rounded-[0.5625rem] text-xs font-semibold cursor-pointer border-none transition-colors duration-200 ${
            subTab === 'students' ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Gift size={12} className="inline mr-1" />
          {bn ? 'শিক্ষার্থী' : 'Students'}
        </button>
      </div>

      {subTab === 'categories' ? (
        /* Categories View */
        <div className="space-y-2">
          {categoryStats.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              {bn ? 'কোনো ক্যাটাগরি নেই। "ছাড় যোগ করুন" এ ক্লিক করে প্রথম ক্যাটাগরি তৈরি করুন।' : 'No categories yet. Click "Add Waiver" to create the first category.'}
            </div>
          ) : (
            categoryStats.map((cat) => (
              <div key={cat.id} className={`p-3 rounded-xl border transition-all ${cat.isActive ? 'border-[var(--border)] bg-[var(--bg-primary)]' : 'border-[var(--border)] bg-[var(--bg-secondary)] opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{bn ? cat.nameBn || cat.name : cat.name}</p>
                    {cat.description && <p className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{bn ? cat.descriptionBn || cat.description : cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[0.65rem] text-[var(--text-muted)]">{cat.entryCount} {bn ? 'জন শিক্ষার্থী' : 'students'}</p>
                      <p className="text-xs font-bold text-[var(--purple)]">{fmt(cat.totalWaived)}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(bn ? `ক্যাটাগরি মুছে ফেলতে চান? ${cat.entryCount} জন শিক্ষার্থীর ছাড় মুছে যাবে।` : `Delete this category? ${cat.entryCount} student waivers will be removed.`)) {
                          deleteWaiverCategory(cat.id)
                        }
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Students View */
        <>
          {/* Filters */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={fSession} onChange={(e) => setFSession(e.target.value)} className={selectCls}>
                <option value="">{bn ? 'সব সেশন' : 'All Sessions'}</option>
                {sessions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={selectCls}>
                <option value="">{bn ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
                {waiverCategories.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{bn ? c.nameBn || c.name : c.name}</option>)}
              </select>
              <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection('') }} className={selectCls}>
                <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
                {classOptions.map((c) => <option key={c} value={c}>{bn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
              </select>
              <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={selectCls} disabled={!fClass}>
                <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
                {fClass && (sectionsMap[fClass] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" placeholder={bn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'} value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} w-full pl-9 h-8 text-xs`} />
            </div>
          </div>

          {/* Grouped Table */}
          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            {groupedStudents.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                {bn ? 'কোনো ছাড় নেই' : 'No waivers found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)]">
                      <th className="w-8 px-2 py-2"></th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                      <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মোট ছাড়' : 'Total Waived'}</th>
                      <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কাজ' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedStudents.map((group) => {
                      const isExpanded = expandedId === group.studentId
                      const firstEntry = group.entries[0]
                      const catName = firstEntry ? categoryMap[firstEntry.categoryId] : null
                      const feeNames = [...new Set(group.entries.map((e) => {
                        const s = structureMap[e.feeStructureId]
                        return s ? (bn ? s.nameBn || s.name : s.name) : '—'
                      }))]

                      return (
                        <React.Fragment key={group.studentId}>
                          <tr className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : group.studentId)}>
                            <td className="px-2 py-2 text-[var(--text-muted)]">
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-medium text-[var(--text-primary)]">{bn ? group.studentNameBn || group.studentName : group.studentName}</p>
                              <p className="text-[0.65rem] text-[var(--text-muted)]">Roll: {group.roll}</p>
                            </td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{group.class} - {group.section}</td>
                            <td className="px-3 py-2">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--purple-light)] text-[var(--purple)] text-[0.65rem] font-medium">
                                {catName ? (bn ? catName.nameBn || catName.name : catName.name) : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">{feeNames.join(', ')}</td>
                            <td className="px-3 py-2 text-right font-semibold text-[var(--purple)]">{fmt(group.totalWaived)}</td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={(e) => { e.stopPropagation(); if (confirm(bn ? 'এই শিক্ষার্থীর সব ছাড় মুছে ফেলতে চান?' : 'Delete all waivers for this student?')) { group.entries.forEach((en) => deleteWaiverEntry(en.id)) } }} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer">
                                <Trash2 size={11} />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="px-4 py-3 bg-[var(--bg-secondary)]/50">
                                <div className="space-y-1.5">
                                  {group.entries.map((entry) => {
                                    const struct = structureMap[entry.feeStructureId]
                                    let perPeriod = entry.mode === 'amount' ? entry.value : (struct ? Math.round(struct.amount * entry.value / 100) : 0)
                                    const months = entry.months.length > 0 ? entry.months : []
                                    const totalForEntry = months.length > 0 ? perPeriod * months.length : perPeriod

                                    return (
                                      <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                                        <div className="flex-1">
                                          <p className="text-[0.7rem] font-medium text-[var(--text-primary)]">
                                            {struct ? (bn ? struct.nameBn || struct.name : struct.name) : '—'}
                                          </p>
                                          <p className="text-[0.6rem] text-[var(--text-muted)]">
                                            {entry.mode === 'amount'
                                              ? `${fmt(entry.value)} ${bn ? 'প্রতি মাসে' : 'per month'}`
                                              : `${entry.value}% = ${fmt(perPeriod)} ${bn ? 'প্রতি মাসে' : 'per month'}`
                                            }
                                          </p>
                                        </div>
                                        {months.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {months.sort((a, b) => a - b).map((m) => (
                                              <span key={m} className="inline-block px-1.5 py-0.5 rounded bg-[var(--purple-light)] text-[var(--purple)] text-[0.55rem] font-medium">
                                                {bn ? MONTH_LABELS[m].bn : MONTH_LABELS[m].en}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <span className="text-[0.7rem] font-semibold text-[var(--purple)]">{fmt(totalForEntry)}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
})
