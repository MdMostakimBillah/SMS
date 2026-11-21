import React from 'react'
import { Bell } from 'lucide-react'
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
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {isBn ? 'অভিভাবকদের জন্য সাম্প্রতিক নোটিশ' : 'Latest Notices for Parents'}
        </h3>
        <span className="text-xs text-gray-500">
          {isBn ? `মোট ${parentNotices.length} টি নোটিশ` : `${parentNotices.length} notices`}
        </span>
      </div>

      {parentNotices.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isBn ? 'বর্তমানে কোনো নোটিশ নেই' : 'No active notices at the moment'}
          </p>
        </div>
      ) : (
        parentNotices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-2xs"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {notice.pinned && (
                  <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    PINNED
                  </span>
                )}
                <span className="px-2 py-0.5 text-[0.6875rem] font-medium rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {notice.category || 'General'}
                </span>
                <span className="text-xs text-gray-400">
                  {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : ''}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 text-[0.625rem] font-semibold rounded-full uppercase ${
                  notice.priority === 'urgent'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : notice.priority === 'high'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {notice.priority}
              </span>
            </div>

            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
              {isBn ? notice.titleBn || notice.title : notice.title}
            </h4>

            <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed mb-3">
              {isBn ? notice.contentBn || notice.content : notice.content}
            </p>

            <div className="text-[0.6875rem] text-gray-400 border-t border-gray-100 dark:border-gray-700/60 pt-2 flex items-center justify-between">
              <span>
                {isBn ? 'কর্তৃপক্ষ: ' : 'Issued by: '}
                {isBn ? notice.authorBn || notice.author : notice.author}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {isBn ? 'অভিভাবকদের জন্য' : 'For Parents'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
})
