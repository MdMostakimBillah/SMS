import { useState, useCallback, useRef, useEffect } from 'react'
import * as faceapi from '@vladmandic/face-api'

export interface RegisteredFace {
  staffId: string
  staffName: string
  photo: string
  embedding?: string
}

export interface DetectionResult {
  box: { x: number; y: number; width: number; height: number }
  score: number
}

const MODEL_URL = import.meta.env.BASE_URL + 'models'
const MATCH_THRESHOLD = 0.6

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

function base64ToFloat32(b64: string): Float32Array {
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

  const detectFace = useCallback(async (
    video: HTMLVideoElement
  ): Promise<{ face_detected: boolean; bbox: number[] | null; score: number } | null> => {
    if (!readyRef.current) {
      const ok = await loadModels()
      if (!ok) { setError('Failed to load face detection models'); return null }
    }
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
  }, [])

  const enrollFace = useCallback(async (
    video: HTMLVideoElement
  ): Promise<{ success: boolean; embedding?: string; det_score: number } | null> => {
    if (!readyRef.current) {
      const ok = await loadModels()
      if (!ok) { setError('Failed to load face detection models'); return null }
    }
    try {
      setLoading(true)
      setError(null)
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!detection) { setError('No face detected'); return null }
      if (detection.detection.score < 0.5) {
        setError(`Face quality too low (${detection.detection.score.toFixed(2)})`)
        return null
      }
      const embedding = float32ToBase64(detection.descriptor)
      return { success: true, embedding, det_score: detection.detection.score }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Enrollment failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const recognizeFace = useCallback(async (
    video: HTMLVideoElement,
    enrolledFaces: RegisteredFace[]
  ): Promise<{ personId: string | null; confidence: number; distance: number } | null> => {
    if (!readyRef.current) {
      const ok = await loadModels()
      if (!ok) { setError('Failed to load face detection models'); return null }
    }
    try {
      setLoading(true)
      setError(null)
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!detection) return { personId: null, confidence: 0, distance: 1 }

      const queryEmbedding = detection.descriptor
      let bestMatch: { personId: string; confidence: number; distance: number } | null = null

      for (const face of enrolledFaces) {
        if (!face.embedding) continue
        try {
          const storedEmbedding = base64ToFloat32(face.embedding)
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

      if (bestMatch) return bestMatch
      return { personId: null, confidence: 0, distance: 1 }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recognition failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loaded: modelsReady, loading, error, detectFace, enrollFace, recognizeFace }
}
