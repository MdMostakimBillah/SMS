import React, { useState } from 'react'
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
  const [selectedExam, setSelectedExam] = useState('annual-2026')
  const institution = useClassStore((s) => s.institution)

  const totalFull = results.reduce((a, b) => a + b.fullMarks, 0)
  const totalObtained = results.reduce((a, b) => a + b.obtained, 0)
  const avgPct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '0'

  const handlePrintMarksheet = () => {
    printMarksheet(child, results, institution, isBn)
  }

  const kpiCards = [
    {
      icon: Award,
      value: '5.00',
      label: isBn ? 'সর্বমোট জিপিএ (A+)' : 'Final GPA (A+)',
    },
    {
      icon: CheckCircle2,
      value: `${totalObtained} / ${totalFull}`,
      label: isBn ? `প্রাপ্ত মোট নম্বর (${avgPct}%)` : `Total Obtained (${avgPct}%)`,
    },
    {
      icon: GraduationCap,
      value: '1st',
      label: isBn ? 'শ্রেণি অবস্থান (মেধা তালিকা)' : 'Class Merit Position',
    },
    {
      icon: TrendingUp,
      value: isBn ? 'উত্তীর্ণ' : 'PASSED',
      label: isBn ? 'ফলাফল: পরবর্তী শ্রেণিতে উন্নীত' : 'Result: Promoted to Next Class',
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

        <div className="flex items-center gap-2">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
          >
            <option value="annual-2026">{isBn ? 'বার্ষিক পরীক্ষা ২০২৬' : 'Annual Final Exam 2026'}</option>
            <option value="half-yearly-2026">{isBn ? 'অর্ধবার্ষিক পরীক্ষা ২০২৬' : 'Half Yearly Exam 2026'}</option>
            <option value="term-1-2026">{isBn ? '১ম সাময়িক পরীক্ষা ২০২৬' : '1st Term Evaluation 2026'}</option>
          </select>

          <button
            type="button"
            onClick={handlePrintMarksheet}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-90 cursor-pointer border-none"
          >
            <Printer size={13} />
            {isBn ? 'মার্কশিট ডাউনলোড' : 'Download Marksheet'}
          </button>
        </div>
      </div>

      {/* Summary Scorecard Banner - Dashboard Style Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.375rem',
                background: 'var(--bg-secondary)',
                color: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <card.icon size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: 'var(--text-primary)',
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.125rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
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
                <tr key={r.code} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                  <td className="py-2.5 px-3 text-[var(--text-muted)] text-[0.75rem]">{i + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                    {isBn ? r.subjectBn : r.subject}
                    <span className="text-[0.6875rem] text-[var(--text-muted)] block font-mono font-normal">Code: {r.code}</span>
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
      </div>

      {/* Upcoming Exam Schedule Banner */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-3">
          <Calendar size={16} className="text-[var(--brand)]" />
          <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'আসন্ন পরীক্ষার রুটিন ও সময়সূচি' : 'Upcoming Exam Routine & Schedule'}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">Dec 08, 2026 · 10:00 AM - 01:00 PM</div>
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mt-0.5">{isBn ? 'বাংলা ১ম পত্র' : 'Bangla 1st Paper'}</div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
              <MapPin size={11} className="text-[var(--text-muted)]" /> Room: R-101
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">Dec 10, 2026 · 10:00 AM - 01:00 PM</div>
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mt-0.5">{isBn ? 'ইংরেজি ১ম পত্র' : 'English 1st Paper'}</div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
              <MapPin size={11} className="text-[var(--text-muted)]" /> Room: R-101
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">Dec 13, 2026 · 10:00 AM - 01:00 PM</div>
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mt-0.5">{isBn ? 'গণিত' : 'Mathematics'}</div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-1 flex items-center gap-1">
              <MapPin size={11} className="text-[var(--text-muted)]" /> Room: R-102
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
