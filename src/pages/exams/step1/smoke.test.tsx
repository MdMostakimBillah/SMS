import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import Step1Planning from '@/pages/exams/step1'

describe('Step1Planning', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><Step1Planning /></TestWrapper>)
  })
})
