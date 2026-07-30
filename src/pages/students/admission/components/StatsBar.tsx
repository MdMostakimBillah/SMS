interface StatsBarProps {
  stats: { total: number; pending: number; approved: number; rejected: number; male: number; female: number }
  isBn: boolean
  isMobile: boolean
}
export function StatsBar({ stats, isBn, isMobile }: StatsBarProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(6,1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
      {[
        { l: isBn ? 'মোট' : 'Total', v: stats.total, c: 'var(--brand)', b: 'var(--brand-light)' },
        { l: isBn ? 'অপেক্ষমান' : 'Pending', v: stats.pending, c: 'var(--amber)', b: 'var(--amber-light)' },
        { l: isBn ? 'অনুমোদিত' : 'Approved', v: stats.approved, c: 'var(--green)', b: 'var(--green-light)' },
        { l: isBn ? 'প্রত্যাখ্যাত' : 'Rejected', v: stats.rejected, c: 'var(--red)', b: 'var(--red-light)' },
        { l: isBn ? 'ছেলে' : 'Male', v: stats.male, c: 'var(--teal)', b: 'var(--teal-light)' },
        { l: isBn ? 'মেয়ে' : 'Female', v: stats.female, c: 'var(--purple)', b: 'var(--purple-light)' },
      ].map((x) => (
        <div
          key={x.l}
          className="glass"
          style={{
            borderRadius: '0.625rem',
            padding: '0.625rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: x.c }}>{x.v}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.0625rem' }}>{x.l}</div>
        </div>
      ))}
    </div>
  )
}
