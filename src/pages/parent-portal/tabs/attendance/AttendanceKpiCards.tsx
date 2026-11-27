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
      color: 'var(--brand)',
    },
    {
      icon: CheckCircle2,
      label: isBn ? 'উপস্থিত দিন' : 'Present Days',
      value: String(presentDays),
      color: 'var(--green)',
    },
    {
      icon: XCircle,
      label: isBn ? 'অনুপস্থিত' : 'Absent Days',
      value: String(absentDays),
      color: 'var(--red)',
    },
    {
      icon: Clock,
      label: isBn ? 'দেরিতে প্রবেশ' : 'Late Days',
      value: String(lateDays),
      color: 'var(--amber)',
    },
    {
      icon: FileText,
      label: isBn ? 'ছুটি ভোগ' : 'Leave Days',
      value: String(leaveDays),
      color: 'var(--purple)',
    },
    {
      icon: TrendingUp,
      label: isBn ? 'উপস্থিতির হার' : 'Attendance Rate',
      value: attendanceRate,
      color: 'var(--teal)',
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
            gap: '0.625rem',
            padding: '0.75rem 0.875rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
          }}
        >
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.375rem',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: card.color,
              flexShrink: 0,
            }}
          >
            <card.icon size={15} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '0.125rem',
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
