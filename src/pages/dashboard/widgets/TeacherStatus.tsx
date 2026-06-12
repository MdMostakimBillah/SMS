import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'

export default function TeacherStatus() {
  const isBn = useBn()
  const { teachers } = useTeacherStore()

  const { totalTeachers, activeT, onLeaveT, inactiveT } = useMemo(() => {
    const total = teachers.length
    const active = teachers.filter((t) => t.status === 'active').length
    const onLeave = teachers.filter((t) => t.status === 'on-leave').length
    const inactive = teachers.filter((t) => t.status === 'inactive').length
    return { totalTeachers: total, activeT: active, onLeaveT: onLeave, inactiveT: inactive }
  }, [teachers])

  const items = [
    {
      label: isBn ? 'সক্রিয়' : 'Active',
      value: activeT,
      pct: totalTeachers > 0 ? Math.round((activeT / totalTeachers) * 100) : 0,
      color: 'var(--green)',
    },
    {
      label: isBn ? 'ছুটিতে' : 'On Leave',
      value: onLeaveT,
      pct: totalTeachers > 0 ? Math.round((onLeaveT / totalTeachers) * 100) : 0,
      color: 'var(--amber)',
    },
    {
      label: isBn ? 'নিষ্ক্রিয়' : 'Inactive',
      value: inactiveT,
      pct: totalTeachers > 0 ? Math.round((inactiveT / totalTeachers) * 100) : 0,
      color: 'var(--red)',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{item.label}</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.value} ({item.pct}%)
            </span>
          </div>
          <div style={{ height: '0.25rem', background: 'var(--border)', borderRadius: '0.125rem' }}>
            <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: '0.125rem' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
