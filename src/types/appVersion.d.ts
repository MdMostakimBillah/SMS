/**
 * Version of the bundle that is currently executing. Injected at build time by
 * `vite.config.ts`, which reads `public/version.txt` — the file the `prebuild`
 * script stamps on every build and that the server publishes as `/version.txt`.
 *
 * It is empty when that file is absent (a checkout that has never been built,
 * or a test runner that doesn't go through the Vite `define` step); callers must
 * treat that as "version unknown" rather than as a real version.
 */
declare global {
  const __APP_VERSION__: string
}

export {}
