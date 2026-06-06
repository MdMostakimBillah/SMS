import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import SyllabusPage from '@/pages/syllabus'

describe('SyllabusPage', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><SyllabusPage /></TestWrapper>)
  })
})
