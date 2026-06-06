import { type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

export function TestWrapper({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>
}
