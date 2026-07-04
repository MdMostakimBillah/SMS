import type { WithFaceLandmarks, WithFaceDetection } from '@vladmandic/face-api'

export interface QualityMetrics {
  score: number
  detection: number
  angle: { yaw: number; pitch: number; roll: number }
  angleOk: boolean
  sizeOk: boolean
  centerOk: boolean
  blurScore: number
  blurOk: boolean
  overall: 'good' | 'acceptable' | 'poor'
  issues: string[]
}

const MIN_DETECTION_SCORE = 0.5
const MAX_YAW = 15
const MAX_PITCH = 15
const MAX_ROLL = 10
const MIN_FACE_RATIO = 0.05
const MAX_CENTER_OFFSET = 0.3
const MIN_BLUR_SCORE = 50

function estimateBlur(imageData: ImageData): number {
  const { data, width, height } = imageData
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
  }
  let sum = 0
  let count = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const laplacian =
        -4 * gray[idx] +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - width] +
        gray[idx + width]
      sum += laplacian * laplacian
      count++
    }
  }
  return count > 0 ? Math.sqrt(sum / count) : 0
}

export function assessQuality(
  result: WithFaceLandmarks<WithFaceDetection<{}>>,
  video: HTMLVideoElement
): QualityMetrics {
  const issues: string[] = []
  const detection = result.detection
  const angle = result.angle
  const box = detection.box

  const yaw = angle.yaw ?? 0
  const pitch = angle.pitch ?? 0
  const roll = angle.roll ?? 0

  const angleOk = Math.abs(yaw) <= MAX_YAW && Math.abs(pitch) <= MAX_PITCH && Math.abs(roll) <= MAX_ROLL
  if (!angleOk) {
    if (Math.abs(yaw) > MAX_YAW) issues.push(yaw < 0 ? 'Turn head right' : 'Turn head left')
    if (Math.abs(pitch) > MAX_PITCH) issues.push(pitch < 0 ? 'Tilt head up' : 'Tilt head down')
    if (Math.abs(roll) > MAX_ROLL) issues.push('Keep head straight')
  }

  const videoArea = video.videoWidth * video.videoHeight
  const faceArea = box.width * box.height
  const faceRatio = videoArea > 0 ? faceArea / videoArea : 0
  const sizeOk = faceRatio >= MIN_FACE_RATIO
  if (!sizeOk) issues.push('Move closer to camera')

  const faceCenterX = (box.x + box.width / 2) / video.videoWidth
  const faceCenterY = (box.y + box.height / 2) / video.videoHeight
  const centerXOffset = Math.abs(faceCenterX - 0.5)
  const centerYOffset = Math.abs(faceCenterY - 0.5)
  const centerOk = centerXOffset <= MAX_CENTER_OFFSET && centerYOffset <= MAX_CENTER_OFFSET
  if (!centerOk) issues.push('Center your face in the frame')

  let blurScore = 0
  let blurOk = true
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 160
      canvas.height = 120
      ctx.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, 160, 120)
      const imageData = ctx.getImageData(0, 0, 160, 120)
      blurScore = estimateBlur(imageData)
      blurOk = blurScore >= MIN_BLUR_SCORE
      if (!blurOk) issues.push('Image is blurry — hold still')
    }
  } catch {
    blurOk = true
  }

  const detectionOk = detection.score >= MIN_DETECTION_SCORE
  if (!detectionOk) issues.push('Low detection confidence')

  const scoreComponents = [
    { weight: 30, value: Math.min(detection.score / 0.8, 1) },
    { weight: 25, value: angleOk ? 1 : Math.max(0, 1 - (Math.abs(yaw) - MAX_YAW) / 30) },
    { weight: 20, value: sizeOk ? 1 : Math.min(faceRatio / MIN_FACE_RATIO, 1) },
    { weight: 15, value: centerOk ? 1 : Math.max(0, 1 - (centerXOffset + centerYOffset) / MAX_CENTER_OFFSET) },
    { weight: 10, value: blurOk ? 1 : Math.min(blurScore / MIN_BLUR_SCORE, 1) },
  ]
  const score = Math.round(
    scoreComponents.reduce((sum, c) => sum + c.weight * c.value, 0)
  )

  let overall: 'good' | 'acceptable' | 'poor' = 'poor'
  if (score >= 80) overall = 'good'
  else if (score >= 50) overall = 'acceptable'

  return {
    score,
    detection: detection.score,
    angle: { yaw, pitch, roll },
    angleOk,
    sizeOk,
    centerOk,
    blurScore,
    blurOk,
    overall,
    issues,
  }
}

export function isQualityAcceptable(quality: QualityMetrics): boolean {
  return quality.score >= 60 && quality.overall !== 'poor'
}

export { MIN_DETECTION_SCORE, MAX_YAW, MAX_PITCH, MAX_ROLL, MIN_FACE_RATIO, MAX_CENTER_OFFSET, MIN_BLUR_SCORE }
