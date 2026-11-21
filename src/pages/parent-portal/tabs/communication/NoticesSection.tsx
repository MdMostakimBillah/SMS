import React from 'react'
import { Bell, Pin } from 'lucide-react'
import type { Notice } from '@/store/noticeStore'

interface NoticesSectionProps {
  parentNotices: Notice[]
  isBn: boolean
}

export const NoticesSection = React.memo(function NoticesSection({
  parentNotices,
  isBn,
}: NoticesSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          {isBn ? 'অভিভাবকদের জন্য সাম্প্রতিক নোটিশ' : 'Latest Notices for Parents'}
        </h3>
        <span className="text-xs text-[var(--text-secondary)]">
          {isBn ? `মোট ${parentNotices.length} টি নোটিশ` : `${parentNotices.length} notices`}
        </span>
      </div>

      {parentNotices.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <Bell className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-xs text-[var(--text-secondary)]">
            {isBn ? 'বর্তমানে কোনো নোটিশ নেই' : 'No active notices at the moment'}
          </p>
        </div>
      ) : (
        parentNotices.map((notice) => (
          <div
            key={notice.id}
            className="w-full bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] hover:border-[var(--brand)] transition-colors shadow-xs"
          >
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {notice.pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-bold rounded-md bg-[var(--brand)] text-white">
                    <Pin size={10} /> PINNED
                  </span>
                )}
                <span className="px-2 py-0.5 text-[0.6875rem] font-medium rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  {notice.category || 'General'}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : ''}
                </span>
              </div>
              <span className="px-2 py-0.5 text-[0.625rem] font-semibold rounded-md uppercase border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                {notice.priority}
              </span>
            </div>

            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1.5">
              {isBn ? notice.titleBn || notice.title : notice.title}
            </h4>

            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed mb-3">
              {isBn ? notice.contentBn || notice.content : notice.content}
            </p>

            <div className="text-[0.6875rem] text-[var(--text-muted)] border-t border-[var(--border)] pt-2 flex items-center justify-between">
              <span>
                {isBn ? 'কর্তৃপক্ষ: ' : 'Issued by: '}
                {isBn ? notice.authorBn || notice.author : notice.author}
              </span>
              <span className="text-[var(--text-secondary)] font-medium">
                {isBn ? 'অভিভাবকদের জন্য' : 'For Parents'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
})
