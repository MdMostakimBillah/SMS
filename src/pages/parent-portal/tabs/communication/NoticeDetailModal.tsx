import React, { useState } from 'react'
import {
  X,
  Pin,
  Calendar,
  Users,
  Tag,
  Copy,
  Check,
  Download,
  AlertCircle,
  AlertTriangle,
  Bell,
  Info,
} from 'lucide-react'
import type { Notice } from '@/store/noticeStore'
import { sanitizeHtml } from '@/lib/sanitize'
import { printNoticePDF } from '@/pages/notice/noticePdf'
import { useClassStore } from '@/store/classStore'

const PRIORITY_CONFIG = {
  low: { label: 'Low', labelBn: 'কম', icon: Info, color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.14)' },
  medium: { label: 'Medium', labelBn: 'মাঝারি', icon: Bell, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)' },
  high: { label: 'High', labelBn: 'বেশি', icon: AlertTriangle, color: 'var(--orange, #f97316)', bg: 'rgba(249, 115, 22, 0.12)' },
  urgent: { label: 'Urgent', labelBn: 'জরুরি', icon: AlertCircle, color: 'var(--red, #ef4444)', bg: 'rgba(239, 68, 68, 0.14)' },
} as const

interface NoticeDetailModalProps {
  notice: Notice
  onClose: () => void
  isBn: boolean
}

export const NoticeDetailModal = React.memo(function NoticeDetailModal({
  notice,
  onClose,
  isBn,
}: NoticeDetailModalProps) {
  const institution = useClassStore((s) => s.institution)
  const schoolName = (isBn ? institution.nameBn || institution.name : institution.name) || 'EduTech'
  const logo = institution.logo

  const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium
  const [copied, setCopied] = useState(false)

  const displayTitle = (isBn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
  const displayAuthor = (isBn ? notice.authorBn || notice.author : notice.author || notice.authorBn) || ''
  const displayContent = (isBn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''

  const handleCopy = () => {
    const plainText = displayContent.replace(/<[^>]*>/g, '').trim()
    const shareText = `${displayTitle}\n\n${plainText}\n\n${schoolName} · ${displayAuthor}`
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handlePrintPDF = () => {
    printNoticePDF(notice, isBn, logo)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[var(--border)] gap-3 bg-[var(--bg-secondary)]/40">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {notice.pinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-bold rounded-md bg-[var(--brand)] text-white shadow-2xs">
                  <Pin size={10} /> PINNED
                </span>
              )}
              {notice.category && (
                <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
                  <Tag size={11} className="text-[var(--text-muted)]" />
                  {notice.category}
                </span>
              )}
              <span
                className="inline-flex items-center text-[0.625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ background: priority.bg, color: priority.color }}
              >
                {isBn ? priority.labelBn : priority.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <Users size={11} />
                {notice.target === 'parents' ? (isBn ? 'অভিভাবকদের জন্য' : 'Parents') : (isBn ? 'সাধারণ' : 'General')}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
              {displayTitle}
            </h3>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-muted)] flex-wrap">
              <span className="font-medium text-[var(--text-secondary)]">
                {displayAuthor || schoolName}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }) : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors shrink-0"
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body with Formatted Rich Text */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div
            className="notice-content text-[0.875rem] text-[var(--text-primary)] leading-relaxed
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-3 [&_h1]:text-[var(--brand)]
              [&_h2]:text-[0.9375rem] [&_h2]:font-bold [&_h2]:my-2.5 [&_h2]:text-[var(--text-primary)]
              [&_h3]:text-[0.875rem] [&_h3]:font-bold [&_h3]:my-2 [&_h3]:text-[var(--text-primary)]
              [&_p]:mb-2.5
              [&_ul]:pl-6 [&_ul]:mb-2.5 [&_ul]:list-disc
              [&_ol]:pl-6 [&_ol]:mb-2.5 [&_ol]:list-decimal
              [&_li]:mb-1 [&_li]:marker:text-[var(--brand)]
              [&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--brand)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--text-muted)] [&_blockquote]:my-3 [&_blockquote]:bg-[var(--bg-secondary)]/50 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:rounded-xl [&_table]:overflow-hidden
              [&_th]:bg-[var(--brand)] [&_th]:text-white [&_th]:p-2.5 [&_th]:text-left [&_th]:text-[0.8125rem] [&_th]:font-semibold
              [&_td]:p-2.5 [&_td]:text-[0.8125rem] [&_td]:border-b [&_td]:border-[var(--border)]
              [&_tr]:hover:bg-[var(--bg-secondary)]/50
              [&_strong]:font-bold [&_strong]:text-[var(--text-primary)]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30 gap-2 flex-wrap">
          <div className="text-xs text-[var(--text-muted)]">
            {schoolName}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'কপি করুন' : 'Copy Text')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--brand)] text-white hover:opacity-90 text-xs font-semibold transition-opacity cursor-pointer border-none shadow-xs"
            >
              <Download size={14} />
              <span>{isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
