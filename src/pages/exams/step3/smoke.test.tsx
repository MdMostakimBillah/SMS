import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import Step3Evaluation from '@/pages/exams/step3'

describe('Step3Evaluation', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><Step3Evaluation /></TestWrapper>)
  })
})
