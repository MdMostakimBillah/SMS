export function generateSyllabusPDF(
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
  institutionName?: string
) {
  const schoolName = institutionName || (isBn ? 'এডুটেক স্কুল' : 'EduTech School')

  let topicRows = ''
  let sn = 0
  let totalMarks = 0
  let completedMarks = 0

  syllabus.chapters.forEach((ch, ci) => {
    ch.topics.forEach((t) => {
      sn++
      totalMarks += t.marks
      if (t.status === 'completed') completedMarks += t.marks
      const statusColor = t.status === 'completed' ? '#16a34a' : t.status === 'in-progress' ? '#d97706' : '#6b7280'
      const statusLabel =
        t.status === 'completed'
          ? isBn
            ? 'সম্পন্ন'
            : 'Done'
          : t.status === 'in-progress'
            ? isBn
              ? 'চলমান'
              : 'Running'
            : isBn
              ? 'বাকি'
              : 'Pending'
      topicRows += `
        <tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;color:#6b7280;">${sn}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;color:#374151;">${ci + 1}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">
            <div style="font-size:11px;font-weight:600;color:#111827;">${isBn ? t.titleBn : t.title}</div>
            <div style="font-size:9px;color:#6b7280;margin-top:1px;">${isBn ? t.descriptionBn : t.description}</div>
          </td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#374151;">${t.weekNo || '-'}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;color:#374151;">${t.startDate || '-'}<br/>${t.endDate || '-'}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;font-weight:600;color:#374151;">${t.marks}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;">
            <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;color:white;background:${statusColor};">${statusLabel}</span>
          </td>
        </tr>`
    })
  })

  const pct = totalMarks > 0 ? Math.round((completedMarks / totalMarks) * 100) : 0

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${isBn ? 'সিলেবাস' : 'Syllabus'} - ${syllabus.className} - ${syllabus.subjectName}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'Noto Serif Bengali', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; font-size: 12px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div style="text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:3px solid #2563eb;">
  <h1 style="font-size:20px;font-weight:700;color:#111827;margin-bottom:4px;">${schoolName}</h1>
  <div style="font-size:14px;font-weight:600;color:#2563eb;margin-bottom:8px;">${isBn ? 'পাঠ্যক্রম বিবরণী' : 'Syllabus Details'}</div>
  <div style="display:inline-flex;gap:24px;font-size:11px;color:#6b7280;">
    <span><strong>${isBn ? 'শ্রেণি' : 'Class'}:</strong> ${syllabus.className}</span>
    <span><strong>${isBn ? 'বিষয়' : 'Subject'}:</strong> ${syllabus.subjectName}</span>
    <span><strong>${isBn ? 'সেশন' : 'Session'}:</strong> ${syllabus.sessionId}</span>
  </div>
</div>

<div style="display:flex;gap:12px;margin-bottom:16px;">
  <div style="flex:1;padding:10px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;text-align:center;">
    <div style="font-size:18px;font-weight:700;color:#16a34a;">${syllabus.chapters.length}</div>
    <div style="font-size:10px;color:#15803d;">${isBn ? 'অধ্যায়' : 'Chapters'}</div>
  </div>
  <div style="flex:1;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;text-align:center;">
    <div style="font-size:18px;font-weight:700;color:#2563eb;">${sn}</div>
    <div style="font-size:10px;color:#1d4ed8;">${isBn ? 'টপিক' : 'Topics'}</div>
  </div>
  <div style="flex:1;padding:10px 14px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;text-align:center;">
    <div style="font-size:18px;font-weight:700;color:#d97706;">${pct}%</div>
    <div style="font-size:10px;color:#b45309;">${isBn ? 'সম্পন্ন' : 'Completed'}</div>
  </div>
  <div style="flex:1;padding:10px 14px;background:#fdf2f8;border:1px solid #fbcfe8;border-radius:8px;text-align:center;">
    <div style="font-size:18px;font-weight:700;color:#db2777;">${totalMarks}</div>
    <div style="font-size:10px;color:#be185d;">${isBn ? 'মোট মার্কস' : 'Total Marks'}</div>
  </div>
</div>

<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
  <thead>
    <tr style="background:#2563eb;color:white;">
      <th style="padding:6px 8px;border:1px solid #1d4ed8;font-size:10px;width:30px;">#</th>
      <th style="padding:6px 8px;border:1px solid #1d4ed8;font-size:10px;width:30px;">${isBn ? 'অধ্যা.' : 'Ch'}</th>
      <th style="padding:6px 8px;border:1px solid #1d4ed8;font-size:10px;text-align:left;">${isBn ? 'টপিক' : 'Topic'}</th>
      <th style="padding:6px 8px;border:1px solid #1d4ed8;font-size:10px;width:50px;">${isBn ? 'সপ্তাহ' : 'Week'}</th>
      <th style="padding:6px 8px;border:1px solid #1d4ed8;font-size:10px;width:100px;">${isBn ? 'তারিখ' : 'Dates'}</th>
      <th style="padding:6px 8px;border:1px solid #1d4ed8;font-size:10px;width:50px;">${isBn ? 'মার্কস' : 'Marks'}</th>
      <th style="padding:6px 8px;border:1px solid #1d4ed8;font-size:10px;width:70px;">${isBn ? 'অবস্থা' : 'Status'}</th>
    </tr>
  </thead>
  <tbody>
    ${topicRows}
  </tbody>
</table>

<div style="text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af;">
  ${isBn ? 'তৈরি করা হয়েছে' : 'Generated by'} ${schoolName} ${isBn ? 'ম্যানেজমেন্ট সিস্টেম' : 'Management System'} &bull; ${new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
</div>
</body>
</html>`

  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }
}
