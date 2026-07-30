interface StatusBadgeProps {
  status: string
  isBn: boolean
}
export function StatusBadge({ status, isBn }: StatusBadgeProps) {
  const m: Record<string, { bg: string; c: string; l: string; lb: string }> = {
    pending: { bg: 'var(--amber-light)', c: 'var(--amber)', l: 'Pending', lb: 'অপেক্ষমান' },
    approved: { bg: 'var(--green-light)', c: 'var(--green)', l: 'Approved', lb: 'অনুমোদিত' },
    rejected: { bg: 'var(--red-light)', c: 'var(--red)', l: 'Rejected', lb: 'প্রত্যাখ্যাত' },
  }
  const x = m[status] || m.pending
  return (
    <span
      style={{
        fontSize: '0.625rem',
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: '0.625rem',
        background: x.bg,
        color: x.c,
        whiteSpace: 'nowrap',
      }}
    >
      {isBn ? x.lb : x.l}
    </span>
  )
}
