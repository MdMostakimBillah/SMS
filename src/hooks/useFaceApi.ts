import { useState, useCallback } from 'react'
import { faceApi, type RecognizeResponse, type EnrollResponse } from '@/lib/api'

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

  const detectFace = useCallback(async (
    _input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    _fast?: boolean
  ): Promise<DetectionResult | null> => {
    return null
  }, [])

  const matchFace = useCallback((
    _descriptor: Float32Array,
    _registeredFaces: RegisteredFace[]
  ): RegisteredFace | null => {
    return null
  }, [])

  return { loaded: true, loading, error, detectFace, matchFace, enrollFace, recognizeFace }
}
