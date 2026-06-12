import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const STATUS_COLORS = { approved: '#22c55e', pending: '#f59e0b', rejected: '#ef4444' }

const chartTooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  padding: '8px 12px',
}

export default function StatusDistribution() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { isMobile } = useWindowSize()

  const statusData = useMemo(() => {
    const approvedStudents = students.filter((s) => s.status === 'approved').length
    const pendingStudents = students.filter((s) => s.status === 'pending').length
    const rejectedStudents = students.filter((s) => s.status === 'rejected').length
    return [
      { name: isBn ? 'অনুমোদিত' : 'Approved', value: approvedStudents, color: STATUS_COLORS.approved },
      { name: isBn ? 'বিচারাধীন' : 'Pending', value: pendingStudents, color: STATUS_COLORS.pending },
      { name: isBn ? 'বাতিল' : 'Rejected', value: rejectedStudents, color: STATUS_COLORS.rejected },
    ]
  }, [students, isBn])

  return (
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
        <ResponsiveContainer>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={3}>
              {statusData.map((e, i) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {statusData.map((s) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem' }}>
            <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
