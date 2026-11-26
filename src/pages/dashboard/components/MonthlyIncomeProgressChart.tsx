import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { chartTooltipStyle, type MonthlyIncomeProgressSummary, type MonthlyDailyIncomePoint } from '../types'

interface Props {
  isBn: boolean
  isMobile: boolean
  canReadFinance: boolean
  progress: MonthlyIncomeProgressSummary
  cardStyle: React.CSSProperties
  sectionHead: (color: string) => React.ReactNode
  onPrevMonth?: () => void
  onNextMonth?: () => void
}

function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) return `৳${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `৳${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return `৳${value}`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: MonthlyDailyIncomePoint }>
  isBn: boolean
}

const CustomIncomeTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isBn }) => {
  if (!active || !payload || !payload.length) return null
  const pt = payload[0].payload

  return (
    <div style={chartTooltipStyle}>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
        {pt.dateStr}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span style={{ width: '0.4375rem', height: '0.4375rem', borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
          <span>{isBn ? 'আয়: ' : 'Income: '}৳{pt.amount.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span style={{ width: '0.4375rem', height: '0.4375rem', borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
          <span>{isBn ? 'ব্যয়: ' : 'Expense: '}৳{(pt.expenseAmount || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export const MonthlyIncomeProgressChart: React.FC<Props> = ({
  isBn,
  isMobile,
  canReadFinance,
  progress,
  cardStyle,
  sectionHead,
  onPrevMonth,
  onNextMonth,
}) => {
  if (!canReadFinance) return null

  const chartData = progress.days.map((d) => ({
    ...d,
    plotAmount: d.isFuture ? null : d.amount,
    plotExpense: d.isFuture ? null : d.expenseAmount,
  }))

  const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '0.375rem',
    border: 'none',
    background: 'transparent',
    color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: 0,
  })

  return (
    <div className="gsap-fade-up card--premium" style={cardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {sectionHead('var(--green)')}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'মাসিক আয় ও দৈনিক সংগ্রহের অগ্রগতি' : 'Monthly Income & Daily Collection Progress'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem' }}>
              <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--brand)' }} />
              <span>{isBn ? 'আয়' : 'Income'}</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem' }}>
              <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--red)' }} />
              <span>{isBn ? 'ব্যয়' : 'Expense'}</span>
            </span>
          </div>

          {(onPrevMonth || onNextMonth) && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.125rem',
                padding: '0.125rem 0.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
              }}
            >
              <button
                type="button"
                aria-label={isBn ? 'আগের মাস' : 'Previous month'}
                onClick={onPrevMonth}
                style={navBtnStyle(false)}
              >
                <ChevronLeft size={13} />
              </button>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  minWidth: '6.75rem',
                  textAlign: 'center',
                  padding: '0 0.25rem',
                }}
              >
                {progress.monthLabel}
              </span>
              <button
                type="button"
                aria-label={isBn ? 'পরের মাস' : 'Next month'}
                disabled={progress.isCurrentMonth}
                onClick={onNextMonth}
                style={navBtnStyle(progress.isCurrentMonth)}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height: isMobile ? 190 : 230 }}>
        <ResponsiveContainer width="100%" height={isMobile ? 190 : 230} minWidth={0} minHeight={0}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              interval={isMobile ? 2 : 0}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomIncomeTooltip isBn={isBn} />} />
            <Line
              type="monotone"
              dataKey="plotAmount"
              name={isBn ? 'আয়' : 'Income'}
              stroke="var(--brand)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--brand)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--brand)', stroke: 'var(--surface)', strokeWidth: 2 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="plotExpense"
              name={isBn ? 'ব্যয়' : 'Expense'}
              stroke="var(--red)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--red)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--red)', stroke: 'var(--surface)', strokeWidth: 2 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
