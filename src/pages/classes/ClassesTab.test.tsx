import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClassesTab from './ClassesTab'
import { defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'

describe('ClassesTab Component', () => {
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

  it('renders session indicator and does not show manual sync banner', () => {
    render(<ClassesTab {...baseProps} />)

    expect(screen.getByText('2025-26')).toBeInTheDocument()
    expect(screen.getByText('Current Session')).toBeInTheDocument()
    // Manual sync button banner should not be present
    expect(screen.queryByText('Sync Database')).not.toBeInTheDocument()
    expect(screen.queryByText('Provider Cloud Database')).not.toBeInTheDocument()
  })

  it('renders in Bengali correctly without manual sync banner', () => {
    render(<ClassesTab {...baseProps} isBn={true} />)

    expect(screen.getByText('2025-26')).toBeInTheDocument()
    expect(screen.getByText('বর্তমান সেশন')).toBeInTheDocument()
    expect(screen.queryByText('ডাটাবেজ সিঙ্ক')).not.toBeInTheDocument()
  })
})
