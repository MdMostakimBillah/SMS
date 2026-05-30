import { useNavigate } from "react-router-dom"
import { Icon } from "@iconify/react"
import { useAppStore } from "@/store/appStore"
import { useTeacherStore } from "@/store/teacherStore"

const options = [
  {
    id: "add",
    path: "/teachers/add",
    icon: "lucide:user-plus",
    iconColor: "var(--teal)",
    iconBg: "var(--teal-light)",
    titleBn: "নতুন শিক্ষক যোগ",
    titleEn: "Add Teacher",
    descBn: "নতুন শিক্ষক যোগ করুন। সকল তথ্য পূরণ করে সাবমিট করুন।",
    descEn: "Add a new teacher. Fill in all details and submit.",
    statBn: "এই মাসে ৫ জন যোগ",
    statEn: "5 added this month",
    statColor: "var(--teal)",
  },
  {
    id: "all",
    path: "/teachers/all",
    icon: "lucide:users",
    iconColor: "var(--brand)",
    iconBg: "var(--brand-light)",
    titleBn: "সকল শিক্ষক",
    titleEn: "All Teachers",
    descBn: "সকল শিক্ষকের তালিকা দেখুন, খুঁজুন এবং ফিল্টার করুন।",
    descEn: "View, search and filter all teachers.",
    statBn: "মোট ৫ জন শিক্ষক",
    statEn: "Total 5 teachers",
    statColor: "var(--brand)",
  },
  {
    id: "departments",
    path: "/teachers/departments",
    icon: "lucide:building-2",
    iconColor: "var(--amber)",
    iconBg: "var(--amber-light)",
    titleBn: "বিভাগ ব্যবস্থাপনা",
    titleEn: "Departments",
    descBn: "বিভাগ যোগ করুন, আপডেট করুন এবং পরিচালনা করুন।",
    descEn: "Add, update and manage departments.",
    statBn: "৪টি বিভাগ আছে",
    statEn: "4 departments",
    statColor: "var(--amber)",
  },
  {
    id: "subjects",
    path: "/teachers/subjects",
    icon: "lucide:book-open",
    iconColor: "var(--green)",
    iconBg: "var(--green-light)",
    titleBn: "বিষয় ব্যবস্থাপনা",
    titleEn: "Subjects",
    descBn: "বিষয় যোগ করুন, আপডেট করুন এবং বিভাগ অনুযায়ী ফিল্টার করুন।",
    descEn: "Add, update and filter subjects by department.",
    statBn: "৮টি বিষয় আছে",
    statEn: "8 subjects",
    statColor: "var(--green)",
  },
  {
    id: "attendance",
    path: "/attendance",
    icon: "lucide:clipboard-check",
    iconColor: "var(--red)",
    iconBg: "var(--red-light)",
    titleBn: "উপস্থিতি",
    titleEn: "Attendance",
    descBn: "শিক্ষকদের উপস্থিতি ট্র্যাক করুন।",
    descEn: "Track teacher attendance.",
    statBn: "শীঘ্রই আসছে",
    statEn: "Coming soon",
    statColor: "var(--red)",
  },
  {
    id: "payroll",
    path: "/payroll",
    icon: "lucide:wallet",
    iconColor: "#7C3AED",
    iconBg: "rgba(124,58,237,0.1)",
    titleBn: "বেতন ব্যবস্থাপনা",
    titleEn: "Payroll",
    descBn: "শিক্ষকদের বেতন পরিচালনা করুন।",
    descEn: "Manage teacher payroll.",
    statBn: "শীঘ্রই আসছে",
    statEn: "Coming soon",
    statColor: "#7C3AED",
  },
]

export default function TeachersPage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { teachers } = useTeacherStore()
  const isBn = language === "bn"

  const activeTeachers = teachers.filter(t => t.status === 'active').length
  const maleTeachers = teachers.filter(t => t.gender === 'Male').length
  const femaleTeachers = teachers.filter(t => t.gender === 'Female').length
  const totalSalary = teachers.reduce((sum, t) => sum + t.salary, 0)

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.3px",
        }}>
          {isBn ? "শিক্ষক ব্যবস্থাপনা" : "Teacher Management"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          {isBn
            ? "নিচের অপশনগুলো থেকে কাজ বেছে নিন"
            : "Select an option below to get started"}
        </p>
      </div>

      {/* Quick stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "24px",
      }}>
        {[
          { labelBn: "মোট শিক্ষক", labelEn: "Total Teachers", valueBn: toBnNum(teachers.length), valueEn: String(teachers.length), icon: "lucide:users", color: "var(--brand)", bg: "var(--brand-light)" },
          { labelBn: "সক্রিয়", labelEn: "Active", valueBn: toBnNum(activeTeachers), valueEn: String(activeTeachers), icon: "lucide:user-check", color: "var(--green)", bg: "var(--green-light)" },
          { labelBn: "পুরুষ / মহিলা", labelEn: "Male / Female", valueBn: `${toBnNum(maleTeachers)} / ${toBnNum(femaleTeachers)}`, valueEn: `${maleTeachers} / ${femaleTeachers}`, icon: "lucide:users", color: "var(--teal)", bg: "var(--teal-light)" },
          { labelBn: "মোট বেতন", labelEn: "Total Salary", valueBn: `৳${toBnNum(totalSalary)}`, valueEn: `৳${totalSalary.toLocaleString()}`, icon: "lucide:banknote", color: "var(--amber)", bg: "var(--amber-light)" },
        ].map((s) => (
          <div key={s.labelEn} style={{
            background: "var(--bg-primary)", border: "0.5px solid var(--border)", borderRadius: "10px",
            padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px", background: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon icon={s.icon} width={16} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
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
        ))}
      </div>

      {/* Section title */}
      <div style={{
        fontSize: "13px", fontWeight: 500, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px",
      }}>
        {isBn ? "কী করতে চান?" : "What would you like to do?"}
      </div>

      {/* Option cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => navigate(opt.path)}
            style={{
              background: "var(--bg-primary)", border: "0.5px solid var(--border)", borderRadius: "14px",
              padding: "20px", cursor: "pointer", transition: "all 0.15s", position: "relative", overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = opt.iconColor
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "3px",
              background: opt.iconColor, borderRadius: "14px 14px 0 0",
            }} />
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px", background: opt.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px",
            }}>
              <Icon icon={opt.icon} width={22} style={{ color: opt.iconColor }} />
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              {isBn ? opt.titleBn : opt.titleEn}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "14px", minHeight: "38px" }}>
              {isBn ? opt.descBn : opt.descEn}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                fontSize: "11px", color: opt.statColor, fontWeight: 500,
                background: opt.iconBg, padding: "3px 8px", borderRadius: "6px",
              }}>
                {isBn ? opt.statBn : opt.statEn}
              </span>
              <Icon icon="lucide:arrow-right" width={16} style={{ color: "var(--text-muted)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function toBnNum(n: number): string {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯']
  return String(n).replace(/\d/g, d => bn[+d])
}
