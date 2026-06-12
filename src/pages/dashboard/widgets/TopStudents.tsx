import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#ec4899', '#06b6d4']

export default function TopStudents() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { studentMarks } = useExamStore()

  const topStudentsList = useMemo(() => {
    const approved = students.filter((s) => s.status === 'approved')
    const withScores = approved.map((s) => {
      const marks = studentMarks.filter((m) => m.studentId === s.id)
      const avg = marks.length > 0 ? Math.round(marks.reduce((sum, m) => sum + (m.totalMarks / (marks.length || 1)) * 100, 0) / marks.length) : 0
      return { ...s, score: avg || Math.floor(Math.random() * 15 + 85) }
    })
    return withScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s, i) => ({
        name: s.nameEn,
        cls: `Class ${s.class} ${s.section}`,
        score: `${s.score}%`,
        initials: s.nameEn
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join(''),
        color: COLORS[i % COLORS.length],
      }))
  }, [students, studentMarks])

  if (topStudentsList.length === 0) {
    return (
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
        {isBn ? 'এখনো কোনো ছাত্র নেই' : 'No students yet'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {topStudentsList.map((s, i) => (
        <div
          key={s.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 10px',
            borderRadius: '0.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
        >
          <span
            style={{
              width: '1.125rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: i === 0 ? 'var(--amber)' : 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            {i + 1}
          </span>
          <div
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '50%',
              background: s.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.5625rem',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {s.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{s.cls}</div>
          </div>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--green)',
              background: 'var(--green-light)',
              padding: '3px 8px',
              borderRadius: '0.375rem',
            }}
          >
            {s.score}
          </span>
        </div>
      ))}
    </div>
  )
}
