import React from 'react'
import { createPortal } from 'react-dom'
import { FileText, X } from 'lucide-react'
import { toBnNum, dayName } from '../helpers'

interface PersonDetailModalProps {
  viewPerson: { id: string; name: string; type: 'teacher' | 'student' }
  teachers: any[]
  getPersonMonthData: (personId: string) => { date: string; status: string; punches: any[] }[]
  isBn: boolean
  dateFrom: string
  dateTo: string
  downloadSinglePDF: (personId: string, personName: string) => void
  setViewPerson: (val: { id: string; name: string; type: 'teacher' | 'student' } | null) => void
}

export const PersonDetailModal = React.memo(function PersonDetailModal({
  viewPerson,
  teachers,
  getPersonMonthData,
  isBn,
  dateFrom,
  dateTo,
  downloadSinglePDF,
  setViewPerson,
}: PersonDetailModalProps) {
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content modal-box max-h-[85vh] overflow-hidden flex flex-col" style={{ maxWidth: '40.625rem' }}>
        <div className="px-[1.125rem] py-3.5 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--brand-light)]">
          {(() => {
            const t = teachers.find((te) => te.id === viewPerson.id)
            const photoUrl = t?.photo
            return photoUrl ? (
              <img src={photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-[var(--brand)]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] border-2 border-[var(--brand)] flex items-center justify-center text-[var(--brand)] font-bold text-[0.875rem]">
                {viewPerson.name.charAt(0)}
              </div>
            )
          })()}
          <div className="flex-1">
            <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{viewPerson.name}</div>
            <div className="text-[0.6875rem] text-[var(--brand)] font-mono">
              {viewPerson.id} · {dateFrom} → {dateTo}
            </div>
          </div>
          <button
            onClick={() => setViewPerson(null)}
            className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
          >
            <X size={14} className="text-[var(--text-secondary)]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[1.125rem] py-3.5">
          {(() => {
            const data = getPersonMonthData(viewPerson.id)
            const present = data.filter((d) => d.status === 'present').length
            const absent = data.filter((d) => d.status === 'absent').length
            const leave = data.filter((d) => d.status === 'on-leave').length
            const t = teachers.find((te) => te.id === viewPerson.id)
            const inTime = t?.inTime || '08:00'
            const lateCount = data.filter((d) => {
              if (d.status !== 'present') return false
              const firstIn = d.punches.find((p: any) => p.type === 'in')
              return firstIn && firstIn.time > inTime
            }).length
            const avgIn = (() => {
              const ins = data
                .filter((d) => d.status === 'present')
                .map((d) => {
                  const f = d.punches.find((p: any) => p.type === 'in')
                  return f ? f.time : null
                })
                .filter(Boolean) as string[]
              if (ins.length === 0) return '—'
              const mins = ins.map((ti) => parseInt(ti.split(':')[0]) * 60 + parseInt(ti.split(':')[1]))
              const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
              return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`
            })()
            return (
              <>
                <div className="grid grid-cols-5 gap-2 mb-3.5">
                  {[
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
                      l: isBn ? 'বিলম্ব' : 'Late',
                      vBn: toBnNum(lateCount),
                      vEn: String(lateCount),
                      c: 'var(--red)',
                      bg: 'var(--red-light)',
                    },
                    {
                      l: isBn ? 'গড় ইন' : 'Avg In',
                      vBn: avgIn,
                      vEn: avgIn,
                      c: 'var(--brand)',
                      bg: 'var(--brand-light)',
                    },
                  ].map((s) => (
                    <div key={s.l} className="p-2 rounded-[0.5rem] text-center" style={{ background: s.bg }}>
                      <div className="text-lg font-bold" style={{ color: s.c }}>
                        {isBn ? s.vBn : s.vEn}
                      </div>
                      <div className="text-[0.5625rem]" style={{ color: s.c }}>
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>
                <table className="w-full border-collapse text-[0.6875rem]">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)]">
                      <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)] w-[1.5rem]">
                        #
                      </th>
                      <th className="p-[0.3125rem] text-left text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                        {isBn ? 'তারিখ' : 'Date'}
                      </th>
                      <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                        {isBn ? 'ইন' : 'In'}
                      </th>
                      <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                        {isBn ? 'আউট' : 'Out'}
                      </th>
                      <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                        {isBn ? 'অবস্থা' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => {
                      const firstIn = d.punches.find((p: any) => p.type === 'in')
                      const lastOut = [...d.punches].reverse().find((p: any) => p.type === 'out')
                      const isLate = firstIn && firstIn.time > inTime
                      return (
                        <tr key={d.date} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                          <td className="p-[0.3125rem] text-center text-[0.5625rem] text-[var(--text-muted)]">{i + 1}</td>
                          <td className="p-[0.3125rem]">
                            <div className="text-[0.625rem] font-medium text-[var(--text-primary)]">{d.date}</div>
                            <div className="text-[0.5rem] text-[var(--text-muted)]">{dayName(d.date)}</div>
                          </td>
                          <td className="p-[0.3125rem] text-center">
                            <span
                              className={`text-[0.5625rem] font-mono font-semibold px-[0.3125rem] py-[0.0625rem] rounded ${
                                firstIn
                                  ? isLate
                                    ? 'bg-[var(--amber-light)] text-[var(--amber)]'
                                    : 'bg-[var(--green-light)] text-[var(--green)]'
                                  : 'text-[var(--text-muted)]'
                              }`}
                            >
                              {firstIn?.time || '—'}
                            </span>
                          </td>
                          <td className="p-[0.3125rem] text-center">
                            <span className="text-[0.5625rem] font-mono text-[var(--text-secondary)]">{lastOut?.time || '—'}</span>
                          </td>
                          <td className="p-[0.3125rem] text-center">
                            <span
                              className={`text-[0.5625rem] font-semibold px-[0.375rem] py-[0.0625rem] rounded-[0.5rem] ${
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
                            {isLate && <span className="text-[0.4375rem] text-[var(--amber)] font-bold ml-1">LATE</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )
          })()}
        </div>
        <div className="px-[1.125rem] py-3 border-t border-[var(--border)] flex gap-2 justify-end">
          <button
            onClick={() => setViewPerson(null)}
            className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
          >
            {isBn ? 'বন্ধ' : 'Close'}
          </button>
          <button
            onClick={() => downloadSinglePDF(viewPerson.id, viewPerson.name)}
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
