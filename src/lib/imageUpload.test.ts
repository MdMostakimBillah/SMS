import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, MAX_IMAGE_SIZE_KB } from './constants'
import { imageTooLarge, imageTooLargeMessage, validateImageSize } from './imageUpload'

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
