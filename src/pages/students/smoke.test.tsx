import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import StudentsPage from '@/pages/students'

describe('StudentsPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><StudentsPage /></TestWrapper>)
  })
})
