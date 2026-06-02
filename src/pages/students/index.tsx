import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, Users, User, UserPen, TableProperties, IdCard, ArrowUpCircle, ArrowRight } from "lucide-react"
import { useAppStore } from "@/store/appStore"
import { useWindowSize } from "@/hooks/useWindowSize"
import { useAdmissionStore } from "@/store/admissionStore"
import type { LucideIcon } from "lucide-react"
import gsap from "gsap"

const options: {
  id: string; path: string; icon: LucideIcon;
  iconColor: string; iconBg: string;
  titleBn: string; titleEn: string;
  descBn: string; descEn: string;
  statBn: string; statEn: string; statColor: string;
}[] = [
  {
    id: "admission",
    path: "/students/admission",
    icon: UserPlus,
    iconColor: "var(--teal)",
    iconBg: "var(--teal-light)",
    titleBn: "নতুন ভর্তি",
    titleEn: "New Admission",
    descBn: "নতুন ছাত্র ভর্তি করুন।",
    descEn: "Admit a new student.",
    statBn: "৪৮ জন এই মাসে",
    statEn: "48 this month",
    statColor: "var(--teal)",
  },
  {
    id: "all",
    path: "/students/all",
    icon: Users,
    iconColor: "var(--brand)",
    iconBg: "var(--brand-light)",
    titleBn: "সকল ছাত্র",
    titleEn: "All Students",
    descBn: "সকল ছাত্রের তালিকা।",
    descEn: "View all students.",
    statBn: "১,২৪৮ জন",
    statEn: "1,248 total",
    statColor: "var(--brand)",
  },
  {
    id: "update",
    path: "/students/update",
    icon: UserPen,
    iconColor: "var(--amber)",
    iconBg: "var(--amber-light)",
    titleBn: "তথ্য আপডেট",
    titleEn: "Update Student",
    descBn: "ছাত্রের তথ্য আপডেট করুন।",
    descEn: "Update student info.",
    statBn: "১২টি আজ",
    statEn: "12 today",
    statColor: "var(--amber)",
  },
  {
    id: "bulk-update",
    path: "/students/bulk-update",
    icon: TableProperties,
    iconColor: "var(--green)",
    iconBg: "var(--green-light)",
    titleBn: "বাল্ক আপডেট",
    titleEn: "Bulk Update",
    descBn: "একসাথে আপডেট করুন।",
    descEn: "Update at once.",
    statBn: "CSV সাপোর্ট",
    statEn: "CSV supported",
    statColor: "var(--green)",
  },
  {
    id: "id-cards",
    path: "/students/id-cards",
    icon: IdCard,
    iconColor: "var(--purple)",
    iconBg: "var(--purple-light)",
    titleBn: "ID কার্ড",
    titleEn: "ID Cards",
    descBn: "ID কার্ড তৈরি করুন।",
    descEn: "Generate ID cards.",
    statBn: "PDF সাপোর্ট",
    statEn: "PDF supported",
    statColor: "var(--purple)",
  },
  {
    id: "promotion",
    path: "/students/promotion",
    icon: ArrowUpCircle,
    iconColor: "var(--red)",
    iconBg: "var(--red-light)",
    titleBn: "প্রমোশন",
    titleEn: "Promotion",
    descBn: "পরবর্তী ক্লাসে প্রমোট করুন।",
    descEn: "Promote to next class.",
    statBn: "পরীক্ষার পরে",
    statEn: "After exams",
    statColor: "var(--red)",
  },
]

function toBnNum(n: number): string {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯']
  return String(n).replace(/\d/g, d => bn[+d])
}

function StudentsSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title w-[180px] mb-4" />
      <div className="skeleton skeleton-text w-[140px] mb-5" />

      <div className="grid grid-cols-4 gap-[10px] mb-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card">
            <div className="flex items-center gap-[10px]">
              <div className="skeleton skeleton-circle w-8 h-8" />
              <div>
                <div className="skeleton w-[50px] h-[18px] mb-1" />
                <div className="skeleton skeleton-text w-[40px] h-[10px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton w-[100px] h-[12px] mb-3" />

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-circle w-10 h-10 mb-[10px]" />
            <div className="skeleton w-[80px] h-[14px] mb-1.5" />
            <div className="skeleton skeleton-text w-full" />
            <div className="skeleton skeleton-text w-[60px] h-[10px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const { students } = useAdmissionStore()
  const isBn = language === "bn"
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  const approvedStudents = students.filter(s => s.status === 'approved')
  const totalStudents = approvedStudents.length
  const maleStudents = approvedStudents.filter(s => s.gender === 'Male').length
  const femaleStudents = approvedStudents.filter(s => s.gender === 'Female').length
  const currentMonth = new Date().toISOString().slice(0, 7)
  const newStudents = approvedStudents.filter(s => s.admissionDate?.startsWith(currentMonth)).length

  const statsData = [
    { labelBn: "মোট", labelEn: "Total", valueBn: toBnNum(totalStudents), valueEn: String(totalStudents), icon: Users, color: "var(--brand)", bg: "var(--brand-light)" },
    { labelBn: "ছেলে", labelEn: "Male", valueBn: toBnNum(maleStudents), valueEn: String(maleStudents), icon: User, color: "var(--teal)", bg: "var(--teal-light)" },
    { labelBn: "মেয়ে", labelEn: "Female", valueBn: toBnNum(femaleStudents), valueEn: String(femaleStudents), icon: User, color: "var(--purple)", bg: "var(--purple-light)" },
    { labelBn: "নতুন", labelEn: "New", valueBn: toBnNum(newStudents), valueEn: String(newStudents), icon: UserPlus, color: "var(--green)", bg: "var(--green-light)" },
  ]

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !containerRef.current) return

    const cards = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(cards,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out"
      }
    )
  }, [isLoading])

  if (isLoading) {
    return <StudentsSkeleton />
  }

  return (
    <div ref={containerRef}>
      <div className={`gsap-fade-up ${isMobile ? "mb-4" : "mb-5"}`}>
        <h1 className={`text-[var(--text-primary)] font-semibold tracking-[-0.3px] ${isMobile ? "text-lg" : "text-xl"}`}>
          {isBn ? "ছাত্র ব্যবস্থাপনা" : "Student Management"}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {isBn ? "নিচের অপশন বেছে নিন" : "Select an option below"}
        </p>
      </div>

      <div className={`gsap-fade-up grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} ${isMobile ? "gap-2" : "gap-[10px]"} ${isMobile ? "mb-4" : "mb-5"}`}>
        {statsData.map((s) => {
          const IconComp = s.icon
          return (
            <div key={s.labelEn}
              className={`bg-[var(--surface)] border border-[var(--border)] rounded-[10px] flex items-center ${isMobile ? "gap-2" : "gap-[10px]"} cursor-default transition-all duration-150 shadow-[var(--shadow-xs)] ${isMobile ? "p-3" : "p-[14px]"}`}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = s.color;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                className={`rounded-lg flex items-center justify-center flex-shrink-0 ${isMobile ? "w-7 h-7" : "w-8 h-8"}`}
                style={{ background: s.bg }}
              >
                <IconComp size={isMobile ? 13 : 15} style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <div className={`text-[var(--text-primary)] leading-none font-bold ${isMobile ? "text-base" : "text-lg"}`}>
                  {isBn ? s.valueBn : s.valueEn}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-[2px]">
                  {isBn ? s.labelBn : s.labelEn}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="gsap-fade-up text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.5px] mb-[10px]">
        {isBn ? "কী করতে চান?" : "Quick Actions"}
      </div>

      <div className={`gsap-fade-up grid ${isMobile ? "grid-cols-2" : isTablet ? "grid-cols-2" : "grid-cols-3"} ${isMobile ? "gap-2" : "gap-3"}`}>
        {options.map((opt) => {
          const IconComp = opt.icon
          return (
            <div
              key={opt.id}
              onClick={() => navigate(opt.path)}
              className={`bg-[var(--surface)] border border-[var(--border)] rounded-[10px] cursor-pointer transition-all duration-150 shadow-[var(--shadow-xs)] flex ${isMobile ? "flex-row items-center gap-3" : "flex-col items-start gap-0"} ${isMobile ? "p-3" : "p-4"}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = opt.iconColor
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "var(--shadow-md)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "var(--shadow-xs)"
              }}
            >
              <div
                className={`rounded-[10px] flex items-center justify-center flex-shrink-0 ${isMobile ? "w-[44px] h-[44px] rounded-xl mb-0" : "w-10 h-10 mb-[10px]"}`}
                style={{ background: opt.iconBg }}
              >
                <IconComp size={isMobile ? 21 : 19} style={{ color: opt.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[var(--text-primary)] font-semibold ${isMobile ? "text-[13px] mb-[2px]" : "text-sm mb-1"}`}>
                  {isBn ? opt.titleBn : opt.titleEn}
                </div>
                <div className={`text-[11px] text-[var(--text-secondary)] leading-[1.5] ${isMobile ? "mb-1.5" : "mb-2"}`}>
                  {isBn ? opt.descBn : opt.descEn}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-medium rounded px-1.5 py-0.5"
                    style={{ color: opt.statColor, background: `${opt.statColor}15` }}
                  >
                    {isBn ? opt.statBn : opt.statEn}
                  </span>
                  <ArrowRight size={14} className="text-[var(--text-muted)]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
