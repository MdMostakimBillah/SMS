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
    },
    {
      icon: CheckCircle2,
      label: isBn ? 'উপস্থিত দিন' : 'Present Days',
      value: String(presentDays),
    },
    {
      icon: XCircle,
      label: isBn ? 'অনুপস্থিত' : 'Absent Days',
      value: String(absentDays),
    },
    {
      icon: Clock,
      label: isBn ? 'দেরিতে প্রবেশ' : 'Late Days',
      value: String(lateDays),
    },
    {
      icon: FileText,
      label: isBn ? 'ছুটি ভোগ' : 'Leave Days',
      value: String(leaveDays),
    },
    {
      icon: TrendingUp,
      label: isBn ? 'উপস্থিতির হার' : 'Attendance Rate',
      value: attendanceRate,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.375rem',
              background: 'var(--bg-secondary)',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <card.icon size={16} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.125rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})
