import { useState, useMemo } from 'react'
import React from 'react'
import { Search, DollarSign, Users } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useFeeStore } from '@/store/feeStore'
import { inputCls, selectCls } from '@/lib/styles'

export const InactiveDuesTab = React.memo(function InactiveDuesTab() {
  const bn = useBn()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const { structures, payments, waiverEntries, calculateDues } = useFeeStore()
  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const sectionOptions = useMemo(() => (fClass ? sectionsMap[fClass] || [] : []), [fClass, sectionsMap])

  const inactiveStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active === false), [students])

  const dues = useMemo(() => calculateDues(inactiveStudents, fClass || undefined, fSection || undefined, true), [inactiveStudents, fClass, fSection, structures, payments, waiverEntries])

  const filteredDues = useMemo(() => {
    if (!search) return dues
    const q = search.toLowerCase()
    return dues.filter((d) => d.studentName.toLowerCase().includes(q) || d.roll.includes(q) || d.feeName.toLowerCase().includes(q) || d.studentNameBn.includes(q))
  }, [dues, search])

  const totalDue = useMemo(() => dues.reduce((sum, d) => sum + d.dueAmount, 0), [dues])
  const studentCount = useMemo(() => new Set(dues.map((d) => d.studentId)).size, [dues])

  const fmt = (n: number) => n.toLocaleString()

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-[0.625rem] mb-4">
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-light)' }}>
            <DollarSign size={15} style={{ color: 'var(--brand)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{fmt(totalDue)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'মোট বকেয়' : 'Total Due'}</div>
          </div>
        </div>
        <div
          className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-light)' }}>
            <Users size={15} style={{ color: 'var(--amber)' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{String(studentCount)}</div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{bn ? 'নিষ্ক্রিয় শিক্ষার্থী' : 'Inactive Students'}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={bn ? 'শিক্ষার্থী খুঁজুন...' : 'Search students...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9 h-8 text-xs`}
          />
        </div>
        <select value={fClass} onChange={(e) => { setFClass(e.target.value); setFSection('') }} className={`${selectCls} h-8 text-xs w-auto`}>
          <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {fClass && (
          <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={`${selectCls} h-8 text-xs w-auto`}>
            <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        {filteredDues.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {bn ? 'নিষ্ক্রিয় শিক্ষার্থীদের কোনো বকেয় নেই' : 'No dues for inactive students'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মোট' : 'Total'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিশোধিত' : 'Paid'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'বকেয়' : 'Due'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কারণ' : 'Reason'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((d, i) => (
                  <tr key={`${d.studentId}-${d.feeStructureId}-${i}`} className="border-t border-[var(--border)] opacity-70 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-medium text-[var(--text-primary)]">{bn ? d.studentNameBn || d.studentName : d.studentName}</p>
                      <p className="text-[0.65rem] text-[var(--text-muted)]">Roll: {d.roll}</p>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{d.class} - {d.section}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{bn ? d.feeNameBn || d.feeName : d.feeName}</td>
                    <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{fmt(d.totalAmount)}</td>
                    <td className="px-3 py-2 text-right text-[var(--green)]">{fmt(d.paidAmount)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[var(--red)]">{fmt(d.dueAmount)}</td>
                    <td className="px-3 py-2">
                      <span className="text-[0.65rem] text-[var(--red)] bg-[var(--red-light)] px-1.5 py-0.5 rounded">{d.inactiveReason || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
})
