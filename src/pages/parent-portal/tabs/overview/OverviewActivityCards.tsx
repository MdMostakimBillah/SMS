import React, { useMemo, useState } from 'react'
import {
  Clock,
  LogOut,
  Home,
  Phone,
  Mail,
} from 'lucide-react'
import type { PortalChild, HomeworkItem, PortalTab } from '../../types'
import { useNoticeStore, type Notice } from '@/store/noticeStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { getTodayPunchInfo } from '../../utils/dataMappers'
import { NoticeDetailModal } from '../communication/NoticeDetailModal'

interface OverviewActivityCardsProps {
  child: PortalChild
  homeworkList: HomeworkItem[]
  onNavigateTab: (tab: PortalTab) => void
  isBn: boolean
}

export const OverviewActivityCards = React.memo(function OverviewActivityCards({
  child,
  homeworkList,
  onNavigateTab,
  isBn,
}: OverviewActivityCardsProps) {
  const notices = useNoticeStore((s) => s.notices)
  const attendance = useAttendanceStore((s) => s.attendance)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  const punch = useMemo(() => {
    void attendance
    return getTodayPunchInfo(child.id)
  }, [child.id, attendance])

  const parentNotices = useMemo(() => {
    return notices
      .filter((n) => n && n.isActive !== false && n.target !== 'teachers')
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
      })
      .slice(0, 3)
  }, [notices])

  const allNoticesCount = useMemo(() => {
    return notices.filter((n) => n && n.isActive !== false && n.target !== 'teachers').length
  }, [notices])

  const previewHomework = useMemo(() => {
    return [...homeworkList]
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        return (a.dueDate || '').localeCompare(b.dueDate || '')
      })
      .slice(0, 3)
  }, [homeworkList])

  const sectionHead = (color: string) => (
    <div
      style={{
        width: '0.1875rem',
        height: '0.875rem',
        background: color,
        borderRadius: '0.125rem',
        flexShrink: 0,
      }}
    />
  )

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '1rem',
    boxShadow: 'var(--shadow-xs)',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Middle Row: Today & Class Teacher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Left: Today's Activity */}
        <div className="card--premium" style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--green)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'আজকের কার্যক্রম' : "Today's Activity"}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 500,
                color: punch.isPresent ? 'var(--green)' : 'var(--text-secondary)',
                background: punch.isPresent ? 'var(--green-light)' : 'var(--bg-secondary)',
                padding: '0.1875rem 0.5rem',
                borderRadius: '0.375rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  width: '0.375rem',
                  height: '0.375rem',
                  borderRadius: '50%',
                  background: punch.isPresent ? 'var(--green)' : 'var(--text-muted)',
                }}
              />
              {punch.isPresent
                ? isBn ? 'আজ উপস্থিত' : 'Present today'
                : isBn ? 'সক্রিয় স্কুল দিবস' : 'Active school day'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* In-Time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: '1.875rem',
                    height: '1.875rem',
                    borderRadius: '0.375rem',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand)',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isBn ? 'প্রবেশের সময়' : 'In-time'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    {punch.isPresent
                      ? isBn ? 'উপস্থিত লিপিবদ্ধ' : 'Marked present'
                      : isBn ? 'লিপিবদ্ধ নয়' : 'Not logged yet'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {punch.inTime}
              </div>
            </div>

            {/* Exit Time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: '1.875rem',
                    height: '1.875rem',
                    borderRadius: '0.375rem',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--purple)',
                    flexShrink: 0,
                  }}
                >
                  <LogOut size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isBn ? 'ছুটির সময়' : 'Exit time'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    {punch.outTime !== '—'
                      ? isBn ? 'প্রস্থান সম্পন্ন' : 'Exit logged'
                      : isBn ? 'নিয়মিত কার্যক্রম' : 'Scheduled'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {punch.outTime}
              </div>
            </div>

            {/* Class & Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div
                  style={{
                    width: '1.875rem',
                    height: '1.875rem',
                    borderRadius: '0.375rem',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--teal)',
                    flexShrink: 0,
                  }}
                >
                  <Home size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isBn ? 'শ্রেণি ও শাখা' : 'Class & section'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    {isBn ? 'রোল' : 'Roll'} {child.roll || '—'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {child.class} ({child.section || (isBn ? 'সাধারণ' : 'General')})
              </div>
            </div>
          </div>
        </div>

        {/* Right: Class Teacher */}
        <div className="card--premium" style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--brand)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('communication')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.6875rem',
                color: 'var(--brand)',
                cursor: 'pointer',
                fontWeight: 500,
                padding: 0,
              }}
            >
              {isBn ? 'শিক্ষক তালিকা →' : 'Directory →'}
            </button>
          </div>

          {child.classTeacherName ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0.25rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    background: 'var(--brand-light)',
                    color: 'var(--brand)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {child.classTeacherName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {child.classTeacherName}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                    {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section || (isBn ? 'সাধারণ' : 'General')})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {child.classTeacherPhone ? (
                  <a
                    href={`tel:${child.classTeacherPhone}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover, var(--border))')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  >
                    <Phone size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    <span style={{ fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {child.classTeacherPhone}
                    </span>
                  </a>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Phone size={13} style={{ flexShrink: 0 }} />
                    <span>{isBn ? 'ফোন নম্বর নেই' : 'No phone number'}</span>
                  </div>
                )}

                {child.classTeacherEmail ? (
                  <a
                    href={`mailto:${child.classTeacherEmail}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover, var(--border))')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  >
                    <Mail size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {child.classTeacherEmail}
                    </span>
                  </a>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Mail size={13} style={{ flexShrink: 0 }} />
                    <span>{isBn ? 'ইমেইল ঠিকানা নেই' : 'No email address'}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', margin: 'auto 0' }}>
              {isBn ? 'শ্রেণি শিক্ষক নির্ধারিত হয়নি' : 'No class teacher assigned yet'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Homework & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Left: Homework */}
        <div className="card--premium" style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--teal)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Homework & Tasks'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('homework')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.6875rem',
                color: 'var(--brand)',
                cursor: 'pointer',
                fontWeight: 500,
                padding: 0,
              }}
            >
              {isBn ? 'সব →' : 'All →'}
            </button>
          </div>

          {previewHomework.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.75rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {isBn ? 'কোনো বকেয়া কাজ নেই' : 'Nothing due'}
              </div>
              <div>{isBn ? 'শিক্ষকদের নতুন অ্যাসাইনমেন্ট এখানে প্রদর্শিত হবে।' : 'New assignments from teachers will appear here.'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {previewHomework.map((hw, i) => {
                const desc = isBn ? hw.descriptionBn || hw.description : hw.description
                return (
                  <div
                    key={hw.id}
                    onClick={() => onNavigateTab('homework')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.625rem',
                      padding: '0.5rem 0.375rem',
                      borderBottom: i < previewHomework.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      borderRadius: '0.375rem',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--brand)' }}>
                          {isBn ? hw.subjectBn : hw.subject}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>·</span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isBn ? hw.titleBn : hw.title}
                        </span>
                      </div>
                      {desc && (
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.125rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {desc}
                        </div>
                      )}
                      {hw.dueDate && (
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          {isBn ? 'শেষ তারিখ:' : 'Due:'} {hw.dueDate}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 500,
                        flexShrink: 0,
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        color:
                          hw.status === 'evaluated'
                            ? 'var(--green)'
                            : hw.status === 'submitted'
                            ? 'var(--brand)'
                            : 'var(--amber)',
                        background:
                          hw.status === 'evaluated'
                            ? 'var(--green-light)'
                            : hw.status === 'submitted'
                            ? 'var(--brand-light)'
                            : 'var(--amber-light)',
                      }}
                    >
                      {hw.status === 'evaluated'
                        ? isBn
                          ? `মূল্যায়িত (${hw.marks ?? 0}/${hw.maxMarks || 100})`
                          : `Graded (${hw.marks ?? 0}/${hw.maxMarks || 100})`
                        : hw.status === 'submitted'
                        ? isBn ? 'জমা দেওয়া' : 'Submitted'
                        : isBn ? 'বাকি' : 'Pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Notices */}
        <div className="card--premium" style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {sectionHead('var(--purple)')}
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'স্কুল নোটিশ' : 'School Notices'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('communication')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.6875rem',
                color: 'var(--brand)',
                cursor: 'pointer',
                fontWeight: 500,
                padding: 0,
              }}
            >
              {isBn
                ? allNoticesCount > 0
                  ? `সব (${allNoticesCount}) →`
                  : 'সব →'
                : allNoticesCount > 0
                ? `All (${allNoticesCount}) →`
                : 'All →'}
            </button>
          </div>

          {parentNotices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {parentNotices.map((n, i) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.625rem',
                    padding: '0.5rem 0.375rem',
                    borderBottom: i < parentNotices.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    borderRadius: '0.375rem',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: 'var(--brand)',
                        background: 'var(--brand-light)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        flexShrink: 0,
                      }}
                    >
                      {n.category || (isBn ? 'সাধারণ' : 'General')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isBn ? n.titleBn || n.title : n.title}
                    </span>
                  </div>
                  {n.publishedAt && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-secondary)',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {n.publishedAt.split('T')[0]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.75rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {isBn ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No new notices'}
            </div>
          )}
        </div>
      </div>

      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
          isBn={isBn}
        />
      )}
    </div>
  )
})
