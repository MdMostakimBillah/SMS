/**
 * Compress an image file to a JPEG data URL, scaled down to fit within max dimensions.
 * @param file - Image file to compress
 * @param quality - JPEG quality 0-1 (default 0.82)
 * @param maxSize - Maximum width/height in px (default 300)
 */
export async function compressImage(file: File, quality = 0.82, maxSize = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}
