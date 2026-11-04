import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ClassPromotionPage from './index'
import { useAdmissionStore, type StudentAdmission } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canCreate: () => true,
    canRead: () => true,
    canUpdate: () => true,
    canDelete: () => true,
  }),
}))

const mockStudents: StudentAdmission[] = [
  {
    id: 'ET-202526-0001',
    nameEn: 'Alice Student',
    nameBn: 'অ্যালিস',
    class: 'Class 9',
    section: 'A',
    roll: '01',
    academicYear: '2025-26',
    status: 'approved',
    active: true,
    photo: '',
    gender: 'female',
    dob: '2010-01-01',
    bloodGroup: 'A+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    phone: '01700000001',
    email: '',
    previousSchool: '',
    admissionDate: '2025-01-01',
    presentAddress: '',
    permanentAddress: '',
    district: '',
    fatherNameEn: 'Father A',
    fatherNameBn: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherNid: '',
    motherNameEn: 'Mother A',
    motherNameBn: '',
    motherOccupation: '',
    motherPhone: '',
    motherNid: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ET-202526-0002',
    nameEn: 'Bob Student',
    nameBn: 'বব',
    class: 'Class 9',
    section: 'A',
    roll: '02',
    academicYear: '2025-26',
    status: 'approved',
    active: true,
    photo: '',
    gender: 'male',
    dob: '2010-02-02',
    bloodGroup: 'B+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    phone: '01700000002',
    email: '',
    previousSchool: '',
    admissionDate: '2025-01-01',
    presentAddress: '',
    permanentAddress: '',
    district: '',
    fatherNameEn: 'Father B',
    fatherNameBn: '',
    fatherOccupation: '',
    fatherPhone: '',
    fatherNid: '',
    motherNameEn: 'Mother B',
    motherNameBn: '',
    motherOccupation: '',
    motherPhone: '',
    motherNid: '',
    guardianName: '',
    guardianRelation: '',
    guardianPhone: '',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
]

describe('ClassPromotionPage', () => {
  beforeEach(() => {
    useAdmissionStore.setState({
      students: mockStudents,
      serverSynced: true,
      syncing: false,
      syncError: null,
    })

    useClassStore.setState({
      institution: {
        name: 'Test School',
        nameBn: 'টেস্ট স্কুল',
        code: '1234',
        logo: '',
        currentSession: '2025-26',
        sessions: ['2025-26', '2026-27'],
      },
      classes: [
        {
          id: 'c-1',
          name: 'Class 9',
          nameBn: '৯ম শ্রেণি',
          numericValue: 9,
          sections: [{ id: 's-1', name: 'A', nameBn: 'ক', classId: 'c-1' }],
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'c-2',
          name: 'Class 10',
          nameBn: '১০ম শ্রেণি',
          numericValue: 10,
          sections: [{ id: 's-2', name: 'A', nameBn: 'ক', classId: 'c-2' }],
          createdAt: '',
          updatedAt: '',
        },
      ],
      sessionClasses: {},
    })
  })

  it('renders students list matching active session', () => {
    render(
      <MemoryRouter>
        <ClassPromotionPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Alice Student')).toBeInTheDocument()
    expect(screen.getByText('Bob Student')).toBeInTheDocument()
    expect(screen.getByText(/2 students|২ জন ছাত্র/i)).toBeInTheDocument()
  })

  it('atomically promotes selected students to the new session in a single batch', async () => {
    const bulkAddSpy = vi.spyOn(useAdmissionStore.getState(), 'bulkAddStudents')

    render(
      <MemoryRouter>
        <ClassPromotionPage />
      </MemoryRouter>
    )

    // Select New Session (selects[5]: "2026-27") first so target class options are computed
    const selects = screen.getAllByRole('combobox')
    const newSessionSelect = selects[5]
    expect(newSessionSelect).toBeTruthy()
    fireEvent.change(newSessionSelect, { target: { value: '2026-27' } })

    // Select To Class (selects[3]: "10")
    const toClassSelect = selects[3]
    expect(toClassSelect).toBeTruthy()
    fireEvent.change(toClassSelect, { target: { value: '10' } })

    // Click "Select All"
    const selectAllBtn = screen.getByRole('button', { name: /Select All|সব বাছুন/i })
    fireEvent.click(selectAllBtn)

    // Find and click Promote button
    const promoteBtn = screen.getByRole('button', { name: /Promote 2|২ জন প্রমোট করুন/i })
    fireEvent.click(promoteBtn)

    await waitFor(() => {
      expect(bulkAddSpy).toHaveBeenCalledTimes(1)
    })

    const promotedArg = bulkAddSpy.mock.calls[0][0]
    expect(promotedArg.length).toBe(2)
    expect(promotedArg[0].class).toBe('10')
    expect(promotedArg[0].academicYear).toBe('2026-27')
    expect(promotedArg[0].id).toContain('ET-202627-')
    expect(promotedArg[1].class).toBe('10')
    expect(promotedArg[1].academicYear).toBe('2026-27')

    bulkAddSpy.mockRestore()
  })
})
