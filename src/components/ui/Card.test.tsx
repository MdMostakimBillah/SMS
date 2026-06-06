import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from './Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies default styles', () => {
    const { container } = render(<Card>Test</Card>)
    expect(container.firstChild).toHaveStyle({
      background: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      padding: '1rem',
    })
  })

  it('merges custom style', () => {
    const { container } = render(<Card style={{ padding: '2rem' }}>Test</Card>)
    expect(container.firstChild).toHaveStyle({ padding: '2rem' })
  })

  it('passes className', () => {
    const { container } = render(<Card className="custom">Test</Card>)
    expect(container.firstChild).toHaveClass('custom')
  })
})
