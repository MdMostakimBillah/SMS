import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaginationControls } from './PaginationControls'

describe('PaginationControls', () => {
  const defaultProps = {
    page: 1,
    setPage: vi.fn(),
    perPage: 10,
    setPerPage: vi.fn(),
    total: 50,
    totalPages: 5,
  }

  it('renders range text', () => {
    render(<PaginationControls {...defaultProps} />)
    expect(screen.getByText('1–10 / 50')).toBeInTheDocument()
  })

  it('returns null when total <= perPage', () => {
    const { container } = render(<PaginationControls {...defaultProps} total={5} totalPages={1} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders page buttons', () => {
    render(<PaginationControls {...defaultProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
