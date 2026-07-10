import { useState, useMemo } from 'react'
import React from 'react'
import { Search, Trash2, Eye, DollarSign, Calendar, CreditCard } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import type { FeePayment } from '@/store/feeStore'
import { inputCls } from '@/lib/styles'

interface Props {
  onViewReceipt: (payment: FeePayment & { studentName: string; studentNameBn: string; feeName: string; feeNameBn: string }) => void
}

export const PaymentsTab = React.memo(function PaymentsTab({ onViewReceipt }: Props) {
  const bn = useBn()
  const students = useSessionStudents()
  const { payments, structures, deletePayment } = useFeeStore()
  const [search, setSearch] = useState('')
  const [fMethod, setFMethod] = useState('')

  const studentMap = useMemo(() => {
    const map: Record<string, { nameEn: string; nameBn: string }> = {}
    students.forEach((s) => { map[s.id] = { nameEn: s.nameEn, nameBn: s.nameBn } })
    return map
  }, [students])

  const structureMap = useMemo(() => {
    const map: Record<string, { name: string; nameBn: string }> = {}
    structures.forEach((s) => { map[s.id] = { name: s.name, nameBn: s.nameBn } })
    return map
  }, [structures])

  const sorted = useMemo(() => {
    let list = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.createdAt.localeCompare(a.createdAt))
    if (fMethod) list = list.filter((p) => p.method === fMethod)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => {
        const sn = studentMap[p.studentId]
        const fn = structureMap[p.feeStructureId]
        return (sn?.nameEn.toLowerCase().includes(q) || sn?.nameBn.includes(q) || fn?.name.toLowerCase().includes(q) || p.note.toLowerCase().includes(q))
      })
    }
    return list
  }, [payments, search, fMethod, studentMap, structureMap])

  const totalCollected = useMemo(() => sorted.reduce((sum, p) => sum + p.amount, 0), [sorted])

  const fmt = (n: number) => `৳${n.toLocaleString()}`

  const methodLabel = (m: string) => m === 'cash' ? (bn ? 'নগদ' : 'Cash') : m === 'bank' ? (bn ? 'ব্যাংক' : 'Bank') : m === 'mobile' ? (bn ? 'মোবাইল' : 'Mobile') : (bn ? 'অন্যান্য' : 'Other')

  const methodColor = (m: string) => m === 'cash' ? 'var(--green)' : m === 'bank' ? 'var(--brand)' : m === 'mobile' ? 'var(--teal)' : 'var(--text-muted)'

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--green-light)]"><DollarSign size={16} className="text-[var(--green)]" /></span>
          <div>
            <p className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'মোট সংগ্রহ' : 'Total Collected'}</p>
            <p className="text-sm font-bold text-[var(--green)]">{fmt(totalCollected)}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-[var(--border)]" />
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand-light)]"><CreditCard size={16} className="text-[var(--brand)]" /></span>
          <div>
            <p className="text-[0.65rem] text-[var(--text-muted)]">{bn ? 'মোট পেমেন্ট' : 'Total Payments'}</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{sorted.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={bn ? 'পেমেন্ট খুঁজুন...' : 'Search payments...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9 h-8 text-xs`}
          />
        </div>
        <div className="flex gap-1">
          {(['', 'cash', 'bank', 'mobile', 'other'] as const).map((m) => (
            <button key={m} onClick={() => setFMethod(m)} className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-medium border cursor-pointer transition-all ${fMethod === m ? 'bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]'}`}>
              {m ? methodLabel(m) : (bn ? 'সব' : 'All')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            {bn ? 'কোনো পেমেন্ট নেই' : 'No payments found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'তারিখ' : 'Date'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'ফি' : 'Fee'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'পদ্ধতি' : 'Method'}</th>
                  <th className="text-left px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'নোট' : 'Note'}</th>
                  <th className="text-right px-3 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'কাজ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const sn = studentMap[p.studentId]
                  const fn = structureMap[p.feeStructureId]
                  return (
                    <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-3 py-2 text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1"><Calendar size={10} />{p.paidAt}</div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-[var(--text-primary)]">{bn ? sn?.nameBn || sn?.nameEn : sn?.nameEn}</p>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{bn ? fn?.nameBn || fn?.name : fn?.name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--green)]">{fmt(p.amount)}</td>
                      <td className="px-3 py-2">
                        <span className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full" style={{ background: `${methodColor(p.method)}12`, color: methodColor(p.method) }}>
                          {methodLabel(p.method)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--text-muted)] max-w-[120px] truncate">{p.note || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => onViewReceipt({ ...p, studentName: sn?.nameEn || '', studentNameBn: sn?.nameBn || '', feeName: fn?.name || '', feeNameBn: fn?.nameBn || '' })} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--brand-light)] text-[var(--brand)] border-0 cursor-pointer">
                            <Eye size={11} />
                          </button>
                          <button onClick={() => { if (confirm(bn ? 'পেমেন্ট মুছে ফেলতে চান?' : 'Delete this payment?')) deletePayment(p.id) }} className="w-6 h-6 rounded flex items-center justify-center bg-[var(--red-light)] text-[var(--red)] border-0 cursor-pointer">
                            <Trash2 size={11} />
                          </button>
                        </div>
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
