import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaymentsPage from './PaymentsPage'
import { SubscriptionPaymentPanel } from '@/pages/settings/panels/SubscriptionPaymentPanel'
import { useInstitutionPaymentStore, DEFAULT_GATEWAYS_CONFIG } from '@/store/institutionPaymentStore'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { AuthContext } from '@/contexts/AuthContext'
import { institutionPaymentsApi } from '@/lib/api'

const mockAuthAdmin = {
  user: {
    id: 'user-admin',
    name: 'Daffodil School Principal',
    email: 'principal@daffodil.edu.bd',
    role: 'school_admin',
    schoolId: 'inst-daffodil',
    institutionId: 'inst-daffodil',
    subdomain: 'daffodil',
  },
  token: 'mock-token',
  login: async () => {},
  logout: () => {},
  register: async () => {},
  isLoading: false,
  error: null,
  isAuthenticated: true,
  checkAuth: async () => {},
} as any

describe('Institution Multi-Gateway Payment System', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    sessionStorage.setItem('edutech_inst_slug', 'daffodil')

    useSuperAdminStore.setState({
      institutions: [
        {
          id: 'inst-daffodil',
          name: 'Daffodil Model High School',
          nameBn: 'ড্যাফোডিল মডেল উচ্চ বিদ্যালয়',
          email: 'info@daffodil.edu.bd',
          phone: '01711112233',
          address: 'Dhaka',
          addressBn: 'ঢাকা',
          eiin: '123456',
          website: '',
          subdomain: 'daffodil',
          slug: 'daffodil',
          status: 'active',
          package: {
            id: 'pkg-standard',
            name: 'Standard',
            nameBn: 'স্ট্যান্ডার্ড',
            description: '',
            descriptionBn: '',
            price: 2200,
            duration: 30,
            features: [],
            featuresBn: [],
            isActive: true,
          },
          expiresAt: '2026-12-01T00:00:00.000Z',
          createdAt: '2025-01-01',
          lastLogin: '2026-11-19',
          logo: '',
          banner: '',
          brandColor: '#6366f1',
          brandName: 'Daffodil',
          motto: '',
          mottoBn: '',
          startTime: '08:00',
          endTime: '14:00',
          optionalSubjects: [],
          sessions: ['2026'],
        },
      ],
      packages: [
        {
          id: 'pkg-basic',
          name: 'Basic',
          nameBn: 'বেসিক',
          price: 1200,
          duration: 30,
          description: 'Basic plan',
          descriptionBn: 'বেসিক প্ল্যান',
          features: [],
          featuresBn: [],
          isActive: true,
        },
        {
          id: 'pkg-standard',
          name: 'Standard',
          nameBn: 'স্ট্যান্ডার্ড',
          price: 2200,
          duration: 30,
          description: 'Standard plan',
          descriptionBn: 'স্ট্যান্ডার্ড প্ল্যান',
          features: [],
          featuresBn: [],
          isActive: true,
        },
        {
          id: 'pkg-premium',
          name: 'Premium',
          nameBn: 'প্রিমিয়াম',
          price: 3500,
          duration: 30,
          description: 'Premium plan',
          descriptionBn: 'প্রিমিয়াম প্ল্যান',
          features: [],
          featuresBn: [],
          isActive: true,
        },
      ],
    })

    useInstitutionPaymentStore.setState({
      gatewaysConfig: JSON.parse(JSON.stringify(DEFAULT_GATEWAYS_CONFIG)),
      bkashConfig: {
        number: '01700-123456',
        type: 'merchant',
        instructions: 'Send payment via bKash App or dial *247#.',
        instructionsBn: 'বিকাশ অ্যাপ অথবা *২৪৭# ডায়াল করে পেমেন্ট সম্পন্ন করুন।',
        active: true,
      },
      payments: [
        {
          id: 'PAY-1',
          schoolId: 'inst-daffodil',
          schoolName: 'Daffodil Model High School',
          schoolSlug: 'daffodil',
          eiin: '123456',
          packageName: 'Standard',
          amount: 2200,
          months: 1,
          senderNumber: '01799887766',
          senderBkashNumber: '01799887766',
          trxId: 'BLA89DK29P',
          paymentMethod: 'bkash',
          status: 'pending',
          submittedAt: '2026-11-19T10:00:00.000Z',
        },
        {
          id: 'PAY-2',
          schoolId: 'inst-daffodil',
          schoolName: 'Daffodil Model High School',
          schoolSlug: 'daffodil',
          eiin: '123456',
          packageName: 'Standard',
          amount: 6270,
          months: 3,
          senderNumber: '01811223344',
          senderBkashNumber: '01811223344',
          trxId: 'TRX998877',
          paymentMethod: 'nagad',
          status: 'approved',
          submittedAt: '2026-10-15T10:00:00.000Z',
          reviewedAt: '2026-10-15T12:00:00.000Z',
          reviewedBy: 'Super Admin',
        },
      ],
      isLoading: false,
      serverSynced: true,
      error: null,
    })

    vi.spyOn(institutionPaymentsApi, 'getAll').mockResolvedValue({
      payments: [
        {
          id: 'PAY-1',
          schoolId: 'inst-daffodil',
          schoolName: 'Daffodil Model High School',
          schoolSlug: 'daffodil',
          eiin: '123456',
          packageName: 'Standard',
          amount: 2200,
          months: 1,
          senderNumber: '01799887766',
          senderBkashNumber: '01799887766',
          trxId: 'BLA89DK29P',
          paymentMethod: 'bkash',
          status: 'pending',
          submittedAt: '2026-11-19T10:00:00.000Z',
        },
        {
          id: 'PAY-2',
          schoolId: 'inst-daffodil',
          schoolName: 'Daffodil Model High School',
          schoolSlug: 'daffodil',
          eiin: '123456',
          packageName: 'Standard',
          amount: 6270,
          months: 3,
          senderNumber: '01811223344',
          senderBkashNumber: '01811223344',
          trxId: 'TRX998877',
          paymentMethod: 'nagad',
          status: 'approved',
          submittedAt: '2026-10-15T10:00:00.000Z',
          reviewedAt: '2026-10-15T12:00:00.000Z',
          reviewedBy: 'Super Admin',
        },
      ],
    })

    vi.spyOn(institutionPaymentsApi, 'getConfig').mockResolvedValue({
      config: {
        number: '01700-123456',
        type: 'merchant',
        instructions: 'Send payment via bKash App or dial *247#.',
        instructionsBn: 'বিকাশ অ্যাপ অথবা *২৪৭# ডায়াল করে পেমেন্ট সম্পন্ন করুন।',
        active: true,
      },
      gateways: DEFAULT_GATEWAYS_CONFIG,
    })

    vi.spyOn(institutionPaymentsApi, 'updateGatewaysConfig').mockResolvedValue({
      success: true,
      gateways: DEFAULT_GATEWAYS_CONFIG,
    })

    vi.spyOn(institutionPaymentsApi, 'submit').mockResolvedValue({
      success: true,
      payment: {
        id: 'PAY-NEW',
        schoolId: 'inst-daffodil',
        schoolName: 'Daffodil Model High School',
        schoolSlug: 'daffodil',
        eiin: '123456',
        packageName: 'Standard',
        amount: 2200,
        months: 1,
        senderNumber: '01712345678',
        senderBkashNumber: '01712345678',
        trxId: 'NEWTRX1234',
        paymentMethod: 'bkash',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      },
    })

    vi.spyOn(institutionPaymentsApi, 'approve').mockResolvedValue({
      success: true,
      payment: {} as any,
    })

    vi.spyOn(institutionPaymentsApi, 'reject').mockResolvedValue({
      success: true,
      payment: {} as any,
    })
  })

  it('renders Super Admin PaymentsPage with multi-gateway metrics and transaction table', async () => {
    render(
      <MemoryRouter>
        <PaymentsPage isBn={false} />
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(screen.getByText('Institution Subscription Payments & Gateways')).toBeTruthy()
    expect(screen.getAllByText('৳6,270').length).toBeGreaterThan(0) // Approved revenue
    expect(screen.getAllByText('৳2,200').length).toBeGreaterThan(0) // Pending amount
    expect(screen.getByText('BLA89DK29P')).toBeTruthy()
    expect(screen.getByText('TRX998877')).toBeTruthy()

    // Gateway filters exist
    expect(screen.getByRole('button', { name: /All Gateways/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^bKash/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Nagad/i })).toBeTruthy()
  })

  it('allows Super Admin to approve a pending payment with package override', async () => {
    render(
      <MemoryRouter>
        <PaymentsPage isBn={false} />
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // Click Approve button on the pending payment
    const approveBtn = screen.getByTitle('Approve & extend subscription')
    fireEvent.click(approveBtn)

    expect(screen.getByText('Approve Payment & Update Package')).toBeTruthy()

    // Confirm approve
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Activate Package/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    const updated = useInstitutionPaymentStore.getState().payments.find((p) => p.id === 'PAY-1')
    expect(updated?.status).toBe('approved')

    // SuperAdminStore institution package should be verified
    const inst = useSuperAdminStore.getState().institutions.find((i) => i.id === 'inst-daffodil')
    expect(inst?.status).toBe('active')
  })

  it('allows Super Admin to reject a pending payment with reason', async () => {
    render(
      <MemoryRouter>
        <PaymentsPage isBn={false} />
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // Click Reject button
    const rejectBtn = screen.getByTitle('Reject with reason')
    fireEvent.click(rejectBtn)

    expect(screen.getByText('Reject Payment Verification')).toBeTruthy()

    const confirmRejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i })
    await act(async () => {
      fireEvent.click(confirmRejectBtn)
    })

    const updated = useInstitutionPaymentStore.getState().payments.find((p) => p.id === 'PAY-1')
    expect(updated?.status).toBe('rejected')
  })

  it('allows Super Admin to configure payment gateways (bKash, Nagad, Rocket, Upay, Bank)', async () => {
    render(
      <MemoryRouter>
        <PaymentsPage isBn={false} />
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // Open Configure Gateways Modal
    const configBtn = screen.getByRole('button', { name: /Setup Payment Gateways/i })
    fireEvent.click(configBtn)

    expect(screen.getByText('Setup Bangladeshi Payment Gateways')).toBeTruthy()

    // Switch tab to Nagad
    const nagadTabBtns = screen.getAllByRole('button', { name: /Nagad/i })
    fireEvent.click(nagadTabBtns[nagadTabBtns.length - 1])

    // Save configurations
    const saveBtn = screen.getByRole('button', { name: /Save All Gateways/i })
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    expect(institutionPaymentsApi.updateGatewaysConfig).toHaveBeenCalled()
  })

  it('allows Super Admin to directly update an institution package', async () => {
    render(
      <MemoryRouter>
        <PaymentsPage isBn={false} />
      </MemoryRouter>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // Open direct update modal
    const directUpdateBtn = screen.getByRole('button', { name: /Update School Package/i })
    fireEvent.click(directUpdateBtn)

    expect(screen.getByText('Update Institution Package & Expiry')).toBeTruthy()

    const updateSubmitBtn = screen.getByRole('button', { name: /Apply Package Update/i })
    await act(async () => {
      fireEvent.click(updateSubmitBtn)
    })

    expect(screen.getByText(/Package updated successfully!/i)).toBeTruthy()
  })

  it('allows an institution to view gateways and submit payment verification in SubscriptionPaymentPanel', async () => {
    render(
      <AuthContext.Provider value={mockAuthAdmin}>
        <SubscriptionPaymentPanel isBn={false} onBack={() => {}} />
      </AuthContext.Provider>
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    expect(screen.getByText('Daffodil Model High School')).toBeTruthy()
    expect(screen.getByText('2. Select Bangladeshi Payment Gateway')).toBeTruthy()

    // Click on Nagad gateway button
    const nagadGatewayBtn = screen.getByRole('button', { name: /Nagad/i })
    fireEvent.click(nagadGatewayBtn)

    const senderInput = screen.getByPlaceholderText('017xxxxxxxx')
    const trxInput = screen.getByPlaceholderText('e.g. 9J28AB34XYZ')

    fireEvent.change(senderInput, { target: { value: '01899887766' } })
    fireEvent.change(trxInput, { target: { value: 'NAGAD12345' } })

    const submitBtn = screen.getByRole('button', { name: /Submit Payment for Verification/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(screen.getByText(/payment verification submitted successfully!/i)).toBeTruthy()
  })
})
