import { createPortal } from 'react-dom'
import { Copy } from 'lucide-react'
import type { ClassInfo, ClassSection } from '@/store/classStore'

interface CopySectionModalProps {
  classes: ClassInfo[]
  copySectionModal: { fromClassId: string; fromSectionId: string }
  setCopySectionModal: (v: { fromClassId: string; fromSectionId: string } | null) => void
  copyTarget: { classId: string; sectionId: string }
  setCopyTarget: (v: { classId: string; sectionId: string }) => void
  showCopyConfirm: boolean
  setShowCopyConfirm: (v: boolean) => void
  handleCopySection: () => void
  isBn: boolean
}

export function CopySectionModal({
  classes,
  copySectionModal,
  setCopySectionModal,
  copyTarget,
  setCopyTarget,
  showCopyConfirm,
  setShowCopyConfirm,
  handleCopySection,
  isBn,
}: CopySectionModalProps) {
  return createPortal(
    <>
      <div className="modal-overlay">
        <div className="modal-content modal-box" style={{ maxWidth: '25rem' }}>
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-[0.875rem]">
            {isBn ? 'সেকশন কপি করুন' : 'Copy Section'}
          </h3>
          <p className="text-[0.75rem] text-[var(--text-muted)] mb-4">
            {isBn ? 'একটি সেকশন অন্য সেকশনে কপি করুন' : 'Copy a section to another class/section'}
          </p>

          <div className="p-2.5 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] mb-4">
            <div className="text-[0.625rem] text-[var(--brand)] font-semibold mb-1">
              {isBn ? 'উৎস' : 'Source'}
            </div>
            <div className="text-[0.75rem] text-[var(--text-primary)] font-medium">
              {classes.find((c) => c.id === copySectionModal.fromClassId)?.name} → Section {classes.find((c) => c.id === copySectionModal.fromClassId)?.sections.find((s) => s.id === copySectionModal.fromSectionId)?.name}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'টার্গেট শ্রেণি' : 'Target Class'}
            </label>
            <select
              value={copyTarget.classId}
              onChange={(e) => setCopyTarget({ classId: e.target.value, sectionId: '' })}
              className="w-full h-[2.5rem] px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit]"
            >
              <option value="">{isBn ? '-- শ্রেণি নির্বাচন করুন --' : '-- Select class --'}</option>
              {classes.filter((c) => c.id !== copySectionModal.fromClassId).map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.nameBn}) — {c.sections.length} {isBn ? 'সেকশন' : 'sections'}</option>
              ))}
            </select>
          </div>

          {copyTarget.classId && (
            <div className="mb-4">
              <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                {isBn ? 'টার্গেট সেকশন' : 'Target Section'}
              </label>
              <select
                value={copyTarget.sectionId}
                onChange={(e) => setCopyTarget((p) => ({ ...p, sectionId: e.target.value }))}
                className="w-full h-[2.5rem] px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit]"
              >
                <option value="">{isBn ? '-- সেকশন নির্বাচন করুন --' : '-- Select section --'}</option>
                {classes.find((c) => c.id === copyTarget.classId)?.sections.map((s) => (
                  <option key={s.id} value={s.id}>{isBn ? 'সেকশন' : 'Section'} {s.name} — {s.seatQuantity} {isBn ? 'আসন' : 'seats'}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setCopySectionModal(null)}
              className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={() => setShowCopyConfirm(true)}
              disabled={!copyTarget.classId || !copyTarget.sectionId}
              className="px-3.5 py-2 rounded-lg border-none text-white text-xs font-semibold cursor-pointer font-[inherit]"
              style={{
                background: copyTarget.classId && copyTarget.sectionId ? 'var(--brand)' : 'var(--border)',
                cursor: copyTarget.classId && copyTarget.sectionId ? 'pointer' : 'not-allowed',
              }}
            >
              {isBn ? 'কপি করুন' : 'Copy Section'}
            </button>
          </div>
        </div>
      </div>

      {showCopyConfirm && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content modal-box" style={{ maxWidth: '22rem', textAlign: 'center' }}>
            <div className="w-12 h-12 rounded-full bg-[var(--amber-light)] flex items-center justify-center mx-auto mb-4">
              <Copy size={22} className="text-[var(--amber)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'সেকশন কপি করতে চান?' : 'Copy Section?'}
            </h3>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-5 leading-relaxed">
              {isBn
                ? `আপনি ${classes.find((c) => c.id === copySectionModal?.fromClassId)?.name} থেকে সেকশন কপি করতে চলেছেন। এই কাজটি একটি নতুন সেকশন তৈরি করবে।`
                : `You are about to copy a section from ${classes.find((c) => c.id === copySectionModal?.fromClassId)?.name}. This will create a new section.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCopyConfirm(false)}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-medium cursor-pointer font-[inherit]"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => { setShowCopyConfirm(false); handleCopySection() }}
                autoFocus
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--amber)] border-none text-white text-[0.8125rem] font-medium cursor-pointer font-[inherit]"
              >
                {isBn ? 'হ্যাঁ, কপি করুন' : 'Yes, Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}
