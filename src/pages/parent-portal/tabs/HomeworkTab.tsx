import React, { useState, useMemo } from 'react'
import { BookOpen, Calendar, Clock, CheckCircle2, FileText, CheckCircle, Search, Filter } from 'lucide-react'
import type { PortalChild, HomeworkItem } from '../types'
import { DEMO_HOMEWORK } from '../mockData'

interface HomeworkTabProps {
  child: PortalChild
  isBn: boolean
}

type StatusFilter = 'all' | 'pending' | 'submitted' | 'evaluated'

export const HomeworkTab = React.memo(function HomeworkTab({ child: _child, isBn }: HomeworkTabProps) {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>(DEMO_HOMEWORK)

  // Filter & Search
  const filteredList = useMemo(() => {
    return homeworkList.filter((item) => {
      const matchesFilter = filter === 'all' || item.status === filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.subject.toLowerCase().includes(q) ||
        item.subjectBn.includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.titleBn.includes(q) ||
        item.teacherName.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [homeworkList, filter, searchQuery])

  // Count summaries
  const stats = useMemo(() => {
    const total = homeworkList.length
    const pending = homeworkList.filter((h) => h.status === 'pending').length
    const submitted = homeworkList.filter((h) => h.status === 'submitted').length
    const evaluated = homeworkList.filter((h) => h.status === 'evaluated').length
    return { total, pending, submitted, evaluated }
  }, [homeworkList])

  const handleMarkAsDone = (id: string) => {
    setHomeworkList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'submitted' as const } : item
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { id: 'all', labelBn: 'মোট হোমওয়ার্ক', labelEn: 'Total Homework', count: stats.total, icon: <BookOpen size={16} /> },
            { id: 'pending', labelBn: 'বাকি রয়েছে', labelEn: 'Pending / Due', count: stats.pending, icon: <Clock size={16} /> },
            { id: 'submitted', labelBn: 'জমা দেওয়া', labelEn: 'Submitted', count: stats.submitted, icon: <CheckCircle size={16} /> },
            { id: 'evaluated', labelBn: 'মূল্যায়িত', labelEn: 'Evaluated', count: stats.evaluated, icon: <CheckCircle2 size={16} /> },
          ] as const
        ).map((item) => (
          <div
            key={item.id}
            onClick={() => setFilter(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: filter === item.id ? '1px solid var(--brand)' : '1px solid var(--border)',
              borderRadius: '0.625rem',
              boxShadow: filter === item.id ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.375rem',
                background: filter === item.id ? 'var(--brand)' : 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: filter === item.id ? '#ffffff' : 'var(--brand)',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {item.count}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isBn ? item.labelBn : item.labelEn}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'বিষয়, শিরোনাম বা শিক্ষকের নামে অনুসন্ধান করুন...' : 'Search by subject, title or teacher...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
          {(['all', 'pending', 'submitted', 'evaluated'] as const).map((tab) => {
            const labels: Record<StatusFilter, { bn: string; en: string }> = {
              all: { bn: 'সবগুলো', en: 'All' },
              pending: { bn: 'বাকি', en: 'Pending' },
              submitted: { bn: 'জমা দেওয়া', en: 'Submitted' },
              evaluated: { bn: 'মূল্যায়িত', en: 'Evaluated' },
            }
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer border-none ${
                  filter === tab
                    ? 'bg-[var(--brand)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {isBn ? labels[tab].bn : labels[tab].en}
              </button>
            )
          })}
        </div>
      </div>

      {/* Homework Cards List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <BookOpen className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              {isBn ? 'কোনো হোমওয়ার্ক পাওয়া যায়নি' : 'No homework assignments found'}
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isPending = item.status === 'pending'
            const isSubmitted = item.status === 'submitted'
            const isEvaluated = item.status === 'evaluated'

            return (
              <div
                key={item.id}
                className="bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-gray-400 transition-all p-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        {isBn ? item.subjectBn : item.subject}
                      </span>

                      {isPending && (
                        <span className="px-2 py-0.5 text-[0.6875rem] font-medium rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                          {isBn ? 'বাকি' : 'Pending'}
                        </span>
                      )}
                      {isSubmitted && (
                        <span className="px-2 py-0.5 text-[0.6875rem] font-medium rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-[var(--text-muted)]" />
                          {isBn ? 'জমা দেওয়া' : 'Submitted'}
                        </span>
                      )}
                      {isEvaluated && (
                        <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded border border-[var(--brand)]/30 bg-[var(--brand)]/10 text-[var(--brand)] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isBn ? 'মূল্যায়িত' : 'Evaluated'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {isBn ? item.titleBn : item.title}
                    </h4>
                  </div>

                  {/* Submission Marks or Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isEvaluated && item.marks !== undefined && (
                      <div className="text-right">
                        <div className="text-[0.6875rem] text-[var(--text-muted)]">
                          {isBn ? 'প্রাপ্ত নম্বর' : 'Score'}
                        </div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                          {item.marks} / {item.maxMarks}
                        </div>
                      </div>
                    )}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsDone(item.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--brand)] hover:opacity-90 text-white transition-opacity shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সম্পন্ন চিহ্নিত করুন' : 'Mark Completed'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description Body */}
                <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                  {item.description}
                </p>

                {/* Teacher feedback if evaluated */}
                {isEvaluated && item.feedback && (
                  <div className="mb-3 p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{isBn ? 'শিক্ষকের মন্তব্য: ' : "Teacher's Feedback: "}</span>
                      {item.feedback}
                    </div>
                  </div>
                )}

                {/* Footer Dates & Teacher */}
                <div className="flex flex-wrap items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-2 border-t border-[var(--border)] gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {isBn ? 'বরাদ্দ:' : 'Assigned:'} {item.assignedDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-[var(--text-primary)]">
                      <Clock className="w-3 h-3" />
                      {isBn ? 'শেষ তারিখ:' : 'Due:'} {item.dueDate}
                    </span>
                  </div>

                  <div>
                    <span>{isBn ? 'শিক্ষক: ' : 'Teacher: '}</span>
                    <span className="font-medium text-[var(--text-secondary)]">{item.teacherName}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})
