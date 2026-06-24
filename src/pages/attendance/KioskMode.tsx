import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
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
import { logger } from '@/lib/logger'

const STORAGE_KEY = 'kioskFaces'
const COOLDOWN_MS = 10000
const DETECT_INTERVAL_MS = 500

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
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
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
    } catch {
      setStatusMsg({
        type: 'error',
        text: isBn ? 'ক্যামেরা খুলতে ব্যর্থ। অনুমতি দিন।' : 'Failed to open camera. Allow permission.',
      })
      setTimeout(() => setStatusMsg(null), 3000)
    }
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
    logger.kiosk('Starting reg detect loop', { faceApiLoaded, selectedStaff })
    regDetectIntervalRef.current = setInterval(async () => {
      const v = videoRef.current
      if (!v || !faceApiLoaded || !selectedStaff || !isVideoReady(v)) {
        if (v) logger.kiosk('Skipping detect', { ready: v.readyState, w: v.videoWidth, loaded: faceApiLoaded, staff: selectedStaff })
        return
      }
      const result = await detectFace(v)
      if (result) {
        logger.kiosk('Face detected! Stable count', { count: regStableCountRef.current + 1 })
        setFaceDetected(true)
        regStableCountRef.current++
        if (regStableCountRef.current >= 3) {
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
    setStatusMsg({
      type: 'success',
      text: isBn ? `${entry.staffName} নিবন্ধন সম্পন্ন!` : `${entry.staffName} registered!`,
    })
    setSelectedStaff('')
    setCapturedPhoto(null)
    stopCamera()
    setTimeout(() => setStatusMsg(null), 3000)
  }

  const handleRegister = async () => {
    if (!selectedStaff || !videoRef.current) return
    if (!faceApiLoaded) {
      setStatusMsg({ type: 'error', text: isBn ? 'ML মডেল লোড হচ্ছে...' : 'ML models loading...' })
      setTimeout(() => setStatusMsg(null), 3000)
      return
    }
    if (!isVideoReady(videoRef.current)) {
      setStatusMsg({ type: 'error', text: isBn ? 'ক্যামেরা প্রস্তুত হয়নি। অপেক্ষা করুন...' : 'Camera not ready. Wait...' })
      setTimeout(() => setStatusMsg(null), 3000)
      return
    }
    const result = await detectFace(videoRef.current)
    if (!result) {
      setStatusMsg({ type: 'error', text: isBn ? 'মুখ সনাক্ত হয়নি। আবার চেষ্টা করুন।' : 'No face detected. Try again.' })
      setTimeout(() => setStatusMsg(null), 3000)
      return
    }
    saveRegistration(result.descriptor)
  }

  const handleDeleteFace = (staffId: string) => {
    const updated = registeredFaces.filter((f) => f.staffId !== staffId)
    setRegisteredFaces(updated)
    saveFaces(updated)
    setStatusMsg({ type: 'success', text: isBn ? 'নিবন্ধন মুছে ফেলা হয়েছে' : 'Registration deleted' })
    setTimeout(() => setStatusMsg(null), 2000)
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
    setStatusMsg({
      type: 'success',
      text: `${staffName} ${punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'} ${timeStr}`,
    })
    playSuccessSound()
    cooldownRef.current[staffId] = Date.now()
    setTimeout(() => {
      setStatusMsg(null)
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
      const result = await detectFace(v)
      if (result) {
        setFaceDetected(true)
        stableCountRef.current++
        if (stableCountRef.current >= 3) {
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
            setStatusMsg({
              type: 'error',
              text: isBn ? 'অপরিচিত মুখ' : 'Unrecognized face',
            })
            setTimeout(() => {
              setStatusMsg(null)
              startDetectLoop()
            }, 2000)
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
    setStatusMsg(null)
    setCapturedPhoto(null)
    await startCamera()
  }

  const closeAttendance = () => {
    stopDetectLoop()
    stopCamera()
    setKioskMode('register')
    setIdentified(null)
    setStatusMsg(null)
  }

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    if (camActive && kioskMode === 'attendance' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(() => {})
        t = setTimeout(() => startDetectLoop(), 500)
      }
    }
    return () => {
      if (t) clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camActive, kioskMode])

  useEffect(() => {
    if (camActive && kioskMode === 'register' && selectedStaff && faceApiLoaded) {
      const t = setTimeout(() => startRegDetectLoop(), 800)
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

  return (
    <>
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

      {/* Status message */}
      {statusMsg && (
        <div className={`mb-3 py-2 px-3 rounded-lg text-[0.75rem] font-medium flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}>
          {statusMsg.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {statusMsg.text}
          <button onClick={() => setStatusMsg(null)} className="ml-auto bg-transparent border-none cursor-pointer text-[inherit]">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Identified person display (register mode) */}
      {identified && kioskMode === 'register' && (
        <div className="mb-4 p-5 rounded-2xl bg-[var(--green-light)] border-2 border-[var(--green)] text-center">
          <div className="relative w-20 h-20 mx-auto mb-3">
            <img src={identified.photo} alt="" className="w-full h-full rounded-2xl object-cover border-2 border-[var(--green)]" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--green)] flex items-center justify-center">
              <CheckCircle size={14} className="text-white" />
            </div>
          </div>
          <div className="text-[1.25rem] font-bold text-[var(--green)]">{identified.staffName}</div>
          <div className="text-[0.75rem] text-[var(--text-secondary)] font-mono mt-1">{identified.staffId}</div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-bold ${identified.punchType === 'in' ? 'bg-[var(--green)] text-white' : 'bg-[var(--amber)] text-white'}`}>
              {identified.punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'}
            </span>
            <span className="text-[1.375rem] font-bold text-[var(--text-primary)] font-mono">{identified.time}</span>
          </div>
        </div>
      )}

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
                      <div className={`w-24 h-32 border-2 rounded-[50%] transition-all duration-300 ${faceDetected ? 'border-[var(--green)] shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-white/50'}`} />
                    </div>
                  )}
                </div>
                <div className="w-full py-2 rounded-lg text-[0.75rem] font-bold bg-[var(--green-light)] text-[var(--green)] text-center">
                  {faceDetected ? (isBn ? 'মুখ সনাক্ত হয়েছে — ধরুন...' : 'Face detected — Hold...') : (isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid')}
                </div>
                <button
                  onClick={handleRegister}
                  className="w-full py-2 rounded-lg text-[0.75rem] bg-[var(--green)] text-white border-none font-semibold cursor-pointer"
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

      {/* Attendance Mode - Camera 2/3 + Details 1/3 */}
      {kioskMode === 'attendance' && (
        <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-black mb-4" style={{ height: '60vh', minHeight: '24rem' }}>
          {/* Camera feed - 2/3 */}
          <div className="relative" style={{ height: '66.67%' }}>
            <video ref={videoCallbackRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Close button */}
            <button
              onClick={closeAttendance}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center cursor-pointer text-white hover:bg-black/70 z-20"
            >
              <X size={20} />
            </button>

            {/* LIVE indicator */}
            {camActive && !identified && (
              <div className="absolute top-4 left-4 bg-black/60 rounded-lg px-3 py-1.5 text-white text-[0.6875rem] font-medium flex items-center gap-2 z-10">
                <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                {isBn ? 'লাইভ' : 'LIVE'}
              </div>
            )}

            {/* Face guide overlay */}
            {camActive && !identified && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="absolute inset-[10%] grid grid-cols-3 grid-rows-3 gap-0.5">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className={`border ${faceDetected ? 'border-[var(--green)]/60' : 'border-white/15'} transition-colors duration-300`} />
                  ))}
                </div>
                <div className={`w-36 h-44 border-[3px] rounded-[50%] transition-all duration-300 ${faceDetected ? 'border-[var(--green)] shadow-[0_0_40px_rgba(34,197,94,0.4)]' : 'border-white/30'}`} />
              </div>
            )}

            {/* Status text */}
            {camActive && !identified && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <div className={`px-4 py-2 rounded-full text-[0.8125rem] font-bold transition-colors duration-200 ${faceDetected ? 'bg-[var(--green)] text-white' : 'bg-black/50 text-white/80'}`}>
                  {faceDetected
                    ? isBn ? 'মুখ সনাক্ত হয়েছে — ধরুন...' : 'Face detected — Hold...'
                    : isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid'}
                </div>
              </div>
            )}
          </div>

          {/* Details - 1/3 */}
          <div className="flex flex-col items-center justify-center px-6 relative" style={{ height: '33.33%', background: 'linear-gradient(to top, black, #111827, #1f2937)' }}>
            {/* Identified person card */}
            {identified && (
              <div className="w-full max-w-lg animate-[slideUp_0.3s_ease-out]">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center gap-5 border border-white/10">
                  <div className="relative shrink-0">
                    <img src={identified.photo} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--green)]" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[var(--green)] flex items-center justify-center border-2 border-gray-900">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[1.25rem] font-bold text-white truncate">{identified.staffName}</div>
                    <div className="text-[0.875rem] text-white/50 font-mono mt-1">{identified.staffId}</div>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-lg text-[0.75rem] font-bold ${identified.punchType === 'in' ? 'bg-[var(--green)] text-white' : 'bg-[var(--amber)] text-white'}`}>
                        {identified.punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[2rem] font-bold text-white font-mono leading-none">{identified.time}</div>
                    <div className="text-[0.6875rem] text-white/40 mt-1">{isBn ? 'পাঞ্চ সময়' : 'Punch Time'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Success/Error message */}
            {statusMsg && !identified && (
              <div className={`px-4 py-2 rounded-lg text-[0.8125rem] font-bold ${statusMsg.type === 'success' ? 'bg-[var(--green)] text-white' : 'bg-[var(--red)] text-white'}`}>
                {statusMsg.text}
              </div>
            )}

            {/* Waiting text */}
            {!identified && !statusMsg && (
              <div className="text-center">
                <div className="text-white/30 text-[0.875rem] font-medium">
                  {isBn ? 'অপেক্ষা করুন...' : 'Waiting for face...'}
                </div>
                <div className="text-white/15 text-[0.6875rem] mt-1">
                  {isBn ? 'বন্ধ করতে X চাপুন' : 'Press X to close'}
                </div>
              </div>
            )}
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
