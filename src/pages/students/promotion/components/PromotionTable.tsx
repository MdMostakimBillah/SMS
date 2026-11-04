import React from 'react'
import { Users } from 'lucide-react'
import type { StudentAdmission } from '@/store/admissionStore'
import ModernCheckbox from '@/components/ui/ModernCheckbox'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { PromotionTableRow } from './PromotionTableRow'

interface Props {
  isBn: boolean
  fromClass: string
  filtered: StudentAdmission[]
  selected: string[]
  selectedSet: Set<string>
  allSel: boolean
  onToggleAll: () => void
  toClass: string
  toSection: string
  rollMap: Record<string, string>
  onToggleOne: (id: string) => void
  onRollChange: (id: string, val: string) => void
  page: number
  perPage: number
  setPage: (p: number | ((prev: number) => number)) => void
  setPerPage: (p: number) => void
  totalPages: number
  paginatedStudents: StudentAdmission[]
}

export const PromotionTable: React.FC<Props> = React.memo(function PromotionTable({
  isBn,
  fromClass,
  filtered,
  selected,
  selectedSet,
  allSel,
  onToggleAll,
  toClass,
  toSection,
  rollMap,
  onToggleOne,
  onRollChange,
  page,
  perPage,
  setPage,
  setPerPage,
  totalPages,
  paginatedStudents,
}) {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
      <div className="py-[0.625rem] px-[0.875rem] border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)] flex-wrap gap-2">
        <div className="flex items-center gap-[0.5rem]">
          <div
            className={`w-[0.5rem] h-[0.5rem] rounded-full ${
              fromClass ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'
            }`}
          />
          <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
            {filtered.length} {isBn ? 'জন ছাত্র' : 'students'}
            {selected.length > 0 && (
              <span className="text-[var(--brand)] ml-[0.5rem] font-semibold">
                · {selected.length} {isBn ? 'নির্বাচিত' : 'selected'}
              </span>
            )}
          </span>
        </div>
        <button
          onClick={onToggleAll}
          type="button"
          className={`py-[0.3125rem] px-[0.625rem] rounded-[0.375rem] border cursor-pointer text-[0.6875rem] font-[inherit] font-medium transition-colors ${
            allSel
              ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]'
              : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {allSel ? (isBn ? 'সব বাদ' : 'Deselect') : isBn ? 'সব বাছুন' : 'Select All'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="p-[8px_10px] w-[2.25rem]">
                <ModernCheckbox
                  checked={allSel}
                  onChange={onToggleAll}
                  color="brand"
                  size="xs"
                />
              </th>
              <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[1.875rem]">
                #
              </th>
              <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase w-[2.375rem]">
                {isBn ? 'ছবি' : 'Photo'}
              </th>
              <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                {isBn ? 'নাম / আইডি' : 'Name / ID'}
              </th>
              <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] uppercase">
                {isBn ? 'বর্তমান' : 'Current'}
              </th>
              <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--brand)] uppercase">
                {isBn ? 'লক্ষ্য' : 'Target'}
              </th>
              <th className="p-[8px_6px] text-left text-[0.625rem] font-semibold text-[var(--amber)] uppercase min-w-[4.375rem]">
                {isBn ? 'নতুন রোল' : 'New Roll'}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-[2.5rem] text-center text-[var(--text-muted)]">
                  <Users size={28} className="block mx-auto mb-2 opacity-30" />
                  {isBn ? 'উপরে শ্রেণি নির্বাচন করুন' : 'Select a class above to view students'}
                </td>
              </tr>
            ) : (
              paginatedStudents.map((s, i) => {
                const rowGlobalIndex = (page - 1) * perPage + i
                const isSelected = selectedSet.has(s.id)
                const rollValue = rollMap[s.id] !== undefined ? rollMap[s.id] : s.roll || ''
                return (
                  <PromotionTableRow
                    key={s.id}
                    student={s}
                    index={rowGlobalIndex}
                    isSelected={isSelected}
                    toClass={toClass}
                    toSection={toSection}
                    rollValue={rollValue}
                    isBn={isBn}
                    onToggle={onToggleOne}
                    onRollChange={onRollChange}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > perPage && (
        <div className="px-4 pb-2">
          <PaginationControls
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            total={filtered.length}
            totalPages={totalPages}
            isBn={isBn}
          />
        </div>
      )}
    </div>
  )
})
