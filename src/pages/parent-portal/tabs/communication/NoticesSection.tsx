import React, { useState, useMemo } from 'react'
import {
  Bell,
  Pin,
  Search,
  Calendar,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import type { Notice } from '@/store/noticeStore'
import { NoticeDetailModal } from './NoticeDetailModal'

const PRIORITY_CONFIG = {
  low: { label: 'Low', labelBn: 'কম', icon: Info, color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.14)' },
  medium: { label: 'Medium', labelBn: 'মাঝারি', icon: Bell, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)' },
  high: { label: 'High', labelBn: 'বেশি', icon: AlertTriangle, color: 'var(--orange, #f97316)', bg: 'rgba(249, 115, 22, 0.12)' },
  urgent: { label: 'Urgent', labelBn: 'জরুরি', icon: AlertCircle, color: 'var(--red, #ef4444)', bg: 'rgba(239, 68, 68, 0.14)' },
} as const

interface NoticesSectionProps {
  parentNotices: Notice[]
  isBn: boolean
}

export const NoticesSection = React.memo(function NoticesSection({
  parentNotices,
  isBn,
}: NoticesSectionProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  const categories = useMemo(() => {
    const set = new Set<string>()
    parentNotices.forEach((n) => {
      if (n.category) set.add(n.category)
    })
    return ['all', ...Array.from(set)]
  }, [parentNotices])

  const filteredNotices = useMemo(() => {
    return parentNotices.filter((notice) => {
      if (selectedCategory !== 'all' && notice.category !== selectedCategory) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const title = (isBn ? notice.titleBn || notice.title : notice.title || '').toLowerCase()
        const content = (isBn ? notice.contentBn || notice.content : notice.content || '')
          .replace(/<[^>]*>/g, '')
          .toLowerCase()
        const author = (isBn ? notice.authorBn || notice.author : notice.author || '').toLowerCase()
        return title.includes(q) || content.includes(q) || author.includes(q)
      }
      return true
    })
  }, [parentNotices, selectedCategory, search, isBn])

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {isBn ? 'প্রতিষ্ঠানিক নোটিশ ও বিজ্ঞপ্তি বোর্ড' : 'Institution Notices & Announcements'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isBn ? `মোট ${filteredNotices.length} টি বিজ্ঞপ্তি পাওয়া গেছে` : `${filteredNotices.length} notices found`}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isBn ? 'নোটিশ খুঁজুন...' : 'Search notices...'}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-2xs'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {cat === 'all' ? (isBn ? 'সকল নোটিশ' : 'All Notices') : cat}
            </button>
          ))}
        </div>
      )}

      {/* Notice List in Full-Width Card Style */}
      {filteredNotices.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs">
          <Bell className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-xs text-[var(--text-secondary)]">
            {search
              ? (isBn ? 'অনুসন্ধানের সাথে মেলে এমন কোনো নোটিশ পাওয়া যায়নি' : 'No notices match your search criteria')
              : (isBn ? 'বর্তমানে কোনো সক্রিয় নোটিশ নেই' : 'No active notices at the moment')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotices.map((notice) => {
            const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium
            const PriorityIcon = priority.icon
            const displayTitle = (isBn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
            const rawContent = (isBn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''
            // Clean plain text preview with all HTML stripped
            const plainExcerpt = rawContent.replace(/<[^>]*>/g, '').trim()

            return (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className={`group flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer w-full bg-[var(--surface)] hover:border-[var(--brand)]/70 hover:bg-[var(--bg-secondary)]/50 shadow-xs ${
                  notice.pinned
                    ? 'border-[var(--brand)]/80 bg-[var(--bg-secondary)]/30'
                    : 'border-[var(--border)]'
                }`}
              >
                {/* Priority / Category Icon Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ background: priority.bg, color: priority.color }}
                >
                  <PriorityIcon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {notice.pinned && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[0.625rem] font-bold rounded-md bg-[var(--brand)] text-white shadow-2xs">
                        <Pin size={9} /> PINNED
                      </span>
                    )}
                    {notice.category && (
                      <span className="px-2 py-0.5 text-[0.625rem] font-medium rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                        {notice.category}
                      </span>
                    )}
                    <span
                      className="px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase rounded-md"
                      style={{ background: priority.bg, color: priority.color }}
                    >
                      {isBn ? priority.labelBn : priority.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[0.625rem] text-[var(--text-muted)] ml-auto">
                      <Calendar size={11} />
                      {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : ''}
                    </span>
                  </div>

                  <h4 className="text-[0.875rem] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate mb-1">
                    {displayTitle}
                  </h4>

                  {/* Clean excerpt text without any HTML tags */}
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2">
                    {plainExcerpt}
                  </p>

                  <div className="flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]/70">
                    <span className="truncate">
                      {isBn ? 'কর্তৃপক্ষ: ' : 'Authority: '}
                      <span className="font-medium text-[var(--text-secondary)]">
                        {isBn ? notice.authorBn || notice.author : notice.author}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-0.5 text-[var(--brand)] font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>{isBn ? 'বিস্তারিত পড়ুন' : 'Read Notice'}</span>
                      <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
          isBn={isBn}
        />
      )}
    </div>
  )
})
