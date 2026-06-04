import { Calendar } from 'lucide-react'
import { inputCls } from '@/pages/hr/utils'

interface DateRangeFilterProps {
  dateFrom: string
  dateTo: string
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  onReset?: () => void
  isBn: boolean
  variant?: 'default' | 'compact'
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onReset,
  isBn,
  variant = 'default',
}: DateRangeFilterProps) {
  const setQuick = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    setDateFrom(d.toISOString().split('T')[0])
    setDateTo(new Date().toISOString().split('T')[0])
  }

  const setYear = () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    setDateFrom(d.toISOString().split('T')[0])
    setDateTo(new Date().toISOString().split('T')[0])
  }

  const setMonth = (months: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() - months)
    setDateFrom(d.toISOString().split('T')[0])
    setDateTo(new Date().toISOString().split('T')[0])
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar size={13} className="text-[var(--text-muted)]" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`}
        />
        <span className="text-[11px] text-[var(--text-muted)]">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className={`${inputCls} w-auto max-w-[160px] h-[32px] py-0 px-2 text-[11px]`}
        />
        <div className="flex h-[32px] shrink-0">
          <button
            onClick={() => setMonth(6)}
            className="px-[10px] border border-[var(--border)] border-r-0 cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all rounded-l-lg"
          >
            6{isBn ? 'মাস' : 'M'}
          </button>
          <button
            onClick={setYear}
            className={`px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all ${dateFrom || dateTo ? 'border-r-0' : 'rounded-r-lg'}`}
          >
            1{isBn ? 'বছর' : 'Y'}
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                onReset?.()
              }}
              className="px-[10px] border border-[var(--border)] cursor-pointer font-[inherit] text-[11px] bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all rounded-r-lg"
            >
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={14} className="text-[var(--brand)] shrink-0" />
      <span className="text-xs font-medium text-[var(--text-secondary)]">{isBn ? 'তারিখ পরিসীমা:' : 'Date Range:'}</span>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className={`${inputCls} w-auto max-w-[160px] py-[6px] px-[10px] text-xs`}
      />
      <span className="text-xs text-[var(--text-muted)]">—</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className={`${inputCls} w-auto max-w-[160px] py-[6px] px-[10px] text-xs`}
      />
      <button
        onClick={() => setQuick(7)}
        className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]"
      >
        {isBn ? '৭ দিন' : '7D'}
      </button>
      <button
        onClick={() => setQuick(30)}
        className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]"
      >
        {isBn ? '৩০ দিন' : '30D'}
      </button>
      <button
        onClick={() => setMonth(1)}
        className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]"
      >
        {isBn ? '১ মাস' : '1M'}
      </button>
      <button
        onClick={() => setMonth(3)}
        className="py-[5px] px-[10px] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[11px] cursor-pointer font-[inherit]"
      >
        {isBn ? '৩ মাস' : '3M'}
      </button>
    </div>
  )
}
