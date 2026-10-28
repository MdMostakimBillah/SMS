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
