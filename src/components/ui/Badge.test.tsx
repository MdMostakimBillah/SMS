import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders with default variant', () => {
    const { container } = render(<Badge>Test</Badge>)
    expect(container.firstChild).toHaveStyle({ background: 'var(--bg-secondary)' })
  })

  it('renders with success variant', () => {
    const { container } = render(<Badge variant="success">OK</Badge>)
    expect(container.firstChild).toHaveStyle({ background: 'var(--green-light)' })
  })

  it('renders with danger variant', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>)
    expect(container.firstChild).toHaveStyle({ background: 'var(--red-light)' })
  })
})
