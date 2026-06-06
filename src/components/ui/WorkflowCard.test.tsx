import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkflowCard from './WorkflowCard'
import { BookOpen } from 'lucide-react'

describe('WorkflowCard', () => {
  const defaultProps = {
    icon: BookOpen,
    iconColor: '#fff',
    iconBg: 'var(--brand)',
    title: 'Exams',
    titleBn: 'পরীক্ষা',
    description: 'Manage exams',
    descriptionBn: 'পরীক্ষা পরিচালনা',
    onClick: vi.fn(),
  }

  it('renders title and description', () => {
    render(<WorkflowCard {...defaultProps} />)
    expect(screen.getByText('Exams')).toBeInTheDocument()
    expect(screen.getByText('Manage exams')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    render(<WorkflowCard {...defaultProps} />)
    fireEvent.click(screen.getByText('Exams'))
    expect(defaultProps.onClick).toHaveBeenCalled()
  })

  it('renders stat when provided', () => {
    render(<WorkflowCard {...defaultProps} stat="24" />)
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('renders badge when provided', () => {
    render(<WorkflowCard {...defaultProps} badge="New" />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })
})
