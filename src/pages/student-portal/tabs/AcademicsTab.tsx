import React, { useState, useMemo } from 'react'
import {
  GraduationCap,
  Printer,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react'
import type { StudentProfile } from '../types'
import { useExamStore } from '@/store/examStore'
import { useClassStore } from '@/store/classStore'
import { getStudentExamResults } from '../utils/studentPortalMapper'
import { printMarksheet } from '@/pages/parent-portal/tabs/academics/marksheetPrint'

interface AcademicsTabProps {
  student: StudentProfile
  isBn: boolean
}

export const AcademicsTab = React.memo(function AcademicsTab({
  student,
  isBn,
}: AcademicsTabProps) {
  const exams = useExamStore((s) => s.examConfigs || [])
  const institution = useClassStore((s) => s.institution)

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '')

  const results = useMemo(() => {
    return getStudentExamResults(student, selectedExamId || undefined)
  }, [student, selectedExamId])

  // Summary calculations
  const totalFull = useMemo(() => results.reduce((sum, r) => sum + r.fullMarks, 0), [results])
  const totalObtained = useMemo(() => results.reduce((sum, r) => sum + r.obtained, 0), [results])
  const avgPercentage = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '0.0'
  const hasFailed = results.some((r) => r.status === 'failed')
  const gpa = useMemo(() => {
    if (results.length === 0 || hasFailed) return hasFailed ? '0.00' : 'N/A'
    const totalPoints = results.reduce((sum, r) => sum + r.point, 0)
    return (totalPoints / results.length).toFixed(2)
  }, [results, hasFailed])

  const handlePrint = () => {
    printMarksheet(student as any, results as any, institution, isBn)
  }

  return (
    <div className="space-y-4">
      {/* Top Controls: Exam Selector + Print */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brandLight)] text-[var(--brand)] flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {isBn ? 'পরীক্ষার ফলাফল ও মার্কশিট' : 'Academic Results & Marksheet'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {isBn ? 'সেশন:' : 'Session:'} {student.academicYear || '2025-26'} • {student.class}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {exams.length > 0 && (
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs outline-none"
            >
              {exams.map((exam: any) => (
                <option key={exam.id} value={exam.id}>
                  {isBn ? exam.nameBn || exam.name : exam.name}
                </option>
              ))}
            </select>
          )}

          {results.length > 0 && (
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Printer size={14} />
              <span>{isBn ? 'মার্কশিট প্রিন্ট' : 'Print Marksheet'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
            <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
              {isBn ? 'মোট নম্বর' : 'Total Marks'}
            </span>
            <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
              {totalObtained} <span className="text-xs font-normal text-[var(--text-muted)]">/ {totalFull}</span>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
            <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
              {isBn ? 'গড় শতকরা' : 'Percentage'}
            </span>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {avgPercentage}%
            </div>
          </div>

          <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
            <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
              {isBn ? 'জিপিএ (GPA)' : 'CGPA / GPA'}
            </span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {gpa}
            </div>
          </div>

          <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
            <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
              {isBn ? 'ফলাফল' : 'Overall Status'}
            </span>
            <div className={`text-base font-bold mt-1 flex items-center gap-1 ${hasFailed ? 'text-rose-500' : 'text-emerald-600'}`}>
              {hasFailed ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{hasFailed ? (isBn ? 'অনুত্তীর্ণ' : 'Failed') : (isBn ? 'উত্তীর্ণ' : 'Passed')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xs">
        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <th className="py-3 px-4 font-semibold">{isBn ? 'বিষয়' : 'Subject'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'পূর্ণমান' : 'Full'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'পাস নম্বর' : 'Pass'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'লিখিত' : 'Written'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'এমসিকিউ' : 'MCQ'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'ব্যবহারিক' : 'Practical'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'প্রাপ্ত নম্বর' : 'Obtained'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isBn ? 'গ্রেড' : 'Grade'}</th>
                  <th className="py-3 px-4 font-semibold text-right">{isBn ? 'পয়েন্ট' : 'Point'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                      <div>{isBn ? r.subjectBn : r.subject}</div>
                      {r.code && <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">{r.code}</div>}
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--text-secondary)]">{r.fullMarks}</td>
                    <td className="py-3 px-3 text-center text-[var(--text-secondary)]">{r.passMarks}</td>
                    <td className="py-3 px-3 text-center text-[var(--text-secondary)]">{r.written}</td>
                    <td className="py-3 px-3 text-center text-[var(--text-secondary)]">{r.mcq}</td>
                    <td className="py-3 px-3 text-center text-[var(--text-secondary)]">{r.practical}</td>
                    <td className="py-3 px-3 text-center font-bold text-[var(--text-primary)]">{r.obtained}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        r.grade === 'F' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                      }`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                      {r.point.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-[var(--text-muted)] p-6">
            <FileSpreadsheet size={36} className="mx-auto mb-3 opacity-50" />
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {isBn ? 'কোনো পরীক্ষার নম্বর এখনও এন্ট্রি করা হয়নি' : 'No Exam Results Published Yet'}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {isBn
                ? 'শিক্ষক বা পরীক্ষা নিয়ন্ত্রক নম্বর এন্ট্রি ও প্রকাশ করলে মার্কশিট স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।'
                : 'Subject marks will appear here once entered and published by teachers.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})
