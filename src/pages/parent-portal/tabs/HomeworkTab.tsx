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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
        {(
          [
            {
              id: 'all',
              labelBn: 'মোট কাজ ও ডায়েরি',
              labelEn: 'Total Tasks & Diary',
              count: stats.total,
              icon: BookOpen,
              color: 'var(--brand)',
            },
            {
              id: 'pending',
              labelBn: 'বাকি রয়েছে',
              labelEn: 'Pending / Due',
              count: stats.pending,
              icon: Clock,
              color: 'var(--amber)',
            },
            {
              id: 'submitted',
              labelBn: 'জমা দেওয়া',
              labelEn: 'Submitted',
              count: stats.submitted,
              icon: CheckCircle,
              color: 'var(--teal)',
            },
            {
              id: 'evaluated',
              labelBn: 'মূল্যায়িত',
              labelEn: 'Evaluated',
              count: stats.evaluated,
              icon: CheckCircle2,
              color: 'var(--green)',
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                background: 'var(--surface)',
                border: `1px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
                borderRadius: '0.625rem',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = isActive ? 'var(--shadow-sm)' : 'var(--shadow-xs)'
              }}
            >
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.count}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 400,
                    marginTop: '0.1875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isBn ? item.labelBn : item.labelEn}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Main Content Container */}
      <div className="card--premium rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header with Section Head */}
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '0.1875rem',
              height: '0.875rem',
              background: 'var(--teal)',
              borderRadius: '0.125rem',
              flexShrink: 0,
            }}
          />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {isBn ? 'হোমওয়ার্ক ও দৈনিক ডায়েরি' : 'Homework & Daily Diary'}
          </h3>
        </div>

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
