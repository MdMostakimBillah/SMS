/**
 * Write guard registry — a single backstop that blocks localStorage writes
 * when the app is in a read-only state (e.g. an expired license past its
 * grace period).
 *
 * Dependency graph is acyclic: this module imports nothing from the app.
 *   storage.ts ← writeGuard.ts
 *   appStore.ts ← writeGuard.ts  (registers a guard that reads its own state)
 *
 * storage.ts checks `isWriteAllowed()` before every persist write, so all 21
 * stores are covered through the single funnel without modifying any store.
 */

export type WriteGuard = () => boolean

let writeGuard: WriteGuard | null = null

/** Register the guard. Called once by appStore after the store is created. */
export function registerWriteGuard(guard: WriteGuard): void {
  writeGuard = guard
}

/** Clear the guard (mainly for tests). */
export function clearWriteGuard(): void {
  writeGuard = null
}

/**
 * True when writes to localStorage / the vault are allowed.
 * Defaults to true when no guard is registered.
 */
export function isWriteAllowed(): boolean {
  return writeGuard ? writeGuard() : true
}
