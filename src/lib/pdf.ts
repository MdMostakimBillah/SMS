import { useClassStore } from '@/store/classStore'

export function getBrandColor(): string {
  const { institution } = useClassStore.getState()
  return institution.lightColors?.brand || '#6366f1'
}

export function openPrintWindow(
  title: string,
  bodyHTML: string,
  opts?: { css?: string; delay?: number }
): Window | null {
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
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; font-size: 12px; padding: 10mm; }
  `

  const css = opts?.css ? `${opts.css}\n${printRules}` : `${defaultCss}\n${printRules}`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>${css}</style></head><body>${bodyHTML}</body></html>`

  const win = window.open('about:blank', '_blank', 'noopener,noreferrer')
  if (!win) return null
  try {
    win.document.write(html)
    win.document.close()
    setTimeout(() => { try { win.print() } catch (_) { /* ignore */ } }, opts?.delay || 600)
  } catch (_) {
    win.close()
    return null
  }
  return win
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
