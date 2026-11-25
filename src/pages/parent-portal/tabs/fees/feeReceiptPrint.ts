import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { escapeHtml } from '@/lib/sanitize'
import type { PortalChild, FeeItem } from '../../types'

interface InstitutionInfo {
  name?: string
  nameBn?: string
  address?: string
}

export function printFeeReceipt(fee: FeeItem, child: PortalChild, institution: InstitutionInfo, isBn: boolean) {
  const brand = getPDFBranding()
  const instName = (isBn ? institution.nameBn || institution.name : institution.name) || brand.schoolName || 'EduTech Smart School'
  const instAddr = institution.address || brand.address || ''
  const logoHtml = pdfLogoHTML(brand, 38)
  const receiptNo = fee.receiptNo || `RCT-${fee.id.slice(-6).toUpperCase()}`
  const paidDate = fee.lastPaidAt ? fee.lastPaidAt.split('T')[0] : new Date().toLocaleDateString('en-GB')
  const methodText = fee.lastPaymentMethod
    ? fee.lastPaymentMethod.toUpperCase()
    : fee.pendingMethod
    ? fee.pendingMethod.toUpperCase()
    : 'ONLINE / VERIFIED'
  const statusText = fee.due > 0
    ? isBn ? `আংশিক পরিশোধিত (বকেয়া: ৳${fee.due.toLocaleString()})` : `PARTIAL PAID (Balance Due: ৳${fee.due.toLocaleString()})`
    : isBn ? `সম্পূর্ণ পরিশোধিত (${methodText})` : `PAID (${methodText})`

  const css = `
    @page { size: 148mm 210mm; margin: 10mm; }
    body { font-family: 'Inter', 'Noto Sans Bengali', sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 11px; }
    .receipt-box { border: 2px solid ${brand.brandColor}; border-radius: 8px; padding: 14px; }
    .hdr { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid ${brand.brandColor}; padding-bottom: 8px; margin-bottom: 12px; }
    .hdr-text { flex: 1; text-align: center; }
    .sname { font-size: 15px; font-weight: 700; color: ${brand.brandColor}; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10px; line-height: 1.6; background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: ${brand.brandColor}; color: #fff; font-weight: 600; }
    .total-row { font-weight: 700; background: #f8fafc; }
    .ftr { margin-top: 32px; display: flex; justify-content: space-between; font-size: 9px; color: #475569; }
    .sig { width: 130px; border-top: 1px dashed #64748b; text-align: center; padding-top: 4px; }
  `
  const html = `
    <div class="receipt-box">
      <div class="hdr">
        ${logoHtml}
        <div class="hdr-text">
          <div class="sname">${escapeHtml(instName)}</div>
          ${instAddr ? `<div style="font-size:9px;color:#64748b">${escapeHtml(instAddr)}</div>` : ''}
          <div style="font-size:11.5px;font-weight:700;margin-top:4px;color:${brand.brandColor}">
            ${isBn ? 'মানি রিসিট / অর্থপ্রাপ্তির রশিদ' : 'STUDENT FEE PAYMENT RECEIPT'}
          </div>
        </div>
        <div style="width:38px"></div>
      </div>

      <div class="meta">
        <div>
          <div><strong>${isBn ? 'শিক্ষার্থী:' : 'Student:'}</strong> ${escapeHtml(child.nameEn)}${child.nameBn ? ` (${escapeHtml(child.nameBn)})` : ''}</div>
          <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${escapeHtml(child.class)} (${escapeHtml(child.section || '—')}) &nbsp; <strong>${isBn ? 'রোল:' : 'Roll:'}</strong> ${escapeHtml(child.roll || '—')}</div>
        </div>
        <div style="text-align:right">
          <div><strong>${isBn ? 'রশিদ নং:' : 'Receipt No:'}</strong> ${escapeHtml(receiptNo)}</div>
          <div><strong>${isBn ? 'তারিখ:' : 'Date:'}</strong> ${escapeHtml(paidDate)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>${isBn ? 'বিবরণ' : 'Description'}</th>
            <th>${isBn ? 'ক্যাটাগরি' : 'Category'}</th>
            <th style="text-align:right">${isBn ? 'পরিশোধিত টাকা' : 'Paid Amount'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td><strong>${escapeHtml(isBn ? fee.titleBn : fee.title)}</strong></td>
            <td>${escapeHtml((isBn ? fee.categoryBn : fee.category) || fee.category)}</td>
            <td style="text-align:right">৳${fee.paid.toLocaleString()}</td>
          </tr>
          ${fee.waived && fee.waived > 0 ? `
          <tr>
            <td colspan="3" style="text-align:right;color:#0f766e">${isBn ? 'ফি ছাড় (Waiver):' : 'Fee Waiver:'}</td>
            <td style="text-align:right;color:#0f766e">-৳${fee.waived.toLocaleString()}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td colspan="3" style="text-align:right">${isBn ? 'মোট প্রাপ্তি:' : 'Total Received:'}</td>
            <td style="text-align:right">৳${fee.paid.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:9.5px;color:${fee.due > 0 ? '#d97706' : '#16a34a'};margin-top:6px">
        <strong>${isBn ? 'পেমেন্ট স্ট্যাটাস:' : 'Payment Status:'}</strong> ${escapeHtml(statusText)}
      </div>

      <div class="ftr">
        <div class="sig">${isBn ? 'হিসাবরক্ষকের স্বাক্ষর' : 'Accountant Signature'}</div>
        <div class="sig">${isBn ? 'অভিভাবকের স্বাক্ষর' : 'Guardian Signature'}</div>
      </div>
    </div>
  `
  openPrintWindow('Fee_Receipt_' + fee.id, html, { css })
}
