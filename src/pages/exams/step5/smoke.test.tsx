import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import Step5Marksheet from '@/pages/exams/step5'

describe('Step5Marksheet', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><Step5Marksheet /></TestWrapper>)
  })
})
