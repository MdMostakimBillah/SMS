import { useClassStore } from '@/store/classStore'
import { escapeHtml } from '@/lib/sanitize'

export interface PDFBranding {
  logo: string
  schoolName: string
  schoolNameBn: string
  address: string
  phone: string
  email: string
  brandColor: string
}

export function getPDFBranding(): PDFBranding {
  const { institution } = useClassStore.getState()
  return {
    logo: institution.logo || '',
    schoolName: institution.name || 'EduTech',
    schoolNameBn: institution.nameBn || '',
    address: institution.address || '',
    phone: institution.phone || '',
    email: institution.email || '',
    brandColor: institution.lightColors?.brand || '#6366f1',
  }
}

export function pdfLogoHTML(b: PDFBranding, size = 32): string {
  if (b.logo) {
    return `<img src="${escapeHtml(b.logo)}" style="width:${size}px;height:${size}px;border-radius:7px;object-fit:contain" />`
  }
  return `<div style="width:${size}px;height:${size}px;background:${b.brandColor};border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${Math.round(size * 0.44)}px;font-weight:700">ET</div>`
}

export function pdfHeaderHTML(b: PDFBranding, opts?: { showAddress?: boolean; extraMeta?: string }): string {
  const showAddress = opts?.showAddress !== false
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:7px;border-bottom:2px solid ${b.brandColor};margin-bottom:7px">
  <div style="display:flex;align-items:center;gap:10px">
    ${pdfLogoHTML(b)}
    <div>
      <div style="font-size:13px;font-weight:700;color:${b.brandColor}">${escapeHtml(b.schoolName)}</div>
      ${showAddress && b.address ? `<div style="font-size:8px;color:#888">${escapeHtml(b.address)}</div>` : ''}
    </div>
  </div>
  <div style="text-align:right;font-size:8px;color:#666;line-height:1.7">
    <div>Printed: ${new Date().toLocaleDateString()}</div>
    ${escapeHtml(opts?.extraMeta || '')}
  </div>
</div>`
}

export function pdfFooterHTML(isBn: boolean): string {
  return `<div style="margin-top:10px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888">
  <span style="font-size:7px;color:#999">Powered by EduTech</span>
  <div style="display:flex;gap:50px">
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${isBn ? 'প্রধান শিক্ষক' : 'Principal'}</div>
    <div style="text-align:center"><div style="width:110px;height:1px;background:#333;margin-bottom:3px"></div>${isBn ? 'অফিস সিল' : 'Office Seal'}</div>
  </div>
</div>`
}

export function pdfBrandCSS(b: PDFBranding): string {
  const darken = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, (num >> 16) - amount)
    const g = Math.max(0, ((num >> 8) & 0x00ff) - amount)
    const bv = Math.max(0, (num & 0x0000ff) - amount)
    return `#${(r << 16 | g << 8 | bv).toString(16).padStart(6, '0')}`
  }
  const darker = darken(b.brandColor, 30)

  return `
    .pdf-hdr { display:flex; align-items:center; justify-content:space-between; padding-bottom:7px; border-bottom:2px solid ${b.brandColor}; margin-bottom:7px; }
    .pdf-logo { width:32px; height:32px; background:${b.brandColor}; border-radius:7px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:700; }
    .pdf-meta { text-align:right; font-size:8px; color:#666; line-height:1.7; }
    .pdf-ttl { text-align:center; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
    th { background:${b.brandColor}; color:#fff; border-color:${darker}; }
    .ftr { margin-top:10px; padding-top:7px; border-top:1px solid #ddd; display:flex; justify-content:space-between; font-size:8px; color:#888; }
  `
}
