import React, { useCallback } from 'react'
import { GenericPDFOptionsModal } from './GenericPDFOptionsModal'
import type { GenericPDFOptionsResult } from './GenericPDFOptionsModal'

export interface AttendancePDFOptions {
  title: string
  selectedCols: string[]
  emptyRows: number
  orientation: 'portrait' | 'landscape'
  isBn: boolean
}

interface AttendanceRecord {
  id: string
  nameEn: string
  nameBn?: string
  class?: string
  section?: string
  dept?: string
  designation?: string
  days: Array<{
    date: string
    status: 'present' | 'absent' | 'on-leave'
    isWeeklyHoliday?: boolean
  }>
}

interface Props {
  count: number
  isBn: boolean
  type: 'student' | 'employee'
  records: AttendanceRecord[]
  dateFrom: string
  dateTo: string
  rangeDays: string[]
  onClose: () => void
  onDownload: (opts: AttendancePDFOptions) => void
}

export const AttendancePDFOptionsModal = React.memo(function AttendancePDFOptionsModal({
  count,
  isBn,
  type,
  records,
  dateFrom,
  dateTo,
  rangeDays,
  onClose,
  onDownload,
}: Props) {
  const generateAttendanceHTML = useCallback(
    (opts: GenericPDFOptionsResult): string => {
      const { title, orientation, isBn: optsIsBn } = opts

      const generateRow = (record: AttendanceRecord, idx: number) => {
        const p = record.days.filter((d) => d.status === 'present').length
        const a = record.days.filter((d) => d.status === 'absent').length
        const l = record.days.filter((d) => d.status === 'on-leave' && !d.isWeeklyHoliday).length
        const w = record.days.filter((d) => d.isWeeklyHoliday).length

        const dayGrid = rangeDays
          .map((ds) => {
            const dayData = record.days.find((d) => d.date === ds)
            if (dayData?.isWeeklyHoliday)
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#f3e8ff;color:#8b5cf6;border:0.5px solid #e5e7eb">W</td>'
            if (dayData?.status === 'present')
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#d1fae5;color:#059669;border:0.5px solid #e5e7eb">P</td>'
            if (dayData?.status === 'absent')
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fee2e2;color:#dc2626;border:0.5px solid #e5e7eb">A</td>'
            return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fef3c7;color:#d97706;border:0.5px solid #e5e7eb">L</td>'
          })
          .join('')

        const nameCol = type === 'student'
          ? `<td style="padding:4px;font-size:9px;font-weight:500">${optsIsBn ? record.nameBn || record.nameEn : record.nameEn}</td>
             <td style="padding:4px;font-size:8px">${record.class}</td>
             <td style="padding:4px;font-size:8px">${record.section || '—'}</td>`
          : `<td style="padding:4px;font-size:9px;font-weight:500">${optsIsBn ? record.nameBn || record.nameEn : record.nameEn}</td>
             <td style="padding:4px;font-size:8px">${record.dept}</td>
             <td style="padding:4px;font-size:8px">${record.designation || '—'}</td>`

        return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">
        <td style="padding:4px;font-size:9px">${idx + 1}</td>
        <td style="padding:4px;font-size:8px;font-family:monospace;color:#6366f1">${record.id}</td>
        ${nameCol}
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#059669">${p}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#dc2626">${a}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#d97706">${l}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#8b5cf6">${w}</td>
        ${dayGrid}
      </tr>`
      }

      const rowsHtml = records.map((r, i) => generateRow(r, i)).join('')

      const dayHeaders = rangeDays
        .map((ds) => {
          const dayNum = ds.slice(8, 10)
          const dayName = new Date(ds).toLocaleDateString('en', { weekday: 'narrow' })
          return `<th style="width:16px;padding:2px;font-size:6px;text-align:center">${dayNum}<br/>${dayName}</th>`
        })
        .join('')

      const headerLabel = type === 'student' ? 'Student Monthly Attendance' : 'Employee Monthly Attendance'
      const headerLabelBn = type === 'student' ? 'শিক্ষার্থীদের মাসিক উপস্থিতি' : 'কর্মচারীদের মাসিক উপস্থিতি'
      const countLabel = type === 'student' ? 'students' : 'employees'
      const countLabelBn = type === 'student' ? 'জন শিক্ষার্থী' : 'জন কর্মচারী'

      const thCols = type === 'student'
        ? `<th style="width:100px">${optsIsBn ? 'নাম' : 'Name'}</th>
           <th style="width:35px">${optsIsBn ? 'শ্রেণি' : 'C'}</th>
           <th style="width:25px">${optsIsBn ? 'সে' : 'S'}</th>`
        : `<th style="width:100px">${optsIsBn ? 'নাম' : 'Name'}</th>
           <th style="width:60px">${optsIsBn ? 'বিভাগ' : 'Dept'}</th>
           <th style="width:60px">${optsIsBn ? 'পদবি' : 'Desig'}</th>`

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>@page{size:A4 ${orientation};margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #6366f1;margin-bottom:8px}.logo{width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}.ttl{text-align:center;font-size:11px;font-weight:700;margin-bottom:3px}.sub{text-align:center;font-size:8px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:3px;text-align:left;font-size:7px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:3px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:8px;padding-top:5px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:11px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:7px;color:#888">${optsIsBn ? headerLabelBn : headerLabel}</div></div></div>
<div class="ttl">${title}</div>
<div class="sub">${optsIsBn ? 'মোট' : 'Total'}: ${count} ${optsIsBn ? countLabelBn : countLabel} · ${dateFrom} → ${dateTo} · ${rangeDays.length} ${optsIsBn ? 'দিন' : 'days'}</div>
<table><thead><tr>
  <th style="width:20px">#</th>
  <th style="width:65px">ID</th>
  ${thCols}
  <th style="width:20px">P</th>
  <th style="width:20px">A</th>
  <th style="width:20px">L</th>
  <th style="width:20px">W</th>
  ${dayHeaders}
</tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${optsIsBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
      return html
    },
    [type, records, dateFrom, dateTo, rangeDays]
  )

  const previewRenderer = useCallback(
    (opts: GenericPDFOptionsResult) => generateAttendanceHTML(opts),
    [generateAttendanceHTML]
  )

  return (
    <GenericPDFOptionsModal
      columns={[]}
      defaultTitle={type === 'student' ? 'Student Monthly Attendance' : 'Employee Monthly Attendance'}
      defaultTitleBn={type === 'student' ? 'শিক্ষার্থীদের মাসিক উপস্থিতি' : 'কর্মচারীদের মাসিক উপস্থিতি'}
      recordLabel={type === 'student' ? 'students' : 'employees'}
      recordLabelBn={type === 'student' ? 'জন শিক্ষার্থী' : 'জন কর্মচারী'}
      count={count}
      isBn={isBn}
      showColumns={false}
      previewRenderer={previewRenderer}
      onClose={onClose}
      onDownload={(opts) =>
        onDownload({
          title: opts.title,
          selectedCols: [],
          emptyRows: 0,
          orientation: opts.orientation,
          isBn: opts.isBn,
        })
      }
    />
  )
})
