import { useState, useCallback } from 'react'
import { faceApi, type RecognizeResponse, type EnrollResponse, type DetectResponse } from '@/lib/api'

export interface RegisteredFace {
  staffId: string
  staffName: string
  photo: string
}

export interface DetectionResult {
  descriptor: Float32Array
  box: { x: number; y: number; width: number; height: number }
}

export function useFaceApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const captureImage = useCallback((video: HTMLVideoElement): string | null => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    return dataUrl.split(',')[1]
  }, [])

  const detectFace = useCallback(async (
    video: HTMLVideoElement
  ): Promise<DetectResponse | null> => {
    const base64 = captureImage(video)
    if (!base64) {
      setError('Failed to capture image')
      return null
    }
    try {
      setError(null)
      const result = await faceApi.detect(base64)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Detection failed'
      setError(msg)
      return null
    }
  }, [captureImage])

  const enrollFace = useCallback(async (
    video: HTMLVideoElement,
    personId: string,
    personType: 'teacher' | 'student'
  ): Promise<EnrollResponse | null> => {
    const base64 = captureImage(video)
    if (!base64) {
      setError('Failed to capture image')
      return null
    }
    try {
      setLoading(true)
      setError(null)
      const result = await faceApi.enroll(personId, personType, base64)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Enrollment failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [captureImage])

  const recognizeFace = useCallback(async (
    video: HTMLVideoElement
  ): Promise<RecognizeResponse | null> => {
    const base64 = captureImage(video)
    if (!base64) {
      setError('Failed to capture image')
      return null
    }
    try {
      setLoading(true)
      setError(null)
      const result = await faceApi.recognize(base64)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recognition failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [captureImage])

  return { loaded: true, loading, error, detectFace, enrollFace, recognizeFace }
}
