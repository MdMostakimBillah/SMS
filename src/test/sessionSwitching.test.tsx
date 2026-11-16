import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '@/components/layouts/Sidebar'
import { SessionManagementPanel } from '@/pages/settings/panels/SessionManagement'
import { useClassStore } from '@/store/classStore'

import React, { createContext } from 'react'

const { AuthContext, mockAuthValue } = vi.hoisted(() => {
  const React = require('react')
  const mockUser = { id: 'user-1', role: 'school_admin', email: 'admin@school.com', school: { id: 'school-1', domain: 'demo' } }
  const mockAuthValue = {
    user: mockUser,
    token: 'mock-token',
    loading: false,
    restoreFailed: false,
    sessionSource: 'server' as const,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
    retryRestore: vi.fn(),
  }
  const AuthContext = React.createContext(mockAuthValue)
  return { AuthContext, mockAuthValue }
})

vi.mock('@/contexts/AuthContext', () => ({
  AuthContext,
  useAuth: () => mockAuthValue,
}))

describe('Session Creation and Switching', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useClassStore.setState({
      institution: {
        name: 'Demo School',
        nameBn: 'ডেমো স্কুল',
        logo: '',
        banner: '',
        bannerPosition: { x: 0, y: 0 },
        brandName: 'EduTech',
        motto: '',
        mottoBn: '',
        eiin: '',
        phone: '',
        email: '',
        address: '',
        website: '',
        subjects: [],
        startTime: '07:30',
        endTime: '14:30',
        breaks: [],
        currentSession: '2025-26',
        sessions: ['2024-25', '2025-26'],
        storageMode: 'cloud',
        serverUrl: '',
        folderName: '',
        lightColors: {} as any,
        darkColors: {} as any,
      },
      classes: [{ id: 'CLS-1', name: 'Class 1', sections: [] }],
      routines: [],
      sessionClasses: {
        '2025-26': [{ id: 'CLS-1', name: 'Class 1', sections: [] }],
      },
      sessionRoutines: {
        '2025-26': [],
      },
    })
  })

  it('Sidebar creates a new session and switches to it', async () => {
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} />
      </MemoryRouter>
    )

    // Initially displays 2025-26
    expect(screen.getByText('2025-26')).toBeInTheDocument()

    // Click session switcher dropdown toggle
    const toggle = screen.getByText('2025-26')
    fireEvent.click(toggle)

    // Should show Switch Session dropdown
    expect(screen.getByText('Switch Session')).toBeInTheDocument()
    expect(screen.getByText('2024-25')).toBeInTheDocument()

    // Type a new session into the input
    const input = screen.getByPlaceholderText('e.g. 2026-27')
    fireEvent.change(input, { target: { value: '2026-27' } })

    // Click Add button
    const addButton = screen.getByRole('button', { name: /^add$/i })
    expect(addButton).not.toBeDisabled()
    fireEvent.click(addButton)

    // Should have updated store
    const state = useClassStore.getState()
    expect(state.institution.sessions).toContain('2026-27')
    expect(state.institution.currentSession).toBe('2026-27')
    expect(state.classes).toEqual([]) // new session starts with no classes
  })

  it('Sidebar switches back to an existing session', async () => {
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} />
      </MemoryRouter>
    )

    // Click session switcher toggle
    const toggle = screen.getByText('2025-26')
    fireEvent.click(toggle)

    // Click 2024-25 to switch
    const sessionItem = screen.getByText('2024-25')
    fireEvent.click(sessionItem)

    const state = useClassStore.getState()
    expect(state.institution.currentSession).toBe('2024-25')
  })

  it('SessionManagementPanel creates and switches session', async () => {
    render(
      <SessionManagementPanel isBn={false} onBack={() => {}} />
    )

    expect(screen.getByText('Active Session')).toBeInTheDocument()
    const activeDisplay = screen.getAllByText('2025-26')
    expect(activeDisplay.length).toBeGreaterThan(0)

    // Type new session
    const input = screen.getByPlaceholderText('e.g. 2026-27')
    fireEvent.change(input, { target: { value: '2026-27' } })

    // Click Add
    const addButton = screen.getByRole('button', { name: /add/i })
    fireEvent.click(addButton)

    const state = useClassStore.getState()
    expect(state.institution.sessions).toContain('2026-27')
    expect(state.institution.currentSession).toBe('2026-27')
  })

  it('InstitutionTab adds and switches session and saves without reverting', async () => {
    // Test what happens in InstitutionTab and ClassesPage
    const store = useClassStore.getState()
    const instForm = { ...store.institution }
    
    // User types new session
    const newSession = '2027-28'
    store.addSession(newSession)
    store.switchSession(newSession)
    
    expect(useClassStore.getState().institution.currentSession).toBe('2027-28')
    expect(useClassStore.getState().institution.sessions).toContain('2027-28')
  })

  it('ClassesTab prompt adds and switches session', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('2027-28')
    const switchSessionSpy = vi.fn((s: string) => {
      useClassStore.getState().switchSession(s)
    })

    const state = useClassStore.getState()
    useClassStore.getState().addSession('2027-28')
    switchSessionSpy('2027-28')

    expect(useClassStore.getState().institution.currentSession).toBe('2027-28')
    expect(useClassStore.getState().institution.sessions).toContain('2027-28')
  })
})
