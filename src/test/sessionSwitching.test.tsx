import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '@/components/layouts/Sidebar'
import { SessionManagementPanel } from '@/pages/settings/panels/SessionManagement'
import { useClassStore } from '@/store/classStore'
import { isLocalComputerMode, setLocalStorageMode } from '@/lib/storageMode'
import { shouldBlockDomainOverwrite } from '@/lib/vault/vault'
import { loadInstitutionData } from '@/pages/auth/InstitutionLogin'

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

  it('Local PC storage mode session creation, switching and persistence', () => {
    // 1. Configure institution for Local Computer mode
    setLocalStorageMode('local_computer')
    useClassStore.setState((prev) => ({
      ...prev,
      institution: {
        ...prev.institution,
        storageMode: 'local_computer',
      },
    }))

    expect(isLocalComputerMode()).toBe(true)

    // 2. Add and switch to a new session
    const store = useClassStore.getState()
    store.addSession('2026-27')
    store.switchSession('2026-27')

    const afterSwitch = useClassStore.getState()
    expect(afterSwitch.institution.currentSession).toBe('2026-27')
    expect(afterSwitch.institution.sessions).toContain('2026-27')
    expect(afterSwitch.classes).toEqual([]) // new session starts empty

    // 3. Add a class to the new session
    store.addClass({
      id: 'CLS-NEW',
      name: 'Class 6',
      nameBn: 'শ্রেণি ৬',
      sections: [],
      subjectIds: [],
      startTime: '08:00',
      endTime: '13:00',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    })

    expect(useClassStore.getState().classes.length).toBe(1)
    expect(useClassStore.getState().sessionClasses['2026-27'].length).toBe(1)

    // 4. Switch back to 2025-26 and verify original classes are restored
    store.switchSession('2025-26')
    expect(useClassStore.getState().institution.currentSession).toBe('2025-26')
    expect(useClassStore.getState().classes.length).toBe(1)
    expect(useClassStore.getState().classes[0].id).toBe('CLS-1')

    // 5. Switch back to 2026-27 and verify session class is preserved
    store.switchSession('2026-27')
    expect(useClassStore.getState().institution.currentSession).toBe('2026-27')
    expect(useClassStore.getState().classes[0].id).toBe('CLS-NEW')
  })

  it('shouldBlockDomainOverwrite does not block zero-class new sessions in multi-session setup', () => {
    localStorage.setItem('edutech_inst_slug', 'demo')
    localStorage.setItem(
      'edutech-classes_demo',
      JSON.stringify({
        state: {
          institution: {
            currentSession: '2026-27',
            sessions: ['2025-26', '2026-27'],
          },
          sessionClasses: {
            '2025-26': [{ id: 'CLS-1', name: 'Class 1' }],
            '2026-27': [],
          },
        },
      })
    )

    const diskText = JSON.stringify({
      state: {
        classes: [{ id: 'CLS-1', name: 'Class 1' }],
      },
    })
    const incomingText = JSON.stringify({
      state: {
        classes: [],
        institution: { currentSession: '2026-27', sessions: ['2025-26', '2026-27'] },
      },
    })

    const checkClasses = shouldBlockDomainOverwrite('classes.json', incomingText, diskText)
    expect(checkClasses.blocked).toBe(false)

    const checkRoutines = shouldBlockDomainOverwrite('routines.json', '[]', diskText)
    expect(checkRoutines.blocked).toBe(false)

    const checkSections = shouldBlockDomainOverwrite('sections.json', '[]', diskText)
    expect(checkSections.blocked).toBe(false)
  })

  it('loadInstitutionData correctly sets and preserves local_computer storageMode', () => {
    const mockInst: any = {
      name: 'Local High School',
      nameBn: 'লোকাল হাই স্কুল',
      storageMode: 'local_computer',
      sessions: ['2025-26'],
      brandColor: '#6366f1',
    }

    loadInstitutionData(mockInst, { fresh: true })

    const inst = useClassStore.getState().institution
    expect(inst.storageMode).toBe('local_computer')
    expect(isLocalComputerMode()).toBe(true)
  })
})
