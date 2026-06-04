import {
  HandCoins,
  Users,
  FileText,
  Plus,
  Calendar,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  ChevronRight,
} from 'lucide-react'
import { sectionCls, sectionTitleCls } from '@/pages/hr/utils'

interface HRFundTabProps {
  isBn: boolean
  isMobile: boolean
  activeTeachers: any[]
  funds: any[]
  filteredFunds: any[]
  paginatedFunds: any[]
  selectedFund: string[]
  toggleFund: (id: string) => void
  toggleAllFund: () => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  perPage: number
  setPerPage: (v: number) => void
  fundTotalPages: number
  fundDateFrom: string
  setFundDateFrom: (v: string) => void
  fundDateTo: string
  setFundDateTo: (v: string) => void
  setModalType: (v: string) => void
  setShowPDFModal: (v: string) => void
  fundBalance: number
  monthlySalaryConfigs: any[]
}

export default function HRFundTab({
  isBn,
  isMobile,
  activeTeachers,
  funds,
  filteredFunds,
  paginatedFunds,
  selectedFund,
  toggleFund,
  toggleAllFund,
  page,
  setPage,
  perPage,
  setPerPage,
  fundTotalPages,
  fundDateFrom,
  setFundDateFrom,
  fundDateTo,
  setFundDateTo,
  setModalType,
  setShowPDFModal,
  fundBalance,
  monthlySalaryConfigs,
}: HRFundTabProps) {
  return (
    <>
      {/* Institution Fund */}
      <div className={sectionCls(isMobile)}>
        <div className="flex justify-between items-center mb-[14px]">
          <div className={sectionTitleCls}>
            <HandCoins size={15} className="text-[var(--brand)]" />
            {isBn ? 'প্রতিষ্ঠান তহবিল' : 'Institution Fund'}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowPDFModal('fund')}
              className="flex items-center gap-[5px] py-[7px] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]"
            >
              <FileText size={13} />
              PDF
            </button>
            <button
              onClick={() => setModalType('fund')}
              className="flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
            >
              <Plus size={14} />
              {isBn ? 'লেনদেন' : 'Transaction'}
            </button>
          </div>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 mb-[14px] flex-wrap">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Calendar size={13} />
            <span className="text-[11px] font-medium">{isBn ? 'তারিখ' : 'Date'}:</span>
          </div>
          <input
            type="date"
            value={fundDateFrom}
            onChange={(e) => {
              setFundDateFrom(e.target.value)
              setPage(1)
            }}
            className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
          />
          <span className="text-[var(--text-muted)] text-[11px]">–</span>
          <input
            type="date"
            value={fundDateTo}
            onChange={(e) => {
              setFundDateTo(e.target.value)
              setPage(1)
            }}
            className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
          />
          <div className="flex">
            <button
              onClick={() => {
                const d = new Date()
                d.setMonth(d.getMonth() - 6)
                setFundDateFrom(d.toISOString().split('T')[0])
                setFundDateTo(new Date().toISOString().split('T')[0])
                setPage(1)
              }}
              className="h-8 px-3 rounded-l-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-primary)]"
            >
              6M
            </button>
            <button
              onClick={() => {
                const d = new Date()
                d.setFullYear(d.getFullYear() - 1)
                setFundDateFrom(d.toISOString().split('T')[0])
                setFundDateTo(new Date().toISOString().split('T')[0])
                setPage(1)
              }}
              className={`h-8 px-3 border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-primary)] ${fundDateFrom || fundDateTo ? 'border-r-0' : 'rounded-r-lg'}`}
            >
              1Y
            </button>
            {(fundDateFrom || fundDateTo) && (
              <button
                onClick={() => {
                  setFundDateFrom('')
                  setFundDateTo('')
                  setPage(1)
                }}
                className="h-8 px-3 rounded-r-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--red)] cursor-pointer hover:bg-[var(--bg-primary)]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Fund Balance Summary */}
        <div className={`p-[14px] rounded-[10px] mb-[14px] ${fundBalance >= 0 ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[13px] font-semibold ${fundBalance >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
              {isBn ? 'মোট ব্যালেন্স' : 'Total Balance'}
            </span>
            <span className={`text-xl font-bold ${fundBalance >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
              ৳{fundBalance.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--bg-primary)] rounded-lg p-2">
              <div className="text-[10px] text-[var(--green)] font-medium">{isBn ? 'আয়' : 'Income'}</div>
              <div className="text-sm font-bold text-[var(--green)]">
                ৳
                {funds
                  .filter((f) => f.type !== 'withdrawal')
                  .reduce((s, f) => s + f.amount, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="bg-[var(--bg-primary)] rounded-lg p-2">
              <div className="text-[10px] text-[var(--red)] font-medium">{isBn ? 'খরচ' : 'Expense'}</div>
              <div className="text-sm font-bold text-[var(--red)]">
                ৳
                {funds
                  .filter((f) => f.type === 'withdrawal')
                  .reduce((s, f) => s + f.amount, 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="py-[10px] px-2 w-9">
                  <input
                    type="checkbox"
                    checked={selectedFund.length === filteredFunds.length && filteredFunds.length > 0}
                    onChange={toggleAllFund}
                    className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                  />
                </th>
                {[isBn ? 'তারিখ' : 'Date', isBn ? 'ধরন' : 'Type', isBn ? 'পরিমাণ' : 'Amount', isBn ? 'বিবরণ' : 'Description'].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-[10px] px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedFunds.map((f) => (
                <tr
                  key={f.id}
                  className={`border-b border-[var(--border)] ${selectedFund.includes(f.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                  onMouseEnter={(e) => {
                    if (!selectedFund.includes(f.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedFund.includes(f.id)) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={selectedFund.includes(f.id)}
                      onChange={() => toggleFund(f.id)}
                      className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                    />
                  </td>
                  <td className="py-2 px-2 text-[11px] text-[var(--text-muted)]">{f.date}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-[10px] py-[2px] px-[6px] rounded-[5px] font-medium ${f.type === 'withdrawal' ? 'bg-[var(--red-light)]' : 'bg-[var(--green-light)]'} ${f.type === 'withdrawal' ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}
                    >
                      {f.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-2 text-xs font-semibold ${f.type === 'withdrawal' ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}
                  >
                    {f.type === 'withdrawal' ? '-' : '+'}৳{f.amount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-[11px] text-[var(--text-secondary)]">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredFunds.length > perPage && (
          <div className="py-[10px] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredFunds.length)} / {filteredFunds.length}
            </span>
            <div className="flex gap-[3px] items-center">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="py-1 px-[6px] rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] text-[11px] font-[inherit] outline-none mr-[6px]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              {[
                [<ChevronsLeft size={12} />, () => setPage(1), page === 1] as [React.ReactNode, () => void, boolean],
                [<ChevronLeft size={12} />, () => setPage((p) => Math.max(1, p - 1)), page === 1] as [
                  React.ReactNode,
                  () => void,
                  boolean,
                ],
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
                const start = Math.max(1, Math.min(page - 2, fundTotalPages - 4))
                return Array.from({ length: Math.min(5, fundTotalPages) }, (_, i) => start + i).map((p) => (
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
                [<ChevronRight size={12} />, () => setPage((p) => Math.min(fundTotalPages, p + 1)), page === fundTotalPages] as [
                  React.ReactNode,
                  () => void,
                  boolean,
                ],
                [<ChevronsRight size={12} />, () => setPage(fundTotalPages), page === fundTotalPages] as [
                  React.ReactNode,
                  () => void,
                  boolean,
                ],
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
        )}
        {selectedFund.length > 0 && (
          <div className="mt-2 text-[11px] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[10px] rounded-md inline-block">
            {selectedFund.length} {isBn ? 'নির্বাচিত' : 'selected'}
          </div>
        )}
      </div>

      {/* Employee Fund */}
      <div className={sectionCls(isMobile)}>
        <div className={sectionTitleCls}>
          <Users size={15} className="text-[var(--teal)]" />
          {isBn ? 'কর্মচারী তহবিল' : 'Employee Fund'}
        </div>
        <div className="text-[12px] text-[var(--text-secondary)] mb-3 leading-relaxed">
          {isBn
            ? 'প্রতিটি কর্মচারীর বেতন থেকে মাসিক তহবিল কাটা হয়। চাকরি ছাড়লে তাদের তহবিল + নাফা ফেরত দেওয়া হয়।'
            : "A monthly fund is deducted from each employee's salary. When an employee resigns, their fund + profit is returned."}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                {[
                  isBn ? 'কর্মচারী' : 'Employee',
                  isBn ? 'বেতন' : 'Salary',
                  isBn ? 'তহবিল %' : 'Fund %',
                  isBn ? 'মাসিক কাটা' : 'Monthly Deduction',
                  isBn ? 'মোট জমা' : 'Total Deposited',
                ].map((h) => (
                  <th
                    key={h}
                    className="py-[10px] px-2 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.4px] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTeachers.map((t) => {
                const fundPercents = monthlySalaryConfigs
                  .filter((c) => c.teacherId === t.id && c.fundContributionPercent > 0)
                  .map((c) => c.fundContributionPercent)
                const avgPercent =
                  fundPercents.length > 0 ? Math.round(fundPercents.reduce((a, b) => a + b, 0) / fundPercents.length) : 0
                const monthlyDeduction = Math.round((t.salary * avgPercent) / 100)
                const monthsWithFund = fundPercents.length
                const totalDeposited = monthlyDeduction * monthsWithFund
                return (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border)]"
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="py-2 px-2">
                      <div className="text-xs font-medium text-[var(--text-primary)]">{t.nameEn}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.designation}</div>
                    </td>
                    <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">৳{t.salary.toLocaleString()}</td>
                    <td className="py-2 px-2 text-xs font-medium text-[var(--brand)]">{avgPercent > 0 ? `${avgPercent}%` : '—'}</td>
                    <td className="py-2 px-2 text-xs font-semibold text-[var(--red)]">
                      {monthlyDeduction > 0 ? `৳${monthlyDeduction.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-xs font-bold text-[var(--green)]">
                      {totalDeposited > 0 ? `৳${totalDeposited.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
