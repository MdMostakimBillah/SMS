const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
}

const ESCAPE_RE = /[&<>"'`/]/g

export function escapeHtml(str: string): string {
  return str.replace(ESCAPE_RE, (ch) => HTML_ESCAPE[ch] || ch)
}

const DANGEROUS_TAGS = new Set([
  'SCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'STYLE',
  'FORM',
  'BASE',
  'META',
  'LINK',
  'APPLET',
])

/**
 * Sanitizes rich text HTML for safe DOM insertion via dangerouslySetInnerHTML.
 * Strips executable tags (<script>, <iframe>, etc.), on* event handlers,
 * and dangerous protocols (javascript:, vbscript:).
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return ''
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(dirty, 'text/html')

    const elements = doc.body.querySelectorAll('*')
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      if (DANGEROUS_TAGS.has(el.tagName)) {
        el.remove()
        continue
      }

      const attrs = Array.from(el.attributes)
      for (let j = 0; j < attrs.length; j++) {
        const attr = attrs[j]
        const name = attr.name.toLowerCase()
        const val = attr.value.trim().toLowerCase()

        // Strip inline event handlers and formaction overrides
        if (name.startsWith('on') || name === 'formaction' || name === 'action') {
          el.removeAttribute(attr.name)
        } else if (
          (name === 'href' || name === 'src' || name === 'xlink:href') &&
          (val.startsWith('javascript:') || val.startsWith('vbscript:'))
        ) {
          el.removeAttribute(attr.name)
        }
      }
    }

    return doc.body.innerHTML
  } catch {
    return escapeHtml(dirty)
  }
}

