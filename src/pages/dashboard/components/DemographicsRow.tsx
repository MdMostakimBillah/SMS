import React from 'react'
import { Users, GraduationCap, CheckCircle2, Clock, UserCheck, UserX } from 'lucide-react'
import CircularChart from '@/components/ui/CircularChart'
import type { TeacherStatSummary } from '../types'

interface Props {
  isBn: boolean
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  totalTeachers: number
  teacherStats: TeacherStatSummary
  approvedStudents: number
  pendingStudents: number
  cardStyle: React.CSSProperties
  sectionHead: (color: string) => React.ReactNode
  col3: string
  gap: string
}

export const DemographicsRow: React.FC<Props> = ({
  isBn,
  totalStudents,
  maleStudents,
  femaleStudents,
  totalTeachers,
  teacherStats,
  approvedStudents,
  pendingStudents,
  cardStyle,
  sectionHead,
  col3,
  gap,
}) => {
  const { active: activeT, onLeave: onLeaveT, inactive: inactiveT } = teacherStats

  return (
    <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col3, gap }}>
      {/* Gender Distribution */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {sectionHead('var(--purple)')}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'লিঙ্গ অনুপাত' : 'Gender Ratio'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CircularChart
            value={totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0}
            size={72}
            stroke={7}
            color="var(--brand)"
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.375rem',
              }}
            >
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                {isBn ? 'ছাত্র' : 'Male'}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {maleStudents}
              </span>
            </div>
            <div
              style={{
                height: '0.25rem',
                background: 'var(--border)',
                borderRadius: '0.125rem',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${totalStudents > 0 ? (maleStudents / totalStudents) * 100 : 0}%`,
                  background: 'var(--brand)',
                  borderRadius: '0.125rem',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.375rem',
              }}
            >
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                {isBn ? 'ছাত্রী' : 'Female'}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {femaleStudents}
              </span>
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
      </div>

      {/* Teacher Status */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {sectionHead('var(--amber)')}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'শিক্ষকের অবস্থা' : 'Teacher Status'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[
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
          ].map((item) => (
            <div key={item.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {item.value} ({item.pct}%)
                </span>
              </div>
              <div
                style={{ height: '0.25rem', background: 'var(--border)', borderRadius: '0.125rem' }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    background: item.color,
                    borderRadius: '0.125rem',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card--premium" style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {sectionHead('var(--teal)')}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isBn ? 'দ্রুত পরিসংখ্যান' : 'Quick Stats'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {[
            {
              label: isBn ? 'মোট ছাত্র' : 'Total Students',
              value: totalStudents,
              icon: <Users size={14} />,
              color: 'var(--brand)',
            },
            {
              label: isBn ? 'শিক্ষক' : 'Teachers',
              value: totalTeachers,
              icon: <GraduationCap size={14} />,
              color: 'var(--amber)',
            },
            {
              label: isBn ? 'অনুমোদিত' : 'Approved',
              value: approvedStudents,
              icon: <CheckCircle2 size={14} />,
              color: 'var(--green)',
            },
            {
              label: isBn ? 'বিচারাধীন' : 'Pending',
              value: pendingStudents,
              icon: <Clock size={14} />,
              color: 'var(--purple)',
            },
            {
              label: isBn ? 'ছাত্র (ছেলে)' : 'Male',
              value: maleStudents,
              icon: <UserCheck size={14} />,
              color: 'var(--brand-2)',
            },
            {
              label: isBn ? 'ছাত্রী (মেয়ে)' : 'Female',
              value: femaleStudents,
              icon: <UserX size={14} />,
              color: 'var(--teal)',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.625rem',
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
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {item.value}
                </div>
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
      </div>
    </div>
  )
}
