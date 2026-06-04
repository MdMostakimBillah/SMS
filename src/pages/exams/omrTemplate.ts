import QRCode from 'qrcode'

const bn = (n: number): string => {
  const d = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n)
    .split('')
    .map((c) => d[parseInt(c)] || c)
    .join('')
}

export interface OMRConfig {
  examName: string
  examNameBn: string
  subjectName: string
  subjectNameBn: string
  className: string
  classNameBn: string
  sessionName: string
  totalQuestions: number
  optionCount: number
  correctMark: number
  negativeMark: number
  sheetFormat: 'A' | 'B' | 'C' | 'D'
  themeColor: string
  serialNumber: string
  institutionName: string
  institutionNameBn: string
  institutionAddress: string
  showRollNo: boolean
  showRegistrationNo: boolean
  showSetCode: boolean
  showSubjects: boolean
  showSubjectCode: boolean
  showQRCode: boolean
  showBarcode: boolean
  showStudentPhoto: boolean
  showStudentSignature: boolean
  showExaminerSection: boolean
  showAdditionalPaper: boolean
  showInstructions: boolean
  subjects: { name: string; nameBn: string }[]
}

/* ── Helper: Bengali digit circle grid — inner div with border-radius:50% ── */
function digitGrid(c: string, cols: number, sz: number): string {
  let html = ''
  for (let d = 0; d < 10; d++) {
    let cells = ''
    for (let ci = 0; ci < cols; ci++) {
      cells += `<td style="width:${sz + 4}px;height:${sz + 4}px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:${sz}px;height:${sz}px;border:1.5px solid ${c};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:${sz > 14 ? 8 : 7}px;font-weight:700;color:${c};background:white;">${bn(d)}</div></td>`
    }
    html += `<tr>${cells}</tr>`
  }
  return `<table style="border-collapse:separate;border-spacing:1px;"><tbody>${html}</tbody></table>`
}

/* ── Helper: Set Code A/B/C/D — inner div circles ── */
function setCodeGrid(c: string): string {
  let cells = ''
  ;['A', 'B', 'C', 'D'].forEach((l, i) => {
    cells += `<td style="width:24px;height:24px;text-align:center;vertical-align:middle;padding:2px;"><div style="width:20px;height:20px;border:1.5px solid ${c};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${c};background:white;">${l}</div></td>`
    if ((i + 1) % 2 === 0 && i < 3) cells += '</tr><tr>'
  })
  return `<table style="border-collapse:separate;border-spacing:2px;"><tbody><tr>${cells}</tr></tbody></table>`
}

/* ── Helper: Subject Code A-Z — inner div circles ── */
function subjectCodeGrid(c: string): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  let cells = ''
  letters.forEach((l, i) => {
    cells += `<td style="width:18px;height:18px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:15px;height:15px;border:1.5px solid ${c};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:6px;font-weight:700;color:${c};background:white;">${l}</div></td>`
    if ((i + 1) % 13 === 0 && i < 25) cells += '</tr><tr>'
  })
  return `<table style="border-collapse:separate;border-spacing:1px;"><tbody><tr>${cells}</tr></tbody></table>`
}

/* ── Helper: Subject list with selection circles ── */
function subjectListTable(c: string, subjects: { name: string; nameBn: string }[], isBn: boolean): string {
  if (subjects.length === 0) return ''
  let rows = ''
  subjects.forEach((sub) => {
    rows += `<tr>
      <td style="padding:2px 6px;font-size:8px;color:#374151;white-space:nowrap;">${isBn ? sub.nameBn : sub.name}</td>
      <td style="padding:2px 4px;text-align:center;width:20px;"><div style="width:14px;height:14px;border:1.5px solid ${c};border-radius:50%;display:inline-block;"></div></td>
    </tr>`
  })
  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`
}

/* ── Helper: Examiner question columns — marks bubbles (0,1,2,3,5) ── */
function buildExaminerColumns(c: string, totalQ: number, marks: string[], qPerCol: number, isBn: boolean): string {
  const numCols = Math.ceil(totalQ / qPerCol)
  let html = ''
  for (let ci = 0; ci < Math.min(numCols, 4); ci++) {
    const start = ci * qPerCol + 1
    const end = Math.min((ci + 1) * qPerCol, totalQ)
    let rows = ''
    for (let q = start; q <= end; q++) {
      let bubs = ''
      marks.forEach((m) => {
        bubs += `<td style="width:20px;height:20px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:16px;height:16px;border:1.5px solid ${c};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:${c};background:white;">${m}</div></td>`
      })
      rows += `<tr>
        <td style="padding:2px 3px;font-size:9px;font-weight:700;color:#111827;text-align:center;border:1px solid ${c}33;width:22px;">${q}</td>
        <td style="padding:1px;"><table style="border-collapse:separate;border-spacing:1px;"><tbody><tr>${bubs}</tr></tbody></table></td>
      </tr>`
    }
    html += `<div style="flex:1;border:1.5px solid ${c};border-radius:4px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:${c};color:white;">
          <th style="padding:3px;font-size:8px;border:1px solid ${c};width:22px;">${isBn ? 'প্রশ্ন' : 'Q. No'}</th>
          <th style="padding:3px;font-size:8px;border:1px solid ${c};">${isBn ? 'নম্বর' : 'Marks'}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
  }
  return html
}

/* ── Helper: Bottom marks table — Q.No row + Mark row ── */
function bottomMarksTable(c: string, totalQ: number, isBn: boolean): string {
  const qCount = Math.min(totalQ, 20)
  let qCells = ''
  for (let i = 1; i <= qCount; i++) {
    qCells += `<td style="padding:3px;border:1px solid ${c}33;text-align:center;font-size:8px;font-weight:700;color:#111827;width:28px;">${i}</td>`
  }
  let mCells = ''
  for (let i = 0; i < qCount; i++) {
    mCells += `<td style="padding:3px;border:1px solid ${c}33;text-align:center;"><div style="width:14px;height:14px;border:1.5px solid ${c};border-radius:50%;display:inline-block;"></div></td>`
  }
  return `<table style="width:100%;border-collapse:collapse;">
    <thead><tr style="background:${c}11;">
      <th style="padding:3px;border:1px solid ${c}33;font-size:8px;width:30px;">${isBn ? 'প্রশ্ন' : 'Q. No'}</th>
      ${qCells}
    </tr></thead>
    <tbody><tr>
      <td style="padding:3px;border:1px solid ${c}33;font-size:8px;font-weight:700;color:#111827;">${isBn ? 'নম্বর' : 'Mark'}</td>
      ${mCells}
    </tr></tbody>
  </table>`
}

/* ── Main: Generate OMR HTML ── */
export async function generateOMRHtml(cfg: OMRConfig, isBn: boolean = true): Promise<string> {
  const c = cfg.themeColor || '#d81b60'
  const marks = ['0', '1', '2', '3', '5']
  const qPerCol = 10
  const schoolName = isBn ? cfg.institutionNameBn : cfg.institutionName
  const schoolAddr = cfg.institutionAddress || ''

  // Generate QR codes
  let qrStudentDataUrl = ''
  let qrExaminerDataUrl = ''
  if (cfg.showQRCode) {
    try {
      qrStudentDataUrl = await QRCode.toDataURL(`${cfg.serialNumber}|${cfg.className}|${cfg.examName}|${cfg.sheetFormat}`, {
        width: 80,
        margin: 1,
      })
    } catch {
      qrStudentDataUrl = ''
    }
    try {
      qrExaminerDataUrl = await QRCode.toDataURL(`${cfg.serialNumber}|${cfg.sessionName}|EXAMINER`, { width: 60, margin: 1 })
    } catch {
      qrExaminerDataUrl = ''
    }
  }

  const qrImg = qrStudentDataUrl
    ? `<img src="${qrStudentDataUrl}" style="width:65px;height:65px;" />`
    : cfg.showQRCode
      ? `<div style="width:65px;height:65px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">QR</div>`
      : ''
  const qrImg2 = qrExaminerDataUrl
    ? `<img src="${qrExaminerDataUrl}" style="width:55px;height:55px;" />`
    : cfg.showQRCode
      ? `<div style="width:55px;height:55px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">QR</div>`
      : ''

  const subListHtml = subjectListTable(c, cfg.subjects, isBn)

  // Student Info Row
  const studentInfoFields = [
    cfg.showRollNo ? `<span style="flex:1;">${isBn ? 'রোল' : 'Roll'}: ______________</span>` : '',
    `<span style="flex:2;">${isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}: __________________________________________</span>`,
    `<span>${isBn ? 'তারিখ' : 'Date'}: ______________</span>`,
  ]
    .filter(Boolean)
    .join('')

  // Student Bubble Area
  const studentBubbleParts: string[] = []
  if (cfg.showRollNo) {
    studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
      <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'রোল নম্বর' : 'Roll Number'}</div>
      ${digitGrid(c, 5, 14)}
    </div>`)
  }
  studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
    <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'শিক্ষার্থী আইডি' : 'Student ID'}</div>
    ${digitGrid(c, 10, 14)}
  </div>`)
  if (cfg.showRegistrationNo) {
    studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
      <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'রেজিস্ট্রেশন' : 'Reg. No'}</div>
      ${digitGrid(c, 10, 14)}
    </div>`)
  }
  studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
    <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'শিক্ষক কোড' : 'Teacher Code'}</div>
    ${digitGrid(c, 6, 14)}
  </div>`)
  if (cfg.showSetCode) {
    studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
      <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'সেট কোড' : 'Set Code'}</div>
      ${setCodeGrid(c)}
    </div>`)
  }
  if (cfg.showSubjects && subListHtml) {
    studentBubbleParts.push(`<div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:4px;min-width:140px;">
      <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'বিষয়' : 'Subject Name'}</div>
      ${subListHtml}
    </div>`)
  }
  if (cfg.showAdditionalPaper) {
    studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;text-align:center;">
      <div style="font-size:6px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'অতিরিক্ত' : 'No. of'}<br/>${isBn ? 'উত্তর পত্র' : 'Additional'}</div>
      ${digitGrid(c, 2, 12)}
    </div>`)
  }
  if (cfg.showQRCode && qrImg) {
    studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:3px;">
      ${qrImg}
      ${cfg.showStudentSignature ? `<div style="font-size:7px;color:#6b7280;">${isBn ? 'শিক্ষার্থীর স্বাক্ষর' : 'Student Sign'}</div>` : ''}
    </div>`)
  } else if (cfg.showStudentSignature) {
    studentBubbleParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:80px;height:70px;">
      <div style="border-bottom:1px dashed #d1d5db;width:100%;margin-bottom:4px;"></div>
      <div style="font-size:7px;color:#6b7280;">${isBn ? 'শিক্ষার্থীর স্বাক্ষর' : 'Student Sign'}</div>
    </div>`)
  }

  // Examiner Bubble Area
  const examinerParts: string[] = []
  if (cfg.showExaminerSection) {
    if (cfg.showSubjectCode) {
      examinerParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'বিষয় কোড' : 'Subject Code'}</div>
        ${subjectCodeGrid(c)}
      </div>`)
    }
    if (cfg.showSubjects && subListHtml) {
      examinerParts.push(`<div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:4px;min-width:140px;">
        <div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${isBn ? 'বিষয়' : 'Subject Name'}</div>
        ${subListHtml}
      </div>`)
    }
    if (cfg.showAdditionalPaper) {
      examinerParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="font-size:6px;font-weight:800;color:${c};text-align:center;border-bottom:1px solid ${c}33;padding-bottom:2px;width:100%;">${isBn ? 'অতিরিক্ত' : 'No. of'}<br/>${isBn ? 'উত্তর পত্র' : 'Additional'}</div>
        ${digitGrid(c, 2, 12)}
        ${qrImg2}
        <div style="font-size:7px;color:#6b7280;font-weight:600;">SN</div>
      </div>`)
    }
    examinerParts.push(`<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;justify-content:space-between;font-size:7px;color:#6b7280;text-align:center;min-width:80px;">
      <div style="border-bottom:1px solid #d1d5db;padding-bottom:4px;margin-bottom:4px;">${isBn ? 'পরীক্ষকের স্বাক্ষর ও সীল' : "Invigilator's"}<br/>${isBn ? '' : 'Signature & Seal'}</div>
      <div style="border-bottom:1px solid #d1d5db;padding-bottom:4px;margin-bottom:4px;">${isBn ? 'কেন্দ্র কোড' : 'Center Code'}</div>
      <div>${isBn ? 'তারিখ' : 'Date'}</div>
    </div>`)
  }

  // Instructions
  const instructionsHtml = cfg.showInstructions
    ? `<div style="margin-top:6px;padding:6px 10px;border:1px dashed ${c}55;border-radius:4px;font-size:7px;color:#6b7280;">
      <div style="font-weight:700;color:${c};margin-bottom:4px;text-align:center;font-size:8px;">${isBn ? 'শিক্ষার্থীদের জন্য নির্দেশনা' : 'Instructions for Students'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 20px;">
        <div>1. ${isBn ? 'কালো বা লাল বলপয়েন্ট কলম ব্যবহার করুন' : 'Use a black ballpoint pen to fill the circles.'}</div>
        <div>3. ${isBn ? 'করেকশন ফ্লুইড বা ইরেজার ব্যবহার করবেন না' : 'Do not use correction fluid or eraser.'}</div>
        <div>2. ${isBn ? 'বৃত্ত সম্পূর্ণ ভর্তি করুন' : 'Fill the circle completely.'}</div>
        <div>4. ${isBn ? 'শিট মোড়াবেন না বা ক্ষতিগ্রস্ত করবেন না' : 'Do not fold or damage the OMR sheet.'}</div>
      </div>
    </div>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  @page{size:A4;margin:5mm 5mm;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1f2937;font-size:8px;background:white;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:white;}}
  .no-print{margin:10px auto;text-align:center;}
  @media print{.no-print{display:none!important;}}
</style></head><body>

<div class="no-print">
  <button onclick="window.print()" style="padding:10px 28px;font-size:14px;background:${c};color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
    ${isBn ? '🖨️ প্রিন্ট / PDF ডাউনলোড' : '🖨️ Print / Download PDF'}
  </button>
</div>

<div style="border:2px solid ${c};padding:10px;position:relative;max-width:210mm;margin:0 auto;">

  <!-- ═══ HEADER ═══ -->
  <div style="text-align:center;margin-bottom:6px;padding-bottom:5px;border-bottom:2px solid ${c};">
    <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:4px;">
      <div style="width:60px;height:60px;border-radius:50%;border:2px solid ${c};display:flex;align-items:center;justify-content:center;font-size:7px;color:${c};font-weight:700;overflow:hidden;">LOGO</div>
      <div>
        <h1 style="font-size:18px;font-weight:800;color:${c};margin-bottom:1px;">${schoolName}</h1>
        <div style="font-size:9px;color:#6b7280;">${schoolAddr}</div>
      </div>
    </div>
    <div style="font-size:10px;color:#374151;margin-bottom:2px;">${cfg.sessionName}</div>
    <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:2px;">${isBn ? cfg.classNameBn : cfg.className}</div>
    <div style="font-size:12px;font-weight:700;color:${c};margin-bottom:3px;">${isBn ? cfg.examNameBn : cfg.examName}</div>
    <div style="font-size:7px;color:#6b7280;">${isBn ? 'অবশ্যই কালো বা লাল পয়েন্ট কলম দিয়ে বৃত্ত ভর্তি করতে হবে' : 'Fill bubbles with black or red pen only'}</div>
  </div>

  <!-- SERIAL NUMBER -->
  <div style="position:absolute;top:14px;right:14px;text-align:right;">
    <div style="font-size:11px;font-weight:800;color:${c};">#SN : ${cfg.serialNumber}</div>
  </div>

  <!-- ═══ STUDENT PART ═══ -->
  <div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${c};margin-bottom:4px;border-bottom:1px solid ${c}33;padding-bottom:2px;">
      ${isBn ? 'শিক্ষার্থীর অংশ' : 'Student Part'}
    </div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;padding:4px 6px;border:1.5px solid ${c};border-radius:4px;font-size:8px;color:#374151;margin-bottom:5px;">
      ${studentInfoFields}
    </div>
    <div style="display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap;">
      ${studentBubbleParts.join('')}
    </div>
  </div>

  <!-- ═══ EXAMINER'S PART ═══ -->
  ${
    cfg.showExaminerSection
      ? `<div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${c};margin-bottom:4px;border-bottom:1px solid ${c}33;padding-bottom:2px;">
      ${isBn ? 'পরীক্ষকের অংশ' : "Examiner's Part"}
    </div>
    <div style="display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap;">
      <div style="flex:1;display:flex;gap:3px;">
        ${buildExaminerColumns(c, cfg.totalQuestions, marks, qPerCol, isBn)}
      </div>
      ${examinerParts.join('')}
    </div>
  </div>`
      : ''
  }

  <!-- ═══ BOTTOM: RESULT RECORDING TABLE ═══ -->
  <div style="display:flex;gap:5px;padding:4px;border:1.5px solid ${c};border-radius:4px;margin-bottom:4px;">
    <div style="flex:1;">
      ${bottomMarksTable(c, cfg.totalQuestions, isBn)}
    </div>
    <div style="width:90px;display:flex;flex-direction:column;gap:3px;font-size:7px;color:#6b7280;">
      <div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;">
        <div style="font-weight:700;color:${c};">${isBn ? 'মোট নম্বর' : 'Total Mark'}</div>
        <div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div>
      </div>
      <div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;">
        <div style="font-weight:700;color:${c};">${isBn ? 'উপস্থিত' : 'Present'}</div>
        <div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div>
      </div>
      <div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;">
        <div style="font-weight:700;color:${c};">${isBn ? 'অনুপস্থিত' : 'Absent'}</div>
        <div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div>
      </div>
    </div>
  </div>

  <!-- ═══ VERIFICATION AREA ═══ -->
  <div style="display:flex;gap:5px;margin-bottom:4px;">
    <div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:6px;text-align:center;">
      <div style="font-size:7px;font-weight:700;color:${c};margin-bottom:4px;">${isBn ? 'যাচাইকারী' : 'Checked By'}</div>
      <div style="font-size:7px;color:#6b7280;">(${isBn ? 'নাম ও স্বাক্ষর' : 'Name & Sign'})</div>
      <div style="border-bottom:1px dashed #d1d5db;margin-top:12px;"></div>
    </div>
    <div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:6px;text-align:center;">
      <div style="font-size:7px;font-weight:700;color:${c};margin-bottom:4px;">${isBn ? 'যাচাইকারী' : 'Verified By'}</div>
      <div style="font-size:7px;color:#6b7280;">(${isBn ? 'নাম ও স্বাক্ষর' : 'Name & Sign'})</div>
      <div style="border-bottom:1px dashed #d1d5db;margin-top:12px;"></div>
    </div>
  </div>

  <!-- ═══ INSTRUCTIONS ═══ -->
  ${instructionsHtml}

  <!-- ═══ FOOTER ═══ -->
  <div style="text-align:center;margin-top:5px;padding-top:3px;border-top:1.5px solid ${c};font-size:7px;color:#9ca3af;">
    ${schoolName} &bull; OMR Sheet &bull; ${isBn ? 'ফরম্যাট' : 'Format'}: ${cfg.sheetFormat} &bull; ${cfg.serialNumber}
  </div>

</div>
</body></html>`
}

export function generateOMRSheet(cfg: OMRConfig, isBn: boolean = true) {
  generateOMRHtml(cfg, isBn).then((html) => {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 600)
    }
  })
}
