import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, User } from 'lucide-react'
import { useClassStore } from '@/store/classStore'
import QRCode from 'qrcode'
import { generateA4HTML } from '../a4Template'
import type { StudentAdmission } from '../types'

export const ViewModal = React.memo(function ViewModal({
  student,
  isBn,
  onClose,
  teacherMap,
}: {
  student: StudentAdmission
  isBn: boolean
  onClose: () => void
  teacherMap: Map<string, { id: string; nameEn: string }>
}) {
  const download = useCallback(async () => {
    const qrDataUrl = await QRCode.toDataURL(student.id, { width: 120, margin: 1 })
    const tName = student.teacherId ? teacherMap.get(student.teacherId)?.nameEn : ''
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generateA4HTML(student, isBn, qrDataUrl, tName, useClassStore.getState().institution.name))
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [student, isBn, teacherMap])

  const sc = student.status === 'approved' ? 'var(--green)' : student.status === 'rejected' ? 'var(--red)' : 'var(--amber)'
  const sb =
    student.status === 'approved' ? 'var(--green-light)' : student.status === 'rejected' ? 'var(--red-light)' : 'var(--amber-light)'
  const st = isBn ? { pending: 'অপেক্ষমান', approved: 'অনুমোদিত', rejected: 'প্রত্যাখ্যাত' }[student.status] : student.status

  const row = (l: string, v: string) => (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', width: '8.125rem', flexShrink: 0 }}>{l}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{v || '—'}</span>
    </div>
  )

  return createPortal(
    <div
      className="modal-overlay"
    >
      <div
        className="modal-box modal-content"
        style={{ maxWidth: '42.5rem' }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--brand-light), var(--purple-light))',
          }}
        >
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'ছাত্রের প্রোফাইল' : 'Student Profile'}
            </h2>
            <p style={{ fontSize: '0.6875rem', color: 'var(--brand)', fontFamily: 'monospace', marginTop: '0.125rem' }}>{student.id}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: sc,
                background: sb,
                padding: '3px 10px',
                borderRadius: '1.25rem',
                border: `1px solid ${sc}`,
                textTransform: 'capitalize',
              }}
            >
              {st}
            </span>
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
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '1rem', alignItems: 'center' }}>
            <div
              style={{
                width: '5rem',
                height: '6.25rem',
                borderRadius: '0.625rem',
                border: '2px solid var(--border)',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {student.photo ? (
                <img src={student.photo} alt={student.nameEn || 'Student'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={28} style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>{student.nameEn}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{student.nameBn}</p>
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    background: 'var(--brand-light)',
                    color: 'var(--brand)',
                    padding: '2px 8px',
                    borderRadius: '0.3125rem',
                    fontWeight: 500,
                  }}
                >
                  {student.class} - {student.section}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    padding: '2px 8px',
                    borderRadius: '0.3125rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  {student.gender.split(' / ')[0]}
                </span>
                {student.bloodGroup && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      background: 'var(--red-light)',
                      color: 'var(--red)',
                      padding: '2px 8px',
                      borderRadius: '0.3125rem',
                    }}
                  >
                    {student.bloodGroup}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '0.625rem' }}>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--brand)',
                textTransform: 'uppercase',
                letterSpacing: '0.0313rem',
                marginBottom: '0.3125rem',
              }}
            >
              📋 {isBn ? 'ব্যক্তিগত' : 'Personal'}
            </div>
            {row(isBn ? 'জন্ম তারিখ' : 'DOB', student.dob)}
            {row(isBn ? 'ধর্ম' : 'Religion', student.religion.split(' / ')[0])}
            {row(isBn ? 'মোবাইল' : 'Mobile', student.phone)}
            {row(isBn ? 'জেলা' : 'District', student.district)}
          </div>
          <div style={{ marginBottom: '0.625rem' }}>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--teal)',
                textTransform: 'uppercase',
                letterSpacing: '0.0313rem',
                marginBottom: '0.3125rem',
              }}
            >
              🎓 {isBn ? 'একাডেমিক' : 'Academic'}
            </div>
            {row(isBn ? 'শিক্ষাবর্ষ' : 'Academic Year', student.academicYear)}
            {row(isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher', student.teacherId ? teacherMap.get(student.teacherId)?.nameEn || '—' : '—')}
            {row(isBn ? 'ভর্তির তারিখ' : 'Admission Date', student.admissionDate)}
            {row(isBn ? 'আগের স্কুল' : 'Prev School', student.previousSchool)}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--amber)',
                textTransform: 'uppercase',
                letterSpacing: '0.0313rem',
                marginBottom: '0.3125rem',
              }}
            >
              👨‍👩‍👧 {isBn ? 'পারিবারিক' : 'Family'}
            </div>
            {row(isBn ? 'পিতার নাম' : 'Father', student.fatherNameEn)}
            {row(isBn ? 'পিতার পেশা' : 'Father Occ.', student.fatherOccupation)}
            {row(isBn ? 'পিতার মোবাইল' : 'Father Mobile', student.fatherPhone)}
            {row(isBn ? 'মাতার নাম' : 'Mother', student.motherNameEn)}
            {row(isBn ? 'মাতার পেশা' : 'Mother Occ.', student.motherOccupation)}
            {row(isBn ? 'মাতার মোবাইল' : 'Mother Mobile', student.motherPhone)}
          </div>
        </div>
        <div
          style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 14px',
              borderRadius: '0.5625rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isBn ? 'বন্ধ' : 'Close'}
          </button>
          <button
            onClick={download}
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
            <Download size={14} /> {isBn ? 'A4 PDF' : 'Download A4 PDF'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
