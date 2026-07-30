import { createPortal } from 'react-dom'
import { Clock, Save, X } from 'lucide-react'
import type { ClassInfo } from '@/store/classStore'

interface BulkTimeModalProps {
  classes: ClassInfo[]
  selectedClasses: string[]
  bulkTimeForm: { startTime: string; endTime: string }
  setBulkTimeForm: (v: { startTime: string; endTime: string }) => void
  handleBulkTimeApply: () => void
  setShowBulkTime: (v: boolean) => void
  isBn: boolean
}

export function BulkTimeModal({
  classes,
  selectedClasses,
  bulkTimeForm,
  setBulkTimeForm,
  handleBulkTimeApply,
  setShowBulkTime,
  isBn,
}: BulkTimeModalProps) {
  return createPortal(
    <div
      onClick={() => setShowBulkTime(false)}
      className="modal-overlay"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-box modal-content"
        style={{ maxWidth: '25rem' }}
      >
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--amber-light)] flex items-center justify-center">
              <Clock size={18} className="text-[var(--amber)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">{isBn ? 'বাল্ক সময় সেট' : 'Bulk Set Time'}</h3>
              <p className="text-[0.625rem] text-[var(--text-muted)] m-0">
                {selectedClasses.length} {isBn ? 'টি শ্রেণিতে সময় পরিবর্তন হবে' : 'classes will be updated'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBulkTime(false)}
            className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)]"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'শুরুর সময়' : 'Start Time'}
              </label>
              <input
                type="time"
                value={bulkTimeForm.startTime}
                onChange={(e) => setBulkTimeForm((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--amber)]"
              />
            </div>
            <div>
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'শেষের সময়' : 'End Time'}
              </label>
              <input
                type="time"
                value={bulkTimeForm.endTime}
                onChange={(e) => setBulkTimeForm((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--amber)]"
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
                  <span key={id} className="text-[0.625rem] py-1 px-2 rounded bg-[var(--amber-light)] text-[var(--amber)] font-medium">
                    {isBn ? c.nameBn : c.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkTime(false)}
              className="flex-1 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer font-[inherit]"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={handleBulkTimeApply}
              className="flex-1 py-2 rounded-lg bg-[var(--amber)] border-none text-white text-[0.75rem] font-semibold cursor-pointer font-[inherit] flex items-center justify-center gap-2"
            >
              <Save size={13} />
              {isBn ? 'প্রয়োগ করুন' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
