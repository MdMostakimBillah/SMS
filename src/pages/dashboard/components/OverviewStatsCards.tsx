import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNavPath } from '@/hooks/useNavPath'
import {
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  MessageSquare,
  Cake,
  Gift,
} from 'lucide-react'
import { BirthdayListModal } from '../modals/BirthdayListModal'
import type {
  TeacherAttendanceTodaySummary,
  MessageStatSummary,
  BirthdayPersonItem,
} from '../types'

interface Props {
  isBn: boolean
  isMobile: boolean
  isTablet: boolean
  section?: 'teachers' | 'engagement' | 'all'
  totalTeachers: number
  maleTeachers: number
  femaleTeachers: number
  teacherAttendanceToday: TeacherAttendanceTodaySummary
  messageStats: MessageStatSummary
  todayStudentBirthdays: BirthdayPersonItem[]
  todayTeacherBirthdays: BirthdayPersonItem[]
  canReadTeachers: boolean
  canReadAttendance: boolean
  canReadMessages: boolean
  canReadStudents: boolean
  col4: string
  col3: string
  gap: string
}

interface StatCardConfig {
  key: string
  labelBn: string
  labelEn: string
  value: string | number
  icon: React.ReactNode
  color: string
  onClick: () => void
}

export const OverviewStatsCards: React.FC<Props> = ({
  isBn,
  isMobile,
  isTablet,
  section = 'all',
  totalTeachers,
  maleTeachers,
  femaleTeachers,
  teacherAttendanceToday,
  messageStats,
  todayStudentBirthdays,
  todayTeacherBirthdays,
  canReadTeachers,
  canReadAttendance,
  canReadMessages,
  canReadStudents,
  col4,
  col3,
  gap,
}) => {
  const navigate = useNavigate()
  const nav = useNavPath()
  const [birthdayModal, setBirthdayModal] = useState<{
    title: string
    list: BirthdayPersonItem[]
    listPath: string
  } | null>(null)

  const teacherCards: StatCardConfig[] =
    section === 'engagement'
      ? []
      : [
          ...(canReadTeachers
            ? [
                {
                  key: 'total-teachers',
                  labelBn: 'মোট শিক্ষক',
                  labelEn: 'Total Teachers',
                  value: totalTeachers,
                  icon: <GraduationCap size={14} />,
                  color: 'var(--brand)',
                  onClick: () => navigate(nav('/teachers')),
                },
                {
                  key: 'mf-teachers',
                  labelBn: 'শিক্ষক (পুরুষ/মহিলা)',
                  labelEn: 'M/F Teachers',
                  value: `${maleTeachers}/${femaleTeachers}`,
                  icon: <Users size={14} />,
                  color: 'var(--purple)',
                  onClick: () => navigate(nav('/teachers')),
                },
              ]
            : []),
          ...(canReadAttendance || canReadTeachers
            ? [
                {
                  key: 'present-teachers-today',
                  labelBn: 'আজ উপস্থিত শিক্ষক',
                  labelEn: 'Present Teachers Today',
                  value: teacherAttendanceToday.present,
                  icon: <UserCheck size={14} />,
                  color: 'var(--green)',
                  onClick: () => navigate(nav('/attendance')),
                },
                {
                  key: 'absent-teachers-today',
                  labelBn: 'আজ অনুপস্থিত শিক্ষক',
                  labelEn: 'Absent Teachers Today',
                  value: teacherAttendanceToday.absent,
                  icon: <UserX size={14} />,
                  color: 'var(--red)',
                  onClick: () => navigate(nav('/attendance')),
                },
              ]
            : []),
        ]

  const engagementCards: StatCardConfig[] =
    section === 'teachers'
      ? []
      : [
          ...(canReadMessages
            ? [
                {
                  key: 'message-quantity',
                  labelBn: 'মোট বার্তা',
                  labelEn: 'Messages Quantity',
                  value: messageStats.totalMessages,
                  icon: <MessageSquare size={14} />,
                  color: 'var(--teal)',
                  onClick: () => navigate(nav('/messages')),
                },
              ]
            : []),
          ...(canReadStudents
            ? [
                {
                  key: 'student-birthdays-today',
                  labelBn: 'আজ ছাত্রদের জন্মদিন',
                  labelEn: 'Student Birthdays Today',
                  value: todayStudentBirthdays.length,
                  icon: <Cake size={14} />,
                  color: 'var(--amber)',
                  onClick: () => {
                    if (todayStudentBirthdays.length > 0) {
                      setBirthdayModal({
                        title: isBn ? 'আজ যেসব শিক্ষার্থীর জন্মদিন' : "Today's Student Birthdays",
                        list: todayStudentBirthdays,
                        listPath: '/students/all',
                      })
                    } else {
                      navigate(nav('/students/all'))
                    }
                  },
                },
              ]
            : []),
          ...(canReadTeachers
            ? [
                {
                  key: 'teacher-birthdays-today',
                  labelBn: 'আজ শিক্ষকদের জন্মদিন',
                  labelEn: 'Teacher Birthdays Today',
                  value: todayTeacherBirthdays.length,
                  icon: <Gift size={14} />,
                  color: 'var(--purple)',
                  onClick: () => {
                    if (todayTeacherBirthdays.length > 0) {
                      setBirthdayModal({
                        title: isBn ? 'আজ যেসব শিক্ষকের জন্মদিন' : "Today's Teacher Birthdays",
                        list: todayTeacherBirthdays,
                        listPath: '/teachers',
                      })
                    } else {
                      navigate(nav('/teachers'))
                    }
                  },
                },
              ]
            : []),
        ]

  const renderCard = (s: StatCardConfig) => (
    <div
      key={s.key}
      onClick={s.onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.625rem',
        boxShadow: 'var(--shadow-xs)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
      }}
    >
      <div
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '0.375rem',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: s.color,
          flexShrink: 0,
        }}
      >
        {s.icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {s.value}
        </div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {isBn ? s.labelBn : s.labelEn}
        </div>
      </div>
    </div>
  )

  if (teacherCards.length === 0 && engagementCards.length === 0) return null

  const teacherCols =
    teacherCards.length < 4 && !isMobile && !isTablet
      ? `repeat(${teacherCards.length}, 1fr)`
      : col4
  const engagementCols =
    engagementCards.length < 3 && !isMobile && !isTablet
      ? `repeat(${engagementCards.length}, 1fr)`
      : col3

  return (
    <>
      {teacherCards.length > 0 && (
        <div
          className="gsap-fade-up"
          style={{ display: 'grid', gridTemplateColumns: teacherCols, gap }}
        >
          {teacherCards.map(renderCard)}
        </div>
      )}

      {engagementCards.length > 0 && (
        <div
          className="gsap-fade-up"
          style={{ display: 'grid', gridTemplateColumns: engagementCols, gap }}
        >
          {engagementCards.map(renderCard)}
        </div>
      )}

      {birthdayModal && (
        <BirthdayListModal
          isBn={isBn}
          title={birthdayModal.title}
          list={birthdayModal.list}
          onClose={() => setBirthdayModal(null)}
          onViewDirectory={() => {
            const target = birthdayModal.listPath
            setBirthdayModal(null)
            navigate(nav(target))
          }}
          onSendWishes={() => {
            setBirthdayModal(null)
            navigate(nav('/messages'))
          }}
        />
      )}
    </>
  )
}
