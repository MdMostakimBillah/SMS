import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders text', () => {
    render(<EmptyState icon={<span>Icon</span>} text="No data found" />)
    expect(screen.getByText('No data found')).toBeInTheDocument()
  })

  it('renders Bengali text when isBn', () => {
    render(<EmptyState icon={<span>Icon</span>} text="No data" textBn="কোনো ডাটা নেই" isBn={true} />)
    expect(screen.getByText('কোনো ডাটা নেই')).toBeInTheDocument()
  })

  it('renders English text when not isBn', () => {
    render(<EmptyState icon={<span>Icon</span>} text="No data" textBn="কোনো ডাটা নেই" isBn={false} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders icon', () => {
    render(<EmptyState icon={<span data-testid="icon">⭐</span>} text="Empty" />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
