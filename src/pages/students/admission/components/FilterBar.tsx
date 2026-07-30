import { Search, X } from 'lucide-react'

const RELIGIONS = ['Islam', 'Hinduism', 'Christianity', 'Buddhism']

interface FilterBarProps {
  search: string
  setSearch: (v: string) => void
  fClass: string
  setFClass: (v: string) => void
  fSection: string
  setFSection: (v: string) => void
  fGender: string
  setFGender: (v: string) => void
  fReligion: string
  setFReligion: (v: string) => void
  fStatus: string
  setFStatus: (v: string) => void
  fDate: string
  setFDate: (v: 'today' | 'week' | 'month' | 'custom' | '') => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  allSections: string[]
  setPage: (v: number) => void
  clearFilters: () => void
  hasFilter: boolean
  isBn: boolean
  isMobile: boolean
}
export function FilterBar({
  search, setSearch,
  fClass, setFClass,
  fSection, setFSection,
  fGender, setFGender,
  fReligion, setFReligion,
  fStatus, setFStatus,
  fDate, setFDate,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  classOptions, sectionsMap, allSections,
  setPage, clearFilters, hasFilter,
  isBn, isMobile,
}: FilterBarProps) {
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

  return (
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
  )
}
