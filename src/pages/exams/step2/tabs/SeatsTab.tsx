import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { LayoutGrid, Download, X } from 'lucide-react'
import { useExamStore } from '@/store/examStore'
import { sectionCls, sectionTitleCls, selectCls, btnPrimary } from '@/lib/styles'

interface Props {
  isBn: boolean
  selectedExamId: string
  selectedExam: any
  students: any[]
  rooms: any[]
  seatPlans: any[]
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  addSeatPlan: (sp: any) => void
  removeSeatPlan: (id: string) => void
}

export default React.memo(function SeatsTab({
  isBn,
  selectedExamId,
  selectedExam,
  students,
  rooms,
  seatPlans,
  classOptions,
  sectionsMap,
  addSeatPlan,
  removeSeatPlan,
}: Props) {
  const [seatClassId, setSeatClassId] = useState('')
  const [seatSectionId, setSeatSectionId] = useState('')
  const [assignRoomStudentId, setAssignRoomStudentId] = useState('')
  const [assignRoomId, setAssignRoomId] = useState('')
  const routines = useExamStore((s) => s.routines)

  const sectionStudents = useMemo(() => {
    if (!seatClassId || !seatSectionId) return []
    return students.filter((s) => s.status === 'approved' && s.active !== false && s.class === seatClassId && s.section === seatSectionId)
  }, [students, seatClassId, seatSectionId])

  const seatPlanByStudent = useMemo(() => {
    const map = new Map<string, any>()
    for (const sp of seatPlans) map.set(sp.studentId, sp)
    return map
  }, [seatPlans])

  const roomMap = useMemo(() => {
    const map = new Map<string, any>()
    for (const r of rooms) map.set(r.id, r)
    return map
  }, [rooms])

  const handleAutoSeat = () => {
    if (!selectedExamId || !seatClassId || !seatSectionId) return
    const sectionStu = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === seatClassId && s.section === seatSectionId)
    if (sectionStu.length === 0) return
    const existing = seatPlans.filter((sp) => sp.classId === seatClassId && sp.sectionId === seatSectionId)
    for (const sp of existing) removeSeatPlan(sp.id)
    const routine = routines.find((r) => r.examId === selectedExamId && r.classId === seatClassId && r.sectionId === seatSectionId)
    const matchedRoom = routine ? rooms.find((rm) => rm.roomNo === routine.roomNo && rm.isActive) : null
    let seatNo = 1
    for (const student of sectionStu) {
      addSeatPlan({
        examId: selectedExamId,
        roomId: matchedRoom?.id || '',
        studentId: student.id,
        classId: seatClassId,
        sectionId: seatSectionId,
        seatNo,
        roll: student.roll || String(seatNo),
      })
      seatNo++
    }
  }

  const handleAssignSingleSeat = (studentId: string) => {
    if (!selectedExamId || !seatClassId || !seatSectionId || !assignRoomId) return
    const existing = seatPlans.find((sp) => sp.studentId === studentId)
    if (existing) removeSeatPlan(existing.id)
    const roomSeats = seatPlans.filter((sp) => sp.roomId === assignRoomId)
    const nextSeatNo = roomSeats.length > 0 ? Math.max(...roomSeats.map((s) => s.seatNo)) + 1 : 1
    const student = students.find((s) => s.id === studentId)
    addSeatPlan({
      examId: selectedExamId,
      roomId: assignRoomId,
      studentId,
      classId: seatClassId,
      sectionId: seatSectionId,
      seatNo: nextSeatNo,
      roll: student?.roll || String(nextSeatNo),
    })
    setAssignRoomStudentId('')
    setAssignRoomId('')
  }

  const downloadSeatPlanPDF = () => {
    if (!selectedExamId || !seatClassId || !seatSectionId) return
    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''
    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#4f46e5'
    const plans = seatPlans.filter((sp) => sp.classId === seatClassId && sp.sectionId === seatSectionId).sort((a, b) => a.seatNo - b.seatNo)
    if (plans.length === 0) return
    const CARDS_PER_PAGE = 20
    const totalPages = Math.ceil(plans.length / CARDS_PER_PAGE)
    let pagesHTML = ''
    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * CARDS_PER_PAGE
      const pagePlans = plans.slice(startIdx, startIdx + CARDS_PER_PAGE)
      const cards = pagePlans.map((sp) => {
        const student = students.find((s) => s.id === sp.studentId)
        const room = roomMap.get(sp.roomId)
        const initials = (student?.nameEn || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        const photoHTML = student?.photo
          ? `<img src="${student.photo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid ${brandColor}"/>`
          : `<div style="width:64px;height:64px;border-radius:50%;background:${brandColor}15;color:${brandColor};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;border:2px solid ${brandColor}">${initials}</div>`
        const seatRoomHTML = sp.roomId
          ? `<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0">
              <div style="background:${brandColor};color:#fff;border-radius:8px;padding:4px 12px;text-align:center">
                <div style="font-size:8px;opacity:0.8">${isBn ? 'আসন নং' : 'SEAT'}</div>
                <div style="font-size:16px;font-weight:700;line-height:1">${sp.seatNo}</div>
              </div>
              <div style="background:#ccfbf1;color:#0d9488;border-radius:8px;padding:4px 12px;text-align:center;border:1px solid #99f6e4">
                <div style="font-size:8px;opacity:0.8">${isBn ? 'কক্ষ' : 'ROOM'}</div>
                <div style="font-size:14px;font-weight:700;line-height:1">${room?.roomNo || '-'}</div>
              </div>
            </div>` : ''
        const today = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        return `<div style="width:180px;border:2px solid ${brandColor};border-radius:12px;overflow:hidden;page-break-inside:avoid;background:#fff">
          <div style="background:${brandColor};color:#fff;text-align:center;padding:8px">
            <div style="font-size:9px;font-weight:700;letter-spacing:1px">${isBn ? 'আসন পরিকল্পনা' : 'SEAT PLAN'}</div>
            <div style="font-size:8px;opacity:0.8;margin-top:2px">${isBn ? 'সানরাইজ একাডেমি' : 'Sunrise Academy'}</div>
          </div>
          <div style="padding:12px;text-align:center">
            <div style="display:flex;justify-content:center;margin-bottom:8px">${photoHTML}</div>
            <div style="font-size:13px;font-weight:700;color:#1e293b;line-height:1.2;margin-bottom:4px">${student?.nameEn || '-'}</div>
            <div style="font-size:10px;color:#64748b;margin-bottom:2px">
              ${isBn ? 'শ্রেণি' : 'Class'}: <b>${seatClassId}</b> ${isBn ? 'সেকশন' : 'Sec'}: <b>${seatSectionId}</b>
            </div>
            <div style="font-size:10px;color:#64748b;margin-bottom:8px">${isBn ? 'রোল' : 'Roll'}: <b>${sp.roll}</b></div>
            ${seatRoomHTML}
            <div style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:8px">
              <div style="font-size:10px;font-weight:600;color:${brandColor}">${examName}</div>
              <div style="font-size:8px;color:#94a3b8;margin-top:2px">${today}</div>
            </div>
          </div>
        </div>`
      }).join('')
      pagesHTML += `<div class="page"><div class="header"><h1>${examName}</h1><h2>${isBn ? 'আসন পরিকল্পনা' : 'Seat Plan'} — ${seatClassId} ${isBn ? 'শ্রেণি' : 'Class'} ${seatSectionId} ${isBn ? 'সেকশন' : 'Section'}</h2><div class="info">${isBn ? 'মোট শিক্ষার্থী' : 'Total Students'}: ${plans.length} ${isBn ? 'জন' : ''} ${totalPages > 1 ? `| ${isBn ? 'পৃষ্ঠা' : 'Page'} ${page + 1}/${totalPages}` : ''}</div></div><div class="cards-grid">${cards}</div><div class="footer">${isBn ? 'তারিখ' : 'Date'}: ${new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US')} | ${isBn ? 'স্কুল' : 'School'}: ${isBn ? 'এডুটেক স্কুল' : 'EduTech School'}</div></div>`
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${examName} - Seat Plan</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4 portrait;margin:10mm}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;background:#fff;font-size:10px}.page{page-break-after:always;padding:15px}.page:last-child{page-break-after:auto}.header{text-align:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid ${brandColor}}h1{font-size:16px;color:${brandColor};margin-bottom:2px}h2{font-size:11px;color:#64748b;font-weight:400;margin-top:2px}.info{font-size:10px;color:#94a3b8;margin-top:4px}.cards-grid{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}.footer{margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0;text-align:center;font-size:8px;color:#94a3b8}@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{padding:0;margin:0}@page{size:A4 portrait;margin:8mm}.page{padding:10px}}</style>
    </head><body>${pagesHTML}</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${examName.replace(/\s+/g, '_')}_Seat_Plan.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className={sectionCls}>
        <div className={sectionTitleCls}>
          <LayoutGrid size={15} className="text-[var(--brand)]" />
          {isBn ? 'আসন বরাদ্দ' : 'Seat Assignment'}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
            <select value={seatClassId} onChange={(e) => { setSeatClassId(e.target.value); setSeatSectionId('') }} className={`${selectCls} w-full`}>
              <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
              {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
            <select value={seatSectionId} onChange={(e) => setSeatSectionId(e.target.value)} className={`${selectCls} w-full`} disabled={!seatClassId}>
              <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
              {(sectionsMap[seatClassId] || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleAutoSeat} disabled={!seatClassId || !seatSectionId || !selectedExamId} className={`${btnPrimary} text-[0.6875rem] ${!seatClassId || !seatSectionId || !selectedExamId ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <LayoutGrid size={13} />
              {isBn ? 'অটো বরাদ্দ' : 'Auto Assign'}
            </button>
            {seatClassId && seatSectionId && seatPlans.some((sp) => sp.classId === seatClassId && sp.sectionId === seatSectionId) && (
              <button onClick={downloadSeatPlanPDF} className="px-3 py-2 rounded-lg bg-[var(--teal-light)] border border-[var(--teal)]/20 text-[var(--teal)] text-[0.6875rem] font-medium cursor-pointer hover:shadow-sm flex items-center gap-1.5">
                <Download size={13} />
                {isBn ? 'আসন পরিকল্পনা ডাউনলোড' : 'Download Seat Plan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {seatClassId && seatSectionId ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sectionStudents.map((student) => {
            const seatPlan = seatPlanByStudent.get(student.id)
            const room = seatPlan ? roomMap.get(seatPlan.roomId) : null
            const isAssigned = !!seatPlan
            const initials = student.nameEn.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={student.id} className="relative">
                <div className={`relative rounded-xl border-2 overflow-hidden transition-all ${isAssigned ? 'border-[var(--brand)] shadow-md' : 'border-dashed border-[var(--border)] opacity-60'}`}>
                  <div className="bg-[var(--brand)] text-white text-center py-2 px-3">
                    <div className="text-[0.5625rem] font-bold tracking-widest uppercase">{isBn ? 'আসন পরিকল্পনা' : 'SEAT PLAN'}</div>
                    <div className="text-[0.5rem] opacity-80 mt-0.5">{isBn ? 'সানরাইজ একাডেমি' : 'Sunrise Academy'}</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 text-center">
                    <div className="flex justify-center mb-2">
                      {student.photo ? (
                        <img src={student.photo} alt={student.nameEn} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--brand)]" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)] text-[1.125rem] font-bold border-2 border-[var(--brand)]">{initials}</div>
                      )}
                    </div>
                    <div className="text-[0.8125rem] font-bold text-[var(--text-primary)] leading-tight mb-1">{student.nameEn}</div>
                    <div className="space-y-0.5 mb-2">
                      <div className="text-[0.625rem] text-[var(--text-secondary)]">
                        {isBn ? 'শ্রেণি' : 'Class'}: <span className="font-semibold text-[var(--text-primary)]">{student.class}</span>
                        {' '}{isBn ? 'সেকশন' : 'Sec'}: <span className="font-semibold text-[var(--text-primary)]">{student.section}</span>
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-secondary)]">
                        {isBn ? 'রোল' : 'Roll'}: <span className="font-semibold text-[var(--text-primary)]">{student.roll || '-'}</span>
                      </div>
                    </div>
                    {isAssigned && (
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="bg-[var(--brand)] text-white rounded-lg px-3 py-1.5 text-center">
                          <div className="text-[0.5rem] opacity-80">{isBn ? 'আসন নং' : 'SEAT'}</div>
                          <div className="text-[1rem] font-bold leading-none">{seatPlan.seatNo}</div>
                        </div>
                        <div className="bg-[var(--teal-light)] text-[var(--teal)] rounded-lg px-3 py-1.5 text-center border border-[var(--teal)]/20">
                          <div className="text-[0.5rem] opacity-80">{isBn ? 'কক্ষ' : 'ROOM'}</div>
                          <div className="text-[0.875rem] font-bold leading-none">{room?.roomNo || '-'}</div>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-[var(--border)] pt-2">
                      <div className="text-[0.625rem] font-semibold text-[var(--brand)]">
                        {selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''}
                      </div>
                      <div className="text-[0.5rem] text-[var(--text-muted)] mt-0.5">
                        {new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={`${sectionCls} text-center py-10`}>
          <LayoutGrid size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
          <p className="text-[0.8125rem] text-[var(--text-muted)]">
            {isBn ? 'শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select class & section to view students'}
          </p>
        </div>
      )}

      {assignRoomStudentId && createPortal(
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '20rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'কক্ষ বরাদ্দ' : 'Assign Room'}</h3>
              <button onClick={() => setAssignRoomStudentId('')} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-[0.75rem] text-[var(--text-secondary)]">
                {sectionStudents.find((s) => s.id === assignRoomStudentId)?.nameEn}
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                <select value={assignRoomId} onChange={(e) => setAssignRoomId(e.target.value)} className={`${selectCls} w-full`}>
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {rooms.filter((r) => r.isActive).map((r) => <option key={r.id} value={r.id}>{r.roomNo} ({r.capacity} {isBn ? 'আসন' : 'seats'})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setAssignRoomStudentId('')} className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer">
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={() => handleAssignSingleSeat(assignRoomStudentId)} disabled={!assignRoomId} className={`${btnPrimary} text-[0.75rem] ${!assignRoomId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isBn ? 'বরাদ্দ করুন' : 'Assign'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
})
