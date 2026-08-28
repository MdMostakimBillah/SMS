import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBrandColor, openPrintWindow, downloadHTML } from './pdf'

vi.mock('@/store/classStore', () => ({
  useClassStore: {
    getState: () => ({
      institution: {
        lightColors: { brand: '#ff0000' },
      },
    }),
  },
}))

describe('getBrandColor', () => {
  it('returns brand color from store', () => {
    expect(getBrandColor()).toBe('#ff0000')
  })
})

describe('openPrintWindow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an iframe and writes HTML', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((() => {}) as any)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((() => {}) as any)
    openPrintWindow('Test', '<p>Hello</p>')
    expect(appendChildSpy).toHaveBeenCalled()
    const iframe = appendChildSpy.mock.calls[0][0] as HTMLIFrameElement
    expect(iframe.tagName).toBe('IFRAME')
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('uses provided CSS', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((() => {}) as any)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((() => {}) as any)
    openPrintWindow('Test', '<p>Hello</p>', { css: 'body{color:red}' })
    expect(appendChildSpy).toHaveBeenCalled()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
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
