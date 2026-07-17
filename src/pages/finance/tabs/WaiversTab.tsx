import { useState, useMemo } from 'react'
import React from 'react'
import { Search, Trash2, Plus, Gift } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
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
  const { waivers, structures, deleteWaiver } = useFeeStore()
  const { institution, classes } = useClassStore()
  const sessions = institution?.sessions || []

  const [fSession, setFSession] = useState(() => institution?.currentSession || '')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [search, setSearch] = useState('')

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

  const sorted = useMemo(() => {
    let list = [...waivers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (fSession) {
      list = list.filter((w) => {
        const sn = studentMap[w.studentId]
        return sn?.academicYear === fSession
      })
    }
    if (fClass) {
      list = list.filter((w) => {
        const sn = studentMap[w.studentId]
        return sn?.class === fClass
      })
    }
    if (fSection) {
      list = list.filter((w) => {
        const sn = studentMap[w.studentId]
        return sn?.section === fSection
      })
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((w) => {
        const sn = studentMap[w.studentId]
        return sn?.nameEn.toLowerCase().includes(q) || sn?.nameBn.includes(q) || w.reason.toLowerCase().includes(q)
      })
    }
    return list
  }, [waivers, search, studentMap, fSession, fClass, fSection])

  const totalWaived = useMemo(() => sorted.reduce((sum, w) => sum + w.amount, 0), [sorted])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const formatMonth = (forMonth?: string) => {
    if (!forMonth) return '—'
    const parts = forMonth.split('-')
    if (parts.length < 2) return forMonth
    const mIdx = parseInt(parts[1]) - 1
    if (mIdx >= 0 && mIdx < 12) {
      return bn ? `${MONTH_LABELS[mIdx].bn} ${parts[0]}` : `${MONTH_LABELS[mIdx].en} ${parts[0]}`
    }
    return forMonth
  }

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

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] space-y-2.5 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={fSession}
            onChange={(e) => setFSession(e.target.value)}
            className={selectCls}
          >
            <option value="">{bn ? 'সব সেশন' : 'All Sessions'}</option>
            {sessions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={fClass}
            onChange={(e) => { setFClass(e.target.value); setFSection('') }}
            className={selectCls}
          >
            <option value="">{bn ? 'সব শ্রেণি' : 'All Classes'}</option>
            {classOptions.map((c) => <option key={c} value={c}>{bn ? `শ্রেণি ${c}` : `Class ${c}`}</option>)}
          </select>
          <select
            value={fSection}
            onChange={(e) => setFSection(e.target.value)}
            className={selectCls}
            disabled={!fClass}
          >
            <option value="">{bn ? 'সব সেকশন' : 'All Sections'}</option>
            {fClass && (sectionsMap[fClass] || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={bn ? 'ছাড় খুঁজুন...' : 'Search waivers...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9 h-8 text-xs`}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {bn ? 'কোনো ছাড় নেই' : 'No waivers found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মাস' : 'Month'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কারণ' : 'Reason'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কাজ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((w) => {
                  const sn = studentMap[w.studentId]
                  const fn = structureMap[w.feeStructureId]
                  return (
                    <tr key={w.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{w.createdAt}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-[var(--text-primary)]">{bn ? sn?.nameBn || sn?.nameEn : sn?.nameEn}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)]">Roll: {sn?.roll}</p>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{sn?.class} - {sn?.section}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{bn ? fn?.nameBn || fn?.name : fn?.name}</td>
                      <td className="px-3 py-2">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--purple-light)] text-[var(--purple)] text-[0.65rem] font-medium">
                          {formatMonth(w.forMonth)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--purple)]">{fmt(w.amount)}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] max-w-[150px] truncate">{bn ? w.reasonBn || w.reason : w.reason}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => { if (confirm(bn ? 'ছাড় মুছে ফেলতে চান?' : 'Delete this waiver?')) deleteWaiver(w.id) }} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer">
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
})
