import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import ClassesPage from '@/pages/classes'
import RoutineTab from '@/pages/classes/tabs/RoutineTab'

describe('ClassesPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><ClassesPage /></TestWrapper>)
  })

  it('renders RoutineTab without crashing when class times are inverted or negative (RangeError prevention)', () => {
    const mockClass = {
      id: 'cls-1',
      name: 'Class 1',
      nameBn: 'শ্রেণি ১',
      startTime: '10:00',
      endTime: '02:00', // 12-hour format entered without 24-hour PM
      sections: [{ id: 'sec-1', name: 'A' }],
    }
    const mockInstitution = {
      startTime: '10:00',
      endTime: '02:00',
      breaks: [],
    }

    render(
      <TestWrapper>
        <RoutineTab
          classes={[mockClass]}
          routines={[]}
          teachers={[]}
          subjects={[]}
          institution={mockInstitution}
          updateRoutine={() => {}}
          setRoutineSlot={() => {}}
          clearRoutineSlot={() => {}}
          isBn={false}
          isMobile={false}
        />
      </TestWrapper>
    )

    // Should render periods successfully without throwing RangeError
    expect(screen.getByText('Class 1')).toBeInTheDocument()
  })

  it('renders RoutineTab safely when times are completely invalid or missing', () => {
    const mockClass = {
      id: 'cls-2',
      name: 'Class 2',
      nameBn: 'শ্রেণি ২',
      startTime: 'invalid',
      endTime: '',
      sections: [{ id: 'sec-2', name: 'B' }],
    }
    const mockInstitution = {
      startTime: '',
      endTime: '',
      breaks: [],
    }

    render(
      <TestWrapper>
        <RoutineTab
          classes={[mockClass]}
          routines={[]}
          teachers={[]}
          subjects={[]}
          institution={mockInstitution}
          updateRoutine={() => {}}
          setRoutineSlot={() => {}}
          clearRoutineSlot={() => {}}
          isBn={false}
          isMobile={false}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Class 2')).toBeInTheDocument()
  })
})
