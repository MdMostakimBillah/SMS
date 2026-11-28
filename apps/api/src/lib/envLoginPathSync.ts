import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { isValidLoginPathSegment, normalizeLoginPathSegment } from './loginPathCrypto.js'

export type EnvSyncStatus = 'synced' | 'readonly' | 'missing' | 'disabled'

export interface EnvSyncResult {
  envSynced: boolean
  envSyncStatus: EnvSyncStatus
  targetsUpdated: number
}

export class EnvIntegrityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvIntegrityError'
  }
}

type AllowedEnvKey = 'VITE_LOGIN_PATH' | 'SUPER_ADMIN_LOGIN_PATH'

const ALLOWED_BASENAMES = new Set(['.env', '.env.local'])
const KEY_LINE_RE = /^([ \t]*(?:export[ \t]+)?)(VITE_LOGIN_PATH|SUPER_ADMIN_LOGIN_PATH)([ \t]*=.*)$/
const KEY_LINE_GLOBAL_KEYS = new Set<string>(['VITE_LOGIN_PATH', 'SUPER_ADMIN_LOGIN_PATH'])

// In-process per-canonical-file async mutex prevents overlapping read-modify-write races.
const pathLocks = new Map<string, Promise<unknown>>()

function withFileLock<T>(canonicalPath: string, fn: () => Promise<T>): Promise<T> {
  const prev = pathLocks.get(canonicalPath) ?? Promise.resolve()
  const run = prev.then(fn, fn)
  const settled = run.then(
    () => undefined,
    () => undefined
  )
  pathLocks.set(canonicalPath, settled)
  return run.finally(() => {
    if (pathLocks.get(canonicalPath) === settled) {
      pathLocks.delete(canonicalPath)
    }
  })
}

function findRepoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  // Standard layout: apps/api/src/lib -> repoRoot is 4 levels up.
  const candidate = path.resolve(here, '../../../..')
  if (fs.existsSync(path.join(candidate, 'package.json'))) {
    return candidate
  }
  return path.resolve(process.cwd())
}

function validateTargetWithinAnchor(targetPath: string, anchorRoot: string, allowCustomBasename = false): string {
  const resolved = path.resolve(targetPath)
  const basename = path.basename(resolved)
  if (!allowCustomBasename && !ALLOWED_BASENAMES.has(basename)) {
    throw new EnvIntegrityError(`Refusing non-allowlisted env filename: ${basename}`)
  }

  const realAnchor = fs.realpathSync(anchorRoot)
  const dir = path.dirname(resolved)
  if (!fs.existsSync(dir)) {
    throw new EnvIntegrityError('Target directory does not exist')
  }
  const realDir = fs.realpathSync(dir)
  const rel = path.relative(realAnchor, realDir)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new EnvIntegrityError('Refusing env path outside allowed root directory')
  }
  return path.join(realDir, basename)
}

export function resolveEnvTargets(explicitTargets?: string[]): { targets: string[]; disabled: boolean } {
  if (explicitTargets) {
    return {
      targets: explicitTargets.map((t) => path.resolve(t)),
      disabled: false,
    }
  }

  if (process.env.DISABLE_ENV_FILE_SYNC === 'true') {
    return { targets: [], disabled: true }
  }

  const explicitEnvSyncPath = (process.env.ENV_SYNC_PATH || '').trim()
  if (explicitEnvSyncPath) {
    const resolved = path.resolve(explicitEnvSyncPath)
    const dir = path.dirname(resolved)
    return {
      targets: [validateTargetWithinAnchor(resolved, dir, ALLOWED_BASENAMES.has(path.basename(resolved)))],
      disabled: false,
    }
  }

  // Never mutate the workspace's live .env during automated Vitest / test runs unless explicitly configured.
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    return { targets: [], disabled: true }
  }

  const repoRoot = findRepoRoot()
  const targets: string[] = []
  const rootEnv = path.join(repoRoot, '.env')
  if (fs.existsSync(rootEnv)) {
    targets.push(validateTargetWithinAnchor(rootEnv, repoRoot))
  }

  // Only include apps/api/.env when it already declares a login-path key.
  const apiDir = path.join(repoRoot, 'apps', 'api')
  const apiEnv = path.join(apiDir, '.env')
  if (fs.existsSync(apiEnv)) {
    try {
      const stat = fs.lstatSync(apiEnv)
      if (!stat.isSymbolicLink() && stat.isFile()) {
        const content = fs.readFileSync(apiEnv, 'utf8')
        if (/^[ \t]*(?:export[ \t]+)?(?:VITE_LOGIN_PATH|SUPER_ADMIN_LOGIN_PATH)[ \t]*=/m.test(content)) {
          targets.push(validateTargetWithinAnchor(apiEnv, repoRoot))
        }
      }
    } catch {
      // Skip optional api .env inspection errors cleanly.
    }
  }

  return { targets, disabled: false }
}

interface ParsedLine {
  text: string
  eol: string
  key: AllowedEnvKey | null
  prefix: string
}

function splitPreservingEol(content: string): { bom: string; lines: ParsedLine[] } {
  const bom = content.startsWith('\uFEFF') ? '\uFEFF' : ''
  const body = bom ? content.slice(1) : content
  if (!body) {
    return { bom, lines: [] }
  }

  const rawChunks = body.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g) ?? []
  const lines: ParsedLine[] = []
  for (const chunk of rawChunks) {
    if (chunk === '') continue
    let eol = ''
    let text = chunk
    if (chunk.endsWith('\r\n')) {
      eol = '\r\n'
      text = chunk.slice(0, -2)
    } else if (chunk.endsWith('\n') || chunk.endsWith('\r')) {
      eol = chunk.slice(-1)
      text = chunk.slice(0, -1)
    }
    const match = text.match(KEY_LINE_RE)
    lines.push({
      text,
      eol,
      key: match ? (match[2] as AllowedEnvKey) : null,
      prefix: match ? match[1] : '',
    })
  }
  return { bom, lines }
}

function buildReplacementValue(key: AllowedEnvKey, cleanPath: string): string {
  return key === 'VITE_LOGIN_PATH' ? `/${cleanPath}` : cleanPath
}

function transformEnvContent(raw: string, cleanPath: string, keyToWrite: AllowedEnvKey): string {
  if (/[\r\n\0\s$"'`\\#=;]/.test(cleanPath) || !isValidLoginPathSegment(cleanPath)) {
    throw new EnvIntegrityError('Rejected unsafe value for .env update')
  }

  const { bom, lines } = splitPreservingEol(raw)
  const dominantEol = raw.includes('\r\n') ? '\r\n' : '\n'
  const newValue = buildReplacementValue(keyToWrite, cleanPath)

  const beforeNonTarget: string[] = []
  const updatedLines: ParsedLine[] = []
  let replaced = false

  for (const line of lines) {
    if (line.key === keyToWrite) {
      if (!replaced) {
        updatedLines.push({
          text: `${line.prefix}${keyToWrite}=${newValue}`,
          eol: line.eol,
          key: keyToWrite,
          prefix: line.prefix,
        })
        replaced = true
      }
      // If duplicated lines for the same target key existed previously, coalesce cleanly into one.
      continue
    }

    beforeNonTarget.push(`${line.text}\u0000${line.eol}`)
    updatedLines.push(line)
  }

  let appendedToNoTrailingEol = false
  if (!replaced) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].eol === '') {
      updatedLines[updatedLines.length - 1] = {
        ...updatedLines[updatedLines.length - 1],
        eol: dominantEol,
      }
      appendedToNoTrailingEol = true
    }
    updatedLines.push({
      text: `${keyToWrite}=${newValue}`,
      eol: dominantEol,
      key: keyToWrite,
      prefix: '',
    })
  }

  // Mandatory fail-closed differential invariant: every non-target line, comment,
  // blank line, quote, secret, and line ending must remain 100% byte-for-byte identical
  // (allowing only the single missing trailing EOL added when appending at EOF).
  const afterNonTarget = updatedLines
    .filter((l) => l.key !== keyToWrite)
    .map((l) => `${l.text}\u0000${l.eol}`)

  if (beforeNonTarget.length !== afterNonTarget.length) {
    throw new EnvIntegrityError('Pre-write integrity check failed: unrelated line count changed')
  }
  for (let i = 0; i < beforeNonTarget.length; i++) {
    const isAdjustedLastLine = appendedToNoTrailingEol && i === beforeNonTarget.length - 1
    const expectedLine = isAdjustedLastLine
      ? beforeNonTarget[i].replace(/\u0000$/, `\u0000${dominantEol}`)
      : beforeNonTarget[i]
    if (expectedLine !== afterNonTarget[i]) {
      throw new EnvIntegrityError('Pre-write integrity check failed: unrelated env entry altered')
    }
  }

  const rendered = bom + updatedLines.map((l) => `${l.text}${l.eol}`).join('')
  if (!rendered.trim()) {
    throw new EnvIntegrityError('Pre-write integrity check failed: empty output buffer')
  }

  return rendered
}

async function assertRegularNonSymlinkFile(targetPath: string): Promise<void> {
  const stat = await fsPromises.lstat(targetPath)
  if (stat.isSymbolicLink()) {
    throw new EnvIntegrityError('Refusing to modify symbolic link .env file')
  }
  if (!stat.isFile()) {
    throw new EnvIntegrityError('Refusing non-regular .env file target')
  }
}

async function atomicUpdateSingleFile(
  targetPath: string,
  cleanPath: string,
  keysPresentOrDefault: AllowedEnvKey[]
): Promise<void> {
  await withFileLock(targetPath, async () => {
    await assertRegularNonSymlinkFile(targetPath)
    const raw = await fsPromises.readFile(targetPath, 'utf8')

    // Determine which allowed keys to update in this file.
    const { lines } = splitPreservingEol(raw)
    const keysInFile = new Set(lines.map((l) => l.key).filter((k): k is AllowedEnvKey => k !== null && KEY_LINE_GLOBAL_KEYS.has(k)))
    const keysToUpdate: AllowedEnvKey[] =
      keysInFile.size > 0 ? Array.from(keysInFile) : keysPresentOrDefault

    let nextContent = raw
    for (const k of keysToUpdate) {
      nextContent = transformEnvContent(nextContent, cleanPath, k)
    }

    if (nextContent === raw) {
      // Ensure restrictive permissions even when value already matches.
      await fsPromises.chmod(targetPath, 0o600).catch(() => {})
      return
    }

    const dir = path.dirname(targetPath)
    const tmpPath = path.join(dir, `.env.${randomBytes(6).toString('hex')}.tmp`)
    let handle: fsPromises.FileHandle | null = null
    let renamed = false

    try {
      handle = await fsPromises.open(
        tmpPath,
        fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL,
        0o600
      )
      await handle.writeFile(nextContent, 'utf8')
      await handle.sync()
      await handle.close()
      handle = null

      await fsPromises.rename(tmpPath, targetPath)
      renamed = true
    } finally {
      if (handle) {
        await handle.close().catch(() => {})
      }
      if (!renamed) {
        await fsPromises.unlink(tmpPath).catch(() => {})
      }
    }
  })
}

/**
 * Safely read ONLY `VITE_LOGIN_PATH` or `SUPER_ADMIN_LOGIN_PATH` from the
 * repository `.env` without loading or returning any other secrets.
 */
export async function readEnvLoginPath(explicitTargets?: string[]): Promise<string | null> {
  try {
    if (!explicitTargets && !(process.env.ENV_SYNC_PATH || '').trim() && (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test')) {
      return null
    }
    const repoRoot = findRepoRoot()
    const candidates = explicitTargets
      ? explicitTargets.map((t) => path.resolve(t))
      : [
          ...(process.env.ENV_SYNC_PATH?.trim() ? [path.resolve(process.env.ENV_SYNC_PATH.trim())] : []),
          path.join(repoRoot, '.env'),
        ]

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue
      const stat = await fsPromises.lstat(candidate)
      if (stat.isSymbolicLink() || !stat.isFile()) continue
      const raw = await fsPromises.readFile(candidate, 'utf8')
      const { lines } = splitPreservingEol(raw)
      for (const line of lines) {
        if (line.key === 'VITE_LOGIN_PATH' || line.key === 'SUPER_ADMIN_LOGIN_PATH') {
          const eqIdx = line.text.indexOf('=')
          if (eqIdx === -1) continue
          const rawVal = line.text.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          const clean = normalizeLoginPathSegment(rawVal)
          if (isValidLoginPathSegment(clean)) {
            return clean
          }
        }
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * Atomically replace `VITE_LOGIN_PATH` (and `SUPER_ADMIN_LOGIN_PATH` if already
 * present) in the resolved project `.env` file(s) without altering any other
 * variables, comments, or formatting.
 */
export async function syncLoginPathToEnv(
  loginPath: string,
  options?: { targets?: string[] }
): Promise<EnvSyncResult> {
  const clean = normalizeLoginPathSegment(loginPath)
  if (!isValidLoginPathSegment(clean) || /[\r\n\0\s$"'`\\#=;]/.test(clean)) {
    throw new EnvIntegrityError('Invalid Super Admin login path value')
  }

  let resolved: { targets: string[]; disabled: boolean }
  try {
    resolved = resolveEnvTargets(options?.targets)
  } catch (err) {
    if (err instanceof EnvIntegrityError) throw err
    return { envSynced: false, envSyncStatus: 'missing', targetsUpdated: 0 }
  }

  if (resolved.disabled) {
    return { envSynced: false, envSyncStatus: 'disabled', targetsUpdated: 0 }
  }
  if (resolved.targets.length === 0) {
    return { envSynced: false, envSyncStatus: 'missing', targetsUpdated: 0 }
  }

  let updated = 0
  for (const target of resolved.targets) {
    try {
      await atomicUpdateSingleFile(target, clean, ['VITE_LOGIN_PATH'])
      updated++
    } catch (err: unknown) {
      if (err instanceof EnvIntegrityError) {
        throw err
      }
      const code = (err as NodeJS.ErrnoException | undefined)?.code
      if (code === 'ENOENT') {
        continue
      }
      if (code === 'EROFS') {
        return { envSynced: false, envSyncStatus: 'readonly', targetsUpdated: updated }
      }
      throw new EnvIntegrityError(`Failed to update env safely (${code || 'UNKNOWN'})`)
    }
  }

  if (updated === 0) {
    return { envSynced: false, envSyncStatus: 'missing', targetsUpdated: 0 }
  }

  return {
    envSynced: true,
    envSyncStatus: 'synced',
    targetsUpdated: updated,
  }
}
