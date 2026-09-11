import { ArrowLeft, Pin, PinOff, Edit3, Trash2, Download, Calendar, Users, Tag } from 'lucide-react'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML, pdfFooterHTML } from '@/lib/pdfBranding'
import { useClassStore } from '@/store/classStore'
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

  const handleDownloadPDF = () => {
    const brand = getPDFBranding()
    const logoHTML = pdfLogoHTML(brand, 36)
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const css = `
      @page { size: A4 portrait; margin: 0; }
      @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; padding: 8mm; } }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1e293b; background: #fff; padding: 8mm; font-size: 12px; }
      .hdr { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid ${brand.brandColor}; padding-bottom: 10px; margin-bottom: 14px; }
      .sname { font-size: 17px; font-weight: 700; color: ${brand.brandColor}; }
      .saddr { font-size: 9px; color: #888; line-height: 1.5; }
      .ttl { text-align: center; font-size: 16px; font-weight: 700; color: ${brand.brandColor}; margin: 12px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      .meta-row { display: flex; gap: 16px; margin-bottom: 10px; font-size: 10px; color: #666; flex-wrap: wrap; }
      .meta-item { display: flex; align-items: center; gap: 5px; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 600; }
      .content { line-height: 1.7; font-size: 12px; }
      .content h1 { font-size: 18px; font-weight: 700; margin: 12px 0 6px; }
      .content h2 { font-size: 16px; font-weight: 700; margin: 10px 0 5px; }
      .content h3 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; }
      .content p { margin-bottom: 8px; }
      .content ul, .content ol { padding-left: 24px; margin-bottom: 8px; list-style-type: disc; }
      .content ol { list-style-type: decimal; }
      .content li { margin-bottom: 3px; }
      .content blockquote { border-left: 4px solid ${brand.brandColor}; padding-left: 12px; margin: 8px 0; font-style: italic; color: #555; }
      .content code { background: #f0f2f8; padding: 1px 5px; border-radius: 4px; font-size: 11px; color: ${brand.brandColor}; }
      .content pre { background: #f8f9fc; padding: 10px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
      .content pre code { background: none; padding: 0; }
      .content table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      .content th { background: ${brand.brandColor}; color: #fff; padding: 6px 10px; text-align: left; font-size: 11px; }
      .content td { padding: 5px 10px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
      .content tr:nth-child(even) { background: #f8f9fc; }
      .content hr { border: none; border-top: 1px solid #ddd; margin: 10px 0; }
      .content img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
      .ftr { margin-top: 14px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 8px; color: #999; display: flex; justify-content: space-between; }
    `
    const bodyHTML = `
      <div class="hdr">
        ${logoHTML}
        <div>
          <div class="sname">${brand.schoolName}</div>
          ${brand.address ? `<div class="saddr">${brand.address}</div>` : ''}
          ${brand.phone ? `<div class="saddr">${brand.phone}${brand.email ? ' | ' + brand.email : ''}</div>` : ''}
        </div>
        <div style="margin-left:auto;text-align:right;font-size:9px;color:#888;line-height:1.6">
          <div>Printed: ${dateStr}</div>
          <div style="font-weight:600;color:${brand.brandColor}">NOTICE</div>
        </div>
      </div>

      <div class="ttl">${bn ? notice.titleBn : notice.title}</div>
      ${notice.titleBn && notice.titleBn !== notice.title && bn ? `<div style="text-align:center;font-size:13px;color:#555;margin-bottom:10px">${notice.titleBn}</div>` : ''}

      <div class="meta-row">
        <div class="meta-item"><strong>${bn ? 'প্রকাশকাল:' : 'Published:'}</strong> ${new Date(notice.publishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <div class="meta-item"><strong>${bn ? 'লেখক:' : 'Author:'}</strong> ${bn ? notice.authorBn : notice.author}</div>
        <div class="meta-item"><strong>${bn ? 'মূল্যায়ন:' : 'Target:'}</strong> ${bn ? target?.labelBn : target?.label}</div>
        ${notice.category ? `<div class="meta-item"><strong>${bn ? 'ক্যাটাগরি:' : 'Category:'}</strong> <span class="badge" style="background:${brand.brandColor}18;color:${brand.brandColor}">${notice.category}</span></div>` : ''}
        <div class="meta-item"><strong>${bn ? 'অগ্রাধিকার:' : 'Priority:'}</strong> <span class="badge" style="background:${priority.color}18;color:${priority.color}">${bn ? priority.labelBn : priority.label}</span></div>
        ${notice.expiresAt ? `<div class="meta-item"><strong>${bn ? 'মেয়াদ:' : 'Expires:'}</strong> ${notice.expiresAt}</div>` : ''}
      </div>

      <div class="content">${bn ? notice.contentBn : notice.content}</div>

      ${pdfFooterHTML(bn)}
    `
    openPrintWindow(bn ? notice.titleBn : notice.title, bodyHTML, { css })
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
            {bn ? notice.titleBn : notice.title}
          </h1>
        </div>
      </div>

      {/* Social-media-style card */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
        {/* Watermark */}
        {logo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <img src={logo} alt="" className="w-[60%] h-[60%] object-contain" />
          </div>
        )}

        {/* Card header: school logo + author + meta */}
        <div className="relative flex items-start gap-3 p-4 pb-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2" style={{ borderColor: 'var(--brand)', background: logo ? 'var(--bg-secondary)' : 'var(--brand)' }}>
            {logo ? (
              <img src={logo} alt={schoolName} className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="text-white font-bold text-[0.8125rem]">{schoolName.charAt(0).toUpperCase()}</span>
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
              <span>{bn ? notice.authorBn : notice.author}</span>
              <span>·</span>
              <Calendar size={11} />
              {new Date(notice.publishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Badges row */}
        <div className="relative px-4 pb-3 flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium" style={{ background: `${priority.color}15`, color: priority.color }}>
            {bn ? priority.labelBn : priority.label}
          </span>
          {notice.category && (
            <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium flex items-center gap-1" style={{ background: 'var(--brand)15', color: 'var(--brand)' }}>
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
            {bn ? notice.titleBn : notice.title}
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
            dangerouslySetInnerHTML={{ __html: bn ? notice.contentBn : notice.content }}
          />
        </div>

        {/* Action bar */}
        <div className="relative flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-1">
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
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium text-white bg-[var(--brand)] hover:opacity-90 transition-opacity"
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>
    </div>
  )
}
