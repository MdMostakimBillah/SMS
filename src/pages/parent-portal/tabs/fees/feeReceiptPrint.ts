import { openPrintWindow } from '@/lib/pdf'
import type { PortalChild, FeeItem } from '../../types'

interface InstitutionInfo {
  name?: string
  address?: string
}

export function printFeeReceipt(fee: FeeItem, child: PortalChild, institution: InstitutionInfo, isBn: boolean) {
  const css = `
    @page { size: 148mm 210mm; margin: 10mm; }
    body { font-family: sans-serif; color: #1e293b; margin: 0; padding: 10px; font-size: 11px; }
    .receipt-box { border: 2px solid #2563eb; border-radius: 8px; padding: 14px; }
    .hdr { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
    .sname { font-size: 16px; font-weight: bold; color: #1e3a8a; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
    .total-row { font-weight: bold; background: #eff6ff; }
    .ftr { margin-top: 30px; display: flex; justify-content: space-between; font-size: 9px; }
    .sig { width: 140px; border-top: 1px dashed #64748b; text-align: center; padding-top: 4px; }
  `
  const html = `
    <div class="receipt-box">
      <div class="hdr">
        <div class="sname">${institution.name || 'EduTech Smart School'}</div>
        <div style="font-size:9px;color:#64748b">${institution.address || ''}</div>
        <div style="font-size:12px;font-weight:bold;margin-top:4px;color:#2563eb">
          ${isBn ? 'মানি রিসিট / অর্থপ্রাপ্তির রশিদ' : 'STUDENT FEE PAYMENT RECEIPT'}
        </div>
      </div>

      <div class="meta">
        <div>
          <div><strong>${isBn ? 'শিক্ষার্থী:' : 'Student:'}</strong> ${child.nameEn} (${isBn ? child.nameBn : ''})</div>
          <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${child.class} &nbsp; <strong>${isBn ? 'রোল:' : 'Roll:'}</strong> ${child.roll}</div>
        </div>
        <div style="text-align:right">
          <div><strong>${isBn ? 'রশিদ নং:' : 'Receipt No:'}</strong> RCT-${fee.id.slice(-6).toUpperCase()}</div>
          <div><strong>${isBn ? 'তারিখ:' : 'Date:'}</strong> ${new Date().toLocaleDateString('en-GB')}</div>
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
            <td><strong>${isBn ? fee.titleBn : fee.title}</strong></td>
            <td>${fee.category}</td>
            <td style="text-align:right">৳${fee.paid.toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" style="text-align:right">${isBn ? 'মোট প্রাপ্তি:' : 'Total Received:'}</td>
            <td style="text-align:right">৳${fee.paid.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:9.5px;color:#16a34a;margin-top:6px">
        <strong>${isBn ? 'পেমেন্ট স্ট্যাটাস:' : 'Payment Status:'}</strong> PAID (Online / bKash Gateway)
      </div>

      <div class="ftr">
        <div class="sig">${isBn ? 'হিসাবরক্ষকের স্বাক্ষর' : 'Accountant Signature'}</div>
        <div class="sig">${isBn ? 'অভিভাবকের স্বাক্ষর' : 'Guardian Signature'}</div>
      </div>
    </div>
  `
  openPrintWindow('Fee_Receipt_' + fee.id, html, { css })
}
