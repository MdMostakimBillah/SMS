import { createPortal } from 'react-dom'
import { ListChecks, Plus, X } from 'lucide-react'
import type { ClassInfo } from '@/store/classStore'

interface BulkSectionModalProps {
  classes: ClassInfo[]
  selectedClasses: string[]
  bulkSectionCount: number
  setBulkSectionCount: React.Dispatch<React.SetStateAction<number>>
  bulkSeatQuantity: number
  setBulkSeatQuantity: React.Dispatch<React.SetStateAction<number>>
  handleBulkSectionApply: () => void
  setShowBulkSection: React.Dispatch<React.SetStateAction<boolean>>
  isBn: boolean
}

export function BulkSectionModal({
  classes,
  selectedClasses,
  bulkSectionCount,
  setBulkSectionCount,
  bulkSeatQuantity,
  setBulkSeatQuantity,
  handleBulkSectionApply,
  setShowBulkSection,
  isBn,
}: BulkSectionModalProps) {
  return createPortal(
    <div
      onClick={() => setShowBulkSection(false)}
      className="modal-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-box modal-content"
        style={{ maxWidth: '25rem' }}
      >
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--purple-light)] flex items-center justify-center">
              <ListChecks size={18} className="text-[var(--purple)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{isBn ? 'বাল্ক সেকশন যোগ' : 'Bulk Add Sections'}</h3>
              <p className="text-[0.625rem] text-[var(--text-muted)] m-0">
                {selectedClasses.length} {isBn ? 'টি শ্রেণিতে সেকশন যোগ হবে' : 'classes will get new sections'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBulkSection(false)}
            className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'সেকশন সংখ্যা' : 'Number of Sections'}
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={bulkSectionCount}
                onChange={(e) => setBulkSectionCount(Number(e.target.value) || 1)}
                className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none text-center focus:border-[var(--purple)]"
              />
            </div>
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'প্রতি সেকশন আসন' : 'Seats per Section'}
              </label>
              <input
                type="number"
                min={1}
                value={bulkSeatQuantity}
                onChange={(e) => setBulkSeatQuantity(Number(e.target.value) || 1)}
                className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none text-center focus:border-[var(--purple)]"
              />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] mb-4">
            <div className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-2">
              {isBn ? 'প্রভাবিত শ্রেণি' : 'Affected Classes'}
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedClasses.map((id) => {
                const c = classes.find((cl) => cl.id === id)
                return c ? (
                  <span key={id} className="text-[0.625rem] py-1 px-2 rounded bg-[var(--purple-light)] text-[var(--purple)] font-medium">
                    {isBn ? c.nameBn : c.name}
                  </span>
                ) : null
              })}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-2">
              {isBn
                ? `মোট ${selectedClasses.length * bulkSectionCount} টি নতুন সেকশন তৈরি হবে`
                : `${selectedClasses.length * bulkSectionCount} new sections will be created`}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkSection(false)}
              className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer font-[inherit]"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={handleBulkSectionApply}
              className="flex-1 py-2 rounded-lg bg-[var(--purple)] border-none text-white text-[0.75rem] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
            >
              <Plus size={13} />
              {isBn ? 'যোগ করুন' : 'Add Sections'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
