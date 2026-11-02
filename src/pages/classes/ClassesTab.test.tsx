import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('displays section student count and remaining capacity when students are added to class & section', () => {
    const testClass = {
      id: 'CLS-01',
      name: 'PSC',
      nameBn: 'পিএসসি',
      startTime: '07:30',
      endTime: '14:30',
      subjectIds: [],
      sections: [
        {
          id: 'SEC-CLS-01-General',
          name: 'General',
          seatQuantity: 250,
          classTeacherId: '',
          subjectIds: [],
        },
      ],
    }

    const testStudent: any = {
      id: 'ET-2026-00001',
      nameEn: 'Karim Rahman',
      class: 'PSC',
      section: 'General',
      academicYear: '2025-26',
      status: 'pending',
      active: true,
    }

    render(
      <ClassesTab
        {...baseProps}
        classes={[testClass]}
        students={[testStudent]}
      />
    )

    // Class header should show 1/250 seats
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/\/250 seats/)).toBeInTheDocument()

    // Expand the class to view sections
    const classCard = screen.getByText('PSC').closest('div[style*="cursor: pointer"]')!
    fireEvent.click(classCard)

    // Section card should now show the 1/250 student count and 249 seats left
    expect(screen.getByText('1/250')).toBeInTheDocument()
    expect(screen.getByText('249 seats left')).toBeInTheDocument()
  })
})
