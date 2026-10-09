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
