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
  const loadingRef = useRef(false)

  useEffect(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    const load = async () => {
      try {
        const uri = '/models'
        console.log('[face-api] Loading models from', uri)
        await faceapi.nets.ssdMobilenetv1.loadFromUri(uri)
        console.log('[face-api] ssdMobilenetv1 loaded')
        await faceapi.nets.faceLandmark68Net.loadFromUri(uri)
        console.log('[face-api] faceLandmark68 loaded')
        await faceapi.nets.faceRecognitionNet.loadFromUri(uri)
        console.log('[face-api] faceRecognition loaded')
        setLoaded(true)
      } catch (err) {
        console.error('[face-api] Failed to load models:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const detectFace = async (
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
  ): Promise<DetectionResult | null> => {
    if (!loaded) return null
    try {
      const result = await faceapi
        .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!result) return null
      return {
        descriptor: result.descriptor,
        box: result.detection.box,
      }
    } catch (err) {
      console.error('[face-api] detectFace error:', err)
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

  return { loaded, loading, detectFace, matchFace }
}
