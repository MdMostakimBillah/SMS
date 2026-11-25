import React from 'react'
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react'

interface AttendanceKpiCardsProps {
  isBn: boolean
  workingDays?: number
  presentDays?: number
  absentDays?: number
  lateDays?: number
  leaveDays?: number
  attendanceRate?: string
}

export const AttendanceKpiCards = React.memo(function AttendanceKpiCards({
  isBn,
  workingDays = 0,
  presentDays = 0,
  absentDays = 0,
  lateDays = 0,
  leaveDays = 0,
  attendanceRate = '0.0%',
}: AttendanceKpiCardsProps) {
  const cards = [
    {
      icon: Calendar,
      label: isBn ? 'মোট কর্মদিবস' : 'Working Days',
      value: String(workingDays),
      iconCls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      icon: CheckCircle2,
      label: isBn ? 'উপস্থিত দিন' : 'Present Days',
      value: String(presentDays),
      iconCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      icon: XCircle,
      label: isBn ? 'অনুপস্থিত' : 'Absent Days',
      value: String(absentDays),
      iconCls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      icon: Clock,
      label: isBn ? 'দেরিতে প্রবেশ' : 'Late Days',
      value: String(lateDays),
      iconCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      icon: FileText,
      label: isBn ? 'ছুটি ভোগ' : 'Leave Days',
      value: String(leaveDays),
      iconCls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      icon: TrendingUp,
      label: isBn ? 'উপস্থিতির হার' : 'Attendance Rate',
      value: attendanceRate,
      iconCls: 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--border)]',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs min-w-0"
        >
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${card.iconCls}`}
          >
            <card.icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-[var(--text-primary)] leading-tight tabular-nums">
              {card.value}
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 truncate">
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})
