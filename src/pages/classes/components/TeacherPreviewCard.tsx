import { Phone, Signature } from 'lucide-react'
import type { Teacher } from '@/pages/teachers/types'
import type { InstitutionSettings } from '@/store/classStore'

interface TeacherPreviewCardProps {
  teacher: Teacher
  institution: InstitutionSettings
}

export function TeacherPreviewCard({ teacher: t, institution }: TeacherPreviewCardProps) {
  return (
    <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', overflow: 'hidden',
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {t.photo ? (
            <img src={t.photo} alt={t.nameEn || 'Teacher'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
              {t.nameEn.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.nameEn}
          </div>
          <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>{t.designation || ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <Phone size={9} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.5625rem', color: 'var(--text-secondary)' }}>{institution.phone}</span>
        </div>
      </div>
      {t.signature && (
        <div style={{ marginTop: '0.375rem', padding: '4px 6px', borderRadius: '0.3125rem', background: 'var(--bg-primary)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Signature size={10} style={{ color: 'var(--text-muted)' }} />
          <img src={t.signature} alt="Sig" style={{ height: '1rem', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}
