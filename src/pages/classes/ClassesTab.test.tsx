import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClassesTab from './ClassesTab'
import { defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'

describe('ClassesTab Storage Architecture Connection', () => {
  const mockInstitution = {
    name: 'Test Institution',
    nameBn: 'টেস্ট প্রতিষ্ঠান',
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
    sessions: ['2025-26'],
    storageMode: 'cloud',
    serverUrl: '',
    folderName: '',
    lightColors: defaultThemeColors,
    darkColors: defaultThemeColorsDark,
  }

  const baseProps = {
    institution: mockInstitution,
    classes: [],
    teachers: [],
    subjects: [],
    students: [],
    addClass: vi.fn(),
    updateClass: vi.fn(),
    deleteClass: vi.fn(),
    addSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
    switchSession: vi.fn(),
    importFromSession: vi.fn(),
    isBn: false,
    isMobile: false,
  }

  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('renders Provider Cloud Database badge in cloud mode', () => {
    sessionStorage.setItem('edutech_storage_mode', 'cloud')
    render(<ClassesTab {...baseProps} />)

    expect(screen.getByText('Provider Cloud Database')).toBeInTheDocument()
    expect(screen.getByText('Sync Database')).toBeInTheDocument()
  })

  it('renders Local PC Storage badge in local_computer mode', () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    render(<ClassesTab {...baseProps} />)

    expect(screen.getByText('Local PC Storage')).toBeInTheDocument()
    expect(screen.getByText('Export JSON to PC')).toBeInTheDocument()
  })

  it('renders Custom VPS Server badge in local_server mode', () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_server')
    sessionStorage.setItem('edutech_server_url', 'https://vps.school.edu.bd')
    render(
      <ClassesTab
        {...baseProps}
        institution={{ ...mockInstitution, storageMode: 'local_server', serverUrl: 'https://vps.school.edu.bd' }}
      />
    )

    expect(screen.getByText('Custom VPS Server')).toBeInTheDocument()
    expect(screen.getByText('Sync VPS')).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/vps\.school\.edu\.bd/)).toBeInTheDocument()
  })
})
