import React, { useState, useMemo } from 'react'
import {
  Award,
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
import { normalizeClassString } from '@/lib/assignmentUtils'
import { GRADE_SCALE, getGradeColor } from '@/lib/grades'
import { selectCls } from '@/lib/styles'
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
  const routines = useExamStore((s) => s.routines)
  const subjects = useTeacherStore((s) => s.subjects) || []

  const filteredResults = useMemo(() => {
    if (!selectedExam) return results
    return results.filter((r) => r.examId === selectedExam)
  }, [results, selectedExam])

  const selectedExamConfig = useMemo(
    () => examConfigs.find((e) => e.id === selectedExam),
    [examConfigs, selectedExam]
  )

  const totalFull = filteredResults.reduce((a, b) => a + b.fullMarks, 0)
  const totalObtained = filteredResults.reduce((a, b) => a + b.obtained, 0)
  const avgPct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '0.0'
  const isAllPassed = filteredResults.length > 0 && filteredResults.every((r) => r.status === 'passed')
  const avgGpa =
    filteredResults.length === 0
      ? '—'
      : isAllPassed
      ? (filteredResults.reduce((acc, r) => acc + (r.point || 0), 0) / filteredResults.length).toFixed(2)
      : '0.00'

  const childRoutines = useMemo(() => {
    const cClassNorm = normalizeClassString(child.class)
    const cClassRaw = (child.class || '').toLowerCase().trim()
    return (routines || [])
      .filter((r) => {
        if (selectedExam && r.examId !== selectedExam) return false
        if (!r.classId) return true
        const rClassNorm = normalizeClassString(r.classId)
        const rClassRaw = r.classId.toLowerCase().trim()
        return rClassRaw === cClassRaw || (cClassNorm !== '' && rClassNorm === cClassNorm)
      })
      .slice(0, 6)
  }, [routines, child.class, selectedExam])

  const handlePrintMarksheet = () => {
    if (filteredResults.length === 0) return
    const examTitle = selectedExamConfig
      ? isBn
        ? selectedExamConfig.nameBn || selectedExamConfig.name
        : selectedExamConfig.name
      : undefined
    printMarksheet(child, filteredResults, institution, isBn, examTitle)
  }

  const kpiCards = [
    {
      icon: Award,
      value: avgGpa,
      label: isBn ? 'সর্বমোট গড় জিপিএ' : 'Cumulative GPA',
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: CheckCircle2,
      value: totalFull > 0 ? `${totalObtained} / ${totalFull}` : '—',
      label: isBn ? `প্রাপ্ত মোট নম্বর (${avgPct}%)` : `Total Obtained (${avgPct}%)`,
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: GraduationCap,
      value: child.roll ? `#${child.roll}` : '—',
      label: isBn ? 'শ্রেণি রোল নম্বর' : 'Class Roll',
      iconCls: 'text-[var(--text-secondary)]',
    },
    {
      icon: TrendingUp,
      value:
        filteredResults.length === 0
          ? '—'
          : isAllPassed
          ? isBn
            ? 'উত্তীর্ণ'
            : 'PASSED'
          : isBn
          ? 'অনুত্তীর্ণ'
          : 'FAILED',
      label: isBn ? 'ফলাফল স্থিতি' : 'Result Status',
      valueCls:
        filteredResults.length === 0
          ? 'text-[var(--text-primary)]'
          : isAllPassed
          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
          : 'text-rose-600 dark:text-rose-400 font-semibold',
      iconCls: 'text-[var(--text-secondary)]',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Top Selector & Print Header */}
      <div className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex-wrap">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            {isBn ? 'একাডেমিক ফলাফল ও মূল্যায়ন' : 'Academic Results & Marksheet'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {isBn ? 'শিক্ষার্থীর বিষয়ভিত্তিক গ্রেড ও পরীক্ষার ফলাফল' : 'Child subject performance, GPA, and grades'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className={`${selectCls} h-9 flex-1 sm:flex-initial rounded-lg`}
          >
            <option value="">{isBn ? 'সকল মূল্যায়ন' : 'All Evaluations'}</option>
            {examConfigs.map((cfg) => (
              <option key={cfg.id} value={cfg.id}>
                {isBn ? cfg.nameBn || cfg.name : cfg.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handlePrintMarksheet}
            disabled={filteredResults.length === 0}
            className={`h-9 flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold border-none transition-opacity ${
              filteredResults.length > 0
                ? 'bg-[var(--brand)] hover:opacity-90 text-white cursor-pointer shadow-xs'
                : 'bg-slate-200 dark:bg-white/[0.06] text-[var(--text-muted)] cursor-not-allowed'
            }`}
          >
            <Printer size={14} />
            <span className="truncate">{isBn ? 'মার্কশিট ডাউনলোড' : 'Download Marksheet'}</span>
          </button>
        </div>
      </div>

      {/* Summary Scorecard Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="p-4 sm:p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                {card.label}
              </span>
              <card.icon size={15} className={`${card.iconCls} shrink-0`} />
            </div>
            <div className={`text-2xl font-semibold leading-none tabular-nums mt-2.5 ${card.valueCls || 'text-[var(--text-primary)]'}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Subject-Wise Marksheet Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {isBn ? 'বিষয়ভিত্তিক নম্বর বিভাজন' : 'Subject-wise Detailed Marks'}
          </h4>
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {filteredResults.length} {isBn ? 'টি বিষয়' : 'Subjects'}
          </span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-[var(--text-muted)]">
            <Award size={28} className="mx-auto text-[var(--text-muted)] mb-2 opacity-35" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {isBn ? 'কোনো পরীক্ষার ফলাফল পাওয়া যায়নি' : 'No Exam Results Recorded'}
            </p>
            <p className="mt-1 text-[var(--text-secondary)] max-w-sm mx-auto">
              {isBn
                ? 'এই শিক্ষার্থীর জন্য এখনও কোনো পরীক্ষার ফলাফল প্রকাশ করা হয়নি।'
                : 'No exam results or marks have been published for this student yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[0.6875rem] text-[var(--text-muted)] font-medium uppercase tracking-wide bg-slate-50/80 dark:bg-white/[0.025]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-3">{isBn ? 'বিষয়' : 'Subject'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'পূর্ণ নম্বর' : 'Full Marks'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'লিখিত' : 'Written'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'এমসিকিউ' : 'MCQ'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'ব্যবহারিক' : 'Practical'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'মোট নম্বর' : 'Total'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'লেটার গ্রেড' : 'Grade'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'গ্রেড পয়েন্ট' : 'GPA'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredResults.map((r, i) => {
                  const gradeColor = getGradeColor(r.grade)
                  return (
                    <tr key={r.code || `${r.subject}-${i}`} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-[var(--text-muted)] tabular-nums">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[var(--text-primary)]">
                          {isBn ? r.subjectBn : r.subject}
                        </div>
                        {(r.code || (!selectedExam && r.examName)) && (
                          <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono flex items-center gap-2">
                            {r.code && <span>{r.code}</span>}
                            {!selectedExam && r.examName && (
                              <span>· {isBn ? r.examNameBn || r.examName : r.examName}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-[var(--text-secondary)] tabular-nums">{r.fullMarks}</td>
                      <td className="py-3 px-3 text-center text-[var(--text-secondary)] tabular-nums">{r.written}</td>
                      <td className="py-3 px-3 text-center text-[var(--text-secondary)] tabular-nums">{r.mcq}</td>
                      <td className="py-3 px-3 text-center text-[var(--text-secondary)] tabular-nums">{r.practical}</td>
                      <td className="py-3 px-3 text-center font-semibold text-[var(--text-primary)] tabular-nums">{r.obtained}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className="inline-flex px-2 py-0.5 rounded-md text-[0.6875rem] font-semibold"
                          style={{
                            color: gradeColor,
                            backgroundColor: `${gradeColor}15`,
                          }}
                        >
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[var(--text-primary)] font-mono tabular-nums">
                        {r.point.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grading Scale Reference */}
      {filteredResults.length > 0 && (
        <div className="px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap text-[0.6875rem] text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">
            {isBn ? 'গ্রেডিং স্কেল:' : 'Grading Scale:'}
          </span>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap">
            {GRADE_SCALE.map((g) => (
              <span key={g.letter} className="tabular-nums">
                <strong className="text-[var(--text-primary)]">{g.letter}</strong> ({g.range}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Exam Schedule */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3.5">
          {isBn ? 'আসন্ন পরীক্ষার রুটিন ও সময়সূচি' : 'Upcoming Exam Routine & Schedule'}
        </h4>

        {childRoutines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {childRoutines.map((rt) => {
              const subj = subjects.find((s) => s.id === rt.subjectId)
              return (
                <div key={rt.id} className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03]">
                  <div className="text-[0.6875rem] text-[var(--text-muted)] tabular-nums">
                    {rt.date} · {rt.startTime} - {rt.endTime}
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
                    {isBn ? subj?.nameBn || subj?.name || rt.subjectId : subj?.name || rt.subjectId}
                  </div>
                  {rt.roomNo && (
                    <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                      <MapPin size={11} className="text-[var(--brand)] shrink-0" />
                      <span>{isBn ? 'কক্ষ:' : 'Room:'} {rt.roomNo}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-5 text-center text-xs text-[var(--text-muted)]">
            {isBn
              ? 'এই শ্রেণির জন্য কোনো পরীক্ষার সময়সূচি পাওয়া যায়নি।'
              : 'No upcoming exam schedule found for this class.'}
          </div>
        )}
      </div>
    </div>
  )
})
