import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegistrationFeatureLoop, REGISTRATION_FEATURES } from './RegistrationFeatureLoop'
import InstitutionRegister from '../InstitutionRegister'

vi.mock('@/components/ui/BackgroundPaths', () => ({
  BackgroundPaths: () => null,
}))

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('RegistrationFeatureLoop', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    document.documentElement.dataset.lang = 'en'
  })

  it('renders all platform feature cards in English with a fixed-height loop viewport and aria-hidden clone', () => {
    render(<RegistrationFeatureLoop isBn={false} isDark={false} />)

    const viewport = screen.getByTestId('registration-feature-loop')
    expect(viewport).toHaveClass('h-[13.5rem]', 'overflow-hidden', 'feature-loop-viewport')

    for (const feature of REGISTRATION_FEATURES) {
      // Appears twice in DOM (primary + loop clone), with clone hidden from assistive tech
      const matches = screen.getAllByText(feature.titleEn)
      expect(matches).toHaveLength(2)
    }

    const track = viewport.querySelector('.feature-loop-track')
    expect(track).toBeTruthy()
    expect(track?.children).toHaveLength(2)
    expect(track?.children[0]).toHaveAttribute('aria-hidden', 'false')
    expect(track?.children[1]).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders all platform feature cards in Bengali when isBn is true', () => {
    render(<RegistrationFeatureLoop isBn={true} isDark={true} />)

    for (const feature of REGISTRATION_FEATURES) {
      const matches = screen.getAllByText(feature.titleBn)
      expect(matches).toHaveLength(2)
    }
  })

  it('integrates into InstitutionRegister landing view without expanding wizard until Get Started is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <InstitutionRegister />
      </MemoryRouter>
    )

    expect(screen.getByText('Take Your School Online')).toBeInTheDocument()
    const viewport = screen.getByTestId('registration-feature-loop')
    expect(viewport).toHaveClass('h-[13.5rem]', 'overflow-hidden')
    expect(screen.getAllByText('Biometric & QR Attendance').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cloud, Local PC Vault & RBAC').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Get Started/i }))
    expect(screen.queryByTestId('registration-feature-loop')).not.toBeInTheDocument()
  })
})
