import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import NotFoundPage from '@/pages/NotFound'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <NotFoundPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('NotFoundPage', () => {
  it('renders the animated 404 artwork and navigation actions', () => {
    renderAt('/no/such/page')
    expect(screen.getByRole('img', { name: /404/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /go back/i })).toBeDefined()
  })

  it('shows the attempted path', () => {
    renderAt('/no/such/page')
    expect(screen.getByText('/no/such/page')).toBeDefined()
  })
})
