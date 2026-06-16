import type { ExamConfig, SubjectMarkConfig, ExamRoutine } from '@/store/examStore'
import type { Subject } from '@/pages/teachers/types'

interface Student {
  id: string
  nameEn: string
  nameBn?: string
  photo: string
  class: string
  section: string
  roll?: string
}

interface Institution {
  name: string
  address: string
  phone: string
  email: string
}

export function generateAdmitCardHTML(
  students: Student[],
  exam: ExamConfig,
  inst: Institution,
  subjectMap: Map<string, Subject>,
  subjectMarkConfigs: SubjectMarkConfig[],
  routines: ExamRoutine[],
  qrUrls: Record<string, string>,
  isBn: boolean,
  brandColor: string
): string {
  const examRoutines = routines.filter((r) => r.examId === exam.id)
  const examSubjectConfigs = subjectMarkConfigs.filter((c) => c.examId === exam.id)
  const examDateRange = `${exam.startDate} ${isBn ? 'থেকে' : 'to'} ${exam.endDate}`

  const cardsHTML = students.map((student) => {
    const studentRoutines = examRoutines
      .filter((r) => r.classId === student.class && r.sectionId === student.section)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

    const classSubjectConfigs = examSubjectConfigs.filter((c) => c.classId === student.class)

    const subjectRows = studentRoutines.map((r, i) => {
      const subject = subjectMap.get(r.subjectId)
      const subjectName = subject ? (isBn ? subject.nameBn : subject.name) : r.subjectId
      return `<tr>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#475569">${i + 1}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:500;color:#1e293b">${subjectName}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#475569">${r.date}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#475569">${r.startTime} - ${r.endTime}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#475569;text-align:center">${r.roomNo}</td>
      </tr>`
    }).join('')

    const fallbackRows = subjectRows === '' ? classSubjectConfigs.map((cfg, i) => {
      const subject = subjectMap.get(cfg.subjectId)
      const subjectName = subject ? (isBn ? subject.nameBn : subject.name) : cfg.subjectId
      return `<tr>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#475569">${i + 1}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:500;color:#1e293b">${subjectName}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#94a3b8;font-style:italic" colspan="3">${isBn ? 'তারিখ নির্ধারিত হয়নি' : 'To be scheduled'}</td>
      </tr>`
    }).join('') : subjectRows

    return `<div style="width:190mm;min-height:120mm;border:1.5px solid #e2e8f0;border-radius:12px;margin:10px auto;padding:0;overflow:hidden;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;page-break-inside:avoid;background:#fff">
      <div style="padding:12px 20px;text-align:center;border-bottom:2px solid ${brandColor}">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:4px">
          <div style="width:36px;height:36px;border-radius:8px;background:${brandColor};display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;flex-shrink:0">ET</div>
          <div style="text-align:left">
            <div style="font-size:15px;font-weight:700;color:${brandColor};letter-spacing:0.3px">${inst.name}</div>
            <div style="font-size:9px;color:#64748b;line-height:1.3">${inst.address} ${inst.phone ? '| ' + inst.phone : ''} ${inst.email ? '| ' + inst.email : ''}</div>
          </div>
        </div>
      </div>
      <div style="margin:14px 20px 0;padding:10px 16px;background:linear-gradient(135deg,${brandColor},${brandColor}dd);border-radius:8px;text-align:center">
        <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase">${isBn ? exam.nameBn : exam.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.8);margin-top:3px">${exam.session} · ${examDateRange}</div>
      </div>
      <div style="display:flex;gap:14px;padding:14px 20px;align-items:flex-start">
        <div style="width:60px;height:72px;border-radius:8px;border:1.5px solid #e2e8f0;overflow:hidden;background:#f8fafc;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${student.photo ? `<img src="${student.photo}" style="width:100%;height:100%;object-fit:cover" />` : `<span style="font-size:20px;color:#cbd5e1">👤</span>`}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:2px">${student.nameEn}</div>
          ${student.nameBn ? `<div style="font-size:10px;color:#64748b;margin-bottom:6px">${student.nameBn}</div>` : ''}
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span style="font-size:9px;padding:2px 8px;border-radius:4px;background:${brandColor}15;color:${brandColor};font-weight:600">${isBn ? 'শ্রেণি' : 'Class'}: ${student.class}</span>
            <span style="font-size:9px;padding:2px 8px;border-radius:4px;background:${brandColor}15;color:${brandColor};font-weight:600">${isBn ? 'সেকশন' : 'Section'}: ${student.section}</span>
            <span style="font-size:9px;padding:2px 8px;border-radius:4px;background:#f1f5f9;color:#475569;font-weight:600">${isBn ? 'রোল' : 'Roll'}: ${student.roll || '-'}</span>
            <span style="font-size:9px;padding:2px 8px;border-radius:4px;background:#f1f5f9;color:#475569;font-family:monospace">ID: ${student.id}</span>
          </div>
        </div>
      </div>
      <div style="padding:0 20px">
        <div style="font-size:10px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">${isBn ? 'বিষয়সূচি' : 'Subject Schedule'}</div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:5px 8px;text-align:left;font-size:9px;font-weight:600;color:#64748b;border-bottom:1.5px solid #e2e8f0;width:28px">#</th>
              <th style="padding:5px 8px;text-align:left;font-size:9px;font-weight:600;color:#64748b;border-bottom:1.5px solid #e2e8f0">${isBn ? 'বিষয়' : 'Subject'}</th>
              <th style="padding:5px 8px;text-align:left;font-size:9px;font-weight:600;color:#64748b;border-bottom:1.5px solid #e2e8f0">${isBn ? 'তারিখ' : 'Date'}</th>
              <th style="padding:5px 8px;text-align:left;font-size:9px;font-weight:600;color:#64748b;border-bottom:1.5px solid #e2e8f0">${isBn ? 'সময়' : 'Time'}</th>
              <th style="padding:5px 8px;text-align:center;font-size:9px;font-weight:600;color:#64748b;border-bottom:1.5px solid #e2e8f0">${isBn ? 'কক্ষ' : 'Room'}</th>
            </tr>
          </thead>
          <tbody>${fallbackRows}</tbody>
        </table>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:16px 20px 14px;margin-top:10px">
        <div style="text-align:center">
          <img src="${qrUrls[student.id]}" style="width:56px;height:56px" />
          <div style="font-size:7px;color:#94a3b8;margin-top:2px">${isBn ? 'উপস্থিতির জন্য স্ক্যান করুন' : 'Scan for Attendance'}</div>
        </div>
        <div style="display:flex;gap:30px">
          <div style="text-align:center">
            <div style="width:100px;height:1px;background:#cbd5e1;margin-bottom:4px"></div>
            <div style="font-size:8px;color:#64748b">${isBn ? 'অধ্যক্ষের স্বাক্ষর' : "Principal's Signature"}</div>
          </div>
          <div style="text-align:center">
            <div style="width:100px;height:1px;background:#cbd5e1;margin-bottom:4px"></div>
            <div style="font-size:8px;color:#64748b">${isBn ? 'পরীক্ষা কেন্দ্রের সীল' : 'Exam Center Seal'}</div>
          </div>
        </div>
      </div>
      <div style="padding:8px 20px;background:#fffbeb;border-top:1px solid #fde68a;font-size:8px;color:#92400e">
        ${isBn ? '* এই প্রবেশপত্র এবং বৈধ পরিচয়পত্র সহ পরীক্ষা কেন্দ্রে উপস্থিত হতে হবে।' : '* Must present this admit card along with valid ID at the exam center.'}
      </div>
    </div>`
  }).join('')

  return cardsHTML
}
