import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle,
  Clock,
  GraduationCap,
  ScanFace,
  Search,
  User,
  X,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import type { AttendanceStatus } from '@/store/teacherStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useFaceApi, type RegisteredFace } from '@/hooks/useFaceApi'


const STORAGE_KEY = 'kioskFaces'
const COOLDOWN_MS = 8000
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
  const { teachers, attendance } = useTeacherStore(
    useShallow((s) => ({
      teachers: s.teachers,
      attendance: s.attendance,
    }))
  )
  const students = useSessionStudents()
  const { institution } = useClassStore()
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])
  const { loading: faceApiLoading, error: faceApiError, enrollFace, recognizeFace } = useFaceApi()

  const [kioskMode, setKioskMode] = useState<'register' | 'attendance'>('register')
  const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>(loadFaces)
  const [selectedStaff, setSelectedStaff] = useState('')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [regSearch, setRegSearch] = useState('')
  const [camActive, setCamActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [, setDetecting] = useState(false)
  const [identified, setIdentified] = useState<{
    staffId: string; staffName: string; photo: string; punchType: 'in' | 'out'; time: string
  } | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [recognizing, setRecognizing] = useState(false)

  const allPeople = useMemo(() => {
    const staff = activeTeachers.map((t) => ({
      id: t.id,
      name: t.nameBn || t.nameEn,
      nameEn: t.nameEn,
      photo: t.photo || '',
      type: 'staff' as const,
      dept: '',
      section: '',
    }))
    const stu = activeStudents.map((s) => ({
      id: s.id,
      name: s.nameBn || s.nameEn,
      nameEn: s.nameEn,
      photo: s.photo || '',
      type: 'student' as const,
      dept: s.class,
      section: s.section,
    }))
    return [...staff, ...stu]
  }, [activeTeachers, activeStudents])

  const filteredPeople = useMemo(() => {
    let list = allPeople
    if (regSearch) {
      const q = regSearch.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.section?.toLowerCase().includes(q))
    }
    return list
  }, [allPeople, regSearch])

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stableCountRef = useRef(0)
  const identifiedRef = useRef(false)
  const cooldownRef = useRef<Record<string, number>>({})
  const regDetectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
  }

  const isVideoReady = (v: HTMLVideoElement) =>
    v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0

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

  const handleRegister = async () => {
    if (!selectedStaff || !videoRef.current) return
    if (!isVideoReady(videoRef.current)) return

    const person = allPeople.find((p) => p.id === selectedStaff)
    if (!person) return

    setEnrolling(true)
    try {
      const result = await enrollFace(
        videoRef.current,
        person.id,
        person.type === 'staff' ? 'teacher' : 'student'
      )

      if (result?.success) {
        const photo = capturePhoto()
        const entry: RegisteredFace = {
          staffId: person.id,
          staffName: isBn ? person.name : person.nameEn,
          photo: photo || '',
        }
        const updated = [...registeredFaces.filter((f) => f.staffId !== person.id), entry]
        setRegisteredFaces(updated)
        saveFaces(updated)
        setSelectedStaff('')
        setRegSearch('')
        setCapturedPhoto(null)
        stopCamera()
      }
    } catch {
      // error shown via useFaceApi
    } finally {
      setEnrolling(false)
    }
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

    const hasInProgress = punches.some((p) => p.type === 'in')

    let punchType: 'in' | 'out'

    if (!hasInProgress) {
      punchType = 'in'
    } else {
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
      const startTime = institution?.startTime || '07:30'
      const endTime = institution?.endTime || '14:30'
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      const distToStart = Math.abs(currentTimeMinutes - startMinutes)
      const distToEnd = Math.abs(currentTimeMinutes - endMinutes)

      if (distToStart < distToEnd) {
        punchType = 'in'
      } else if (distToEnd < distToStart) {
        punchType = 'out'
      } else {
        punchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
      }
    }

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
      if (identifiedRef.current || recognizing) return
      const v = videoRef.current
      if (!v || !isVideoReady(v)) return

      setRecognizing(true)
      try {
        const result = await recognizeFace(v)
        if (result?.personId) {
          setFaceDetected(true)
          const match = registeredFaces.find((f) => f.staffId === result.personId)
          if (match) {
            if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
            setDetecting(false)
            setFaceDetected(false)
            const lastPunch = cooldownRef.current[match.staffId] || 0
            if (Date.now() - lastPunch < COOLDOWN_MS) {
              startDetectLoop()
              return
            }
            handlePunch(match.staffId, match.staffName, match.photo)
            setTimeout(() => startDetectLoop(), 500)
          } else {
            setFaceDetected(false)
          }
        } else {
          setFaceDetected(false)
        }
      } catch {
        setFaceDetected(false)
      } finally {
        setRecognizing(false)
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
                      {identified.punchType === 'in' ? (isBn ? 'CHECKED IN' : 'CHECKED IN') : isBn ? 'CHECKED OUT' : 'CHECKED OUT'}
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

  return (
    <>

      {/* Attendance popup */}
      {renderAttendancePopup()}

      {/* HTTPS warning */}
      {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
        <div className="mb-4 py-3 px-4 rounded-xl bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] font-medium text-center">
          <span className="font-bold">🔒 {isBn ? 'HTTPS প্রয়োজন!' : 'HTTPS Required!'}</span>
          <br />
          {isBn ? 'বায়োমেট্রিক কাজ করতে https:// দিয়ে খুলুন।' : 'Open with https:// for camera to work.'}
        </div>
      )}

      {/* Backend connection indicator */}
      <div className="mb-4 py-3 px-4 rounded-xl bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.75rem] font-medium text-center">
        {faceApiLoading
          ? (isBn ? '🔄 ব্যাকএন্ড সংযোগ হচ্ছে...' : '🔄 Connecting to backend...')
          : faceApiError
            ? `❌ ${faceApiError}`
            : (isBn ? '✅ ব্যাকএন্ড সংযুক্ত — সার্ভার-সাইড মুখ সনাক্তকরণ সক্রিয়' : '✅ Backend connected — Server-side face recognition active')}
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
          <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {isBn ? 'মুখ নিবন্ধন' : 'Register Face'}
              </div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                {isBn ? 'ক্যামেরায় মুখ তুলুন — সার্ভারে সংরক্ষিত হবে' : 'Capture face with camera — stored on server'}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Autocomplete input */}
              <div className="relative">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2">
                  <Search size={13} className="text-[var(--text-muted)] shrink-0" />
                  <input
                    value={regSearch}
                    onChange={(e) => { setRegSearch(e.target.value); setSelectedStaff(''); setCapturedPhoto(null) }}
                    onFocus={() => {}}
                    placeholder={isBn ? 'নাম, আইডি বা সেকশন লিখুন...' : 'Type name, ID, or section...'}
                    className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
                  />
                  {regSearch && (
                    <button onClick={() => { setRegSearch(''); setSelectedStaff('') }} className="border-none bg-transparent cursor-pointer text-[var(--text-muted)]">
                      <X size={12} />
                    </button>
                  )}
                </div>
                {/* Suggestions dropdown */}
                {regSearch && !selectedStaff && filteredPeople.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-[14rem] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl">
                    {filteredPeople.slice(0, 20).map((p) => {
                      const registered = registeredFaces.find((f) => f.staffId === p.id)
                      return (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedStaff(p.id); setRegSearch(p.name); setCapturedPhoto(null) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                            {p.photo ? (
                              <img src={p.photo} alt="" className="w-full h-full object-cover" />
                            ) : p.type === 'staff' ? (
                              <User size={12} className="text-[var(--text-muted)]" />
                            ) : (
                              <GraduationCap size={12} className="text-[var(--text-muted)]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">
                              {p.name}
                              {registered && <span className="text-[var(--green)] ml-1">✓</span>}
                            </div>
                            <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono truncate">
                              {p.id}{p.type === 'student' && p.dept ? ` · ${p.dept}-${p.section}` : ''}
                            </div>
                          </div>
                          <span className={`text-[0.4375rem] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                            p.type === 'student' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--brand-light)] text-[var(--brand)]'
                          }`}>
                            {p.type === 'student' ? 'STU' : 'STAFF'}
                          </span>
                        </button>
                      )
                    })}
                    {filteredPeople.length > 20 && (
                      <div className="px-3 py-1.5 text-center text-[0.5625rem] text-[var(--text-muted)] border-t border-[var(--border)]">
                        +{filteredPeople.length - 20} {isBn ? 'আরও...' : 'more...'}
                      </div>
                    )}
                  </div>
                )}
                {regSearch && !selectedStaff && filteredPeople.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl p-4 text-center">
                    <div className="text-[0.6875rem] text-[var(--text-muted)]">
                      {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
                    </div>
                  </div>
                )}
              </div>
              {selectedStaff && !camActive && (
                <button
                  onClick={startCamera}
                  className="w-full py-2.5 rounded-lg text-[0.75rem] font-semibold bg-[var(--green)] text-white border-none cursor-pointer flex items-center justify-center gap-2"
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
                    disabled={enrolling}
                    className="w-full py-2.5 rounded-lg text-[0.75rem] bg-[var(--green)] text-white border-none font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {enrolling ? (isBn ? 'নিবন্ধন হচ্ছে...' : 'Enrolling...') : (isBn ? 'নিবন্ধন করুন' : 'Register')}
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
          </div>

          {/* Quick Info */}
          <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] flex flex-col justify-center items-center text-center min-h-[12rem] p-6">
            <ScanFace size={40} className="text-[var(--text-muted)] mb-3 opacity-30" />
            <div className="text-[0.875rem] font-semibold text-[var(--text-secondary)] mb-1">
              {isBn ? 'স্টাফ বা শিক্ষার্থী নির্বাচন করুন' : 'Select staff or student'}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] max-w-[16rem]">
              {isBn
                ? 'নিবন্ধিত সকলে কিওস্ক মোডে মুখ দেখিয়ে চেক ইন/আউট করতে পারবেন'
                : 'Registered staff & students can check in/out by showing face in kiosk mode'}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-[var(--brand)]" />
                <span className="text-[0.6875rem] text-[var(--text-muted)]">{activeTeachers.length} {isBn ? 'স্টাফ' : 'Staff'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap size={13} className="text-[var(--green)]" />
                <span className="text-[0.6875rem] text-[var(--text-muted)]">{activeStudents.length} {isBn ? 'শিক্ষার্থী' : 'Students'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registered Staff & Students Table */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {isBn ? `নিবন্ধিত (${registeredFaces.length})` : `Registered (${registeredFaces.length})`}
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle size={11} className="text-[var(--teal)]" />
              <span className="text-[0.625rem] text-[var(--text-muted)]">{stats.todayCheckin} {isBn ? 'আজ' : 'Today'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-[var(--brand)]" />
              <span className="text-[0.625rem] text-[var(--text-muted)]">{stats.active} {isBn ? 'সক্রিয়' : 'Active'}</span>
            </div>
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
          <table className="w-full border-collapse text-[0.8125rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="px-4 py-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] w-[2.5rem] uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'নাম' : 'Name'}</th>
                <th className="px-4 py-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'আইডি' : 'ID'}</th>
                <th className="px-4 py-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-4 py-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaces.map((f, i) => {
                const isCheckedIn = attendance[date]?.[f.staffId]?.status === 'present'
                return (
                  <tr key={f.staffId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-4 py-3 text-center text-[var(--text-muted)] font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]">
                          {f.photo ? (
                            <img src={f.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={14} className="text-[var(--text-muted)]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{f.staffName}</div>
                          <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">{f.staffId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.75rem] text-[var(--text-secondary)]">{f.staffId}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[0.625rem] px-2.5 py-1 rounded-full font-semibold ${
                        isCheckedIn
                          ? 'bg-[var(--green-light)] text-[var(--green)]'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? 'bg-[var(--green)]' : 'bg-[var(--text-muted)]'}`} />
                        {isCheckedIn ? (isBn ? 'চেক-ইন' : 'Checked In') : (isBn ? 'নিবন্ধিত' : 'Registered')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteFace(f.staffId)}
                        className="px-3 py-1.5 rounded-lg text-[0.625rem] font-semibold bg-[var(--red-light)] text-[var(--red)] border border-transparent hover:bg-[var(--red)] hover:text-white cursor-pointer transition-all"
                      >
                        {isBn ? 'মুছুন' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredFaces.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    {isBn ? 'কোনো নিবন্ধিত ব্যক্তি নেই' : 'No registered people'}
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
