import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle,
  XCircle,
  X,
  Save,
  Download,
  User,
  Search,
  FileSpreadsheet,
  FileText,
  Users,
  Eye,
  Edit2,
  Check,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown,
  MoreVertical,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { PDFOptionsModal } from '@/components/shared/PDFOptionsModal'
import { useTeacherStore } from '@/store/teacherStore'
import type { StudentAdmission } from './types'
import { generateA4HTML } from './a4Template'
import { generateListPDF } from './listPdfTemplate'
import type { ListPDFOptions } from './listPdfTemplate'
import QRCode from 'qrcode'

const PER_PAGE = [10, 20, 30, 50, 100, 200, 500, 1000]
const RELIGIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism']

// ═══════════════════════════════════════════════
// Approve Modal — with SMS option
// ═══════════════════════════════════════════════
interface ApproveModalProps {
  student: StudentAdmission
  isBn: boolean
  onClose: () => void
  onApprove: (sms: boolean) => void
}
const ApproveModal = React.memo(function ApproveModal({ student, isBn, onClose, onApprove }: ApproveModalProps) {
  const [sendSMS, setSendSMS] = useState(true)
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
              onApprove(sendSMS)
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
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
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

// ═══════════════════════════════════════════════
// Reject Modal — with SMS option
// ═══════════════════════════════════════════════
interface RejectModalProps {
  student: StudentAdmission
  isBn: boolean
  onClose: () => void
  onReject: (sms: boolean) => void
}
const RejectModal = React.memo(function RejectModal({ student, isBn, onClose, onReject }: RejectModalProps) {
  const [sendSMS, setSendSMS] = useState(true)
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
            background: 'var(--red-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <XCircle size={26} style={{ color: 'var(--red)' }} />
        </div>
        <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '0.375rem' }}>
          {isBn ? 'ভর্তি প্রত্যাখ্যান করবেন?' : 'Reject Admission?'}
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
              ? `প্রিয় ${student.nameBn || student.nameEn}, আপনার ভর্তি আবেদন (${student.id}) প্রত্যাখ্যাত হয়েছে।`
              : `Dear ${student.nameEn}, your admission application (${student.id}) has been rejected.`}
          </div>
        )}

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
              onReject(sendSMS)
              onClose()
            }}
            style={{
              flex: 2,
              padding: '0.625rem',
              borderRadius: '0.5625rem',
              background: 'var(--red)',
              border: 'none',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
            }}
          >
            ✗ {isBn ? 'প্রত্যাখ্যান করুন' : 'Reject'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})

// ═══════════════════════════════════════════════
// Edit Modal
// ═══════════════════════════════════════════════
interface EditModalProps {
  student: StudentAdmission
  isBn: boolean
  onClose: () => void
  onSave: (d: Partial<StudentAdmission>) => void
}
interface EFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  opts?: string[]
}
const EField = React.memo(function EField({ label, value, onChange, type = 'text', opts }: EFieldProps) {
  const inputClass = 'w-full h-[2.75rem] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] hover:border-[var(--border-2)] hover:shadow-[var(--shadow-sm)] transition-all duration-200'

  if (opts) {
    return (
      <div>
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">-- Select --</option>
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'date') {
    return (
      <div>
        <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
          {label}
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
    )
  }

  return (
    <div>
      <label className="block text-[0.8125rem] font-medium text-[var(--text-primary)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  )
})

const EditModal = React.memo(function EditModal({ student, isBn, onClose, onSave }: EditModalProps) {
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

// ═══════════════════════════════════════════════
// View Modal (A4)
// ═══════════════════════════════════════════════
const ViewModal = React.memo(function ViewModal({
  student,
  isBn,
  onClose,
}: {
  student: StudentAdmission
  isBn: boolean
  onClose: () => void
}) {
  const download = useCallback(async () => {
    const qrDataUrl = await QRCode.toDataURL(student.id, { width: 120, margin: 1 })
    const tName = student.teacherId ? useTeacherStore.getState().teachers.find((t) => t.id === student.teacherId)?.nameEn : ''
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(generateA4HTML(student, isBn, qrDataUrl, tName, useClassStore.getState().institution.name))
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [student, isBn])

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
                <img src={student.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
            {row(isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher', student.teacherId ? useTeacherStore.getState().teachers.find((t) => t.id === student.teacherId)?.nameEn || '—' : '—')}
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

// ═══════════════════════════════════════════════
// Main Manage Page
// ═══════════════════════════════════════════════
export default function AdmissionManage() {
  const { isMobile } = useWindowSize()
  const updateStudent = useAdmissionStore((s) => s.updateStudent)
  const approveStudent = useAdmissionStore((s) => s.approveStudent)
  const rejectStudent = useAdmissionStore((s) => s.rejectStudent)
  const allStudents = useAdmissionStore((s) => s.students)
  const { classes, institution } = useClassStore()
  const teachers = useTeacherStore((s) => s.teachers)
  const currentSession = institution.currentSession

  const students = useMemo(
    () => allStudents.filter((s) => s.academicYear === currentSession),
    [allStudents, currentSession]
  )
  const isBn = useBn()

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const set = new Set<string>()
    classes.forEach((cls) => cls.sections.forEach((s) => set.add(s.name)))
    return Array.from(set).sort()
  }, [classes])

  const [search, setSearch] = useState('')
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [fGender, setFGender] = useState('')
  const [fReligion, setFReligion] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fDate, setFDate] = useState<'today' | 'week' | 'month' | 'custom' | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  const [approvingStudent, setApprovingStudent] = useState<StudentAdmission | null>(null)
  const [rejectingStudent, setRejectingStudent] = useState<StudentAdmission | null>(null)
  const [editingStudent, setEditingStudent] = useState<StudentAdmission | null>(null)
  const [viewingStudent, setViewingStudent] = useState<StudentAdmission | null>(null)
  const [showPDFModal, setShowPDFModal] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false)
      }
    }
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActionMenu])

  useScrollLock(approvingStudent !== null || rejectingStudent !== null || editingStudent !== null || viewingStudent !== null || showPDFModal)

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (search) {
          const q = search.toLowerCase()
          if (!s.nameEn.toLowerCase().includes(q) && !s.nameBn.includes(search) && !s.id.includes(search) && !s.phone.includes(search))
            return false
        }
        if (fClass && s.class !== fClass) return false
        if (fSection && s.section !== fSection) return false
        if (fGender && !s.gender.includes(fGender)) return false
        if (fReligion && !s.religion.includes(fReligion)) return false
        if (fStatus && s.status !== fStatus) return false
        if (fDate) {
          const d = new Date(s.admissionDate),
            now = new Date()
          if (fDate === 'today' && d.toDateString() !== now.toDateString()) return false
          if (fDate === 'week' && d < new Date(now.getTime() - 7 * 86400000)) return false
          if (fDate === 'month' && d < new Date(now.getTime() - 30 * 86400000)) return false
          if (fDate === 'custom' && dateFrom && dateTo && (d < new Date(dateFrom) || d > new Date(dateTo))) return false
        }
        return true
      }),
    [students, currentSession, search, fClass, fSection, fGender, fReligion, fStatus, fDate, dateFrom, dateTo]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const sp = Math.min(page, totalPages)
  const paginated = useMemo(() => filtered.slice((sp - 1) * perPage, sp * perPage), [filtered, sp, perPage])

  const stats = useMemo(
    () => ({
      total: filtered.length,
      pending: filtered.filter((s) => s.status === 'pending').length,
      approved: filtered.filter((s) => s.status === 'approved').length,
      rejected: filtered.filter((s) => s.status === 'rejected').length,
      male: filtered.filter((s) => s.gender.includes('Male')).length,
      female: filtered.filter((s) => s.gender.includes('Female')).length,
    }),
    [filtered]
  )

  const pageIds = paginated.map((s) => s.id)
  const allSel = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const toggleAll = useCallback(() => {
    setSelected((p) => (allSel ? p.filter((id) => !pageIds.includes(id)) : [...new Set([...p, ...pageIds])]))
  }, [allSel, pageIds])
  const toggleOne = useCallback((id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }, [])

  const handleApprove = useCallback(
    (student: StudentAdmission, sms: boolean) => {
      approveStudent(student.id)
      if (sms) console.log(`📱 SMS → ${student.phone}: আপনার ভর্তি অনুমোদিত হয়েছে! আইডি: ${student.id} — Sunrise Academy`)
    },
    [approveStudent]
  )

  const handleReject = useCallback(
    (student: StudentAdmission, sms: boolean) => {
      rejectStudent(student.id)
      if (sms) console.log(`📱 SMS → ${student.phone}: আপনার ভর্তি আবেদন প্রত্যাখ্যাত হয়েছে। আইডি: ${student.id}`)
    },
    [rejectStudent]
  )

  const exportExcel = useCallback(() => {
    const instName = institution.name || 'Institution'
    const instNameBn = institution.nameBn || ''
    const instAddress = institution.address || ''
    const instPhone = institution.phone || ''
    const instEmail = institution.email || ''

    const studentsData = (selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered).map((s, i) => ({
      '#': i + 1,
      'Student ID': s.id,
      'Name EN': s.nameEn,
      'Name BN': s.nameBn,
      Class: s.class,
      Section: s.section,
      Roll: s.roll,
      Gender: s.gender.split(' / ')[0],
      DOB: s.dob,
      'Blood Group': s.bloodGroup,
      Religion: s.religion.split(' / ')[0],
      Mobile: s.phone,
      Email: s.email,
      District: s.district,
      Father: s.fatherNameEn,
      'Father Mobile': s.fatherPhone,
      Mother: s.motherNameEn,
      'Mother Mobile': s.motherPhone,
      'Admission Date': s.admissionDate,
      Status: s.status,
    }))

    const ws = XLSX.utils.json_to_sheet(studentsData)
    XLSX.utils.sheet_add_aoa(ws, [
      [instName],
      [instNameBn],
      [instAddress],
      [`Phone: ${instPhone} | Email: ${instEmail}`],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Admissions')
    XLSX.writeFile(wb, `admissions_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [selected, filtered, institution])

  const handleListPDF = useCallback(
    (opts: ListPDFOptions) => {
      const list = selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered
      const html = generateListPDF(list, { ...opts, institutionName: institution.name })
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
      setShowPDFModal(false)
    },
    [selected, filtered]
  )

  const clearFilters = useCallback(() => {
    setSearch('')
    setFClass('')
    setFSection('')
    setFGender('')
    setFReligion('')
    setFStatus('')
    setFDate('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }, [])
  const hasFilter = search || fClass || fSection || fGender || fReligion || fStatus || fDate

  const sel: React.CSSProperties = {
    padding: '7px 9px',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    outline: 'none',
  }

  const statusBadge = (st: string) => {
    const m: Record<string, { bg: string; c: string; l: string; lb: string }> = {
      pending: { bg: 'var(--amber-light)', c: 'var(--amber)', l: 'Pending', lb: 'অপেক্ষমান' },
      approved: { bg: 'var(--green-light)', c: 'var(--green)', l: 'Approved', lb: 'অনুমোদিত' },
      rejected: { bg: 'var(--red-light)', c: 'var(--red)', l: 'Rejected', lb: 'প্রত্যাখ্যাত' },
    }
    const x = m[st] || m.pending
    return (
      <span
        style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: '0.625rem',
          background: x.bg,
          color: x.c,
          whiteSpace: 'nowrap',
        }}
      >
        {isBn ? x.lb : x.l}
      </span>
    )
  }

  return (
    <div>
      {/* Modals */}
      {approvingStudent && (
        <ApproveModal
          student={approvingStudent}
          isBn={isBn}
          onClose={() => setApprovingStudent(null)}
          onApprove={(sms) => handleApprove(approvingStudent, sms)}
        />
      )}
      {rejectingStudent && (
        <RejectModal
          student={rejectingStudent}
          isBn={isBn}
          onClose={() => setRejectingStudent(null)}
          onReject={(sms) => handleReject(rejectingStudent, sms)}
        />
      )}
      {editingStudent && (
        <EditModal
          student={editingStudent}
          isBn={isBn}
          onClose={() => setEditingStudent(null)}
          onSave={(d) => updateStudent(editingStudent.id, d)}
        />
      )}
      {viewingStudent && <ViewModal student={viewingStudent} isBn={isBn} onClose={() => setViewingStudent(null)} />}
      {showPDFModal && (
        <PDFOptionsModal
          count={selected.length > 0 ? selected.length : filtered.length}
          isBn={isBn}
          students={selected.length > 0 ? filtered.filter((s) => selected.includes(s.id)) : filtered}
          teachers={teachers}
          onClose={() => setShowPDFModal(false)}
          onDownload={handleListPDF}
        />
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(6,1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[
          { l: isBn ? 'মোট' : 'Total', v: stats.total, c: 'var(--brand)', b: 'var(--brand-light)' },
          { l: isBn ? 'অপেক্ষমান' : 'Pending', v: stats.pending, c: 'var(--amber)', b: 'var(--amber-light)' },
          { l: isBn ? 'অনুমোদিত' : 'Approved', v: stats.approved, c: 'var(--green)', b: 'var(--green-light)' },
          { l: isBn ? 'প্রত্যাখ্যাত' : 'Rejected', v: stats.rejected, c: 'var(--red)', b: 'var(--red-light)' },
          { l: isBn ? 'ছেলে' : 'Male', v: stats.male, c: 'var(--teal)', b: 'var(--teal-light)' },
          { l: isBn ? 'মেয়ে' : 'Female', v: stats.female, c: 'var(--purple)', b: 'var(--purple-light)' },
        ].map((x) => (
          <div
            key={x.l}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              padding: '0.625rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: x.c }}>{x.v}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.0625rem' }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '12px 14px',
          marginBottom: '0.625rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr 1fr 1fr',
            gap: '0.5rem',
            marginBottom: fDate === 'custom' ? '8px' : '0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4375rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              padding: '7px 10px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={isBn ? 'নাম, আইডি, মোবাইল...' : 'Name, ID, mobile...'}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <select
            value={fClass}
            onChange={(e) => {
              setFClass(e.target.value)
              setFSection('')
              setPage(1)
            }}
            style={sel}
          >
            <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={fSection}
            onChange={(e) => {
              setFSection(e.target.value)
              setPage(1)
            }}
            style={sel}
          >
            <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
            {(fClass ? sectionsMap[fClass] || [] : allSections).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={fGender}
            onChange={(e) => {
              setFGender(e.target.value)
              setPage(1)
            }}
            style={sel}
          >
            <option value="">{isBn ? 'সব লিঙ্গ' : 'All Genders'}</option>
            <option value="Male">{isBn ? 'ছেলে' : 'Male'}</option>
            <option value="Female">{isBn ? 'মেয়ে' : 'Female'}</option>
          </select>
          <select
            value={fReligion}
            onChange={(e) => {
              setFReligion(e.target.value)
              setPage(1)
            }}
            style={sel}
          >
            <option value="">{isBn ? 'সব ধর্ম' : 'All Religions'}</option>
            {RELIGIONS.map((r) => (
              <option key={r} value={r}>
                {isBn ? { Islam: 'ইসলাম', Hinduism: 'হিন্দু', Christianity: 'খ্রিস্টান', Buddhism: 'বৌদ্ধ' }[r] : r}
              </option>
            ))}
          </select>
          <select
            value={fStatus}
            onChange={(e) => {
              setFStatus(e.target.value)
              setPage(1)
            }}
            style={sel}
          >
            <option value="">{isBn ? 'সব অবস্থা' : 'All Status'}</option>
            <option value="pending">{isBn ? 'অপেক্ষমান' : 'Pending'}</option>
            <option value="approved">{isBn ? 'অনুমোদিত' : 'Approved'}</option>
            <option value="rejected">{isBn ? 'প্রত্যাখ্যাত' : 'Rejected'}</option>
          </select>
          <select
            value={fDate}
            onChange={(e) => {
              setFDate(e.target.value as any)
              setPage(1)
            }}
            style={sel}
          >
            <option value="">{isBn ? 'সব তারিখ' : 'All Dates'}</option>
            <option value="today">{isBn ? 'আজকে' : 'Today'}</option>
            <option value="week">{isBn ? 'গত সপ্তাহ' : 'Last Week'}</option>
            <option value="month">{isBn ? 'গত মাস' : 'Last Month'}</option>
            <option value="custom">{isBn ? 'কাস্টম' : 'Custom'}</option>
          </select>
        </div>
        {fDate === 'custom' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'থেকে:' : 'From:'}</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...sel, padding: '6px 8px' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'পর্যন্ত:' : 'To:'}</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...sel, padding: '6px 8px' }} />
          </div>
        )}
        {hasFilter && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3125rem',
              padding: '4px 10px',
              borderRadius: '0.375rem',
              background: 'var(--red-light)',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              fontSize: '0.6875rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginTop: fDate === 'custom' ? '0' : '0.375rem',
            }}
          >
            <X size={11} /> {isBn ? 'ফিল্টার সরান' : 'Clear'}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isBn ? 'প্রতি পাতায়:' : 'Per page:'}</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
            style={{ ...sel, padding: '5px 8px' }}
          >
            {PER_PAGE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {selected.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--brand)',
                background: 'var(--brand-light)',
                padding: '3px 10px',
                borderRadius: '0.375rem',
                fontWeight: 500,
              }}
            >
              {selected.length} {isBn ? 'টি নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: '0.375rem' }}>
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3125rem',
              padding: '7px 12px',
              borderRadius: '0.5rem',
              background: 'var(--brand-light)',
              border: '1px solid var(--brand)',
              color: 'var(--brand)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            <MoreVertical size={13} />
            {isBn ? 'অ্যাকশন' : 'Action'}
            <ChevronDown size={12} />
          </button>
          {showActionMenu && (
            <div
              ref={actionMenuRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.375rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: '12.5rem',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => {
                  exportExcel()
                  setShowActionMenu(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                {isBn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
              </button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
              <button
                onClick={() => {
                  setShowPDFModal(true)
                  setShowActionMenu(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileText size={14} style={{ color: 'var(--red)' }} />
                {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', width: '2.25rem' }}>
                  <input
                    type="checkbox"
                    checked={allSel}
                    onChange={toggleAll}
                    style={{ width: '0.8125rem', height: '0.8125rem', cursor: 'pointer', accentColor: 'var(--brand)' }}
                  />
                </th>
                {[
                  { l: '#', w: '2.375rem' },
                  { l: isBn ? 'ছবি' : 'Photo', w: '2.875rem' },
                  { l: isBn ? 'ছাত্র আইডি' : 'Student ID', w: '9.0625rem' },
                  { l: isBn ? 'নাম' : 'Name', w: '9.6875rem' },
                  { l: isBn ? 'শ্রেণি' : 'Class', w: '4.6875rem' },
                  { l: isBn ? 'লিঙ্গ' : 'Gender', w: '4.375rem' },
                  { l: isBn ? 'মোবাইল' : 'Mobile', w: '6.875rem' },
                  { l: isBn ? 'ধর্ম' : 'Religion', w: '5.625rem' },
                  { l: isBn ? 'তারিখ' : 'Date', w: '5.5rem' },
                  { l: isBn ? 'অবস্থা' : 'Status', w: '5.625rem' },
                  { l: isBn ? 'অ্যাকশন' : 'Action', w: '6rem' },
                ].map((h) => (
                  <th
                    key={h.l}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'left',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025rem',
                      whiteSpace: 'nowrap',
                      minWidth: h.w,
                    }}
                  >
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={30} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    {isBn ? 'কোনো ছাত্র পাওয়া যায়নি' : 'No students found'}
                  </td>
                </tr>
              ) : (
                paginated.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '0.5px solid var(--border)',
                      background: selected.includes(s.id) ? 'rgba(99,102,241,0.04)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleOne(s.id)}
                        style={{ width: '0.8125rem', height: '0.8125rem', cursor: 'pointer', accentColor: 'var(--brand)' }}
                      />
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.6875rem' }}>
                      {(sp - 1) * perPage + i + 1}
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      <div
                        style={{
                          width: '1.875rem',
                          height: '2.25rem',
                          borderRadius: '0.3125rem',
                          overflow: 'hidden',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {s.photo ? (
                          <img src={s.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={13} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontFamily: 'monospace',
                          color: 'var(--brand)',
                          background: 'var(--brand-light)',
                          padding: '2px 6px',
                          borderRadius: '0.25rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.id}
                      </span>
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '9.375rem',
                        }}
                      >
                        {isBn ? s.nameBn || s.nameEn : s.nameEn}
                      </div>
                      <div
                        style={{
                          fontSize: '0.625rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '9.375rem',
                        }}
                      >
                        {isBn ? s.nameEn : s.nameBn}
                      </div>
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {s.class} {s.section}
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          padding: '2px 6px',
                          borderRadius: '0.3125rem',
                          background: s.gender.includes('Female') ? 'var(--purple-light)' : 'var(--teal-light)',
                          color: s.gender.includes('Female') ? 'var(--purple)' : 'var(--teal)',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.gender.includes('Female') ? (isBn ? 'মেয়ে' : 'Female') : isBn ? 'ছেলে' : 'Male'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '8px 8px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        fontSize: '0.6875rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.phone}
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-secondary)', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>
                      {s.religion.split(' / ')[0]}
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-secondary)', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>
                      {s.admissionDate}
                    </td>
                    <td style={{ padding: '8px 8px' }}>{statusBadge(s.status)}</td>
                    <td style={{ padding: '8px 8px' }}>
                      <div style={{ display: 'flex', gap: '0.1875rem' }}>
                        <button
                          onClick={() => setViewingStudent(s)}
                          title={isBn ? 'দেখুন' : 'View'}
                          style={{
                            width: '1.625rem',
                            height: '1.625rem',
                            borderRadius: '0.375rem',
                            background: 'var(--brand-light)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--brand)',
                          }}
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => setEditingStudent(s)}
                          title={isBn ? 'এডিট' : 'Edit'}
                          style={{
                            width: '1.625rem',
                            height: '1.625rem',
                            borderRadius: '0.375rem',
                            background: 'var(--amber-light)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--amber)',
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                        {s.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setApprovingStudent(s)}
                              title={isBn ? 'অনুমোদন' : 'Approve'}
                              style={{
                                width: '1.625rem',
                                height: '1.625rem',
                                borderRadius: '0.375rem',
                                background: 'var(--green-light)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--green)',
                              }}
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setRejectingStudent(s)}
                              title={isBn ? 'প্রত্যাখ্যান' : 'Reject'}
                              style={{
                                width: '1.625rem',
                                height: '1.625rem',
                                borderRadius: '0.375rem',
                                background: 'var(--red-light)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--red)',
                              }}
                            >
                              <XCircle size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isBn
              ? `${(sp - 1) * perPage + 1}–${Math.min(sp * perPage, filtered.length)} / মোট ${filtered.length}`
              : `${(sp - 1) * perPage + 1}–${Math.min(sp * perPage, filtered.length)} of ${filtered.length}`}
          </span>
          <div style={{ display: 'flex', gap: '0.1875rem', flexWrap: 'wrap' }}>
            {[
              { icon: <ChevronsLeft size={12} />, action: () => setPage(1), disabled: sp === 1 },
              { icon: <ChevronLeft size={12} />, action: () => setPage((p) => Math.max(1, p - 1)), disabled: sp === 1 },
            ].map((b, i) => (
              <button
                key={i}
                onClick={b.action}
                disabled={b.disabled}
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: b.disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                  cursor: b.disabled ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.icon}
              </button>
            ))}
            {(() => {
              const start = Math.max(1, Math.min(sp - 2, totalPages - 4))
              return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${p === sp ? 'var(--brand)' : 'var(--border)'}`,
                    background: p === sp ? 'var(--brand)' : 'var(--bg-primary)',
                    color: p === sp ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: p === sp ? 600 : 400,
                  }}
                >
                  {p}
                </button>
              ))
            })()}
            {[
              { icon: <ChevronRight size={12} />, action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: sp === totalPages },
              { icon: <ChevronsRight size={12} />, action: () => setPage(totalPages), disabled: sp === totalPages },
            ].map((b, i) => (
              <button
                key={i}
                onClick={b.action}
                disabled={b.disabled}
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: b.disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                  cursor: b.disabled ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
