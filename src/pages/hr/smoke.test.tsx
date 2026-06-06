import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import HRPage from '@/pages/hr'

describe('HRPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><HRPage /></TestWrapper>)
  })
})
