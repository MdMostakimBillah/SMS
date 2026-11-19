import { useEffect, useRef, useState, useCallback } from 'react'
import { QrCode, Camera, CheckCircle, AlertCircle, RefreshCw, Volume2, VolumeX, Sparkles, User, GraduationCap, Zap } from 'lucide-react'
import { useAttendanceStore } from '@/store/attendanceStore'
import type { Person } from '../types'

interface QrAttendanceScannerProps {
  isBn: boolean
  date: string
  allPeople: Person[]
}

interface ScanResult {
  person: Person | { id: string; name: string; type: string; photo?: string }
  type: 'in' | 'out'
  time: string
  status: string
}

export function QrAttendanceScanner({ isBn, date, allPeople }: QrAttendanceScannerProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [manualInput, setManualInput] = useState('')
  const [processing, setProcessing] = useState(false)

  const scannerRef = useRef<any>(null)
  const lastScanTimeRef = useRef<Record<string, number>>({})

  // Synthesize a clean audio beep using Web Audio API (offline & instant)
  const playBeep = useCallback((success: boolean = true) => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1) // E6
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.18)
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.25)
      }
    } catch {
      // Audio autoplay policy ignored
    }
  }, [soundEnabled])

  // Extract ID from QR code text (supports raw ID, JSON, or URL)
  const parseQrText = (text: string): string => {
    const trimmed = text.trim()
    if (!trimmed) return ''

    // Try parsing JSON format { "id": "STU-001" } or { "studentId": "..." } or { "rfidCard": "..." }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed.id) return String(parsed.id)
        if (parsed.studentId) return String(parsed.studentId)
        if (parsed.staffId) return String(parsed.staffId)
        if (parsed.teacherId) return String(parsed.teacherId)
        if (parsed.rfidCard) return String(parsed.rfidCard)
        if (parsed.cardId) return String(parsed.cardId)
      } catch {
        // Not valid JSON
      }
    }

    // Check if it's a URL with ?id= or /student/
    if (trimmed.includes('http://') || trimmed.includes('https://')) {
      try {
        const url = new URL(trimmed)
        const idParam =
          url.searchParams.get('id') ||
          url.searchParams.get('studentId') ||
          url.searchParams.get('staffId') ||
          url.searchParams.get('card')
        if (idParam) return idParam
        const parts = url.pathname.split('/').filter(Boolean)
        if (parts.length > 0) return parts[parts.length - 1]
      } catch {
        // Fallback
      }
    }

    return trimmed
  }

  // Handle scanned or entered person ID
  const processAttendanceScan = useCallback(async (rawText: string) => {
    const personId = parseQrText(rawText)
    if (!personId) return

    // Debounce duplicate scans for the same person within 4 seconds
    const now = Date.now()
    const lastScan = lastScanTimeRef.current[personId.toLowerCase()] || 0
    if (now - lastScan < 4000) {
      return
    }
    lastScanTimeRef.current[personId.toLowerCase()] = now

    setProcessing(true)

    // 1. Check direct person match in allPeople
    let person: Person | { id: string; name: string; type: string; photo?: string } | undefined = allPeople.find(
      (p) => p.id.toLowerCase() === personId.toLowerCase()
    )

    // 2. If not found, match by RFID Card number
    if (!person) {
      const rfidMatch = useAttendanceStore.getState().rfidEntries.find(
        (r) => r.rfidCard.toLowerCase() === personId.toLowerCase()
      )
      if (rfidMatch) {
        const found = allPeople.find((p) => p.id.toLowerCase() === rfidMatch.staffId.toLowerCase())
        person = found || {
          id: rfidMatch.staffId,
          name: rfidMatch.staffName,
          type: rfidMatch.type?.toLowerCase().includes('student') || rfidMatch.staffId.startsWith('STU') ? 'student' : 'staff',
          photo: '',
        }
      }
    }

    // 3. Fallback for unlisted person
    if (!person) {
      const isStu = personId.startsWith('STU')
      person = {
        id: personId,
        name: isBn
          ? (isStu ? `শিক্ষার্থী (${personId})` : `স্টাফ (${personId})`)
          : (isStu ? `Student (${personId})` : `Staff (${personId})`),
        type: isStu ? 'student' : 'staff',
        photo: '',
      }
    }

    try {
      const punchRes = await useAttendanceStore.getState().recordPunch({
        personId: person.id,
        date,
        method: 'rfid',
        deviceId: 'MOBILE-QR-CAM',
      })

      playBeep(true)
      const res: ScanResult = {
        person,
        type: punchRes.punch.type,
        time: punchRes.punch.time,
        status: punchRes.status,
      }
      setLastResult(res)
      setRecentScans((prev) => [res, ...prev.slice(0, 7)])
    } catch {
      playBeep(false)
    } finally {
      setProcessing(false)
    }
  }, [allPeople, date, isBn, playBeep])

  // Camera start / stop effect
  useEffect(() => {
    let mounted = true
    let html5Qr: any = null

    if (!cameraActive) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null
        })
      }
      return
    }

    const startCamera = async () => {
      setCameraError(null)
      try {
        // Defensive check: wait until DOM element is mounted
        let container = document.getElementById('qr-reader-container')
        if (!container) {
          await new Promise((r) => setTimeout(r, 80))
          container = document.getElementById('qr-reader-container')
        }
        if (!mounted || !container) return

        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mounted) return

        html5Qr = new Html5Qrcode('qr-reader-container')
        scannerRef.current = html5Qr

        await html5Qr.start(
          { facingMode },
          {
            fps: 12,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (mounted) {
              processAttendanceScan(decodedText)
            }
          },
          () => {} // Frame level ignore
        )
      } catch (err: any) {
        if (!mounted) return
        setCameraError(err?.message || (isBn ? 'ক্যামেরা চালু করা যায়নি' : 'Failed to start camera'))
        setCameraActive(false)
      }
    }

    startCamera()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [cameraActive, facingMode, processAttendanceScan, isBn])

  // Sample people for quick test from registered members
  const sampleStudents = allPeople.filter((p) => p.type === 'student').slice(0, 2)
  const sampleStaff = allPeople.filter((p) => p.type === 'staff').slice(0, 2)
  const samplePeople = [...sampleStudents, ...sampleStaff]

  return (
    <div className="space-y-4">
      {/* Top Banner & Controls */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)]">
            <QrCode size={18} />
          </div>
          <div>
            <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'আইডি কার্ড QR কোড উপস্থিতি স্ক্যানার' : 'ID Card QR Code Attendance Scanner'}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)]">
              {isBn ? 'ক্যামেরার সামনে শিক্ষার্থী বা শিক্ষকের ID কার্ড ধরুন' : 'Point camera at student or teacher ID card QR code'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? (isBn ? 'শব্দ বন্ধ' : 'Mute sound') : (isBn ? 'শব্দ চালু' : 'Enable sound')}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {soundEnabled ? <Volume2 size={14} className="text-[var(--green)]" /> : <VolumeX size={14} />}
          </button>

          {cameraActive && (
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              title={isBn ? 'ক্যামেরা পরিবর্তন' : 'Flip camera'}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.6875rem] font-medium text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--border)]"
            >
              {facingMode === 'environment' ? (isBn ? 'সেলফি ক্যামেরা' : 'Front Cam') : (isBn ? 'ব্যাক ক্যামেরা' : 'Back Cam')}
            </button>
          )}

          <button
            type="button"
            onClick={() => setCameraActive(!cameraActive)}
            className={`px-3.5 py-1.5 rounded-lg text-white text-[0.75rem] font-semibold cursor-pointer border-0 transition-all shadow-sm flex items-center gap-1.5 ${
              cameraActive ? 'bg-[var(--red)] hover:opacity-90' : 'bg-[var(--brand)] hover:opacity-90'
            }`}
          >
            <Camera size={14} />
            {cameraActive
              ? isBn ? 'ক্যামেরা বন্ধ করুন' : 'Stop Camera'
              : isBn ? 'ক্যামেরা চালু করুন' : 'Start Camera'}
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="p-3 rounded-xl bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Grid: Camera Viewfinder & Result Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Camera Feed & Overlay */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center min-h-[20rem]">
          {cameraActive ? (
            <div className="relative w-full max-w-[18.75rem] aspect-square rounded-xl overflow-hidden bg-black shadow-inner">
              <div id="qr-reader-container" className="w-full h-full" />
              {/* Target Scan Guides */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[12.5rem] h-[12.5rem] border-2 border-dashed border-[var(--brand)] rounded-xl relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[var(--brand)]" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[var(--brand)]" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[var(--brand)]" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[var(--brand)]" />
                </div>
              </div>
              {processing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs">
                  <RefreshCw size={18} className="animate-spin mr-1.5" />
                  {isBn ? 'যাচাই হচ্ছে...' : 'Verifying...'}
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center text-[var(--text-muted)] max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
                <Camera size={32} />
              </div>
              <div className="font-semibold text-[0.875rem] text-[var(--text-primary)] mb-1">
                {isBn ? 'ক্যামেরা বন্ধ রয়েছে' : 'Camera is Idle'}
              </div>
              <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3">
                {isBn
                  ? 'লাইভ আইডি কার্ড QR কোড স্ক্যান করে উপস্থিতি নিতে "ক্যামেরা চালু করুন" বাটনে চাপ দিন।'
                  : 'Click "Start Camera" to scan student and teacher ID card QR codes live.'}
              </p>
              <button
                type="button"
                onClick={() => setCameraActive(true)}
                className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-semibold cursor-pointer border-0 hover:opacity-90 shadow-sm"
              >
                {isBn ? 'ক্যামেরা চালু করুন' : 'Start Camera'}
              </button>
            </div>
          )}

          {/* Manual Entry or Barcode Gun input */}
          <div className="w-full max-w-sm mt-3 pt-3 border-t border-[var(--border)]">
            <div className="text-[0.625rem] text-[var(--text-muted)] mb-1.5 font-medium">
              {isBn ? 'ক্যামেরা না থাকলে অথবা USB বারকোড স্ক্যানার দিয়ে:' : 'Without camera or using USB scanner gun:'}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (manualInput.trim()) {
                  processAttendanceScan(manualInput.trim())
                  setManualInput('')
                }
              }}
              className="flex gap-2"
            >
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. STU-2026-001, CARD-2001 or TCH-2026-001"
                className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand)]"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-semibold cursor-pointer border-0 disabled:opacity-50"
              >
                {isBn ? 'যাচাই' : 'Scan'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Last Detection Card & Recent Logs */}
        <div className="space-y-4">
          {/* Active Result Card */}
          {lastResult ? (
            <div className="bg-[var(--bg-primary)] border-2 border-[var(--green)] rounded-xl p-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-[var(--green)] font-semibold text-[0.8125rem]">
                  <CheckCircle size={16} />
                  {isBn ? 'উপস্থিতি সফলভাবে রেকর্ড হয়েছে!' : 'Attendance Recorded Successfully!'}
                </span>
                <span className="text-[0.6875rem] font-mono px-2 py-0.5 rounded-full bg-[var(--green-light)] text-[var(--green)] font-bold">
                  {lastResult.time}
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  {lastResult.person.photo ? (
                    <img src={lastResult.person.photo} alt={lastResult.person.name} className="w-full h-full object-cover" />
                  ) : lastResult.person.type === 'student' ? (
                    <GraduationCap size={24} className="text-[var(--green)]" />
                  ) : (
                    <User size={24} className="text-[var(--brand)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[0.875rem] text-[var(--text-primary)] truncate">
                    {lastResult.person.name}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono flex items-center gap-2 mt-0.5">
                    <span>{lastResult.person.id}</span>
                    <span
                      className={`text-[0.5625rem] px-1.5 py-0.2 rounded font-semibold ${
                        lastResult.person.type === 'student'
                          ? 'bg-[var(--green-light)] text-[var(--green)]'
                          : 'bg-[var(--brand-light)] text-[var(--brand)]'
                      }`}
                    >
                      {lastResult.person.type === 'student' ? (isBn ? 'শিক্ষার্থী' : 'STUDENT') : (isBn ? 'স্টাফ' : 'STAFF')}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-[0.6875rem] font-bold px-2 py-1 rounded-md ${
                      lastResult.type === 'in'
                        ? 'bg-[var(--green-light)] text-[var(--green)]'
                        : 'bg-[var(--amber-light)] text-[var(--amber)]'
                    }`}
                  >
                    {lastResult.type === 'in' ? (isBn ? 'ইন' : 'CHECK IN') : (isBn ? 'আউট' : 'CHECK OUT')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-5 text-center text-[var(--text-muted)]">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-2 text-[var(--brand)]">
                <QrCode size={20} />
              </div>
              <div className="text-[0.75rem] font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'কোনো স্ক্যান হয়নি' : 'No Scan Recorded Yet'}
              </div>
              <p className="text-[0.625rem] text-[var(--text-muted)] max-w-xs mx-auto">
                {isBn
                  ? 'ক্যামেরা দিয়ে আইডি কার্ড স্ক্যান করুন অথবা নিচের শিক্ষার্থী ও শিক্ষক কার্ডে ক্লিক করে উপস্থিতি পরীক্ষা করুন।'
                  : 'Scan an ID card with camera or click a demo student/teacher below to test instant punch recording.'}
              </p>
            </div>
          )}

          {/* Quick Test Buttons (only shown when people exist) */}
          {samplePeople.length > 0 && (
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5">
              <div className="text-[0.625rem] font-semibold text-[var(--text-muted)] mb-2 flex items-center gap-1">
                <Sparkles size={11} className="text-[var(--brand)]" />
                {isBn ? 'কুইক টেস্ট (ক্যামেরা ছাড়া ১-ক্লিকে উপস্থিতি পরীক্ষা করুন):' : 'Instant One-Click Punch Test:'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {samplePeople.map((p) => {
                  const isStudent = p.type === 'student'
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => processAttendanceScan(p.id)}
                      className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)] text-left cursor-pointer transition-all flex items-center gap-2 group"
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isStudent
                            ? 'bg-[var(--green-light)] text-[var(--green)]'
                            : 'bg-[var(--brand-light)] text-[var(--brand)]'
                        }`}
                      >
                        {isStudent ? <GraduationCap size={13} /> : <User size={13} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--brand)]">
                          {p.name}
                        </div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono flex items-center gap-1">
                          <span>{p.id}</span>
                          <span className="text-[0.5rem] opacity-75">{isStudent && p.dept ? `• ${p.dept}` : ''}</span>
                        </div>
                      </div>
                      <Zap size={10} className="text-[var(--text-muted)] group-hover:text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Scans Strip */}
          {recentScans.length > 0 && (
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5">
              <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] mb-2">
                {isBn ? 'আজকের সাম্প্রতিক স্ক্যান' : 'Live Scanned Activity'}
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recentScans.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)] text-[0.6875rem]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] shrink-0" />
                      <span className="font-medium text-[var(--text-primary)] truncate">{r.person.name}</span>
                      <span className="text-[0.5625rem] text-[var(--text-muted)] font-mono">({r.person.id})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[0.5625rem] font-bold px-1.5 py-0.5 rounded ${
                        r.type === 'in' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'
                      }`}>
                        {r.type === 'in' ? (isBn ? 'ইন' : 'IN') : (isBn ? 'আউট' : 'OUT')}
                      </span>
                      <span className="text-[0.625rem] text-[var(--text-muted)] font-mono">{r.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
