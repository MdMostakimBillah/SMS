import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle } from 'lucide-react'
import type { StudentAdmission } from '../types'

interface ApproveModalProps {
  student: StudentAdmission
  isBn: boolean
  onClose: () => void
  onApprove: (sms: boolean, billingDate: string) => void
}
export const ApproveModal = React.memo(function ApproveModal({ student, isBn, onClose, onApprove }: ApproveModalProps) {
  const [sendSMS, setSendSMS] = useState(true)
  const [billingDate, setBillingDate] = useState(student.admissionDate || '')
  const [error, setError] = useState('')
  return createPortal(
    <div
      className="modal-overlay"
    >
      <div
        className="modal-box modal-content"
        style={{ maxWidth: '26.25rem' }}
      >
        <div
          style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '50%',
            background: 'var(--green-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <CheckCircle size={26} style={{ color: 'var(--green)' }} />
        </div>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '0.375rem' }}>
          {isBn ? 'ভর্তি অনুমোদন করবেন?' : 'Approve Admission?'}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem' }}>
          <strong>{student.nameEn}</strong> · {student.phone}
        </p>

        {/* SMS toggle */}
        <div
          onClick={() => setSendSMS((p) => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '12px 14px',
            background: sendSMS ? 'var(--teal-light)' : 'var(--bg-secondary)',
            border: `1px solid ${sendSMS ? 'var(--teal)' : 'var(--border)'}`,
            borderRadius: '0.625rem',
            cursor: 'pointer',
            marginBottom: '1rem',
            transition: 'all 0.15s',
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '1.25rem',
              borderRadius: '0.625rem',
              background: sendSMS ? 'var(--teal)' : 'var(--border-2)',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '0.125rem',
                left: sendSMS ? '18px' : '0.125rem',
                width: '1rem',
                height: '1rem',
                background: '#fff',
                borderRadius: '50%',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {isBn ? 'SMS নোটিফিকেশন পাঠান' : 'Send SMS Notification'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.0625rem' }}>
              {isBn ? `${student.phone} নম্বরে যাবে` : `Will be sent to ${student.phone}`}
            </div>
          </div>
        </div>

        {sendSMS && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '10px 12px',
              marginBottom: '0.875rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
              {isBn ? 'SMS প্রিভিউ' : 'SMS Preview'}
            </div>
            {isBn
              ? `প্রিয় ${student.nameBn || student.nameEn}, আপনার ভর্তি আবেদন (${student.id}) অনুমোদিত হয়েছে। Sunrise Academy তে আপনাকে স্বাগতম!`
              : `Dear ${student.nameEn}, your admission application (${student.id}) has been approved. Welcome to Sunrise Academy!`}
          </div>
        )}

        {/* Billing Date */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
            {isBn ? 'বিলিং তারিখ *' : 'Billing Date *'}
          </label>
          <input
            type="date"
            value={billingDate}
            onChange={(e) => { setBillingDate(e.target.value); setError('') }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--red)', marginTop: '0.25rem' }}>{error}</p>
          )}
          <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isBn ? 'এই তারিখ থেকে বিল গণনা শুরু হবে' : 'Bills will be calculated starting from this date'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.625rem',
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
              if (!billingDate) {
                setError(isBn ? 'বিলিং তারিখ আবশ্যক' : 'Billing date is required')
                return
              }
              onApprove(sendSMS, billingDate)
              onClose()
            }}
            style={{
              flex: 2,
              padding: '0.625rem',
              borderRadius: '0.5625rem',
              background: 'var(--green)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              opacity: billingDate ? 1 : 0.6,
            }}
          >
            ✓ {isBn ? 'অনুমোদন করুন' : 'Approve'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
