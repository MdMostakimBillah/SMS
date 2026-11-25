import React, { useState, useMemo, useEffect } from 'react'
import {
  BookOpen,
  Clock,
  CheckCircle2,
  CheckCircle,
  Search,
  Filter,
} from 'lucide-react'
import type { PortalChild, HomeworkItem } from '../types'
import { getChildHomework } from '../utils/dataMappers'
import { useAssignmentStore } from '@/store/assignmentStore'
import { HomeworkCard } from './homework/HomeworkCard'

interface HomeworkTabProps {
  child: PortalChild
  homeworkList?: HomeworkItem[]
  isBn: boolean
}

type StatusFilter = 'all' | 'pending' | 'submitted' | 'evaluated'
type TypeFilter = 'all' | 'homework' | 'assignment'

export const HomeworkTab = React.memo(function HomeworkTab({
  child,
  homeworkList: initialList,
  isBn,
}: HomeworkTabProps) {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const assignments = useAssignmentStore((s) => s.assignments)
  const submissions = useAssignmentStore((s) => s.submissions)

  const realList = useMemo(() => {
    void assignments
    void submissions
    return getChildHomework(child)
  }, [child, assignments, submissions])
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>(initialList ?? realList)

  useEffect(() => {
    setHomeworkList(initialList ?? realList)
  }, [initialList, realList])

  const filteredList = useMemo(() => {
    return homeworkList.filter((item) => {
      const matchesFilter = filter === 'all' || item.status === filter
      const matchesType = typeFilter === 'all' || (item.type || 'homework') === typeFilter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.subject.toLowerCase().includes(q) ||
        item.subjectBn.includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.titleBn.includes(q) ||
        item.teacherName.toLowerCase().includes(q)
      return matchesFilter && matchesType && matchesSearch
    })
  }, [homeworkList, filter, typeFilter, searchQuery])

  const stats = useMemo(() => {
    const total = homeworkList.length
    const pending = homeworkList.filter((h) => h.status === 'pending').length
    const submitted = homeworkList.filter((h) => h.status === 'submitted').length
    const evaluated = homeworkList.filter((h) => h.status === 'evaluated').length
    return { total, pending, submitted, evaluated }
  }, [homeworkList])

  const handleMarkAsDone = (id: string) => {
    try {
      const assignmentStore = useAssignmentStore.getState()
      const existingSub = assignmentStore.submissions.find(
        (s) => s.assignmentId === id && s.studentId === child.id
      )

      if (existingSub) {
        assignmentStore.updateSubmission(existingSub.id, {
          status: 'submitted',
          submittedAt: new Date().toISOString(),
        })
      } else {
        assignmentStore.addSubmission({
          assignmentId: id,
          studentId: child.id,
          studentName: child.nameEn,
          studentNameBn: child.nameBn || child.nameEn,
          submittedAt: new Date().toISOString(),
          fileUrl: '',
          marks: null,
          feedback: isBn ? 'অভিভাবক কর্তৃক সম্পন্ন হিসেবে চিহ্নিত' : 'Marked completed by parent',
          feedbackBn: isBn ? 'অভিভাবক কর্তৃক সম্পন্ন হিসেবে চিহ্নিত' : 'Marked completed by parent',
          status: 'submitted',
        })
      }
    } catch {
      /* ignore */
    }

    setHomeworkList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'submitted' as const } : item
      )
    )
  }

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            {
              id: 'all',
              labelBn: 'মোট কাজ ও ডায়েরি',
              labelEn: 'Total Tasks & Diary',
              count: stats.total,
              icon: <BookOpen size={18} />,
              inactiveCls: 'bg-[var(--brand-light)] text-[var(--brand)] border-[var(--border)]',
            },
            {
              id: 'pending',
              labelBn: 'বাকি রয়েছে',
              labelEn: 'Pending / Due',
              count: stats.pending,
              icon: <Clock size={18} />,
              inactiveCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            },
            {
              id: 'submitted',
              labelBn: 'জমা দেওয়া',
              labelEn: 'Submitted',
              count: stats.submitted,
              icon: <CheckCircle size={18} />,
              inactiveCls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            },
            {
              id: 'evaluated',
              labelBn: 'মূল্যায়িত',
              labelEn: 'Evaluated',
              count: stats.evaluated,
              icon: <CheckCircle2 size={18} />,
              inactiveCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            },
          ] as const
        ).map((item) => {
          const isActive = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--surface)] border text-left cursor-pointer transition-all shadow-xs ${
                isActive ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]' : 'border-[var(--border)] hover:border-[var(--border-2)]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-[var(--brand)] text-white border-[var(--brand)]' : item.inactiveCls
                }`}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-tight tabular-nums">
                  {item.count}
                </div>
                <div className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 truncate">
                  {isBn ? item.labelBn : item.labelEn}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[var(--surface)] p-3 rounded-2xl border border-[var(--border)] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'বিষয়, শিরোনাম বা শিক্ষকের নামে খুঁজুন...' : 'Search by subject, title or teacher...'}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
          {(['all', 'homework', 'assignment'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`h-8 px-3 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer border ${
                typeFilter === t
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] font-semibold'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t === 'all'
                ? isBn ? 'সকল ধরণ' : 'All Types'
                : t === 'homework'
                ? isBn ? 'ডায়েরি ও গৃহকাজ' : 'Diary & Homework'
                : isBn ? 'অ্যাসাইনমেন্ট' : 'Assignments'}
            </button>
          ))}
        </div>
      </div>

      {/* Homework Cards List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xs">
            <BookOpen className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2.5 opacity-40" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'কোনো হোমওয়ার্ক বা ডায়েরি পাওয়া যায়নি' : 'No homework or diary tasks found'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
              {isBn
                ? 'শিক্ষক বা প্রতিষ্ঠান অ্যাডমিন থেকে অ্যাসাইনমেন্ট প্রকাশ করা হলে এখানে দেখা যাবে।'
                : 'Assignments and daily diary published by teachers will appear here.'}
            </p>
          </div>
        ) : (
          filteredList.map((item) => (
            <HomeworkCard
              key={item.id}
              item={item}
              onMarkAsDone={handleMarkAsDone}
              isBn={isBn}
            />
          ))
        )}
      </div>
    </div>
  )
})
