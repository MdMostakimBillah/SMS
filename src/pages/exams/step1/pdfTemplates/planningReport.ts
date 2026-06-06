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

  // Header
  html += `
    <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0">
      <h1 style="font-size:18px;font-weight:700;margin:0 0 4px 0;color:#1e293b">
        ${isBn ? schoolNameBn : schoolName}
      </h1>
      <p style="font-size:11px;color:#64748b;margin:0 0 2px 0">${schoolAddress}</p>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0">
        <h2 style="font-size:15px;font-weight:700;margin:0;color:#0f172a">
          ${isBn ? 'পরীক্ষা পরিকল্পনা প্রতিবেদন' : 'Exam Planning Report'}
        </h2>
        <p style="font-size:11px;color:#64748b;margin:4px 0 0 0">
          ${isBn ? 'ধাপ ১: পরিকল্পনা ও প্রস্তুতি' : 'Step 1: Planning & Preparation'}
        </p>
      </div>
    </div>
  `

  // Completion Summary
  html += `
    <div style="display:flex;gap:12px;margin-bottom:20px">
      <div style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:${completionPct === 100 ? '#10b981' : '#f59e0b'}">${completionPct}%</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">${isBn ? 'সম্পন্ন' : 'Completed'}</div>
      </div>
      <div style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:#3b82f6">${classIds.length}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">${isBn ? 'শ্রেণি কনফিগ' : 'Classes Configured'}</div>
      </div>
      <div style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:#8b5cf6">${examConfigs.length}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">${isBn ? 'বিষয় কনফিগ' : 'Subject Configs'}</div>
      </div>
      <div style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:8px;text-align:center">
        <div style="font-size:20px;font-weight:700;color:#ec4899">${omrConfigs.length}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">${isBn ? 'OMR কনফিগ' : 'OMR Configs'}</div>
      </div>
    </div>
  `

  // Exam Details
  html += `
    <div style="margin-bottom:20px">
      <h3 style="font-size:13px;font-weight:600;margin:0 0 8px 0;color:#1e293b;padding-bottom:4px;border-bottom:1px solid #e2e8f0">
        ${isBn ? 'পরীক্ষার বিবরণ' : 'Exam Details'}
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr>
          <td style="padding:6px 8px;color:#64748b;width:120px;border-bottom:1px solid #f1f5f9">${isBn ? 'নাম' : 'Name'}</td>
          <td style="padding:6px 8px;font-weight:500;border-bottom:1px solid #f1f5f9">${isBn ? exam.nameBn : exam.name}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;color:#64748b;border-bottom:1px solid #f1f5f9">${isBn ? 'ধরন' : 'Type'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${isBn ? typeLabel.bn : typeLabel.en}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;color:#64748b;border-bottom:1px solid #f1f5f9">${isBn ? 'সেশন' : 'Session'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${exam.session}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;color:#64748b;border-bottom:1px solid #f1f5f9">${isBn ? 'শুরু' : 'Start Date'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${exam.startDate || '-'}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;color:#64748b;border-bottom:1px solid #f1f5f9">${isBn ? 'শেষ' : 'End Date'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${exam.endDate || '-'}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;color:#64748b">${isBn ? 'স্ট্যাটাস' : 'Status'}</td>
          <td style="padding:6px 8px;font-weight:500;color:${exam.isActive ? '#10b981' : '#64748b'}">${exam.isActive ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}</td>
        </tr>
      </table>
    </div>
  `

  // Checklist
  html += `
    <div style="margin-bottom:20px">
      <h3 style="font-size:13px;font-weight:600;margin:0 0 8px 0;color:#1e293b;padding-bottom:4px;border-bottom:1px solid #e2e8f0">
        ${isBn ? 'সেটআপ চেকলিস্ট' : 'Setup Checklist'}
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        ${checklist
          .map(
            (item) => `
          <tr>
            <td style="padding:6px 8px;width:20px;border-bottom:1px solid #f1f5f9">
              ${item.done ? '<span style="color:#10b981">&#10003;</span>' : '<span style="color:#cbd5e1">&#9675;</span>'}
            </td>
            <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;color:${item.done ? '#1e293b' : '#94a3b8'}">${item.label}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
  `

  // Subject & Mark Configuration per class
  if (classIds.length > 0) {
    html += `
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:600;margin:0 0 8px 0;color:#1e293b;padding-bottom:4px;border-bottom:1px solid #e2e8f0">
          ${isBn ? 'বিষয় ও মার্কস কনফিগারেশন' : 'Subject & Mark Configuration'}
        </h3>
    `

    for (const classId of classIds) {
      const cls = classMap.get(classId)
      const configs = examConfigs.filter((c) => c.classId === classId)

      html += `
        <div style="margin-bottom:12px">
          <div style="font-size:12px;font-weight:600;color:#3b82f6;margin-bottom:6px">${cls?.name || classId}</div>
          <table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:6px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">#</th>
                <th style="padding:6px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'বিষয়' : 'Subject'}</th>
                <th style="padding:6px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'সাব-এক্সাম' : 'Sub-exams'}</th>
                <th style="padding:6px 8px;text-align:center;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'পূর্ণমান' : 'Full'}</th>
                <th style="padding:6px 8px;text-align:center;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'পাসমান' : 'Pass'}</th>
              </tr>
            </thead>
            <tbody>
              ${configs
                .sort((a, b) => {
                  const sa = subjectMap.get(a.subjectId)
                  const sb = subjectMap.get(b.subjectId)
                  const nameA = (isBn ? sa?.nameBn : sa?.name) || ''
                  const nameB = (isBn ? sb?.nameBn : sb?.name) || ''
                  return nameA.localeCompare(nameB)
                })
                .map((cfg, i) => {
                  const sub = subjectMap.get(cfg.subjectId)
                  const subExamNames = cfg.subExams.map((se) => `${se.name} (${se.fullMarks})`).join(', ') || '-'
                  return `
                    <tr>
                      <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;color:#94a3b8">${i + 1}</td>
                      <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;font-weight:500">${isBn ? sub?.nameBn || sub?.name : sub?.name || cfg.subjectId}</td>
                      <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;color:#64748b">${subExamNames}</td>
                      <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9;font-weight:600">${cfg.fullMarks}</td>
                      <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9">${cfg.passMarks}</td>
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

  // Grade Scale
  if (activeGradeScale) {
    html += `
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:600;margin:0 0 8px 0;color:#1e293b;padding-bottom:4px;border-bottom:1px solid #e2e8f0">
          ${isBn ? 'গ্রেড স্কেল' : 'Grade Scale'} ${activeGradeScale.name ? `— ${isBn ? activeGradeScale.nameBn : activeGradeScale.name}` : ''}
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
          <thead>
            <tr style="background:#f8fafc">
              ${activeGradeScale.grades
                .map(
                  (g) => `
                <th style="padding:6px 8px;text-align:center;font-weight:600;border-bottom:1px solid #e2e8f0">
                  <span style="color:${g.color}">${g.grade}</span>
                </th>
              `
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${activeGradeScale.grades
                .map(
                  (g) => `
                <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9;font-size:10px">
                  ${g.minPct}%
                </td>
              `
                )
                .join('')}
            </tr>
            <tr>
              ${activeGradeScale.grades
                .map(
                  (g) => `
                <td style="padding:5px 8px;text-align:center;font-weight:500;font-size:10px">
                  GPA ${g.gpa.toFixed(1)}
                </td>
              `
                )
                .join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `
  }

  // OMR Configs
  if (omrConfigs.length > 0) {
    html += `
      <div style="margin-bottom:20px">
        <h3 style="font-size:13px;font-weight:600;margin:0 0 8px 0;color:#1e293b;padding-bottom:4px;border-bottom:1px solid #e2e8f0">
          ${isBn ? 'OMR কনফিগারেশন' : 'OMR Configuration'}
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:6px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">#</th>
              <th style="padding:6px 8px;text-align:left;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'বিষয়' : 'Subject'}</th>
              <th style="padding:6px 8px;text-align:center;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'প্রশ্ন' : 'Questions'}</th>
              <th style="padding:6px 8px;text-align:center;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'সঠিক' : 'Correct'}</th>
              <th style="padding:6px 8px;text-align:center;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'নেগেটিভ' : 'Negative'}</th>
              <th style="padding:6px 8px;text-align:center;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0">${isBn ? 'ফরম্যাট' : 'Format'}</th>
            </tr>
          </thead>
          <tbody>
            ${omrConfigs
              .map((cfg, i) => {
                const sub = subjectMap.get(cfg.subjectId)
                return `
                  <tr>
                    <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;color:#94a3b8">${i + 1}</td>
                    <td style="padding:5px 8px;border-bottom:1px solid #f1f5f9;font-weight:500">${isBn ? sub?.nameBn || sub?.name : sub?.name || cfg.subjectId}</td>
                    <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9">${cfg.totalQuestions}</td>
                    <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9">+${cfg.correctMark}</td>
                    <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9">${cfg.negativeMark > 0 ? `-${cfg.negativeMark}` : '0'}</td>
                    <td style="padding:5px 8px;text-align:center;border-bottom:1px solid #f1f5f9">Sheet ${cfg.sheetFormat}</td>
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `
  }

  // Footer
  html += `
    <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8">
      <div>${isBn ? 'তৈরি: ' : 'Generated: '}${new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}</div>
      <div>${isBn ? schoolNameBn : schoolName}</div>
    </div>
  `

  return html
}
