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
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: CheckCircle2,
      label: isBn ? 'উপস্থিত দিন' : 'Present Days',
      value: String(presentDays),
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: XCircle,
      label: isBn ? 'অনুপস্থিত' : 'Absent Days',
      value: String(absentDays),
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: Clock,
      label: isBn ? 'দেরিতে প্রবেশ' : 'Late Days',
      value: String(lateDays),
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: FileText,
      label: isBn ? 'ছুটি ভোগ' : 'Leave Days',
      value: String(leaveDays),
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: TrendingUp,
      label: isBn ? 'উপস্থিতির হার' : 'Attendance Rate',
      value: attendanceRate,
      iconCls: 'text-[var(--text-secondary)]',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
              {card.label}
            </span>
            <card.icon size={14} className={`${card.iconCls} shrink-0`} />
          </div>
          <div className="text-xl font-semibold text-[var(--text-primary)] leading-none tabular-nums mt-2.5">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
})
