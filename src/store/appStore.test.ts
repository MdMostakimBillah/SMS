import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({ theme: 'dark', language: 'bn', sidebarOpen: false })
  })

  it('has default state', () => {
    const state = useAppStore.getState()
    expect(state.theme).toBe('dark')
    expect(state.language).toBe('bn')
    expect(state.sidebarOpen).toBe(false)
  })

  it('setTheme changes theme', () => {
    useAppStore.getState().setTheme('light')
    expect(useAppStore.getState().theme).toBe('light')
  })

  it('setTheme applies data-theme to document', () => {
    useAppStore.getState().setTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('setLanguage changes language', () => {
    useAppStore.getState().setLanguage('en')
    expect(useAppStore.getState().language).toBe('en')
  })

  it('toggleSidebar toggles sidebarOpen', () => {
    expect(useAppStore.getState().sidebarOpen).toBe(false)
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(true)
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })

  it('persists theme and language to localStorage', () => {
    useAppStore.getState().setTheme('light')
    useAppStore.getState().setLanguage('en')
    const stored = JSON.parse(localStorage.getItem('edutech-settings') || '{}')
    expect(stored.state.theme).toBe('light')
    expect(stored.state.language).toBe('en')
  })

  it('does not persist sidebarOpen', () => {
    useAppStore.getState().toggleSidebar()
    const stored = JSON.parse(localStorage.getItem('edutech-settings') || '{}')
    expect(stored.state?.sidebarOpen).toBeUndefined()
  })
})
