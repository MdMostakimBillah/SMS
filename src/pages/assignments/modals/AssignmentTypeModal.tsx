import React from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, FileText } from 'lucide-react'

export interface AssignmentTypeModalProps {
  isOpen: boolean
  isBn: boolean
  isMobile: boolean
  onClose: () => void
  onSelectHomework: () => void
  onSelectAssignment: () => void
}

export const AssignmentTypeModal = React.memo(function AssignmentTypeModal({
  isOpen,
  isBn,
  isMobile,
  onClose,
  onSelectHomework,
  onSelectAssignment,
}: AssignmentTypeModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-box"
        style={{ maxWidth: isMobile ? '95vw' : '22rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'ধরণ নির্বাচন করুন' : 'Select Type'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onSelectHomework}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)] transition-all cursor-pointer text-left bg-transparent"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber)' }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {isBn ? 'গৃহকাজ' : 'Home Work'}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'দৈনন্দিন ক্লাসের পড়া ও বাড়ির কাজ' : 'Daily class lessons & home tasks'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onSelectAssignment}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)] transition-all cursor-pointer text-left bg-transparent"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--purple)' }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {isBn ? 'অ্যাসাইনমেন্ট' : 'Assignment'}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'নম্বরসহ বিস্তারিত অ্যাসাইনমেন্ট' : 'Detailed assignment with marks'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
