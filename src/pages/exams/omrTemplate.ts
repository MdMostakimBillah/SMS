import QRCode from 'qrcode'

const bn = (n: number): string => {
  const d = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n)
    .split('')
    .map((c) => d[parseInt(c)] || c)
    .join('')
}

const bnOpts4 = ['ক', 'খ', 'গ', 'ঘ']
const bnOpts5 = ['ক', 'খ', 'গ', 'ঘ', 'ঙ']

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
  subjects: { name: string; nameBn: string }[]
}

function digitGrid(c: string, cols: number, sz: number): string {
  let html = ''
  for (let d = 0; d < 10; d++) {
    let cells = ''
    for (let ci = 0; ci < cols; ci++) {
      cells += `<td style="width:${sz}px;height:${sz}px;border:1.5px solid ${c};border-radius:50%;text-align:center;vertical-align:middle;font-size:${sz > 14 ? 8 : 7}px;font-weight:700;color:${c};background:white;">${bn(d)}</td>`
    }
    html += `<tr><td style="padding:0.5px;"><table style="border-collapse:collapse;"><tr>${cells}</tr></table></td></tr>`
  }
  return `<table style="border-collapse:collapse;">${html}</table>`
}

function setCodeGrid(c: string): string {
  let cells = ''
  ;['A', 'B', 'C', 'D'].forEach((l, i) => {
    cells += `<td style="width:20px;height:20px;border:1.5px solid ${c};border-radius:50%;text-align:center;vertical-align:middle;font-size:9px;font-weight:700;color:${c};background:white;">${l}</td>`
    if ((i + 1) % 2 === 0 && i < 3) cells += '</tr><tr>'
  })
  return `<table style="border-collapse:collapse;"><tr>${cells}</tr></table>`
}

function subjectCodeGrid(c: string): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  let cells = ''
  letters.forEach((l, i) => {
    cells += `<td style="width:16px;height:16px;border:1.5px solid ${c};border-radius:50%;text-align:center;vertical-align:middle;font-size:6px;font-weight:700;color:${c};background:white;">${l}</td>`
    if ((i + 1) % 13 === 0 && i < 25) cells += '</tr><tr>'
  })
  return `<table style="border-collapse:collapse;"><tr>${cells}</tr></table>`
}

function subjectListTable(c: string, subjects: { name: string; nameBn: string }[], isBn: boolean): string {
  if (subjects.length === 0) return ''
  let rows = ''
  subjects.forEach((sub, i) => {
    rows += `<tr>
      <td style="padding:1px 3px;font-size:7px;color:#374151;border:1px solid ${c}33;width:14px;text-align:center;font-weight:600;">${i + 1}</td>
      <td style="padding:1px 3px;font-size:7px;color:#374151;border:1px solid ${c}33;white-space:nowrap;">${isBn ? sub.nameBn : sub.name}</td>
      <td style="padding:2px;border:1px solid ${c}33;text-align:center;"><div style="width:14px;height:14px;border:1.5px solid ${c};border-radius:50%;display:inline-block;"></div></td>
    </tr>`
  })
  return `<table style="width:100%;border-collapse:collapse;">${rows}</table>`
}

function buildQuestionColumns(c: string, totalQ: number, options: string[], qPerCol: number, isBn: boolean): string {
  const numCols = Math.ceil(totalQ / qPerCol)
  let html = ''
  for (let ci = 0; ci < Math.min(numCols, 4); ci++) {
    const start = ci * qPerCol + 1
    const end = Math.min((ci + 1) * qPerCol, totalQ)
    let rows = ''
    for (let q = start; q <= end; q++) {
      let bubs = ''
      options.forEach((opt) => {
        bubs += `<td style="width:22px;height:22px;border:1.5px solid ${c};border-radius:50%;text-align:center;vertical-align:middle;font-size:9px;font-weight:700;color:${c};background:white;">${opt}</td>`
      })
      rows += `<tr>
        <td style="padding:2px 3px;font-size:9px;font-weight:700;color:#111827;text-align:center;border:1px solid ${c}33;width:18px;">${q}</td>
        <td style="padding:2px;"><table style="border-collapse:collapse;"><tr>${bubs}</tr></table></td>
      </tr>`
    }
    html += `<div style="flex:1;border:1.5px solid ${c};border-radius:4px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:${c};color:white;">
          <th style="padding:3px;font-size:8px;border:1px solid ${c};width:18px;">${isBn ? 'প্রশ্ন' : 'Q'}</th>
          <th style="padding:3px;font-size:8px;border:1px solid ${c};">${isBn ? 'উত্তর' : 'Ans'}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
  }
  return html
}

function bottomMarksTable(c: string, subjects: { name: string; nameBn: string }[], isBn: boolean): string {
  const rowCount = Math.max(subjects.length, 5)
  let rows = ''
  for (let i = 0; i < rowCount; i++) {
    const subName = subjects[i] ? (isBn ? subjects[i].nameBn : subjects[i].name) : ''
    let cells = ''
    for (let j = 0; j < 10; j++) {
      cells += `<td style="padding:2px;border:1px solid ${c}33;text-align:center;"><div style="width:11px;height:11px;border:1.5px solid ${c};border-radius:50%;display:inline-block;"></div></td>`
    }
    rows += `<tr>
      <td style="padding:2px 3px;border:1px solid ${c}33;font-size:7px;font-weight:600;color:#374151;white-space:nowrap;">${subName || i + 1}</td>
      ${cells}
    </tr>`
  }
  return `<table style="width:100%;border-collapse:collapse;font-size:7px;">
    <thead><tr style="background:${c}11;">
      <th style="padding:3px;border:1px solid ${c}33;font-size:7px;">${isBn ? 'বিষয়' : 'Sub'}</th>
      ${Array.from({ length: 10 }, (_, i) => `<th style="padding:3px;border:1px solid ${c}33;width:30px;font-size:7px;">${i + 1}</th>`).join('')}
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

export async function generateOMRHtml(cfg: OMRConfig, isBn: boolean = true): Promise<string> {
  const c = cfg.themeColor || '#d81b60'
  const options = cfg.optionCount === 5 ? bnOpts5 : bnOpts4
  const qPerCol = 10
  const schoolName = isBn ? cfg.institutionNameBn : cfg.institutionName
  const schoolAddr = cfg.institutionAddress || ''

  let qrDataUrl = ''
  try {
    qrDataUrl = await QRCode.toDataURL(`${cfg.examName}|${cfg.className}|${cfg.sheetFormat}`, { width: 80, margin: 1 })
  } catch {
    qrDataUrl = ''
  }

  let qr2DataUrl = ''
  try {
    qr2DataUrl = await QRCode.toDataURL(`${cfg.serialNumber}|${cfg.sessionName}`, { width: 60, margin: 1 })
  } catch {
    qr2DataUrl = ''
  }

  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" style="width:60px;height:60px;" />`
    : `<div style="width:60px;height:60px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">QR</div>`
  const qrImg2 = qr2DataUrl
    ? `<img src="${qr2DataUrl}" style="width:50px;height:50px;" />`
    : `<div style="width:50px;height:50px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:6px;color:#9ca3af;">QR</div>`

  const subListHtml = subjectListTable(c, cfg.subjects, isBn)

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
    🖨️ ${isBn ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Download PDF'}
  </button>
</div>

<div style="border:2px solid ${c};padding:10px;position:relative;max-width:210mm;margin:0 auto;">

  <!-- HEADER -->
  <div style="text-align:center;margin-bottom:6px;padding-bottom:5px;border-bottom:2px solid ${c};">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px;">
      <div style="width:55px;height:55px;border-radius:50%;border:2px solid ${c};display:flex;align-items:center;justify-content:center;font-size:7px;color:${c};font-weight:700;overflow:hidden;">LOGO</div>
      <div>
        <h1 style="font-size:17px;font-weight:800;color:${c};margin-bottom:1px;">${schoolName}</h1>
        <div style="font-size:9px;color:#6b7280;">${schoolAddr}</div>
      </div>
    </div>
    <div style="font-size:10px;color:#374151;margin-bottom:2px;">${cfg.sessionName}</div>
    <div style="font-size:14px;font-weight:800;color:#111827;margin-bottom:2px;">${isBn ? cfg.classNameBn : cfg.className}</div>
    <div style="font-size:11px;font-weight:700;color:${c};margin-bottom:3px;">${isBn ? cfg.examNameBn : cfg.examName}</div>
    <div style="font-size:7px;color:#6b7280;">${isBn ? 'অবশ্যই কালো বা লাল পয়েন্ট কলম দিয়ে বৃত্ত ভর্তি করতে হবে' : 'Fill bubbles with black or red pen only'}</div>
  </div>

  <!-- SERIAL NUMBER -->
  <div style="position:absolute;top:14px;right:14px;text-align:right;">
    <div style="font-size:10px;font-weight:800;color:${c};">#SN : ${cfg.serialNumber}</div>
  </div>

  <!-- STUDENT PART -->
  <div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${c};margin-bottom:4px;border-bottom:1px solid ${c}33;padding-bottom:2px;">
      ${isBn ? 'শিক্ষার্থীর অংশ' : 'Student Part'}
    </div>
    <div style="display:flex;gap:8px;margin-bottom:5px;padding:4px 6px;border:1.5px solid ${c};border-radius:4px;font-size:8px;color:#374151;">
      <span style="flex:1;">${isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}: _____________________________________</span>
      <span>${isBn ? 'শ্রেণি' : 'Class'}: __________</span>
      <span>${isBn ? 'শাখা' : 'Section'}: __________</span>
    </div>
    <div style="display:flex;gap:5px;align-items:flex-start;">
      ${
        cfg.showRollNo
          ? `<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'রোল নম্বর' : 'Roll Number'}</div>
        ${digitGrid(c, 5, 14)}
      </div>`
          : ''
      }
      <div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'শিক্ষার্থী আইডি' : 'Student ID'}</div>
        ${digitGrid(c, 10, 14)}
      </div>
      ${
        cfg.showRegistrationNo
          ? `<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'রেজিস্ট্রেশন' : 'Reg. No'}</div>
        ${digitGrid(c, 10, 14)}
      </div>`
          : ''
      }
      <div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'শিক্ষক কোড' : 'Teacher Code'}</div>
        ${digitGrid(c, 6, 14)}
      </div>
      ${
        cfg.showSetCode
          ? `<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'সেট কোড' : 'Set Code'}</div>
        ${setCodeGrid(c)}
      </div>`
          : ''
      }
      ${
        cfg.showSubjects && subListHtml
          ? `<div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'বিষয়' : 'Subject'}</div>
        ${subListHtml}
      </div>`
          : ''
      }
      <div style="border:1.5px solid ${c};border-radius:4px;padding:4px;text-align:center;">
        <div style="font-size:7px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'অতিরিক্ত' : 'Extra'}<br/>${isBn ? 'উত্তর পত্র' : 'Papers'}</div>
        ${digitGrid(c, 2, 12)}
      </div>
      <div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:4px;">
        ${qrImg}
        <div style="font-size:7px;color:#6b7280;">${isBn ? 'শিক্ষার্থীর স্বাক্ষর' : 'Student Sign'}</div>
      </div>
    </div>
  </div>

  <!-- EXAMINER'S PART -->
  <div style="margin-bottom:6px;">
    <div style="font-size:9px;font-weight:800;color:${c};margin-bottom:4px;border-bottom:1px solid ${c}33;padding-bottom:2px;">
      ${isBn ? 'পরীক্ষকের অংশ' : "Examiner's Part"}
    </div>
    <div style="display:flex;gap:5px;align-items:flex-start;">
      <div style="flex:1;display:flex;gap:3px;">
        ${buildQuestionColumns(c, cfg.totalQuestions, options, qPerCol, isBn)}
      </div>
      ${
        cfg.showSubjectCode
          ? `<div style="border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'বিষয় কোড' : 'Subject Code'}</div>
        ${subjectCodeGrid(c)}
      </div>`
          : ''
      }
      ${
        cfg.showSubjects && subListHtml
          ? `<div style="flex:1;border:1.5px solid ${c};border-radius:4px;padding:4px;">
        <div style="text-align:center;font-size:8px;font-weight:800;color:${c};margin-bottom:3px;">${isBn ? 'বিষয়' : 'Subject'}</div>
        ${subListHtml}
      </div>`
          : ''
      }
      <div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;align-items:center;gap:3px;">
        <div style="font-size:7px;font-weight:800;color:${c};text-align:center;">${isBn ? 'অতিরিক্ত' : 'Extra'}<br/>${isBn ? 'উত্তর পত্র' : 'Papers'}</div>
        ${digitGrid(c, 2, 12)}
        ${qrImg2}
        <div style="font-size:7px;color:#6b7280;font-weight:600;">SN</div>
      </div>
      <div style="border:1.5px solid ${c};border-radius:4px;padding:4px;display:flex;flex-direction:column;justify-content:space-between;font-size:7px;color:#6b7280;text-align:center;min-width:70px;">
        <div style="border-bottom:1px solid #d1d5db;padding-bottom:4px;margin-bottom:4px;">${isBn ? 'পরীক্ষকের স্বাক্ষর' : "Invigilator's"}<br/>${isBn ? '' : 'Sign'}</div>
        <div style="border-bottom:1px solid #d1d5db;padding-bottom:4px;margin-bottom:4px;">${isBn ? 'কেন্দ্র কোড' : 'Center Code'}</div>
        <div>${isBn ? 'তারিখ' : 'Date'}</div>
      </div>
    </div>
  </div>

  <!-- BOTTOM: MARKS TABLE -->
  <div style="display:flex;gap:5px;padding:4px;border:1.5px solid ${c};border-radius:4px;">
    <div style="flex:1;">
      ${bottomMarksTable(c, cfg.subjects, isBn)}
    </div>
    <div style="width:80px;display:flex;flex-direction:column;justify-content:space-between;font-size:7px;color:#6b7280;text-align:center;gap:3px;">
      <div style="border:1.5px solid ${c};padding:4px;border-radius:3px;">
        <div style="font-weight:700;color:${c};">${isBn ? 'মোট নম্বর' : 'Total'}</div>
        <div style="border-bottom:1px dashed #d1d5db;margin-top:8px;"></div>
      </div>
      <div style="border:1.5px solid ${c};padding:4px;border-radius:3px;">
        <div style="font-weight:700;color:${c};">${isBn ? 'পাশের নম্বর' : 'Pass'}</div>
        <div style="border-bottom:1px dashed #d1d5db;margin-top:8px;"></div>
      </div>
      <div style="border:1.5px solid ${c};padding:4px;border-radius:3px;">
        <div style="font-weight:700;color:${c};">${isBn ? 'গড় নম্বর' : 'Avg'}</div>
        <div style="border-bottom:1px dashed #d1d5db;margin-top:8px;"></div>
      </div>
      <div style="border:1.5px solid ${c};padding:4px;border-radius:3px;">
        <div style="font-weight:700;color:${c};">${isBn ? 'অনুপস্থিত' : 'Absent'}</div>
        <div style="border-bottom:1px dashed #d1d5db;margin-top:8px;"></div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
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
