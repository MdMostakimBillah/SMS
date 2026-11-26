import type { ExamConfig, SubjectMarkConfig, ExamRoutine } from '@/store/examStore'
import type { Subject } from '@/pages/teachers/types'
import { escapeHtml } from '@/lib/sanitize'

interface Student {
  id: string
  nameEn: string
  nameBn?: string
  photo?: string
  class: string
  section: string
  roll?: string
  fatherNameEn?: string
  fatherNameBn?: string
  motherNameEn?: string
  motherNameBn?: string
  dob?: string
  academicYear?: string
}

interface Institution {
  name: string
  nameBn?: string
  address?: string
  addressBn?: string
  phone?: string
  email?: string
  eiin?: string
  brandName?: string
  motto?: string
  currentSession?: string
  logo?: string
}

function formatDob(rawDob?: string, isBn?: boolean): string {
  if (!rawDob) return '—'
  const d = new Date(rawDob)
  if (isNaN(d.getTime())) return rawDob
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']
  const day = String(d.getDate()).padStart(2, '0')
  const m = isBn ? monthsBn[d.getMonth()] : months[d.getMonth()]
  const y = d.getFullYear()
  return `${day} ${m} ${y}`
}

export function generateAdmitCardHTML(
  students: Student[],
  exam: ExamConfig,
  inst: Institution,
  subjectMap: Map<string, Subject>,
  subjectMarkConfigs: SubjectMarkConfig[],
  routines: ExamRoutine[],
  qrUrls: Record<string, string>,
  isBn: boolean,
  _brandColor: string
): string {
  const fontStack = "'Noto Sans', 'Noto Sans Bengali', Arial, 'Segoe UI', -apple-system, sans-serif"
  const examRoutines = routines.filter((r) => r.examId === exam.id)
  const examSubjectConfigs = subjectMarkConfigs.filter((c) => c.examId === exam.id)
  const examDateRange = `${escapeHtml(exam.startDate)} – ${escapeHtml(exam.endDate)}`
  const institutionName = (isBn ? inst.nameBn || inst.name : inst.name) || (isBn ? 'এডুটেক স্কুল' : 'EduTech School')
  const examTitle = isBn ? exam.nameBn || exam.name : exam.name
  const boardTitle = inst.brandName
    ? inst.brandName.toUpperCase()
    : isBn
    ? 'বাংলাদেশ মাদ্রাসা অ্যাসোসিয়েশন'
    : 'BANGLADESH MADRASAH ASSOCIATION'

  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const formattedTimestamp = `${day}.${month}.${year} ${hours}:${minutes}`

  const cardsHTML = students.map((student) => {
    const studentRoutines = examRoutines
      .filter((r) => r.classId === student.class && (!student.section || r.sectionId === student.section))
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''))

    const classSubjectConfigs = examSubjectConfigs.filter((c) => c.classId === student.class)

    interface SubjectItem {
      code: string
      name: string
      time: string
    }

    const items: SubjectItem[] = []
    if (studentRoutines.length > 0) {
      studentRoutines.forEach((r, idx) => {
        const subject = subjectMap.get(r.subjectId)
        const name = subject ? (isBn ? subject.nameBn || subject.name : subject.name) : r.subjectId
        const timeStr = r.startTime && r.endTime ? `${r.startTime}–${r.endTime}` : (r.date || (isBn ? 'নির্ধারিত হয়নি' : 'TBD'))
        items.push({
          code: String(101 + idx),
          name,
          time: timeStr,
        })
      })
    } else if (classSubjectConfigs.length > 0) {
      classSubjectConfigs.forEach((cfg, idx) => {
        const subject = subjectMap.get(cfg.subjectId)
        const name = subject ? (isBn ? subject.nameBn || subject.name : subject.name) : cfg.subjectId
        items.push({
          code: String(101 + idx),
          name,
          time: isBn ? 'তারিখ নির্ধারিত হয়নি' : 'To be scheduled',
        })
      })
    }

    let subjectTableRows = ''
    if (items.length > 0) {
      for (let i = 0; i < items.length; i += 2) {
        const left = items[i]
        const right = items[i + 1]

        subjectTableRows += `<tr>
          <td style="padding:5px 6px;border:1px solid #1e293b;text-align:center;font-weight:700;font-size:9.5px;background:#f8fafc;width:7%;font-family:${fontStack}">${escapeHtml(left.code)}</td>
          <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:600;color:#0f172a;font-size:9.5px;width:25%;font-family:${fontStack}">${escapeHtml(left.name)}</td>
          <td style="padding:5px 6px;border:1px solid #1e293b;text-align:center;color:#334155;font-size:9px;width:18%;font-family:${fontStack}">${escapeHtml(left.time)}</td>
          ${right ? `
          <td style="padding:5px 6px;border:1px solid #1e293b;text-align:center;font-weight:700;font-size:9.5px;background:#f8fafc;width:7%;font-family:${fontStack}">${escapeHtml(right.code)}</td>
          <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:600;color:#0f172a;font-size:9.5px;width:25%;font-family:${fontStack}">${escapeHtml(right.name)}</td>
          <td style="padding:5px 6px;border:1px solid #1e293b;text-align:center;color:#334155;font-size:9px;width:18%;font-family:${fontStack}">${escapeHtml(right.time)}</td>
          ` : `
          <td style="padding:5px 6px;border:1px solid #1e293b;width:7%;background:#f8fafc;font-family:${fontStack}">&nbsp;</td>
          <td style="padding:5px 8px;border:1px solid #1e293b;width:25%;font-family:${fontStack}">&nbsp;</td>
          <td style="padding:5px 6px;border:1px solid #1e293b;width:18%;font-family:${fontStack}">&nbsp;</td>
          `}
        </tr>`
      }
    } else {
      subjectTableRows = `<tr><td colspan="6" style="padding:10px;text-align:center;color:#64748b;border:1px solid #1e293b;font-style:italic;font-size:9.5px;font-family:${fontStack}">${isBn ? 'কোন বিষয় নির্ধারিত হয়নি' : 'No subjects scheduled'}</td></tr>`
    }

    const studentName = isBn ? (student.nameBn || student.nameEn) : student.nameEn
    const fatherName = isBn ? (student.fatherNameBn || student.fatherNameEn || '—') : (student.fatherNameEn || student.fatherNameBn || '—')
    const motherName = isBn ? (student.motherNameBn || student.motherNameEn || '—') : (student.motherNameEn || student.motherNameBn || '—')
    const rollNo = student.roll || student.id.slice(-6)
    const session = exam.session || student.academicYear || inst.currentSession || `${year}-${year + 1}`
    const dobFormatted = formatDob(student.dob, isBn)
    const examCode = exam.id ? exam.id.toUpperCase().slice(-6) : 'SE-26'
    const instCode = inst.eiin ? `INST-${inst.eiin}` : `INST-${(inst.name || 'SCH').slice(0, 6).toUpperCase()}`
    const instCodeAndName = `${instCode}-${institutionName}`
    const centerRoom = studentRoutines.find((r) => r.roomNo)?.roomNo
    const centerCodeAndName = centerRoom
      ? `(Room: ${centerRoom}) ${institutionName}`
      : `(001) ${institutionName} - Center`
    const qrCodeUrl = qrUrls[student.id] || ''

    return `<div class="admit-card" style="width:100%;max-width:194mm;margin:0 auto 16px auto;padding:16px 20px;border:1.5px solid #1e293b;background:#ffffff;position:relative;box-sizing:border-box;page-break-after:always;page-break-inside:avoid;font-family:${fontStack};font-style:normal">
      <!-- Watermark Emblem -->
      <svg width="260" height="260" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.06;pointer-events:none;z-index:0">
        <circle cx="100" cy="100" r="95" stroke="#1e293b" stroke-width="3" stroke-dasharray="6 3"/>
        <circle cx="100" cy="100" r="86" stroke="#1e293b" stroke-width="1.5"/>
        <circle cx="100" cy="100" r="62" stroke="#1e293b" stroke-width="1.5"/>
        <path d="M70 120 L100 85 L130 120 Z" stroke="#1e293b" stroke-width="2" fill="none"/>
        <path d="M100 85 L100 120" stroke="#1e293b" stroke-width="1.5"/>
        <circle cx="100" cy="72" r="6" stroke="#1e293b" stroke-width="1.5"/>
        <path d="M85 130 C95 135 105 135 115 130" stroke="#1e293b" stroke-width="2"/>
        <text x="100" y="45" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b" font-family="${fontStack}">EDUCATION &amp; EXAMINATION</text>
        <text x="100" y="165" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e293b" font-family="${fontStack}">★ ESTABLISHED ${year} ★</text>
      </svg>

      <!-- Content Layer -->
      <div style="position:relative;z-index:1;font-family:${fontStack};font-style:normal">
        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <!-- Student Photo -->
          <div style="width:75px;height:95px;border:1.5px solid #1e293b;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
            ${student.photo ? `<img src="${escapeHtml(student.photo)}" style="width:100%;height:100%;object-fit:cover" />` : `<span style="font-size:26px;color:#94a3b8">👤</span>`}
          </div>

          <!-- Center Institution & Exam Info -->
          <div style="flex:1;text-align:center;padding:0 8px">
            <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#475569;text-transform:uppercase;font-family:${fontStack}">${escapeHtml(boardTitle)}</div>
            <div style="font-size:16px;font-weight:800;color:#0f172a;margin:3px 0 2px;letter-spacing:0.2px;font-family:${fontStack}">${escapeHtml(institutionName)}</div>
            <div style="font-size:12px;font-weight:700;color:#1e293b;margin:1px 0;font-family:${fontStack}">${escapeHtml(examTitle)}</div>
            <div style="font-size:9.5px;color:#475569;margin-top:1px;font-family:${fontStack}">${escapeHtml(examDateRange)}</div>
            <div style="display:inline-block;border:1.5px solid #0f172a;border-radius:9999px;padding:3px 18px;margin-top:6px;font-size:10px;font-weight:800;letter-spacing:1.5px;color:#0f172a;text-transform:uppercase;font-family:${fontStack}">
              ${isBn ? 'প্রবেশপত্র' : 'ADMIT CARD'}
            </div>
          </div>

          <!-- Top QR Code -->
          <div style="width:75px;height:75px;border:1.5px solid #1e293b;padding:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#fff">
            ${qrCodeUrl ? `<img src="${escapeHtml(qrCodeUrl)}" style="width:100%;height:100%" />` : `<div style="font-size:8px;color:#94a3b8;font-family:${fontStack}">QR</div>`}
          </div>
        </div>

        <!-- Horizontal Blue Divider Line -->
        <div style="width:100%;height:2px;background:#1e3a5f;margin:10px 0 12px"></div>

        <!-- Student & Exam Details Table -->
        <table style="width:100%;border-collapse:collapse;border:1.5px solid #1e293b;font-size:9.5px;margin-bottom:12px;font-family:${fontStack}">
          <tbody>
            <tr>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;width:20%;font-family:${fontStack}">${isBn ? 'পরীক্ষা কোড' : 'Examination Code'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;width:30%;font-family:${fontStack}">${escapeHtml(examCode)}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;width:20%;font-family:${fontStack}">${isBn ? 'রোল নং' : 'Roll No.'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;width:30%;font-family:${fontStack}">${escapeHtml(rollNo)}</td>
            </tr>
            <tr>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'পরীক্ষার্থীর নাম' : 'Name of Examinee'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(studentName)}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'রেজিস্ট্রেশন নং' : 'Registration No.'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(student.id)}</td>
            </tr>
            <tr>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'পিতার নাম' : "Father's Name"}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(fatherName)}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'শিক্ষাবর্ষ' : 'Session'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(session)}</td>
            </tr>
            <tr>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'মাতার নাম' : "Mother's Name"}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(motherName)}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(dobFormatted)}</td>
            </tr>
            <tr>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'শ্রেণি / শাখা' : 'Class / Section'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(student.class)}${student.section ? ` / ${escapeHtml(student.section)}` : ''}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'শ্রেণি রোল' : 'Class Roll'}</td>
              <td style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(student.roll || '—')}</td>
            </tr>
            <tr>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'প্রতিষ্ঠান কোড ও নাম' : 'College Code & Name'}</td>
              <td colspan="3" style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(instCodeAndName)}</td>
            </tr>
            <tr>
              <td style="padding:5px 8px;border:1px solid #1e293b;background:#fafafa;font-weight:600;color:#1e293b;font-family:${fontStack}">${isBn ? 'কেন্দ্র কোড ও নাম' : 'Center Code & Name'}</td>
              <td colspan="3" style="padding:5px 8px;border:1px solid #1e293b;font-weight:700;color:#0f172a;font-family:${fontStack}">${escapeHtml(centerCodeAndName)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Subject Routine Table -->
        <table style="width:100%;border-collapse:collapse;border:1.5px solid #1e293b;font-size:9.5px;margin-bottom:12px;font-family:${fontStack}">
          <thead>
            <tr>
              <th colspan="6" style="padding:5px 8px;text-align:center;font-size:10px;font-weight:700;background:#f8fafc;border:1px solid #1e293b;color:#0f172a;letter-spacing:0.3px;font-family:${fontStack}">
                ${isBn ? 'বিষয় কোড ও নাম' : 'Subject Code &amp; name'}
              </th>
            </tr>
          </thead>
          <tbody>
            ${subjectTableRows}
          </tbody>
        </table>

        <!-- Signatures Box -->
        <table style="width:100%;border-collapse:collapse;border:1.5px solid #1e293b;margin-bottom:12px;font-family:${fontStack}">
          <tbody>
            <tr>
              <td style="width:50%;border:1px solid #1e293b;padding:10px 14px;text-align:center;vertical-align:bottom">
                <div style="height:32px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:4px">
                  <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 24C16 14 24 10 32 16C36 19 40 24 46 25C52 26 58 14 64 8C68 4 74 12 78 18C82 24 88 22 94 14C98 8 104 12 110 20" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M34 22C44 20 62 26 72 26" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div style="width:65%;height:1px;background:#1e293b;margin:0 auto 4px"></div>
                <div style="font-weight:700;font-size:9.5px;color:#0f172a;font-family:${fontStack}">${isBn ? 'অধ্যক্ষের সিল ও স্বাক্ষর' : 'Seal &amp; Signature of Principal'}</div>
                <div style="font-size:8px;color:#475569;margin-top:2px;font-family:${fontStack}">${escapeHtml(institutionName)}</div>
              </td>
              <td style="width:50%;border:1px solid #1e293b;padding:10px 14px;text-align:center;vertical-align:bottom">
                <div style="height:32px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:4px">
                  <div style="font-size:10px;font-family:${fontStack};color:#1e293b;font-weight:700;letter-spacing:1px;opacity:0.85">CONTROLLER · VERIFIED</div>
                </div>
                <div style="width:65%;height:1px;background:#1e293b;margin:0 auto 4px"></div>
                <div style="font-weight:700;font-size:9.5px;color:#0f172a;font-family:${fontStack}">${isBn ? 'পরীক্ষা নিয়ন্ত্রক' : 'Controller of Examinations'}</div>
                <div style="font-size:8px;color:#475569;margin-top:2px;font-family:${fontStack}">${isBn ? 'ব্যবস্থাপনা কর্তৃপক্ষ' : 'Managing Authority, Examination Board'}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Instructions & Verification QR -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0 2px">
          <!-- Instructions -->
          <div style="flex:1;padding-right:16px">
            <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-bottom:4px;font-family:${fontStack}">
              ${isBn ? 'পরীক্ষার্থীদের জন্য সাধারণ নির্দেশনাবলী :' : 'Instructions to Candidates'}
            </div>
            <ol style="margin:0;padding-left:14px;font-size:8px;color:#334155;line-height:1.45;font-family:${fontStack}">
              ${isBn ? `
              <li>প্রবেশপত্র সহ পরীক্ষার ৩০ মিনিট পূর্বে কেন্দ্রে উপস্থিত হতে হবে।</li>
              <li>ছবিযুক্ত পরিচয়পত্র সাথে রাখা বাধ্যতামূলক।</li>
              <li>কেবলমাত্র নির্ধারিত আসনে বসতে হবে।</li>
              <li>মোবাইল ফোন ও যেকোনো ইলেকট্রনিক ডিভাইস আনা সম্পূর্ণ নিষেধ।</li>
              <li>শুধুমাত্র সরবরাহকৃত উত্তরপত্রেই লিখতে হবে।</li>
              <li>অনুমতি ব্যতীত পরীক্ষার হল ত্যাগ করা যাবে না।</li>
              <li>কোনো প্রকার অসদুপায় অবলম্বন করলে পরীক্ষা বাতিল হবে।</li>
              <li>বহিষ্কৃত পরীক্ষার্থী পুনরায় পরীক্ষায় অংশ নিতে পারবে না।</li>
              <li>পরীক্ষা সংক্রান্ত যাবতীয় বিষয়ে নিয়ন্ত্রকের সিদ্ধান্তই চূড়ান্ত।</li>
              ` : `
              <li>Report 30 minutes early with the admit card.</li>
              <li>Photo ID is mandatory.</li>
              <li>Sit at your allotted seat only.</li>
              <li>Switch off mobile phones and electronic devices.</li>
              <li>Use only the supplied answer sheets.</li>
              <li>Do not leave the hall without permission.</li>
              <li>Malpractice cancels the result.</li>
              <li>Caught candidates are barred from re-sitting.</li>
              <li>The Controller's decision is final.</li>
              `}
            </ol>
          </div>

          <!-- Verification QR & Timestamp -->
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;flex-shrink:0;width:90px">
            <div style="width:64px;height:64px;border:1.5px solid #1e293b;padding:2px;display:flex;align-items:center;justify-content:center;background:#fff">
              ${qrCodeUrl ? `<img src="${escapeHtml(qrCodeUrl)}" style="width:100%;height:100%" />` : `<div style="font-size:8px;color:#94a3b8;font-family:${fontStack}">QR</div>`}
            </div>
            <div style="font-size:7.5px;font-weight:800;letter-spacing:0.5px;color:#0f172a;margin-top:4px;line-height:1.2;text-transform:uppercase;font-family:${fontStack}">
              ${isBn ? 'পরীক্ষা নিয়ন্ত্রক' : 'CONTROLLER OF<br/>EXAMINATIONS'}
            </div>
            <div style="font-size:7px;color:#64748b;margin-top:2px;font-family:${fontStack}">${escapeHtml(formattedTimestamp)}</div>
          </div>
        </div>

        <!-- Bottom ID No -->
        <div style="font-size:9px;font-weight:700;color:#0f172a;margin-top:8px;font-family:${fontStack}">
          ID No: ${escapeHtml(student.id)}
        </div>
      </div>
    </div>`
  }).join('')

  return cardsHTML
}
