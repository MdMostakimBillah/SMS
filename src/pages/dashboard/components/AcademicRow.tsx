import React from 'react'
import type { TopStudentItem } from '../types'

interface Props {
  isBn: boolean
  topStudentsList: TopStudentItem[]
  totalStudents: number
  approvedStudents: number
  totalTeachers: number
  activeTeachers: number
  cardStyle: React.CSSProperties
  sectionHead: (color: string) => React.ReactNode
  col2: string
  gap: string
}

export const AcademicRow: React.FC<Props> = ({
  isBn,
  topStudentsList,
  totalStudents,
  approvedStudents,
  totalTeachers,
  activeTeachers,
  cardStyle,
  sectionHead,
  col2,
  gap,
}) => {
  return (
    <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
      {/* Top Students */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {sectionHead('var(--amber)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'শীর্ষ ছাত্র' : 'Top Students'}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 500,
              color: 'var(--amber)',
              background: 'var(--amber-light)',
              padding: '0.1875rem 0.5rem',
              borderRadius: '0.375rem',
            }}
          >
            {isBn ? 'এই টার্ম' : 'This Term'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {topStudentsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {isBn ? 'কোনো শিক্ষার্থী নেই' : 'No students found'}
            </div>
          ) : (
            topStudentsList.map((s, i) => (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.625rem',
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
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{s.cls}</div>
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--green)',
                    background: 'var(--green-light)',
                    padding: '0.1875rem 0.5rem',
                    borderRadius: '0.375rem',
                  }}
                >
                  {s.score}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Academic Overview */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.875rem',
          }}
        >
          {sectionHead('var(--green)')}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'একাডেমিক ওভারভিউ' : 'Academic Overview'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
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
          ].map((item) => (
            <div key={item.en}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.3125rem',
                }}
              >
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  {isBn ? item.bn : item.en}
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.val}
                </span>
              </div>
              <div
                style={{
                  height: '0.3125rem',
                  background: 'var(--border)',
                  borderRadius: '0.1875rem',
                  overflow: 'hidden',
                }}
              >
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
      </div>
    </div>
  )
}
