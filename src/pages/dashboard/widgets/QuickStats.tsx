import { useMemo } from 'react'
import { Users, GraduationCap, CheckCircle2, Clock, UserCheck, UserX } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'

export default function QuickStats() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { teachers } = useTeacherStore()

  const items = useMemo(() => {
    const totalStudents = students.length
    const totalTeachers = teachers.length
    const approvedStudents = students.filter((s) => s.status === 'approved').length
    const pendingStudents = students.filter((s) => s.status === 'pending').length
    const maleStudents = students.filter((s) => s.gender === 'Male').length
    const femaleStudents = students.filter((s) => s.gender === 'Female').length

    return [
      { label: isBn ? 'মোট ছাত্র' : 'Total Students', value: totalStudents, icon: <Users size={14} />, color: 'var(--brand)' },
      { label: isBn ? 'শিক্ষক' : 'Teachers', value: totalTeachers, icon: <GraduationCap size={14} />, color: 'var(--amber)' },
      { label: isBn ? 'অনুমোদিত' : 'Approved', value: approvedStudents, icon: <CheckCircle2 size={14} />, color: 'var(--green)' },
      { label: isBn ? 'বিচারাধীন' : 'Pending', value: pendingStudents, icon: <Clock size={14} />, color: 'var(--purple)' },
      { label: isBn ? 'ছাত্র (ছেলে)' : 'Male', value: maleStudents, icon: <UserCheck size={14} />, color: 'var(--brand-2)' },
      { label: isBn ? 'ছাত্রী (মেয়ে)' : 'Female', value: femaleStudents, icon: <UserX size={14} />, color: 'var(--teal)' },
    ]
  }, [students, teachers, isBn])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '1.625rem',
              height: '1.625rem',
              borderRadius: '0.375rem',
              background: `${item.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.color,
              flexShrink: 0,
            }}
          >
            {item.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.value}</div>
            <div
              style={{
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
