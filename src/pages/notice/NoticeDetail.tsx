import { useState } from 'react'
import { ArrowLeft, Pin, PinOff, Edit3, Trash2, Download, Calendar, Users, Tag, Copy, Check, FileJson } from 'lucide-react'
import { printNoticePDF } from './noticePdf'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useClassStore } from '@/store/classStore'
import { sanitizeHtml } from '@/lib/sanitize'
import type { Notice } from '@/store/noticeStore'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', labelBn: 'কম', color: 'var(--text-muted)' },
  { value: 'medium', label: 'Medium', labelBn: 'মাঝারি', color: 'var(--brand)' },
  { value: 'high', label: 'High', labelBn: 'বেশি', color: 'var(--orange)' },
  { value: 'urgent', label: 'Urgent', labelBn: 'জরুরি', color: 'var(--red)' },
]
const TARGET_OPTIONS = [
  { value: 'all', label: 'All', labelBn: 'সকল' },
  { value: 'students', label: 'Students', labelBn: 'শিক্ষার্থী' },
  { value: 'teachers', label: 'Teachers', labelBn: 'শিক্ষক' },
  { value: 'parents', label: 'Parents', labelBn: 'অভিভাবক' },
]

interface Props {
  notice: Notice
  onBack: () => void
  onEdit: (n: Notice) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  canEdit: boolean
  canDelete: boolean
  bn: boolean
}

export function NoticeDetail({ notice, onBack, onEdit, onDelete, onTogglePin, canEdit: canEditNotice, canDelete: canDeleteNotice, bn }: Props) {
  const priority = PRIORITY_OPTIONS.find((p) => p.value === notice.priority) || PRIORITY_OPTIONS[0]
  const target = TARGET_OPTIONS.find((t) => t.value === notice.target)
  const institution = useClassStore((s) => s.institution)
  const logo = institution.logo
  const schoolName = institution.name || 'EduTech'

  const displayTitle = (bn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
  const displayAuthor = (bn ? notice.authorBn || notice.author : notice.author || notice.authorBn) || ''
  const displayContent = (bn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const plainText = displayContent.replace(/<[^>]*>/g, '').trim()
    const shareText = `${displayTitle}\n\n${plainText}\n\n${schoolName} · ${displayAuthor}`
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notice, null, 2))
    const a = document.createElement('a')
    a.href = dataStr
    a.download = `notice-${notice.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleDownloadPDF = () => {
    printNoticePDF(notice, bn, logo)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${bn ? 'text-[1rem]' : 'text-[1.0625rem]'}`}>
            {displayTitle}
          </h1>
        </div>
      </div>

      {/* Notice Card */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
        {/* Card header: school logo + author + meta */}
        <div className="relative flex items-start gap-3 p-4 pb-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2" style={{ borderColor: 'var(--brand)', background: 'var(--bg-secondary)' }}>
            {logo ? (
              <img src={logo} alt={schoolName} className="w-full h-full object-contain p-0.5" />
            ) : (
              <BrandLogo size={26} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {schoolName}
              </span>
              {notice.pinned && (
                <span className="px-1.5 py-0.5 rounded-full text-[0.5625rem] font-medium flex items-center gap-0.5" style={{ background: 'var(--brand)15', color: 'var(--brand)' }}>
                  <Pin size={10} /> {bn ? 'পিন করা' : 'Pinned'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[0.6875rem] text-[var(--text-muted)]">
              <span>{displayAuthor}</span>
              <span>·</span>
              <Calendar size={11} />
              {new Date(notice.publishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="relative px-4 pb-3 flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium" style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: priority.color }}>
            {bn ? priority.labelBn : priority.label}
          </span>
          {notice.category && (
            <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium flex items-center gap-1" style={{ background: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: 'var(--brand)' }}>
              <Tag size={10} /> {notice.category}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center gap-1">
            <Users size={10} /> {bn ? target?.labelBn : target?.label}
          </span>
          {notice.expiresAt && (
            <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium bg-[var(--orange)]/10 text-[var(--orange)]">
              {bn ? `মেয়াদ: ${notice.expiresAt}` : `Expires: ${notice.expiresAt}`}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="relative px-4 pb-3">
          <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-snug">
            {displayTitle}
          </h2>
          {notice.titleBn && notice.title !== notice.titleBn && !bn && (
            <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5">{notice.titleBn}</p>
          )}
        </div>

        {/* Content */}
        <div className="relative px-4 pb-4">
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
              [&_code]:bg-[var(--bg-secondary)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[var(--brand)] [&_code]:text-[0.8125rem] [&_code]:font-mono
              [&_pre]:bg-[var(--bg-secondary)] [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:rounded-xl [&_table]:overflow-hidden
              [&_th]:bg-[var(--brand)] [&_th]:text-white [&_th]:p-2.5 [&_th]:text-left [&_th]:text-[0.8125rem] [&_th]:font-semibold
              [&_td]:p-2 [&_td]:text-[0.8125rem] [&_td]:border-b [&_td]:border-[var(--border)]
              [&_tr]:hover:bg-[var(--bg-secondary)]/50
              [&_hr]:border-[var(--border)] [&_hr]:my-4
              [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-2"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
          />
        </div>

        {/* Action bar */}
        <div className="relative flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {canEditNotice && (
              <button
                onClick={() => onTogglePin(notice.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                title={notice.pinned ? (bn ? 'পিন সরান' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
              >
                {notice.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                {notice.pinned ? (bn ? 'পিন সরান' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
              </button>
            )}
            {canEditNotice && (
              <button
                onClick={() => onEdit(notice)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Edit3 size={14} />
                {bn ? 'সম্পাদনা' : 'Edit'}
              </button>
            )}
            {canDeleteNotice && (
              <button
                onClick={() => onDelete(notice.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
              >
                <Trash2 size={14} />
                {bn ? 'মুছুন' : 'Delete'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title={bn ? 'টেক্সট কপি করুন' : 'Copy Text'}
            >
              {copied ? <Check size={14} className="text-[var(--green,green)]" /> : <Copy size={14} />}
              {copied ? (bn ? 'কপি হয়েছে!' : 'Copied!') : (bn ? 'কপি' : 'Copy')}
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title={bn ? 'লোকাল পিসির জন্য JSON ডাউনলোড করুন' : 'Download JSON for Local PC'}
            >
              <FileJson size={14} />
              JSON
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.75rem] font-medium text-white bg-[var(--brand)] hover:opacity-90 transition-opacity"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
