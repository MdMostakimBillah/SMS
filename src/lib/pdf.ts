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
  const defaultCss = `
    @page { size: A4 portrait; margin: 0; }
    @page :first { margin-top: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; font-size: 12px; padding: 10mm; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; color-adjust: exact; padding: 10mm; }
      html, body { margin: 0 !important; padding: 0 !important; }
      @page { margin: 0 !important; }
    }
  `

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>${opts?.css || defaultCss}</style></head><body>${bodyHTML}<script>setTimeout(()=>window.print(),${opts?.delay || 600})</script></body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    URL.revokeObjectURL(url)
    return null
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000)
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
