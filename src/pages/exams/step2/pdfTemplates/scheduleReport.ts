import type { ExamConfig, ExamRoutine, ExamRoom, ExamSeatPlan, InvigilatorAssignment } from '@/store/examStore'
import type { Subject } from '@/pages/teachers/types'
import type { Teacher } from '@/pages/teachers/types'
import type { ClassInfo } from '@/store/classStore'

interface ScheduleReportParams {
  exam: ExamConfig
  routines: ExamRoutine[]
  rooms: ExamRoom[]
  seatPlans: ExamSeatPlan[]
  invigilators: InvigilatorAssignment[]
  subjects: Subject[]
  teachers: Teacher[]
  classes: ClassInfo[]
  isBn: boolean
  schoolName: string
  schoolNameBn: string
  schoolAddress: string
}

const BRAND = '#4f46e5'
const BRAND_LIGHT = '#eef2ff'

const sectionHeading = (title: string) => `
  <div style="display:flex;align-items:center;gap:8px;margin:0 0 10px 0;padding-bottom:6px;border-bottom:2px solid ${BRAND}">
    <div style="width:4px;height:18px;background:${BRAND};border-radius:2px;flex-shrink:0"></div>
    <h3 style="font-size:13px;font-weight:700;margin:0;color:#1e293b">${title}</h3>
  </div>
`

const tableHead = (cols: string) => `
  <thead>
    <tr style="background:${BRAND}">
      ${cols}
    </tr>
  </thead>
`

const th = (text: string, align = 'left', extra = '') => `
  <th style="padding:7px 10px;text-align:${align};font-weight:600;font-size:10px;color:#fff;border-bottom:2px solid ${BRAND};${extra}">${text}</th>
`

const td = (content: string, align = 'left', extra = '') => `
  <td style="padding:6px 10px;text-align:${align};font-size:10px;border-bottom:1px solid #f1f5f9;${extra}">${content}</td>
`

const zebraRow = (idx: number) => idx % 2 === 0 ? '#fff' : '#f8fafc'

function extractClassNumber(className: string): string {
  const match = className.match(/\d+/)
  return match ? match[0] : className
}

export function generateScheduleReportHTML(params: ScheduleReportParams): string {
  const {
    exam,
    routines,
    rooms,
    seatPlans,
    invigilators,
    subjects,
    teachers,
    classes,
    isBn,
    schoolName,
    schoolNameBn,
    schoolAddress,
  } = params

  const subjectMap = new Map(subjects.map((s) => [s.id, s]))
  const classMap = new Map(classes.map((c) => [extractClassNumber(c.name), c]))

  const EXAM_TYPE_LABELS: Record<string, { en: string; bn: string }> = {
    'semester-1': { en: '1st Semester', bn: '১ম সেমিস্টার' },
    'semester-2': { en: '2nd Semester', bn: '২য় সেমিস্টার' },
    annual: { en: 'Annual', bn: 'বার্ষিক' },
    midterm: { en: 'Mid-term', bn: 'মধ্যবর্তী' },
    final: { en: 'Final', bn: 'চূড়ান্ত' },
    custom: { en: 'Custom', bn: 'কাস্টম' },
  }

  const typeLabel = EXAM_TYPE_LABELS[exam.type] || { en: exam.type, bn: exam.type }

  const activeRooms = rooms.filter((r) => r.isActive)
  const totalCapacity = activeRooms.reduce((sum, r) => sum + r.capacity, 0)
  const assignedSeats = seatPlans.length
  const totalRoutineDays = [...new Set(routines.map((r) => r.date))].length

  let html = ''

  // ─── Header ───
  html += `
    <div style="position:relative;text-align:center;margin-bottom:28px;padding:20px 16px 16px;background:linear-gradient(135deg,${BRAND}08,${BRAND}03);border-radius:10px;border:1px solid ${BRAND}15">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${BRAND};border-radius:10px 10px 0 0"></div>
      <div style="font-size:10px;font-weight:600;color:${BRAND};text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">
        ${isBn ? 'গোপনীয়' : 'CONFIDENTIAL'}
      </div>
      <h1 style="font-size:20px;font-weight:800;margin:0 0 4px 0;color:#1e293b;letter-spacing:-0.5px">
        ${isBn ? schoolNameBn : schoolName}
      </h1>
      <p style="font-size:11px;color:#64748b;margin:0 0 12px 0">${schoolAddress}</p>
      <div style="display:inline-block;padding:8px 24px;background:${BRAND};color:#fff;border-radius:6px">
        <div style="font-size:14px;font-weight:700">${isBn ? 'পরীক্ষার সময়সূচি ও আসন বিন্যাস' : 'Exam Schedule & Seat Plan'}</div>
        <div style="font-size:10px;opacity:0.85;margin-top:2px">${isBn ? 'ধাপ ২: সময়সূচি ও আসন পরিকল্পনা' : 'Step 2: Schedule & Seat Planning'}</div>
      </div>
    </div>
  `

  // ─── Summary Stats ───
  const stats = [
    { value: `${routines.length}`, label: isBn ? 'রুটিন' : 'Routines', color: '#3b82f6', bg: '#eff6ff' },
    { value: `${activeRooms.length}`, label: isBn ? 'কক্ষ' : 'Rooms', color: '#8b5cf6', bg: '#f5f3ff' },
    { value: `${assignedSeats}`, label: isBn ? 'আসন বরাদ্দ' : 'Seats', color: '#10b981', bg: '#ecfdf5' },
    { value: `${invigilators.length}`, label: isBn ? 'নিয়োগকৃত' : 'Invigilators', color: '#f59e0b', bg: '#fffbeb' },
  ]

  html += `
    <div style="display:flex;gap:10px;margin-bottom:24px">
      ${stats.map((s) => `
        <div style="flex:1;padding:14px 10px;background:${s.bg};border-radius:8px;text-align:center;border:1px solid ${s.color}15">
          <div style="font-size:22px;font-weight:800;color:${s.color};line-height:1">${s.value}</div>
          <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">${s.label}</div>
        </div>
      `).join('')}
    </div>
  `

  // ─── Exam Details ───
  const details = [
    [isBn ? 'নাম' : 'Name', isBn ? exam.nameBn : exam.name],
    [isBn ? 'ধরন' : 'Type', isBn ? typeLabel.bn : typeLabel.en],
    [isBn ? 'সেশন' : 'Session', exam.session],
    [isBn ? 'তারিখ' : 'Dates', `${exam.startDate || '-'} ${isBn ? 'থেকে' : 'to'} ${exam.endDate || '-'}`],
    [isBn ? 'মোট দিন' : 'Total Days', `${totalRoutineDays}`],
    [isBn ? 'কক্ষ ক্ষমতা' : 'Room Capacity', `${totalCapacity} ${isBn ? 'জন' : 'seats'}`],
  ]

  html += `
    <div style="margin-bottom:24px">
      ${sectionHeading(isBn ? 'পরীক্ষার বিবরণ' : 'Exam Details')}
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        ${details.map(([label, value], i) => `
          <tr style="background:${zebraRow(i)}">
            <td style="padding:8px 12px;width:140px;font-size:11px;color:#64748b;font-weight:500;border-bottom:1px solid #f1f5f9">${label}</td>
            <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9">${value}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `

  // ─── Routine Schedule ───
  if (routines.length > 0) {
    const routinesByDate = new Map<string, ExamRoutine[]>()
    routines.forEach((r) => {
      const list = routinesByDate.get(r.date) || []
      list.push(r)
      routinesByDate.set(r.date, list)
    })

    const sortedDates = [...routinesByDate.keys()].sort()

    html += `<div style="margin-bottom:24px">${sectionHeading(isBn ? 'পরীক্ষার সময়সূচি' : 'Exam Routine Schedule')}`

    for (const date of sortedDates) {
      const dayRoutines = routinesByDate.get(date) || []
      let dateLabel = date
      try {
        dateLabel = new Date(date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      } catch {}

      html += `
        <div style="margin-bottom:14px">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${BRAND_LIGHT};color:${BRAND};border-radius:4px;font-size:11px;font-weight:700;margin-bottom:8px">
            <span style="width:6px;height:6px;border-radius:50%;background:${BRAND}"></span>
            ${dateLabel}
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            ${tableHead(
              th('#', 'center', 'width:30px') +
              th(isBn ? 'সময়' : 'Time', 'center', 'width:120px') +
              th(isBn ? 'বিষয়' : 'Subject') +
              th(isBn ? 'শ্রেণি' : 'Class', 'center', 'width:60px') +
              th(isBn ? 'সেকশন' : 'Sec', 'center', 'width:50px') +
              th(isBn ? 'কক্ষ' : 'Room', 'center', 'width:80px')
            )}
            <tbody>
              ${dayRoutines
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((r, i) => {
                  const sub = subjectMap.get(r.subjectId)
                  return `
                    <tr style="background:${zebraRow(i)}">
                      ${td(`${i + 1}`, 'center', 'color:#94a3b8;font-weight:500')}
                      ${td(`${r.startTime} – ${r.endTime}`, 'center', 'font-weight:600;white-space:nowrap')}
                      ${td((isBn ? sub?.nameBn || sub?.name : sub?.name) || r.subjectId, 'left', 'font-weight:600')}
                      ${td(r.classId, 'center')}
                      ${td(r.sectionId || '-', 'center')}
                      ${td(r.roomNo || '-', 'center')}
                    </tr>
                  `
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `
    }

    html += `</div>`
  }

  // ─── Room Details ───
  if (activeRooms.length > 0) {
    html += `
      <div style="margin-bottom:24px">
        ${sectionHeading(isBn ? 'কক্ষের বিবরণ' : 'Room Details')}
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          ${tableHead(
            th('#', 'center', 'width:30px') +
            th(isBn ? 'কক্ষ নং' : 'Room No') +
            th(isBn ? 'নাম' : 'Name') +
            th(isBn ? 'বিল্ডিং' : 'Building') +
            th(isBn ? 'তলা' : 'Floor', 'center', 'width:60px') +
            th(isBn ? 'ক্ষমতা' : 'Capacity', 'center', 'width:70px') +
            th(isBn ? 'বরাদ্দ' : 'Assigned', 'center', 'width:70px')
          )}
          <tbody>
            ${activeRooms
              .map((room, i) => {
                const assigned = seatPlans.filter((sp) => sp.roomId === room.id).length
                const utilPct = room.capacity > 0 ? Math.round((assigned / room.capacity) * 100) : 0
                return `
                  <tr style="background:${zebraRow(i)}">
                    ${td(`${i + 1}`, 'center', 'color:#94a3b8;font-weight:500')}
                    ${td(room.roomNo, 'left', 'font-weight:700')}
                    ${td(room.roomName)}
                    ${td(room.building || '-')}
                    ${td(room.floor || '-', 'center')}
                    ${td(`${room.capacity}`, 'center')}
                    ${td(`<span style="color:${assigned > 0 ? '#10b981' : '#94a3b8'};font-weight:600">${assigned}</span> <span style="font-size:8px;color:#94a3b8">(${utilPct}%)</span>`, 'center')}
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `
  }

  // ─── Invigilator Assignments ───
  if (invigilators.length > 0) {
    const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]))

    html += `
      <div style="margin-bottom:24px">
        ${sectionHeading(isBn ? 'তত্ত্বাবধায়ক নিয়োগ' : 'Invigilator Assignments')}
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          ${tableHead(
            th('#', 'center', 'width:30px') +
            th(isBn ? 'শিক্ষক' : 'Teacher') +
            th(isBn ? 'তারিখ' : 'Date', 'center', 'width:100px') +
            th(isBn ? 'শিফট' : 'Shift', 'center', 'width:80px') +
            th(isBn ? 'ধরন' : 'Type', 'center', 'width:70px') +
            th(isBn ? 'বরাদ্দ' : 'Assignment')
          )}
          <tbody>
            ${invigilators
              .map((inv, i) => {
                const teacher = teacherMap.get(inv.teacherId)
                const teacherName = teacher ? (isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn) : inv.teacherId
                const shiftLabel = inv.shift === 'morning' ? (isBn ? 'সকাল' : 'Morning') : (isBn ? 'বিকাল' : 'Afternoon')
                const typeLabelStr = inv.assignType === 'room' ? (isBn ? 'কক্ষ' : 'Room') : (isBn ? 'শ্রেণি' : 'Class')
                const assignment = inv.assignType === 'room'
                  ? (activeRooms.find((r) => r.id === inv.roomId)?.roomNo || inv.roomId)
                  : inv.classSection
                let dateLabel = inv.date
                try {
                  dateLabel = new Date(inv.date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' })
                } catch {}
                return `
                  <tr style="background:${zebraRow(i)}">
                    ${td(`${i + 1}`, 'center', 'color:#94a3b8;font-weight:500')}
                    ${td(teacherName, 'left', 'font-weight:600')}
                    ${td(dateLabel, 'center')}
                    ${td(shiftLabel, 'center')}
                    ${td(`<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:600;background:${inv.assignType === 'room' ? '#f5f3ff' : '#eff6ff'};color:${inv.assignType === 'room' ? '#7c3aed' : '#2563eb'}">${typeLabelStr}</span>`, 'center')}
                    ${td(assignment, 'left', 'font-weight:600')}
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `
  }

  // ─── Seat Plan Summary ───
  if (seatPlans.length > 0) {
    const byClass = new Map<string, typeof seatPlans>()
    seatPlans.forEach((sp) => {
      const list = byClass.get(sp.classId) || []
      list.push(sp)
      byClass.set(sp.classId, list)
    })

    html += `<div style="margin-bottom:24px">${sectionHeading(isBn ? 'আসন পরিকল্পনা সারসংক্ষেপ' : 'Seat Plan Summary')}`

    for (const [classId, plans] of byClass) {
      const cls = classMap.get(classId)
      const bySection = new Map<string, typeof plans>()
      plans.forEach((p) => {
        const list = bySection.get(p.sectionId) || []
        list.push(p)
        bySection.set(p.sectionId, list)
      })

      html += `
        <div style="margin-bottom:14px">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:#f5f3ff;color:#7c3aed;border-radius:4px;font-size:11px;font-weight:700;margin-bottom:8px">
            <span style="width:6px;height:6px;border-radius:50%;background:#7c3aed"></span>
            ${cls?.nameBn || cls?.name || classId}
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            ${tableHead(
              th(isBn ? 'সেকশন' : 'Section') +
              th(isBn ? 'শিক্ষার্থী' : 'Students', 'center', 'width:80px') +
              th(isBn ? 'কক্ষ' : 'Room') +
              th(isBn ? 'আসন পরিসীমা' : 'Seat Range', 'center', 'width:100px')
            )}
            <tbody>
              ${[...bySection.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([sectionId, sectionPlans], i) => {
                  const roomIds = [...new Set(sectionPlans.map((p) => p.roomId))]
                  const roomNames = roomIds.map((rid) => activeRooms.find((r) => r.id === rid)?.roomNo || rid).join(', ')
                  const seatMin = Math.min(...sectionPlans.map((p) => p.seatNo))
                  const seatMax = Math.max(...sectionPlans.map((p) => p.seatNo))
                  return `
                    <tr style="background:${zebraRow(i)}">
                      ${td(sectionId, 'left', 'font-weight:600')}
                      ${td(`${sectionPlans.length}`, 'center')}
                      ${td(roomNames || '-')}
                      ${td(seatMin === seatMax ? `${seatMin}` : `${seatMin} – ${seatMax}`, 'center', 'font-weight:600')}
                    </tr>
                  `
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `
    }

    html += `</div>`
  }

  // ─── Footer ───
  html += `
    <div style="margin-top:28px;padding-top:12px;border-top:2px solid ${BRAND};display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#94a3b8">
      <div style="display:flex;align-items:center;gap:6px">
        <div style="width:6px;height:6px;border-radius:50%;background:${BRAND}"></div>
        ${isBn ? 'তৈরি' : 'Generated'}: ${new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div style="font-weight:600;color:#64748b">${isBn ? schoolNameBn : schoolName}</div>
    </div>
  `

  return html
}
