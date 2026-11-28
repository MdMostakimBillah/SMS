import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SMSPage from './SMSPage'
import { useSuperAdminStore, PACKAGES } from '@/store/superAdminStore'
import { useSmsStore } from '@/store/smsStore'
import { smsApi } from '@/lib/api'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'sa-1', email: 'admin@edutech.com', role: 'super_admin' },
  }),
}))

describe('SMSPage — Bangladesh Bulk SMS Management & Multi-Institution Distribution', () => {
  beforeEach(() => {
    vi.restoreAllMocks()

    useSuperAdminStore.setState({
      institutions: [
        {
          id: 'inst-1',
          name: 'Dhaka Ideal Academy',
          nameBn: 'ঢাকা আইডিয়াল একাডেমি',
          email: 'ideal@gmail.com',
          phone: '01711223344',
          address: 'Dhaka',
          subdomain: 'ideal',
          slug: 'ideal',
          status: 'active',
          package: PACKAGES[0],
          createdAt: '2026-01-01',
          lastLogin: 'Today',
          logo: '',
          banner: '',
          brandColor: '#06b6d4',
        },
      ],
      selectedId: null,
      searchQuery: '',
      statusFilter: 'all',
      packageFilter: 'all',
    })

    // Ensure clean initial state (zero hardcoded demo records)
    useSmsStore.setState({
      masterPool: { totalPurchased: 0, totalAllocated: 0, totalUsed: 0, available: 0 },
      schools: [],
      institutionBalances: {},
      purchases: [],
      allocations: [],
      dispatchLogs: [],
      gatewayConfigured: false,
      gatewayConfig: {
        providerName: 'BulkSMSBD (Bangladesh)',
        providerType: 'bulksmsbd',
        apiUrl: 'https://bulksmsbd.net/api/smsapi',
        senderId: '',
        username: '',
        isActive: false,
        hasApiKey: false,
        maskedApiKey: '',
      },
    })

    vi.spyOn(smsApi, 'getSuperAdminOverview').mockResolvedValue({
      masterPool: { totalPurchased: 50000, totalAllocated: 10000, totalUsed: 1200, available: 40000 },
      gatewayConfig: {
        providerName: 'BulkSMSBD (Bangladesh)',
        providerType: 'bulksmsbd',
        apiUrl: 'https://bulksmsbd.net/api/smsapi',
        senderId: '8809617600111',
        username: '',
        isActive: true,
        hasApiKey: true,
        maskedApiKey: '••••4321',
        hasPassword: false,
      },
      schools: [
        {
          id: 'inst-1',
          name: 'Dhaka Ideal Academy',
          nameBn: 'ঢাকা আইডিয়াল একাডেমি',
          slug: 'ideal',
          subdomain: 'ideal',
          phone: '01711223344',
          email: 'ideal@gmail.com',
          eiin: '100100',
          status: 'active',
          balance: { allocated: 10000, used: 1200, remaining: 8800 },
        },
      ],
      purchases: [
        {
          id: 'buy-1',
          provider: 'BulkSMSBD',
          quantity: 50000,
          unitPrice: 0.3,
          totalCost: 15000,
          refId: 'INV-01',
          purchasedAt: new Date().toISOString(),
        },
      ],
      allocations: [],
      dispatchLogs: [],
    })
  })

  it('starts store cleanly with zero hardcoded demo data before API hydration', () => {
    const state = useSmsStore.getState()
    expect(state.masterPool.totalPurchased).toBe(0)
    expect(state.purchases).toEqual([])
    expect(state.allocations).toEqual([])
    expect(state.dispatchLogs).toEqual([])
  })

  it('hydrates and renders Master SMS Pool metrics and institution balances', async () => {
    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('50,000')).toBeInTheDocument()
      expect(screen.getAllByText('10,000').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('40,000')).toBeInTheDocument()
      expect(screen.getByText('Dhaka Ideal Academy')).toBeInTheDocument()
      expect(screen.getByText(/8,800/)).toBeInTheDocument()
    })
  })

  it('allocates SMS credits to an institution through backend API', async () => {
    const allocateSpy = vi.spyOn(smsApi, 'allocateToSchool').mockResolvedValueOnce({
      success: true,
      allocation: {
        id: 'alc-new-1',
        schoolId: 'inst-1',
        schoolName: 'Dhaka Ideal Academy',
        amount: 2000,
        type: 'credit',
        note: 'Top up',
        allocatedAt: new Date().toISOString(),
      },
      balance: { allocated: 12000, used: 1200, remaining: 10800 },
      masterPool: { totalPurchased: 50000, totalAllocated: 12000, totalUsed: 1200, available: 38000 },
    })

    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByText('Dhaka Ideal Academy')).toBeInTheDocument())

    const allocateBtns = screen.getAllByRole('button', { name: /Allocate/i })
    fireEvent.click(allocateBtns[0])

    expect(screen.getByText('Allocate SMS Credits to Institution')).toBeInTheDocument()

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'inst-1' } })

    const numberInputs = screen.getAllByRole('spinbutton')
    fireEvent.change(numberInputs[0], { target: { value: '2000' } })

    const confirmBtn = screen.getByRole('button', { name: /Confirm Allocation/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(allocateSpy).toHaveBeenCalledWith({
        schoolId: 'inst-1',
        amount: 2000,
        type: 'credit',
        note: undefined,
      })
      const bal = useSmsStore.getState().getInstitutionBalance('inst-1')
      expect(bal.allocated).toBe(12000)
      expect(bal.remaining).toBe(10800)
    })
  })

  it('records a bulk SMS pool purchase via API', async () => {
    const buySpy = vi.spyOn(smsApi, 'recordPurchase').mockResolvedValueOnce({
      success: true,
      purchase: {
        id: 'buy-2',
        provider: 'BulkSMSBD',
        quantity: 10000,
        unitPrice: 0.3,
        totalCost: 3000,
        refId: 'TX-2',
        purchasedAt: new Date().toISOString(),
      },
      masterPool: { totalPurchased: 60000, totalAllocated: 10000, totalUsed: 1200, available: 50000 },
    })

    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Buy SMS Pool/i }))
    expect(screen.getByText('Purchase Bulk SMS Pool')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Add to Master Pool/i }))

    await waitFor(() => {
      expect(buySpy).toHaveBeenCalled()
      expect(useSmsStore.getState().masterPool.totalPurchased).toBe(60000)
    })
  })

  it('switches tabs cleanly (Purchases, BD Provider Settings, Bulk Broadcast, Audit Logs)', async () => {
    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /BD Provider Gateway/i }))
    expect(screen.getByText('Bangladesh Bulk SMS Provider Gateway')).toBeInTheDocument()
    expect(screen.getByText(/Live Test SMS/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Bulk Broadcast/i }))
    expect(screen.getByText('Super Admin Bulk SMS Broadcast')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Delivery Dispatch Logs/i }))
    expect(screen.getByText('Real-time SMS Dispatch Audit Trail')).toBeInTheDocument()
  })
})
