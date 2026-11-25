import React, { useState, useMemo, useEffect } from 'react'
import {
  BookOpen,
  Clock,
  CheckCircle2,
  CheckCircle,
  Search,
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
      {/* Quick Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {(
          [
            {
              id: 'all',
              labelBn: 'মোট কাজ ও ডায়েরি',
              labelEn: 'Total Tasks & Diary',
              count: stats.total,
              icon: BookOpen,
              iconCls: 'text-[var(--text-secondary)]',
            },
            {
              id: 'pending',
              labelBn: 'বাকি রয়েছে',
              labelEn: 'Pending / Due',
              count: stats.pending,
              icon: Clock,
              iconCls: 'text-[var(--text-secondary)]',
            },
            {
              id: 'submitted',
              labelBn: 'জমা দেওয়া',
              labelEn: 'Submitted',
              count: stats.submitted,
              icon: CheckCircle,
              iconCls: 'text-[var(--text-secondary)]',
            },
            {
              id: 'evaluated',
              labelBn: 'মূল্যায়িত',
              labelEn: 'Evaluated',
              count: stats.evaluated,
              icon: CheckCircle2,
              iconCls: 'text-[var(--text-secondary)]',
            },
          ] as const
        ).map((item) => {
          const isActive = filter === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border text-left cursor-pointer transition-colors ${
                isActive
                  ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]/30'
                  : 'border-[var(--border)] hover:border-[var(--border-2)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                  {isBn ? item.labelBn : item.labelEn}
                </span>
                <Icon size={15} className={`${item.iconCls} shrink-0`} />
              </div>
              <div className="text-2xl font-semibold text-[var(--text-primary)] leading-none tabular-nums mt-2.5">
                {item.count}
              </div>
            </button>
          )
        })}
      </div>

      {/* Main Content Container */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'বিষয়, শিরোনাম বা শিক্ষকের নামে খুঁজুন...' : 'Search by subject, title or teacher...'}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[var(--border)] bg-slate-50/80 dark:bg-white/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] overflow-x-auto scrollbar-hide">
            {(['all', 'homework', 'assignment'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`h-7 px-3 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer border-none ${
                  typeFilter === t
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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

        {/* Homework List */}
        {filteredList.length === 0 ? (
          <div className="text-center py-12 px-4">
            <BookOpen className="w-7 h-7 mx-auto text-[var(--text-muted)] mb-2 opacity-35" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {isBn ? 'কোনো হোমওয়ার্ক বা ডায়েরি পাওয়া যায়নি' : 'No homework or diary tasks found'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
              {isBn
                ? 'শিক্ষক বা প্রতিষ্ঠান অ্যাডমিন থেকে অ্যাসাইনমেন্ট প্রকাশ করা হলে এখানে দেখা যাবে।'
                : 'Assignments and daily diary published by teachers will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredList.map((item) => (
              <HomeworkCard
                key={item.id}
                item={item}
                onMarkAsDone={handleMarkAsDone}
                isBn={isBn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
