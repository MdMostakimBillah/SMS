import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Readable } from 'node:stream'

/**
 * Media storage abstraction (Cloudflare R2 phase).
 *
 * - Credentials live ONLY in the server process environment; they are never
 *   sent to the client and never appear in any Vite bundle (this module is
 *   imported exclusively by apps/api).
 * - All objects are private in a tenant-scoped key space
 *   (`schools/{schoolId}/...`). Access is either a short-lived presigned GET
 *   URL or authorized backend streaming — never a permanent public URL.
 * - The API depends on this interface, so tests inject an in-memory fake and
 *   the app can boot (media endpoints answer 503) when R2 is not configured.
 */

export interface MediaStorage {
  /** Store an object; returns the stored byte size. */
  put(objectKey: string, body: Buffer, contentType: string): Promise<void>
  /** Byte stream for an existing object. */
  getStream(objectKey: string): Promise<Readable>
  /** Remove an object; must be idempotent (missing object is not an error). */
  delete(objectKey: string): Promise<void>
  /** Short-lived presigned GET URL for a private object. */
  presignGet(objectKey: string, ttlSeconds: number): Promise<string>
}

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  mediaBucket: string
}

/** Cloudflare R2 via the S3-compatible API. The account-specific endpoint
 *  format is `https://{accountId}.r2.cloudflarestorage.com`. */
export class R2Storage implements MediaStorage {
  private readonly client: S3Client
  private readonly mediaBucket: string

  constructor(config: R2Config) {
    this.mediaBucket = config.mediaBucket
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async put(objectKey: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.mediaBucket, Key: objectKey, Body: body, ContentType: contentType })
    )
  }

  async getStream(objectKey: string): Promise<Readable> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.mediaBucket, Key: objectKey }))
    if (!res.Body) throw new Error('R2 returned an empty body')
    return res.Body as Readable
  }

  async delete(objectKey: string): Promise<void> {
    // Idempotent: deleting a missing key succeeds silently (S3 semantics).
    await this.client.send(new DeleteObjectCommand({ Bucket: this.mediaBucket, Key: objectKey }))
  }

  async presignGet(objectKey: string, ttlSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.mediaBucket, Key: objectKey })
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds })
  }
}

/**
 * Build the R2 client from the server environment. Returns null when the R2
 * variables are absent — media endpoints then answer 503 instead of failing
 * at boot, so unrelated functionality is never blocked by a missing bucket
 * configuration.
 *
 * Required env (names only — values must never be committed or logged):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_MEDIA_BUCKET
 * Optional:
 *   R2_BACKUPS_BUCKET (reserved for the separate, not-yet-approved backups phase)
 */
export function createStorageFromEnv(env: NodeJS.ProcessEnv = process.env): MediaStorage | null {
  const accountId = env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim()
  const mediaBucket = env.R2_MEDIA_BUCKET?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !mediaBucket) return null
  return new R2Storage({ accountId, accessKeyId, secretAccessKey, mediaBucket })
}
