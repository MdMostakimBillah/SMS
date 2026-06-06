import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ProgressBar from './ProgressBar'

describe('ProgressBar', () => {
  it('renders progress fill with correct width', () => {
    const { container } = render(<ProgressBar value={75} />)
    const fill = container.querySelector('.progress-fill')
    expect(fill).toHaveStyle({ width: '75%' })
  })

  it('renders with 0% value', () => {
    const { container } = render(<ProgressBar value={0} />)
    const fill = container.querySelector('.progress-fill')
    expect(fill).toHaveStyle({ width: '0%' })
  })

  it('renders with 100% value', () => {
    const { container } = render(<ProgressBar value={100} />)
    const fill = container.querySelector('.progress-fill')
    expect(fill).toHaveStyle({ width: '100%' })
  })
})
