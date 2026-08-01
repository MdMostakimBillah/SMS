import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, GraduationCap, CheckCircle2, ChevronRight,
  ArrowRight, ArrowLeft, Sparkles,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'

interface Step {
  key: string
  titleEn: string
  titleBn: string
  descEn: string
  descBn: string
  icon: React.ReactNode
  color: string
  route: string
  count: () => number
}

const SETUP_KEY = 'edutech_setup_complete'

export function isSetupComplete(): boolean {
  return localStorage.getItem(SETUP_KEY) === 'true'
}

export function markSetupComplete() {
  localStorage.setItem(SETUP_KEY, 'true')
}

export function resetSetup() {
  localStorage.removeItem(SETUP_KEY)
}

export default function SetupWizard() {
  const isBn = useBn()
  const navigate = useNavigate()
  const classes = useClassStore((s) => s.classes)
  const teachers = useTeacherStore((s) => s.teachers)
  const students = useAdmissionStore((s) => s.students)
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const steps: Step[] = [
    {
      key: 'classes',
      titleEn: 'Add Classes',
      titleBn: 'শ্রেণি যোগ করুন',
      descEn: 'Create your class structure (e.g. Class 1, Class 2, Class 9-10)',
      descBn: 'আপনার শ্রেণি কাঠামো তৈরি করুন (যেমন: ক্লাস ১, ক্লাস ২, ক্লাস ৯-১০)',
      icon: <Building2 size={24} />,
      color: '#6366f1',
      route: '/classes',
      count: () => classes.length,
    },
    {
      key: 'teachers',
      titleEn: 'Add Teachers',
      titleBn: 'শিক্ষক যোগ করুন',
      descEn: 'Add your teaching staff with departments and subjects',
      descBn: 'বিভাগ ও বিষয়সহ আপনার শিক্ষকদের যোগ করুন',
      icon: <Users size={24} />,
      color: '#14b8a6',
      route: '/teachers',
      count: () => teachers.length,
    },
    {
      key: 'students',
      titleEn: 'Add Students',
      titleBn: 'ছাত্র/ছাত্রী যোগ করুন',
      descEn: 'Enroll students into classes and sections',
      descBn: 'শ্রেণি ও সেকশনে ছাত্র/ছাত্রীদের ভর্তি করুন',
      icon: <GraduationCap size={24} />,
      color: '#f59e0b',
      route: '/students/admission',
      count: () => students.length,
    },
  ]

  if (dismissed) return null

  const current = steps[step]
  const count = current.count()
  const isLast = step === steps.length - 1
  const allDone = steps.every((s) => s.count() > 0)

  const handleComplete = () => {
    markSetupComplete()
    setDismissed(true)
  }

  const handleSkip = () => {
    markSetupComplete()
    setDismissed(true)
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${current.color}15` }}>
              <Sparkles size={20} style={{ color: current.color }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'স্বাগতম! আপনার স্কুল সেটআপ করুন' : 'Welcome! Set Up Your School'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? '৩টি ধাপে আপনার স্কুল প্রস্তুত করুন' : 'Get your school ready in 3 steps'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-[0.6875rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none"
          >
            {isBn ? 'পরে করব' : 'Skip for now'}
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => {
            const done = s.count() > 0
            const active = i === step
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border-none transition-all ${
                    active ? 'text-white' : done ? 'bg-[var(--green)]/10 text-[var(--green)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                  }`}
                  style={active ? { background: s.color } : undefined}
                >
                  {done ? <CheckCircle2 size={14} /> : s.icon}
                  <span className="hidden sm:inline">{isBn ? s.titleBn : s.titleEn}</span>
                </button>
                {i < steps.length - 1 && <ChevronRight size={12} className="text-[var(--text-muted)] shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="px-5 py-6">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${current.color}15`, color: current.color }}
          >
            {current.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
              {isBn ? current.titleBn : current.titleEn}
            </h4>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {isBn ? current.descBn : current.descEn}
            </p>

            {count > 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--green)]/10 mb-4">
                <CheckCircle2 size={16} className="text-[var(--green)]" />
                <span className="text-sm font-medium text-[var(--green)]">
                  {count} {isBn ? 'টি যোগ করা হয়েছে' : 'added already'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--amber)]/10 mb-4">
                <span className="text-sm text-[var(--amber)]">
                  {isBn ? 'এখনো কিছু যোগ করা হয়নি' : 'Nothing added yet'}
                </span>
              </div>
            )}

            <button
              onClick={() => navigate(current.route)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer border-none transition-all hover:opacity-90"
              style={{ background: current.color }}
            >
              {count > 0
                ? isBn ? `${isBn ? 'আরও যোগ করুন' : 'Add More'}` : 'Add More'
                : isBn ? `${current.titleBn} শুরু করুন` : `Start ${current.titleEn}`
              }
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] disabled:opacity-30 cursor-pointer bg-transparent border border-[var(--border)] disabled:cursor-not-allowed"
        >
          <ArrowLeft size={14} /> {isBn ? 'আগের' : 'Back'}
        </button>
        <span className="text-[0.6875rem] text-[var(--text-muted)]">
          {step + 1} / {steps.length}
        </span>
        {isLast || allDone ? (
          <button
            onClick={handleComplete}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--green)] cursor-pointer border-none"
          >
            <CheckCircle2 size={14} /> {isBn ? 'সম্পন্ন' : 'Done'}
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--brand)] cursor-pointer border-none"
          >
            {isBn ? 'পরবর্তী' : 'Next'} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
