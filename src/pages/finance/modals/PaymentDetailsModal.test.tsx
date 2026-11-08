import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentDetailsModal } from './PaymentDetailsModal'
import { useFeeStore } from '@/store/feeStore'
import * as feeReceipt from '@/lib/feeReceipt'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}))

vi.mock('@/hooks/useBn', () => ({
  useBn: () => false,
}))

describe('PaymentDetailsModal', () => {
  const mockStudent = {
    id: 'ET-2026-11061',
    nameEn: 'Fahim Mia',
    nameBn: 'ফাহিম মিয়া',
    class: 'HSC',
    section: 'Humanity',
    roll: '77',
    photo: '',
  }

  const mockPayments = [
    {
      id: 'PAY-001',
      studentId: 'ET-2026-11061',
      feeStructureId: 'FEE-OTHER-OIA-101',
      amount: 500,
      paidAt: '2026-11-07T10:00:00Z',
      method: 'cash' as const,
      collectedBy: 'Udvash Admin',
      forMonth: '2026-11',
      batchId: 'BATCH-TT5F82',
      note: 'Day Care Fee',
      discount: 0,
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useFeeStore.setState({
      structures: [
        {
          id: 'FEE-OTHER-OIA-101',
          name: 'Day Care',
          nameBn: 'ডে কেয়ার',
          class: 'HSC',
          academicYear: '2025-26',
          amount: 500,
          description: 'Day Care service',
          descriptionBn: 'ডে কেয়ার সুবিধা',
          isActive: true,
          type: 'monthly',
          createdAt: '2026-11-01',
        },
      ],
    })
  })

  it('renders student details, fee specifications, and KPI stat cards', () => {
    render(
      <PaymentDetailsModal
        student={mockStudent}
        payments={mockPayments}
        totalDue={0}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Fahim Mia')).toBeInTheDocument()
    expect(screen.getByText('ET-2026-11061')).toBeInTheDocument()
    expect(screen.getByText('HSC')).toBeInTheDocument()
    expect(screen.getByText('Humanity')).toBeInTheDocument()
    expect(screen.getByText('77')).toBeInTheDocument()

    // Fee info
    expect(screen.getAllByText('Day Care').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Monthly Fee')).toBeInTheDocument()

    // 4 Stats
    expect(screen.getByText('Total Paid')).toBeInTheDocument()
    expect(screen.getAllByText('৳500').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Discount')).toBeInTheDocument()
    expect(screen.getByText('Waived')).toBeInTheDocument()
    expect(screen.getByText('Cleared')).toBeInTheDocument()
  })

  it('renders payment records table with receipt number and payment details', () => {
    render(
      <PaymentDetailsModal
        student={mockStudent}
        payments={mockPayments}
        batchReceiptNo="RCP-689-TT5F82"
        totalDue={0}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('RCP-689-TT5F82')).toBeInTheDocument()
    expect(screen.getByText('2026-11-07')).toBeInTheDocument()
    expect(screen.getByText('Nov 2026')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByText('Udvash Admin')).toBeInTheDocument()
  })

  it('calls printFeeReceipt when clicking Print Receipt button', () => {
    const printSpy = vi.spyOn(feeReceipt, 'printFeeReceipt').mockImplementation(() => {})

    render(
      <PaymentDetailsModal
        student={mockStudent}
        payments={mockPayments}
        batchReceiptNo="RCP-689-TT5F82"
        totalDue={0}
        onClose={vi.fn()}
      />
    )

    const printBtns = screen.getAllByRole('button', { name: /print receipt/i })
    expect(printBtns.length).toBeGreaterThan(0)
    fireEvent.click(printBtns[0])

    expect(printSpy).toHaveBeenCalled()
  })

  it('handles Collect Due when totalDue is greater than 0', () => {
    const onCollectMock = vi.fn()
    const onCloseMock = vi.fn()

    render(
      <PaymentDetailsModal
        student={mockStudent}
        payments={mockPayments}
        totalDue={200}
        onCollect={onCollectMock}
        onClose={onCloseMock}
      />
    )

    expect(screen.getByText('৳200')).toBeInTheDocument()

    const collectBtns = screen.getAllByRole('button', { name: /collect due|collect payment/i })
    expect(collectBtns.length).toBeGreaterThan(0)
    fireEvent.click(collectBtns[0])

    expect(onCollectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 'ET-2026-11061',
        dueAmount: 200,
      })
    )
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('displays empty state when payments array is empty', () => {
    render(
      <PaymentDetailsModal
        student={mockStudent}
        payments={[]}
        totalDue={500}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/no payment records found/i)).toBeInTheDocument()
  })
})
