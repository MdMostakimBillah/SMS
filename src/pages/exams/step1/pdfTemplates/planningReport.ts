import type { ExamConfig, SubjectMarkConfig, GradeScale, OMRConfig } from '@/store/examStore'
import type { Subject } from '@/pages/teachers/types'
import type { ClassInfo } from '@/store/classStore'

interface PlanningReportParams {
  exam: ExamConfig
  subjectMarkConfigs: SubjectMarkConfig[]
  gradeScales: GradeScale[]
  omrConfigs: OMRConfig[]
  subjects: Subject[]
  classes: ClassInfo[]
  completionPct: number
  checklist: { done: boolean; label: string; pct?: number }[]
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

export function generatePlanningReportHTML(params: PlanningReportParams): string {
  const {
    exam,
    subjectMarkConfigs,
    gradeScales,
    omrConfigs,
    subjects,
    classes,
    completionPct,
    checklist,
    isBn,
    schoolName,
    schoolNameBn,
    schoolAddress,
  } = params

  const subjectMap = new Map(subjects.map((s) => [s.id, s]))
  const classMap = new Map(classes.map((c) => [c.id, c]))

  const activeGradeScale = gradeScales.find((g) => g.isActive) || gradeScales[0]

  const examConfigs = subjectMarkConfigs.filter((c) => c.examId === exam.id)
  const classIds = [...new Set(examConfigs.map((c) => c.classId))]

  const EXAM_TYPE_LABELS: Record<string, { en: string; bn: string }> = {
    'semester-1': { en: '1st Semester', bn: '১ম সেমিস্টার' },
    'semester-2': { en: '2nd Semester', bn: '২য় সেমিস্টার' },
    annual: { en: 'Annual', bn: 'বার্ষিক' },
    midterm: { en: 'Mid-term', bn: 'মধ্যবর্তী' },
    final: { en: 'Final', bn: 'চূড়ান্ত' },
    custom: { en: 'Custom', bn: 'কাস্টম' },
  }

  const typeLabel = EXAM_TYPE_LABELS[exam.type] || { en: exam.type, bn: exam.type }

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
        <div style="font-size:14px;font-weight:700">${isBn ? 'পরীক্ষা পরিকল্পনা প্রতিবেদন' : 'Exam Planning Report'}</div>
        <div style="font-size:10px;opacity:0.85;margin-top:2px">${isBn ? 'ধাপ ১: পরিকল্পনা ও প্রস্তুতি' : 'Step 1: Planning & Preparation'}</div>
      </div>
    </div>
  `

  // ─── Summary Stats ───
  const stats = [
    { value: `${completionPct}%`, label: isBn ? 'সম্পন্ন' : 'Completion', color: completionPct === 100 ? '#10b981' : '#f59e0b', bg: completionPct === 100 ? '#ecfdf5' : '#fffbeb' },
    { value: `${classIds.length}`, label: isBn ? 'শ্রেণি' : 'Classes', color: '#3b82f6', bg: '#eff6ff' },
    { value: `${examConfigs.length}`, label: isBn ? 'বিষয় কনফিগ' : 'Subject Configs', color: '#8b5cf6', bg: '#f5f3ff' },
    { value: `${omrConfigs.length}`, label: isBn ? 'OMR' : 'OMR Configs', color: '#ec4899', bg: '#fdf2f8' },
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
    [isBn ? 'শুরু' : 'Start', exam.startDate || '-'],
    [isBn ? 'শেষ' : 'End', exam.endDate || '-'],
    [isBn ? 'স্ট্যাটাস' : 'Status', exam.isActive ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')],
  ]

  html += `
    <div style="margin-bottom:24px">
      ${sectionHeading(isBn ? 'পরীক্ষার বিবরণ' : 'Exam Details')}
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        ${details.map(([label, value], i) => `
          <tr style="background:${zebraRow(i)}">
            <td style="padding:8px 12px;width:130px;font-size:11px;color:#64748b;font-weight:500;border-bottom:1px solid #f1f5f9">${label}</td>
            <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9">${value}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `

  // ─── Checklist ───
  html += `
    <div style="margin-bottom:24px">
      ${sectionHeading(isBn ? 'সেটআপ চেকলিস্ট' : 'Setup Checklist')}
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${checklist.map((item) => `
          <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;font-size:10px;font-weight:500;border:1px solid ${item.done ? '#bbf7d0' : '#e2e8f0'};background:${item.done ? '#f0fdf4' : '#fff'};color:${item.done ? '#166534' : '#64748b'}">
            <span style="width:16px;height:16px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:${item.done ? '#22c55e' : '#e2e8f0'};color:#fff;flex-shrink:0">
              ${item.done ? '&#10003;' : ''}
            </span>
            ${item.label}
            ${item.pct !== undefined ? `<span style="font-size:8px;color:#94a3b8;margin-left:2px">(${item.pct}%)</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `

  // ─── Subject & Mark Configuration ───
  if (classIds.length > 0) {
    html += `<div style="margin-bottom:24px">${sectionHeading(isBn ? 'বিষয় ও মার্কস কনফিগারেশন' : 'Subject & Mark Configuration')}`

    for (const classId of classIds) {
      const cls = classMap.get(classId)
      const configs = examConfigs.filter((c) => c.classId === classId)

      html += `
        <div style="margin-bottom:14px">
          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${BRAND_LIGHT};color:${BRAND};border-radius:4px;font-size:11px;font-weight:700;margin-bottom:8px">
            <span style="width:6px;height:6px;border-radius:50%;background:${BRAND}"></span>
            ${cls?.name || classId}
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            ${tableHead(
              th('#', 'center', 'width:30px') +
              th(isBn ? 'বিষয়' : 'Subject') +
              th(isBn ? 'সাব-এক্সাম' : 'Sub-exams') +
              th(isBn ? 'পূর্ণমান' : 'Full Marks', 'center', 'width:70px') +
              th(isBn ? 'পাসমান' : 'Pass Marks', 'center', 'width:70px')
            )}
            <tbody>
              ${configs
                .sort((a, b) => {
                  const sa = subjectMap.get(a.subjectId)
                  const sb = subjectMap.get(b.subjectId)
                  return ((isBn ? sa?.nameBn : sa?.name) || '').localeCompare((isBn ? sb?.nameBn : sb?.name) || '')
                })
                .map((cfg, i) => {
                  const sub = subjectMap.get(cfg.subjectId)
                  const subExamNames = cfg.subExams.map((se) => `${se.name} (${se.fullMarks})`).join(', ') || '-'
                  return `
                    <tr style="background:${zebraRow(i)}">
                      ${td(`${i + 1}`, 'center', 'color:#94a3b8;font-weight:500')}
                      ${td((isBn ? sub?.nameBn || sub?.name : sub?.name) || cfg.subjectId, 'left', 'font-weight:600')}
                      ${td(subExamNames, 'left', 'color:#64748b')}
                      ${td(`${cfg.fullMarks}`, 'center', 'font-weight:700;color:#1e293b')}
                      ${td(`${cfg.passMarks}`, 'center', '')}
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

  // ─── Grade Scale ───
  if (activeGradeScale) {
    html += `
      <div style="margin-bottom:24px">
        ${sectionHeading(`${isBn ? 'গ্রেড স্কেল' : 'Grade Scale'}${activeGradeScale.name ? ` — ${isBn ? activeGradeScale.nameBn : activeGradeScale.name}` : ''}`)}
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          ${tableHead(
            activeGradeScale.grades.map((g) => th(g.grade, 'center')).join('')
          )}
          <tbody>
            <tr>
              ${activeGradeScale.grades.map((g) => td(`${g.minPct}%`, 'center', `color:${g.color};font-weight:600`)).join('')}
            </tr>
            <tr style="background:#f8fafc">
              ${activeGradeScale.grades.map((g) => td(`GPA ${g.gpa.toFixed(1)}`, 'center', 'font-weight:600')).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `
  }

  // ─── OMR Configuration ───
  if (omrConfigs.length > 0) {
    html += `
      <div style="margin-bottom:24px">
        ${sectionHeading(isBn ? 'OMR কনফিগারেশন' : 'OMR Configuration')}
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          ${tableHead(
            th('#', 'center', 'width:30px') +
            th(isBn ? 'বিষয়' : 'Subject') +
            th(isBn ? 'প্রশ্ন' : 'Questions', 'center', 'width:80px') +
            th(isBn ? 'সঠিক' : 'Correct', 'center', 'width:70px') +
            th(isBn ? 'নেগেটিভ' : 'Negative', 'center', 'width:70px') +
            th(isBn ? 'ফরম্যাট' : 'Format', 'center', 'width:80px')
          )}
          <tbody>
            ${omrConfigs
              .map((cfg, i) => {
                const sub = subjectMap.get(cfg.subjectId)
                return `
                  <tr style="background:${zebraRow(i)}">
                    ${td(`${i + 1}`, 'center', 'color:#94a3b8;font-weight:500')}
                    ${td((isBn ? sub?.nameBn || sub?.name : sub?.name) || cfg.subjectId, 'left', 'font-weight:600')}
                    ${td(`${cfg.totalQuestions}`, 'center')}
                    ${td(`+${cfg.correctMark}`, 'center', 'color:#10b981;font-weight:600')}
                    ${td(`${cfg.negativeMark > 0 ? `-${cfg.negativeMark}` : '0'}`, 'center', cfg.negativeMark > 0 ? 'color:#ef4444;font-weight:600' : '')}
                    ${td(`Sheet ${cfg.sheetFormat}`, 'center')}
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `
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
