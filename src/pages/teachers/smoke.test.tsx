import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import TeachersPage from '@/pages/teachers'

describe('TeachersPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><TeachersPage /></TestWrapper>)
  })
})
