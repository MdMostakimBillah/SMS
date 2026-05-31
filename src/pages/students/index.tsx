import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, Users, User, UserPen, TableProperties, IdCard, ArrowUpCircle, ArrowRight } from "lucide-react"
import { useAppStore } from "@/store/appStore"
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

const stats = [
  { labelBn: "মোট", labelEn: "Total", valueBn: "১,২৪৮", valueEn: "1,248", icon: Users, color: "var(--brand)", bg: "var(--brand-light)" },
  { labelBn: "ছেলে", labelEn: "Male", valueBn: "৬৮৩", valueEn: "683", icon: User, color: "var(--teal)", bg: "var(--teal-light)" },
  { labelBn: "মেয়ে", labelEn: "Female", valueBn: "৫৬৫", valueEn: "565", icon: User, color: "var(--purple)", bg: "var(--purple-light)" },
  { labelBn: "নতুন", labelEn: "New", valueBn: "৪৮", valueEn: "48", icon: UserPlus, color: "var(--green)", bg: "var(--green-light)" },
]

// Skeleton Loading
function StudentsSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title" style={{ width: "180px", marginBottom: "16px" }} />
      <div className="skeleton skeleton-text" style={{ width: "140px", marginBottom: "20px" }} />
      
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

export default function StudentsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
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

  if (isLoading) {
    return <StudentsSkeleton />
  }

  return (
    <div ref={containerRef}>
      {/* Page header */}
      <div className="gsap-fade-up" style={{ marginBottom: isMobile ? "16px" : "20px" }}>
        <h1 style={{
          fontSize: isMobile ? "18px" : "20px",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.3px",
        }}>
          {isBn ? "ছাত্র ব্যবস্থাপনা" : "Student Management"}
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
        {stats.map((s) => {
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
              cursor: "default",
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
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "10px",
      }}>
        {isBn ? "কী করতে চান?" : "Quick Actions"}
      </div>

      {/* Option cards grid */}
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
                width: isMobile ? "44px" : "40px",
                height: isMobile ? "44px" : "40px",
                borderRadius: isMobile ? "12px" : "10px",
                background: opt.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginBottom: isMobile ? "0" : "10px",
              }}>
                <IconComp size={isMobile ? 21 : 19} style={{ color: opt.iconColor }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: isMobile ? "2px" : "4px",
                }}>
                  {isBn ? opt.titleBn : opt.titleEn}
                </div>
                <div style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  marginBottom: isMobile ? "6px" : "8px",
                }}>
                  {isBn ? opt.descBn : opt.descEn}
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{
                    fontSize: "10px",
                    color: opt.statColor,
                    fontWeight: 500,
                    background: `${opt.statColor}15`,
                    padding: "2px 6px",
                    borderRadius: "4px",
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
