import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import ClassesPage from '@/pages/classes'

describe('ClassesPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><ClassesPage /></TestWrapper>)
  })
})
