import React, { useState, useMemo, useEffect } from 'react'
import { Bell, User } from 'lucide-react'
import type { PortalChild } from '../types'
import { useNoticeStore } from '@/store/noticeStore'
import { useTeacherStore } from '@/store/teacherStore'
import { NoticesSection } from './communication/NoticesSection'
import { TeachersSection, type TeacherEntry } from './communication/TeachersSection'

interface CommunicationTabProps {
  child: PortalChild
  isBn: boolean
  initialSection?: 'notices' | 'teachers'
}

export const CommunicationTab = React.memo(function CommunicationTab({
  child,
  isBn,
  initialSection = 'notices',
}: CommunicationTabProps) {
  const notices = useNoticeStore((s) => s.notices)
  const storeTeachers = useTeacherStore((s) => s.teachers)
  const departments = useTeacherStore((s) => s.departments)
  const subjects = useTeacherStore((s) => s.subjects)

  const [activeSection, setActiveSection] = useState<'notices' | 'teachers'>(initialSection)

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection)
    }
  }, [initialSection])

  const parentNotices = useMemo(() => {
    return notices
      .filter((n) => n && n.isActive !== false && n.target !== 'teachers')
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
      })
  }, [notices])

  const teachers = useMemo<TeacherEntry[]>(() => {
    const list: TeacherEntry[] = []
    const tList = storeTeachers || []
    const deptMap = new Map((departments || []).map((d) => [d.id, isBn ? d.nameBn || d.name : d.name]))
    const subjMap = new Map((subjects || []).map((s) => [s.id, isBn ? s.nameBn || s.name : s.name]))

    if (child.classTeacherName) {
      const match = tList.find(
        (t) => t.nameEn === child.classTeacherName || t.nameBn === child.classTeacherName
      )
      list.push({
        name: child.classTeacherName,
        roleEn: 'Class Teacher',
        roleBn: 'শ্রেণি শিক্ষক',
        phone: child.classTeacherPhone || match?.phone || '',
        email: child.classTeacherEmail || match?.email || '',
        isClassTeacher: true,
        department: match?.departmentId ? deptMap.get(match.departmentId) : undefined,
        subjects: match?.subjectIds ? match.subjectIds.map((id) => subjMap.get(id) || '').filter(Boolean) : undefined,
        photo: match?.photo,
      })
    }

    tList.forEach((t) => {
      const isAlreadyAdded = list.some((item) => item.name === t.nameEn || item.name === t.nameBn)
      if (!isAlreadyAdded) {
        list.push({
          name: isBn ? t.nameBn || t.nameEn : t.nameEn || t.nameBn,
          roleEn: t.designation || 'Subject Teacher',
          roleBn: t.designation || 'বিষয় শিক্ষক',
          phone: t.phone || '',
          email: t.email || '',
          isClassTeacher: false,
          department: t.departmentId ? deptMap.get(t.departmentId) : undefined,
          subjects: t.subjectIds ? t.subjectIds.map((id) => subjMap.get(id) || '').filter(Boolean) : undefined,
          photo: t.photo,
        })
      }
    })

    return list
  }, [child, storeTeachers, departments, subjects, isBn])

  return (
    <div className="space-y-4">
      {/* Sub-navigation tabs */}
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-x-auto scrollbar-hide max-w-full">
        <button
          type="button"
          onClick={() => setActiveSection('notices')}
          className={`h-9 flex items-center gap-2 px-4 text-xs rounded-xl transition-colors cursor-pointer border-none whitespace-nowrap shrink-0 ${
            activeSection === 'notices'
              ? 'bg-[var(--brand)] text-white font-semibold shadow-xs'
              : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{isBn ? 'নোটিশ বোর্ড' : 'Notice Board'}</span>
          {parentNotices.length > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[0.6875rem] leading-none rounded-full font-semibold tabular-nums ${
                activeSection === 'notices'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--brand-light)] text-[var(--brand)]'
              }`}
            >
              {parentNotices.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('teachers')}
          className={`h-9 flex items-center gap-2 px-4 text-xs rounded-xl transition-colors cursor-pointer border-none whitespace-nowrap shrink-0 ${
            activeSection === 'teachers'
              ? 'bg-[var(--brand)] text-white font-semibold shadow-xs'
              : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{isBn ? 'শিক্ষক পরিচিতি ও যোগাযোগ' : 'Teacher Directory'}</span>
          {teachers.length > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[0.6875rem] leading-none rounded-full font-semibold tabular-nums ${
                activeSection === 'teachers'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              {teachers.length}
            </span>
          )}
        </button>
      </div>

      {/* Sections */}
      {activeSection === 'notices' && (
        <NoticesSection parentNotices={parentNotices} isBn={isBn} />
      )}

      {activeSection === 'teachers' && (
        <TeachersSection child={child} teachers={teachers} isBn={isBn} />
      )}
    </div>
  )
})
