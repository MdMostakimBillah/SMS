import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavPath } from '@/hooks/useNavPath'
import { DollarSign, Wallet, CalendarDays, AlertTriangle } from 'lucide-react'
import type { FinanceStatSummary } from '../types'

interface Props {
  isBn: boolean
  isMobile: boolean
  stats: FinanceStatSummary
  canReadFinance: boolean
  col4: string
  gap: string
}

export const FinanceCards: React.FC<Props> = ({
  isBn,
  isMobile,
  stats,
  canReadFinance,
  col4,
  gap,
}) => {
  const navigate = useNavigate()
  const nav = useNavPath()

  if (!canReadFinance) return null

  const items = [
    {
      labelBn: 'আজকের আয়',
      labelEn: "Today's Income",
      value: stats.todayIncome,
      icon: <DollarSign size={14} />,
      color: 'var(--green)',
    },
    {
      labelBn: 'প্রত্যাশিত আয়',
      labelEn: 'Expected Income',
      value: stats.totalExpected,
      icon: <Wallet size={14} />,
      color: 'var(--amber)',
    },
    {
      labelBn: 'মাসের আয়',
      labelEn: 'Month Income',
      value: stats.monthIncome,
      icon: <CalendarDays size={14} />,
      color: 'var(--brand)',
    },
    {
      labelBn: 'মাসের বকেয়া',
      labelEn: 'Month Due',
      value: stats.monthDue,
      icon: <AlertTriangle size={14} />,
      color: 'var(--red)',
    },
  ]

  return (
    <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col4, gap }}>
      {items.map((s) => (
        <div
          key={s.labelEn}
          onClick={() => navigate(nav('/finance'))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer',
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
              background: `${s.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.color,
              flexShrink: 0,
            }}
          >
            {s.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              ৳{s.value.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              {isBn ? s.labelBn : s.labelEn}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
