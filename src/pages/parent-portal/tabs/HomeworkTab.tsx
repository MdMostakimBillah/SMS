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
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl text-left border transition-all ${
            filter === 'all'
              ? 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 shadow-xs'
              : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            <span>{isBn ? 'মোট হোমওয়ার্ক' : 'Total Homework'}</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-xl text-left border transition-all ${
            filter === 'pending'
              ? 'bg-amber-50/70 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600 shadow-xs'
              : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
            <span>{isBn ? 'বাকি রয়েছে' : 'Pending / Due'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('submitted')}
          className={`p-4 rounded-xl text-left border transition-all ${
            filter === 'submitted'
              ? 'bg-purple-50/70 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600 shadow-xs'
              : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
            <span>{isBn ? 'জমা দেওয়া হয়েছে' : 'Submitted'}</span>
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.submitted}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('evaluated')}
          className={`p-4 rounded-xl text-left border transition-all ${
            filter === 'evaluated'
              ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            <span>{isBn ? 'মূল্যায়িত ও স্কোর' : 'Evaluated'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.evaluated}</div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'বিষয়, শিরোনাম বা শিক্ষকের নামে অনুসন্ধান করুন...' : 'Search by subject, title or teacher...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
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
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  filter === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <BookOpen className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all p-4 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        {isBn ? item.subjectBn : item.subject}
                      </span>

                      {isPending && (
                        <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {isBn ? 'বাকি রয়েছে' : 'Pending'}
                        </span>
                      )}
                      {isSubmitted && (
                        <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {isBn ? 'জমা দেওয়া হয়েছে' : 'Submitted'}
                        </span>
                      )}
                      {isEvaluated && (
                        <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isBn ? 'মূল্যায়িত' : 'Evaluated'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {isBn ? item.titleBn : item.title}
                    </h4>
                  </div>

                  {/* Submission Marks or Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isEvaluated && item.marks !== undefined && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {isBn ? 'প্রাপ্ত নম্বর' : 'Score'}
                        </div>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {item.marks} / {item.maxMarks}
                        </div>
                      </div>
                    )}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsDone(item.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সম্পন্ন চিহ্নিত করুন' : 'Mark Completed'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description Body */}
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                  {item.description}
                </p>

                {/* Teacher feedback if evaluated */}
                {isEvaluated && item.feedback && (
                  <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{isBn ? 'শিক্ষকের মন্তব্য: ' : "Teacher's Feedback: "}</span>
                      {item.feedback}
                    </div>
                  </div>
                )}

                {/* Footer Dates & Teacher */}
                <div className="flex flex-wrap items-center justify-between text-[0.6875rem] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700/60 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {isBn ? 'বরাদ্দ:' : 'Assigned:'} {item.assignedDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                      <Clock className="w-3 h-3" />
                      {isBn ? 'জমার শেষ তারিখ:' : 'Due:'} {item.dueDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400">{isBn ? 'শিক্ষক: ' : 'Teacher: '}</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.teacherName}</span>
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
