import React from 'react'
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
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: '0.125rem' }}>
        {pt.dateStr}
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {isBn ? 'সংগ্রহ: ' : 'Income: '}৳{pt.amount.toLocaleString()}
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
}) => {
  if (!canReadFinance) return null

  const chartData = progress.days.map((d) => ({
    ...d,
    plotAmount: d.isFuture ? null : d.amount,
  }))

  return (
    <div className="gsap-fade-up card--premium" style={cardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {sectionHead('var(--green)')}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'মাসিক আয় ও দৈনিক সংগ্রহের অগ্রগতি' : 'Monthly Income & Daily Collection Progress'}
          </span>
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
              stroke="var(--brand)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--brand)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--brand)', stroke: 'var(--surface)', strokeWidth: 2 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
