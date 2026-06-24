import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle,
  Clock,
  Layers,
  ScanFace,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import { useTeacherStore } from '@/store/teacherStore'
import type { AttendanceStatus } from '@/store/teacherStore'
import { useFaceApi, type RegisteredFace } from '@/hooks/useFaceApi'


const STORAGE_KEY = 'kioskFaces'
const COOLDOWN_MS = 8000
const DETECT_INTERVAL_MS = 200
const STABLE_FRAMES = 2

function loadFaces(): RegisteredFace[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

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

export default function KioskMode({ isBn, date }: { isBn: boolean; date: string }) {
  const { teachers, attendance } = useTeacherStore()
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])
  const { loaded: faceApiLoaded, loading: faceApiLoading, error: faceApiError, detectFace, matchFace } = useFaceApi()

  const [kioskMode, setKioskMode] = useState<'register' | 'attendance'>('register')
  const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>(loadFaces)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [camActive, setCamActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [, setDetecting] = useState(false)
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
  const regDetectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const regStableCountRef = useRef(0)

  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
    if (node && streamRef.current) {
      node.srcObject = streamRef.current
      node.onloadedmetadata = () => {
        node.play().catch(() => {})
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      setCapturedPhoto(null)
      setCamActive(true)
    } catch {}

  }

  const stopCamera = () => {
    stopRegDetectLoop()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCamActive(false)
    setFaceDetected(false)
  }

  const stopRegDetectLoop = () => {
    if (regDetectIntervalRef.current) clearInterval(regDetectIntervalRef.current)
    regDetectIntervalRef.current = null
    regStableCountRef.current = 0
  }

  const isVideoReady = (v: HTMLVideoElement) =>
    v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0

  const startRegDetectLoop = () => {
    if (regDetectIntervalRef.current) clearInterval(regDetectIntervalRef.current)
    regStableCountRef.current = 0
    regDetectIntervalRef.current = setInterval(async () => {
      const v = videoRef.current
      if (!v || !faceApiLoaded || !selectedStaff || !isVideoReady(v)) return
      const result = await detectFace(v, true)
      if (result) {
        setFaceDetected(true)
        regStableCountRef.current++
        if (regStableCountRef.current >= STABLE_FRAMES) {
          if (regDetectIntervalRef.current) clearInterval(regDetectIntervalRef.current)
          regDetectIntervalRef.current = null
          regStableCountRef.current = 0
          setFaceDetected(false)
          saveRegistration(result.descriptor)
        }
      } else {
        setFaceDetected(false)
        regStableCountRef.current = 0
      }
    }, DETECT_INTERVAL_MS)
  }

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

  const saveRegistration = (descriptor: Float32Array) => {
    if (!selectedStaff) return
    const teacher = activeTeachers.find((t) => t.id === selectedStaff)
    if (!teacher) return
    const photo = capturePhoto()
    if (!photo) return
    const entry: RegisteredFace = {
      staffId: teacher.id,
      staffName: isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn,
      photo,
      descriptor: Array.from(descriptor),
    }
    const updated = [...registeredFaces.filter((f) => f.staffId !== teacher.id), entry]
    setRegisteredFaces(updated)
    saveFaces(updated)
    setSelectedStaff('')
    setCapturedPhoto(null)
    stopCamera()
  }

  const handleRegister = async () => {
    if (!selectedStaff || !videoRef.current) return
    if (!faceApiLoaded || !isVideoReady(videoRef.current)) return
    const result = await detectFace(videoRef.current, true)
    if (!result) return
    saveRegistration(result.descriptor)
  }

  const handleDeleteFace = (staffId: string) => {
    const updated = registeredFaces.filter((f) => f.staffId !== staffId)
    setRegisteredFaces(updated)
    saveFaces(updated)
  }

  const handlePunch = (staffId: string, staffName: string, photo: string) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const existing = attendance[date]?.[staffId]
    const punches = existing?.punches || []
    const lastPunch = punches[punches.length - 1]
    const punchType: 'in' | 'out' = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
    const punchesNew = [...punches, { time: timeStr, type: punchType }]
    const status = punchType === 'in' ? 'present' : existing?.status || 'present'
    const updatedAttendance = {
      ...attendance,
      [date]: {
        ...attendance[date],
        [staffId]: { status: status as AttendanceStatus, punches: punchesNew },
      },
    }
    useTeacherStore.setState({ attendance: updatedAttendance })
    setIdentified({ staffId, staffName, photo, punchType, time: timeStr })
    identifiedRef.current = true
    playSuccessSound()
    cooldownRef.current[staffId] = Date.now()
    setTimeout(() => {
      setIdentified(null)
      identifiedRef.current = false
    }, 4000)
  }

  const startDetectLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    stableCountRef.current = 0
    setDetecting(true)
    setFaceDetected(false)
    detectIntervalRef.current = setInterval(async () => {
      if (identifiedRef.current) return
      const v = videoRef.current
      if (!v || !faceApiLoaded || !isVideoReady(v)) return
      const result = await detectFace(v, true)
      if (result) {
        setFaceDetected(true)
        stableCountRef.current++
        if (stableCountRef.current >= STABLE_FRAMES) {
          if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
          setDetecting(false)
          setFaceDetected(false)
          stableCountRef.current = 0
          const match = matchFace(result.descriptor, registeredFaces)
          if (match) {
            const lastPunch = cooldownRef.current[match.staffId] || 0
            if (Date.now() - lastPunch < COOLDOWN_MS) {
              startDetectLoop()
              return
            }
            handlePunch(match.staffId, match.staffName, match.photo)
            setTimeout(() => startDetectLoop(), 500)
          } else {
            setTimeout(() => startDetectLoop(), 1500)
          }
        }
      } else {
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
    setDetecting(false)
    setFaceDetected(false)
  }

  const openAttendance = async () => {
    setKioskMode('attendance')
    setIdentified(null)
    setCapturedPhoto(null)
    await startCamera()
  }

  const closeAttendance = () => {
    stopDetectLoop()
    stopCamera()
    setKioskMode('register')
    setIdentified(null)
  }

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    if (camActive && kioskMode === 'attendance' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {})
        t = setTimeout(() => startDetectLoop(), 300)
      }
    }
    return () => {
      if (t) clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camActive, kioskMode])

  useEffect(() => {
    if (camActive && kioskMode === 'register' && selectedStaff && faceApiLoaded) {
      const t = setTimeout(() => startRegDetectLoop(), 500)
      return () => {
        clearTimeout(t)
        stopRegDetectLoop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camActive, kioskMode, selectedStaff, faceApiLoaded])

  useEffect(() => {
    return () => {
      stopDetectLoop()
      stopRegDetectLoop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const stats = useMemo(() => {
    const registered = registeredFaces.length
    const todayCheckin = registeredFaces.filter((f) => attendance[date]?.[f.staffId]?.punches?.length).length
    const active = registeredFaces.filter((f) => attendance[date]?.[f.staffId]?.status === 'present').length
    return { registered, todayCheckin, active }
  }, [registeredFaces, attendance, date])

  const filteredFaces = useMemo(() => {
    if (!search) return registeredFaces
    const q = search.toLowerCase()
    return registeredFaces.filter(
      (f) => f.staffName.toLowerCase().includes(q) || f.staffId.toLowerCase().includes(q)
    )
  }, [registeredFaces, search])

  const renderAttendancePopup = () => {
    if (kioskMode !== 'attendance') return null
    return createPortal(
      <div className="fixed inset-0 z-[600] bg-black flex flex-col">
        {/* Camera feed - takes most of screen */}
        <div className="relative flex-1 bg-black">
          <video ref={videoCallbackRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Close button */}
          <button
            onClick={closeAttendance}
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center cursor-pointer text-white hover:bg-black/70 z-20 transition-colors"
          >
            <X size={24} />
          </button>

          {/* LIVE indicator */}
          {camActive && !identified && (
            <div className="absolute top-5 left-5 bg-black/60 rounded-lg px-3 py-1.5 text-white text-[0.75rem] font-medium flex items-center gap-2 z-10">
              <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
              {isBn ? 'লাইভ' : 'LIVE'}
            </div>
          )}

          {/* Face guide overlay */}
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

          {/* Status text */}
          {camActive && !identified && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className={`px-5 py-2.5 rounded-full text-[0.875rem] font-bold transition-colors duration-200 ${faceDetected ? 'bg-[var(--green)] text-white' : 'bg-black/50 text-white/80 backdrop-blur-sm'}`}>
                {faceDetected
                  ? isBn ? 'মুখ সনাক্ত হয়েছে — ধরুন...' : 'Face detected — Hold...'
                  : isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid'}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar - identified person */}
        <div className="px-3 py-2" style={{ background: 'linear-gradient(to top, #000, #111827)' }}>
          {identified && (
            <div className="max-w-md mx-auto animate-[slideUp_0.3s_ease-out]">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl px-3 py-2 flex items-center gap-2.5 border border-white/15">
                <div className="relative shrink-0">
                  <img src={identified.photo} alt="" className="w-9 h-9 rounded-lg object-cover border border-[var(--green)]/60" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--green)] flex items-center justify-center border-1.5 border-gray-900">
                    <CheckCircle size={9} className="text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.75rem] font-semibold text-white truncate">{identified.staffName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-1.5 py-px rounded text-[0.5rem] font-bold ${identified.punchType === 'in' ? 'bg-[var(--green)] text-white' : 'bg-[var(--amber)] text-white'}`}>
                      {identified.punchType === 'in' ? (isBn ? 'IN' : 'IN') : isBn ? 'OUT' : 'OUT'}
                    </span>
                    <span className="text-[0.5625rem] text-white/40 font-mono">{identified.staffId}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[1rem] font-bold text-white font-mono leading-none">{identified.time}</div>
                </div>
              </div>
            </div>
          )}
          {!identified && (
            <div className="text-center py-1">
              <div className="text-white/20 text-[0.6875rem] font-medium">
                {isBn ? 'অপেক্ষা করুন...' : 'Waiting...'}
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  }

  return (
    <>

      {/* Attendance popup */}
      {renderAttendancePopup()}

      {/* Info Banner */}
      <div className="bg-[var(--green-light)] border border-[var(--green)] rounded-xl p-3 mb-4">
        <div className="flex items-start gap-2">
          <Layers size={16} className="text-[var(--green)] mt-0.5 shrink-0" />
          <div>
            <div className="text-[0.75rem] font-semibold text-[var(--green)]">
              {isBn ? 'কিওস্ক মোড' : 'Kiosk Mode'}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
              {isBn
                ? 'শেয়ার্ড ডিভাইস হিসেবে ব্যবহার করুন। সবাই একটি ফোনে মুখ দেখিয়ে চেক ইন করবে।'
                : 'Use as shared device. All staff check in by showing face on one phone.'}
            </div>
          </div>
        </div>
      </div>

      {/* HTTPS warning */}
      {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
        <div className="mb-4 py-3 px-4 rounded-xl bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] font-medium text-center">
          <span className="font-bold">🔒 {isBn ? 'HTTPS প্রয়োজন!' : 'HTTPS Required!'}</span>
          <br />
          {isBn ? 'বায়োমেট্রিক কাজ করতে https:// দিয়ে খুলুন।' : 'Open with https:// for camera to work.'}
        </div>
      )}

      {/* ML loading indicator */}
      {!faceApiLoaded && (
        <div className="mb-4 py-3 px-4 rounded-xl bg-[var(--amber-light)] border border-[var(--amber)] text-[var(--amber)] text-[0.75rem] font-medium text-center">
          {faceApiLoading
            ? (isBn ? '🧠 ML মডেল লোড হচ্ছে...' : '🧠 Loading face recognition models...')
            : faceApiError
              ? `❌ ${faceApiError}`
              : (isBn ? '🧠 ML মডেল লোড হয়েছে' : '🧠 ML models loaded')}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: isBn ? 'নিবন্ধিত' : 'Registered', value: stats.registered, icon: <Layers size={15} />, color: 'var(--green)' },
          { label: isBn ? 'আজ চেক-ইন' : 'Today', value: stats.todayCheckin, icon: <CheckCircle size={15} />, color: 'var(--teal)' },
          { label: isBn ? 'সক্রিয়' : 'Active', value: stats.active, icon: <Clock size={15} />, color: 'var(--brand)' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="text-[1rem] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { if (kioskMode === 'attendance') closeAttendance(); setKioskMode('register') }}
          className={`flex-1 py-2.5 rounded-lg text-[0.8125rem] font-semibold border transition-all ${kioskMode === 'register' ? 'bg-[var(--green)] text-white border-[var(--green)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--green)]'}`}
        >
          <span className="flex items-center justify-center gap-2">
            <ScanFace size={16} />
            {isBn ? 'মুখ নিবন্ধন' : 'Register Face'}
          </span>
        </button>
        <button
          onClick={openAttendance}
          className={`flex-1 py-2.5 rounded-lg text-[0.8125rem] font-semibold border transition-all ${kioskMode === 'attendance' ? 'bg-[var(--teal)] text-white border-[var(--teal)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--teal)]'}`}
        >
          <span className="flex items-center justify-center gap-2">
            <ScanFace size={16} />
            {isBn ? 'উপস্থিতি নিন' : 'Take Attendance'}
          </span>
        </button>
      </div>

      {/* Register Mode */}
      {kioskMode === 'register' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Register Face */}
          <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] flex items-center justify-center">
                <ScanFace size={15} className="text-[var(--green)]" />
              </div>
              <div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'মুখ নিবন্ধন' : 'Register Face'}
                </div>
                <div className="text-[0.625rem] text-[var(--text-muted)]">
                  {isBn ? 'ক্যামেরায় মুখ তুলুন' : 'Capture face with camera'}
                </div>
              </div>
            </div>
            <select
              value={selectedStaff}
              onChange={(e) => { setSelectedStaff(e.target.value); setCapturedPhoto(null) }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none mb-2"
            >
              <option value="">{isBn ? 'স্টাফ নির্বাচন করুন...' : 'Select staff...'}</option>
              {activeTeachers.map((t) => {
                const registered = registeredFaces.find((f) => f.staffId === t.id)
                return (
                  <option key={t.id} value={t.id}>
                    {isBn ? t.nameBn || t.nameEn : t.nameEn} ({t.id}){registered ? ' ✓' : ''}
                  </option>
                )
              })}
            </select>
            {selectedStaff && !camActive && (
              <button
                onClick={startCamera}
                className="w-full py-2 rounded-lg text-[0.75rem] font-semibold bg-[var(--green)] text-white border-none cursor-pointer flex items-center justify-center gap-2"
              >
                <ScanFace size={14} />
                {isBn ? 'ক্যামেরা খুলুন' : 'Open Camera'}
              </button>
            )}
            {selectedStaff && camActive && (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-black w-full" style={{ aspectRatio: '4/3', maxHeight: '30vh' }}>
                  <video ref={videoCallbackRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute top-2 left-2 bg-black/60 rounded-lg px-2 py-1 text-white text-[0.5625rem] flex items-center gap-1 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                    LIVE
                  </div>
                  {!capturedPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="absolute inset-[15%] grid grid-cols-3 grid-rows-3">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className={`border ${faceDetected ? 'border-[var(--green)]/70' : 'border-white/30'} transition-colors duration-200`} />
                        ))}
                      </div>
                      <div className={`w-24 h-32 border-2 rounded-[50%] transition-all duration-200 ${faceDetected ? 'border-[var(--green)] shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-white/50'}`} />
                    </div>
                  )}
                </div>
                <div className="w-full py-2 rounded-lg text-[0.75rem] font-bold bg-[var(--green-light)] text-[var(--green)] text-center">
                  {faceDetected ? (isBn ? 'মুখ সনাক্ত হয়েছে — ধরুন...' : 'Face detected — Hold...') : (isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid')}
                </div>
                <button
                  onClick={handleRegister}
                  disabled={!faceApiLoaded}
                  className="w-full py-2 rounded-lg text-[0.75rem] bg-[var(--green)] text-white border-none font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isBn ? 'নিবন্ধন করুন' : 'Register'}
                </button>
                <button
                  onClick={() => { stopCamera(); setCapturedPhoto(null) }}
                  className="w-full py-2 text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none underline"
                >
                  {isBn ? 'বন্ধ করুন' : 'Cancel'}
                </button>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)] flex flex-col justify-center items-center text-center min-h-[12rem]">
            <ScanFace size={48} className="text-[var(--text-muted)] mb-3 opacity-30" />
            <div className="text-[0.875rem] font-semibold text-[var(--text-secondary)] mb-1">
              {isBn ? 'নিবন্ধন করতে স্টাফ নির্বাচন করুন' : 'Select staff to register'}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] max-w-[16rem]">
              {isBn
                ? 'নিবন্ধিত স্টাফরা কিওস্ক মোডে মুখ দেখিয়ে চেক ইন করতে পারবেন'
                : 'Registered staff can check in by showing face in kiosk mode'}
            </div>
          </div>
        </div>
      )}

      {/* Registered Staff Table */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {isBn ? `নিবন্ধিত স্টাফ (${registeredFaces.length})` : `Registered Staff (${registeredFaces.length})`}
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-[0.3125rem]">
            <Search size={12} className="text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
              className="flex-1 border-none bg-transparent outline-none text-[0.6875rem] text-[var(--text-primary)] w-[6.25rem]"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-[35vh]">
          <table className="w-full border-collapse text-[0.6875rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.75rem]"></th>
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'আইডি' : 'ID'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaces.map((f, i) => (
                <tr key={f.staffId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                  <td className="p-2.5 text-center">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[var(--border)] mx-auto bg-[var(--bg-secondary)]">
                      <img src={f.photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-2.5 text-left font-medium text-[var(--text-primary)]">{f.staffName}</td>
                  <td className="p-2.5 text-left font-mono text-[var(--text-secondary)]">{f.staffId}</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeleteFace(f.staffId)}
                      className="p-1.5 rounded-lg text-[var(--red)] hover:bg-[var(--red-light)] transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <XCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFaces.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[var(--text-muted)]">
                    {isBn ? 'কোনো নিবন্ধিত স্টাফ নেই' : 'No registered staff'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
