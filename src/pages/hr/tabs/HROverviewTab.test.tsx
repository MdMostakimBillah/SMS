import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { HROverviewTab } from './HROverviewTab'

describe('HROverviewTab', () => {
  const baseProps: any = {
    isBn: false,
    isMobile: false,
    isTablet: false,
    dateFrom: '2026-01-01',
    setDateFrom: () => {},
    dateTo: '2026-01-31',
    setDateTo: () => {},
    employeeSearch: '',
    setEmployeeSearch: () => {},
    employeeStatusFilter: 'all',
    setEmployeeStatusFilter: () => {},
    employeeView: 'grid',
    setEmployeeView: () => {},
    selectedEmployee: null,
    setSelectedEmployee: () => {},
    page: 1,
    setPage: () => {},
    perPage: 10,
    setPerPage: () => {},
    paginatedEmployees: [
      {
        id: 't-1',
        nameEn: 'Md. Mostakim Billah',
        photo: 'data:image/png;base64,mockStaffPhoto',
        designation: 'Senior Teacher',
        phone: '01700000000',
        status: 'active',
        salary: 50000,
        attRate: 95,
      },
      {
        id: 't-2',
        nameEn: 'Md. Rafiqul Islam',
        designation: 'Teacher',
        phone: '01800000000',
        status: 'active',
        salary: 40000,
        attRate: 85,
      },
    ],
    employeeTotalPages: 1,
    employeeList: [],
    quickStats: [],
    getStatusBadge: () => null,
    getTeacherDept: () => 'Science',
    studentPerformanceRank: [
      {
        id: 't-1',
        nameEn: 'Md. Mostakim Billah',
        photo: 'data:image/png;base64,mockStaffPhoto',
        avgScore: 92,
      },
      {
        id: 't-2',
        nameEn: 'Md. Rafiqul Islam',
        avgScore: 84,
      },
    ],
    reportRank: [],
    homeworkRank: [],
    attendanceRank: [],
    adjustedTotalSalary: 90000,
    salaryDeductions: 0,
    totalIncrements: 5000,
    totalBonuses: 10000,
    fundBalance: 25000,
    activeTeachers: [
      {
        id: 't-1',
        nameEn: 'Md. Mostakim Billah',
        photo: 'data:image/png;base64,mockStaffPhoto',
      },
      {
        id: 't-2',
        nameEn: 'Md. Rafiqul Islam',
      },
    ],
  }

  it('renders staff profile image in Top Performers when photo is present', () => {
    render(<HROverviewTab {...baseProps} />)

    // Check that an img with staff photo exists in Top Performers
    const images = screen.getAllByRole('img')
    const staffImg = images.find((img) => img.getAttribute('src') === 'data:image/png;base64,mockStaffPhoto')
    expect(staffImg).toBeTruthy()
    expect(staffImg?.getAttribute('alt')).toBe('Md. Mostakim Billah')
  })

  it('falls back to initials when staff has no photo', () => {
    render(<HROverviewTab {...baseProps} />)

    // For t-2 (Md. Rafiqul Islam), initials 'MR' should be displayed
    expect(screen.getAllByText('MR').length).toBeGreaterThan(0)
  })
})
