import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { openPrintWindow } from '@/lib/pdf'
import { numberToWords } from '@/lib/numberToWords'

export interface ReceiptItem {
  feeName: string
  feeNameBn: string
  period?: string
  amount: number
  discount?: number
  note?: string
}

export interface FeeReceiptData {
  receiptNo: string
  date: string
  studentId: string
  studentName: string
  studentNameBn: string
  class: string
  section?: string
  session?: string
  paymentMethod: string
  collectedBy?: string
  comment?: string
  items: ReceiptItem[]
  totalAmount: number
  totalDiscount: number
  totalReceived: number
  totalDue: number
}

export function printFeeReceipt(receipt: FeeReceiptData, isBn = false): void {
  const b = getPDFBranding()
  const logoHtml = pdfLogoHTML(b, 50)
  const watermarkHtml = b.logo
    ? `<img src="${b.logo}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:350px;height:350px;opacity:0.05;pointer-events:none;object-fit:contain" />`
    : ''

  const feeRows = receipt.items.map((item, i) => {
    const name = isBn ? (item.feeNameBn || item.feeName) : item.feeName
    const period = item.period ? `<span style="font-size:9.5px;color:#64748b;font-weight:500"> (${item.period})</span>` : ''
    const rem = item.note ? `<div style="font-size:9px;color:#64748b;font-style:italic;margin-top:2px">${item.note}</div>` : ''
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:600;color:#64748b">${i + 1}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:left"><div style="font-weight:600;font-size:11.5px;color:#0f172a">${name}${period}</div>${rem}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-size:11.5px;color:#0f172a">৳${item.amount.toLocaleString()}</td>
    </tr>`
  }).join('')

  const copyHtml = (copyLabel: string) => `<div style="font-family:'Inter','Noto Sans Bengali','Hind Siliguri',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11.5px;color:#0f172a;width:100%;height:100%;padding:0 12px;display:flex;flex-direction:column;position:relative;-webkit-font-smoothing:antialiased">
    ${watermarkHtml}
    <div style="display:flex;align-items:center;gap:14px;border-bottom:2.5px solid ${b.brandColor};padding-bottom:10px;margin-bottom:12px">
      ${logoHtml}
      <div style="flex:1;text-align:center">
        <div style="font-size:17px;font-weight:800;color:${b.brandColor};letter-spacing:-0.01em;line-height:1.2">${b.schoolName}</div>
        <div style="font-size:10px;color:#475569;margin-top:3px;font-weight:500">${b.address}</div>
      </div>
    </div>
    <div style="text-align:center;font-size:12px;font-weight:700;color:${b.brandColor};background:${b.brandColor}12;border:1px solid ${b.brandColor}33;border-radius:6px;padding:6px 12px;margin-bottom:12px;letter-spacing:0.5px">
      ${isBn ? 'ফি রসিদ/ইনভয়েস' : 'Fee Receipt/Invoice'}: [${copyLabel}]
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:11px;margin-bottom:10px;background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0">
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'সেশন' : 'Session'}:</span> <span style="font-weight:600;color:#0f172a">${receipt.session || '—'}</span></div>
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'রসিদ নং' : 'Receipt No'}:</span> <span style="font-weight:700;color:${b.brandColor}">${receipt.receiptNo}</span></div>
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'তারিখ' : 'Date'}:</span> <span style="font-weight:600;color:#0f172a">${receipt.date}</span></div>
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'সংগ্রাহক' : 'Collected By'}:</span> <span style="font-weight:600;color:#0f172a">${receipt.collectedBy || '—'}</span></div>
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'নাম' : 'Name'}:</span> <span style="font-weight:700;color:#0f172a">${isBn ? (receipt.studentNameBn || receipt.studentName) : receipt.studentName}</span></div>
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'আইডি' : 'Student ID'}:</span> <span style="font-weight:600;color:#0f172a">${receipt.studentId}</span></div>
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'শ্রেণি' : 'Class'}:</span> <span style="font-weight:600;color:#0f172a">${receipt.class}</span></div>
      <div><span style="font-weight:600;color:#64748b">${isBn ? 'সেকশন' : 'Section'}:</span> <span style="font-weight:600;color:#0f172a">${receipt.section || '—'}</span></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px">
      <thead>
        <tr>
          <th style="background:${b.brandColor};color:#fff;padding:6px 10px;text-align:center;font-weight:700;font-size:10.5px;letter-spacing:0.5px;width:36px;border-top-left-radius:4px">#</th>
          <th style="background:${b.brandColor};color:#fff;padding:6px 10px;text-align:left;font-weight:700;font-size:10.5px;letter-spacing:0.5px">${isBn ? 'ফি বিবরণ' : 'Fee Particulars'}</th>
          <th style="background:${b.brandColor};color:#fff;padding:6px 10px;text-align:right;font-weight:700;font-size:10.5px;letter-spacing:0.5px;width:100px;border-top-right-radius:4px">${isBn ? 'পরিমাণ' : 'Amount'}</th>
        </tr>
      </thead>
      <tbody>${feeRows}</tbody>
    </table>
    <div style="flex:1"></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <table style="width:240px;border-collapse:collapse;font-size:11px">
        <tr><td style="padding:4px 8px;text-align:right;font-weight:600;color:#475569">${isBn ? 'মোট' : 'Total'}:</td><td style="padding:4px 8px;text-align:right;font-weight:700;font-size:12px;color:${b.brandColor}">৳${receipt.totalAmount.toLocaleString()}</td></tr>
        ${receipt.totalDiscount > 0 ? `<tr><td style="padding:4px 8px;text-align:right;font-weight:600;color:#d97706">${isBn ? 'ছাড়' : 'Discount'}:</td><td style="padding:4px 8px;text-align:right;font-weight:700;font-size:12px;color:#d97706">-৳${receipt.totalDiscount.toLocaleString()}</td></tr>` : ''}
        <tr><td style="padding:5px 8px;text-align:right;font-weight:700;color:#15803d;border-top:2px solid ${b.brandColor}">${isBn ? 'পরিশোধিত' : 'Paid'}:</td><td style="padding:5px 8px;text-align:right;font-weight:800;font-size:13px;color:#15803d;border-top:2px solid ${b.brandColor}">৳${receipt.totalReceived.toLocaleString()}</td></tr>
        ${receipt.totalDue > 0 ? `<tr><td style="padding:5px 8px;text-align:right;font-weight:700;color:#b91c1c;border-top:2px solid #b91c1c">${isBn ? 'বকেয়' : 'Balance'}:</td><td style="padding:5px 8px;text-align:right;font-weight:800;font-size:13px;color:#b91c1c;border-top:2px solid #b91c1c">৳${receipt.totalDue.toLocaleString()}</td></tr>` : ''}
      </table>
    </div>
    <div style="font-size:11px;color:#334155;margin-bottom:5px;line-height:1.4"><span style="font-weight:600;color:#64748b">${isBn ? 'কথায়' : 'In words'}:</span> <span style="font-weight:600;color:#0f172a">${numberToWords(receipt.totalReceived)} Taka Only.</span></div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#334155;margin-bottom:6px">
      <span><span style="font-weight:600;color:#64748b">${isBn ? 'পদ্ধতি' : 'Mode'}:</span> <span style="font-weight:600;text-transform:uppercase;color:#0f172a">${receipt.paymentMethod}</span></span>
      ${receipt.totalDue > 0 ? `<span style="font-weight:700;color:#b91c1c">${isBn ? 'বকেয়া' : 'BALANCE'}: ৳${receipt.totalDue.toLocaleString()}</span>` : ''}
    </div>
    ${receipt.comment ? `<div style="font-size:10.5px;color:#475569;margin-bottom:6px"><span style="font-weight:600;color:#64748b">${isBn ? 'মন্তব্য' : 'Note'}:</span> ${receipt.comment}</div>` : ''}
    <div style="display:flex;justify-content:space-between;margin-top:28px;padding-top:10px">
      <div style="text-align:center;width:130px"><div style="border-top:1px solid #64748b;padding-top:4px;font-size:10px;font-weight:600;color:#475569">${isBn ? 'ফি আদায়কারী' : 'Collected by'}</div></div>
      <div style="text-align:center;width:130px"><div style="border-top:1px solid #64748b;padding-top:4px;font-size:10px;font-weight:600;color:#475569">${isBn ? 'অভিভাবক' : 'Parent/Guardian'}</div></div>
    </div>
    <div style="text-align:center;font-size:9px;color:#64748b;margin-top:10px;padding-top:6px;border-top:1px dashed #cbd5e1;font-weight:500">${isBn ? 'একবার ফি পরিশোধ হলে ফেরত দেওয়া হবে না' : 'Fee once paid is not refundable'}</div>
  </div>`

  const leftCopy = copyHtml(isBn ? 'শিক্ষার্থী কপি' : 'Student Copy')
  const rightCopy = copyHtml(isBn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy')
  const css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap');@page{size:A4 landscape;margin:6mm}html,body{height:100%;margin:0;padding:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter','Noto Sans Bengali','Hind Siliguri',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11.5px;color:#0f172a;background:#fff;padding:4mm;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}.container{display:flex;gap:20px;height:100%}.copy{flex:1;height:100%;display:flex;flex-direction:column}.copy:first-child{border-right:2px dashed #cbd5e1;padding-right:20px}th{background:${b.brandColor};color:#fff;padding:6px 10px;text-align:center;font-weight:700}@media print{html,body{height:100%!important;margin:0!important;padding:0!important}body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;padding:4mm!important}}`
  const bodyHTML = `<div class="container" style="width:100%"><div class="copy">${leftCopy}</div><div class="copy">${rightCopy}</div></div>`

  openPrintWindow(receipt.receiptNo, bodyHTML, { css })
}
