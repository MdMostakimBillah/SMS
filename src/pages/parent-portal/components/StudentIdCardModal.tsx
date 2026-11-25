import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, QrCode, School, ShieldCheck } from 'lucide-react'
import QRCode from 'qrcode'
import type { PortalChild } from '../types'
import { useClassStore } from '@/store/classStore'
import { openPrintWindow } from '@/lib/pdf'
import { getPDFBranding, pdfLogoHTML } from '@/lib/pdfBranding'
import { escapeHtml } from '@/lib/sanitize'

interface StudentIdCardModalProps {
  isOpen?: boolean
  child: PortalChild
  onClose: () => void
  isBn: boolean
}

export const StudentIdCardModal = React.memo(function StudentIdCardModal({
  isOpen,
  child,
  onClose,
  isBn,
}: StudentIdCardModalProps) {
  const institution = useClassStore((s) => s.institution)
  const [qrUrl, setQrUrl] = useState<string>('')

  const sessionLabel = child.academicYear || institution.currentSession || String(new Date().getFullYear())
  const instName = (isBn ? institution.nameBn || institution.name : institution.name) || 'EduTech Smart School'
  const isActive = child.status === 'active' || child.status === 'approved' || !child.status

  useEffect(() => {
    if (isOpen === false) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen === false) return
    let active = true
    const payload = [
      `ID:${child.id}`,
      `Name:${child.nameEn}`,
      `Class:${child.class}-${child.section}`,
      `Roll:${child.roll}`,
      `Session:${sessionLabel}`,
    ].join('|')

    QRCode.toDataURL(payload, { width: 88, margin: 1 })
      .then((url) => {
        if (active) setQrUrl(url)
      })
      .catch(() => {
        if (active) setQrUrl('')
      })
    return () => {
      active = false
    }
  }, [isOpen, child.id, child.nameEn, child.class, child.section, child.roll, sessionLabel])

  if (isOpen === false) return null
  if (typeof document === 'undefined') return null

  const handlePrint = () => {
    const brand = getPDFBranding()
    const logoHtml = pdfLogoHTML(brand, 24)
    const css = `
      @page { size: 85.6mm 54mm; margin: 0; }
      body { font-family: 'Inter', 'Noto Sans Bengali', sans-serif; margin: 0; padding: 8px; background: #fff; color: #1e293b; }
      .card { border: 1.5px solid ${brand.brandColor}; border-radius: 8px; padding: 10px; height: 100%; box-sizing: border-box; position: relative; }
      .hdr { display: flex; align-items: center; gap: 6px; border-bottom: 1.5px solid ${brand.brandColor}; padding-bottom: 5px; margin-bottom: 7px; }
      .hdr-txt { flex: 1; text-align: center; }
      .sname { font-size: 12px; font-weight: 700; color: ${brand.brandColor}; }
      .sttl { font-size: 7.5px; text-transform: uppercase; color: #64748b; letter-spacing: 0.8px; }
      .body { display: flex; gap: 9px; align-items: center; }
      .photo { width: 52px; height: 62px; border-radius: 6px; object-fit: cover; border: 1px solid #cbd5e1; }
      .info { font-size: 9px; line-height: 1.45; flex: 1; }
      .info strong { color: #0f172a; }
      .ftr { margin-top: 6px; font-size: 7.5px; color: #64748b; display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 4px; }
    `
    const html = `
      <div class="card">
        <div class="hdr">
          ${logoHtml}
          <div class="hdr-txt">
            <div class="sname">${escapeHtml(instName)}</div>
            <div class="sttl">${isBn ? 'শিক্ষার্থী পরিচয়পত্র' : 'STUDENT IDENTITY CARD'}</div>
          </div>
        </div>
        <div class="body">
          ${
            child.photo
              ? `<img src="${escapeHtml(child.photo)}" class="photo" alt="" />`
              : `<div class="photo" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:bold;color:${brand.brandColor}">${escapeHtml(child.nameEn.charAt(0))}</div>`
          }
          <div class="info">
            <div><strong>${isBn ? 'নাম:' : 'Name:'}</strong> ${escapeHtml(isBn ? child.nameBn || child.nameEn : child.nameEn)}</div>
            <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${escapeHtml(child.class)} (${isBn ? 'শাখা:' : 'Sec:'} ${escapeHtml(child.section || '—')})</div>
            <div><strong>${isBn ? 'রোল:' : 'Roll:'}</strong> ${escapeHtml(child.roll || '—')} &nbsp; <strong>${isBn ? 'রক্ত:' : 'Blood:'}</strong> ${escapeHtml(child.bloodGroup || '—')}</div>
            <div><strong>${isBn ? 'আইডি:' : 'ID:'}</strong> ${escapeHtml(child.id)}</div>
            <div><strong>${isBn ? 'অভিভাবক:' : 'Guardian:'}</strong> ${escapeHtml(child.guardianPhone || '—')}</div>
          </div>
        </div>
        <div class="ftr">
          <span>${isBn ? 'সেশন:' : 'Session:'} ${escapeHtml(sessionLabel)} · ${escapeHtml(institution.phone || '')}</span>
          ${qrUrl ? `<img src="${qrUrl}" style="width:22px;height:22px" alt="QR" />` : ''}
        </div>
      </div>
    `
    openPrintWindow(child.nameEn + ' ID Card', html, { css })
  }

  return createPortal(
    <div
      className="modal-overlay modal-backdrop-animate fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card-animate relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
              <School size={16} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'ডিজিটাল শিক্ষার্থী আইডি কার্ড' : 'Digital Student ID Card'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isBn ? 'কার্ড বন্ধ করুন' : 'Dismiss dialog'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Digital ID Card Preview */}
        <div
          className="relative rounded-2xl border bg-[var(--bg-secondary)] p-5 shadow-xs overflow-hidden"
          style={{ borderColor: 'color-mix(in srgb, var(--brand) 35%, transparent)' }}
        >
          {/* Card Header */}
          <div className="text-center pb-3 border-b border-[var(--border)] mb-4">
            <div className="text-base font-bold text-[var(--brand)] tracking-tight">
              {instName}
            </div>
            <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mt-0.5">
              {isBn ? `শিক্ষার্থী পরিচয়পত্র · ${sessionLabel}` : `STUDENT IDENTITY CARD · ${sessionLabel}`}
            </div>
          </div>

          {/* Card Body */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {child.photo ? (
                <img
                  src={child.photo}
                  alt={child.nameEn}
                  className="w-20 h-24 rounded-xl object-cover border-2 border-[var(--brand)] shadow-xs bg-[var(--surface)]"
                />
              ) : (
                <div className="w-20 h-24 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center font-bold text-2xl border-2 border-[var(--brand)]">
                  {(child.nameEn || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-white text-[0.625rem] font-semibold shadow-xs ${
                  isActive ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                {isActive ? (isBn ? 'সক্রিয়' : 'ACTIVE') : (isBn ? 'নিষ্ক্রিয়' : 'INACTIVE')}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1.5 text-xs">
              <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] truncate">
                {isBn ? child.nameBn || child.nameEn : child.nameEn}
              </div>
              <div className="text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{isBn ? 'শ্রেণি:' : 'Class:'}</span>{' '}
                {child.class} ({isBn ? 'শাখা:' : 'Sec:'} {child.section || '—'})
              </div>
              <div className="text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{isBn ? 'রোল:' : 'Roll:'}</span>{' '}
                {child.roll || '—'} ·{' '}
                <span className="font-medium text-[var(--text-primary)]">{isBn ? 'রক্ত:' : 'Blood:'}</span>{' '}
                {child.bloodGroup || '—'}
              </div>
              <div className="text-[var(--text-secondary)] font-mono text-[0.6875rem]">
                <span className="font-sans font-medium text-[var(--text-primary)]">{isBn ? 'আইডি:' : 'ID:'}</span>{' '}
                {child.id}
              </div>
              <div className="text-[var(--text-secondary)] text-[0.6875rem]">
                <span className="font-medium text-[var(--text-primary)]">{isBn ? 'জরুরি যোগাযোগ:' : 'Emergency:'}</span>{' '}
                {child.emergencyContact || '—'}
              </div>
            </div>
          </div>

          {/* Card Footer with QR */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[0.6875rem] text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>
                {isBn ? `সেশন: ${sessionLabel} · যাচাইকৃত` : `Session: ${sessionLabel} · Verified`}
              </span>
            </div>
            <div className="flex items-center">
              {qrUrl ? (
                <img src={qrUrl} alt="Student QR" className="w-8 h-8 rounded border border-[var(--border)] bg-white p-0.5" />
              ) : (
                <QrCode size={22} className="text-[var(--text-primary)] opacity-80" />
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-9 flex items-center gap-1.5 px-4 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-90 cursor-pointer border-none transition-opacity"
          >
            <Printer size={14} />
            <span>{isBn ? 'প্রিন্ট / ডাউনলোড' : 'Print / Download'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
})
