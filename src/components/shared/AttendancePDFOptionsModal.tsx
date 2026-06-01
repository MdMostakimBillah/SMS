import React, { useState } from 'react'
import { X, File, LayoutTemplate, Info, Download } from 'lucide-react'

export interface AttendancePDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  orientation: 'portrait' | 'landscape'
  isBn: boolean
}

interface Props {
  count: number
  isBn: boolean
  type: 'student' | 'employee'
  onClose: () => void
  onDownload: (opts: AttendancePDFOptions) => void
}

export const AttendancePDFOptionsModal = React.memo(function AttendancePDFOptionsModal({
  count, isBn, type, onClose, onDownload,
}: Props) {
  const defaultTitle = type === 'student' ? 'Student Monthly Attendance' : 'Employee Monthly Attendance'
  const defaultTitleBn = type === 'student' ? 'শিক্ষার্থীদের মাসিক উপস্থিতি' : 'কর্মচারীদের মাসিক উপস্থিতি'

  const [title, setTitle] = useState(isBn ? defaultTitleBn : defaultTitle)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100dvh', background: 'rgba(0,0,0,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div className="modal-content" style={{ background: 'var(--bg-primary)', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {count} {isBn ? (type === 'student' ? 'জন শিক্ষার্থী' : 'জন কর্মচারী') : (type === 'student' ? 'students' : 'employees')} {isBn?'নির্বাচিত':'selected'}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px' }}>

          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ① {isBn ? 'রিপোর্টের শিরোনাম' : 'Report Title'}
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isBn ? 'রিপোর্টের শিরোনাম লিখুন' : 'Enter report title'}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Orientation */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              ② {isBn ? 'কাগজের দিক' : 'Page Orientation'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['portrait', 'landscape'] as const).map(o => (
                <button key={o} onClick={() => setOrientation(o)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${orientation === o ? 'var(--brand)' : 'var(--border)'}`, background: orientation === o ? 'var(--brand-light)' : 'var(--bg-secondary)', color: orientation === o ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: orientation === o ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {o === 'portrait' ? <File size={15} /> : <LayoutTemplate size={15} />}
                  {isBn ? (o === 'portrait' ? 'উল্লম্ব' : 'আনুভূমিক') : (o === 'portrait' ? 'Portrait' : 'Landscape')}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: '12px', background: 'var(--brand-light)', borderRadius: '8px', border: '1px solid var(--brand)', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} />
              <span>{isBn ? 'প্রত্যেক শিক্ষার্থী/কর্মচারীর মাসিক উপস্থিতি একটি ছোট টেবিলে দেখানো হবে (P/A/L/W)' : 'Monthly attendance will be shown in a compact grid (P/A/L/W) for each person'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
          <button onClick={onClose}
            style={{ padding: '9px 16px', borderRadius: '9px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={() => onDownload({ title, selectedCols: [], emptyRows: 0, orientation, isBn })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '9px', background: 'var(--red)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={14} />
            {isBn ? 'PDF ডাউনলোড' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
})
