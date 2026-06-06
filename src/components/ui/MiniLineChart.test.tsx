import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import MiniLineChart from './MiniLineChart'

describe('MiniLineChart', () => {
  it('renders SVG', () => {
    const { container } = render(<MiniLineChart data={[10, 20, 30]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders polyline with points', () => {
    const { container } = render(<MiniLineChart data={[10, 20, 30]} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toBeInTheDocument()
    expect(polyline?.getAttribute('points')).toBeTruthy()
  })

  it('handles empty data', () => {
    const { container } = render(<MiniLineChart data={[]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
