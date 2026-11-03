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
    const period = item.period ? `<span style="font-size:8px;color:#555;font-weight:400"> (${item.period})</span>` : ''
    const rem = item.note ? `<div style="font-size:7px;color:#555;font-style:italic">${item.note}</div>` : ''
    return `<tr>
      <td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center">${i + 1}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:left"><div style="font-weight:600">${name}${period}</div>${rem}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">৳${item.amount.toLocaleString()}</td>
    </tr>`
  }).join('')

  const copyHtml = (copyLabel: string) => `<div style="font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;width:100%;height:100%;padding:0 10px;display:flex;flex-direction:column;position:relative">
    ${watermarkHtml}
    <div style="display:flex;align-items:center;gap:14px;border-bottom:3px solid ${b.brandColor};padding-bottom:10px;margin-bottom:12px">
      ${logoHtml}
      <div style="flex:1;text-align:center">
        <div style="font-size:15px;font-weight:700;color:${b.brandColor}">${b.schoolName}</div>
        <div style="font-size:9px;color:#444;margin-top:2px">${b.address}</div>
      </div>
    </div>
    <div style="text-align:center;font-size:13px;font-weight:700;color:${b.brandColor};background:${b.brandColor}11;border:1px solid ${b.brandColor}33;border-radius:4px;padding:6px;margin-bottom:12px">
      ${isBn ? 'ফি রসিদ/ইনভয়েস' : 'Fee Receipt/Invoice'}: [${copyLabel}]
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
      <span><b>${isBn ? 'সেশন' : 'Session'}:</b> ${receipt.session || '—'}</span>
      <span><b>${isBn ? 'রসিদ নং' : 'Receipt No'}:</b> ${receipt.receiptNo}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:10px">
      <span><b>${isBn ? 'তারিখ' : 'Date'}:</b> ${receipt.date}</span>
      <span><b>${isBn ? 'সংগ্রাহক' : 'Collected By'}:</b> ${receipt.collectedBy || '—'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
      <span><b>${isBn ? 'নাম' : 'Name'}:</b> ${isBn ? (receipt.studentNameBn || receipt.studentName) : receipt.studentName}</span>
      <span><b>${isBn ? 'আইডি' : 'Student ID'}:</b> ${receipt.studentId}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
      <span><b>${isBn ? 'শ্রেণি' : 'Class'}:</b> ${receipt.class}</span>
      <span><b>${isBn ? 'সেকশন' : 'Section'}:</b> ${receipt.section || '—'}</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px">
      <thead>
        <tr>
          <th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:center;font-weight:600;width:30px">#</th>
          <th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:left;font-weight:600">${isBn ? 'ফি শিরোনাম' : 'Fee Head'}</th>
          <th style="background:${b.brandColor};color:#fff;padding:5px 8px;text-align:right;font-weight:600">${isBn ? 'পরিমাণ' : 'Amount'}</th>
        </tr>
      </thead>
      <tbody>${feeRows}</tbody>
    </table>
    <div style="flex:1"></div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:6px">
      <table style="width:220px;border-collapse:collapse;font-size:10px">
        <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333">${isBn ? 'মোট' : 'Total'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:${b.brandColor}">৳${receipt.totalAmount.toLocaleString()}</td></tr>
        ${receipt.totalDiscount > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333">${isBn ? 'ছাড়' : 'Discount'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#d97706">৳${receipt.totalDiscount.toLocaleString()}</td></tr>` : ''}
        <tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333;border-top:2px solid ${b.brandColor}">${isBn ? 'পরিশোধিত' : 'Paid'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#16a34a;border-top:2px solid ${b.brandColor}">৳${receipt.totalReceived.toLocaleString()}</td></tr>
        ${receipt.totalDue > 0 ? `<tr><td style="padding:3px 8px;text-align:right;font-weight:600;color:#333;border-top:2px solid #dc2626">${isBn ? 'বকেয়' : 'Balance'}:</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#dc2626;border-top:2px solid #dc2626">৳${receipt.totalDue.toLocaleString()}</td></tr>` : ''}
      </table>
    </div>
    <div style="font-size:11px;color:#333;margin-bottom:5px"><b>${isBn ? 'কথায়' : 'In words'}:</b> ${numberToWords(receipt.totalReceived)} Taka Only.</div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#333;margin-bottom:5px">
      <span><b>${isBn ? 'পদ্ধতি' : 'Mode'}:</b> ${receipt.paymentMethod.toUpperCase()}</span>
      ${receipt.totalDue > 0 ? `<span><b>${isBn ? 'বকেয়' : 'BALANCE'}:</b> ৳${receipt.totalDue.toLocaleString()}</span>` : ''}
    </div>
    ${receipt.comment ? `<div style="font-size:11px;color:#333;margin-bottom:5px"><b>${isBn ? 'মন্তব্য' : 'Note'}:</b> ${receipt.comment}</div>` : ''}
    <div style="display:flex;justify-content:space-between;margin-top:25px;padding-top:10px">
      <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#333">${isBn ? 'ফি আদায়কারী' : 'Collected by'}</div></div>
      <div style="text-align:center;width:120px"><div style="border-top:1px solid #333;padding-top:4px;font-size:9px;color:#333">${isBn ? 'অভিভাবক' : 'Parent/Guardian'}</div></div>
    </div>
    <div style="text-align:center;font-size:8px;color:#555;margin-top:10px;padding-top:8px;border-top:1px dashed #ccc">${isBn ? 'একবার ফি পরিশোধ হলে ফেরত দেওয়া হবে না' : 'Fee once paid is not refundable'}</div>
  </div>`

  const leftCopy = copyHtml(isBn ? 'শিক্ষার্থী কপি' : 'Student Copy')
  const rightCopy = copyHtml(isBn ? 'প্রতিষ্ঠান কপি' : 'Institute Copy')
  const css = `@page{size:A4 landscape;margin:5mm}html,body{height:100%;margin:0;padding:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:5mm}.container{display:flex;gap:16px;height:100%}.copy{flex:1;height:100%;display:flex;flex-direction:column}.copy:first-child{border-right:2px dashed #ccc;padding-right:16px}th{background:${b.brandColor};color:#fff;padding:5px 8px;text-align:center;font-weight:600}@media print{html,body{height:100%!important;margin:0!important;padding:0!important}body{print-color-adjust:exact;-webkit-print-color-adjust:exact;color-adjust:exact;padding:5mm!important}}`
  const bodyHTML = `<div class="container" style="width:100%"><div class="copy">${leftCopy}</div><div class="copy">${rightCopy}</div></div>`

  openPrintWindow(receipt.receiptNo, bodyHTML, { css })
}
