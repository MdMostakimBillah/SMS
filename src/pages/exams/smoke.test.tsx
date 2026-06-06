import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import ExamDashboard from '@/pages/exams'

describe('ExamDashboard', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><ExamDashboard /></TestWrapper>)
  })
})
