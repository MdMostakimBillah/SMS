import React from 'react'
import { X, Printer, QrCode, School, ShieldCheck } from 'lucide-react'
import type { PortalChild } from '../types'
import { useClassStore } from '@/store/classStore'
import { openPrintWindow } from '@/lib/pdf'

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
  if (isOpen === false) return null
  const institution = useClassStore((s) => s.institution)

  const handlePrint = () => {
    const css = `
      @page { size: 85.6mm 54mm; margin: 0; }
      body { font-family: sans-serif; margin: 0; padding: 10px; background: #fff; color: #1e293b; }
      .card { border: 1.5px solid #2563eb; border-radius: 8px; padding: 12px; height: 100%; box-sizing: border-box; position: relative; }
      .hdr { text-align: center; border-bottom: 1.5px solid #2563eb; padding-bottom: 6px; margin-bottom: 8px; }
      .sname { font-size: 13px; font-weight: bold; color: #1e3a8a; }
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
            child.photo
              ? `<img src="${child.photo}" class="photo" alt="" />`
              : `<div class="photo" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:bold">${child.nameEn.charAt(0)}</div>`
          }
          <div class="info">
            <div><strong>${isBn ? 'নাম:' : 'Name:'}</strong> ${isBn ? child.nameBn || child.nameEn : child.nameEn}</div>
            <div><strong>${isBn ? 'শ্রেণি:' : 'Class:'}</strong> ${child.class} (${isBn ? 'শাখা:' : 'Sec:'} ${child.section})</div>
            <div><strong>${isBn ? 'রোল:' : 'Roll:'}</strong> ${child.roll} &nbsp; <strong>${isBn ? 'রক্ত:' : 'Blood:'}</strong> ${child.bloodGroup}</div>
            <div><strong>${isBn ? 'আইডি:' : 'ID:'}</strong> ${child.id}</div>
            <div><strong>${isBn ? 'অভিভাবক:' : 'Guardian:'}</strong> ${child.guardianPhone}</div>
          </div>
        </div>
        <div class="ftr">
          <div>${isBn ? 'বৈধতা সেশন:' : 'Session:'} ${child.academicYear} · ${institution.phone || ''}</div>
        </div>
      </div>
    `
    openPrintWindow(child.nameEn + ' ID Card', html, { css })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <School size={18} className="text-[var(--brand)]" />
            <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'ডিজিটাল শিক্ষার্থী আইডি কার্ড' : 'Digital Student ID Card'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Digital ID Card Preview */}
        <div className="relative rounded-2xl border-2 border-[var(--brand)]/40 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] p-5 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="text-center pb-3 border-b border-[var(--brand)]/20 mb-4">
            <div className="text-[1rem] font-extrabold text-[var(--brand)] tracking-tight">
              {institution.name || 'EduTech Smart School'}
            </div>
            <div className="text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
              {isBn ? 'শিক্ষার্থী পরিচয়পত্র · ২০২৬' : 'STUDENT IDENTITY CARD · 2026'}
            </div>
          </div>

          {/* Card Body */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {child.photo ? (
                <img
                  src={child.photo}
                  alt={child.nameEn}
                  className="w-20 h-24 rounded-xl object-cover border-2 border-[var(--brand)] shadow-xs"
                />
              ) : (
                <div className="w-20 h-24 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center font-bold text-2xl border-2 border-[var(--brand)]">
                  {child.nameEn.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[0.5rem] font-bold">
                PROV
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1 text-[0.75rem]">
              <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] truncate">
                {isBn ? child.nameBn || child.nameEn : child.nameEn}
              </div>
              <div className="text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{isBn ? 'শ্রেণি:' : 'Class:'}</span> {child.class} ({isBn ? 'শাখা:' : 'Sec:'} {child.section})
              </div>
              <div className="text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{isBn ? 'রোল:' : 'Roll:'}</span> {child.roll} &nbsp;·&nbsp;
                <span className="font-semibold text-[var(--text-primary)]">{isBn ? 'রক্ত:' : 'Blood:'}</span> {child.bloodGroup}
              </div>
              <div className="text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{isBn ? 'শিক্ষার্থী আইডি:' : 'ID:'}</span> {child.id}
              </div>
              <div className="text-[var(--text-muted)] text-[0.6875rem]">
                <span className="font-medium text-[var(--text-secondary)]">{isBn ? 'জরুরি যোগাযোগ:' : 'Emergency:'}</span> {child.emergencyContact}
              </div>
            </div>
          </div>

          {/* Card Footer with QR */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>{isBn ? 'সেশন: ২০২৬ · অনুমোদিত' : 'Session: 2026 · Verified'}</span>
            </div>
            <div className="flex items-center gap-1">
              <QrCode size={22} className="text-[var(--text-primary)] opacity-80" />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-95 cursor-pointer border-none"
          >
            <Printer size={15} />
            {isBn ? 'প্রিন্ট / ডাউনলোড' : 'Print / Download'}
          </button>
        </div>
      </div>
    </div>
  )
})
