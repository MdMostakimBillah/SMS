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
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brand)'
            e.currentTarget.style.background = 'var(--surface-hover)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'var(--surface)'
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
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
                fontSize: isMobile ? '1.0625rem' : '1.1875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em',
              }}
            >
              ৳{s.value.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginTop: '0.125rem',
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
