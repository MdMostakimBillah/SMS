import React, { useState } from 'react'
import {
  Award,
  Calendar,
  Printer,
  CheckCircle2,
  MapPin,
} from 'lucide-react'
import type { PortalChild, ExamResultItem } from '../types'
import { useClassStore } from '@/store/classStore'
import { openPrintWindow } from '@/lib/pdf'

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
    const css = `
      @page { size: A4 portrait; margin: 15mm; }
      body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; }
      .hdr { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
      .sname { font-size: 18px; font-weight: bold; color: #1e3a8a; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
      th { background: #2563eb; color: #fff; padding: 6px 8px; text-align: left; border: 1px solid #2563eb; }
      td { padding: 6px 8px; border: 1px solid #cbd5e1; }
      tr:nth-child(even) { background: #f8fafc; }
      .summary { display: flex; justify-content: space-between; background: #eff6ff; padding: 10px; border-radius: 6px; font-weight: bold; }
      .ftr { margin-top: 40px; display: flex; justify-content: space-between; }
      .sig { width: 160px; border-top: 1px dashed #64748b; text-align: center; padding-top: 4px; font-size: 10px; }
    `
    const rows = results
      .map(
        (r) => `
        <tr>
          <td>${r.code}</td>
          <td><strong>${isBn ? r.subjectBn : r.subject}</strong></td>
          <td>${r.fullMarks}</td>
          <td>${r.written}</td>
          <td>${r.mcq}</td>
          <td>${r.practical}</td>
          <td><strong>${r.obtained}</strong></td>
          <td><span style="color:#2563eb;font-weight:bold">${r.grade}</span></td>
          <td>${r.point.toFixed(2)}</td>
        </tr>
      `
      )
      .join('')

    const html = `
      <div class="hdr">
        <div class="sname">${institution.name || 'EduTech Smart School'}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">${institution.address || ''}</div>
        <div style="font-size:13px;font-weight:bold;margin-top:6px;color:#0f172a">
          ${isBn ? 'একাডেমিক মূল্যায়ন ও মার্কশিট' : 'ACADEMIC TRANSCRIPT & MARKSHEET'}
        </div>
      </div>

      <div class="meta">
        <div>
          <div><strong>${isBn ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}</strong> ${child.nameEn} (${child.nameBn || ''})</div>
          <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${child.class} &nbsp; <strong>${isBn ? 'শাখা:' : 'Section:'}</strong> ${child.section}</div>
        </div>
        <div>
          <div><strong>${isBn ? 'রোল নং:' : 'Roll No:'}</strong> ${child.roll} &nbsp; <strong>${isBn ? 'আইডি:' : 'ID:'}</strong> ${child.id}</div>
          <div><strong>${isBn ? 'সেশন:' : 'Session:'}</strong> ${child.academicYear}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Subject</th>
            <th>Full</th>
            <th>Written</th>
            <th>MCQ</th>
            <th>Prac</th>
            <th>Obtained</th>
            <th>Grade</th>
            <th>GPA</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="summary">
        <div>${isBn ? 'মোট নম্বর:' : 'Total Marks:'} ${totalObtained} / ${totalFull} (${avgPct}%)</div>
        <div>${isBn ? 'সর্বমোট জিপিএ:' : 'Final GPA:'} 5.00 (Grade A+)</div>
        <div style="color:#16a34a">${isBn ? 'ফলাফল: উত্তীর্ণ (Promoted)' : 'Result: Passed'}</div>
      </div>

      <div class="ftr">
        <div class="sig">${isBn ? 'শ্রেণি শিক্ষকের স্বাক্ষর' : 'Class Teacher Signature'}</div>
        <div class="sig">${isBn ? 'অধ্যক্ষের স্বাক্ষর' : 'Principal Signature'}</div>
      </div>
    `
    openPrintWindow('Marksheet - ' + child.nameEn, html, { css })
  }

  return (
    <div className="space-y-4">
      {/* Top Selector & Print Header */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] flex-wrap shadow-xs">
        <div className="flex items-center gap-3">
          <Award size={20} className="text-[var(--brand)]" />
          <div>
            <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'একাডেমিক ফলাফল ও মূল্যায়ন' : 'Academic Results & Marksheet'}
            </h3>
            <p className="text-[0.6875rem] text-[var(--text-muted)]">
              {isBn ? 'শিক্ষার্থীর বিষয়ভিত্তিক গ্রেড ও পরীক্ষার ফলাফল' : 'Child subject performance, GPA, and grades'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer"
          >
            <option value="annual-2026">{isBn ? 'বার্ষিক পরীক্ষা ২০২৬' : 'Annual Final Exam 2026'}</option>
            <option value="half-yearly-2026">{isBn ? 'অর্ধবার্ষিক পরীক্ষা ২০২৬' : 'Half Yearly Exam 2026'}</option>
            <option value="term-1-2026">{isBn ? '১ম সাময়িক পরীক্ষা ২০২৬' : '1st Term Evaluation 2026'}</option>
          </select>

          <button
            type="button"
            onClick={handlePrintMarksheet}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-95 cursor-pointer border-none"
          >
            <Printer size={13} />
            {isBn ? 'মার্কশিট ডাউনলোড' : 'Download Marksheet'}
          </button>
        </div>
      </div>

      {/* Summary Scorecard Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase">{isBn ? 'সর্বমোট জিপিএ' : 'Final GPA'}</div>
          <div className="text-[1.5rem] font-extrabold text-[var(--brand)] mt-1">5.00</div>
          <div className="text-[0.6875rem] text-emerald-600 font-semibold">{isBn ? 'গ্রেড: A+ (অসাধারণ)' : 'Grade: A+ (Outstanding)'}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase">{isBn ? 'প্রাপ্ত মোট নম্বর' : 'Total Obtained'}</div>
          <div className="text-[1.5rem] font-extrabold text-[var(--text-primary)] mt-1">{totalObtained} / {totalFull}</div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{avgPct}% {isBn ? 'নম্বর প্রাপ্তি' : 'Average Score'}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase">{isBn ? 'শ্রেণি অবস্থান (Rank)' : 'Class Merit Position'}</div>
          <div className="text-[1.5rem] font-extrabold text-purple-600 mt-1">1st</div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'মোট ৪৫ জন শিক্ষার্থীর মধ্যে' : 'Out of 45 students'}</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase">{isBn ? 'ফলাফলের স্থিতি' : 'Result Status'}</div>
          <div className="text-[1.25rem] font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 size={18} /> {isBn ? 'উত্তীর্ণ' : 'PASSED'}
          </div>
          <div className="text-[0.6875rem] text-emerald-600">{isBn ? 'পরবর্তী শ্রেণিতে উন্নীত' : 'Promoted to Next Class'}</div>
        </div>
      </div>

      {/* Subject-Wise Marksheet Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/40 flex items-center justify-between">
          <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'বিষয়ভিত্তিক নম্বর বিভাজন' : 'Subject-wise Detailed Marks'}
          </h4>
          <span className="text-[0.6875rem] text-[var(--text-muted)] font-mono">
            {results.length} {isBn ? 'টি বিষয়' : 'Subjects'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.8125rem] border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase bg-[var(--bg-secondary)]/20">
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
                    <span className="inline-flex px-2 py-0.5 rounded text-[0.6875rem] font-bold bg-emerald-500/10 text-emerald-600">
                      {r.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-[var(--brand)]">{r.point.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Exam Schedule Banner */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-3">
          <Calendar size={16} className="text-[var(--brand)]" />
          <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'আসন্ন পরীক্ষার রুটিন ও সময়সূচি' : 'Upcoming Exam Routine & Schedule'}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40">
            <div className="text-[0.6875rem] text-[var(--text-muted)] font-medium">Dec 08, 2026 · 10:00 AM - 01:00 PM</div>
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mt-0.5">{isBn ? 'বাংলা ১ম পত্র' : 'Bangla 1st Paper'}</div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <MapPin size={11} className="text-[var(--brand)]" /> Room: R-101
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40">
            <div className="text-[0.6875rem] text-[var(--text-muted)] font-medium">Dec 10, 2026 · 10:00 AM - 01:00 PM</div>
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mt-0.5">{isBn ? 'ইংরেজি ১ম পত্র' : 'English 1st Paper'}</div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <MapPin size={11} className="text-[var(--brand)]" /> Room: R-101
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40">
            <div className="text-[0.6875rem] text-[var(--text-muted)] font-medium">Dec 13, 2026 · 10:00 AM - 01:00 PM</div>
            <div className="text-[0.875rem] font-bold text-[var(--text-primary)] mt-0.5">{isBn ? 'গণিত' : 'Mathematics'}</div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <MapPin size={11} className="text-[var(--brand)]" /> Room: R-102
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
