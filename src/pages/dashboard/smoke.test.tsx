import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import DashboardPage from '@/pages/dashboard'

describe('DashboardPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><DashboardPage /></TestWrapper>)
  })
})
