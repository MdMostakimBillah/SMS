import React, { useState, useMemo } from 'react'
import {
  Bell,
  Pin,
  Search,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'
import type { Notice } from '@/store/noticeStore'
import { NoticeDetailModal } from './NoticeDetailModal'

const PRIORITY_CONFIG = {
  low: { label: 'Low', labelBn: 'কম', icon: Info, color: 'var(--text-muted)', dot: 'bg-slate-400' },
  medium: { label: 'Medium', labelBn: 'মাঝারি', icon: Bell, color: 'var(--brand)', dot: 'bg-[var(--brand)]' },
  high: { label: 'High', labelBn: 'বেশি', icon: AlertTriangle, color: '#f97316', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', labelBn: 'জরুরি', icon: AlertCircle, color: 'var(--red)', dot: 'bg-rose-500' },
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {isBn ? 'প্রাতিষ্ঠানিক নোটিশ ও বিজ্ঞপ্তি বোর্ড' : 'Institution Notices & Announcements'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isBn ? `মোট ${filteredNotices.length}টি বিজ্ঞপ্তি পাওয়া গেছে` : `${filteredNotices.length} notices found`}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isBn ? 'নোটিশ খুঁজুন...' : 'Search notices...'}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[var(--border)] bg-slate-50/80 dark:bg-white/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`h-7 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border-none ${
                selectedCategory === cat
                  ? 'bg-[var(--brand)] text-white font-semibold shadow-xs'
                  : 'bg-slate-100/80 dark:bg-white/[0.04] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat === 'all' ? (isBn ? 'সকল নোটিশ' : 'All Notices') : cat}
            </button>
          ))}
        </div>
      )}

      {/* Notice List */}
      {filteredNotices.length === 0 ? (
        <div className="text-center py-12 px-4">
          <Bell className="w-7 h-7 mx-auto text-[var(--text-muted)] mb-2 opacity-35" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {search
              ? (isBn ? 'অনুসন্ধানের সাথে মেলে এমন কোনো নোটিশ পাওয়া যায়নি' : 'No notices match your search criteria')
              : (isBn ? 'বর্তমানে কোনো সক্রিয় নোটিশ নেই' : 'No active notices at the moment')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {filteredNotices.map((notice) => {
            const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium
            const displayTitle = (isBn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
            const rawContent = (isBn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''
            const plainExcerpt = rawContent.replace(/<[^>]*>/g, '').trim()

            return (
              <div
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="group py-4 first:pt-1 last:pb-1 -mx-2 px-2 rounded-xl hover:bg-slate-50/70 dark:hover:bg-white/[0.025] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-wrap text-[0.6875rem] text-[var(--text-muted)] mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${priority.dot} shrink-0`} />
                  {notice.pinned && (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--brand)]">
                      <Pin size={10} />
                      <span>{isBn ? 'পিন করা' : 'Pinned'}</span>
                    </span>
                  )}
                  {notice.category && (
                    <span className="font-medium text-[var(--text-secondary)]">
                      {notice.category}
                    </span>
                  )}
                  <span>·</span>
                  <span style={{ color: priority.color }} className="font-medium">
                    {isBn ? priority.labelBn : priority.label}
                  </span>
                  {notice.publishedAt && (
                    <span className="ml-auto tabular-nums">
                      {new Date(notice.publishedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate mb-1">
                  {displayTitle}
                </h4>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2">
                  {plainExcerpt}
                </p>

                <div className="flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)]">
                  <span className="truncate">
                    {isBn ? 'কর্তৃপক্ষ: ' : 'By '}
                    <span className="font-medium text-[var(--text-secondary)]">
                      {isBn ? notice.authorBn || notice.author : notice.author}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-0.5 text-[var(--brand)] font-medium shrink-0">
                    <span>{isBn ? 'বিস্তারিত পড়ুন' : 'Read Notice'}</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
