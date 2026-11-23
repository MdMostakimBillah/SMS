import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  Printer,
  BookOpen,
  User,
  Coffee,
} from 'lucide-react'
import type { StudentProfile, StudentDayRoutine } from '../types'
import { useClassStore } from '@/store/classStore'
import { printStudentRoutine } from '../utils/routinePrint'

interface RoutineTabProps {
  student: StudentProfile
  routine: StudentDayRoutine[]
  isBn: boolean
}

export const RoutineTab = React.memo(function RoutineTab({
  student,
  routine,
  isBn,
}: RoutineTabProps) {
  const institution = useClassStore((s) => s.institution)

  // Find index of today or default to 0
  const todayIdx = routine.findIndex((d) => d.isToday)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIdx >= 0 ? todayIdx : 0)

  const activeDay = routine[selectedDayIdx] || routine[0]

  const handlePrint = () => {
    printStudentRoutine(student, routine, institution, isBn)
  }

  return (
    <div className="space-y-4">
      {/* Top Banner & Print Action */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar size={18} className="text-[var(--brand)]" />
            <span>{isBn ? 'সাপ্তাহিক ক্লাস রুটিন ও সময়সূচি' : 'Weekly Class Routine & Schedule'}</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {isBn ? 'শ্রেণি:' : 'Class:'} <span className="font-semibold text-[var(--text-primary)]">{student.class}</span> |{' '}
            {isBn ? 'শাখা:' : 'Section:'} <span className="font-semibold text-[var(--text-primary)]">{student.section || 'A'}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--brand)] text-xs font-medium text-[var(--text-primary)] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Printer size={15} className="text-[var(--brand)]" />
          <span>{isBn ? 'রুটিন প্রিন্ট করুন' : 'Print Timetable'}</span>
        </button>
      </div>

      {/* Weekday Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {routine.map((day, idx) => {
          const isSelected = selectedDayIdx === idx
          return (
            <button
              key={day.dayNameEn}
              type="button"
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex-1 min-w-[6.25rem] py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-xs font-semibold'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <div className="text-xs">{isBn ? day.dayNameBn : day.dayNameEn}</div>
              <div className="text-[0.625rem] mt-0.5 opacity-90">
                {day.isWeekend
                  ? isBn ? 'ছুটি' : 'Holiday'
                  : `${day.periods.length} ${isBn ? 'ক্লাস' : 'classes'}`}
              </div>
              {day.isToday && (
                <span
                  className={`inline-block mt-1 text-[0.5625rem] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--brandLight)] text-[var(--brand)]'
                  }`}
                >
                  {isBn ? 'আজ' : 'Today'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Routine Detail Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[var(--brand)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {isBn ? `${activeDay?.dayNameBn}-এর ক্লাসসমূহ` : `Classes for ${activeDay?.dayNameEn}`}
            </h3>
          </div>
          {activeDay?.isWeekend ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekly Holiday'}
            </span>
          ) : (
            <span className="text-xs text-[var(--text-secondary)]">
              {activeDay?.periods.length || 0} {isBn ? 'টি ক্লাস নির্ধারিত' : 'Periods Scheduled'}
            </span>
          )}
        </div>

        {activeDay?.isWeekend ? (
          <div className="py-12 text-center text-[var(--text-secondary)]">
            <Coffee size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              {isBn ? 'আজ সাপ্তাহিক ছুটি' : 'Weekly Holiday'}
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              {isBn
                ? 'এই দিনে প্রাতিষ্ঠানিক পাঠদান কার্যক্রম বন্ধ রয়েছে।'
                : 'No classes are scheduled on this day. Have a restful weekend!'}
            </p>
          </div>
        ) : activeDay?.periods && activeDay.periods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDay.periods.map((period) => (
              <div
                key={period.periodIndex}
                className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-start gap-3 transition-colors hover:border-[var(--brand)]"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--brandLight)] text-[var(--brand)] flex flex-col items-center justify-center font-bold shrink-0">
                  <span className="text-[0.625rem] leading-none uppercase">P</span>
                  <span className="text-sm leading-none mt-0.5">{period.periodIndex}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {isBn ? period.subjectNameBn : period.subjectName}
                    </h4>
                    <span className="text-[0.6875rem] font-mono font-medium text-[var(--brand)] bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)] shrink-0">
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[0.6875rem] text-[var(--text-secondary)] mt-1.5">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-[var(--text-muted)]" />
                      <span className="truncate">{period.teacherName}</span>
                    </span>
                    {period.room && (
                      <span className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--text-muted)] border border-[var(--border)]">
                        {period.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-[var(--text-muted)] text-xs">
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p>{isBn ? 'এই দিনে কোনো রুটিন পাওয়া যায়নি' : 'No classes published for this day yet'}</p>
          </div>
        )}
      </div>
    </div>
  )
})
