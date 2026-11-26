import React from 'react'
import { createPortal } from 'react-dom'
import { Cake, Gift, X, Send } from 'lucide-react'
import type { BirthdayPersonItem } from '../types'

interface Props {
  isBn: boolean
  title: string
  list: BirthdayPersonItem[]
  onClose: () => void
  onViewDirectory: () => void
  onSendWishes: () => void
}

export const BirthdayListModal: React.FC<Props> = ({
  isBn,
  title,
  list,
  onClose,
  onViewDirectory,
  onSendWishes,
}) => {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '24rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.875rem',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cake size={16} style={{ color: 'var(--amber)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </span>
          </div>
          <button
            type="button"
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div
          style={{
            maxHeight: '16rem',
            overflowY: 'auto',
            padding: '0.75rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {list.map((person) => (
            <div
              key={person.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.625rem',
                borderRadius: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {person.name}
                </div>
                {person.subtitle && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    {person.subtitle}
                  </div>
                )}
              </div>
              <Gift size={14} style={{ color: 'var(--amber)' }} />
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={onViewDirectory}
            style={{
              padding: '0.4375rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {isBn ? 'তালিকা দেখুন' : 'View Directory'}
          </button>
          <button
            type="button"
            onClick={onSendWishes}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4375rem 0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--brand)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Send size={12} />
            {isBn ? 'শুভেচ্ছা পাঠান' : 'Send Wishes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
