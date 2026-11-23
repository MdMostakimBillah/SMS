import { openPrintWindow } from '@/lib/pdf'
import type { StudentProfile, StudentDayRoutine } from '../types'

interface InstitutionInfo {
  name?: string
  address?: string
}

export function printStudentRoutine(
  student: StudentProfile,
  routines: StudentDayRoutine[],
  institution: InstitutionInfo,
  isBn: boolean
) {
  const css = `
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; }
    .hdr { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 8px; margin-bottom: 12px; }
    .sname { font-size: 18px; font-weight: bold; color: #4338ca; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #6366f1; color: #fff; padding: 6px 8px; text-align: left; border: 1px solid #4f46e5; font-size: 11px; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 11px; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .weekend { background: #f1f5f9; color: #64748b; font-style: italic; }
    .period-chip { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 4px; padding: 4px 6px; margin-bottom: 4px; }
    .period-time { font-size: 9px; color: #6366f1; font-weight: bold; }
    .sub-name { font-weight: bold; color: #1e1b4b; }
    .tch-name { font-size: 10px; color: #475569; }
  `

  const rows = routines
    .map((day) => {
      if (day.isWeekend) {
        return `
          <tr class="weekend">
            <td><strong>${isBn ? day.dayNameBn : day.dayNameEn}</strong></td>
            <td colspan="6" style="text-align: center; padding: 12px; color: #64748b;">
              ${isBn ? 'সাপ্তাহিক ছুটি' : 'Weekly Holiday'}
            </td>
          </tr>
        `
      }

      const periodsHtml = day.periods.length > 0
        ? day.periods
            .map(
              (p) => `
              <div class="period-chip">
                <div class="period-time">${p.periodLabel} (${p.startTime} - ${p.endTime})</div>
                <div class="sub-name">${isBn ? p.subjectNameBn : p.subjectName}</div>
                <div class="tch-name">${p.teacherName}</div>
              </div>
            `
            )
            .join('')
        : `<span style="color:#94a3b8">${isBn ? 'কোনো ক্লাস নির্ধারিত নেই' : 'No classes scheduled'}</span>`

      return `
        <tr>
          <td style="width: 15%; font-weight: bold;">
            ${isBn ? day.dayNameBn : day.dayNameEn}
            ${day.isToday ? `<span style="color:#6366f1; margin-left: 4px;">(${isBn ? 'আজ' : 'Today'})</span>` : ''}
          </td>
          <td colspan="6">
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${periodsHtml}
            </div>
          </td>
        </tr>
      `
    })
    .join('')

  const html = `
    <div class="hdr">
      <div class="sname">${institution.name || 'EduTech Smart School'}</div>
      <div style="font-size:10px;color:#64748b;margin-top:2px">${institution.address || ''}</div>
      <div style="font-size:13px;font-weight:bold;margin-top:6px;color:#0f172a">
        ${isBn ? 'শিক্ষার্থী ক্লাস রুটিন ও সময়সূচি' : 'STUDENT CLASS ROUTINE & TIMETABLE'}
      </div>
    </div>

    <div class="meta">
      <div><strong>${isBn ? 'শিক্ষার্থী:' : 'Student:'}</strong> ${isBn ? student.nameBn || student.nameEn : student.nameEn}</div>
      <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${student.class} | <strong>${isBn ? 'শাখা:' : 'Section:'}</strong> ${student.section || 'A'}</div>
      <div><strong>${isBn ? 'রোল:' : 'Roll:'}</strong> ${student.roll} | <strong>ID:</strong> ${student.id}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 15%;">${isBn ? 'দিন' : 'Day'}</th>
          <th colspan="6">${isBn ? 'ক্লাস ও পিরিয়ডসমূহ' : 'Classes & Scheduled Periods'}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `

  openPrintWindow(html, css)
}
