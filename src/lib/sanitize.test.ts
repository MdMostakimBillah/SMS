import { describe, it, expect } from 'vitest'
import { escapeHtml, sanitizeHtml } from './sanitize'

describe('sanitize', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      )
    })
  })

  describe('sanitizeHtml', () => {
    it('removes script tags and their content', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
      expect(sanitizeHtml(input)).toBe('<p>Hello</p><p>World</p>')
    })

    it('removes iframe and object tags', () => {
      const input = '<div>Test<iframe src="https://evil.com"></iframe><object data="test"></object></div>'
      expect(sanitizeHtml(input)).toBe('<div>Test</div>')
    })

    it('strips inline event handler attributes like onerror and onload', () => {
      const input = '<img src="valid.jpg" onerror="alert(1)" onload="alert(2)" alt="photo" />'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('onerror')
      expect(output).not.toContain('onload')
      expect(output).toContain('src="valid.jpg"')
      expect(output).toContain('alt="photo"')
    })

    it('strips javascript: URLs from href and src', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>'
      const output = sanitizeHtml(input)
      expect(output).not.toContain('javascript:')
      expect(output).toContain('Click me')
    })

    it('preserves safe formatting tags and styles', () => {
      const input = '<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u></p>'
      expect(sanitizeHtml(input)).toBe('<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u></p>')
    })

    it('handles empty or non-string inputs safely', () => {
      expect(sanitizeHtml('')).toBe('')
      // @ts-expect-error test invalid type
      expect(sanitizeHtml(null)).toBe('')
    })
  })
})
