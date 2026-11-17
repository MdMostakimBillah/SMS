import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ClassesTab from './ClassesTab'
import { defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    can: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canRead: () => true,
    isAdmin: true,
  }),
}))

vi.mock('@/lib/vault/vault', () => ({
  flushVaultWrites: vi.fn(),
}))

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

  it('displays section-level subjects and allows assigning subjects directly to a section inside the collapse', () => {
    const updateClass = vi.fn()
    const updateSection = vi.fn()
    const mockSubjects = [
      { id: 'SUB-01', name: 'Mathematics', nameBn: 'গণিত', code: 'MATH' },
      { id: 'SUB-02', name: 'English', nameBn: 'ইংরেজি', code: 'ENG' },
      { id: 'SUB-03', name: 'Science', nameBn: 'বিজ্ঞান', code: 'SCI' },
    ]

    const testClass = {
      id: 'CLS-01',
      name: 'Class 5',
      nameBn: 'শ্রেণি ৫',
      startTime: '08:00',
      endTime: '14:00',
      subjectIds: ['SUB-01', 'SUB-02'],
      sections: [
        {
          id: 'SEC-CLS-01-A',
          name: 'A',
          seatQuantity: 40,
          classTeacherId: '',
          subjectIds: ['SUB-01', 'SUB-02'],
        },
      ],
    }

    render(
      <MemoryRouter>
        <ClassesTab
          {...baseProps}
          classes={[testClass]}
          subjects={mockSubjects}
          updateClass={updateClass}
          updateSection={updateSection}
        />
      </MemoryRouter>
    )

    // Verify top class card does NOT have the old Class Subjects view button
    expect(screen.queryByTitle('Class Subjects')).not.toBeInTheDocument()

    // Expand class card
    const classCard = screen.getByText('Class 5').closest('div[style*="cursor: pointer"]')!
    fireEvent.click(classCard)

    // When section card is closed: verify no subjects or Add Subjects text is displayed
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument()
    expect(screen.queryByText('English')).not.toBeInTheDocument()
    expect(screen.queryByText(/Add Subject/i)).not.toBeInTheDocument()
    expect(screen.queryByTitle('Section Subjects')).not.toBeInTheDocument()

    // Expand section card by clicking on it
    const sectionCard = screen.getByText('Section A').closest('div[style*="cursor: pointer"]')!
    fireEvent.click(sectionCard)

    // Inside the expanded section card, Section A displays its assigned subjects chips
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()

    // Click Add Subject button inside expanded section
    const addSubjectBtn = screen.getByRole('button', { name: /Add Subject/i })
    expect(addSubjectBtn).toBeInTheDocument()
    fireEvent.click(addSubjectBtn)

    // Modal opens specifically for Class 5 — Section A
    expect(screen.getByText('Select Subjects')).toBeInTheDocument()
    expect(screen.getByText('Class 5 — Section A')).toBeInTheDocument()

    // Search subject functionality in modal
    const modal = screen.getByText('Select Subjects').closest('.modal-content')!
    const searchInput = within(modal).getByPlaceholderText(/Search subject name/i)
    fireEvent.change(searchInput, { target: { value: 'Sci' } })
    expect(within(modal).getByText('Science')).toBeInTheDocument()
    expect(within(modal).queryByText('Mathematics')).not.toBeInTheDocument()

    // Select Science (SUB-03)
    const scienceOption = within(modal).getByText('Science')
    fireEvent.click(scienceOption)

    // Save modal
    const saveBtn = within(modal).getByText(/Save \([0-9]+\)/)
    fireEvent.click(saveBtn)

    // Section should be updated with SUB-01, SUB-02, and SUB-03
    expect(updateSection).toHaveBeenCalledWith('CLS-01', 'SEC-CLS-01-A', {
      subjectIds: expect.arrayContaining(['SUB-01', 'SUB-02', 'SUB-03']),
    })
  })

  it('allows copying class subjects in section subject modal', () => {
    const updateSection = vi.fn()
    const updateClass = vi.fn()
    const mockSubjects = [
      { id: 'SUB-01', name: 'Mathematics', nameBn: 'গণিত', code: 'MATH' },
      { id: 'SUB-02', name: 'English', nameBn: 'ইংরেজি', code: 'ENG' },
    ]

    const testClass = {
      id: 'CLS-01',
      name: 'Class 6',
      nameBn: 'শ্রেণি ৬',
      startTime: '08:00',
      endTime: '14:00',
      subjectIds: ['SUB-01', 'SUB-02'],
      sections: [
        {
          id: 'SEC-CLS-01-A',
          name: 'A',
          seatQuantity: 40,
          classTeacherId: '',
          subjectIds: [],
        },
      ],
    }

    render(
      <MemoryRouter>
        <ClassesTab
          {...baseProps}
          classes={[testClass]}
          subjects={mockSubjects}
          updateClass={updateClass}
          updateSection={updateSection}
        />
      </MemoryRouter>
    )

    // Expand class card
    const classCard = screen.getByText('Class 6').closest('div[style*="cursor: pointer"]')!
    fireEvent.click(classCard)

    // Expand section card to edit mode
    const sectionCard = screen.getByText('Section A').closest('div[style*="cursor: pointer"]')!
    fireEvent.click(sectionCard)

    // Click section subject button
    const addSubjectBtn = screen.getByText('Add Subject')
    fireEvent.click(addSubjectBtn)

    // Modal should show Section mode title
    expect(screen.getByText('Class 6 — Section A')).toBeInTheDocument()

    // "Copy from class" button should be visible because parent class has subjects
    const copyBtn = screen.getByText(/Copy from class subjects/)
    expect(copyBtn).toBeInTheDocument()
    fireEvent.click(copyBtn)

    // Save modal
    const saveBtn = screen.getByText(/Save \([0-9]+\)/)
    fireEvent.click(saveBtn)

    expect(updateSection).toHaveBeenCalledWith('CLS-01', 'SEC-CLS-01-A', {
      subjectIds: expect.arrayContaining(['SUB-01', 'SUB-02']),
    })
  })

  it('applies bulk subjects to both classes and their sections', () => {
    const updateClass = vi.fn()
    const updateSection = vi.fn()
    const mockSubjects = [
      { id: 'SUB-01', name: 'Mathematics', nameBn: 'গণিত', code: 'MATH' },
      { id: 'SUB-02', name: 'English', nameBn: 'ইংরেজি', code: 'ENG' },
    ]

    const testClasses = [
      {
        id: 'CLS-01',
        name: 'Class 1',
        nameBn: 'শ্রেণি ১',
        startTime: '08:00',
        endTime: '14:00',
        subjectIds: [],
        sections: [
          { id: 'SEC-01-A', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
        ],
      },
      {
        id: 'CLS-02',
        name: 'Class 2',
        nameBn: 'শ্রেণি ২',
        startTime: '08:00',
        endTime: '14:00',
        subjectIds: [],
        sections: [
          { id: 'SEC-02-A', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
        ],
      },
    ]

    render(
      <MemoryRouter>
        <ClassesTab
          {...baseProps}
          classes={testClasses}
          subjects={mockSubjects}
          updateClass={updateClass}
          updateSection={updateSection}
        />
      </MemoryRouter>
    )

    // Toggle bulk mode
    const bulkBtn = screen.getByRole('button', { name: /bulk/i })
    fireEvent.click(bulkBtn)

    // Select classes
    fireEvent.click(screen.getByText('Class 1'))
    fireEvent.click(screen.getByText('Class 2'))

    // Click "Subject" button in TopBar
    const subjectBtn = screen.getByRole('button', { name: /subject/i })
    fireEvent.click(subjectBtn)

    // Bulk subject modal is shown
    expect(screen.getByText('Bulk Assign Subjects')).toBeInTheDocument()

    // Select Mathematics
    const mathOption = screen.getByText('Mathematics')
    fireEvent.click(mathOption)

    // Click Save in bulk modal
    const saveBtn = screen.getByText(/Save \([0-9]+\)/)
    fireEvent.click(saveBtn)

    // Check that both classes were updated with Mathematics
    expect(updateClass).toHaveBeenCalledWith('CLS-01', {
      subjectIds: ['SUB-01'],
    })
    expect(updateClass).toHaveBeenCalledWith('CLS-02', {
      subjectIds: ['SUB-01'],
    })

    // Check that sections of both classes were also updated
    expect(updateSection).toHaveBeenCalledWith('CLS-01', 'SEC-01-A', {
      subjectIds: ['SUB-01'],
    })
    expect(updateSection).toHaveBeenCalledWith('CLS-02', 'SEC-02-A', {
      subjectIds: ['SUB-01'],
    })
  })
})
