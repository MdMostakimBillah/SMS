import { ChevronLeft, ChevronRight, KeyRound } from 'lucide-react'
import type { AccountsTableProps } from '../types'
import { AccountTableRow } from './AccountTableRow'

export function AccountsTable({
  isBn,
  accounts,
  selectedIds,
  onToggleSelectAll,
  onToggleSelect,
  onEditUsername,
  onResetPassword,
  onToggleStatus,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: AccountsTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const isAllSelected = accounts.length > 0 && accounts.every((a) => selectedIds.has(a.id))

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(totalItems, currentPage * pageSize)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden shadow-sm">
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[0.8125rem]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/70 text-[var(--text-muted)] text-[0.75rem] font-semibold">
              <th className="p-3.5 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[var(--border)] text-[var(--brand)] cursor-pointer"
                />
              </th>
              <th className="p-3.5">{isBn ? 'ব্যবহারকারী ও রোল' : 'Account Holder & Role'}</th>
              <th className="p-3.5">{isBn ? 'প্রতিষ্ঠান ও বিবরণ' : 'Institution & Details'}</th>
              <th className="p-3.5">{isBn ? 'ইউজারনেম' : 'Username'}</th>
              <th className="p-3.5">{isBn ? 'পাসওয়ার্ড' : 'Password'}</th>
              <th className="p-3.5">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
              <th className="p-3.5 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-[var(--text-muted)]">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
                    <KeyRound size={22} />
                  </div>
                  <div className="text-[0.875rem] font-semibold text-[var(--text-primary)] mb-1">
                    {isBn ? 'কোনো অ্যাকাউন্ট পাওয়া যায়নি' : 'No accounts found'}
                  </div>
                  <p className="text-[0.75rem] max-w-sm mx-auto">
                    {isBn
                      ? 'ফিল্টার পরিবর্তন করে দেখুন অথবা নির্বাচিত প্রতিষ্ঠানে শিক্ষার্থী যুক্ত আছে কিনা নিশ্চিত করুন।'
                      : 'Try adjusting your filters or ensure students are enrolled in the selected institution.'}
                  </p>
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <AccountTableRow
                  key={acc.id}
                  isBn={isBn}
                  account={acc}
                  isSelected={selectedIds.has(acc.id)}
                  onToggleSelect={onToggleSelect}
                  onEditUsername={onEditUsername}
                  onResetPassword={onResetPassword}
                  onToggleStatus={onToggleStatus}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[0.75rem] text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>
              {isBn
                ? `মোট ${totalItems} টির মধ্যে ${startIndex}-${endIndex} দেখাচ্ছে`
                : `Showing ${startIndex}-${endIndex} of ${totalItems}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span>{isBn ? 'প্রতি পৃষ্ঠায়:' : 'Per page:'}</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg px-2 py-1 outline-none cursor-pointer text-[0.75rem]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-transparent"
              title={isBn ? 'পূর্ববর্তী পৃষ্ঠা' : 'Previous page'}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium text-[var(--text-primary)]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-transparent"
              title={isBn ? 'পরবর্তী পৃষ্ঠা' : 'Next page'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
