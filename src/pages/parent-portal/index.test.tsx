import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import ParentPortalPage from './index'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'

describe('ParentPortalPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAdmissionStore.persist.clearStorage()
    useClassStore.persist.clearStorage()

    useClassStore.setState({
      institution: {
        id: 'inst-1',
        name: 'Model High School',
        nameBn: 'মডেল হাই স্কুল',
        code: 'MHS-01',
        established: '2000',
        currentSession: '2026-27',
      } as any,
    })
  })

  it('renders Parent Portal with default child and overview tab', async () => {
    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Should render active child (either English or Bengali name)
    await waitFor(() => {
      expect(screen.getByText(/Tahmid Rahman|তাহমিদ রহমান/i)).toBeInTheDocument()
    })

    // Should display tabs
    expect(screen.getByRole('button', { name: /Overview|একনজরে/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Attendance|উপস্থিতি/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Academics|ফলাফল/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fees|ফি ও পেমেন্ট/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Homework|হোমওয়ার্ক/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Notice|যোগাযোগ/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Profile|প্রোফাইল/i })).toBeInTheDocument()
  })

  it('switches tabs properly to Attendance, Academics, and Fees', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Click Attendance Tab
    const attendanceTabBtn = screen.getByRole('button', { name: /Attendance|উপস্থিতি/i })
    await user.click(attendanceTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/Leave Requests|Leave Applications|ছুটির আবেদন/i)).toBeInTheDocument()
    })

    // Click Academics Tab
    const academicsTabBtn = screen.getByRole('button', { name: /Academics|ফলাফল/i })
    await user.click(academicsTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/Annual Final Exam|বার্ষিক পরীক্ষা/i)).toBeInTheDocument()
    })

    // Click Fees Tab
    const feesTabBtn = screen.getByRole('button', { name: /Fees|ফি ও পেমেন্ট/i })
    await user.click(feesTabBtn)

    await waitFor(() => {
      expect(screen.getByText(/Monthly Tuition Fee - November 2026|মাসিক বেতন - নভেম্বর ২০২৬/i)).toBeInTheDocument()
    })
  })

  it('opens and closes the Digital ID Card modal', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Find and click ID Card button
    const idCardBtns = screen.getAllByRole('button', { name: /ID Card|আইডি কার্ড/i })
    expect(idCardBtns.length).toBeGreaterThan(0)
    await user.click(idCardBtns[0])

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByText(/Digital Student ID Card|ডিজিটাল শিক্ষার্থী আইডি কার্ড/i)).toBeInTheDocument()
    })

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close|বন্ধ করুন/i })
    await user.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Digital Student ID Card|ডিজিটাল শিক্ষার্থী আইডি কার্ড/i)).not.toBeInTheDocument()
    })
  })

  it('opens and closes the Online Payment modal', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Find and click Pay Online button
    const payBtns = screen.getAllByRole('button', { name: /Pay Online|ফি পরিশোধ/i })
    expect(payBtns.length).toBeGreaterThan(0)
    await user.click(payBtns[0])

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByText(/Instant Online Fee Payment|অনলাইন ফি পরিশোধ/i)).toBeInTheDocument()
    })

    // Check payment methods exist
    expect(screen.getByText(/bKash/i)).toBeInTheDocument()
    expect(screen.getByText(/Nagad/i)).toBeInTheDocument()

    // Cancel modal
    const cancelBtn = screen.getByRole('button', { name: /Cancel|বাতিল/i })
    await user.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Instant Online Fee Payment|অনলাইন ফি পরিশোধ/i)).not.toBeInTheDocument()
    })
  })

  it('allows switching between multiple children', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <ParentPortalPage />
      </TestWrapper>
    )

    // Open child dropdown
    const switchBtn = screen.getByRole('button', { name: /Switch Child|সন্তান পরিবর্তন/i })
    await user.click(switchBtn)

    // Find Samia Rahman and click
    const samiaBtn = screen.getByRole('button', { name: /Samia Rahman|সামিয়া রহমান/i })
    await user.click(samiaBtn)

    // Display should update to Samia Rahman
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Samia Rahman|সামিয়া রহমান/i })).toBeInTheDocument()
    })
  })
})
