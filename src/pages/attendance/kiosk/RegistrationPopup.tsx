import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, User, GraduationCap, AlertTriangle } from 'lucide-react'
import { useFaceApi, type RegisteredFace } from '@/hooks/useFaceApi'
import { logAuditEvent } from '@/lib/faceAudit'
import LivenessCheck from './LivenessCheck'

interface Person {
  id: string
  name: string
  nameEn: string
  photo: string
  type: 'staff' | 'student'
}

interface RegistrationPopupProps {
  isBn: boolean
  person: Person
  existingFaces: RegisteredFace[]
  onEnrolled: (faces: RegisteredFace[]) => void
  onClose: () => void
}

const STORAGE_KEY = 'kioskFaces'
const STABLE_THRESHOLD = 5
const REG_DETECT_MS = 400

function saveFaces(faces: RegisteredFace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(faces))
}

function playSuccessSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {}
}

export default function RegistrationPopup({ isBn, person, existingFaces, onEnrolled, onClose }: RegistrationPopupProps) {
  const { detectFace, detectWithExpressions, enrollFace } = useFaceApi()
  const [camActive, setCamActive] = useState(false)
  const [phase, setPhase] = useState<'camera' | 'liveness' | 'capturing' | 'done' | 'error'>('camera')
  const [faceDetected, setFaceDetected] = useState(false)
  const [autoStatus, setAutoStatus] = useState<'idle' | 'detecting' | 'capturing' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stableCountRef = useRef(0)
  const autoDoneRef = useRef(false)

  const isVideoReady = (v: HTMLVideoElement) =>
    v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0

  useEffect(() => {
    startCamera()
    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const startCamera = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      setCamActive(true)
      setPhase('camera')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Camera access denied')
      setPhase('error')
    }
  }

  useEffect(() => {
    if (camActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {})
        setTimeout(() => {
          setPhase('liveness')
        }, 500)
      }
    }
  }, [camActive])

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    canvas.width = 320
    canvas.height = 240
    ctx.drawImage(videoRef.current, 0, 0, 320, 240)
    return canvas.toDataURL('image/jpeg', 0.6)
  }

  const startMultiAngleCapture = () => {
    setPhase('capturing')
    setAutoStatus('detecting')
    stableCountRef.current = 0
    autoDoneRef.current = false

    autoIntervalRef.current = setInterval(async () => {
      if (autoDoneRef.current) return
      const v = videoRef.current
      if (!v || !isVideoReady(v)) return

      const result = await detectFace(v)
      if (result?.face_detected) {
        setFaceDetected(true)
        stableCountRef.current++
        if (stableCountRef.current >= STABLE_THRESHOLD) {
          if (autoIntervalRef.current) clearInterval(autoIntervalRef.current)
          autoDoneRef.current = true
          setAutoStatus('capturing')

          try {
            const enrollResult = await enrollFace(v, { multiAngle: true })
            if (enrollResult?.success) {
              const photo = capturePhoto()
              const entry: RegisteredFace = {
                staffId: person.id,
                staffName: isBn ? person.name : person.nameEn,
                photo: photo || '',
                embedding: enrollResult.embedding,
                embeddings: enrollResult.embeddings,
                enrolledAt: new Date().toISOString(),
                qualityScore: enrollResult.quality.score,
              }
              const updated = [...existingFaces.filter((f) => f.staffId !== person.id), entry]
              saveFaces(updated)
              onEnrolled(updated)
              setAutoStatus('done')
              playSuccessSound()
              logAuditEvent({
                type: 'enrolled',
                personId: person.id,
                personName: person.name,
                qualityScore: enrollResult.quality.score,
                livenessPassed: true,
                reason: `${enrollResult.embeddings?.length || 1} angle(s)`,
              })
              setTimeout(() => onClose(), 2000)
            } else {
              throw new Error('Enrollment failed')
            }
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Enrollment failed')
            setAutoStatus('error')
            setTimeout(() => {
              autoDoneRef.current = false
              setAutoStatus('detecting')
              stableCountRef.current = 0
              setPhase('capturing')
              startMultiAngleCapture()
            }, 2000)
          }
        }
      } else {
        setFaceDetected(false)
        stableCountRef.current = 0
      }
    }, REG_DETECT_MS)
  }

  const handleLivenessPassed = () => {
    startMultiAngleCapture()
  }

  const handleClose = () => {
    if (autoIntervalRef.current) clearInterval(autoIntervalRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    onClose()
  }

  const getVideo = useCallback(() => videoRef.current, [])

  return createPortal(
    <div className="fixed inset-0 z-[600] bg-black flex flex-col">
      <div className="relative flex-1 bg-black">
        <video
          ref={(n) => { videoRef.current = n }}
          autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center cursor-pointer text-white hover:bg-black/70 z-20 transition-colors"
        >
          <X size={24} />
        </button>

        {camActive && phase !== 'liveness' && (
          <div className="absolute top-5 left-5 bg-black/60 rounded-lg px-3 py-1.5 text-white text-[0.75rem] font-medium flex items-center gap-2 z-10">
            <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
            LIVE
          </div>
        )}

        {phase === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="absolute inset-[12%] grid grid-cols-3 grid-rows-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={`border ${faceDetected ? 'border-[var(--green)]/60' : 'border-white/15'} transition-colors duration-200`} />
              ))}
            </div>
            <div className={`w-40 h-52 border-[3px] rounded-[50%] transition-all duration-200 ${faceDetected ? 'border-[var(--green)] shadow-[0_0_40px_rgba(34,197,94,0.5)]' : 'border-white/30'}`} />
          </div>
        )}

        {phase === 'camera' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="px-5 py-2.5 rounded-full text-[0.875rem] font-bold bg-black/50 text-white/80 backdrop-blur-sm">
              {isBn ? 'ক্যামেরা সক্রিয় হচ্ছে...' : 'Starting camera...'}
            </div>
          </div>
        )}

        {phase === 'liveness' && (
          <LivenessCheck
            isBn={isBn}
            getVideo={getVideo}
            detectWithExpressions={detectWithExpressions}
            onPassed={handleLivenessPassed}
            onFailed={handleClose}
          />
        )}

        {phase === 'capturing' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="absolute inset-[12%] grid grid-cols-3 grid-rows-3 gap-0.5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`border ${faceDetected ? 'border-[var(--green)]/60' : 'border-white/15'} transition-colors duration-200`} />
                ))}
              </div>
              <div className={`w-40 h-52 border-[3px] rounded-[50%] transition-all duration-200 ${faceDetected ? 'border-[var(--green)] shadow-[0_0_40px_rgba(34,197,94,0.5)]' : 'border-white/30'}`} />
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className={`px-5 py-2.5 rounded-full text-[0.875rem] font-bold transition-colors duration-200 ${
                autoStatus === 'done' ? 'bg-[var(--green)] text-white'
                  : autoStatus === 'capturing' ? 'bg-[var(--amber)] text-white'
                    : autoStatus === 'error' ? 'bg-[var(--red)] text-white'
                      : faceDetected ? 'bg-[var(--green)] text-white' : 'bg-black/50 text-white/80 backdrop-blur-sm'
              }`}>
                {autoStatus === 'done'
                  ? isBn ? 'নিবন্ধন সম্পন্ন!' : 'Registration Complete!'
                  : autoStatus === 'capturing'
                    ? isBn ? 'মুখ ক্যাপচার হচ্ছে...' : 'Capturing face...'
                      : autoStatus === 'error'
                        ? isBn ? 'আবার চেষ্টা করুন...' : 'Retrying...'
                          : faceDetected
                            ? isBn ? 'মুখ সনাক্ত — ধরুন...' : 'Face detected — Hold...'
                            : isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid'}
              </div>
            </div>
          </>
        )}

        {phase === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-[var(--red-light)] border border-[var(--red)] rounded-2xl p-6 max-w-sm text-center">
              <AlertTriangle size={32} className="text-[var(--red)] mx-auto mb-3" />
              <div className="text-[var(--text-primary)] font-semibold mb-2">{errorMsg}</div>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-[var(--red)] text-white text-[0.75rem] font-semibold cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3" style={{ background: 'linear-gradient(to top, #000, #111827)' }}>
        <div className="max-w-xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-4 border border-white/15">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
              {person.photo ? (
                <img src={person.photo} alt="" className="w-full h-full object-cover" />
              ) : person.type === 'staff' ? (
                <User size={18} className="text-white/50" />
              ) : (
                <GraduationCap size={18} className="text-white/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.875rem] font-bold text-white truncate">{person.name}</div>
              <div className="text-[0.625rem] text-white/50 font-mono">{person.id}</div>
            </div>
            <span className={`text-[0.5rem] px-2 py-0.5 rounded font-bold ${person.type === 'student' ? 'bg-[var(--green)] text-white' : 'bg-[var(--brand)] text-white'}`}>
              {person.type === 'student' ? 'STU' : 'STAFF'}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
