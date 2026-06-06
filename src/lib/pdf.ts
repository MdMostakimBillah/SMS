export function getBrandColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#4f46e5'
}

export function openPrintWindow(
  title: string,
  bodyHTML: string,
  opts?: { css?: string; delay?: number }
): Window | null {
  const win = window.open('', '_blank')
  if (!win) return null

  const defaultCss = `
    @page { size: A4 portrait; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; font-size: 12px; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; color-adjust: exact; }
    }
  `

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>${opts?.css || defaultCss}</style></head><body>${bodyHTML}<script>setTimeout(()=>window.print(),${opts?.delay || 600})</script></body></html>`)
  win.document.close()
  return win
}

export function downloadHTML(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
