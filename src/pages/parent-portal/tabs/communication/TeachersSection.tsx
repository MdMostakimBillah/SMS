import React, { useState, useMemo } from 'react'
import {
  Phone,
  Mail,
  UserCheck,
  Search,
  Copy,
  Check,
  Star,
} from 'lucide-react'
import type { PortalChild } from '../../types'

export interface TeacherEntry {
  name: string
  roleEn: string
  roleBn: string
  phone: string
  email: string
  isClassTeacher: boolean
  department?: string
  subjects?: string[]
  photo?: string
}

interface TeachersSectionProps {
  child: PortalChild
  teachers: TeacherEntry[]
  isBn: boolean
}

export const TeachersSection = React.memo(function TeachersSection({
  child,
  teachers,
  isBn,
}: TeachersSectionProps) {
  const [search, setSearch] = useState('')
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null)

  const handleCopyPhone = (phoneStr: string) => {
    if (!phoneStr) return
    navigator.clipboard?.writeText(phoneStr).then(() => {
      setCopiedPhone(phoneStr)
      setTimeout(() => setCopiedPhone(null), 2000)
    })
  }

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers
    const q = search.toLowerCase()
    return teachers.filter((t) => {
      const name = (t.name || '').toLowerCase()
      const role = ((isBn ? t.roleBn : t.roleEn) || '').toLowerCase()
      const dept = (t.department || '').toLowerCase()
      const subjects = (t.subjects || []).join(' ').toLowerCase()
      const phone = (t.phone || '').toLowerCase()
      return (
        name.includes(q) ||
        role.includes(q) ||
        dept.includes(q) ||
        subjects.includes(q) ||
        phone.includes(q)
      )
    })
  }, [teachers, search, isBn])

  return (
    <div className="card--premium rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Section Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: '0.1875rem',
              height: '0.875rem',
              background: 'var(--brand)',
              borderRadius: '0.125rem',
              flexShrink: 0,
            }}
          />
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকবৃন্দ' : 'Class & Subject Teachers'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section || '—'}) ·{' '}
              {isBn
                ? `মোট ${filteredTeachers.length} জন শিক্ষক`
                : `${filteredTeachers.length} teachers`}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isBn ? 'শিক্ষক বা বিষয় খুঁজুন...' : 'Search teacher or subject...'}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[var(--border)] bg-slate-50/80 dark:bg-white/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
      </div>

      {/* Teacher List */}
      {filteredTeachers.length === 0 ? (
        <div className="text-center py-12 px-4">
          <UserCheck className="w-7 h-7 mx-auto text-[var(--text-muted)] mb-2 opacity-35" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {search
              ? (isBn ? 'অনুসন্ধানের সাথে কোনো শিক্ষক মেলেনি' : 'No teachers found matching your search')
              : (isBn ? 'কোনো শিক্ষকের তথ্য পাওয়া যায়নি' : 'No teacher records found')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {filteredTeachers.map((teacher, idx) => (
            <div
              key={`${teacher.name}-${idx}`}
              className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
            >
              {/* Left: Avatar + Teacher Info */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  {teacher.photo ? (
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-100 dark:bg-white/[0.06]"
                    />
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        teacher.isClassTeacher
                          ? 'bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-[var(--text-primary)]'
                      }`}
                    >
                      {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                  )}

                  {teacher.isClassTeacher && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--brand)] text-white flex items-center justify-center border-2 border-[var(--surface)]"
                      title={isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
                    >
                      <Star size={8} className="fill-white" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {teacher.name}
                    </h4>

                    {teacher.isClassTeacher && (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)]">
                        {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span>{isBn ? teacher.roleBn : teacher.roleEn}</span>
                    {teacher.department && (
                      <>
                        <span className="text-[var(--text-muted)]">·</span>
                        <span>{teacher.department}</span>
                      </>
                    )}
                    {teacher.subjects && teacher.subjects.length > 0 && (
                      <>
                        <span className="text-[var(--text-muted)]">·</span>
                        <span className="text-[var(--text-primary)] font-medium">
                          {teacher.subjects.join(', ')}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[0.6875rem] text-[var(--text-muted)] mt-1">
                    {teacher.phone ? (
                      <a
                        href={`tel:${teacher.phone}`}
                        className="hover:text-[var(--text-primary)] transition-colors no-underline tabular-nums text-[var(--text-secondary)]"
                      >
                        {teacher.phone}
                      </a>
                    ) : (
                      <span>{isBn ? 'ফোন নম্বর নেই' : 'No phone listed'}</span>
                    )}

                    {teacher.email && (
                      <>
                        <span>·</span>
                        <a
                          href={`mailto:${teacher.email}`}
                          className="hover:text-[var(--text-primary)] transition-colors truncate max-w-[220px] no-underline text-[var(--text-secondary)]"
                        >
                          {teacher.email}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Direct Contact Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {teacher.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(teacher.phone)}
                    className="h-8 w-8 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                    title={isBn ? 'ফোন নম্বর কপি করুন' : 'Copy phone number'}
                  >
                    {copiedPhone === teacher.phone ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}

                {teacher.email && (
                  <a
                    href={`mailto:${teacher.email}`}
                    className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-medium transition-colors no-underline"
                    title={isBn ? 'ইমেইল পাঠান' : 'Send Email'}
                  >
                    <Mail size={13} />
                    <span>{isBn ? 'ইমেইল' : 'Email'}</span>
                  </a>
                )}

                {teacher.phone ? (
                  <a
                    href={`tel:${teacher.phone}`}
                    className="h-8 inline-flex items-center gap-1.5 px-3.5 rounded-lg bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold transition-opacity shadow-xs no-underline"
                    title={isBn ? 'সরাসরি কল করুন' : 'Direct Call'}
                  >
                    <Phone size={13} />
                    <span>{isBn ? 'কল করুন' : 'Call'}</span>
                  </a>
                ) : (
                  <span className="text-[0.6875rem] text-[var(--text-muted)] px-1">
                    {isBn ? 'যোগাযোগ উপলব্ধ নয়' : 'Unavailable'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
