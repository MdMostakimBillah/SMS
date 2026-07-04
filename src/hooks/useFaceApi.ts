import { useState, useCallback, useRef, useEffect } from 'react'
import * as faceapi from '@vladmandic/face-api'
import { assessQuality, isQualityAcceptable, type QualityMetrics } from '@/lib/faceQuality'
import { logAuditEvent } from '@/lib/faceAudit'

export interface RegisteredFace {
  staffId: string
  staffName: string
  photo: string
  embedding?: string
  embeddings?: string[]
  enrolledAt?: string
  qualityScore?: number
}

export interface DetectionResult {
  box: { x: number; y: number; width: number; height: number }
  score: number
}

export interface EnrollResult {
  success: boolean
  embedding?: string
  embeddings?: string[]
  det_score: number
  quality: QualityMetrics
}

export interface RecognizeResult {
  personId: string | null
  confidence: number
  distance: number
  quality?: QualityMetrics
}

export interface FullDetectionResult {
  detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>
  quality: QualityMetrics
}

const MODEL_URL = import.meta.env.BASE_URL + 'models'
const MATCH_THRESHOLD = 0.6
const MULTI_ANGLE_COUNT = 5
const QUALITY_MIN_SCORE = 50

let modelsLoaded = false
let modelsLoading = false

async function loadModels() {
  if (modelsLoaded) return true
  if (modelsLoading) {
    await new Promise<void>((r) => {
      const check = setInterval(() => {
        if (modelsLoaded) { clearInterval(check); r() }
      }, 100)
    })
    return true
  }
  modelsLoading = true
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    modelsLoaded = true
    return true
  } catch {
    modelsLoading = false
    return false
  }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0
}

function float32ToBase64(arr: Float32Array): string {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function base64ToFloat32(b64: string): Float32Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Float32Array(bytes.buffer)
}

export function useFaceApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelsReady, setModelsReady] = useState(false)
  const readyRef = useRef(false)

  useEffect(() => {
    loadModels().then((ok) => {
      if (ok) {
        setModelsReady(true)
        readyRef.current = true
      }
    })
  }, [])

  const ensureModels = useCallback(async (): Promise<boolean> => {
    if (readyRef.current) return true
    const ok = await loadModels()
    if (!ok) {
      setError('Failed to load face detection models')
      return false
    }
    return true
  }, [])

  const detectFace = useCallback(async (
    video: HTMLVideoElement
  ): Promise<{ face_detected: boolean; bbox: number[] | null; score: number } | null> => {
    if (!(await ensureModels())) return null
    try {
      setError(null)
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
      if (!detection) return { face_detected: false, bbox: null, score: 0 }
      const { x, y, width, height } = detection.box
      return {
        face_detected: true,
        bbox: [x, y, x + width, y + height],
        score: detection.score,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Detection failed'
      setError(msg)
      return null
    }
  }, [ensureModels])

  const detectFull = useCallback(async (
    video: HTMLVideoElement
  ): Promise<FullDetectionResult | null> => {
    if (!(await ensureModels())) return null
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!detection) return null
      const quality = assessQuality(detection, video)
      return { detection, quality }
    } catch {
      return null
    }
  }, [ensureModels])

  const detectWithExpressions = useCallback(async (
    video: HTMLVideoElement
  ): Promise<faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>> | null> => {
    if (!(await ensureModels())) return null
    try {
      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceExpressions()
      return result || null
    } catch {
      return null
    }
  }, [ensureModels])

  const enrollFace = useCallback(async (
    video: HTMLVideoElement,
    options?: { multiAngle?: boolean }
  ): Promise<EnrollResult | null> => {
    if (!(await ensureModels())) return null
    try {
      setLoading(true)
      setError(null)
      const first = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!first) { setError('No face detected'); return null }
      const quality = assessQuality(first, video)
      if (!isQualityAcceptable(quality)) {
        setError(`Quality too low (${quality.score}/100): ${quality.issues.join(', ')}`)
        return null
      }
      const primaryEmbedding = float32ToBase64(first.descriptor)
      const embeddings: string[] = [primaryEmbedding]

      if (options?.multiAngle) {
        const angles = ['center', 'left', 'right', 'up', 'down']
        for (let i = 1; i < MULTI_ANGLE_COUNT; i++) {
          await new Promise((r) => setTimeout(r, 300))
          const extra = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
            .withFaceLandmarks()
            .withFaceDescriptor()
          if (extra && extra.detection.score >= 0.5) {
            const similarity = cosineSimilarity(first.descriptor, extra.descriptor)
            if (similarity > 0.6) {
              embeddings.push(float32ToBase64(extra.descriptor))
            }
          }
          if (i < angles.length) {
            const angleLabel = angles[i]
            logAuditEvent({
              type: 'enrolled',
              qualityScore: quality.score,
              reason: `Angle capture: ${angleLabel}`,
            })
          }
        }
      }

      logAuditEvent({
        type: 'enrolled',
        qualityScore: quality.score,
        livenessPassed: true,
        reason: `${embeddings.length} angle(s) captured`,
      })

      return {
        success: true,
        embedding: primaryEmbedding,
        embeddings,
        det_score: first.detection.score,
        quality,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Enrollment failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [ensureModels])

  const recognizeFace = useCallback(async (
    video: HTMLVideoElement,
    enrolledFaces: RegisteredFace[]
  ): Promise<RecognizeResult | null> => {
    if (!(await ensureModels())) return null
    try {
      setLoading(true)
      setError(null)
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!detection) return { personId: null, confidence: 0, distance: 1 }

      const quality = assessQuality(detection, video)
      const queryEmbedding = detection.descriptor
      let bestMatch: { personId: string; confidence: number; distance: number } | null = null

      for (const face of enrolledFaces) {
        const allEmbeddings: string[] = []
        if (face.embedding) allEmbeddings.push(face.embedding)
        if (face.embeddings) allEmbeddings.push(...face.embeddings)

        for (const embStr of allEmbeddings) {
          try {
            const storedEmbedding = base64ToFloat32(embStr)
            const distance = 1 - cosineSimilarity(queryEmbedding, storedEmbedding)
            if (distance < MATCH_THRESHOLD) {
              const confidence = 1 - distance
              if (!bestMatch || confidence > bestMatch.confidence) {
                bestMatch = { personId: face.staffId, confidence, distance }
              }
            }
          } catch {
            continue
          }
        }
      }

      if (bestMatch) {
        logAuditEvent({
          type: 'recognized',
          personId: bestMatch.personId,
          confidence: bestMatch.confidence,
          qualityScore: quality.score,
        })
        return { ...bestMatch, quality }
      }

      logAuditEvent({
        type: 'rejected',
        reason: 'No matching face found',
        qualityScore: quality.score,
      })
      return { personId: null, confidence: 0, distance: 1, quality }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recognition failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [ensureModels])

  const assessVideoQuality = useCallback(async (
    video: HTMLVideoElement
  ): Promise<QualityMetrics | null> => {
    const result = await detectFull(video)
    return result?.quality || null
  }, [detectFull])

  return {
    loaded: modelsReady,
    loading,
    error,
    detectFace,
    detectFull,
    detectWithExpressions,
    enrollFace,
    recognizeFace,
    assessVideoQuality,
  }
}

export { MATCH_THRESHOLD, MULTI_ANGLE_COUNT, QUALITY_MIN_SCORE }
