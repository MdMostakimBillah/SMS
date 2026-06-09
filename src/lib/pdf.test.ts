import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBrandColor, openPrintWindow, downloadHTML } from './pdf'

describe('getBrandColor', () => {
  it('returns CSS variable value when set', () => {
    document.documentElement.style.setProperty('--brand', '#ff0000')
    expect(getBrandColor()).toBe('#ff0000')
  })

  it('returns fallback when CSS variable not set', () => {
    document.documentElement.style.removeProperty('--brand')
    expect(getBrandColor()).toBe('#4f46e5')
  })
})

describe('openPrintWindow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when window.open is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    const result = openPrintWindow('Test', '<p>Hello</p>')
    expect(result).toBeNull()
  })

  it('opens blob URL in new window', () => {
    const mockWin = { } as any
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(mockWin)
    const result = openPrintWindow('Test Title', '<p>Content</p>')
    expect(result).toBe(mockWin)
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('blob:'), '_blank', 'noopener,noreferrer')
  })
})

describe('downloadHTML', () => {
  it('creates blob and triggers download', () => {
    const clickMock = vi.fn()
    const mockStyle = { cssText: '' }
    const mockEl = { href: '', download: '', style: mockStyle, click: clickMock } as HTMLAnchorElement
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockEl)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((() => {}) as any)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((() => {}) as any)

    downloadHTML('test.html', '<p>Hello</p>')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(mockEl.download).toBe('test.html')
    expect(mockEl.href).toContain('blob:')

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
