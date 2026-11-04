import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StaffAvatar, getStaffProfileImageUrl } from './StaffAvatar'

describe('StaffAvatar', () => {
  it('generates an offline SVG profile avatar data url', () => {
    const maleUrl = getStaffProfileImageUrl('Md. Mostakim Billah', 'ET-1001', 'male')
    expect(maleUrl).toContain('data:image/svg+xml')
    expect(maleUrl).toContain('%3Csvg')

    const femaleUrl = getStaffProfileImageUrl('Nusrat Jahan', 'ET-1002', 'female')
    expect(femaleUrl).toContain('data:image/svg+xml')
  })

  it('renders uploaded photo if provided', () => {
    render(
      <StaffAvatar
        id="t-1"
        name="Md. Mostakim Billah"
        photo="data:image/png;base64,mockPhoto123"
        alt="Md. Mostakim Billah"
      />
    )

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('data:image/png;base64,mockPhoto123')
    expect(img.getAttribute('alt')).toBe('Md. Mostakim Billah')
  })

  it('renders offline SVG profile avatar when photo is empty or missing', () => {
    render(
      <StaffAvatar
        id="t-2"
        name="Md. Rafiqul Islam"
        photo=""
        alt="Md. Rafiqul Islam"
      />
    )

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toContain('data:image/svg+xml')
    expect(img.getAttribute('alt')).toBe('Md. Rafiqul Islam')
  })

  it('falls back to offline SVG avatar if uploaded photo fails to load', () => {
    render(
      <StaffAvatar
        id="t-3"
        name="Broken Photo Staff"
        photo="https://broken-domain.invalid/photo.jpg"
        alt="Broken Photo Staff"
      />
    )

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('https://broken-domain.invalid/photo.jpg')

    // Trigger onError
    fireEvent.error(img)

    expect(img.getAttribute('src')).toContain('data:image/svg+xml')
  })
})
