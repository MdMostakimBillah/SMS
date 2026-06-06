import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import PayrollPage from '@/pages/payroll'

describe('PayrollPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><PayrollPage /></TestWrapper>)
  })
})
