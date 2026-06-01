import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, Users, Building2, BookOpen, ClipboardCheck, Wallet, UserCheck, Banknote, ArrowRight, Layers, Briefcase } from "lucide-react"
import { useAppStore } from "@/store/appStore"
import { useTeacherStore } from "@/store/teacherStore"
import { useWindowSize } from "@/hooks/useWindowSize"
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
    id: "add",
    path: "/teachers/add",
    icon: UserPlus,
    iconColor: "var(--teal)",
    iconBg: "var(--teal-light)",
    titleBn: "নতুন শিক্ষক",
    titleEn: "Add Teacher",
    descBn: "নতুন শিক্ষক যোগ করুন।",
    descEn: "Add a new teacher.",
    statBn: "৫ জন এই মাসে",
    statEn: "5 this month",
    statColor: "var(--teal)",
  },
  {
    id: "all",
    path: "/teachers/all",
    icon: Users,
    iconColor: "var(--brand)",
    iconBg: "var(--brand-light)",
    titleBn: "সকল শিক্ষক",
    titleEn: "All Teachers",
    descBn: "সকল শিক্ষকের তালিকা।",
    descEn: "View all teachers.",
    statBn: "৫ জন মোট",
    statEn: "5 total",
    statColor: "var(--brand)",
  },
  {
    id: "departments",
    path: "/teachers/departments",
    icon: Building2,
    iconColor: "var(--amber)",
    iconBg: "var(--amber-light)",
    titleBn: "বিভাগ",
    titleEn: "Departments",
    descBn: "বিভাগ পরিচালনা করুন।",
    descEn: "Manage departments.",
    statBn: "৪টি বিভাগ",
    statEn: "4 departments",
    statColor: "var(--amber)",
  },
  {
    id: "subjects",
    path: "/teachers/subjects",
    icon: BookOpen,
    iconColor: "var(--green)",
    iconBg: "var(--green-light)",
    titleBn: "বিষয়",
    titleEn: "Subjects",
    descBn: "বিষয় পরিচালনা করুন।",
    descEn: "Manage subjects.",
    statBn: "৮টি বিষয়",
    statEn: "8 subjects",
    statColor: "var(--green)",
  },
  {
    id: "designations",
    path: "/teachers/designations",
    icon: Briefcase,
    iconColor: "var(--purple)",
    iconBg: "var(--purple-light)",
    titleBn: "পদবি",
    titleEn: "Designations",
    descBn: "পদবি পরিচালনা করুন।",
    descEn: "Manage designations.",
    statBn: "৬টি পদবি",
    statEn: "6 designations",
    statColor: "var(--purple)",
  },
  {
    id: "bulk-update",
    path: "/teachers/bulk-update",
    icon: Layers,
    iconColor: "var(--purple)",
    iconBg: "var(--purple-light)",
    titleBn: "বাল্ক আপডেট",
    titleEn: "Bulk Update",
    descBn: "একসাথে অনেক শিক্ষকের তথ্য পরিবর্তন করুন।",
    descEn: "Update multiple teachers at once.",
    statBn: "৫ জন+ একসাথে",
    statEn: "5+ at once",
    statColor: "var(--purple)",
  },
  {
    id: "attendance",
    path: "/attendance",
    icon: ClipboardCheck,
    iconColor: "var(--red)",
    iconBg: "var(--red-light)",
    titleBn: "উপস্থিতি",
    titleEn: "Attendance",
    descBn: "উপস্থিতি ট্র্যাক করুন।",
    descEn: "Track attendance.",
    statBn: "শীঘ্রই",
    statEn: "Coming soon",
    statColor: "var(--red)",
  },
  {
    id: "payroll",
    path: "/payroll",
    icon: Wallet,
    iconColor: "var(--purple)",
    iconBg: "var(--purple-light)",
    titleBn: "বেতন",
    titleEn: "Payroll",
    descBn: "বেতন পরিচালনা করুন।",
    descEn: "Manage payroll.",
    statBn: "শীঘ্রই",
    statEn: "Coming soon",
    statColor: "var(--purple)",
  },
]

function toBnNum(n: number): string {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯']
  return String(n).replace(/\d/g, d => bn[+d])
}

// Skeleton Loading
function TeachersSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title" style={{ width: "200px", marginBottom: "16px" }} />
      <div className="skeleton skeleton-text" style={{ width: "150px", marginBottom: "20px" }} />
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="skeleton skeleton-circle" style={{ width: "32px", height: "32px" }} />
              <div>
                <div className="skeleton" style={{ width: "50px", height: "18px", marginBottom: "4px" }} />
                <div className="skeleton skeleton-text" style={{ width: "40px", height: "10px" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton" style={{ width: "100px", height: "12px", marginBottom: "12px" }} />
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-circle" style={{ width: "40px", height: "40px", marginBottom: "10px" }} />
            <div className="skeleton" style={{ width: "80px", height: "14px", marginBottom: "6px" }} />
            <div className="skeleton skeleton-text" style={{ width: "100%" }} />
            <div className="skeleton skeleton-text" style={{ width: "60px", height: "10px" }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { teachers } = useTeacherStore()
  const { isMobile, isTablet } = useWindowSize()
  const isBn = language === "bn"
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const activeTeachers = teachers.filter(t => t.status === 'active').length
  const maleTeachers = teachers.filter(t => t.gender === 'Male').length
  const femaleTeachers = teachers.filter(t => t.gender === 'Female').length
  const totalSalary = teachers.reduce((sum, t) => sum + t.salary, 0)

  const statsData = [
    { labelBn: "মোট", labelEn: "Total", valueBn: toBnNum(teachers.length), valueEn: String(teachers.length), icon: Users, color: "var(--brand)", bg: "var(--brand-light)" },
    { labelBn: "সক্রিয়", labelEn: "Active", valueBn: toBnNum(activeTeachers), valueEn: String(activeTeachers), icon: UserCheck, color: "var(--green)", bg: "var(--green-light)" },
    { labelBn: "পুরুষ/মহিলা", labelEn: "M/F", valueBn: `${toBnNum(maleTeachers)}/${toBnNum(femaleTeachers)}`, valueEn: `${maleTeachers}/${femaleTeachers}`, icon: Users, color: "var(--teal)", bg: "var(--teal-light)" },
    { labelBn: "বেতন", labelEn: "Salary", valueBn: `৳${toBnNum(totalSalary)}`, valueEn: `৳${totalSalary.toLocaleString()}`, icon: Banknote, color: "var(--amber)", bg: "var(--amber-light)" },
  ]

  if (isLoading) {
    return <TeachersSkeleton />
  }

  return (
    <div ref={containerRef}>
      <div className="gsap-fade-up" style={{ marginBottom: isMobile ? "16px" : "20px" }}>
        <h1 style={{
          fontSize: isMobile ? "18px" : "20px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.3px",
        }}>
          {isBn ? "শিক্ষক ব্যবস্থাপনা" : "Teacher Management"}
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
          {isBn ? "নিচের অপশন বেছে নিন" : "Select an option below"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="gsap-fade-up" style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: isMobile ? "8px" : "10px",
        marginBottom: isMobile ? "16px" : "20px",
      }}>
        {statsData.map((s) => {
          const IconComp = s.icon
          return (
            <div key={s.labelEn} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: isMobile ? "12px" : "14px",
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "8px" : "10px",
              transition: "all 0.15s ease",
              boxShadow: "var(--shadow-xs)",
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.borderColor = s.color; 
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.borderColor = 'var(--border)'; 
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{
                width: isMobile ? "28px" : "32px", height: isMobile ? "28px" : "32px",
                borderRadius: "8px",
                background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <IconComp size={isMobile ? 13 : 15} style={{ color: s.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
                  {isBn ? s.valueBn : s.valueEn}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {isBn ? s.labelBn : s.labelEn}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Section title */}
      <div className="gsap-fade-up" style={{
        fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px",
      }}>
        {isBn ? "কী করতে চান?" : "Quick Actions"}
      </div>

      {/* Option cards */}
      <div className="gsap-fade-up" style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
        gap: isMobile ? "8px" : "12px",
      }}>
        {options.map((opt) => {
          const IconComp = opt.icon
          return (
            <div
              key={opt.id}
              onClick={() => navigate(opt.path)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: isMobile ? "12px" : "16px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: "var(--shadow-xs)",
                display: "flex",
                flexDirection: isMobile ? "row" : "column",
                alignItems: isMobile ? "center" : "flex-start",
                gap: isMobile ? "12px" : "0",
              }}
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
              <div style={{
                width: isMobile ? "44px" : "40px", height: isMobile ? "44px" : "40px", borderRadius: isMobile ? "12px" : "10px", background: opt.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                marginBottom: isMobile ? "0" : "10px",
              }}>
                <IconComp size={isMobile ? 21 : 19} style={{ color: opt.iconColor }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: isMobile ? "2px" : "4px" }}>
                  {isBn ? opt.titleBn : opt.titleEn}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: isMobile ? "6px" : "8px" }}>
                  {isBn ? opt.descBn : opt.descEn}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: "10px", color: opt.statColor, fontWeight: 500,
                    background: `${opt.statColor}15`, padding: "2px 6px", borderRadius: "4px",
                  }}>
                    {isBn ? opt.statBn : opt.statEn}
                  </span>
                  <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
