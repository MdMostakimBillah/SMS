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
