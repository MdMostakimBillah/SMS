import { describe, it, expect, vi, beforeEach } from 'vitest'
import { printFeeReceipt } from './feeReceipt'
import * as pdfModule from './pdf'

describe('printFeeReceipt', () => {
  let openPrintWindowSpy: any

  beforeEach(() => {
    openPrintWindowSpy = vi.spyOn(pdfModule, 'openPrintWindow').mockImplementation(() => {})
  })

  it('generates receipt with clean typography and Google Fonts font stack', () => {
    printFeeReceipt({
      receiptNo: 'RCP-2026-001',
      date: '03 Nov 2026',
      studentId: 'ET-2026-10001',
      studentName: 'Tithi Hossain',
      studentNameBn: 'তিথী হোসেন',
      class: 'PSC',
      section: 'General',
      session: '2026-27',
      paymentMethod: 'cash',
      collectedBy: 'Admin',
      items: [
        {
          feeName: 'Course Fee',
          feeNameBn: 'কোর্স ফি',
          period: '2026-27',
          amount: 5000,
        },
      ],
      totalAmount: 5000,
      totalDiscount: 0,
      totalReceived: 5000,
      totalDue: 0,
    }, false)

    expect(openPrintWindowSpy).toHaveBeenCalled()
    const [title, bodyHTML, opts] = openPrintWindowSpy.mock.calls[0]
    expect(title).toBe('RCP-2026-001')
    expect(bodyHTML).toContain('Tithi Hossain')
    expect(bodyHTML).toContain('Course Fee')
    expect(bodyHTML).toContain('Inter')
    expect(bodyHTML).toContain('Noto Sans Bengali')
    expect(opts.css).toContain('Inter')
    expect(opts.css).toContain('Noto Sans Bengali')
  })

  it('generates bilingual Bengali receipt correctly', () => {
    printFeeReceipt({
      receiptNo: 'RCP-2026-002',
      date: '০৩ নভেম্বর ২০২৬',
      studentId: 'ET-2026-10002',
      studentName: 'Rahim Ali',
      studentNameBn: 'রহিম আলী',
      class: 'PSC',
      section: 'General',
      session: '2026-27',
      paymentMethod: 'cash',
      items: [
        {
          feeName: 'Exam Fee',
          feeNameBn: 'পরীক্ষা ফি',
          amount: 1000,
        },
      ],
      totalAmount: 1000,
      totalDiscount: 0,
      totalReceived: 1000,
      totalDue: 0,
    }, true)

    expect(openPrintWindowSpy).toHaveBeenCalled()
    const [, bodyHTML] = openPrintWindowSpy.mock.calls[1]
    expect(bodyHTML).toContain('রহিম আলী')
    expect(bodyHTML).toContain('পরীক্ষা ফি')
    expect(bodyHTML).toContain('শিক্ষার্থী কপি')
    expect(bodyHTML).toContain('প্রতিষ্ঠান কপি')
  })
})
