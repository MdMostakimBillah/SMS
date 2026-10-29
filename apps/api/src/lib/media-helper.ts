import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import type { MediaStorage } from '../storage.js'

/**
 * Uploads a base64 dataUrl (e.g. data:image/png;base64,...) directly to Cloudflare R2
 * and registers the MediaObject in PostgreSQL.
 *
 * Returns the public media streaming path (e.g. /api/media/public/{id}),
 * or returns the original string if storage is unconfigured / not a dataUrl.
 */
export async function uploadBase64Media(
  storage: MediaStorage | null | undefined,
  prisma: PrismaClient | any,
  schoolId: string,
  category: 'institution_logo' | 'institution_banner',
  dataUrl: string | null | undefined
): Promise<string | null> {
  if (!dataUrl) return null
  if (!storage || !dataUrl.startsWith('data:image/')) {
    return dataUrl
  }

  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      return dataUrl
    }
    const mime = matches[1]
    const buffer = Buffer.from(matches[2], 'base64')
    const ext = mime === 'image/jpeg' ? '.jpg' : mime === 'image/webp' ? '.webp' : '.png'
    const mediaId = randomUUID()
    const objectKey = `schools/${schoolId}/${category}/${mediaId}${ext}`

    await storage.put(objectKey, buffer, mime)

    // Persist media metadata in PostgreSQL
    await prisma.mediaObject.create({
      data: {
        id: mediaId,
        schoolId,
        category,
        objectKey,
        fileName: `${category}_${mediaId}${ext}`,
        mimeType: mime,
        sizeBytes: buffer.length,
      },
    }).catch((err: any) => console.warn('[media-helper] could not record mediaObject in db:', err))

    return `/api/media/public/${mediaId}`
  } catch (err) {
    console.error(`[media-helper] failed to upload base64 ${category} to R2:`, err)
    return dataUrl
  }
}

/**
 * Deletes a previous media object from Cloudflare R2 storage and removes its record from the database.
 * Completely cleans up old image assets when replaced or removed.
 */
export async function deletePreviousMedia(
  storage: MediaStorage | null | undefined,
  prisma: PrismaClient | any,
  schoolId: string,
  mediaUrlOrId: string | null | undefined
): Promise<void> {
  if (!mediaUrlOrId || typeof mediaUrlOrId !== 'string') return

  // Do not attempt to delete base64 dataUrls or blob URLs
  if (mediaUrlOrId.startsWith('data:') || mediaUrlOrId.startsWith('blob:')) return

  // Extract ID if formatted as /api/media/public/{id} or /api/media/{id}
  let mediaId = mediaUrlOrId
  const match = mediaUrlOrId.match(/\/api\/media\/(?:public\/)?([a-zA-Z0-9_-]+)/)
  if (match) {
    mediaId = match[1]
  }

  try {
    // 1. Look up by ID in mediaObject
    let row = await prisma.mediaObject.findFirst({
      where: {
        id: mediaId,
        ...(schoolId ? { schoolId } : {}),
      },
    })
    if (!row) {
      row = await prisma.mediaObject.findUnique({
        where: { id: mediaId },
      }).catch(() => null)
    }

    if (row) {
      if (storage) {
        await storage.delete(row.objectKey).catch((err: any) =>
          console.warn(`[storage] failed to delete R2 object ${row.objectKey}:`, err)
        )
      }
      await prisma.mediaObject.delete({ where: { id: row.id } }).catch((err: any) =>
        console.warn(`[db] failed to delete mediaObject ${row.id}:`, err)
      )
      return
    }

    // 2. Fallback: if mediaUrlOrId contains object key pattern
    if (storage && mediaUrlOrId.includes('schools/')) {
      const match = mediaUrlOrId.match(/schools\/.*$/)
      const key = match ? match[0] : mediaUrlOrId
      await storage.delete(key).catch(() => {})
      await prisma.mediaObject.deleteMany({
        where: {
          objectKey: key,
        },
      }).catch(() => {})
    }
  } catch (err) {
    console.warn(`[media-helper] error deleting previous media ${mediaUrlOrId}:`, err)
  }
}
