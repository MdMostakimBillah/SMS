import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnimatedIcon from './AnimatedIcon'

describe('AnimatedIcon', () => {
  it('renders children', () => {
    render(<AnimatedIcon><span>Icon</span></AnimatedIcon>)
    expect(screen.getByText('Icon')).toBeInTheDocument()
  })

  it('applies className', () => {
    const { container } = render(<AnimatedIcon className="my-class">X</AnimatedIcon>)
    expect(container.firstChild).toHaveClass('my-class')
  })

  it('renders with default className', () => {
    const { container } = render(<AnimatedIcon>X</AnimatedIcon>)
    expect(container.firstChild).toHaveClass('icon-animated')
  })
})
