import { getPDFBranding, pdfFooterHTML } from '@/lib/pdfBranding'

export interface SyllabusPDFOptions {
  orientation: 'portrait' | 'landscape'
  showChapterDesc: boolean
  showTopicDesc: boolean
}

export function generateSyllabusPDFHTML(
  syllabus: {
    className: string
    subjectName: string
    sessionId: string
    chapters: {
      title: string
      titleBn: string
      description: string
      descriptionBn: string
      topics: {
        title: string
        titleBn: string
        description: string
        descriptionBn: string
        marks: number
        status: string
        weekNo?: number
        startDate?: string
        endDate?: string
      }[]
    }[]
  },
  isBn: boolean,
  options: SyllabusPDFOptions
): string {
  const b = getPDFBranding()
  const brandColor = b.brandColor

  let topicRows = ''
  let sn = 0

  syllabus.chapters.forEach((ch, ci) => {
    ch.topics.forEach((t) => {
      sn++
      const statusColor = t.status === 'completed' ? '#16a34a' : t.status === 'in-progress' ? '#d97706' : '#6b7280'
      const statusLabel =
        t.status === 'completed'
          ? isBn ? 'সম্পন্ন' : 'Done'
          : t.status === 'in-progress'
            ? isBn ? 'চলমান' : 'Running'
            : isBn ? 'বাকি' : 'Pending'
      topicRows += `
        <tr>
          <td style="padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;color:#6b7280;">${sn}</td>
          <td style="padding:5px 6px;border:1px solid #e5e7eb;font-size:10px;color:#6b7280;">${ci + 1}</td>
          <td style="padding:5px 6px;border:1px solid #e5e7eb;">
            <div style="font-size:10px;font-weight:600;color:#111827;">${isBn ? t.titleBn : t.title}</div>
            ${options.showTopicDesc ? `<div style="font-size:8px;color:#6b7280;margin-top:1px;">${isBn ? t.descriptionBn : t.description}</div>` : ''}
          </td>
          <td style="padding:5px 6px;border:1px solid #e5e7eb;text-align:center;font-size:10px;color:#374151;">${t.weekNo || '-'}</td>
          <td style="padding:5px 6px;border:1px solid #e5e7eb;text-align:center;font-size:10px;color:#374151;">${t.startDate || '-'}<br/>${t.endDate || '-'}</td>
          <td style="padding:5px 6px;border:1px solid #e5e7eb;text-align:center;font-size:10px;font-weight:600;color:#374151;">${t.marks}</td>
          <td style="padding:5px 6px;border:1px solid #e5e7eb;text-align:center;">
            <span style="display:inline-block;padding:1px 6px;border-radius:8px;font-size:8px;font-weight:600;color:white;background:${statusColor};">${statusLabel}</span>
          </td>
        </tr>`
    })
  })

  const isLandscape = options.orientation === 'landscape'

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${isBn ? 'সিলেবাস' : 'Syllabus'}</title>
<style>
  @page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; font-size: 11px; padding: 8mm; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; padding: 8mm; } }
</style></head><body>
<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:7px;border-bottom:2px solid ${brandColor};margin-bottom:7px">
  <div style="display:flex;align-items:center;gap:10px">
    ${b.logo ? `<img src="${b.logo}" style="width:36px;height:36px;border-radius:7px;object-fit:contain" />` : `<div style="width:36px;height:36px;background:${brandColor};border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700">ET</div>`}
    <div>
      <div style="font-size:16px;font-weight:800;color:${brandColor};letter-spacing:0.3px;font-family:'Poppins','Nunito','Segoe UI',sans-serif;">${b.schoolNameBn && isBn ? b.schoolNameBn : b.schoolName}</div>
      ${b.address ? `<div style="font-size:8px;color:#888;margin-top:1px;">${b.address}</div>` : ''}
    </div>
  </div>
  <div style="text-align:right;font-size:8px;color:#666;line-height:1.7">
    <div>Printed: ${new Date().toLocaleDateString()}</div>
    <div style="font-size:9px;color:#6b7280;line-height:1.8">
      <strong>${isBn ? 'শ্রেণি' : 'Class'}:</strong> ${syllabus.className} &nbsp;|&nbsp;
      <strong>${isBn ? 'বিষয়' : 'Subject'}:</strong> ${syllabus.subjectName} &nbsp;|&nbsp;
      <strong>${isBn ? 'সেশন' : 'Session'}:</strong> ${syllabus.sessionId}
    </div>
  </div>
</div>

<div style="text-align:center;margin-bottom:12px;">
  <div style="font-size:13px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:0.5px;">${isBn ? 'পাঠ্যক্রম বিবরণী' : 'Syllabus Details'}</div>
</div>

${syllabus.chapters.map((ch, ci) => {
  const chDesc = options.showChapterDesc ? `<div style="font-size:9px;color:#6b7280;margin-bottom:4px;">${isBn ? ch.descriptionBn : ch.description}</div>` : ''
  return `
  <div style="margin-bottom:10px;">
    <div style="background:${brandColor}10;border-left:3px solid ${brandColor};padding:5px 8px;margin-bottom:4px;border-radius:0 4px 4px 0;">
      <span style="font-size:11px;font-weight:700;color:${brandColor};">${isBn ? 'অধ্যায়' : 'Chapter'} ${ci + 1}:</span>
      <span style="font-size:11px;font-weight:600;color:#111827;margin-left:4px;">${isBn ? ch.titleBn : ch.title}</span>
    </div>
    ${chDesc}
    <table style="width:100%;border-collapse:collapse;font-size:9px;">
      <thead>
        <tr style="background:${brandColor};color:white;">
          <th style="padding:4px 5px;border:1px solid ${brandColor};width:25px;">#</th>
          <th style="padding:4px 5px;border:1px solid ${brandColor};width:25px;">${isBn ? 'অধ্যা.' : 'Ch'}</th>
          <th style="padding:4px 5px;border:1px solid ${brandColor};text-align:left;">${isBn ? 'টপিক' : 'Topic'}</th>
          <th style="padding:4px 5px;border:1px solid ${brandColor};width:40px;">${isBn ? 'সপ্তাহ' : 'Week'}</th>
          <th style="padding:4px 5px;border:1px solid ${brandColor};width:80px;">${isBn ? 'তারিখ' : 'Dates'}</th>
          <th style="padding:4px 5px;border:1px solid ${brandColor};width:40px;">${isBn ? 'মার্কস' : 'Marks'}</th>
          <th style="padding:4px 5px;border:1px solid ${brandColor};width:55px;">${isBn ? 'অবস্থা' : 'Status'}</th>
        </tr>
      </thead>
      <tbody>${topicRows}</tbody>
    </table>
  </div>`
}).join('')}

${pdfFooterHTML(isBn)}
</body></html>`

  return html
}
