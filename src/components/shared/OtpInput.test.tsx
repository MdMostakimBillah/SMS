import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OtpInput } from './OtpInput'

describe('OtpInput', () => {
  it('renders correct number of input boxes', () => {
    const handleChange = vi.fn()
    render(<OtpInput length={6} value="" onChange={handleChange} />)

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  it('handles single digit entry and uppercase transformation', () => {
    const handleChange = vi.fn()
    render(<OtpInput length={6} value="" onChange={handleChange} />)

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'a' } })

    expect(handleChange).toHaveBeenCalledWith('A')
  })

  it('handles paste of full code', () => {
    const handleChange = vi.fn()
    render(<OtpInput length={6} value="" onChange={handleChange} />)

    const inputs = screen.getAllByRole('textbox')
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => '123456',
      },
    })

    expect(handleChange).toHaveBeenCalledWith('123456')
  })

  it('disables inputs when disabled is true', () => {
    render(<OtpInput length={6} value="123" onChange={vi.fn()} disabled={true} />)

    const inputs = screen.getAllByRole('textbox')
    inputs.forEach((input) => {
      expect(input).toBeDisabled()
    })
  })
})
