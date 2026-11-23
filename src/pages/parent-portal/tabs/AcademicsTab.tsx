import React, { useState, useMemo } from 'react'
import {
  Award,
  Calendar,
  Printer,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  MapPin,
} from 'lucide-react'
import type { PortalChild, ExamResultItem } from '../types'
import { useClassStore } from '@/store/classStore'
import { useExamStore } from '@/store/examStore'
import { useTeacherStore } from '@/store/teacherStore'
import { printMarksheet } from './academics/marksheetPrint'

interface AcademicsTabProps {
  child: PortalChild
  results: ExamResultItem[]
  isBn: boolean
}

export const AcademicsTab = React.memo(function AcademicsTab({
  child,
  results,
  isBn,
}: AcademicsTabProps) {
  const [selectedExam, setSelectedExam] = useState('')
  const institution = useClassStore((s) => s.institution)
  const examConfigs = useExamStore((s) => s.examConfigs)

  const totalFull = results.reduce((a, b) => a + b.fullMarks, 0)
  const totalObtained = results.reduce((a, b) => a + b.obtained, 0)
  const avgPct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '0'
  const isAllPassed = results.length > 0 && results.every((r) => r.status === 'passed')
  const avgGpa =
    results.length > 0
      ? (results.reduce((acc, r) => acc + (r.point || 0), 0) / results.length).toFixed(2)
      : '—'

  const routines = useExamStore((s) => s.routines) || []
  const subjects = useTeacherStore((s) => s.subjects) || []

  const childRoutines = useMemo(() => {
    const cClass = (child.class || '').toLowerCase().trim()
    return routines.filter((r) => {
      const rClass = (r.classId || '').toLowerCase().trim()
      return !r.classId || rClass === cClass || rClass === `class ${cClass}` || cClass === `class ${rClass}`
    }).slice(0, 3)
  }, [routines, child.class])

  const handlePrintMarksheet = () => {
    if (results.length === 0) return
    printMarksheet(child, results, institution, isBn)
  }

  const kpiCards = [
    {
      icon: Award,
      value: avgGpa,
      label: isBn ? 'সর্বমোট গড় জিপিএ' : 'Cumulative GPA',
    },
    {
      icon: CheckCircle2,
      value: totalFull > 0 ? `${totalObtained} / ${totalFull}` : '—',
      label: isBn ? `প্রাপ্ত মোট নম্বর (${avgPct}%)` : `Total Obtained (${avgPct}%)`,
    },
    {
      icon: GraduationCap,
      value: child.roll ? `#${child.roll}` : '—',
      label: isBn ? 'শ্রেণি রোল নম্বর' : 'Class Roll',
    },
    {
      icon: TrendingUp,
      value:
        results.length === 0
          ? '—'
          : isAllPassed
          ? isBn
            ? 'উত্তীর্ণ'
            : 'PASSED'
          : isBn
          ? 'অনুত্তীর্ণ'
          : 'FAILED',
      label: isBn ? 'ফলাফল স্থিতি' : 'Result Status',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Top Selector & Print Header */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex-wrap shadow-xs">
        <div className="flex items-center gap-3">
          <Award size={20} className="text-[var(--brand)]" />
          <div>
            <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'একাডেমিক ফলাফল ও মূল্যায়ন' : 'Academic Results & Marksheet'}
            </h3>
            <p className="text-[0.6875rem] text-[var(--text-secondary)]">
              {isBn ? 'শিক্ষার্থীর বিষয়ভিত্তিক গ্রেড ও পরীক্ষার ফলাফল' : 'Child subject performance, GPA, and grades'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
          >
            {examConfigs.length > 0 ? (
              examConfigs.map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {isBn ? cfg.nameBn || cfg.name : cfg.name}
                </option>
              ))
            ) : (
              <option value="">{isBn ? 'সকল মূল্যায়ন' : 'All Evaluations'}</option>
            )}
          </select>

          <button
            type="button"
            onClick={handlePrintMarksheet}
            disabled={results.length === 0}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.75rem] font-semibold border-none ${
              results.length > 0
                ? 'bg-[var(--brand)] text-white shadow-xs hover:opacity-90 cursor-pointer'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed opacity-60'
            }`}
          >
            <Printer size={13} />
            <span className="truncate">{isBn ? 'মার্কশিট ডাউনলোড' : 'Download Marksheet'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scorecard Banner - Dashboard Style Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3 p-[0.875rem_1rem] bg-[var(--surface)] border border-[var(--border)] rounded-[0.625rem] shadow-xs"
          >
            <div className="w-9 h-9 rounded-md bg-[var(--bg-secondary)] text-[var(--brand)] flex items-center justify-center shrink-0">
              <card.icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[1.125rem] font-bold leading-tight text-[var(--text-primary)]">
                {card.value}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subject-Wise Marksheet Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'বিষয়ভিত্তিক নম্বর বিভাজন' : 'Subject-wise Detailed Marks'}
          </h4>
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-mono">
            {results.length} {isBn ? 'টি বিষয়' : 'Subjects'}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            <Award size={32} className="mx-auto text-[var(--text-muted)] mb-2.5 opacity-40" />
            <p className="font-semibold text-[var(--text-primary)]">
              {isBn ? 'কোনো পরীক্ষার ফলাফল পাওয়া যায়নি' : 'No Exam Results Recorded'}
            </p>
            <p className="mt-1">
              {isBn
                ? 'এই শিক্ষার্থীর জন্য এখনও কোনো পরীক্ষার ফলাফল প্রকাশ করা হয়নি।'
                : 'No exam results or marks have been published for this student yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.8125rem] border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[0.6875rem] text-[var(--text-secondary)] font-semibold uppercase bg-[var(--bg-secondary)]/50">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">{isBn ? 'বিষয়' : 'Subject'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'পূর্ণ নম্বর' : 'Full Marks'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'লিখিত' : 'Written'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'এমসিকিউ' : 'MCQ'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'ব্যবহারিক' : 'Practical'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'মোট নম্বর' : 'Total'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'লেটার গ্রেড' : 'Grade'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'গ্রেড পয়েন্ট' : 'GPA'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {results.map((r, i) => (
                  <tr key={r.code || `${r.subject}-${i}`} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                    <td className="py-2.5 px-3 text-[var(--text-muted)] text-[0.75rem]">{i + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                      {isBn ? r.subjectBn : r.subject}
                      {r.code && (
                        <span className="text-[0.6875rem] text-[var(--text-muted)] block font-mono font-normal">
                          Code: {r.code}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{r.fullMarks}</td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{r.written}</td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{r.mcq}</td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">{r.practical}</td>
                    <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{r.obtained}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[0.6875rem] font-bold border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{r.point.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Exam Schedule Banner */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-3">
          <Calendar size={16} className="text-[var(--brand)]" />
          <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'আসন্ন পরীক্ষার রুটিন ও সময়সূচি' : 'Upcoming Exam Routine & Schedule'}
          </h4>
        </div>

        {childRoutines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {childRoutines.map((rt) => {
              const subj = subjects.find((s) => s.id === rt.subjectId)
              return (
                <div key={rt.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
                    {rt.date} · {rt.startTime} - {rt.endTime}
                  </div>
                  <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mt-0.5">
                    {isBn ? subj?.nameBn || subj?.name || rt.subjectId : subj?.name || rt.subjectId}
                  </div>
                  {rt.roomNo && (
                    <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      <MapPin size={11} className="text-[var(--text-muted)]" /> Room: {rt.roomNo}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-[var(--text-muted)]">
            {isBn
              ? 'এই শ্রেণির জন্য কোনো পরীক্ষার সময়সূচি পাওয়া যায়নি।'
              : 'No upcoming exam schedule found for this class.'}
          </div>
        )}
      </div>
    </div>
  )
})
