import QRCode from 'qrcode'
import { escapeHtml } from '@/lib/sanitize'

const bn = (n: number): string => {
  const d = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n)
    .split('')
    .map((c) => d[parseInt(c)] || c)
    .join('')
}

export type MarksEntryStyle = 'abcd' | 'bn' | 'numbers' | 'custom'
export type PaperSize = 'A4' | 'Legal' | 'Letter'

export interface OMRConfig {
  institutionName: string
  institutionNameBn: string
  institutionAddress: string
  logo: string
  sessionName: string
  className: string
  classNameBn: string
  examName: string
  examNameBn: string
  subjectName: string
  subjectNameBn: string
  groupName: string
  groupNameBn: string
  sectionName: string
  themeColor: string
  serialNumber: string
  paperSize: PaperSize
  sheetFormat: 'A' | 'B' | 'C' | 'D'
  totalQuestions: number
  optionCount: number
  correctMark: number
  negativeMark: number
  subjects: { name: string; nameBn: string }[]
  showStudentName: boolean
  showRollNo: boolean
  showStudentId: boolean
  showRegistrationNo: boolean
  showClass: boolean
  showSection: boolean
  showGroup: boolean
  showExamName: boolean
  showSubjectName: boolean
  showSubjectCode: boolean
  showSetCode: boolean
  showDate: boolean
  showStudentSignature: boolean
  showStudentPhoto: boolean
  showQRCode: boolean
  showBarcode: boolean
  showSerialNumber: boolean
  showSecurityCode: boolean
  showVerificationCode: boolean
  showTeacherCode: boolean
  showInvigilatorCode: boolean
  showRoomNumber: boolean
  showSeatNumber: boolean
  showAdditionalPaper: boolean
  showPresentAbsent: boolean
  showExaminerRemarks: boolean
  showExaminerSection: boolean
  marksEntryStyle: MarksEntryStyle
  customMarksValues: string
  showExaminerSignature: boolean
  showHeadExaminerSignature: boolean
  showVerificationSignature: boolean
  showCheckedBy: boolean
  showVerifiedBy: boolean
  showTotalMarks: boolean
  showPracticalMarks: boolean
  showVivaMarks: boolean
  showInstructions: boolean
}

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

function optionGrid(c: string, opts: string[], sz: number = 16): string {
  let cells = ''
  opts.forEach((l, i) => {
    cells += `<td style="width:${sz + 4}px;height:${sz + 4}px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:${sz}px;height:${sz}px;border:1.5px solid ${c};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:${sz > 18 ? 9 : 7}px;font-weight:700;color:${c};background:white;">${l}</div></td>`
    if ((i + 1) % 2 === 0 && i < opts.length - 1) cells += '</tr><tr>'
  })
  return `<table style="border-collapse:separate;border-spacing:2px;"><tbody><tr>${cells}</tr></tbody></table>`
}

function subjectCodeGrid(c: string): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  let cells = ''
  letters.forEach((l, i) => {
    cells += `<td style="width:18px;height:18px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:15px;height:15px;border:1.5px solid ${c};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:6px;font-weight:700;color:${c};background:white;">${l}</div></td>`
    if ((i + 1) % 13 === 0 && i < 25) cells += '</tr><tr>'
  })
  return `<table style="border-collapse:separate;border-spacing:1px;"><tbody><tr>${cells}</tr></tbody></table>`
}

function buildExaminerColumns(c: string, totalQ: number, options: string[], qPerCol: number, isBn: boolean): string {
  const numCols = Math.ceil(totalQ / qPerCol)
  let html = ''
  for (let ci = 0; ci < Math.min(numCols, 4); ci++) {
    const start = ci * qPerCol + 1
    const end = Math.min((ci + 1) * qPerCol, totalQ)
    let rows = ''
    for (let q = start; q <= end; q++) {
      let bubs = ''
      options.forEach((m) => {
        bubs += `<td style="width:20px;height:20px;text-align:center;vertical-align:middle;padding:1px;"><div style="width:16px;height:16px;border:1.5px solid ${c};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:${c};background:white;">${escapeHtml(m)}</div></td>`
      })
      rows += `<tr>
        <td style="padding:2px 3px;font-size:9px;font-weight:700;color:#111827;text-align:center;border:1px solid ${c}33;width:22px;">${q}</td>
        <td style="padding:1px;"><table style="border-collapse:separate;border-spacing:1px;"><tbody><tr>${bubs}</tr></tbody></table></td>
      </tr>`
    }
    html += `<div style="flex:1;min-width:100px;border:1.5px solid ${c};border-radius:4px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:${c};color:white;">
          <th style="padding:3px;font-size:8px;border:1px solid ${c};width:22px;">${isBn ? 'প্রশ্ন' : 'Q'}</th>
          <th style="padding:3px;font-size:8px;border:1px solid ${c};">${isBn ? 'উত্তর' : 'Ans'}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
  }
  return html
}

function bottomMarksTable(c: string, totalQ: number, isBn: boolean): string {
  const qCount = Math.min(totalQ, 20)
  let qCells = ''
  for (let i = 1; i <= qCount; i++) {
    qCells += `<td style="padding:2px;border:1px solid ${c}33;text-align:center;font-size:7px;font-weight:700;color:#111827;width:24px;">${i}</td>`
  }
  let mCells = ''
  for (let i = 0; i < qCount; i++) {
    mCells += `<td style="padding:2px;border:1px solid ${c}33;text-align:center;"><div style="width:12px;height:12px;border:1.5px solid ${c};border-radius:50%;display:inline-block;"></div></td>`
  }
  return `<table style="width:100%;border-collapse:collapse;">
    <thead><tr style="background:${c}11;">
      <th style="padding:2px;border:1px solid ${c}33;font-size:7px;width:24px;">${isBn ? 'প্রশ্ন' : 'Q'}</th>
      ${qCells}
    </tr></thead>
    <tbody><tr>
      <td style="padding:2px;border:1px solid ${c}33;font-size:7px;font-weight:700;color:#111827;">${isBn ? 'নম্বর' : 'Mark'}</td>
      ${mCells}
    </tr></tbody>
  </table>`
}

function barcodePlaceholder(c: string): string {
  let bars = ''
  for (let i = 0; i < 40; i++) {
    const w = i % 3 === 0 ? 2 : 1
    bars += `<div style="width:${w}px;height:24px;background:${i % 5 === 0 ? '#000' : c};"></div>`
  }
  return `<div style="display:flex;align-items:flex-end;gap:0.5px;">${bars}</div>`
}

function getMarksOptions(style: MarksEntryStyle, custom: string, isBn: boolean): string[] {
  switch (style) {
    case 'bn':
      return ['ক', 'খ', 'গ', 'ঘ', 'ঙ']
    case 'numbers':
      return ['0', '1', '2', '3', '4', '5']
    case 'custom':
      return custom
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8)
    case 'abcd':
    default:
      return isBn ? ['ক', 'খ', 'গ', 'ঘ'] : ['A', 'B', 'C', 'D']
  }
}

function getPaperSizeStyle(paperSize: PaperSize): string {
  switch (paperSize) {
    case 'Legal': return 'size:legal;margin:5mm 5mm;'
    case 'Letter': return 'size:letter;margin:5mm 5mm;'
    case 'A4':
    default: return 'size:A4;margin:5mm 5mm;'
  }
}

export async function generateOMRHtml(cfg: OMRConfig, isBn: boolean = true, copyNumber: number = 1): Promise<string> {
  const c = cfg.themeColor || '#6366f1'
  const marksOpts = getMarksOptions(cfg.marksEntryStyle, cfg.customMarksValues, isBn)
  const qPerCol = 10
  const schoolName = isBn ? cfg.institutionNameBn : cfg.institutionName
  const schoolAddr = cfg.institutionAddress || ''
  const uniqueSN = `${cfg.serialNumber}-${String(copyNumber).padStart(4, '0')}`
  const securityToken = `SEC-${uniqueSN}-${Date.now().toString(36).toUpperCase()}`
  const verificationCode = `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  let qrStudentDataUrl = ''
  let qrExaminerDataUrl = ''
  if (cfg.showQRCode) {
    const studentPayload = JSON.stringify({
      sn: uniqueSN,
      cls: cfg.className,
      exam: cfg.examName,
      sub: cfg.subjectName,
      fmt: cfg.sheetFormat,
      sec: securityToken,
      ver: verificationCode,
    })
    const examinerPayload = JSON.stringify({ sn: uniqueSN, session: cfg.sessionName, role: 'EXAMINER', sec: securityToken })
    try {
      qrStudentDataUrl = await QRCode.toDataURL(studentPayload, { width: 80, margin: 1 })
    } catch {
      qrStudentDataUrl = ''
    }
    try {
      qrExaminerDataUrl = await QRCode.toDataURL(examinerPayload, { width: 60, margin: 1 })
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
    ? `<img src="${qrExaminerDataUrl}" style="width:50px;height:50px;" />`
    : cfg.showQRCode
      ? `<div style="width:50px;height:50px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">QR</div>`
      : ''

  const infoParts: string[] = []
  if (cfg.showStudentName)
    infoParts.push(`<span style="flex:2;">${isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}: __________________________________________</span>`)
  if (cfg.showRollNo) infoParts.push(`<span style="flex:1;">${isBn ? 'রোল' : 'Roll'}: ______________</span>`)
  if (cfg.showDate) infoParts.push(`<span>${isBn ? 'তারিখ' : 'Date'}: ______________</span>`)
  const studentInfoFields = infoParts.join('')

  const sbp: string[] = []
  const box = (title: string, content: string) =>
    `<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;"><div style="text-align:center;font-size:7px;font-weight:800;color:${c};margin-bottom:3px;border-bottom:1px solid ${c}33;padding-bottom:2px;">${title}</div>${content}</div>`

  if (cfg.showRollNo) sbp.push(box(isBn ? 'রোল নম্বর' : 'Roll Number', digitGrid(c, 5, 14)))
  if (cfg.showStudentId) sbp.push(box(isBn ? 'শিক্ষার্থী আইডি' : 'Student ID', digitGrid(c, 10, 14)))
  if (cfg.showRegistrationNo) sbp.push(box(isBn ? 'রেজিস্ট্রেশন' : 'Reg. No', digitGrid(c, 10, 14)))
  if (cfg.showTeacherCode) sbp.push(box(isBn ? 'শিক্ষক কোড' : 'Teacher Code', digitGrid(c, 6, 14)))
  if (cfg.showInvigilatorCode) sbp.push(box(isBn ? 'পরিদর্শক কোড' : 'Invigilator Code', digitGrid(c, 6, 14)))
  if (cfg.showSetCode) sbp.push(box(isBn ? 'সেট কোড' : 'Set Code', optionGrid(c, ['A', 'B', 'C', 'D'], 20)))
  if (cfg.showSubjectCode) sbp.push(box(isBn ? 'বিষয় কোড' : 'Subject Code', subjectCodeGrid(c)))
  if (cfg.showAdditionalPaper)
    sbp.push(box(`${isBn ? 'অতিরিক্ত' : 'Extra'}<br/>${isBn ? 'উত্তর পত্র' : 'Papers'}`, digitGrid(c, 2, 12)))
  if (cfg.showRoomNumber) sbp.push(box(isBn ? 'কক্ষ নং' : 'Room No', digitGrid(c, 3, 12)))
  if (cfg.showSeatNumber) sbp.push(box(isBn ? 'আসন নং' : 'Seat No', digitGrid(c, 3, 12)))

  const qrBlock: string[] = []
  if (cfg.showQRCode && qrImg) qrBlock.push(qrImg)
  if (cfg.showStudentPhoto)
    qrBlock.push(
      `<div style="width:55px;height:65px;border:1.5px solid ${c};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">${isBn ? 'ছবি' : 'Photo'}</div>`
    )
  if (cfg.showStudentSignature)
    qrBlock.push(`<div style="font-size:7px;color:#6b7280;text-align:center;">${isBn ? 'শিক্ষার্থীর স্বাক্ষর' : 'Student Sign'}</div>`)
  if (qrBlock.length > 0) {
    sbp.push(
      `<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:3px;">${qrBlock.join('')}</div>`
    )
  }

  const ep: string[] = []
  if (cfg.showAdditionalPaper)
    ep.push(box(`${isBn ? 'অতিরিক্ত' : 'Extra'}<br/>${isBn ? 'উত্তর পত্র' : 'Papers'}`, digitGrid(c, 2, 12)))
  if (cfg.showQRCode && qrImg2)
    ep.push(
      `<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:2px;">${qrImg2}<div style="font-size:7px;color:#6b7280;font-weight:600;">SN</div></div>`
    )

  const sigBoxes: string[] = []
  if (cfg.showExaminerSignature)
    sigBoxes.push(
      `<div style="flex:1;border:1.5px solid ${c};border-radius:3px;padding:4px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${c};margin-bottom:3px;">${isBn ? 'পরীক্ষক' : 'Examiner'}</div><div style="font-size:6px;color:#6b7280;">(${isBn ? 'স্বাক্ষর' : 'Sign'})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:10px;"></div></div>`
    )
  if (cfg.showHeadExaminerSignature)
    sigBoxes.push(
      `<div style="flex:1;border:1.5px solid ${c};border-radius:3px;padding:4px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${c};margin-bottom:3px;">${isBn ? 'প্রধান পরীক্ষক' : 'Head Examiner'}</div><div style="font-size:6px;color:#6b7280;">(${isBn ? 'স্বাক্ষর' : 'Sign'})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:10px;"></div></div>`
    )
  if (cfg.showVerificationSignature)
    sigBoxes.push(
      `<div style="flex:1;border:1.5px solid ${c};border-radius:3px;padding:4px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${c};margin-bottom:3px;">${isBn ? 'নিশ্চিতকারী' : 'Verifier'}</div><div style="font-size:6px;color:#6b7280;">(${isBn ? 'স্বাক্ষর' : 'Sign'})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:10px;"></div></div>`
    )
  if (sigBoxes.length > 0) ep.push(`<div style="display:flex;gap:3px;">${sigBoxes.join('')}</div>`)

  if (cfg.showExaminerRemarks) {
    ep.push(
      `<div style="border:1.5px solid ${c};border-radius:4px;padding:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${c};margin-bottom:4px;">${isBn ? 'পরীক্ষকের মন্তব্য' : "Examiner's Remarks"}</div><div style="border:1px dashed ${c}55;border-radius:2px;height:40px;"></div></div>`
    )
  }

  const verifyParts: string[] = []
  if (cfg.showCheckedBy)
    verifyParts.push(
      `<div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${c};margin-bottom:4px;">${isBn ? 'যাচাইকারী' : 'Checked By'}</div><div style="font-size:6px;color:#6b7280;">(${isBn ? 'নাম ও স্বাক্ষর' : 'Name & Sign'})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:12px;"></div></div>`
    )
  if (cfg.showVerifiedBy)
    verifyParts.push(
      `<div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:${c};margin-bottom:4px;">${isBn ? 'প্রত্যায়নকারী' : 'Verified By'}</div><div style="font-size:6px;color:#6b7280;">(${isBn ? 'নাম ও স্বাক্ষর' : 'Name & Sign'})</div><div style="border-bottom:1px dashed #d1d5db;margin-top:12px;"></div></div>`
    )

  const summaryParts: string[] = []
  if (cfg.showTotalMarks)
    summaryParts.push(
      `<div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${c};font-size:7px;">${isBn ? 'মোট নম্বর' : 'Total'}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`
    )
  if (cfg.showPracticalMarks)
    summaryParts.push(
      `<div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${c};font-size:7px;">${isBn ? 'প্র্যাকটিক্যাল' : 'Practical'}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`
    )
  if (cfg.showVivaMarks)
    summaryParts.push(
      `<div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${c};font-size:7px;">${isBn ? 'ভিভা' : 'Viva'}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`
    )
  if (cfg.showPresentAbsent) {
    summaryParts.push(
      `<div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${c};font-size:7px;">${isBn ? 'উপস্থিত' : 'Present'}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`
    )
    summaryParts.push(
      `<div style="border:1.5px solid ${c};padding:3px;border-radius:3px;text-align:center;"><div style="font-weight:700;color:${c};font-size:7px;">${isBn ? 'অনুপস্থিত' : 'Absent'}</div><div style="border-bottom:1px dashed #d1d5db;margin-top:6px;"></div></div>`
    )
  }

  const instructionsHtml = cfg.showInstructions
    ? `<div style="margin-top:6px;padding:6px 10px;border:1px dashed ${c}55;border-radius:4px;font-size:7px;color:#6b7280;">
      <div style="font-weight:700;color:${c};margin-bottom:4px;text-align:center;font-size:8px;">${isBn ? 'শিক্ষার্থীদের জন্য নির্দেশনা' : 'Instructions for Students'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 20px;">
        <div>1. ${isBn ? 'কালো বা নীল বলপয়েন্ট কলম ব্যবহার করুন' : 'Use black/blue ballpoint pen'}</div>
        <div>3. ${isBn ? 'করেকশন ফ্লুইড বা ইরেজার ব্যবহার করবেন না' : 'No correction fluid/eraser'}</div>
        <div>2. ${isBn ? 'বৃত্ত সম্পূর্ণ ভর্তি করুন' : 'Fill circles completely'}</div>
        <div>4. ${isBn ? 'শিট মোড়াবেন না বা ক্ষতিগ্রস্ত করবেন না' : 'Do not fold or damage'}</div>
      </div>
    </div>`
    : ''

  const paperSizeStyle = getPaperSizeStyle(cfg.paperSize || 'A4')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  @page{${paperSizeStyle}}
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

  <!-- HEADER -->
  <div style="text-align:center;margin-bottom:6px;padding-bottom:5px;border-bottom:2px solid ${c};">
    <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:4px;">
      <div style="width:60px;height:60px;border-radius:50%;border:2px solid ${c};display:flex;align-items:center;justify-content:center;font-size:7px;color:${c};font-weight:700;overflow:hidden;">${cfg.logo ? `<img src="${cfg.logo}" style="width:100%;height:100%;object-fit:cover;" />` : escapeHtml(schoolName.charAt(0))}</div>
      <div>
        <h1 style="font-size:18px;font-weight:800;color:${c};margin-bottom:1px;">${escapeHtml(schoolName)}</h1>
        <div style="font-size:9px;color:#6b7280;">${escapeHtml(schoolAddr)}</div>
      </div>
      ${cfg.showBarcode ? `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">${barcodePlaceholder(c)}<div style="font-size:6px;color:#9ca3af;">${escapeHtml(uniqueSN)}</div></div>` : ''}
    </div>
    <div style="font-size:10px;color:#374151;margin-bottom:2px;">${escapeHtml(cfg.sessionName)}</div>
    ${cfg.showClass ? `<div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:2px;">${escapeHtml(isBn ? cfg.classNameBn : cfg.className)}</div>` : ''}
    ${cfg.showGroup && cfg.groupName ? `<div style="font-size:10px;color:#374151;margin-bottom:1px;">${escapeHtml(isBn ? cfg.groupNameBn : cfg.groupName)}</div>` : ''}
    ${cfg.showSection && cfg.sectionName ? `<div style="font-size:10px;color:#374151;margin-bottom:1px;">${isBn ? 'শাখা' : 'Section'}: ${escapeHtml(cfg.sectionName)}</div>` : ''}
    ${cfg.showExamName ? `<div style="font-size:12px;font-weight:700;color:${c};margin-bottom:3px;">${escapeHtml(isBn ? cfg.examNameBn : cfg.examName)}</div>` : ''}
    ${cfg.showSubjectName ? `<div style="font-size:10px;color:#374151;margin-bottom:2px;">${escapeHtml(isBn ? cfg.subjectNameBn : cfg.subjectName)}</div>` : ''}
    <div style="font-size:7px;color:#6b7280;">${isBn ? 'অবশ্যই কালো বা নীল পয়েন্ট কলম দিয়ে বৃত্ত ভর্তি করতে হবে' : 'Fill bubbles with black or blue pen'}</div>
  </div>

  <!-- SERIAL + SECURITY + VERIFICATION -->
  ${cfg.showSerialNumber ? `<div style="position:absolute;top:10px;right:14px;text-align:right;"><div style="font-size:11px;font-weight:800;color:${c};">#${escapeHtml(uniqueSN)}</div></div>` : ''}
  ${cfg.showSecurityCode ? `<div style="position:absolute;top:24px;right:14px;text-align:right;"><div style="font-size:6px;color:#9ca3af;">SEC: ${escapeHtml(securityToken)}</div></div>` : ''}
  ${cfg.showVerificationCode ? `<div style="position:absolute;top:36px;right:14px;text-align:right;"><div style="font-size:6px;color:#9ca3af;">VER: ${escapeHtml(verificationCode)}</div></div>` : ''}

  <!-- STUDENT PART -->
  <div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${c};margin-bottom:4px;border-bottom:1px solid ${c}33;padding-bottom:2px;">
      ${isBn ? 'শিক্ষার্থীর অংশ' : 'Student Part'}
    </div>
    ${studentInfoFields ? `<div style="display:flex;gap:5px;flex-wrap:wrap;padding:4px 6px;border:1.5px solid ${c};border-radius:4px;font-size:8px;color:#374151;margin-bottom:5px;">${studentInfoFields}</div>` : ''}
    <div style="display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap;">
      ${sbp.join('')}
    </div>
  </div>

  <!-- EXAMINER'S PART -->
  ${
    cfg.showExaminerSection
      ? `<div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${c};margin-bottom:4px;border-bottom:1px solid ${c}33;padding-bottom:2px;">
      ${isBn ? 'পরীক্ষকের অংশ' : "Examiner's Part"}
    </div>
    <div style="display:flex;gap:5px;align-items:flex-start;flex-wrap:wrap;">
      <div style="flex:1;display:flex;gap:3px;flex-wrap:wrap;">
        ${buildExaminerColumns(c, cfg.totalQuestions, marksOpts, qPerCol, isBn)}
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;min-width:80px;">
        ${ep.join('')}
      </div>
    </div>
  </div>`
      : ''
  }

  <!-- BOTTOM: RESULT TABLE + SUMMARY -->
  <div style="display:flex;gap:5px;padding:4px;border:1.5px solid ${c};border-radius:4px;margin-bottom:4px;">
    <div style="flex:1;">${bottomMarksTable(c, cfg.totalQuestions, isBn)}</div>
    ${summaryParts.length > 0 ? `<div style="width:90px;display:flex;flex-direction:column;gap:3px;font-size:7px;color:#6b7280;">${summaryParts.join('')}</div>` : ''}
  </div>

  <!-- VERIFICATION -->
  ${verifyParts.length > 0 ? `<div style="display:flex;gap:5px;margin-bottom:4px;">${verifyParts.join('')}</div>` : ''}

  <!-- INSTRUCTIONS -->
  ${instructionsHtml}

  <!-- FOOTER -->
  <div style="text-align:center;margin-top:5px;padding-top:3px;border-top:1.5px solid ${c};font-size:7px;color:#9ca3af;">
    ${escapeHtml(schoolName)} &bull; OMR Sheet &bull; ${isBn ? 'ফরম্যাট' : 'Format'}: ${cfg.sheetFormat} &bull; ${escapeHtml(uniqueSN)}
  </div>

</div>
</body></html>`
}

export function generateOMRSheet(cfg: OMRConfig, isBn: boolean = true, copyNumber: number = 1) {
  generateOMRHtml(cfg, isBn, copyNumber).then((html) => {
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 600)
    }
  })
}

export async function generateOMRSheetMultiCopy(cfg: OMRConfig, isBn: boolean, totalCopies: number): Promise<string> {
  let allHtml = ''
  for (let i = 1; i <= totalCopies; i++) {
    const html = await generateOMRHtml(cfg, isBn, i)
    allHtml += html.replace('</body></html>', '') + '<div style="page-break-after:always;"></div>'
  }
  allHtml += '</body></html>'
  return allHtml
}
