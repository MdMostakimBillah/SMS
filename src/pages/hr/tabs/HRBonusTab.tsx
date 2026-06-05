import {
  Gift,
  FileText,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  ChevronRight,
} from 'lucide-react'
import { sectionCls, sectionTitleCls, inputCls } from '@/pages/hr/utils'

interface HRBonusTabProps {
  isBn: boolean
  isMobile: boolean
  filteredBonuses: any[]
  paginatedBonuses: any[]
  selected: string[]
  toggle: (id: string) => void
  toggleAll: () => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  perPage: number
  setPerPage: (v: number) => void
  totalPages: number
  bonusDateFrom: string
  setBonusDateFrom: (v: string) => void
  bonusDateTo: string
  setBonusDateTo: (v: string) => void
  setModalType: (v: string) => void
  setBonForm: (v: any) => void
  deleteBonus: (id: string) => void
  setShowPDFModal: (v: string) => void
  getTeacherName: (id: string) => string
}

export default function HRBonusTab({
  isBn,
  isMobile,
  filteredBonuses,
  paginatedBonuses,
  selected,
  toggle,
  toggleAll,
  page,
  setPage,
  perPage,
  setPerPage,
  totalPages,
  bonusDateFrom,
  setBonusDateFrom,
  bonusDateTo,
  setBonusDateTo,
  setModalType,
  setBonForm,
  deleteBonus,
  setShowPDFModal,
  getTeacherName,
}: HRBonusTabProps) {
  return (
    <div className={sectionCls(isMobile)}>
      <div className="flex justify-between items-center mb-[0.875rem]">
        <div className={sectionTitleCls}>
          <Gift size={15} className="text-[var(--amber)]" />
          {isBn ? 'বোনাস' : 'Bonuses'}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowPDFModal('bonus')}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-xs font-medium cursor-pointer font-[inherit]"
          >
            <FileText size={13} />
            PDF
          </button>
          <button
            onClick={() => setModalType('bonus')}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.875rem] rounded-lg bg-[var(--amber)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
          >
            <Plus size={14} />
            {isBn ? 'যোগ' : 'Add'}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Calendar size={13} className="text-[var(--text-muted)]" />
        <input
          type="date"
          value={bonusDateFrom}
          onChange={(e) => {
            setBonusDateFrom(e.target.value)
            setPage(1)
          }}
          className={`${inputCls} w-auto max-w-[10rem] h-[2rem] py-0 px-2 text-[0.6875rem]`}
        />
        <span className="text-[0.6875rem] text-[var(--text-muted)]">—</span>
        <input
          type="date"
          value={bonusDateTo}
          onChange={(e) => {
            setBonusDateTo(e.target.value)
            setPage(1)
          }}
          className={`${inputCls} w-auto max-w-[10rem] h-[2rem] py-0 px-2 text-[0.6875rem]`}
        />
        <div className="flex h-[2rem] shrink-0">
          <button
            onClick={() => {
              const d = new Date()
              d.setMonth(d.getMonth() - 6)
              setBonusDateFrom(d.toISOString().split('T')[0])
              setBonusDateTo(new Date().toISOString().split('T')[0])
            }}
            className="px-[0.625rem] border border-[var(--border)] border-r-0 cursor-pointer font-[inherit] text-[0.6875rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all rounded-l-lg"
          >
            6{isBn ? 'মাস' : 'M'}
          </button>
          <button
            onClick={() => {
              const d = new Date()
              d.setFullYear(d.getFullYear() - 1)
              setBonusDateFrom(d.toISOString().split('T')[0])
              setBonusDateTo(new Date().toISOString().split('T')[0])
            }}
            className={`px-[0.625rem] border border-[var(--border)] cursor-pointer font-[inherit] text-[0.6875rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-all ${bonusDateFrom || bonusDateTo ? 'border-r-0' : 'rounded-r-lg'}`}
          >
            1{isBn ? 'বছর' : 'Y'}
          </button>
          {(bonusDateFrom || bonusDateTo) && (
            <button
              onClick={() => {
                setBonusDateFrom('')
                setBonusDateTo('')
                setPage(1)
              }}
              className="px-[0.625rem] border border-[var(--border)] cursor-pointer font-[inherit] text-[0.6875rem] bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all rounded-r-lg"
            >
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[40rem]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="py-[0.625rem] px-2 w-9">
                <input
                  type="checkbox"
                  checked={selected.length === filteredBonuses.length && filteredBonuses.length > 0}
                  onChange={toggleAll}
                  className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                />
              </th>
              {[
                isBn ? 'মাস' : 'Month',
                isBn ? 'শিক্ষক' : 'Teacher',
                isBn ? 'ধরন' : 'Type',
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
            {paginatedBonuses.map((bon) => (
              <tr
                key={bon.id}
                className={`border-b border-[var(--border)] ${selected.includes(bon.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'bg-transparent'}`}
                onMouseEnter={(e) => {
                  if (!selected.includes(bon.id)) e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  if (!selected.includes(bon.id)) e.currentTarget.style.background = 'transparent'
                }}
              >
                <td className="py-2 px-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(bon.id)}
                    onChange={() => toggle(bon.id)}
                    className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                  />
                </td>
                <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-muted)]">{bon.month}</td>
                <td className="py-2 px-2 text-xs font-medium text-[var(--text-primary)]">{getTeacherName(bon.teacherId)}</td>
                <td className="py-2 px-2">
                  <span
                    className={`text-[0.625rem] py-[0.125rem] px-[0.375rem] rounded-[0.3125rem] font-medium ${bon.type === 'festival' ? 'bg-[var(--amber-light)]' : bon.type === 'performance' ? 'bg-[var(--brand-light)]' : bon.type === 'attendance' ? 'bg-[var(--green-light)]' : 'bg-[var(--teal-light)]'} ${bon.type === 'festival' ? 'text-[var(--amber)]' : bon.type === 'performance' ? 'text-[var(--brand)]' : bon.type === 'attendance' ? 'text-[var(--green)]' : 'text-[var(--teal)]'}`}
                  >
                    {bon.type}
                  </span>
                </td>
                <td className="py-2 px-2 text-xs font-semibold text-[var(--text-primary)] text-right">
                  ৳{bon.amount.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-xs font-bold text-[var(--amber)] text-right">৳{bon.amount.toLocaleString()}</td>
                <td className="py-2 px-2 text-[0.6875rem] text-[var(--text-secondary)]">{bon.reason}</td>
                <td className="py-2 px-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => {
                        setBonForm({
                          teacherId: bon.teacherId,
                          type: bon.type,
                          amount: String(bon.amount),
                          reason: bon.reason,
                          month: bon.month,
                        })
                        setModalType('bonus')
                      }}
                      className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer text-[0.625rem] font-[inherit]"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => deleteBonus(bon.id)}
                      className="py-1 px-2 rounded border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] cursor-pointer text-[0.625rem] font-[inherit]"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--bg-secondary)] border-t border-t-2 border-[var(--border)]">
              <td colSpan={4} className="py-2 px-2 text-[0.6875rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'মোট' : 'Total'}
              </td>
              <td className="py-2 px-2 text-xs font-bold text-[var(--amber)] text-right">
                ৳{filteredBonuses.reduce((s, b) => s + b.amount, 0).toLocaleString()}
              </td>
              <td className="py-2 px-2 text-xs font-bold text-[var(--amber)] text-right">
                ৳{filteredBonuses.reduce((s, b) => s + b.amount, 0).toLocaleString()}
              </td>
              <td className="py-2 px-2"></td>
              <td className="py-2 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {filteredBonuses.length > perPage && (
        <div className="py-[0.625rem] px-0 flex justify-between items-center border-t border-[var(--border)] mt-2 flex-wrap gap-2">
          <span className="text-xs text-[var(--text-muted)]">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredBonuses.length)} / {filteredBonuses.length}
          </span>
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
              [<ChevronRight size={12} />, () => setPage((p) => Math.min(totalPages, p + 1)), page === totalPages] as [
                React.ReactNode,
                () => void,
                boolean,
              ],
              [<ChevronsRight size={12} />, () => setPage(totalPages), page === totalPages] as [
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
      {selected.length > 0 && (
        <div className="mt-2 text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] py-1 px-[0.625rem] rounded-md inline-block">
          {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
        </div>
      )}
    </div>
  )
}
