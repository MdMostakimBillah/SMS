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
          className={`${inputCls} w-auto max-w-[10rem] h-[2rem] py-0 px-2 text-[0.6875rem]`}
        />
        <span className="text-[0.6875rem] text-[var(--text-muted)]">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className={`${inputCls} w-auto max-w-[10rem] h-[2rem] py-0 px-2 text-[0.6875rem]`}
        />
        <div className="flex h-[2rem] shrink-0">
          <button
            onClick={() => setMonth(6)}
            className="px-[0.625rem] border border-[var(--border)] border-r-0 cursor-pointer font-[inherit] text-[0.6875rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all rounded-l-lg"
          >
            6{isBn ? 'মাস' : 'M'}
          </button>
          <button
            onClick={setYear}
            className={`px-[0.625rem] border border-[var(--border)] cursor-pointer font-[inherit] text-[0.6875rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all ${dateFrom || dateTo ? 'border-r-0' : 'rounded-r-lg'}`}
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
              className="px-[0.625rem] border border-[var(--border)] cursor-pointer font-[inherit] text-[0.6875rem] bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all rounded-r-lg"
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
        className={`${inputCls} w-auto max-w-[10rem] py-[0.375rem] px-[0.625rem] text-xs`}
      />
      <span className="text-xs text-[var(--text-muted)]">—</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className={`${inputCls} w-auto max-w-[10rem] py-[0.375rem] px-[0.625rem] text-xs`}
      />
      <button
        onClick={() => setQuick(7)}
        className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
      >
        {isBn ? '৭ দিন' : '7D'}
      </button>
      <button
        onClick={() => setQuick(30)}
        className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
      >
        {isBn ? '৩০ দিন' : '30D'}
      </button>
      <button
        onClick={() => setMonth(1)}
        className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
      >
        {isBn ? '১ মাস' : '1M'}
      </button>
      <button
        onClick={() => setMonth(3)}
        className="py-[0.3125rem] px-[0.625rem] rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer font-[inherit]"
      >
        {isBn ? '৩ মাস' : '3M'}
      </button>
    </div>
  )
}
