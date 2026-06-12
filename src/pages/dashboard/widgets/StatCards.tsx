import { useMemo } from 'react'
import { Users, GraduationCap, CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'

export default function StatCards() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { teachers } = useTeacherStore()
  const { isMobile } = useWindowSize()

  const stats = useMemo(() => {
    const totalStudents = students.length
    const totalTeachers = teachers.length
    const approvedStudents = students.filter((s) => s.status === 'approved').length
    const pendingStudents = students.filter((s) => s.status === 'pending').length
    const rejectedStudents = students.filter((s) => s.status === 'rejected').length
    const approvedPct = totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0

    return [
      {
        labelBn: 'মোট ছাত্র',
        labelEn: 'Total Students',
        value: totalStudents,
        icon: <Users size={16} />,
        color: 'var(--brand)',
        cardClass: 'stat-card-blue',
        change: `+${approvedPct}%`,
        up: true,
      },
      {
        labelBn: 'শিক্ষক',
        labelEn: 'Teachers',
        value: totalTeachers,
        icon: <GraduationCap size={16} />,
        color: 'var(--amber)',
        cardClass: 'stat-card-yellow',
        change: `+${totalTeachers > 0 ? Math.round((teachers.filter((t) => t.status === 'active').length / totalTeachers) * 100) : 0}%`,
        up: true,
      },
      {
        labelBn: 'অনুমোদিত',
        labelEn: 'Approved',
        value: approvedStudents,
        icon: <CheckCircle2 size={16} />,
        color: 'var(--green)',
        cardClass: 'stat-card-green',
        change: `${approvedPct}%`,
        up: true,
      },
      {
        labelBn: 'বিচারাধীন',
        labelEn: 'Pending',
        value: pendingStudents,
        icon: <Clock size={16} />,
        color: 'var(--purple)',
        cardClass: 'stat-card-purple',
        change: rejectedStudents > 0 ? `-${rejectedStudents}` : '0',
        up: rejectedStudents === 0,
      },
    ]
  }, [students, teachers])

  const col4 = isMobile ? '1fr 1fr' : 'repeat(4,1fr)'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: col4, gap: isMobile ? '10px' : '0.75rem' }}>
      {stats.map((s) => (
        <div
          key={s.labelEn}
          className={`stat-card ${s.cardClass}`}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '2.125rem',
                height: '2.125rem',
                borderRadius: '0.5rem',
                background: `${s.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.color,
              }}
            >
              {s.icon}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.1875rem',
                fontSize: '0.625rem',
                fontWeight: 600,
                color: s.up ? 'var(--green)' : 'var(--red)',
                background: s.up ? 'var(--green-light)' : 'var(--red-light)',
                padding: '2px 6px',
                borderRadius: '0.25rem',
              }}
            >
              {s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {s.change}
            </div>
          </div>
          <div
            style={{
              fontSize: isMobile ? '20px' : '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              lineHeight: 1,
            }}
          >
            {s.value}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{isBn ? s.labelBn : s.labelEn}</div>
        </div>
      ))}
    </div>
  )
}
