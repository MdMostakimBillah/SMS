import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import Step2Scheduling from '@/pages/exams/step2'

describe('Step2Scheduling', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><Step2Scheduling /></TestWrapper>)
  })
})
