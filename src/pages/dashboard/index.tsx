import { Icon } from "@iconify/react"
import { useAppStore } from "@/store/appStore"
import { useWindowSize } from "@/hooks/useWindowSize"
import CircularChart from "@/components/ui/CircularChart"
import useReveal from '@/hooks/useReveal'

const stats = [
  { labelBn: "মোট ছাত্র", labelEn: "Total Students", value: "1,248", changeBn: "↑ ১২% গত টার্ম", changeEn: "↑ 12% last term", up: true, icon: "lucide:users", color: "var(--brand)", bg: "var(--brand-light)" },
  { labelBn: "শিক্ষক ও স্টাফ", labelEn: "Teachers & Staff", value: "96", changeBn: "↑ এই মাসে ৩ জন", changeEn: "↑ 3 new this month", up: true, icon: "lucide:graduation-cap", color: "var(--teal)", bg: "var(--teal-light)" },
  { labelBn: "ফি সংগ্রহ", labelEn: "Fees Collected", value: "৳82L", changeBn: "↓ ৪% বকেয়া", changeEn: "↓ 4% outstanding", up: false, icon: "lucide:landmark", color: "var(--amber)", bg: "var(--amber-light)" },
  { labelBn: "গড় উপস্থিতি", labelEn: "Avg Attendance", value: "92.4%", changeBn: "↑ এই সপ্তাহে ভালো", changeEn: "↑ Good this week", up: true, icon: "lucide:bar-chart-2", color: "var(--green)", bg: "var(--green-light)" },
]
const activities = [
  { icon: "lucide:file-check", bg: "var(--teal-light)", color: "var(--teal)", bn: "রাহুল কুমার Physics অ্যাসাইনমেন্ট জমা দিয়েছে", en: "Rahul Kumar submitted Physics assignment", tbn: "২ মিনিট আগে", ten: "2 mins ago" },
  { icon: "lucide:credit-card", bg: "var(--amber-light)", color: "var(--amber)", bn: "নিশা দাসের অভিভাবক টার্ম ২ ফি পরিশোধ করেছেন", en: "Parent of Nisha Das paid Term 2 fees", tbn: "১৮ মিনিট আগে", ten: "18 mins ago" },
  { icon: "lucide:clipboard-list", bg: "var(--brand-light)", color: "var(--brand)", bn: "গ্রেড ১০ এর পরীক্ষার সময়সূচি প্রকাশিত", en: "Exam schedule for Grade 10 published", tbn: "১ ঘণ্টা আগে", ten: "1 hour ago" },
  { icon: "lucide:user-plus", bg: "var(--green-light)", color: "var(--green)", bn: "নতুন ভর্তি: আনিকা রায়, গ্রেড ৭ C", en: "New admission: Anika Roy, Grade 7 C", tbn: "৫ ঘণ্টা আগে", ten: "5 hours ago" },
]
const events = [
  { bn: "বার্ষিক পরীক্ষা শুরু", en: "Annual Exam begins", dbn: "২০ মে", den: "May 20", color: "var(--red)", bg: "var(--red-light)", icon: "lucide:clipboard-list" },
  { bn: "অভিভাবক-শিক্ষক সভা", en: "Parent-Teacher Meeting", dbn: "২৪ মে", den: "May 24", color: "var(--amber)", bg: "var(--amber-light)", icon: "lucide:users" },
  { bn: "বিজ্ঞান মেলা ২০২৬", en: "Science Fair 2026", dbn: "২ জুন", den: "Jun 2", color: "var(--teal)", bg: "var(--teal-light)", icon: "lucide:flask-conical" },
  { bn: "টার্ম ২ ফলাফল", en: "Term 2 Result", dbn: "১৫ জুন", den: "Jun 15", color: "var(--brand)", bg: "var(--brand-light)", icon: "lucide:award" },
]
const topStudents = [
  { name: "Tariq Islam",  cls: "Grade 10 A", score: "97%", av: "TI", color: "#6366f1" },
  { name: "Priya Sen",    cls: "Grade 10 B", score: "94%", av: "PS", color: "#0ea5e9" },
  { name: "Rahul Kumar",  cls: "Grade 9 A",  score: "91%", av: "RK", color: "#f59e0b" },
  { name: "Nisha Das",    cls: "Grade 8 B",  score: "89%", av: "ND", color: "#10b981" },
]
const overviews = [
  { bn: "আজকের উপস্থিতি", en: "Today's Attendance", val: "92%", bar: 92, icon: "lucide:calendar-check", color: "var(--green)" },
  { bn: "ফি সংগ্রহ", en: "Fee Collection", val: "82%", bar: 82, icon: "lucide:landmark", color: "var(--brand)" },
  { bn: "অ্যাসাইনমেন্ট জমা", en: "Assignments", val: "89%", bar: 89, icon: "lucide:file-check", color: "var(--teal)" },
  { bn: "পরীক্ষার প্রস্তুতি", en: "Exam Readiness", val: "74%", bar: 74, icon: "lucide:clipboard-list", color: "var(--amber)" },
]
const todaysEmployeesAbsent = [
  { name: 'Ayesha Rahman', role: 'Registrar' },
  { name: 'Md. Karim', role: 'Physics Teacher' },
  { name: 'Sultana Begum', role: 'Librarian' },
  { name: 'Rafiq Hossain', role: 'Math Teacher' },
  { name: 'Fatema Begum', role: 'Admin Staff' },
]

const todaysStudentsAbsent = [
  { name: 'Anika Roy', cls: 'Grade 7 C' },
  { name: 'Tariq Islam', cls: 'Grade 10 A' },
  { name: 'Rahul Kumar', cls: 'Grade 9 A' },
  { name: 'Nisha Das', cls: 'Grade 8 B' },
  { name: 'Sakib Hasan', cls: 'Grade 6 A' },
  { name: 'Maliha Khan', cls: 'Grade 10 B' },
  { name: 'Arif Rahman', cls: 'Grade 7 A' },
  { name: 'Tasnim Ahmed', cls: 'Grade 9 C' },
]


export default function DashboardPage() {
  const { language } = useAppStore()
  const { isMobile, isTablet } = useWindowSize()
  const isBn = language === "bn"

  useReveal('.reveal', 50)

  const col4 = isMobile ? "1fr 1fr" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)"
  const col2 = isMobile ? "1fr" : "1fr 1fr"
  const gap = isMobile ? "10px" : "14px"

  const card: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: isMobile ? "14px" : "18px",
    boxShadow: "var(--shadow-sm)",
  }

  const sectionHead = (color: string) => (
    <div style={{ width: "4px", height: "16px", background: color, borderRadius: "4px" }} />
  )

  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: gap }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 600, color: "var(--text-primary)" }}>
            {isBn ? "সুপ্রভাত, Admin 👋" : "Good morning, Admin 👋"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {isBn ? "শুক্রবার, ৮ মে ২০২৬ · টার্ম ২" : "Friday, 8 May 2026 · Term 2"}
          </p>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "9px", background: "var(--bg-primary)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" }}>
              <Icon icon="lucide:download" width={14} /> Export
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "9px", background: "var(--brand)", border: "none", fontSize: "13px", color: "#fff", fontFamily: "inherit", fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
              <Icon icon="lucide:plus" width={14} />
              {isBn ? "নতুন" : "Add New"}
            </button>
          </div>
        )}
      </div>

      {/* Alert */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--brand-light)", border: "1px solid var(--brand)", borderRadius: "30px", padding: "6px 14px", fontSize: "12px", color: "var(--brand)", alignSelf: "flex-start", fontWeight: 500, flexWrap: "wrap" }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)", animation: "pulse 2s infinite", flexShrink: 0 }} />
        {isBn ? "৩টি ফি রিমাইন্ডার · পরীক্ষা ২০ মে" : "3 fee reminders · Exams May 20"}
      </div>

      {/* Stat cards */}
      <div className="card--grid" style={{ display: "grid", gridTemplateColumns: col4, gap }}>
        {stats.map(s => (
          <div key={s.labelEn} className="card--premium reveal" style={{ ...card, display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden", cursor: "default", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: s.color, borderRadius: "14px 14px 0 0" }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon icon={s.icon} width={17} style={{ color: s.color }} />
              </div>
              <Icon icon="lucide:more-horizontal" width={15} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px" }}>{isBn ? s.labelBn : s.labelEn}</div>
            </div>
            <div style={{ fontSize: "11px", color: s.up ? "var(--green)" : "var(--red)", display: "flex", alignItems: "center", gap: "3px", fontWeight: 500 }}>
              <Icon icon={s.up ? "lucide:trending-up" : "lucide:trending-down"} width={12} />
              {isBn ? s.changeBn : s.changeEn}
            </div>
          </div>
        ))}
      </div>

      {/* Activity + Events */}
      <div style={{ display: "grid", gridTemplateColumns: col2, gap }}>
        <div className="card--premium reveal" style={{ ...card, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {sectionHead("var(--brand)")}
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{isBn ? "সাম্প্রতিক কার্যক্রম" : "Recent Activity"}</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--brand)", cursor: "pointer", fontWeight: 500 }}>{isBn ? "সব →" : "All →"}</span>
          </div>
          {activities.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", padding: "9px 0", borderBottom: i < activities.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon icon={a.icon} width={14} style={{ color: a.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isBn ? a.bn : a.en}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{isBn ? a.tbn : a.ten}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card--premium reveal" style={{ ...card, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {sectionHead("var(--teal)")}
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{isBn ? "আসন্ন ইভেন্ট" : "Upcoming Events"}</span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--brand)", cursor: "pointer", fontWeight: 500 }}>{isBn ? "ক্যালেন্ডার →" : "Calendar →"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {events.map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border)", cursor: "pointer" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: ev.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon icon={ev.icon} width={15} style={{ color: ev.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isBn ? ev.bn : ev.en}
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: ev.color, background: ev.bg, padding: "3px 8px", borderRadius: "6px", flexShrink: 0 }}>
                  {isBn ? ev.dbn : ev.den}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Snapshot */}
      <div className="card--premium reveal" style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {sectionHead('var(--purple)')}
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{isBn ? 'আজকের সারসংক্ষেপ' : "Today's Snapshot"}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--brand)', cursor: 'pointer', fontWeight: 500 }}>{isBn ? 'বিস্তারিত →' : 'Details →'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: '12px' }}>
          {/* Student Absence */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <CircularChart value={Math.round((todaysStudentsAbsent.length / 1248) * 100)} size={90} stroke={9} color="var(--brand)" />
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>{isBn ? 'ছাত্র অনুপস্থিতি' : 'Students Absent'}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, maxHeight: '160px', overflowY: 'auto' }}>
              {todaysStudentsAbsent.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {s.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{s.cls}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Absence */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <CircularChart value={Math.round((todaysEmployeesAbsent.length / 96) * 100)} size={90} stroke={9} color="var(--teal)" />
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>{isBn ? 'কর্মী অনুপস্থিতি' : 'Employees Absent'}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, maxHeight: '160px', overflowY: 'auto' }}>
              {todaysEmployeesAbsent.map(e => (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {e.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{e.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top students + Overview */}
      <div style={{ display: "grid", gridTemplateColumns: col2, gap }}>
        <div className="card--premium reveal" style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {sectionHead("var(--amber)")}
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{isBn ? "শীর্ষ ছাত্র" : "Top Students"}</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--amber)", background: "var(--amber-light)", padding: "3px 9px", borderRadius: "6px" }}>
              {isBn ? "এই টার্ম" : "This Term"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {topStudents.map((s, i) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <span style={{ width: "20px", fontSize: "12px", fontWeight: 700, color: i === 0 ? "var(--amber)" : "var(--text-muted)", textAlign: "center" }}>{i + 1}</span>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.av}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.cls}</div>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)", background: "var(--green-light)", padding: "3px 8px", borderRadius: "6px" }}>{s.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card--premium reveal" style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            {sectionHead("var(--green)")}
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{isBn ? "দ্রুত পরিসংখ্যান" : "Quick Overview"}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {overviews.map(item => (
              <div key={item.en}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icon icon={item.icon} width={13} style={{ color: item.color }} />
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{isBn ? item.bn : item.en}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{item.val}</span>
                </div>
                <div style={{ height: "5px", background: "var(--bg-secondary)", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${item.bar}%`, background: item.color, borderRadius: "5px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}
