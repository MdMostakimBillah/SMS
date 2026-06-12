import { useMemo } from 'react'
import { ClipboardCheck, FileCheck, BookOpen, CheckCircle2 } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useExamStore } from '@/store/examStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useSessionStudents } from '@/store/admissionStore'

export default function ExamOverview() {
  const isBn = useBn()
  const { examConfigs, studentMarks } = useExamStore()
  const { subjects } = useTeacherStore()
  const students = useSessionStudents()

  const data = useMemo(() => {
    const totalExams = examConfigs.length
    const publishedExams = examConfigs.filter((e) => e.isPublished).length
    const totalMarks = studentMarks.length
    const totalSubjects = subjects.length

    return [
      { label: isBn ? 'মোট পরীক্ষা' : 'Total Exams', value: totalExams, icon: <ClipboardCheck size={14} />, color: 'var(--brand)' },
      { label: isBn ? 'প্রকাশিত' : 'Published', value: publishedExams, icon: <FileCheck size={14} />, color: 'var(--green)' },
      { label: isBn ? 'বিষয়' : 'Subjects', value: totalSubjects, icon: <BookOpen size={14} />, color: 'var(--amber)' },
      { label: isBn ? 'মার্ক এন্ট্রি' : 'Marks Entered', value: totalMarks, icon: <CheckCircle2 size={14} />, color: 'var(--teal)' },
    ]
  }, [examConfigs, studentMarks, subjects, students, isBn])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
      {data.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '1.625rem',
              height: '1.625rem',
              borderRadius: '0.375rem',
              background: `${item.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.color,
              flexShrink: 0,
            }}
          >
            {item.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.value}</div>
            <div
              style={{
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
