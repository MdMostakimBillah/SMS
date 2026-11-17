import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SubjectSelectionModal } from './SubjectSelectionModal'
import type { Subject } from '@/pages/teachers/types'

vi.mock('@/lib/vault/vault', () => ({
  flushVaultWrites: vi.fn(),
}))

vi.mock('@/lib/storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/storage')>()
  return {
    ...actual,
    flushPendingWrites: vi.fn(),
  }
})

describe('SubjectSelectionModal', () => {
  const mockSubjects: Subject[] = [
    { id: 'SUB-01', name: 'Mathematics', nameBn: 'গণিত', departmentId: '', departmentIds: [], createdAt: '', updatedAt: '' },
    { id: 'SUB-02', name: 'English', nameBn: 'ইংরেজি', departmentId: '', departmentIds: [], createdAt: '', updatedAt: '' },
    { id: 'SUB-03', name: 'General Science', nameBn: 'সাধারণ বিজ্ঞান', departmentId: '', departmentIds: [], createdAt: '', updatedAt: '' },
  ]

  const mockTarget = {
    classId: 'CLS-01',
    sectionId: 'SEC-01',
    className: 'Class 6',
    sectionName: 'A',
  }

  const defaultProps = {
    subjects: mockSubjects,
    showSubjectModal: mockTarget,
    setShowSubjectModal: vi.fn(),
    tempSelectedSubjects: ['SUB-01'],
    setTempSelectedSubjects: vi.fn(),
    updateSection: vi.fn(),
    updateClass: vi.fn(),
    classes: [
      {
        id: 'CLS-01',
        name: 'Class 6',
        nameBn: 'শ্রেণি ৬',
        startTime: '08:00',
        endTime: '14:00',
        subjectIds: ['SUB-01', 'SUB-02'],
        sections: [
          { id: 'SEC-01', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: ['SUB-01'] },
        ],
      },
    ],
    institutionSubjects: [],
    isBn: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT render quick-add input and renders search subject input instead', () => {
    render(
      <MemoryRouter>
        <SubjectSelectionModal {...defaultProps} />
      </MemoryRouter>
    )

    // Quick add subject input must not exist
    expect(screen.queryByPlaceholderText(/Add new subject/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Add$/i)).not.toBeInTheDocument()

    // Search input must exist
    expect(screen.getByPlaceholderText(/Search subject name/i)).toBeInTheDocument()
  })

  it('filters subjects in real time based on search query', () => {
    render(
      <MemoryRouter>
        <SubjectSelectionModal {...defaultProps} />
      </MemoryRouter>
    )

    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('General Science')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search subject name/i)
    fireEvent.change(searchInput, { target: { value: 'Science' } })

    expect(screen.getByText('General Science')).toBeInTheDocument()
    expect(screen.queryByText('Mathematics')).not.toBeInTheDocument()
    expect(screen.queryByText('English')).not.toBeInTheDocument()
  })

  it('shows no results found with clear search button when query does not match', () => {
    render(
      <MemoryRouter>
        <SubjectSelectionModal {...defaultProps} />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/Search subject name/i)
    fireEvent.change(searchInput, { target: { value: 'NonExistentSubject' } })

    expect(screen.getByText(/No subjects found matching "NonExistentSubject"/i)).toBeInTheDocument()
    const clearBtn = screen.getByRole('button', { name: /Clear search/i })
    expect(clearBtn).toBeInTheDocument()

    // Clicking clear search restores subjects
    fireEvent.click(clearBtn)
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
  })

  it('searches subjects in Bengali when in Bengali mode', () => {
    render(
      <MemoryRouter>
        <SubjectSelectionModal {...defaultProps} isBn={true} />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/বিষয়ের নাম দিয়ে অনুসন্ধান করুন/i)
    fireEvent.change(searchInput, { target: { value: 'বিজ্ঞান' } })

    expect(screen.getByText('সাধারণ বিজ্ঞান')).toBeInTheDocument()
    expect(screen.queryByText('গণিত')).not.toBeInTheDocument()
  })
})
