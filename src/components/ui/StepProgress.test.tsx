import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StepProgress, { type Step } from './StepProgress'
import { FileText, Calendar, BarChart3 } from 'lucide-react'

const mockSteps: Step[] = [
  { key: 'step1', label: 'Planning', labelBn: 'পরিকল্পনা', icon: FileText, status: 'completed' },
  { key: 'step2', label: 'Scheduling', labelBn: 'সময়সূচী', icon: Calendar, status: 'current' },
  { key: 'step3', label: 'Evaluation', labelBn: 'মূল্যায়ন', icon: BarChart3, status: 'upcoming' },
]

describe('StepProgress', () => {
  it('renders all step labels', () => {
    render(<StepProgress steps={mockSteps} />)
    expect(screen.getByText('Planning')).toBeInTheDocument()
    expect(screen.getByText('Scheduling')).toBeInTheDocument()
    expect(screen.getByText('Evaluation')).toBeInTheDocument()
  })

  it('calls onStepClick when step clicked', () => {
    const onClick = vi.fn()
    render(<StepProgress steps={mockSteps} onStepClick={onClick} />)
    fireEvent.click(screen.getByText('Planning'))
    expect(onClick).toHaveBeenCalledWith('step1')
  })
})
