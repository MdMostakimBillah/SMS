import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const chartTooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  padding: '8px 12px',
}

export default function EnrollmentTrend() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { teachers } = useTeacherStore()
  const { isMobile } = useWindowSize()

  const weeklyTrend = useMemo(() => {
    const days: { name: string; students: number; teachers: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayStudents = students.filter((s) => s.createdAt === dateStr).length
      const dayTeachers = teachers.filter((t) => t.createdAt === dateStr).length
      const label = d.toLocaleDateString(isBn ? 'bn' : 'en', { weekday: 'short' })
      days.push({ name: label, students: dayStudents, teachers: dayTeachers })
    }
    return days
  }, [students, teachers, isBn])

  return (
    <>
      <div style={{ width: '100%', height: isMobile ? 160 : 200 }}>
        <ResponsiveContainer>
          <LineChart data={weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
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
    </>
  )
}
