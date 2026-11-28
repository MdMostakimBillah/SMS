import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavPath } from '@/hooks/useNavPath'
import { Users, GraduationCap, Wallet } from 'lucide-react'

interface Props {
  isBn: boolean
  isMobile: boolean
  totalStudents: number
  approvedStudents: number
  maleStudents: number
  femaleStudents: number
  totalTeacherSalary: number
  canReadStudents: boolean
  canReadTeachers: boolean
  col4: string
  gap: string
}

export const StatsRow: React.FC<Props> = ({
  isBn,
  isMobile,
  totalStudents,
  approvedStudents,
  maleStudents,
  femaleStudents,
  totalTeacherSalary,
  canReadStudents,
  canReadTeachers,
  col4,
  gap,
}) => {
  const navigate = useNavigate()
  const nav = useNavPath()

  const statItems = [
    ...(canReadStudents
      ? [
          {
            labelBn: 'মোট ছাত্র',
            labelEn: 'Total Students',
            value: totalStudents,
            icon: <Users size={14} />,
            color: 'var(--brand)',
            path: '/students/all',
          },
          {
            labelBn: 'সক্রিয় ছাত্র',
            labelEn: 'Active Students',
            value: approvedStudents,
            icon: <GraduationCap size={14} />,
            color: 'var(--green)',
            path: '/students/all',
          },
          {
            labelBn: 'ছাত্র (ছেলে/মেয়ে)',
            labelEn: 'M/F Students',
            value: `${maleStudents}/${femaleStudents}`,
            icon: <Users size={14} />,
            color: 'var(--teal)',
            path: '/students/all',
          },
        ]
      : []),
    ...(canReadTeachers
      ? [
          {
            labelBn: 'কর্মচারী বেতন',
            labelEn: 'Employee Salary',
            value: totalTeacherSalary,
            icon: <Wallet size={14} />,
            color: 'var(--amber)',
            isCurrency: true,
            path: '/payroll',
          },
        ]
      : []),
  ]

  if (statItems.length === 0) return null

  return (
    <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col4, gap }}>
      {statItems.map((s) => (
        <div
          key={s.labelEn}
          onClick={() => s.path && navigate(nav(s.path))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            boxShadow: 'var(--shadow-xs)',
            cursor: s.path ? 'pointer' : 'default',
            transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (s.path) {
              e.currentTarget.style.borderColor = 'var(--brand)'
              e.currentTarget.style.background = 'var(--surface-hover)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }
          }}
          onMouseLeave={(e) => {
            if (s.path) {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
            }
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.color,
              flexShrink: 0,
            }}
          >
            {s.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: isMobile ? '1.0625rem' : '1.1875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em',
              }}
            >
              {'isCurrency' in s && s.isCurrency ? `৳${s.value.toLocaleString()}` : s.value}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginTop: '0.125rem',
                whiteSpace: 'nowrap',
              }}
            >
              {isBn ? s.labelBn : s.labelEn}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
