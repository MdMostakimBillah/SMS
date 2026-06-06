import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CircularChart from './CircularChart'

describe('CircularChart', () => {
  it('renders SVG with percentage text', () => {
    render(<CircularChart value={75} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('renders 0%', () => {
    render(<CircularChart value={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('clamps value at 100%', () => {
    render(<CircularChart value={150} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('clamps negative value at 0%', () => {
    render(<CircularChart value={-10} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders SVG element', () => {
    const { container } = render(<CircularChart value={50} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
