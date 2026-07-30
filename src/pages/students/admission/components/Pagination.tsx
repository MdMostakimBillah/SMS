import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  sp: number
  page: number
  perPage: number
  filteredLength: number
  totalPages: number
  setPage: (v: number) => void
  isBn: boolean
}
export function Pagination({ sp, page, perPage, filteredLength, totalPages, setPage, isBn }: PaginationProps) {
  return (
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
          ? `${(sp - 1) * perPage + 1}–${Math.min(sp * perPage, filteredLength)} / মোট ${filteredLength}`
          : `${(sp - 1) * perPage + 1}–${Math.min(sp * perPage, filteredLength)} of ${filteredLength}`}
      </span>
      <div style={{ display: 'flex', gap: '0.1875rem', flexWrap: 'wrap' }}>
        {[
          { icon: <ChevronsLeft size={12} />, action: () => setPage(1), disabled: sp === 1 },
          { icon: <ChevronLeft size={12} />, action: () => setPage(Math.max(1, page - 1)), disabled: sp === 1 },
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
          { icon: <ChevronRight size={12} />, action: () => setPage(Math.min(totalPages, page + 1)), disabled: sp === totalPages },
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
  )
}
