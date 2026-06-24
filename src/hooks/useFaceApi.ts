import { useEffect, useRef, useState } from 'react'
import * as faceapi from '@vladmandic/face-api'

export interface RegisteredFace {
  staffId: string
  staffName: string
  photo: string
  descriptor: number[]
}

export interface DetectionResult {
  descriptor: Float32Array
  box: { x: number; y: number; width: number; height: number }
}

const MATCH_THRESHOLD = 0.5

export function useFaceApi() {
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    const load = async () => {
      try {
        const uri = '/models'
        await faceapi.nets.tinyFaceDetector.loadFromUri(uri)
        await faceapi.nets.faceLandmark68Net.loadFromUri(uri)
        await faceapi.nets.faceRecognitionNet.loadFromUri(uri)
        setLoaded(true)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const detectFace = async (
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    fast = false
  ): Promise<DetectionResult | null> => {
    if (!loaded) return null
    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: fast ? 224 : 320,
        scoreThreshold: fast ? 0.3 : 0.4,
      })
      const result = await faceapi
        .detectSingleFace(input, options)
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!result) return null
      return {
        descriptor: result.descriptor,
        box: result.detection.box,
      }
    } catch (err) {
      setError(String(err))
      return null
    }
  }

  const matchFace = (
    descriptor: Float32Array,
    registeredFaces: RegisteredFace[]
  ): RegisteredFace | null => {
    if (registeredFaces.length === 0) return null
    let bestMatch: RegisteredFace | null = null
    let bestDistance = Infinity
    for (const face of registeredFaces) {
      const refDescriptor = new Float32Array(face.descriptor)
      const distance = faceapi.euclideanDistance(descriptor, refDescriptor)
      if (distance < bestDistance) {
        bestDistance = distance
        bestMatch = face
      }
    }
    if (bestDistance < MATCH_THRESHOLD) return bestMatch
    return null
  }

  return { loaded, loading, error, detectFace, matchFace }
}
