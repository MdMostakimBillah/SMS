import React from 'react'
import { TrendingUp, Plus, FileText, Edit2, Trash2 } from 'lucide-react'
import type { Teacher } from '@/pages/teachers/types'
import type { IncrementRecord } from '@/store/hrStore'
import { sectionCls, sectionTitleCls } from '@/pages/hr/utils'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { PaginationControls } from '@/components/shared/PaginationControls'

interface HRIncrementTabProps {
  isBn: boolean
  isMobile: boolean
  teachers: Teacher[]
  filteredIncrements: IncrementRecord[]
  paginatedIncrements: IncrementRecord[]
  selected: string[]
  toggle: (id: string) => void
  toggleAll: () => void
  page: number
  setPage: (p: number | ((prev: number) => number)) => void
  perPage: number
  setPerPage: (n: number) => void
  totalPages: number
  incDateFrom: string
  setIncDateFrom: (v: string) => void
  incDateTo: string
  setIncDateTo: (v: string) => void
  setModalType: (t: 'increment' | 'bonus' | 'promotion' | 'fund' | null) => void
  setIncForm: (f: { teacherId: string; type: 'annual' | 'performance' | 'special'; percentage: string; reason: string }) => void
  deleteIncrement: (id: string) => void
  setShowPDFModal: (v: 'increment' | 'bonus' | 'promotion' | 'fund' | 'assignment' | 'salary' | null) => void
  getTeacherName: (id: string) => string
  sectionCls?: (isMobile: boolean) => string
}

export const HRIncrementTab = React.memo(function HRIncrementTab({
  isBn,
  isMobile,
  teachers,
  filteredIncrements,
  paginatedIncrements,
  selected,
  toggle,
  toggleAll,
  page,
  setPage,
  perPage,
  setPerPage,
  totalPages,
  incDateFrom,
  setIncDateFrom,
  incDateTo,
  setIncDateTo,
  setModalType,
  setIncForm,
  deleteIncrement,
  setShowPDFModal,
  getTeacherName,
  sectionCls: sectionClsProp,
}: HRIncrementTabProps) {
  const resolvedSectionCls = (sectionClsProp || sectionCls)(isMobile)

  return (
    <div className={resolvedSectionCls}>
      <div className="flex justify-between items-center mb-[0.875rem]">
        <div className={sectionTitleCls}>
          <TrendingUp size={15} className="text-[var(--green)]" />
          {isBn ? 'বেতন বৃদ্ধি' : 'Increments'}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowPDFModal('increment')}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]"
          >
            <FileText size={13} />
            PDF
          </button>
          <button
            onClick={() => setModalType('increment')}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.875rem] rounded-lg bg-[var(--green)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
          >
            <Plus size={14} />
            {isBn ? 'যোগ' : 'Add'}
          </button>
        </div>
      </div>
      <DateRangeFilter
        dateFrom={incDateFrom}
        dateTo={incDateTo}
        setDateFrom={setIncDateFrom}
        setDateTo={setIncDateTo}
        onReset={() => setPage(1)}
        isBn={isBn}
        variant="compact"
      />
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs min-w-[40rem]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="py-[0.625rem] px-2 w-9">
                <input
                  type="checkbox"
                  checked={selected.length === filteredIncrements.length && filteredIncrements.length > 0}
                  onChange={toggleAll}
                  className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                />
              </th>
              {[
                isBn ? 'তারিখ' : 'Date',
                isBn ? 'শিক্ষক' : 'Teacher',
                isBn ? 'ধরন' : 'Type',
                isBn ? 'শতাংশ' : '%',
                isBn ? 'পরিমাণ' : 'Amount',
                isBn ? 'মোট' : 'Total',
                isBn ? 'কারণ' : 'Reason',
                '',
              ].map((h) => (
                <th
                  key={h || 'action'}
                  className={`py-[0.625rem] px-2 text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.025rem] whitespace-nowrap ${h === '' ? 'text-center w-[5rem]' : h === (isBn ? 'পরিমাণ' : 'Amount') || h === (isBn ? 'মোট' : 'Total') ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedIncrements.map((inc) => {
              const t = teachers.find((tx) => tx.id === inc.teacherId)
              const baseSalary = t?.salary || 0
              const totalWithInc = baseSalary + inc.amount
              return (
                <tr
                  key={inc.id}
                  className={`border-b border-[var(--border)] ${selected.includes(inc.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                  onMouseEnter={(e) => {
                    if (!selected.includes(inc.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!selected.includes(inc.id)) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(inc.id)}
                      onChange={() => toggle(inc.id)}
                      className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    />
                  </td>
                  <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-muted)]">{inc.date}</td>
                  <td className="py-2 px-2 text-xs font-medium text-[var(--text-primary)]">{getTeacherName(inc.teacherId)}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-[0.625rem] py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] font-medium ${inc.type === 'annual' ? 'bg-[var(--green-light)]' : inc.type === 'performance' ? 'bg-[var(--brand-light)]' : 'bg-[var(--amber-light)]'} ${inc.type === 'annual' ? 'text-[var(--green)]' : inc.type === 'performance' ? 'text-[var(--brand)]' : 'text-[var(--amber)]'}`}
                    >
                      {inc.type}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-xs font-semibold text-[var(--green)]">{inc.percentage}%</td>
                  <td className="py-2 px-2 text-xs font-semibold text-[var(--text-primary)] text-right">
                    ৳{inc.amount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-xs font-bold text-[var(--green)] text-right">৳{totalWithInc.toLocaleString()}</td>
                  <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-secondary)]">{inc.reason}</td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => {
                          setIncForm({
                            teacherId: inc.teacherId,
                            type: inc.type,
                            percentage: String(inc.percentage),
                            reason: inc.reason,
                          })
                          setModalType('increment')
                        }}
                        className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer text-[0.625rem] font-[inherit]"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => deleteIncrement(inc.id)}
                        className="py-1 px-2 rounded border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] cursor-pointer text-[0.625rem] font-[inherit]"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
              <td className="py-2 px-2"></td>
              <td colSpan={4} className="py-2 px-2 text-[0.6875rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'মোট' : 'Total'}
              </td>
              <td className="py-2 px-2 text-xs font-bold text-[var(--green)] text-right">
                ৳{filteredIncrements.reduce((s, i) => s + i.amount, 0).toLocaleString()}
              </td>
              <td className="py-2 px-2 text-xs font-bold text-[var(--green)] text-right">
                ৳
                {filteredIncrements
                  .reduce((s, i) => {
                    const t = teachers.find((tx) => tx.id === i.teacherId)
                    return s + (t?.salary || 0) + i.amount
                  }, 0)
                  .toLocaleString()}
              </td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <PaginationControls
        page={page}
        setPage={setPage}
        perPage={perPage}
        setPerPage={setPerPage}
        total={filteredIncrements.length}
        totalPages={totalPages}
        isBn={isBn}
      />
      {selected.length > 0 && (
        <div className="mt-2 text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[0.625rem] rounded-md inline-block">
          {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
        </div>
      )}
    </div>
  )
})
