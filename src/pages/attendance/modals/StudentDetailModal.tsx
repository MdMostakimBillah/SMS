import React from 'react'
import { createPortal } from 'react-dom'
import { FileText, X } from 'lucide-react'
import { toBnNum, dayName } from '../helpers'

interface StudentDetailModalProps {
  viewStudent: { id: string; name: string; class: string; section: string }
  getStudentMonthData: (studentId: string) => { date: string; status: string; punches: any[]; isWeeklyHoliday?: boolean }[]
  isBn: boolean
  downloadStudentSinglePDF: (studentId: string, studentName: string, className: string, section: string) => void
  setViewStudent: (val: { id: string; name: string; class: string; section: string } | null) => void
}

export const StudentDetailModal = React.memo(function StudentDetailModal({
  viewStudent,
  getStudentMonthData,
  isBn,
  downloadStudentSinglePDF,
  setViewStudent,
}: StudentDetailModalProps) {
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box max-h-[85vh] overflow-hidden flex flex-col" style={{ maxWidth: '37.5rem' }}>
        <div className="px-[1.125rem] py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--brand-light)]">
          <div>
            <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{viewStudent.name}</div>
            <div className="text-[0.6875rem] text-[var(--brand)] font-mono">
              {viewStudent.id} · {viewStudent.class} · {isBn ? 'সেকশন' : 'Section'}: {viewStudent.section}
            </div>
          </div>
          <button
            onClick={() => setViewStudent(null)}
            className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
          >
            <X size={14} className="text-[var(--text-secondary)]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[1.125rem] py-3.5">
          {(() => {
            const data = getStudentMonthData(viewStudent.id)
            const present = data.filter((d) => d.status === 'present').length
            const absent = data.filter((d) => d.status === 'absent').length
            const leave = data.filter((d) => d.status === 'on-leave' && !d.isWeeklyHoliday).length
            const weeklyHoliday = data.filter((d) => d.isWeeklyHoliday).length
            return (
              <>
                <div className="grid grid-cols-5 gap-2 mb-3.5">
                  {[
                    {
                      l: isBn ? 'মোট' : 'Total',
                      vBn: toBnNum(data.length),
                      vEn: String(data.length),
                      c: 'var(--brand)',
                      bg: 'var(--brand-light)',
                    },
                    {
                      l: isBn ? 'উপস্থিত' : 'Present',
                      vBn: toBnNum(present),
                      vEn: String(present),
                      c: 'var(--green)',
                      bg: 'var(--green-light)',
                    },
                    {
                      l: isBn ? 'অনুপস্থিত' : 'Absent',
                      vBn: toBnNum(absent),
                      vEn: String(absent),
                      c: 'var(--red)',
                      bg: 'var(--red-light)',
                    },
                    {
                      l: isBn ? 'ছুটিতে' : 'Leave',
                      vBn: toBnNum(leave),
                      vEn: String(leave),
                      c: 'var(--amber)',
                      bg: 'var(--amber-light)',
                    },
                    {
                      l: isBn ? 'সাপ্তাহিক ছুটি' : 'W.Holiday',
                      vBn: toBnNum(weeklyHoliday),
                      vEn: String(weeklyHoliday),
                      c: 'var(--purple)',
                      bg: 'var(--purple-light)',
                    },
                  ].map((s) => (
                    <div key={s.l} className="p-2.5 rounded-[0.625rem] text-center" style={{ background: s.bg }}>
                      <div className="text-xl font-bold" style={{ color: s.c }}>
                        {isBn ? s.vBn : s.vEn}
                      </div>
                      <div className="text-[0.625rem]" style={{ color: s.c }}>
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>
                <table className="w-full border-collapse text-[0.6875rem]">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)]">
                      <th className="p-[0.375rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                        #
                      </th>
                      <th className="p-[0.375rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                        {isBn ? 'তারিখ' : 'Date'}
                      </th>
                      <th className="p-[0.375rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                        {isBn ? 'অবস্থা' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => (
                      <tr key={d.date} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                        <td className="px-2 py-[0.3125rem] text-[var(--text-muted)]">{i + 1}</td>
                        <td className="px-2 py-[0.3125rem]">
                          <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{d.date}</div>
                          <div className="text-[0.5625rem] text-[var(--text-muted)]">{dayName(d.date)}</div>
                        </td>
                        <td className="px-2 py-[0.3125rem]">
                          {d.isWeeklyHoliday ? (
                            <span className="text-[0.625rem] font-semibold px-[0.4375rem] py-[0.125rem] rounded-[0.625rem] bg-[var(--purple-light)] text-[var(--purple)]">
                              {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekly Holiday'}
                            </span>
                          ) : (
                            <span
                              className={`text-[0.625rem] font-semibold px-[0.4375rem] py-[0.125rem] rounded-[0.625rem] ${
                                d.status === 'present'
                                  ? 'bg-[var(--green-light)] text-[var(--green)]'
                                  : d.status === 'absent'
                                    ? 'bg-[var(--red-light)] text-[var(--red)]'
                                    : 'bg-[var(--amber-light)] text-[var(--amber)]'
                              }`}
                            >
                              {d.status === 'present'
                                ? isBn
                                  ? 'উপস্থিত'
                                  : 'Present'
                                : d.status === 'absent'
                                  ? isBn
                                    ? 'অনুপস্থিত'
                                    : 'Absent'
                                  : isBn
                                    ? 'ছুটিতে'
                                    : 'Leave'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )
          })()}
        </div>
        <div className="px-[1.125rem] py-3 border-t border-[var(--border)] flex gap-2 justify-end">
          <button
            onClick={() => setViewStudent(null)}
            className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
          >
            {isBn ? 'বন্ধ' : 'Close'}
          </button>
          <button
            onClick={() => downloadStudentSinglePDF(viewStudent.id, viewStudent.name, viewStudent.class, viewStudent.section)}
            className="flex items-center gap-[0.3125rem] px-3.5 py-2 rounded-lg bg-[var(--red)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
          >
            <FileText size={13} />
            PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
