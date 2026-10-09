import { MAX_IMAGE_BYTES, MAX_IMAGE_SIZE_KB } from '@/lib/constants'

/**
 * True when an image exceeds the app-wide upload ceiling.
 *
 * Every image input shares this one limit. It used to be re-declared per page
 * as 1MB, 2MB or 5MB — and several inputs (school logo, register logo,
 * CreateSchool's file picker) had no check at all, so a multi-megabyte photo
 * went straight into localStorage and stayed there.
 */
export function imageTooLarge(file: File): boolean {
  return file.size > MAX_IMAGE_BYTES
}

/** Bilingual rejection message, matching the surrounding page copy. */
export function imageTooLargeMessage(isBn: boolean): string {
  return isBn
    ? `ছবির সাইজ সর্বোচ্চ ${MAX_IMAGE_SIZE_KB} KB`
    : `Image must be under ${MAX_IMAGE_SIZE_KB}KB`
}

/**
 * Returns the rejection message when the file is over the limit, otherwise
 * `null`. Callers keep their own error surface — inline field error or alert —
 * and reset the input value themselves where they already do.
 */
export function validateImageSize(file: File, isBn: boolean): string | null {
  return imageTooLarge(file) ? imageTooLargeMessage(isBn) : null
}

/** Quality steps walked through when the first encode is still over the cap. */
const QUALITY_STEPS = [0.82, 0.7, 0.6, 0.5, 0.4, 0.3]
/** Longest edge we will shrink to before giving up. */
const MIN_DIMENSION = 64

export type CompressResult =
  | { ok: true; dataUrl: string; bytes: number }
  | { ok: false; reason: 'too-large' | 'decode-failed' }

/** Decoded size of a base64 data URL, in bytes. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return 0
  const base64 = dataUrl.slice(comma + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

/**
 * Encode an image as a data URL, shrinking it until it fits the 200KB cap.
 *
 * The cap is judged on the *encoded result* rather than on the picked file, so
 * an ordinary 4MB phone photo is accepted — it downscales to a fraction of the
 * limit — while a scan that is still oversized after shrinking is refused.
 * `validateImageSize` stays for the inputs that keep the original bytes
 * untouched, where there is nothing to shrink.
 *
 * A source that is not a JPEG is re-encoded as PNG first, so logos and
 * signatures keep their transparency instead of getting JPEG's flattened
 * background behind them; if PNG still will not fit it falls back to JPEG.
 *
 * @param opts.maxDim Longest edge in px. Defaults to the image's own long edge.
 */
export async function compressImageWithinLimit(
  file: File,
  opts: { maxDim?: number } = {}
): Promise<CompressResult> {
  // Already inside the cap — keep the original bytes, since re-encoding a file
  // that already fits can only lose quality.
  if (file.size <= MAX_IMAGE_BYTES) {
    return { ok: true, dataUrl: await readAsDataURL(file), bytes: file.size }
  }

  const image = await decodeImage(file)
  if (!image) return { ok: false, reason: 'decode-failed' }

  const keepAlpha = file.type !== 'image/jpeg' && file.type !== 'image/jpg'
  const startDim = opts.maxDim ?? Math.max(image.naturalWidth, image.naturalHeight)

  for (const dim of shrinkSteps(startDim)) {
    const canvas = drawScaled(image, dim)
    const attempts: Array<[string, number]> = keepAlpha
      ? [['image/png', 1], ...QUALITY_STEPS.map((q): [string, number] => ['image/jpeg', q])]
      : QUALITY_STEPS.map((q): [string, number] => ['image/jpeg', q])

    for (const [type, quality] of attempts) {
      const dataUrl = canvas.toDataURL(type, quality)
      const bytes = dataUrlBytes(dataUrl)
      if (bytes <= MAX_IMAGE_BYTES) return { ok: true, dataUrl, bytes }
    }
  }

  return { ok: false, reason: 'too-large' }
}

/** Longest edges to try, stepping down by 25% to a floor of MIN_DIMENSION. */
function shrinkSteps(start: number): number[] {
  const steps: number[] = []
  let dim = Math.max(MIN_DIMENSION, Math.round(start))
  while (steps.length < 12) {
    steps.push(dim)
    if (dim <= MIN_DIMENSION) break
    dim = Math.max(MIN_DIMENSION, Math.round(dim * 0.75))
  }
  return steps
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function decodeImage(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

function drawScaled(image: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  const scale = Math.min(1, maxDim / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}
