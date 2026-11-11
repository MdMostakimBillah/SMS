import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SMSPage from './SMSPage'
import { useSuperAdminStore, PACKAGES } from '@/store/superAdminStore'
import { useSmsStore } from '@/store/smsStore'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'sa-1', email: 'admin@edutech.com', role: 'super_admin' },
  }),
}))

describe('SMSPage — Super Admin SMS Management & Real Distribution', () => {
  beforeEach(() => {
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

    useSmsStore.setState({
      masterPool: {
        totalPurchased: 50000,
        totalAllocated: 10000,
        totalUsed: 1200,
      },
      institutionBalances: {
        'inst-1': { allocated: 10000, used: 1200, remaining: 8800 },
      },
      purchases: [
        {
          id: 'BUY-TEST-1',
          provider: 'Grameenphone SIM Gateway',
          quantity: 50000,
          unitPrice: 0.35,
          totalCost: 17500,
          refId: 'TX-TEST-001',
          purchasedAt: new Date().toISOString(),
        },
      ],
      allocations: [],
      dispatchLogs: [],
      gatewayConfig: {
        providerName: 'SIM SMS Provider',
        providerType: 'sim_gateway',
        apiUrl: '',
        apiKey: '',
        senderId: 'EduTech',
        isActive: true,
      },
    })
  })

  it('renders Master SMS Pool metrics and institution table correctly', () => {
    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    // Check Master Pool KPIs
    expect(screen.getByText('50,000')).toBeInTheDocument() // Total purchased
    expect(screen.getAllByText('10,000').length).toBeGreaterThanOrEqual(1) // Total allocated / inst allocation
    expect(screen.getByText('40,000')).toBeInTheDocument() // Available to allocate
    expect(screen.getAllByText('1,200').length).toBeGreaterThanOrEqual(1)  // Consumed

    // Check institution row
    expect(screen.getByText('Dhaka Ideal Academy')).toBeInTheDocument()
    expect(screen.getByText(/8,800/)).toBeInTheDocument()
  })

  it('allocates SMS credits to an institution successfully', async () => {
    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    // Click "Allocate to School"
    const allocateBtns = screen.getAllByRole('button', { name: /Allocate/i })
    fireEvent.click(allocateBtns[0])

    // Verify modal is open
    expect(screen.getByText('Allocate SMS Credits to Institution')).toBeInTheDocument()

    // Select institution
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'inst-1' } })

    // Set amount to 2000
    const numberInputs = screen.getAllByRole('spinbutton')
    fireEvent.change(numberInputs[0], { target: { value: '2000' } })

    // Click "Confirm Allocation"
    const confirmBtn = screen.getByRole('button', { name: /Confirm Allocation/i })
    fireEvent.click(confirmBtn)

    // Expect store state to reflect the updated balance
    await waitFor(() => {
      const bal = useSmsStore.getState().getInstitutionBalance('inst-1')
      expect(bal.allocated).toBe(12000)
      expect(bal.remaining).toBe(10800)
    })
  })

  it('records a new SMS pool purchase from SIM provider', async () => {
    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    // Click "Buy SMS Pool" button
    const buyBtn = screen.getByRole('button', { name: /Buy SMS Pool/i })
    fireEvent.click(buyBtn)

    expect(screen.getByText('Purchase SMS from SIM Provider')).toBeInTheDocument()

    // Submit the buy modal
    const addToPoolBtn = screen.getByRole('button', { name: /Add to Master Pool/i })
    fireEvent.click(addToPoolBtn)

    // Expect total purchased pool to increase
    await waitFor(() => {
      expect(useSmsStore.getState().masterPool.totalPurchased).toBe(60000)
    })
  })

  it('switches between tabs (Purchases, Gateway Settings, Audit Logs)', () => {
    render(
      <BrowserRouter>
        <SMSPage isBn={false} />
      </BrowserRouter>
    )

    // Switch to Gateway Settings
    const gatewayTab = screen.getByRole('button', { name: /Provider Gateway Settings/i })
    fireEvent.click(gatewayTab)
    expect(screen.getByText('SIM SMS Provider Gateway Configuration')).toBeInTheDocument()
    expect(screen.getByText('Live Test SMS')).toBeInTheDocument()

    // Switch to Delivery Logs
    const logsTab = screen.getByRole('button', { name: /Delivery Dispatch Logs/i })
    fireEvent.click(logsTab)
    expect(screen.getByText('Real-time SMS Dispatch Audit Trail')).toBeInTheDocument()
  })

  it('deducts SMS balance when sending an SMS', async () => {
    const res = await useSmsStore.getState().sendSMS({
      institutionId: 'inst-1',
      institutionName: 'Dhaka Ideal Academy',
      phone: '01700000000',
      message: 'Test fee collection notice',
      type: 'fee',
    })

    expect(res.success).toBe(true)
    const updatedBal = useSmsStore.getState().getInstitutionBalance('inst-1')
    expect(updatedBal.remaining).toBe(8799)
    expect(updatedBal.used).toBe(1201)
  })

  it('blocks sending SMS when institution balance is exhausted', async () => {
    // Set balance to 0
    useSmsStore.setState({
      institutionBalances: {
        'inst-1': { allocated: 1000, used: 1000, remaining: 0 },
      },
    })

    const res = await useSmsStore.getState().sendSMS({
      institutionId: 'inst-1',
      institutionName: 'Dhaka Ideal Academy',
      phone: '01700000000',
      message: 'Notice with zero balance',
      type: 'manual',
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain('exhausted')
  })
})
