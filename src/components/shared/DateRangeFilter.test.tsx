import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DateRangeFilter } from './DateRangeFilter'

describe('DateRangeFilter', () => {
  const defaultProps = {
    dateFrom: '',
    dateTo: '',
    setDateFrom: vi.fn(),
    setDateTo: vi.fn(),
    isBn: false,
  }

  it('renders quick filter buttons in English', () => {
    render(<DateRangeFilter {...defaultProps} />)
    expect(screen.getByText('7D')).toBeInTheDocument()
    expect(screen.getByText('30D')).toBeInTheDocument()
    expect(screen.getByText('1M')).toBeInTheDocument()
    expect(screen.getByText('3M')).toBeInTheDocument()
  })

  it('renders Bengali labels when isBn', () => {
    render(<DateRangeFilter {...defaultProps} isBn={true} />)
    expect(screen.getByText('৭ দিন')).toBeInTheDocument()
    expect(screen.getByText('৩০ দিন')).toBeInTheDocument()
    expect(screen.getByText('১ মাস')).toBeInTheDocument()
    expect(screen.getByText('৩ মাস')).toBeInTheDocument()
  })

  it('calls setDateFrom when date input changes', () => {
    const { container } = render(<DateRangeFilter {...defaultProps} />)
    const inputs = container.querySelectorAll('input[type="date"]')
    fireEvent.change(inputs[0], { target: { value: '2026-06-01' } })
    expect(defaultProps.setDateFrom).toHaveBeenCalledWith('2026-06-01')
  })

  it('shows clear button when dates are set in compact variant', () => {
    render(<DateRangeFilter {...defaultProps} dateFrom="2026-06-01" variant="compact" />)
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('does not show clear button when no dates', () => {
    render(<DateRangeFilter {...defaultProps} />)
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })
})
