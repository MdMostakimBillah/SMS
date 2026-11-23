import React, { useState, useMemo } from 'react'
import {
  Phone,
  Mail,
  UserCheck,
  Search,
  BookOpen,
  Copy,
  Check,
  Star,
  Building,
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
    navigator.clipboard.writeText(phoneStr).then(() => {
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
    <div className="space-y-4">
      {/* Section Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকবৃন্দ' : 'Class & Subject Teachers'}
            </h3>
            <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section})
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {isBn
              ? `মোট ${filteredTeachers.length} জন শিক্ষক তালিকাভুক্ত`
              : `${filteredTeachers.length} teachers listed for this class`}
          </p>
        </div>

        {/* Real-time search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isBn ? 'শিক্ষক বা বিষয় খুঁজুন...' : 'Search teacher or subject...'}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
      </div>

      {/* Teacher List in Full-Width Notification/Message Card Style */}
      {filteredTeachers.length === 0 ? (
        <div className="text-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs">
          <UserCheck className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
          <p className="text-xs text-[var(--text-secondary)]">
            {search
              ? (isBn ? 'অনুসন্ধানের সাথে কোনো শিক্ষক মেলেনি' : 'No teachers found matching your search')
              : (isBn ? 'কোনো শিক্ষকের তথ্য পাওয়া যায়নি' : 'No teacher records found')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeachers.map((teacher, idx) => (
            <div
              key={idx}
              className={`w-full bg-[var(--surface)] p-3.5 sm:p-4 rounded-xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                teacher.isClassTeacher
                  ? 'border-[var(--brand)]/80 bg-[var(--bg-secondary)]/30 hover:border-[var(--brand)]'
                  : 'border-[var(--border)] hover:border-[var(--brand)]/60 hover:bg-[var(--bg-secondary)]/30'
              }`}
            >
              {/* Left & Middle: Avatar + Teacher Info */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Photo / Avatar */}
                <div className="relative shrink-0">
                  {teacher.photo ? (
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-11 h-11 rounded-full object-cover border border-[var(--border)] shadow-2xs"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-[var(--border)] shadow-2xs"
                      style={{
                        background: teacher.isClassTeacher
                          ? 'color-mix(in srgb, var(--brand) 15%, transparent)'
                          : 'var(--bg-secondary)',
                        color: teacher.isClassTeacher ? 'var(--brand)' : 'var(--text-primary)',
                      }}
                    >
                      {teacher.name ? teacher.name.charAt(0) : 'T'}
                    </div>
                  )}

                  {teacher.isClassTeacher && (
                    <span
                      className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shadow-xs"
                      title={isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
                    >
                      <Star size={10} className="fill-white" />
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="min-w-0 flex-1">
                  {/* Name and Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-[0.9375rem] font-bold text-[var(--text-primary)] truncate">
                      {teacher.name}
                    </h4>

                    {teacher.isClassTeacher && (
                      <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold px-2 py-0.5 rounded-full bg-[var(--brand)] text-white shadow-2xs">
                        <Star size={10} className="fill-white" />
                        {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
                      </span>
                    )}

                    <span className="inline-flex items-center text-[0.625rem] font-semibold px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {isBn ? teacher.roleBn : teacher.roleEn}
                    </span>

                    {teacher.department && (
                      <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]">
                        <Building size={10} />
                        {teacher.department}
                      </span>
                    )}
                  </div>

                  {/* Subjects Taught */}
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-[var(--text-muted)] mb-1.5">
                      <BookOpen size={12} className="text-[var(--text-muted)] shrink-0" />
                      <span className="font-medium text-[var(--text-secondary)]">
                        {isBn ? 'পাঠদান বিষয়:' : 'Subjects:'}
                      </span>
                      {teacher.subjects.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-1.5 py-0.2 rounded text-[0.625rem] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Preview Meta */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--text-secondary)]">
                    {teacher.phone ? (
                      <a
                        href={`tel:${teacher.phone}`}
                        className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors"
                      >
                        <Phone size={12} className="text-[var(--text-muted)]" />
                        <span>{teacher.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[var(--text-muted)] text-[0.6875rem]">
                        {isBn ? 'ফোন নম্বর নেই' : 'No phone listed'}
                      </span>
                    )}

                    {teacher.email && (
                      <>
                        <span className="text-[var(--text-muted)]">·</span>
                        <a
                          href={`mailto:${teacher.email}`}
                          className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors truncate max-w-[200px]"
                        >
                          <Mail size={12} className="text-[var(--text-muted)]" />
                          <span className="truncate">{teacher.email}</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Direct Interactive Contact Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]/70 shrink-0">
                {teacher.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(teacher.phone)}
                    className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                    title={isBn ? 'ফোন নম্বর কপি করুন' : 'Copy phone number'}
                  >
                    {copiedPhone === teacher.phone ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}

                {teacher.email && (
                  <a
                    href={`mailto:${teacher.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] text-xs font-semibold transition-colors no-underline shadow-2xs"
                    title={isBn ? 'ইমেইল পাঠান' : 'Send Email'}
                  >
                    <Mail size={13} className="text-[var(--brand)]" />
                    <span>{isBn ? 'ইমেইল' : 'Email'}</span>
                  </a>
                )}

                {teacher.phone ? (
                  <a
                    href={`tel:${teacher.phone}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--brand)] text-white hover:opacity-90 text-xs font-semibold transition-opacity no-underline shadow-xs"
                    title={isBn ? 'সরাসরি কল করুন' : 'Direct Call'}
                  >
                    <Phone size={13} />
                    <span>{isBn ? 'কল করুন' : 'Call'}</span>
                  </a>
                ) : (
                  <span className="text-[0.6875rem] text-[var(--text-muted)] italic px-2">
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
