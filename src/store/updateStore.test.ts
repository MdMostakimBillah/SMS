import { afterEach, describe, expect, it, vi } from 'vitest'

const SERVER_VERSION = '2000'

/**
 * Boot a fresh copy of the store as it would load in a browser session:
 * `resetModules` gives us a new module registry (so module-level state such as
 * the dismissed version resets) and stubs the build stamp the Vite `define`
 * step would otherwise inject.
 */
async function bootApp(bundleVersion: string) {
  vi.resetModules()
  vi.stubGlobal('__APP_VERSION__', bundleVersion)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, text: async () => `${SERVER_VERSION}\n` })
  )
  return (await import('./updateStore')).useUpdateStore
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('updateStore', () => {
  it('does not prompt when the running bundle already matches the server', async () => {
    const store = await bootApp(SERVER_VERSION)
    await store.getState().checkForUpdate()
    expect(store.getState().isUpdateAvailable).toBe(false)
  })

  it('prompts when the server publishes a newer build', async () => {
    const store = await bootApp('1000')
    await store.getState().checkForUpdate()
    expect(store.getState().isUpdateAvailable).toBe(true)
    expect(store.getState().latestVersion).toBe(SERVER_VERSION)
  })

  it('stays quiet for the rest of the session after the user presses Later', async () => {
    const store = await bootApp('1000')
    await store.getState().checkForUpdate()
    store.getState().dismiss()
    expect(store.getState().isUpdateAvailable).toBe(false)

    await store.getState().checkForUpdate()
    expect(store.getState().isUpdateAvailable).toBe(false)
  })

  it('offers the update again on the next app open after a cancel', async () => {
    const firstSession = await bootApp('1000')
    await firstSession.getState().checkForUpdate()
    firstSession.getState().dismiss()

    // Closing and reopening the app: a new module registry, and the user still
    // has not applied the update.
    const nextSession = await bootApp('1000')
    await nextSession.getState().checkForUpdate()
    expect(nextSession.getState().isUpdateAvailable).toBe(true)
  })
})
