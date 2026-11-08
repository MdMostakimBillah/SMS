import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavPath } from '@/hooks/useNavPath'
import {
  CheckCircle2,
  Clock,
  UserX,
  ClipboardList,
  Users,
  FlaskConical,
  Award,
} from 'lucide-react'
import type { StudentAdmission } from '@/pages/students/admission/types'

interface Props {
  isBn: boolean
  recentStudents: StudentAdmission[]
  cardStyle: React.CSSProperties
  sectionHead: (color: string) => React.ReactNode
  col2: string
  gap: string
}

export const ActivityRow: React.FC<Props> = ({
  isBn,
  recentStudents,
  cardStyle,
  sectionHead,
  col2,
  gap,
}) => {
  const navigate = useNavigate()
  const nav = useNavPath()

  return (
    <div className="gsap-fade-up" style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
      {/* Recent Admissions */}
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
            {sectionHead('var(--brand)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'সাম্প্রতিক ভর্তি' : 'Recent Admissions'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate(nav('/students/all'))}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.6875rem',
              color: 'var(--brand)',
              cursor: 'pointer',
              fontWeight: 500,
              padding: 0,
            }}
          >
            {isBn ? 'সব →' : 'All →'}
          </button>
        </div>

        {recentStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {isBn ? 'কোনো শিক্ষার্থী নেই' : 'No students found'}
          </div>
        ) : (
          recentStudents.map((s, i) => (
            <div
              key={s.id}
              onClick={() => navigate(nav('/students/all'), { state: { studentId: s.id } })}
              style={{
                display: 'flex',
                gap: '0.625rem',
                padding: '0.5rem 0.25rem',
                borderBottom: i < recentStudents.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                borderRadius: '0.375rem',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.4375rem',
                  background: `${
                    s.status === 'approved'
                      ? 'var(--green)'
                      : s.status === 'pending'
                        ? 'var(--amber)'
                        : 'var(--red)'
                  }15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {s.status === 'approved' ? (
                  <CheckCircle2 size={13} color="var(--green)" />
                ) : s.status === 'pending' ? (
                  <Clock size={13} color="var(--amber)" />
                ) : (
                  <UserX size={13} color="var(--red)" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.nameEn} — {isBn ? `শ্রেণি ${s.class} ${s.section}` : `Class ${s.class} ${s.section}`}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {s.status === 'approved'
                    ? isBn
                      ? 'ভর্তি নিশ্চিত'
                      : 'Enrolled'
                    : s.status === 'pending'
                      ? isBn
                        ? 'অপেক্ষমান'
                        : 'Pending'
                      : isBn
                        ? 'বাতিল'
                        : 'Rejected'}
                  {' · '}
                  {s.createdAt}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upcoming Events */}
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
            {sectionHead('var(--teal)')}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'আসন্ন ইভেন্ট' : 'Upcoming Events'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate(nav('/notice'))}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.6875rem',
              color: 'var(--brand)',
              cursor: 'pointer',
              fontWeight: 500,
              padding: 0,
            }}
          >
            {isBn ? 'ক্যালেন্ডার →' : 'Calendar →'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            {
              bn: 'বার্ষিক পরীক্ষা শুরু',
              en: 'Annual Exam begins',
              dbn: '২০ মে',
              den: 'May 20',
              color: 'var(--red)',
              icon: <ClipboardList size={12} />,
              path: '/exams',
            },
            {
              bn: 'অভিভাবক-শিক্ষক সভা',
              en: 'Parent-Teacher Meeting',
              dbn: '২৪ মে',
              den: 'May 24',
              color: 'var(--amber)',
              icon: <Users size={12} />,
              path: '/notice',
            },
            {
              bn: 'বিজ্ঞান মেলা ২০২৬',
              en: 'Science Fair 2026',
              dbn: '২ জুন',
              den: 'Jun 2',
              color: 'var(--teal)',
              icon: <FlaskConical size={12} />,
              path: '/notice',
            },
            {
              bn: 'টার্ম ২ ফলাফল',
              en: 'Term 2 Result',
              dbn: '১৫ জুন',
              den: 'Jun 15',
              color: 'var(--brand)',
              icon: <Award size={12} />,
              path: '/exams/results',
            },
          ].map((ev, i) => (
            <div
              key={i}
              onClick={() => navigate(nav(ev.path))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            >
              <div
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.4375rem',
                  background: `${ev.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: ev.color,
                  flexShrink: 0,
                }}
              >
                {ev.icon}
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {isBn ? ev.bn : ev.en}
              </div>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: ev.color,
                  background: `${ev.color}15`,
                  padding: '0.1875rem 0.5rem',
                  borderRadius: '0.375rem',
                  flexShrink: 0,
                }}
              >
                {isBn ? ev.dbn : ev.den}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
