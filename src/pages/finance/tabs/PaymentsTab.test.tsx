import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PaymentsTab } from './PaymentsTab'
import { useFeeStore } from '@/store/feeStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canExport: () => true,
    canPrint: () => true,
  }),
}))

vi.mock('@/hooks/useBn', () => ({
  useBn: () => false,
}))

describe('PaymentsTab Table and Details Integration', () => {
  const mockStudents = [
    {
      id: 'STU-101',
      nameEn: 'Rahim Khan',
      nameBn: 'রহিম খান',
      class: 'Class 10',
      section: 'B',
      roll: '15',
      photo: '',
      status: 'approved' as const,
      active: true,
      academicYear: '2025-26',
    },
  ]

  const mockPayments = [
    {
      id: 'PAY-101',
      studentId: 'STU-101',
      feeStructureId: 'STRUCT-01',
      amount: 1500,
      discount: 100,
      paidAt: '2026-11-09T10:00:00Z',
      method: 'cash' as const,
      reference: '',
      note: 'Tuition Fee Nov',
      collectedBy: 'Finance Officer',
      createdAt: '2026-11-09',
      batchId: 'BATCH-101',
      forMonth: '2026-11',
      receiptNo: 'RCP-2026-000101',
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    useAdmissionStore.setState({
      students: mockStudents as any,
    })
    useClassStore.setState({
      institution: {
        id: 'INST-1',
        name: 'EduTech Academy',
        currentSession: '2025-26',
        sessions: ['2025-26'],
      } as any,
    })
    useFeeStore.setState({
      structures: [
        {
          id: 'STRUCT-01',
          name: 'Tuition Fee',
          nameBn: 'বেতন',
          class: 'Class 10',
          academicYear: '2025-26',
          amount: 1600,
          description: 'Tuition Fee',
          descriptionBn: 'বেতন',
          isActive: true,
          type: 'monthly',
          createdAt: '2026-01-01',
        },
      ],
      payments: mockPayments,
      waiverEntries: [],
      studentWaivers: [],
    })
  })

  it('renders table with compact font size for low-end devices (text-[0.6875rem])', () => {
    const { container } = render(
      <MemoryRouter>
        <PaymentsTab />
      </MemoryRouter>
    )

    const table = container.querySelector('table')
    expect(table).toHaveClass('text-[0.6875rem]')

    const ths = container.querySelectorAll('th')
    expect(ths.length).toBeGreaterThan(0)
    expect(ths[1]).toHaveClass('text-[0.6875rem]')

    expect(screen.getByText('Rahim Khan')).toBeInTheDocument()
    expect(screen.getByText('RCP-2026-000101')).toBeInTheDocument()
    expect(screen.getAllByText('1,500').length).toBeGreaterThan(0)
    expect(screen.getAllByText('100').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cash').length).toBeGreaterThanOrEqual(1)
  })

  it('paginates payment history with 50 items per page and allows viewing next page', () => {
    const manyStudents = Array.from({ length: 60 }, (_, idx) => ({
      id: `STU-EXTRA-${idx + 1}`,
      nameEn: `Student ${idx + 1}`,
      nameBn: `শিক্ষার্থী ${idx + 1}`,
      class: 'Class 10',
      section: 'A',
      roll: String(idx + 1).padStart(2, '0'),
      photo: '',
      status: 'approved' as const,
      active: true,
      academicYear: '2025-26',
    }))

    const manyPayments = Array.from({ length: 60 }, (_, idx) => ({
      id: `PAY-EXTRA-${idx + 1}`,
      studentId: `STU-EXTRA-${idx + 1}`,
      feeStructureId: 'STRUCT-01',
      amount: 1000 + idx,
      discount: 0,
      paidAt: '2026-11-09T10:00:00Z',
      method: 'cash' as const,
      reference: '',
      note: 'Tuition Fee',
      collectedBy: 'Finance Officer',
      createdAt: '2026-11-09',
      batchId: `BATCH-${idx + 1}`,
      forMonth: '2026-11',
      receiptNo: `RCP-${String(idx + 1).padStart(6, '0')}`,
    }))

    useAdmissionStore.setState({ students: manyStudents as any })
    useFeeStore.setState({ payments: manyPayments as any })

    render(
      <MemoryRouter>
        <PaymentsTab />
      </MemoryRouter>
    )

    // With 60 payments and default perPage 50, Student 1 is on page 1, Student 51 is on page 2
    expect(screen.getByText('Student 1')).toBeInTheDocument()
    expect(screen.queryByText('Student 51')).not.toBeInTheDocument()

    // Pagination controls should be visible
    expect(screen.getByText(/1–50 \/ 60/)).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()

    // Click next page button
    const nextBtn = screen.getByTitle('Next page')
    fireEvent.click(nextBtn)

    // Student 51 should now be visible on page 2
    expect(screen.queryByText('Student 1')).not.toBeInTheDocument()
    expect(screen.getByText('Student 51')).toBeInTheDocument()
    expect(screen.getByText(/51–60 \/ 60/)).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })

  it('opens polished payment details popup when clicking View Payment Details button', () => {
    render(
      <MemoryRouter>
        <PaymentsTab />
      </MemoryRouter>
    )

    const viewBtn = screen.getByTitle('View Payment Details')
    fireEvent.click(viewBtn)

    // Modal opens with polished details
    expect(screen.getByText('Payment Details')).toBeInTheDocument()
    expect(screen.getByText('Payment Records')).toBeInTheDocument()
    expect(screen.getByText('Payment Summary')).toBeInTheDocument()
    expect(screen.getByText('Total Paid')).toBeInTheDocument()
  })
})
