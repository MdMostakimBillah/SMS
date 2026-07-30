import React, { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Save } from 'lucide-react'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import type { StudentAdmission } from '../types'
import { EField } from './EField'

interface EditModalProps {
  student: StudentAdmission
  isBn: boolean
  onClose: () => void
  onSave: (d: Partial<StudentAdmission>) => void
}
export const EditModal = React.memo(function EditModal({ student, isBn, onClose, onSave }: EditModalProps) {
  const [f, setF] = useState({ ...student })
  const s = useCallback((k: keyof StudentAdmission, v: string) => setF((p) => ({ ...p, [k]: v })), [])
  const { isMobile } = useWindowSize()
  const { classes } = useClassStore()
  const g = (n: number): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : `repeat(${n},1fr)`,
    gap: '0.625rem',
  })

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const teachers = useTeacherStore((s) => s.teachers)
  const teacherOptions = useMemo(
    () => teachers.filter((t) => t.status === 'active').map((t) => `${t.id} - ${t.nameEn}`),
    [teachers]
  )

  return createPortal(
    <div
      className="modal-overlay"
    >
      <div
        className="modal-box modal-content"
        style={{ maxWidth: '51.25rem' }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'তথ্য সম্পাদনা' : 'Edit Student'}</h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--brand)', fontFamily: 'monospace', marginTop: '0.125rem' }}>{f.id}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            style={{
              width: '1.875rem',
              height: '1.875rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--brand)',
              textTransform: 'uppercase',
              letterSpacing: '0.0313rem',
              marginBottom: '0.5rem',
            }}
          >
            {isBn ? '• ব্যক্তিগত' : '• Personal'}
          </div>
          <div style={{ ...g(3), marginBottom: '0.625rem' }}>
            <EField label={isBn ? 'নাম (ইং)' : 'Name EN'} value={f.nameEn} onChange={(v) => s('nameEn', v)} />
            <EField label={isBn ? 'নাম (বাং)' : 'Name BN'} value={f.nameBn} onChange={(v) => s('nameBn', v)} />
            <EField label={isBn ? 'জন্ম তারিখ' : 'DOB'} value={f.dob} onChange={(v) => s('dob', v)} type="date" />
          </div>
          <div style={{ ...g(3), marginBottom: '0.625rem' }}>
            <EField
              label={isBn ? 'লিঙ্গ' : 'Gender'}
              value={f.gender}
              onChange={(v) => s('gender', v)}
              opts={['Male / পুরুষ', 'Female / মহিলা', 'Other / অন্যান্য']}
            />
            <EField
              label={isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
              value={f.bloodGroup}
              onChange={(v) => s('bloodGroup', v)}
              opts={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
            />
            <EField
              label={isBn ? 'ধর্ম' : 'Religion'}
              value={f.religion}
              onChange={(v) => s('religion', v)}
              opts={['Islam / ইসলাম', 'Hinduism / হিন্দু', 'Christianity / খ্রিস্টান', 'Buddhism / বৌদ্ধ', 'Other / অন্যান্য']}
            />
          </div>
          <div style={{ ...g(3), marginBottom: '0.875rem' }}>
            <EField label={isBn ? 'মোবাইল' : 'Mobile'} value={f.phone} onChange={(v) => s('phone', v)} type="tel" />
            <EField label="Email" value={f.email} onChange={(v) => s('email', v)} type="email" />
            <EField label={isBn ? 'জেলা' : 'District'} value={f.district} onChange={(v) => s('district', v)} />
          </div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--teal)',
              textTransform: 'uppercase',
              letterSpacing: '0.0313rem',
              marginBottom: '0.5rem',
            }}
          >
            {isBn ? '• একাডেমিক' : '• Academic'}
          </div>
          <div style={{ ...g(3), marginBottom: '0.875rem' }}>
            <EField
              label={isBn ? 'শ্রেণি' : 'Class'}
              value={f.class}
              onChange={(v) => {
                s('class', v)
                s('section', '')
              }}
              opts={classOptions}
            />
            <EField
              label={isBn ? 'সেকশন' : 'Section'}
              value={f.section}
              onChange={(v) => s('section', v)}
              opts={f.class ? sectionsMap[f.class] || [] : []}
            />
            <EField label={isBn ? 'রোল' : 'Roll'} value={f.roll} onChange={(v) => s('roll', v)} />
            <EField
              label={isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
              value={f.teacherId}
              onChange={(v) => s('teacherId', v)}
              opts={teacherOptions}
            />
          </div>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--amber)',
              textTransform: 'uppercase',
              letterSpacing: '0.0313rem',
              marginBottom: '0.5rem',
            }}
          >
            {isBn ? '• পিতামাতা' : '• Parents'}
          </div>
          <div style={{ ...g(3), marginBottom: '0.875rem' }}>
            <EField label={isBn ? 'পিতার নাম (ইং)' : 'Father EN'} value={f.fatherNameEn} onChange={(v) => s('fatherNameEn', v)} />
            <EField
              label={isBn ? 'পিতার মোবাইল' : 'Father Mobile'}
              value={f.fatherPhone}
              onChange={(v) => s('fatherPhone', v)}
              type="tel"
            />
            <EField label={isBn ? 'পিতার পেশা' : 'Father Occ.'} value={f.fatherOccupation} onChange={(v) => s('fatherOccupation', v)} />
          </div>
          <div style={{ ...g(3), marginBottom: '0.875rem' }}>
            <EField label={isBn ? 'মাতার নাম (ইং)' : 'Mother EN'} value={f.motherNameEn} onChange={(v) => s('motherNameEn', v)} />
            <EField
              label={isBn ? 'মাতার মোবাইল' : 'Mother Mobile'}
              value={f.motherPhone}
              onChange={(v) => s('motherPhone', v)}
              type="tel"
            />
            <EField label={isBn ? 'মাতার পেশা' : 'Mother Occ.'} value={f.motherOccupation} onChange={(v) => s('motherOccupation', v)} />
          </div>
        </div>
        <div
          style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: '0.5625rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              onSave(f)
              onClose()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '9px 18px',
              borderRadius: '0.5625rem',
              background: 'var(--brand)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Save size={14} /> {isBn ? 'সেভ' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
