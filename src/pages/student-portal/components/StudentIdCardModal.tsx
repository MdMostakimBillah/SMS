import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, QrCode, School, ShieldCheck } from 'lucide-react'
import type { StudentProfile } from '../types'
import { useClassStore } from '@/store/classStore'
import { openPrintWindow } from '@/lib/pdf'

interface StudentIdCardModalProps {
  isOpen?: boolean
  student: StudentProfile
  onClose: () => void
  isBn: boolean
}

export const StudentIdCardModal = React.memo(function StudentIdCardModal({
  isOpen,
  student,
  onClose,
  isBn,
}: StudentIdCardModalProps) {
  const institution = useClassStore((s) => s.institution)

  useEffect(() => {
    if (isOpen === false) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (isOpen === false) return null
  if (typeof document === 'undefined') return null

  const handlePrint = () => {
    const css = `
      @page { size: 85.6mm 54mm; margin: 0; }
      body { font-family: sans-serif; margin: 0; padding: 10px; background: #fff; color: #1e293b; }
      .card { border: 1.5px solid #4f46e5; border-radius: 8px; padding: 12px; height: 100%; box-sizing: border-box; position: relative; }
      .hdr { text-align: center; border-bottom: 1.5px solid #4f46e5; padding-bottom: 6px; margin-bottom: 8px; }
      .sname { font-size: 13px; font-weight: bold; color: #3730a3; }
      .sttl { font-size: 8px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
      .body { display: flex; gap: 10px; align-items: center; }
      .photo { width: 55px; height: 65px; border-radius: 6px; object-fit: cover; border: 1px solid #cbd5e1; }
      .info { font-size: 9.5px; line-height: 1.5; flex: 1; }
      .info strong { color: #0f172a; }
      .ftr { margin-top: 8px; font-size: 7.5px; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 4px; }
    `
    const html = `
      <div class="card">
        <div class="hdr">
          <div class="sname">${institution.name || 'EduTech Smart School'}</div>
          <div class="sttl">${isBn ? 'শিক্ষার্থী পরিচয়পত্র' : 'STUDENT IDENTITY CARD'}</div>
        </div>
        <div class="body">
          ${
            student.photo
              ? `<img src="${student.photo}" class="photo" alt="" />`
              : `<div class="photo" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:bold">${student.nameEn.charAt(0)}</div>`
          }
          <div class="info">
            <div><strong>${isBn ? 'নাম:' : 'Name:'}</strong> ${isBn ? student.nameBn || student.nameEn : student.nameEn}</div>
            <div><strong>${isBn ? 'আইডি:' : 'ID:'}</strong> ${student.id}</div>
            <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${student.class} | <strong>${isBn ? 'রোল:' : 'Roll:'}</strong> ${student.roll}</div>
            <div><strong>${isBn ? 'শাখা:' : 'Section:'}</strong> ${student.section || 'A'}</div>
            <div><strong>${isBn ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</strong> ${student.bloodGroup || 'N/A'}</div>
            <div><strong>${isBn ? 'জরুরি যোগাযোগ:' : 'Emergency:'}</strong> ${student.emergencyContact || student.guardianPhone || 'N/A'}</div>
          </div>
        </div>
        <div class="ftr">
          ${isBn ? 'নিয়মিত কার্ডটি সাথে রাখুন।' : 'Keep this card with you during school hours.'}
        </div>
      </div>
    `
    openPrintWindow(html, css)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--brand)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'ডিজিটাল শিক্ষার্থী পরিচয়পত্র' : 'Digital Student ID Card'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5">
          <div className="border-2 border-[var(--brand)] rounded-xl p-4 bg-gradient-to-br from-[var(--surface)] to-[var(--bg-secondary)] relative overflow-hidden shadow-sm">
            {/* School Header */}
            <div className="text-center pb-3 border-b border-[var(--border)] mb-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--brand)]">
                <School size={14} />
                <span>{institution.name || 'EduTech Smart School'}</span>
              </div>
              <p className="text-[0.625rem] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                {isBn ? 'শিক্ষার্থী পরিচয়পত্র' : 'STUDENT IDENTITY CARD'}
              </p>
            </div>

            {/* Student Info */}
            <div className="flex gap-3.5 items-center">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.nameEn}
                  className="w-16 h-20 rounded-lg object-cover border border-[var(--border)] shadow-xs shrink-0"
                />
              ) : (
                <div className="w-16 h-20 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center font-bold text-xl text-[var(--brand)] shrink-0">
                  {student.nameEn.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0 text-xs space-y-1">
                <p className="font-bold text-[var(--text-primary)] truncate text-sm">
                  {isBn ? student.nameBn || student.nameEn : student.nameEn}
                </p>
                <p className="text-[var(--text-secondary)]">
                  {isBn ? 'শ্রেণি:' : 'Class:'} <span className="font-medium text-[var(--text-primary)]">{student.class}</span> |{' '}
                  {isBn ? 'শাখা:' : 'Sec:'} <span className="font-medium text-[var(--text-primary)]">{student.section || 'A'}</span>
                </p>
                <p className="text-[var(--text-secondary)]">
                  {isBn ? 'রোল:' : 'Roll:'} <span className="font-medium text-[var(--text-primary)]">{student.roll}</span>
                </p>
                <p className="text-[var(--text-secondary)]">
                  {isBn ? 'আইডি:' : 'ID:'} <span className="font-mono text-[var(--brand)]">{student.id}</span>
                </p>
                {student.bloodGroup && (
                  <p className="text-[var(--text-secondary)]">
                    {isBn ? 'রক্তের গ্রুপ:' : 'Blood Group:'} <span className="font-semibold text-rose-500">{student.bloodGroup}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Footer barcode/qr placeholder */}
            <div className="mt-4 pt-2 border-t border-dashed border-[var(--border)] flex items-center justify-between text-[0.6875rem] text-[var(--text-secondary)]">
              <span>{isBn ? 'সেশন:' : 'Session:'} {student.academicYear || '2025-26'}</span>
              <div className="flex items-center gap-1 text-[var(--brand)] font-mono text-[0.625rem]">
                <QrCode size={12} />
                <span>VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)]"
          >
            {isBn ? 'বাতিল' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90"
          >
            <Printer size={14} />
            <span>{isBn ? 'প্রিন্ট আইডি কার্ড' : 'Print ID Card'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
