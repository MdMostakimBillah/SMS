import { useState } from 'react'
import { Clock, Save } from 'lucide-react'

interface ClassTimeEditFormProps {
  classId: string
  classTimeForm: { startTime: string; endTime: string }
  setClassTimeForm: (v: { startTime: string; endTime: string }) => void
  handleSaveClassTime: (classId: string) => void
  setEditingClassTime: (v: string | null) => void
  isBn: boolean
  isMobile: boolean
}

export function ClassTimeEditForm({
  classId,
  classTimeForm,
  setClassTimeForm,
  handleSaveClassTime,
  setEditingClassTime,
  isBn,
  isMobile,
}: ClassTimeEditFormProps) {
  return (
    <div
      style={{
        marginTop: '0.625rem',
        padding: '0.875rem',
        background: 'var(--bg-primary)',
        border: '1px solid var(--brand)',
        borderRadius: '0.625rem',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--brand)',
          marginBottom: '0.625rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
      >
        <Clock size={14} />
        {isBn ? 'ক্লাস সময় পরিবর্তন' : 'Change Class Time'}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr auto',
          gap: '0.625rem',
          alignItems: 'end',
        }}
      >
        <div>
          <label
            style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}
          >
            {isBn ? 'শুরুর সময়' : 'Start Time'}
          </label>
          <input
            type="time"
            value={classTimeForm.startTime}
            onChange={(e) => setClassTimeForm((p) => ({ ...p, startTime: e.target.value }))}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '0.4375rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div>
          <label
            style={{ fontSize: '0.625rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}
          >
            {isBn ? 'শেষের সময়' : 'End Time'}
          </label>
          <input
            type="time"
            value={classTimeForm.endTime}
            onChange={(e) => setClassTimeForm((p) => ({ ...p, endTime: e.target.value }))}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '0.4375rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            onClick={() => handleSaveClassTime(classId)}
            style={{
              padding: '8px 16px',
              borderRadius: '0.4375rem',
              background: 'var(--brand)',
              border: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <Save size={12} />
            {isBn ? 'সেভ' : 'Save'}
          </button>
          <button
            onClick={() => setEditingClassTime(null)}
            style={{
              padding: '8px 12px',
              borderRadius: '0.4375rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
