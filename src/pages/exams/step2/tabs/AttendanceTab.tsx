import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Users,
  CheckCircle,
  UserX,
  QrCode,
  ClipboardCheck,
  Download,
  X,
} from 'lucide-react'
import { sectionCls, sectionTitleCls, inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { logger } from '@/lib/logger'
import { generateAttendanceSheetHTML } from '../pdfTemplates/attendanceSheet'

type Student = {
  id: string
  nameEn: string
  class: string
  section: string
  roll: string
  photo: string
  status: string
  active?: boolean
}

type Attendance = {
  examId: string
  studentId: string
  classId: string
  sectionId: string
  date: string
  shift: string
  status: string
  scannedBy: string
  scannedAt: string
}

type SelectedExam = {
  startDate: string
  endDate: string
} | null

interface AttendanceTabProps {
  isBn: boolean
  selectedExamId: string
  selectedExam: SelectedExam
  filteredAttendances: Attendance[]
  students: Student[]
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  addAttendance: (attendance: any) => void
}

// ─── QR Scanner Modal ───
function QRScannerModal({
  isBn,
  onScan,
  onClose,
  lastScanned,
}: {
  isBn: boolean
  examId: string
  classId: string
  sectionId: string
  date: string
  shift: string
  students: Student[]
  onScan: (studentId: string) => void
  onClose: () => void
  lastScanned: string
}) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const [scannerReady, setScannerReady] = useState(false)
  const [manualId, setManualId] = useState('')

  useEffect(() => {
    let mounted = true
    let scanner: any = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mounted || !scannerRef.current) return

        scanner = new Html5Qrcode('qr-reader')
        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 5,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            try {
              const data = JSON.parse(decodedText)
              if (data.studentId) {
                onScan(data.studentId)
              } else if (data.id) {
                onScan(data.id)
              }
            } catch {
              onScan(decodedText.trim())
            }
          },
          () => {}
        )
        if (mounted) setScannerReady(true)
      } catch (err) {
        logger.warn('QR Scanner error', { error: err instanceof Error ? err.message : String(err) })
        if (mounted) setScannerReady(false)
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current.clear().catch(() => {})
        html5QrCodeRef.current = null
      }
    }
  }, [onScan])

  const handleManualSubmit = () => {
    if (manualId.trim()) {
      onScan(manualId.trim())
      setManualId('')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-content" style={{ maxWidth: '25rem' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
            <QrCode size={16} className="inline mr-1" />
            {isBn ? 'QR স্ক্যান' : 'QR Scanner'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <div id="qr-reader" ref={scannerRef} className="rounded-lg overflow-hidden mb-3 min-h-[15rem] bg-black" />

        <div className="text-center mb-3">
          {scannerReady ? (
            <span className="text-[0.625rem] text-[var(--green)] font-medium">{isBn ? 'স্ক্যানার সক্রিয় — QR কোড দেখান' : 'Scanner active — Show QR code'}</span>
          ) : (
            <span className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'স্ক্যানার চালু হচ্ছে...' : 'Starting scanner...'}</span>
          )}
        </div>

        {lastScanned && (
          <div className={`text-center text-[0.75rem] font-semibold p-2 rounded-lg mb-3 ${
            lastScanned.includes('Present') || lastScanned.includes('উপস্থিত')
              ? 'bg-[var(--green-light)] text-[var(--green)]'
              : lastScanned.includes('Wrong') || lastScanned.includes('ভুল')
                ? 'bg-red-50 text-[var(--red)]'
                : 'bg-[var(--brand-light)] text-[var(--brand)]'
          }`}>
            {lastScanned}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            className={`${inputCls} flex-1`}
            placeholder={isBn ? 'ম্যানুয়াল আইডি লিখুন...' : 'Enter student ID manually...'}
          />
          <button onClick={handleManualSubmit} className={btnPrimary}>
            {isBn ? 'সাবমিট' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const AttendanceTab = React.memo(function AttendanceTab({
  isBn,
  selectedExamId,
  selectedExam,
  filteredAttendances,
  students,
  classOptions,
  sectionsMap,
  addAttendance,
}: AttendanceTabProps) {
  const [attClassId, setAttClassId] = useState('')
  const [attSectionId, setAttSectionId] = useState('')
  const [attDate, setAttDate] = useState('')
  const [attShift, setAttShift] = useState<'morning' | 'afternoon'>('morning')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [lastScanned, setLastScanned] = useState('')

  return (
    <>
      {/* Attendance Controls */}
      <div className={sectionCls}>
        <div className={sectionTitleCls}>
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--brand-light)]">
            <ClipboardCheck size={13} className="text-[var(--brand)]" />
          </div>
          {isBn ? 'পরীক্ষাভিত্তিক উপস্থিতি' : 'Exam-wise Student Attendance'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
            <select
              value={attClassId}
              onChange={(e) => { setAttClassId(e.target.value); setAttSectionId('') }}
              className={`${selectCls} w-full`}
            >
              <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
            <select
              value={attSectionId}
              onChange={(e) => setAttSectionId(e.target.value)}
              className={`${selectCls} w-full`}
              disabled={!attClassId}
            >
              <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
              {(sectionsMap[attClassId] || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
            <input
              type="date"
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              className={`${inputCls} w-full`}
              min={selectedExam?.startDate || ''}
              max={selectedExam?.endDate || ''}
            />
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিফট' : 'Shift'}</label>
            <select
              value={attShift}
              onChange={(e) => setAttShift(e.target.value as 'morning' | 'afternoon')}
              className={`${selectCls} w-full`}
            >
              <option value="morning">{isBn ? 'সকাল' : 'Morning'}</option>
              <option value="afternoon">{isBn ? 'বিকাল' : 'Afternoon'}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              if (!attClassId || !attSectionId || !attDate) {
                alert(isBn ? 'শ্রেণি, সেকশন এবং তারিখ নির্বাচন করুন' : 'Select class, section and date')
                return
              }
              setShowQRScanner(true)
            }}
            disabled={!attClassId || !attSectionId || !attDate}
            className={`${btnPrimary} ${!attClassId || !attSectionId || !attDate ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <QrCode size={14} />
            {isBn ? 'QR স্ক্যান শুরু' : 'Start QR Scan'}
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && createPortal(
        <QRScannerModal
          isBn={isBn}
          examId={selectedExamId}
          classId={attClassId}
          sectionId={attSectionId}
          date={attDate}
          shift={attShift}
          students={students}
          onScan={(studentId) => {
            const student = students.find((s) => s.id === studentId)
            if (!student || student.class !== attClassId || student.section !== attSectionId) {
              setLastScanned(isBn ? 'ভুল শ্রেণি/সেকশন!' : 'Wrong class/section!')
              return
            }
            addAttendance({
              examId: selectedExamId,
              studentId: student.id,
              classId: attClassId,
              sectionId: attSectionId,
              date: attDate,
              shift: attShift,
              status: 'present',
              scannedBy: 'QR',
              scannedAt: new Date().toISOString(),
            })
            setLastScanned(`${student.nameEn} - ${isBn ? 'উপস্থিত' : 'Present'}`)
            setTimeout(() => setLastScanned(''), 2000)
          }}
          onClose={() => setShowQRScanner(false)}
          lastScanned={lastScanned}
        />,
        document.body
      )}

      {/* Attendance Summary */}
      {attClassId && attSectionId && attDate && (() => {
        const classStudents = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === attClassId && s.section === attSectionId)
        const presentIds = new Set(
          filteredAttendances
            .filter((a) => a.classId === attClassId && a.sectionId === attSectionId && a.date === attDate)
            .map((a) => a.studentId)
        )
        const total = classStudents.length
        const present = presentIds.size
        const absent = total - present
        const pct = total > 0 ? Math.round((present / total) * 100) : 0
        const sorted = classStudents.sort((a, b) => (a.roll || '').localeCompare(b.roll || '', undefined, { numeric: true }))

        return (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                { label: isBn ? 'মোট ছাত্র' : 'Total Students', value: total, icon: <Users size={14} />, bg: 'var(--brand-light)', color: 'var(--brand)' },
                { label: isBn ? 'উপস্থিত' : 'Present', value: present, icon: <CheckCircle size={14} />, bg: 'var(--green-light)', color: 'var(--green)' },
                { label: isBn ? 'অনুপস্থিত' : 'Absent', value: absent, icon: <UserX size={14} />, bg: 'var(--red-light)', color: 'var(--red)' },
                { label: isBn ? 'হার' : 'Rate', value: `${pct}%`, icon: <ClipboardCheck size={14} />, bg: 'var(--amber-light)', color: 'var(--amber)' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-[0.75rem] border border-[var(--border)] bg-[var(--bg-primary)] p-3"
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: s.bg }}
                  >
                    <span style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)]">{s.label}</div>
                    <div className="text-[1rem] font-semibold text-[var(--text-primary)]">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Attendance Sheet */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                    {attClassId} - {attSectionId}
                  </span>
                  <span className="text-[0.6875rem] text-[var(--text-muted)]">
                    {attDate} · {attShift === 'morning' ? (isBn ? 'সকাল' : 'Morning') : (isBn ? 'বিকাল' : 'Afternoon')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const presentList = sorted.filter((s) => presentIds.has(s.id))
                    const absentList = sorted.filter((s) => !presentIds.has(s.id))
                    const html = generateAttendanceSheetHTML({
                      classId: attClassId,
                      sectionId: attSectionId,
                      date: attDate,
                      shift: attShift,
                      present: presentList,
                      absent: absentList,
                      totalStudents: total,
                    })
                    const win = window.open('', '_blank')
                    if (!win) return
                    win.document.write(html)
                    win.document.close()
                    setTimeout(() => win.print(), 500)
                  }}
                  className="flex items-center gap-1 text-[0.625rem] text-[var(--brand)] hover:text-[var(--brand-dark)] cursor-pointer"
                >
                  <Download size={12} />
                  PDF
                </button>
              </div>

              {/* Progress */}
              <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)',
                  }}
                />
              </div>

              {/* Student Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {sorted.map((student) => {
                  const isPresent = presentIds.has(student.id)
                  return (
                    <div
                      key={student.id}
                      className={`relative rounded-xl p-3 border transition-all duration-200 ${
                        isPresent
                          ? 'bg-[var(--green-light)] border-[var(--green)]/20 shadow-sm'
                          : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--red)]/30'
                      }`}
                    >
                      <div className="absolute top-2 right-2">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ background: isPresent ? 'var(--green)' : 'var(--red)' }}
                        />
                      </div>
                      <div className="text-[0.5625rem] text-[var(--text-muted)] mb-0.5">
                        {isBn ? 'রোল' : 'Roll'}: {student.roll || '-'}
                      </div>
                      <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate pr-3">
                        {student.nameEn}
                      </div>
                      <div className={`text-[0.5625rem] mt-1.5 font-medium ${
                        isPresent ? 'text-[var(--green)]' : 'text-[var(--red)]'
                      }`}>
                        {isPresent ? (isBn ? 'উপস্থিত' : 'Present') : (isBn ? 'অনুপস্থিত' : 'Absent')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )
      })}

      {!attClassId && !attSectionId && (
        <div className={`${sectionCls} text-center py-10`}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-secondary)] mb-3">
            <ClipboardCheck size={22} className="text-[var(--text-muted)] opacity-40" />
          </div>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mb-1">
            {isBn ? 'শ্রেণি, সেকশন এবং তারিখ নির্বাচন করুন' : 'Select class, section and date to take attendance'}
          </p>
          <p className="text-[0.6875rem] text-[var(--text-muted)] opacity-60">
            {isBn ? 'QR স্ক্যান বা ম্যানুয়াল এন্ট্রি দ্বারা উপস্থিতি নিন' : 'Mark attendance via QR scan or manual entry'}
          </p>
        </div>
      )}
    </>
  )
})
