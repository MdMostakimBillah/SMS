import { useMemo } from 'react'
import { DollarSign, TrendingUp, Award } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useHRStore } from '@/store/hrStore'

export default function HRSummary() {
  const isBn = useBn()
  const { increments, bonuses, promotions: hrPromotions } = useHRStore()

  const data = useMemo(() => {
    const totalIncrements = increments.length
    const totalBonuses = bonuses.length
    const totalHrPromotions = hrPromotions.length
    const totalBonusAmount = bonuses.reduce((sum, b) => sum + b.amount, 0)

    return [
      { label: isBn ? 'বৃদ্ধি' : 'Increments', value: totalIncrements, icon: <TrendingUp size={14} />, color: 'var(--green)' },
      { label: isBn ? 'বোনাস' : 'Bonuses', value: totalBonuses, icon: <DollarSign size={14} />, color: 'var(--amber)' },
      { label: isBn ? 'পদোন্নতি' : 'Promotions', value: totalHrPromotions, icon: <Award size={14} />, color: 'var(--brand)' },
      { label: isBn ? 'মোট বোনাস' : 'Total Bonus', value: `৳${totalBonusAmount.toLocaleString()}`, icon: <DollarSign size={14} />, color: 'var(--teal)' },
    ]
  }, [increments, bonuses, hrPromotions, isBn])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
      {data.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '1.625rem',
              height: '1.625rem',
              borderRadius: '0.375rem',
              background: `${item.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.color,
              flexShrink: 0,
            }}
          >
            {item.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.value}</div>
            <div
              style={{
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
