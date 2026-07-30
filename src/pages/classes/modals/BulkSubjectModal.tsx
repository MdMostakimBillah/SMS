import { createPortal } from 'react-dom'
import { BookOpen, Check, Save, X } from 'lucide-react'
import type { Subject } from '@/pages/teachers/types'

interface BulkSubjectModalProps {
  subjects: Subject[]
  selectedClasses: string[]
  bulkSubjectIds: string[]
  setBulkSubjectIds: React.Dispatch<React.SetStateAction<string[]>>
  handleBulkSubjectApply: () => void
  setShowBulkSubject: React.Dispatch<React.SetStateAction<boolean>>
  isBn: boolean
}

export function BulkSubjectModal({
  subjects,
  selectedClasses,
  bulkSubjectIds,
  setBulkSubjectIds,
  handleBulkSubjectApply,
  setShowBulkSubject,
  isBn,
}: BulkSubjectModalProps) {
  const toggleTempSubject = (subId: string) => {
    setBulkSubjectIds((prev) => (prev.includes(subId) ? prev.filter((s) => s !== subId) : [...prev, subId]))
  }

  return createPortal(
    <div
      onClick={() => setShowBulkSubject(false)}
      className="modal-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-box modal-content"
        style={{ maxWidth: '26.25rem' }}
      >
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
              <BookOpen size={18} className="text-[var(--teal)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">
                {isBn ? 'বাল্ক বিষয় নির্ধারণ' : 'Bulk Assign Subjects'}
              </h3>
              <p className="text-[0.625rem] text-[var(--text-muted)] m-0">
                {selectedClasses.length} {isBn ? 'টি শ্রেণির সব সেকশনে যোগ হবে' : 'classes, all sections will get these subjects'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBulkSubject(false)}
            className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {subjects.length === 0 ? (
            <div className="text-center py-5 text-[var(--text-muted)] text-[0.75rem]">
              {isBn
                ? 'কোনো বিষয় পাওয়া যায়নি। প্রথমে শিক্ষক ব্যবস্থাপনায় বিষয় যোগ করুন।'
                : 'No subjects found. Add subjects in Teacher Management first.'}
            </div>
          ) : (
            <div className="flex flex-col gap-[0.375rem]">
              {subjects.map((sub) => {
                const isSelected = bulkSubjectIds.includes(sub.id)
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleTempSubject(sub.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-left transition-all duration-150 font-[inherit]"
                    style={{
                      borderColor: isSelected ? 'var(--teal)' : 'var(--border)',
                      background: isSelected ? 'var(--teal-light)' : 'var(--bg-secondary)',
                    }}
                  >
                    <div
                      className="w-[1.125rem] h-[1.125rem] rounded-[0.3125rem] border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: isSelected ? 'var(--teal)' : 'var(--border)',
                        background: isSelected ? 'var(--teal)' : 'transparent',
                      }}
                    >
                      {isSelected && <Check size={11} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.75rem] font-medium text-[var(--text-primary)]">{isBn ? sub.nameBn : sub.name}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-[var(--border)] flex gap-2 shrink-0">
          <button
            onClick={() => setShowBulkSubject(false)}
            className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer font-[inherit]"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleBulkSubjectApply}
            disabled={bulkSubjectIds.length === 0}
            className="flex-1 py-2 rounded-lg border-none text-white text-[0.75rem] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
            style={{ background: bulkSubjectIds.length > 0 ? 'var(--teal)' : 'var(--border)' }}
          >
            <Save size={13} />
            {isBn ? 'সেভ' : 'Save'} ({bulkSubjectIds.length})
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
