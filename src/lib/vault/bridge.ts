/**
 * Zero-import hook registry connecting src/lib/storage.ts (writer side)
 * with src/lib/vault/vault.ts (file sync side).
 *
 * storage.ts must not import vault.ts directly — vault imports storage for
 * slug-change events, so a direct import would create a module cycle. This
 * bridge keeps the dependency graph acyclic: both sides import only this.
 */

export interface VaultBridgeHooks {
  /** Called whenever a persisted store value changes (already in localStorage). */
  onWrite: (key: string, json: string) => void
  /** Called whenever a persisted store key is removed. */
  onRemove: (key: string) => void
}

let hooks: VaultBridgeHooks | null = null
let reloadRequester: (() => void) | null = null

export function registerVaultHooks(h: VaultBridgeHooks): void {
  hooks = h
}

export function clearVaultHooks(): void {
  hooks = null
}

/** storage.ts registers its loadAllStores here so the vault can push external file edits into live stores. */
export function registerReloadRequester(fn: () => void): void {
  reloadRequester = fn
}

export function notifyVaultWrite(key: string, json: string): void {
  hooks?.onWrite(key, json)
}

export function notifyVaultRemove(key: string): void {
  hooks?.onRemove(key)
}

/** Ask every registered store to re-read localStorage (used after vault files change). */
export function requestStoreReload(): void {
  reloadRequester?.()
}

/**
 * Track explicit user deletion actions initiated in software UI (e.g. deleting a
 * teacher, student, class, routine, designation, fee structure, payment).
 *
 * Used as a vital safeguard by vault sync and server sync: an empty dataset is
 * ONLY allowed to overwrite non-empty local files or cloud database if it was
 * preceded by an explicit user deletion within the grace window.
 *
 * Page reloads, unhydrated startups, store resets, or localStorage clearing will
 * NEVER overwrite existing files or database with empty arrays.
 */
let lastExplicitDeleteAt = 0

export function markExplicitUserDelete(): void {
  lastExplicitDeleteAt = Date.now()
}

export function isRecentExplicitDelete(windowMs = 8000): boolean {
  return Date.now() - lastExplicitDeleteAt < windowMs
}

