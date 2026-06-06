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

  it('writes HTML to opened window', () => {
    const mockDoc = { write: vi.fn(), close: vi.fn() }
    const mockWin = { document: mockDoc } as any
    vi.spyOn(window, 'open').mockReturnValue(mockWin)
    openPrintWindow('Test Title', '<p>Content</p>')
    expect(mockDoc.write).toHaveBeenCalledTimes(1)
    expect(mockDoc.write.mock.calls[0][0]).toContain('Test Title')
    expect(mockDoc.write.mock.calls[0][0]).toContain('<p>Content</p>')
    expect(mockDoc.close).toHaveBeenCalled()
  })
})

describe('downloadHTML', () => {
  it('creates blob and triggers download', () => {
    const clickMock = vi.fn()
    const mockEl = { href: '', download: '', click: clickMock } as HTMLAnchorElement
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockEl)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((() => {}) as any)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((() => {}) as any)

    downloadHTML('test.html', '<p>Hello</p>')

    expect(clickMock).toHaveBeenCalled()
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
