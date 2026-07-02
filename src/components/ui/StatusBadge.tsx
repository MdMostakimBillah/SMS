import React from 'react'

interface StatusConfig {
  bg: string
  text: string
  dot?: string
  label: string
  labelBn: string
}

interface Props {
  status: string
  config: Record<string, StatusConfig>
  isBn?: boolean
  showDot?: boolean
  className?: string
}

export const StatusBadge = React.memo(function StatusBadge({
  status,
  config,
  isBn = false,
  showDot = true,
  className = '',
}: Props) {
  const c = config[status]
  if (!c) return <span className={`text-[0.625rem] text-[var(--text-muted)] ${className}`}>{status}</span>

  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.625rem] px-2.5 py-1 rounded-full font-semibold ${className}`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot || c.text }} />
      )}
      {isBn ? c.labelBn : c.label}
    </span>
  )
})

export const TEACHER_STATUS: Record<string, StatusConfig> = {
  active: { bg: 'var(--green-light)', text: 'var(--green)', label: 'Active', labelBn: 'সক্রিয়' },
  inactive: { bg: 'var(--red-light)', text: 'var(--red)', label: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
  'on-leave': { bg: 'var(--amber-light)', text: 'var(--amber)', label: 'On Leave', labelBn: 'ছুটিতে' },
}

export const STUDENT_STATUS: Record<string, StatusConfig> = {
  approved: { bg: 'var(--green-light)', text: 'var(--green)', label: 'Approved', labelBn: 'অনুমোদিত' },
  pending: { bg: 'var(--amber-light)', text: 'var(--amber)', label: 'Pending', labelBn: 'অপেক্ষমাণ' },
  rejected: { bg: 'var(--red-light)', text: 'var(--red)', label: 'Rejected', labelBn: 'বাতিল' },
}

export const ATTENDANCE_STATUS: Record<string, StatusConfig> = {
  present: { bg: 'var(--green-light)', text: 'var(--green)', label: 'Present', labelBn: 'উপস্থিত' },
  absent: { bg: 'var(--red-light)', text: 'var(--red)', label: 'Absent', labelBn: 'অনুপস্থিত' },
  'on-leave': { bg: 'var(--amber-light)', text: 'var(--amber)', label: 'On Leave', labelBn: 'ছুটিতে' },
}
