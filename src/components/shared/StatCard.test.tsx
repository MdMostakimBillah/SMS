import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from './StatCard'

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Students" value="1,234" icon={<span>📚</span>} />)
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('renders change indicator', () => {
    render(<StatCard label="Revenue" value="$50k" change="+12%" changeType="up" icon={<span>💰</span>} />)
    expect(screen.getByText('+12%')).toBeInTheDocument()
  })

  it('renders icon', () => {
    render(<StatCard label="Test" value="1" icon={<span data-testid="icon">⭐</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
