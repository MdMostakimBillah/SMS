import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DASHBOARD_COLORS, chartTooltipStyle } from '../types'

interface Props {
  isBn: boolean
  isMobile: boolean
  weeklyTrend: Array<{ name: string; students: number; teachers: number }>
  classDist: Array<{ name: string; value: number }>
  statusData: Array<{ name: string; value: number; color: string }>
  cardStyle: React.CSSProperties
  sectionHead: (color: string) => React.ReactNode
  col3: string
  gap: string
}

export const ChartsRow: React.FC<Props> = ({
  isBn,
  isMobile,
  weeklyTrend,
  classDist,
  statusData,
  cardStyle,
  sectionHead,
  col3,
  gap,
}) => {
  const totalStatus = statusData.reduce((acc, curr) => acc + curr.value, 0)
  const hasStatusData = totalStatus > 0

  return (
    <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col3, gap }}>
      {/* Enrollment Trend */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {sectionHead('var(--brand)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'সাপ্তাহিক ভর্তি' : 'Weekly Enrollment'}
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: isMobile ? 160 : 200 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200} minWidth={0} minHeight={0}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line
                type="monotone"
                dataKey="students"
                stroke="var(--brand)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--brand)' }}
                name={isBn ? 'ছাত্র' : 'Students'}
              />
              <Line
                type="monotone"
                dataKey="teachers"
                stroke="var(--teal)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--teal)' }}
                name={isBn ? 'শিক্ষক' : 'Teachers'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Distribution */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {sectionHead('var(--amber)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'শ্রেণি অনুযায়ী' : 'By Class'}
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: isMobile ? 160 : 200 }}>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 200} minWidth={0} minHeight={0}>
            <BarChart data={classDist.length > 0 ? classDist : [{ name: 'No data', value: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--brand)">
                {(classDist.length > 0 ? classDist : [{ name: 'No data', value: 0 }]).map(
                  (_, i) => (
                    <Cell key={i} fill={DASHBOARD_COLORS[i % DASHBOARD_COLORS.length]} />
                  )
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="card--premium" style={cardStyle}>
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
              {isBn ? 'অবস্থা' : 'Status'}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <div style={{ width: isMobile ? 120 : 130, height: isMobile ? 120 : 130 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={hasStatusData ? statusData : [{ name: isBn ? 'কোনো তথ্য নেই' : 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={42}
                  dataKey="value"
                  paddingAngle={hasStatusData ? 3 : 0}
                >
                  {hasStatusData ? (
                    statusData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))
                  ) : (
                    <Cell fill="var(--border)" />
                  )}
                </Pie>
                {hasStatusData && <Tooltip contentStyle={chartTooltipStyle} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {statusData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.6875rem',
                }}
              >
                <div
                  style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
