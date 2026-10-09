import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, MAX_IMAGE_SIZE_KB } from './constants'
import {
  compressImageWithinLimit,
  dataUrlBytes,
  imageTooLarge,
  imageTooLargeMessage,
  validateImageSize,
} from './imageUpload'

const imageOfBytes = (bytes: number) =>
  new File([new ArrayBuffer(bytes)], 'photo.jpg', { type: 'image/jpeg' })

describe('imageUpload', () => {
  it('caps every image at 200KB', () => {
    expect(MAX_IMAGE_SIZE_KB).toBe(200)
    expect(MAX_IMAGE_BYTES).toBe(200 * 1024)
  })

  it('accepts an image at exactly the limit', () => {
    expect(imageTooLarge(imageOfBytes(MAX_IMAGE_BYTES))).toBe(false)
  })

  it('rejects an image one byte over the limit', () => {
    expect(imageTooLarge(imageOfBytes(MAX_IMAGE_BYTES + 1))).toBe(true)
  })

  it('returns the message only for oversized images', () => {
    expect(validateImageSize(imageOfBytes(MAX_IMAGE_BYTES), false)).toBeNull()
    expect(validateImageSize(imageOfBytes(MAX_IMAGE_BYTES + 1), false)).toBe(
      'Image must be under 200KB'
    )
  })

  it('phrases the message in Bangla when asked', () => {
    expect(imageTooLargeMessage(true)).toBe('ছবির সাইজ সর্বোচ্চ 200 KB')
  })
})

describe('dataUrlBytes', () => {
  it('measures the decoded payload, not the base64 text', () => {
    expect(dataUrlBytes('data:image/png;base64,AAAA')).toBe(3)
    expect(dataUrlBytes('data:image/png;base64,AAA=')).toBe(2)
    expect(dataUrlBytes('data:image/png;base64,AA==')).toBe(1)
  })

  it('treats a string with no payload as empty', () => {
    expect(dataUrlBytes('data:image/png;base64,')).toBe(0)
    expect(dataUrlBytes('not-a-data-url')).toBe(0)
  })
})

describe('compressImageWithinLimit', () => {
  // jsdom has no canvas backend, so only the already-fits path is exercised
  // here; the shrink loop needs a real browser.
  it('keeps an image that already fits exactly as it was picked', async () => {
    const file = new File(['small'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await compressImageWithinLimit(file)

    expect(result).toMatchObject({ ok: true, bytes: file.size })
    expect(result.ok && result.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
  })

  it('does not re-encode a file that is already inside the cap', async () => {
    const file = new File(['small'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await compressImageWithinLimit(file, { maxDim: 64 })

    expect(result.ok && result.dataUrl.endsWith(btoa('small'))).toBe(true)
  })
})
