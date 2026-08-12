import { useClassStore } from '@/store/classStore'

export function getBrandColor(): string {
  const { institution } = useClassStore.getState()
  return institution.lightColors?.brand || '#6366f1'
}

function buildPrintHTML(title: string, bodyHTML: string, css?: string): string {
  const printRules = `
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; color-adjust: exact; padding: 10mm; }
      html, body { margin: 0 !important; }
    }
  `
  const defaultCss = `
    @page { size: A4 portrait; margin: 0; }
    @page :first { margin-top: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; font-size: 12px; padding: 10mm; }
  `
  const finalCss = css ? `${css}\n${printRules}` : `${defaultCss}\n${printRules}`
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>${finalCss}</style></head><body>${bodyHTML}</body></html>`
}

function createPrintIframe(html: string, delay: number): void {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;opacity:0;pointer-events:none'
  document.body.appendChild(iframe)
  try {
    const doc = iframe.contentDocument
    if (!doc) { iframe.remove(); return }
    doc.open()
    doc.write(html)
    doc.close()
    setTimeout(() => {
      try { iframe.contentWindow?.print() } catch (_) { /* ignore */ }
      setTimeout(() => iframe.remove(), 2000)
    }, delay)
  } catch (_) {
    iframe.remove()
  }
}

export function openPrintWindow(
  title: string,
  bodyHTML: string,
  opts?: { css?: string; delay?: number }
): void {
  const html = buildPrintHTML(title, bodyHTML, opts?.css)
  createPrintIframe(html, opts?.delay || 600)
}

export function printHTML(
  title: string,
  bodyHTML: string,
  opts?: { css?: string; delay?: number }
): void {
  const html = buildPrintHTML(title, bodyHTML, opts?.css)
  createPrintIframe(html, opts?.delay || 600)
}

export function printRawHTML(html: string, delay?: number): void {
  createPrintIframe(html, delay || 600)
}

export function downloadHTML(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
  document.body.appendChild(a)

  requestAnimationFrame(() => {
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 200)
  })
}
