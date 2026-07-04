import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle } from 'lucide-react'
import { useFaceApi, type RegisteredFace } from '@/hooks/useFaceApi'
import { logAuditEvent } from '@/lib/faceAudit'

interface AttendancePopupProps {
  isBn: boolean
  date: string
  registeredFaces: RegisteredFace[]
  institution?: { startTime: string; endTime: string }
  onPunch: (staffId: string, staffName: string, photo: string, punchType: 'in' | 'out', time: string) => void
  onClose: () => void
}

const COOLDOWN_MS = 8000
const DETECT_INTERVAL_MS = 350
const STABLE_FRAMES = 3

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

export default function AttendancePopup({ isBn, date: _date, registeredFaces, institution, onPunch, onClose }: AttendancePopupProps) {
  const { detectFace, recognizeFace } = useFaceApi()
  const [camActive, setCamActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const [identified, setIdentified] = useState<{
    staffId: string; staffName: string; photo: string; punchType: 'in' | 'out'; time: string
  } | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stableCountRef = useRef(0)
  const identifiedRef = useRef(false)
  const cooldownRef = useRef<Record<string, number>>({})
  const recognizingRef = useRef(false)

  const isVideoReady = (v: HTMLVideoElement) =>
    v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0

  useEffect(() => {
    startCamera()
    return () => {
      stopDetectLoop()
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
    } catch {
      onClose()
    }
  }

  useEffect(() => {
    if (camActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {})
        setTimeout(() => startDetectLoop(), 300)
      }
    }
  }, [camActive])

  const handlePunch = (staffId: string, staffName: string, photo: string) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
    const startTime = institution?.startTime || '07:30'
    const endTime = institution?.endTime || '14:30'
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const distToStart = Math.abs(currentTimeMinutes - startMinutes)
    const distToEnd = Math.abs(currentTimeMinutes - endMinutes)

    let punchType: 'in' | 'out'
    if (distToStart < distToEnd) punchType = 'in'
    else if (distToEnd < distToStart) punchType = 'out'
    else punchType = 'in'

    onPunch(staffId, staffName, photo, punchType, timeStr)
    setIdentified({ staffId, staffName, photo, punchType, time: timeStr })
    identifiedRef.current = true
    playSuccessSound()
    cooldownRef.current[staffId] = Date.now()

    logAuditEvent({
      type: 'recognized',
      personId: staffId,
      personName: staffName,
      confidence: 1,
    })

    setTimeout(() => {
      setIdentified(null)
      identifiedRef.current = false
    }, 4000)
  }

  const startDetectLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    stableCountRef.current = 0
    recognizingRef.current = false
    setFaceDetected(false)

    detectIntervalRef.current = setInterval(async () => {
      if (identifiedRef.current) return
      if (recognizingRef.current) return
      const v = videoRef.current
      if (!v || !isVideoReady(v)) return

      try {
        const result = await detectFace(v)
        if (result?.face_detected) {
          setFaceDetected(true)
          stableCountRef.current++
          if (stableCountRef.current >= STABLE_FRAMES) {
            if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
            stableCountRef.current = 0
            recognizingRef.current = true
            setRecognizing(true)

            try {
              const matchResult = await recognizeFace(v, registeredFaces)
              if (matchResult?.personId) {
                const match = registeredFaces.find((f) => f.staffId === matchResult.personId)
                if (match) {
                  const lastPunch = cooldownRef.current[match.staffId] || 0
                  if (Date.now() - lastPunch >= COOLDOWN_MS) {
                    handlePunch(match.staffId, match.staffName, match.photo)
                  }
                }
              }
            } catch {} finally {
              setRecognizing(false)
              recognizingRef.current = false
              setFaceDetected(false)
              setTimeout(() => startDetectLoop(), 500)
            }
          }
        } else {
          setFaceDetected(false)
          stableCountRef.current = 0
        }
      } catch {
        setFaceDetected(false)
        stableCountRef.current = 0
      }
    }, DETECT_INTERVAL_MS)
  }

  const stopDetectLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    detectIntervalRef.current = null
    stableCountRef.current = 0
    identifiedRef.current = false
    recognizingRef.current = false
    setFaceDetected(false)
    setRecognizing(false)
  }

  const handleClose = () => {
    stopDetectLoop()
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    onClose()
  }

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

        {camActive && !identified && (
          <div className="absolute top-5 left-5 bg-black/60 rounded-lg px-3 py-1.5 text-white text-[0.75rem] font-medium flex items-center gap-2 z-10">
            <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
            {isBn ? 'লাইভ' : 'LIVE'}
          </div>
        )}

        {camActive && !identified && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="absolute inset-[12%] grid grid-cols-3 grid-rows-3 gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={`border ${faceDetected ? 'border-[var(--green)]/60' : 'border-white/15'} transition-colors duration-200`} />
              ))}
            </div>
            <div className={`w-40 h-52 border-[3px] rounded-[50%] transition-all duration-200 ${faceDetected ? 'border-[var(--green)] shadow-[0_0_40px_rgba(34,197,94,0.5)]' : 'border-white/30'}`} />
          </div>
        )}

        {camActive && !identified && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className={`px-5 py-2.5 rounded-full text-[0.875rem] font-bold transition-colors duration-200 ${faceDetected ? 'bg-[var(--green)] text-white' : 'bg-black/50 text-white/80 backdrop-blur-sm'}`}>
              {recognizing
                ? isBn ? 'শনাক্তকরণ হচ্ছে...' : 'Recognizing...'
                : faceDetected
                  ? isBn ? 'মুখ সনাক্ত হয়েছে — ধরুন...' : 'Face detected — Hold...'
                  : isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid'}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3" style={{ background: 'linear-gradient(to top, #000, #111827)' }}>
        {identified && (
          <div className="max-w-xl mx-auto animate-[slideUp_0.3s_ease-out]">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-4 border border-white/15">
              <div className="relative shrink-0">
                <img src={identified.photo} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-[var(--green)]/60" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--green)] flex items-center justify-center border-2 border-gray-900">
                  <CheckCircle size={11} className="text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.9375rem] font-bold text-white truncate">{identified.staffName}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-md text-[0.625rem] font-bold ${identified.punchType === 'in' ? 'bg-[var(--green)] text-white' : 'bg-[var(--amber)] text-white'}`}>
                    {identified.punchType === 'in' ? 'CHECKED IN' : 'CHECKED OUT'}
                  </span>
                  <span className="text-[0.625rem] text-white/50 font-mono">{identified.staffId}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[1.375rem] font-bold text-white font-mono leading-none">{identified.time}</div>
                <div className="text-[0.5625rem] text-white/40 mt-1">{isBn ? 'পাঞ্চ সময়' : 'Punch Time'}</div>
              </div>
            </div>
          </div>
        )}
        {!identified && (
          <div className="text-center py-1.5">
            <div className="text-white/30 text-[0.75rem] font-medium">
              {isBn ? 'অপেক্ষা করুন...' : 'Waiting for face...'}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
