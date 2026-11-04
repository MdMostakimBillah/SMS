import React from 'react'
import { Info, Search, Zap } from 'lucide-react'
import type { Department, Designation } from '@/pages/teachers/types'
import type { BulkOp, BulkOpMeta } from './TeacherRow'

export interface BulkFilterAndBatchBarProps {
  isMobile: boolean
  isBn: boolean
  op: BulkOp
  opInfo: BulkOpMeta
  search: string
  onSearchChange: (v: string) => void
  fDept: string
  onFDeptChange: (v: string) => void
  departments: Department[]
  designations: Designation[]
  selectedCount: number
  filteredCount: number
  allSel: boolean
  onToggleAll: () => void
  onClearSelection: () => void
  batchVal: string
  onBatchValChange: (v: string) => void
  onApplyBatch: () => void
  canEdit: boolean
}

export const BulkFilterAndBatchBar = React.memo(function BulkFilterAndBatchBar({
  isMobile,
  isBn,
  op,
  opInfo,
  search,
  onSearchChange,
  fDept,
  onFDeptChange,
  departments,
  designations,
  selectedCount,
  filteredCount,
  allSel,
  onToggleAll,
  onClearSelection,
  batchVal,
  onBatchValChange,
  onApplyBatch,
  canEdit,
}: BulkFilterAndBatchBarProps) {
  const inpCls =
    'py-[0.4375rem] px-[0.5625rem] rounded-[0.5rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] font-[inherit] cursor-pointer outline-none'

  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-[240px_1fr]'} gap-[0.625rem] mb-[0.625rem]`}>
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.75rem] py-[0.75rem] px-[0.875rem]">
        <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.5rem]">
          ② {isBn ? 'শিক্ষক ফিল্টার' : 'Filter Teachers'}
        </div>
        <div className="flex flex-col gap-[0.375rem]">
          <div className="flex items-center gap-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[0.5rem] py-[0.375rem] px-[0.5625rem]">
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
              className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)] font-[inherit]"
            />
          </div>
          <select value={fDept} onChange={(e) => onFDeptChange(e.target.value)} className={inpCls}>
            <option value="">{isBn ? 'সব বিভাগ' : 'All Departments'}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {isBn ? d.nameBn : d.name}
              </option>
            ))}
          </select>
          <div className="flex gap-[0.3125rem]">
            <button
              onClick={onToggleAll}
              className={`flex-1 py-[0.375rem] px-[0.5rem] rounded-[0.4375rem] border ${allSel ? 'border-[var(--brand)]' : 'border-[var(--border)]'} ${allSel ? 'bg-[var(--brand-light)]' : 'bg-[var(--bg-secondary)]'} ${allSel ? 'text-[var(--brand)]' : 'text-[var(--text-secondary)]'} text-[0.6875rem] cursor-pointer font-[inherit] font-medium`}
            >
              {allSel ? (isBn ? 'সব বাদ' : 'Deselect All') : isBn ? 'সব বাছুন' : 'Select All'} ({filteredCount})
            </button>
            {selectedCount > 0 && (
              <button
                onClick={onClearSelection}
                className="py-[0.375rem] px-[0.625rem] rounded-[0.4375rem] border border-[var(--red)] bg-[var(--red-light)] text-[var(--red)] text-[0.6875rem] cursor-pointer font-[inherit]"
              >
                {selectedCount} ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className="bg-[var(--bg-primary)] border border-[color:var(--op-color)] rounded-[0.75rem] py-[0.75rem] px-[0.875rem]"
        style={{ '--op-color': opInfo.color } as React.CSSProperties}
      >
        <div
          className="text-[0.6875rem] font-semibold uppercase tracking-[0.0313rem] mb-[0.625rem]"
          style={{ color: opInfo.color } as React.CSSProperties}
        >
          ③ {isBn ? `এক সাথে ${opInfo.bn}` : `Batch ${opInfo.en}`}
          {selectedCount > 0 && (
            <span className="ml-[0.375rem] font-bold">
              — {selectedCount} {isBn ? 'জন নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>

        {op === 'photo' ? (
          <div
            className="py-[0.625rem] px-[0.625rem] rounded-[0.5rem] text-[0.8125rem]"
            style={{ background: opInfo.bg, color: opInfo.color } as React.CSSProperties}
          >
            <Info size={14} className="inline mr-[0.3125rem] align-middle" />
            {isBn
              ? 'নিচের টেবিলে প্রতিটি শিক্ষকের পাশের বাটনে ক্লিক করে ছবি আপলোড করুন'
              : 'Click the upload button next to each teacher in the table below'}
          </div>
        ) : op === 'department' ? (
          <div className="flex gap-[0.5rem] items-center flex-wrap">
            <select
              value={batchVal}
              onChange={(e) => onBatchValChange(e.target.value)}
              className={`${inpCls} flex-1`}
              style={{ color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' } as React.CSSProperties}
            >
              <option value="">{isBn ? 'নতুন বিভাগ বেছে নিন' : 'Select new department'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {isBn ? d.nameBn : d.name}
                </option>
              ))}
            </select>
            {canEdit && (
              <button
                onClick={onApplyBatch}
                disabled={!batchVal || selectedCount === 0}
                className={`flex items-center gap-[0.3125rem] py-[0.5rem] px-[0.875rem] rounded-[0.5rem] border-none text-white text-[0.75rem] font-medium font-[inherit] whitespace-nowrap ${!batchVal || selectedCount === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                style={{ background: !batchVal || selectedCount === 0 ? 'var(--border-2)' : opInfo.color } as React.CSSProperties}
              >
                <Zap size={13} />
                {isBn ? `${selectedCount} জনে প্রয়োগ করুন` : `Apply to ${selectedCount}`}
              </button>
            )}
          </div>
        ) : op === 'designation' ? (
          <div className="flex gap-[0.5rem] items-center flex-wrap">
            <select
              value={batchVal}
              onChange={(e) => onBatchValChange(e.target.value)}
              className={`${inpCls} flex-1`}
              style={{ color: batchVal ? 'var(--text-primary)' : 'var(--text-secondary)' } as React.CSSProperties}
            >
              <option value="">{isBn ? 'নতুন পদবি বেছে নিন' : 'Select new designation'}</option>
              {designations.map((d) => (
                <option key={d.id} value={d.name}>
                  {isBn ? d.nameBn : d.name}
                </option>
              ))}
            </select>
            {canEdit && (
              <button
                onClick={onApplyBatch}
                disabled={!batchVal || selectedCount === 0}
                className={`flex items-center gap-[0.3125rem] py-[0.5rem] px-[0.875rem] rounded-[0.5rem] border-none text-white text-[0.75rem] font-medium font-[inherit] whitespace-nowrap ${!batchVal || selectedCount === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                style={{ background: !batchVal || selectedCount === 0 ? 'var(--border-2)' : opInfo.color } as React.CSSProperties}
              >
                <Zap size={13} />
                {isBn ? `${selectedCount} জনে প্রয়োগ করুন` : `Apply to ${selectedCount}`}
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-[0.5rem] items-center flex-wrap">
            {op === 'inTime' || op === 'outTime' ? (
              <input
                type="time"
                value={batchVal}
                onChange={(e) => onBatchValChange(e.target.value)}
                className={`${inpCls} flex-1 text-[var(--text-primary)]`}
              />
            ) : op === 'salary' ? (
              <input
                type="number"
                value={batchVal}
                onChange={(e) => onBatchValChange(e.target.value)}
                placeholder={isBn ? 'নতুন বেতন লিখুন' : 'Enter new salary'}
                className={`${inpCls} flex-1 text-[var(--text-primary)]`}
              />
            ) : (
              <input
                value={batchVal}
                onChange={(e) => onBatchValChange(e.target.value)}
                placeholder={isBn ? 'নতুন মান লিখুন' : 'Enter new value'}
                className={`${inpCls} flex-1 text-[var(--text-primary)]`}
              />
            )}
            {canEdit && (
              <button
                onClick={onApplyBatch}
                disabled={!batchVal || selectedCount === 0}
                className={`flex items-center gap-[0.3125rem] py-[0.5rem] px-[0.875rem] rounded-[0.5rem] border-none text-white text-[0.75rem] font-medium font-[inherit] whitespace-nowrap ${!batchVal || selectedCount === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                style={{ background: !batchVal || selectedCount === 0 ? 'var(--border-2)' : opInfo.color } as React.CSSProperties}
              >
                <Zap size={13} />
                {isBn ? `${selectedCount} জনে প্রয়োগ করুন` : `Apply to ${selectedCount}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
