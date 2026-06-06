import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import Step4Results from '@/pages/exams/step4'

describe('Step4Results', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><Step4Results /></TestWrapper>)
  })
})
