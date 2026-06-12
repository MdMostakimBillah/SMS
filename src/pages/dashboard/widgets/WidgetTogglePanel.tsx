import { Settings, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useBn } from '@/hooks/useBn'
import { useDashboardStore, getAllWidgetLabels, type WidgetId } from '@/store/dashboardStore'

export default function WidgetTogglePanel() {
  const isBn = useBn()
  const { visibility, toggleVisibility, resetLayout } = useDashboardStore()
  const [open, setOpen] = useState(false)
  const labels = getAllWidgetLabels()

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '6px 12px',
          borderRadius: '0.5rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--brand)'
          e.currentTarget.style.color = 'var(--brand)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        <Settings size={14} />
        {isBn ? 'উইজেট' : 'Widgets'}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.375rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
              minWidth: '15rem',
              zIndex: 200,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'উইজেট পরিচালনা' : 'Manage Widgets'}
              </span>
              <button
                onClick={() => { resetLayout(); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '3px 8px',
                  borderRadius: '0.25rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--brand)',
                  fontSize: '0.625rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <RotateCcw size={10} />
                {isBn ? 'রিসেট' : 'Reset'}
              </button>
            </div>
            <div style={{ padding: '0.375rem', maxHeight: '20rem', overflowY: 'auto' }}>
              {(Object.keys(labels) as WidgetId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => toggleVisibility(id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.625rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    borderRadius: '0.375rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {visibility[id] ? (
                    <Eye size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  ) : (
                    <EyeOff size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{isBn ? labels[id].bn : labels[id].en}</span>
                  <div
                    style={{
                      width: '2rem',
                      height: '1rem',
                      borderRadius: '0.5rem',
                      background: visibility[id] ? 'var(--green)' : 'var(--border)',
                      position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: '0.125rem',
                        left: visibility[id] ? '1rem' : '0.125rem',
                        transition: 'left 0.2s',
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
