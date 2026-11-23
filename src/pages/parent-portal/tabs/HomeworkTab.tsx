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
  const realList = useMemo(() => getChildHomework(child), [child])
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>(initialList ?? realList)

  useEffect(() => {
    setHomeworkList(initialList ?? realList)
  }, [initialList, realList])

  // Filter & Search
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

  // Count summaries
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {(
          [
            { id: 'all', labelBn: 'মোট কাজ ও ডায়েরি', labelEn: 'Total Tasks & Diary', count: stats.total, icon: <BookOpen size={16} /> },
            { id: 'pending', labelBn: 'বাকি রয়েছে', labelEn: 'Pending / Due', count: stats.pending, icon: <Clock size={16} /> },
            { id: 'submitted', labelBn: 'জমা দেওয়া', labelEn: 'Submitted', count: stats.submitted, icon: <CheckCircle size={16} /> },
            { id: 'evaluated', labelBn: 'মূল্যায়িত', labelEn: 'Evaluated', count: stats.evaluated, icon: <CheckCircle2 size={16} /> },
          ] as const
        ).map((item) => (
          <div
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-[0.875rem_1rem] rounded-[0.625rem] bg-[var(--surface)] border cursor-pointer transition-all ${
              filter === item.id ? 'border-[var(--brand)] shadow-sm' : 'border-[var(--border)] shadow-xs'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center shrink-0 ${
                filter === item.id ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--brand)]'
              }`}
            >
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[1rem] sm:text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight">
                {item.count}
              </div>
              <div className="text-[0.625rem] sm:text-[0.6875rem] text-[var(--text-secondary)] truncate">
                {isBn ? item.labelBn : item.labelEn}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'বিষয়, শিরোনাম বা শিক্ষকের নামে খুঁজুন...' : 'Search by subject, title or teacher...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--brand)]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
          {(['all', 'homework', 'assignment'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 text-[0.6875rem] font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer border-none ${
                typeFilter === t
                  ? 'bg-[var(--brand)] text-white shadow-2xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
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
          <div className="text-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <BookOpen className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {isBn ? 'কোনো হোমওয়ার্ক বা ডায়েরি পাওয়া যায়নি' : 'No homework or diary tasks found'}
            </p>
            <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
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
