import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML, pdfFooterHTML } from '@/lib/pdfBranding'
import { sanitizeHtml } from '@/lib/sanitize'
import type { Notice } from '@/store/noticeStore'

export const PRIORITY_LABELS: Record<string, { label: string; labelBn: string; color: string }> = {
  low: { label: 'Low', labelBn: 'কম', color: '#64748b' },
  medium: { label: 'Medium', labelBn: 'মাঝারি', color: '#3b82f6' },
  high: { label: 'High', labelBn: 'বেশি', color: '#f97316' },
  urgent: { label: 'Urgent', labelBn: 'জরুরি', color: '#ef4444' },
}

export const TARGET_LABELS: Record<string, { label: string; labelBn: string }> = {
  all: { label: 'All', labelBn: 'সকল' },
  students: { label: 'Students', labelBn: 'শিক্ষার্থী' },
  teachers: { label: 'Teachers', labelBn: 'শিক্ষক' },
  parents: { label: 'Parents', labelBn: 'অভিভাবক' },
}

export function printNoticePDF(notice: Notice, bn: boolean, logo?: string | null) {
  const brand = getPDFBranding()
  const logoHTML = pdfLogoHTML(brand, 38)
  const now = new Date()
  const dateStr = now.toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const displayTitle = (bn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
  const displayAuthor = (bn ? notice.authorBn || notice.author : notice.author || notice.authorBn) || ''
  const displayContent = (bn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''

  const priority = PRIORITY_LABELS[notice.priority] || PRIORITY_LABELS.medium
  const target = TARGET_LABELS[notice.target] || TARGET_LABELS.all

  const effectiveLogo = logo || brand.logo

  const css = `
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.6;
      position: relative;
    }

    /* Background Watermark Logo - ONLY shown on PDF print */
    .pdf-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 340px;
      height: 340px;
      opacity: 0.07;
      z-index: 0;
      pointer-events: none;
    }
    .pdf-watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .pdf-container {
      position: relative;
      z-index: 1;
    }

    .hdr {
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 2.5px solid ${brand.brandColor};
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .sname {
      font-size: 18px;
      font-weight: 700;
      color: ${brand.brandColor};
      letter-spacing: 0.3px;
    }
    .saddr {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.4;
      margin-top: 2px;
    }
    .notice-tag {
      margin-left: auto;
      text-align: right;
      font-size: 9px;
      color: #64748b;
    }
    .notice-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #ffffff;
      background: ${brand.brandColor};
      padding: 3px 10px;
      border-radius: 4px;
      margin-top: 4px;
    }

    .ttl {
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 16px 0 6px;
      line-height: 1.35;
    }
    .sub-ttl {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 12px;
    }

    .meta-box {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 10.5px;
      color: #475569;
    }
    .meta-item strong {
      color: #1e293b;
    }
    .chip {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 9.5px;
    }

    .content {
      line-height: 1.75;
      font-size: 12px;
      color: #1e293b;
    }
    .content h1 { font-size: 17px; font-weight: 700; margin: 14px 0 6px; color: ${brand.brandColor}; }
    .content h2 { font-size: 15px; font-weight: 700; margin: 12px 0 5px; color: #0f172a; }
    .content h3 { font-size: 13.5px; font-weight: 700; margin: 10px 0 4px; color: #1e293b; }
    .content p { margin-bottom: 10px; text-align: justify; }
    .content ul, .content ol { padding-left: 22px; margin-bottom: 10px; }
    .content li { margin-bottom: 4px; }
    .content blockquote {
      border-left: 3.5px solid ${brand.brandColor};
      background: #f8fafc;
      padding: 8px 12px;
      margin: 10px 0;
      font-style: italic;
      color: #334155;
      border-radius: 0 6px 6px 0;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11px;
    }
    .content th {
      background: ${brand.brandColor};
      color: #ffffff;
      padding: 7px 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid ${brand.brandColor};
    }
    .content td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
    }
    .content tr:nth-child(even) { background: #f8fafc; }

    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 10px;
    }
    .sig-box {
      text-align: center;
      width: 160px;
      border-top: 1px dashed #94a3b8;
      padding-top: 4px;
      font-size: 10px;
      color: #475569;
    }

    .ftr {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  `

  const bodyHTML = `
    ${effectiveLogo ? `
      <div class="pdf-watermark">
        <img src="${effectiveLogo}" alt="" />
      </div>
    ` : ''}

    <div class="pdf-container">
      <div class="hdr">
        ${logoHTML}
        <div>
          <div class="sname">${brand.schoolName}</div>
          ${brand.address ? `<div class="saddr">${brand.address}</div>` : ''}
          ${brand.phone ? `<div class="saddr">${brand.phone}${brand.email ? ' | ' + brand.email : ''}</div>` : ''}
        </div>
        <div class="notice-tag">
          <div>${bn ? 'মুদ্রণ তারিখ:' : 'Printed:'} ${dateStr}</div>
          <div class="notice-badge">${bn ? 'বিজ্ঞপ্তি' : 'OFFICIAL NOTICE'}</div>
        </div>
      </div>

      <div class="ttl">${displayTitle}</div>
      ${notice.titleBn && notice.titleBn !== notice.title && !bn ? `<div class="sub-ttl">${notice.titleBn}</div>` : ''}

      <div class="meta-box">
        <div class="meta-item"><strong>${bn ? 'প্রকাশ:' : 'Published:'}</strong> ${new Date(notice.publishedAt).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        <div class="meta-item"><strong>${bn ? 'কর্তৃপক্ষ:' : 'Authority:'}</strong> ${displayAuthor}</div>
        <div class="meta-item"><strong>${bn ? 'প্রাপক:' : 'Target:'}</strong> ${bn ? target.labelBn : target.label}</div>
        ${notice.category ? `<div class="meta-item"><strong>${bn ? 'ক্যাটাগরি:' : 'Category:'}</strong> <span class="chip" style="background:#e0e7ff;color:#3730a3">${notice.category}</span></div>` : ''}
        <div class="meta-item"><strong>${bn ? 'অগ্রাধিকার:' : 'Priority:'}</strong> <span class="chip" style="background:${priority.color}15;color:${priority.color}">${bn ? priority.labelBn : priority.label}</span></div>
        ${notice.expiresAt ? `<div class="meta-item"><strong>${bn ? 'মেয়াদ:' : 'Expires:'}</strong> ${notice.expiresAt}</div>` : ''}
      </div>

      <div class="content">${sanitizeHtml(displayContent)}</div>

      <div class="signature-row">
        <div class="sig-box">
          ${bn ? 'প্রস্তুতকারীর স্বাক্ষর' : 'Prepared By'}
        </div>
        <div class="sig-box">
          ${displayAuthor}<br/>
          <strong>${brand.schoolName}</strong>
        </div>
      </div>

      ${pdfFooterHTML(bn)}
    </div>
  `

  openPrintWindow(displayTitle, bodyHTML, { css })
}
