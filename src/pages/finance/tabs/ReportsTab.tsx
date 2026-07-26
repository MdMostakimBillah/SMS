import { useMemo } from 'react'
import React from 'react'
import { DollarSign, TrendingUp, AlertTriangle, Users, BarChart3, Gift } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'

export const ReportsTab = React.memo(function ReportsTab() {
  const bn = useBn()
  const students = useSessionStudents()
  const { structures, getCollectionSummary, getClassWiseSummary } = useFeeStore()

  const summary = useMemo(() => getCollectionSummary(students), [structures, students])
  const classSummary = useMemo(() => getClassWiseSummary(students), [students, structures])

  const fmt = (n: number) => n.toLocaleString()

  const stats = [
    { label: bn ? 'মোট সংগ্রহ' : 'Total Collected', value: fmt(summary.totalCollected), icon: DollarSign, bg: 'var(--green-light)', color: 'var(--green)' },
    { label: bn ? 'এই মাসে' : 'This Month', value: fmt(summary.collectedThisMonth), icon: TrendingUp, bg: 'var(--brand-light)', color: 'var(--brand)' },
    { label: bn ? 'অপেক্ষমাণ' : 'Pending', value: fmt(summary.totalPending), icon: AlertTriangle, bg: 'var(--amber-light)', color: 'var(--amber)' },
    { label: bn ? 'অতিক্রান্ত' : 'Overdue', value: fmt(summary.totalOverdue), icon: AlertTriangle, bg: 'var(--red-light)', color: 'var(--red)' },
    { label: bn ? 'মোট ছাড়' : 'Total Waived', value: fmt(summary.totalWaived), icon: Gift, bg: 'var(--purple-light)', color: 'var(--purple)' },
    { label: bn ? 'মোট পেমেন্ট' : 'Total Payments', value: String(summary.paymentCount), icon: BarChart3, bg: 'var(--teal-light)', color: 'var(--teal)' },
  ]

  return (
    <div>
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-[0.625rem] mb-5">
        {stats.map((s, i) => {
          const IconComp = s.icon
          return (
            <div
              key={i}
              className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg }}
              >
                <IconComp size={15} style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{s.value}</div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Class-wise Summary */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--brand)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{bn ? 'শ্রেণি অনুযায়ী সারসংক্ষেপ' : 'Class-wise Summary'}</h3>
        </div>
        {classSummary.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] text-sm">
            {bn ? 'কোনো ডেটা নেই' : 'No data available'}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--bg-secondary)]">
                <th className="text-left px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শ্রেণি' : 'Class'}</th>
                <th className="text-center px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'শিক্ষার্থী' : 'Students'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'মোট ফি' : 'Total Fee'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'সংগৃহীত' : 'Collected'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'বকেয়' : 'Pending'}</th>
                <th className="text-right px-4 py-2 font-semibold text-[var(--text-secondary)]">{bn ? 'সংগ্রহ হার' : 'Collection %'}</th>
              </tr>
            </thead>
            <tbody>
              {classSummary.map((c) => {
                const pending = c.totalDue - c.totalPaid
                const pct = c.totalDue > 0 ? Math.round((c.totalPaid / c.totalDue) * 100) : 0
                return (
                  <tr key={c.className} className="border-t border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{c.className}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]"><Users size={11} />{c.studentCount}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[var(--text-secondary)]">{fmt(c.totalDue)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[var(--green)]">{fmt(c.totalPaid)}</td>
                    <td className="px-4 py-2.5 text-right font-medium" style={{ color: pending > 0 ? 'var(--red)' : 'var(--text-muted)' }}>{fmt(pending)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)' }} />
                        </div>
                        <span className="text-[0.65rem] font-medium" style={{ color: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
})
