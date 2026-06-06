import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import AttendancePage from '@/pages/attendance'

describe('AttendancePage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><AttendancePage /></TestWrapper>)
  })
})
