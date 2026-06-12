import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#ec4899', '#06b6d4']

const chartTooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  padding: '8px 12px',
}

export default function ClassDistribution() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { isMobile } = useWindowSize()

  const classDist = useMemo(() => {
    const map = new Map<string, number>()
    students.forEach((s) => {
      const cls = `Class ${s.class}`
      map.set(cls, (map.get(cls) || 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }))
  }, [students])

  return (
    <div style={{ width: '100%', height: isMobile ? 160 : 200 }}>
      <ResponsiveContainer>
        <BarChart data={classDist.length > 0 ? classDist : [{ name: isBn ? 'তথ্য নেই' : 'No data', value: 0 }]}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {classDist.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
