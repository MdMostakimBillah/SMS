import { useState, useMemo } from 'react'
import React from 'react'
import { Search, Trash2, Plus, Gift } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import { inputCls } from '@/lib/styles'

interface Props {
  onAddWaiver: () => void
}

export const WaiversTab = React.memo(function WaiversTab({ onAddWaiver }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { waivers, structures, deleteWaiver } = useFeeStore()
  const [search, setSearch] = useState('')

  const studentMap = useMemo(() => {
    const map: Record<string, { nameEn: string; nameBn: string; class: string; section: string; roll: string }> = {}
    students.forEach((s) => { map[s.id] = { nameEn: s.nameEn, nameBn: s.nameBn, class: s.class, section: s.section, roll: s.roll } })
    return map
  }, [students])

  const structureMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string }> = {}
    structures.forEach((s) => { map[s.id] = { name: s.name, nameBn: s.nameBn } })
    return map
  }, [structures])

  const sorted = useMemo(() => {
    let list = [...waivers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((w) => {
        const sn = studentMap[w.studentId]
        return sn?.nameEn.toLowerCase().includes(q) || sn?.nameBn.includes(q) || w.reason.toLowerCase().includes(q)
      })
    }
    return list
  }, [waivers, search, studentMap])

  const totalWaived = useMemo(() => sorted.reduce((sum, w) => sum + w.amount, 0), [sorted])

  const fmt = (n: number) => n.toLocaleString()

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

      {/* Filter */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder={bn ? 'ছাড় খুঁজুন...' : 'Search waivers...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} w-full pl-9 h-8 text-xs`}
        />
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
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কারণ' : 'Reason'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'অনুমোদনকারী' : 'Approved By'}</th>
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
                      <td className="px-3 py-2 text-right font-semibold text-[var(--purple)]">{fmt(w.amount)}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)] max-w-[150px] truncate">{bn ? w.reasonBn || w.reason : w.reason}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{w.approvedBy}</td>
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
