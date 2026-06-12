import { useMemo } from 'react'
import { CheckCircle2, Clock, UserX } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useSessionStudents } from '@/store/admissionStore'

export default function RecentAdmissions() {
  const isBn = useBn()
  const students = useSessionStudents()

  const recentStudents = useMemo(
    () => [...students].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [students]
  )

  return (
    <>
      {recentStudents.length === 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
          {isBn ? 'এখনো কোনো ভর্তি নেই' : 'No admissions yet'}
        </div>
      )}
      {recentStudents.map((s, i) => (
        <div
          key={s.id}
          style={{
            display: 'flex',
            gap: '0.625rem',
            padding: '8px 0',
            borderBottom: i < recentStudents.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '0.4375rem',
              background: `${s.status === 'approved' ? 'var(--green)' : s.status === 'pending' ? 'var(--amber)' : 'var(--red)'}15`,
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
      ))}
    </>
  )
}
