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

  it('renders payment history table with font size text-[0.8125rem]', () => {
    const { container } = render(
      <MemoryRouter>
        <PaymentsTab />
      </MemoryRouter>
    )

    const table = container.querySelector('table')
    expect(table).toHaveClass('text-[0.8125rem]')

    expect(screen.getByText('Rahim Khan')).toBeInTheDocument()
    expect(screen.getByText('RCP-2026-000101')).toBeInTheDocument()
    expect(screen.getAllByText('1,500').length).toBeGreaterThan(0)
    expect(screen.getAllByText('100').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cash').length).toBeGreaterThanOrEqual(1)
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
