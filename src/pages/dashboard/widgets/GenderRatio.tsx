import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'
import CircularChart from '@/components/ui/CircularChart'

export default function GenderRatio() {
  const isBn = useBn()
  const students = useSessionStudents()

  const { totalStudents, maleStudents, femaleStudents } = useMemo(() => {
    const total = students.length
    const male = students.filter((s) => s.gender === 'Male').length
    const female = students.filter((s) => s.gender === 'Female').length
    return { totalStudents: total, maleStudents: male, femaleStudents: female }
  }, [students])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <CircularChart
        value={totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0}
        size={72}
        stroke={7}
        color="var(--brand)"
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{isBn ? 'ছাত্র' : 'Male'}</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{maleStudents}</span>
        </div>
        <div style={{ height: '0.25rem', background: 'var(--border)', borderRadius: '0.125rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              height: '100%',
              width: `${totalStudents > 0 ? (maleStudents / totalStudents) * 100 : 0}%`,
              background: 'var(--brand)',
              borderRadius: '0.125rem',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{isBn ? 'ছাত্রী' : 'Female'}</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{femaleStudents}</span>
        </div>
        <div style={{ height: '0.25rem', background: 'var(--border)', borderRadius: '0.125rem' }}>
          <div
            style={{
              height: '100%',
              width: `${totalStudents > 0 ? (femaleStudents / totalStudents) * 100 : 0}%`,
              background: 'var(--teal)',
              borderRadius: '0.125rem',
            }}
          />
        </div>
      </div>
    </div>
  )
}
