import React from 'react'

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton skeleton-title" style={{ width: '12.5rem' }} />
          <div className="skeleton skeleton-text" style={{ width: '9.375rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '5rem', height: '2rem', borderRadius: '0.5rem' }} />
          <div className="skeleton" style={{ width: '6.25rem', height: '2rem', borderRadius: '0.5rem' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: '4rem', borderRadius: '0.75rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
            }}
          >
            <div className="skeleton" style={{ width: '2rem', height: '2rem', borderRadius: '0.375rem' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '3rem', height: '1rem', marginBottom: '0.25rem' }} />
              <div className="skeleton" style={{ width: '4rem', height: '0.625rem' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
            }}
          >
            <div className="skeleton" style={{ width: '2rem', height: '2rem', borderRadius: '0.375rem' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '4rem', height: '1rem', marginBottom: '0.25rem' }} />
              <div className="skeleton" style={{ width: '5rem', height: '0.625rem' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ minHeight: '11.25rem' }} />
        ))}
      </div>
    </div>
  )
}
