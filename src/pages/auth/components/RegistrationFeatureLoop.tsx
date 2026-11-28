import {
  Users,
  ScanFace,
  ClipboardCheck,
  Wallet,
  CalendarDays,
  Video,
  UserCheck,
  BookOpen,
  Bell,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface RegistrationFeatureItem {
  id: string
  icon: LucideIcon
  titleEn: string
  titleBn: string
  descEn: string
  descBn: string
}

/**
 * Real EduTech SMS platform modules shown in the registration landing loop.
 * Every entry maps directly to implemented routes/modules in the app.
 */
export const REGISTRATION_FEATURES: RegistrationFeatureItem[] = [
  {
    id: 'students-teachers',
    icon: Users,
    titleEn: 'Student & Teacher Management',
    titleBn: 'ছাত্র ও শিক্ষক ম্যানেজমেন্ট',
    descEn: 'Admissions, ID cards, promotions & staff directory',
    descBn: 'ভর্তি, আইডি কার্ড, প্রমোশন ও সকল তথ্য এক জায়গায়',
  },
  {
    id: 'biometric-attendance',
    icon: ScanFace,
    titleEn: 'Biometric & QR Attendance',
    titleBn: 'বায়োমেট্রিক ও QR উপস্থিতি',
    descEn: 'Face scan, fingerprint, QR code & RFID devices',
    descBn: 'ফেস স্ক্যান, ফিঙ্গারপ্রিন্ট, QR কোড ও RFID ডিভাইস',
  },
  {
    id: 'exams-omr',
    icon: ClipboardCheck,
    titleEn: 'Exams, OMR & Auto Results',
    titleBn: 'পরীক্ষা, OMR ও ফলাফল',
    descEn: 'Scheduling, OMR sheets, grading & marksheets',
    descBn: 'সময়সূচি, OMR শিট, স্বয়ংক্রিয় গ্রেডিং ও মার্কশিট',
  },
  {
    id: 'fees-accounting',
    icon: Wallet,
    titleEn: 'Fees, Payroll & Accounting',
    titleBn: 'ফি, বেতন ও হিসাব',
    descEn: 'Fee collection, waivers, staff payroll & P/L reports',
    descBn: 'ফি আদায়, ছাড়, স্টাফ বেতন ও পূর্ণাঙ্গ হিসাব রিপোর্ট',
  },
  {
    id: 'classes-syllabus',
    icon: CalendarDays,
    titleEn: 'Classes, Routines & Syllabus',
    titleBn: 'শ্রেণি, রুটিন ও সিলেবাস',
    descEn: 'Multi-session schedules, routines & assignments',
    descBn: 'একাধিক সেশন, পিরিয়ড রুটিন, সিলেবাস ও অ্যাসাইনমেন্ট',
  },
  {
    id: 'online-classes',
    icon: Video,
    titleEn: 'Online Classes & Recordings',
    titleBn: 'অনলাইন ক্লাস ও রেকর্ডিং',
    descEn: 'Live virtual sessions and recorded lesson archive',
    descBn: 'লাইভ অনলাইন ক্লাস এবং রেকর্ড করা লেসন আর্কাইভ',
  },
  {
    id: 'portals',
    icon: UserCheck,
    titleEn: 'Parent & Student Portals',
    titleBn: 'অভিভাবক ও শিক্ষার্থী পোর্টাল',
    descEn: 'Dedicated portals for fees, attendance & homework',
    descBn: 'ফি, উপস্থিতি, হোমওয়ার্ক ও ফলাফলের পৃথক পোর্টাল',
  },
  {
    id: 'campus-ops',
    icon: BookOpen,
    titleEn: 'Library, Transport & Hostel',
    titleBn: 'লাইব্রেরি, পরিবহন ও হোস্টেল',
    descEn: 'Book issue/return, bus routes & room allocation',
    descBn: 'বই লেনদেন, বাস রুট ও হোস্টেল রুম ব্যবস্থাপনা',
  },
  {
    id: 'hr-communication',
    icon: Bell,
    titleEn: 'HR, Notices & Messaging',
    titleBn: 'HR, নোটিশ ও মেসেজিং',
    descEn: 'Staff increments, notice board & instant messages',
    descBn: 'স্টাফ মূল্যায়ন, নোটিশ বোর্ড ও তাৎক্ষণিক বার্তা',
  },
  {
    id: 'storage-security',
    icon: ShieldCheck,
    titleEn: 'Cloud, Local PC Vault & RBAC',
    titleBn: 'ক্লাউড, লোকাল পিসি ও নিরাপত্তা',
    descEn: 'Cloud or offline Local PC backup & role access control',
    descBn: 'ক্লাউড বা অফলাইন লোকাল পিসি ভল্ট, ব্যাকআপ ও রোল পারমিশন',
  },
]

interface RegistrationFeatureLoopProps {
  isBn: boolean
  isDark: boolean
}

/**
 * Fixed-height seamless vertical marquee of platform feature cards for `/register`.
 * Keeps the right-side hero height constant (`13.5rem`) while cycling through all modules.
 */
export function RegistrationFeatureLoop({ isBn, isDark }: RegistrationFeatureLoopProps) {
  return (
    <div
      data-testid="registration-feature-loop"
      className="feature-loop-viewport relative h-[13.5rem] overflow-hidden mb-8"
      role="region"
      aria-label={isBn ? 'প্ল্যাটফর্মের মূল সুবিধাসমূহ' : 'Platform features'}
    >
      <div className="feature-loop-track flex flex-col">
        {[false, true].map((isDuplicate) => (
          <div
            key={isDuplicate ? 'loop-clone' : 'loop-primary'}
            aria-hidden={isDuplicate}
            className="flex flex-col gap-3 pb-3"
          >
            {REGISTRATION_FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={`${isDuplicate ? 'clone' : 'primary'}-${f.id}`}
                  className={`min-h-[3.875rem] flex items-center gap-3 p-3 rounded-xl border transition-[background-color,border-color] duration-150 ${
                    isDark
                      ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                      : 'bg-white border-[var(--border)] hover:border-[var(--border-2)]'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'var(--brand-light, rgba(99,102,241,0.1))',
                    }}
                  >
                    <Icon size={16} strokeWidth={1.5} className="text-[var(--brand)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-[0.8125rem] font-semibold leading-snug truncate ${
                        isDark ? 'text-white/80' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {isBn ? f.titleBn : f.titleEn}
                    </h3>
                    <p
                      className={`text-[0.6875rem] leading-snug truncate ${
                        isDark ? 'text-white/35' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {isBn ? f.descBn : f.descEn}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
