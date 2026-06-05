import { useMemo } from 'react'
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react'

interface PaginationControlsProps {
  page: number
  setPage: (p: number | ((prev: number) => number)) => void
  perPage: number
  setPerPage: (n: number) => void
  total: number
  totalPages: number
  isBn?: boolean
}

export function PaginationControls({
  page,
  setPage,
  perPage,
  setPerPage,
  total,
  totalPages,
}: PaginationControlsProps) {
  const range = useMemo(() => {
    if (total === 0) return ''
    const from = (page - 1) * perPage + 1
    const to = Math.min(page * perPage, total)
    return `${from}–${to} / ${total}`
  }, [page, perPage, total])

  if (total <= perPage) return null

  return (
    <div className="py-[0.625rem] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
      <span className="text-xs text-[var(--text-muted)]">{range}</span>
      <div className="flex gap-[0.1875rem] items-center">
        <select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value))
            setPage(1)
          }}
          className="py-1 px-[0.375rem] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[0.6875rem] font-[inherit] outline-none mr-[0.375rem]"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        {[
          [<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean],
          [<ChevronLeft size={12} />, () => setPage((p) => Math.max(1, p - 1)), page === 1] as [React.ReactNode, () => void, boolean],
        ].map(([ic, a, d], i) => (
          <button
            key={i}
            onClick={a}
            disabled={d}
            className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {ic}
          </button>
        ))}
        {(() => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4))
          return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded-md cursor-pointer text-xs ${p === page ? 'bg-[var(--brand)]' : 'bg-[var(--bg-primary)]'} ${p === page ? 'text-white' : 'text-[var(--text-secondary)]'} ${p === page ? 'font-semibold' : 'font-normal'}`}
            >
              {p}
            </button>
          ))
        })()}
        {[
          [<ChevronRight size={12} />, () => setPage((p) => Math.min(totalPages, p + 1)), page === totalPages] as [React.ReactNode, () => void, boolean],
          [<ChevronsRight size={12} />, () => setPage(totalPages), page === totalPages] as [React.ReactNode, () => void, boolean],
        ].map(([ic, a, d], i) => (
          <button
            key={i}
            onClick={a}
            disabled={d}
            className={`w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center ${d ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${d ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {ic}
          </button>
        ))}
      </div>
    </div>
  )
}
