import { useNavigate } from "react-router-dom"
import { UserPlus, Users, User, UserPen, TableProperties, IdCard, ArrowUpCircle, ArrowRight } from "lucide-react"
import { useAppStore } from "@/store/appStore"
import { useWindowSize } from "@/hooks/useWindowSize"
import type { LucideIcon } from "lucide-react"

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
    descBn: "নতুন ছাত্র ভর্তি করুন। সকল তথ্য পূরণ করে সাবমিট করুন।",
    descEn: "Admit a new student. Fill in all details and submit.",
    statBn: "এই মাসে ৪৮ জন ভর্তি",
    statEn: "48 admissions this month",
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
    descBn: "সকল ছাত্রের তালিকা দেখুন, খুঁজুন এবং ফিল্টার করুন।",
    descEn: "View, search and filter all students.",
    statBn: "মোট ১,২৪৮ জন ছাত্র",
    statEn: "Total 1,248 students",
    statColor: "var(--brand)",
  },
  {
    id: "update",
    path: "/students/update",
    icon: UserPen,
    iconColor: "var(--amber)",
    iconBg: "var(--amber-light)",
    titleBn: "ছাত্র তথ্য আপডেট",
    titleEn: "Update Student",
    descBn: "একজন ছাত্রের নাম, ছবি, রোল, শ্রেণি বা যেকোনো তথ্য আপডেট করুন।",
    descEn: "Update name, photo, roll, class or any info of a student.",
    statBn: "আজ ১২টি আপডেট হয়েছে",
    statEn: "12 updates today",
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
    descBn: "একসাথে অনেক ছাত্রের তথ্য আপডেট করুন। CSV ফাইল আপলোড করুন।",
    descEn: "Update many students at once. Upload CSV file.",
    statBn: "CSV / Excel সাপোর্ট",
    statEn: "CSV / Excel supported",
    statColor: "var(--green)",
  },
  {
    id: "id-cards",
    path: "/students/id-cards",
    icon: IdCard,
    iconColor: "#7C3AED",
    iconBg: "rgba(124,58,237,0.1)",
    titleBn: "ID কার্ড",
    titleEn: "ID Cards",
    descBn: "ছাত্রদের ID কার্ড তৈরি করুন এবং প্রিন্ট করুন।",
    descEn: "Generate and print student ID cards.",
    statBn: "PDF ও Print সাপোর্ট",
    statEn: "PDF & Print supported",
    statColor: "#7C3AED",
  },
  {
    id: "promotion",
    path: "/students/promotion",
    icon: ArrowUpCircle,
    iconColor: "var(--red)",
    iconBg: "var(--red-light)",
    titleBn: "ক্লাস প্রমোশন",
    titleEn: "Class Promotion",
    descBn: "ছাত্রদের পরবর্তী ক্লাসে প্রমোট করুন। একসাথে সবাইকে করা যাবে।",
    descEn: "Promote students to the next class. Can do all at once.",
    statBn: "বার্ষিক পরীক্ষার পরে",
    statEn: "After annual exams",
    statColor: "var(--red)",
  },
]

const stats = [
  { labelBn: "মোট ছাত্র", labelEn: "Total Students", valueBn: "১,২৪৮", valueEn: "1,248", icon: Users, color: "var(--brand)", bg: "var(--brand-light)" },
  { labelBn: "ছেলে", labelEn: "Male", valueBn: "৬৮৩", valueEn: "683", icon: User, color: "var(--teal)", bg: "var(--teal-light)" },
  { labelBn: "মেয়ে", labelEn: "Female", valueBn: "৫৬৫", valueEn: "565", icon: User, color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
  { labelBn: "এই মাসে নতুন", labelEn: "New This Month", valueBn: "৪৮", valueEn: "48", icon: UserPlus, color: "var(--green)", bg: "var(--green-light)" },
]

export default function StudentsPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const isBn = language === "bn"

  return (
    <div>

      {/* Page header */}
      <div style={{ marginBottom: isMobile ? "16px" : "24px" }}>
        <h1 style={{
          fontSize: isMobile ? "18px" : "22px",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.3px",
        }}>
          {isBn ? "ছাত্র ব্যবস্থাপনা" : "Student Management"}
        </h1>
        <p style={{ fontSize: isMobile ? "12px" : "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          {isBn
            ? "নিচের অপশনগুলো থেকে কাজ বেছে নিন"
            : "Select an option below to get started"}
        </p>
      </div>

      {/* Quick stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: isMobile ? "8px" : "10px",
        marginBottom: isMobile ? "16px" : "24px",
      }}>
        {stats.map((s) => {
          const IconComp = s.icon
          return (
            <div key={s.labelEn} style={{
              background: "var(--bg-primary)",
              border: "0.5px solid var(--border)",
              borderRadius: "10px",
              padding: isMobile ? "10px 12px" : "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "8px" : "10px",
              cursor: "default",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: isMobile ? "28px" : "32px", height: isMobile ? "28px" : "32px",
                borderRadius: "8px",
                background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <IconComp size={isMobile ? 14 : 16} style={{ color: s.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {isBn ? s.valueBn : s.valueEn}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {isBn ? s.valueEn : s.valueBn}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  {isBn ? s.labelBn : s.labelEn}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Section title */}
      <div style={{
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "12px",
      }}>
        {isBn ? "কী করতে চান?" : "What would you like to do?"}
      </div>

      {/* Option cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
        gap: isMobile ? "10px" : "14px",
      }}>
        {options.map((opt) => {
          const IconComp = opt.icon
          return (
            <div
              key={opt.id}
              onClick={() => navigate(opt.path)}
              style={{
                background: "var(--bg-primary)",
                border: "0.5px solid var(--border)",
                borderRadius: "14px",
                padding: isMobile ? "16px" : "20px",
                cursor: "pointer",
                transition: "all 0.15s",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.borderColor = opt.iconColor
                el.style.transform = "translateY(-2px)"
                el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.borderColor = "var(--border)"
                el.style.transform = "translateY(0)"
                el.style.boxShadow = "none"
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: "3px",
                background: opt.iconColor,
                borderRadius: "14px 14px 0 0",
              }} />

              {/* Icon */}
              <div style={{
                width: isMobile ? "38px" : "44px",
                height: isMobile ? "38px" : "44px",
                borderRadius: "12px",
                background: opt.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: isMobile ? "10px" : "14px",
              }}>
                <IconComp size={isMobile ? 18 : 22} style={{ color: opt.iconColor }} />
              </div>

              {/* Title */}
              <div style={{
                fontSize: isMobile ? "14px" : "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}>
                {isBn ? opt.titleBn : opt.titleEn}
              </div>

              {/* Description */}
              <div style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "14px",
                minHeight: isMobile ? "auto" : "38px",
              }}>
                {isBn ? opt.descBn : opt.descEn}
              </div>

              {/* Bottom stat */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span style={{
                  fontSize: "11px",
                  color: opt.statColor,
                  fontWeight: 500,
                  background: opt.iconBg,
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}>
                  {isBn ? opt.statBn : opt.statEn}
                </span>
                <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
