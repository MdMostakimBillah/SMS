import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'

export default function AcademicOverview() {
  const isBn = useBn()
  const students = useSessionStudents()
  const { teachers } = useTeacherStore()

  const data = useMemo(() => {
    const totalStudents = students.length
    const totalTeachers = teachers.length
    const approvedStudents = students.filter((s) => s.status === 'approved').length
    const activeTeachers = teachers.filter((t) => t.status === 'active').length

    return [
      {
        bn: 'উপস্থিতির হার',
        en: 'Attendance Rate',
        val: `${totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 90) : 0}%`,
        bar: totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 90) : 0,
        color: 'var(--green)',
      },
      {
        bn: 'ভর্তির হার',
        en: 'Admission Rate',
        val: `${totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0}%`,
        bar: totalStudents > 0 ? Math.round((approvedStudents / totalStudents) * 100) : 0,
        color: 'var(--brand)',
      },
      {
        bn: 'শিক্ষক-ছাত্র অনুপাত',
        en: 'Teacher-Student Ratio',
        val: totalTeachers > 0 ? `${(totalStudents / totalTeachers).toFixed(1)}:1` : '0',
        bar: totalTeachers > 0 ? Math.min(Math.round((totalStudents / totalTeachers) * 10), 100) : 0,
        color: 'var(--teal)',
      },
      {
        bn: 'সক্রিয় শিক্ষক',
        en: 'Active Teachers',
        val: `${activeTeachers}/${totalTeachers}`,
        bar: totalTeachers > 0 ? Math.round((activeTeachers / totalTeachers) * 100) : 0,
        color: 'var(--amber)',
      },
    ]
  }, [students, teachers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {data.map((item) => (
        <div key={item.en}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3125rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{isBn ? item.bn : item.en}</span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.val}</span>
          </div>
          <div style={{ height: '0.3125rem', background: 'var(--border)', borderRadius: '0.1875rem', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${item.bar}%`,
                background: item.color,
                borderRadius: '0.1875rem',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
