import { Icon } from "@iconify/react"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import StatCard from "@/components/shared/StatCard"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"

// Activity feed এর data
const activities = [
  {
    id: 1,
    icon: "lucide:file-check",
    iconBg: "var(--teal-light)",
    iconColor: "var(--teal)",
    text: "রাহুল কুমার Physics Chapter 7 অ্যাসাইনমেন্ট জমা দিয়েছে",
    textEn: "Rahul Kumar submitted Physics Chapter 7 assignment",
    time: "২ মিনিট আগে",
    timeEn: "2 mins ago",
  },
  {
    id: 2,
    icon: "lucide:credit-card",
    iconBg: "var(--amber-light)",
    iconColor: "var(--amber)",
    text: "নিশা দাসের অভিভাবক টার্ম ২ ফি পরিশোধ করেছেন (৳১২,৫০০)",
    textEn: "Parent of Nisha Das paid Term 2 fees (৳12,500)",
    time: "১৮ মিনিট আগে",
    timeEn: "18 mins ago",
  },
  {
    id: 3,
    icon: "lucide:clipboard-list",
    iconBg: "var(--brand-light)",
    iconColor: "var(--brand)",
    text: "গ্রেড ১০ এর পরীক্ষার সময়সূচি প্রকাশিত হয়েছে",
    textEn: "Exam schedule for Grade 10 published",
    time: "১ ঘণ্টা আগে",
    timeEn: "1 hour ago",
  },
  {
    id: 4,
    icon: "lucide:building-2",
    iconBg: "var(--teal-light)",
    iconColor: "var(--teal)",
    text: "তারিক ইসলামের হোস্টেল রুম বরাদ্দ নিশ্চিত হয়েছে (Block B-204)",
    textEn: "Tariq Islam hostel room confirmed (Block B-204)",
    time: "৩ ঘণ্টা আগে",
    timeEn: "3 hours ago",
  },
  {
    id: 5,
    icon: "lucide:user-plus",
    iconBg: "var(--green-light)",
    iconColor: "var(--green)",
    text: "নতুন ভর্তি: আনিকা রায়, গ্রেড ৭ সেকশন C",
    textEn: "New admission: Anika Roy, Grade 7 Section C",
    time: "৫ ঘণ্টা আগে",
    timeEn: "5 hours ago",
  },
]

// Upcoming events এর data
const events = [
  {
    id: 1,
    title: "বার্ষিক পরীক্ষা শুরু",
    titleEn: "Annual Exam begins",
    sub: "গ্রেড ৯ ও ১০",
    subEn: "Grade 9 & 10",
    date: "২০ মে",
    dateEn: "May 20",
    color: "var(--red)",
    bg: "var(--red-light)",
  },
  {
    id: 2,
    title: "অভিভাবক-শিক্ষক সভা",
    titleEn: "Parent-Teacher Meeting",
    sub: "সকল সেকশন",
    subEn: "All sections",
    date: "২৪ মে",
    dateEn: "May 24",
    color: "var(--amber)",
    bg: "var(--amber-light)",
  },
  {
    id: 3,
    title: "বিজ্ঞান মেলা ২০২৬",
    titleEn: "Science Fair 2026",
    sub: "অডিটোরিয়াম",
    subEn: "Auditorium",
    date: "২ জুন",
    dateEn: "Jun 2",
    color: "var(--teal)",
    bg: "var(--teal-light)",
  },
  {
    id: 4,
    title: "টার্ম ২ ফলাফল প্রকাশ",
    titleEn: "Term 2 Result Published",
    sub: "সকল ক্লাস",
    subEn: "All classes",
    date: "১৫ জুন",
    dateEn: "Jun 15",
    color: "var(--brand)",
    bg: "var(--brand-light)",
  },
]

// Top students data
const topStudents = [
  { id: 1, name: "Tariq Islam",  class: "Grade 10 A", score: "97%", avatar: "TI", color: "#534AB7" },
  { id: 2, name: "Priya Sen",    class: "Grade 10 B", score: "94%", avatar: "PS", color: "#1D9E75" },
  { id: 3, name: "Rahul Kumar",  class: "Grade 9 A",  score: "91%", avatar: "RK", color: "#BA7517" },
  { id: 4, name: "Nisha Das",    class: "Grade 8 B",  score: "89%", avatar: "ND", color: "#E24B4A" },
]

export default function DashboardPage() {
  const { language } = useAppStore()
  const isBn = language === "bn"

  return (
    <div>

      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            {isBn ? "সুপ্রভাত, Admin 👋" : "Good morning, Admin 👋"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>
            {isBn
              ? "শুক্রবার, ৮ মে ২০২৬ · টার্ম ২, সপ্তাহ ১৪"
              : "Friday, 8 May 2026 · Term 2, Week 14"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "var(--bg-primary)",
              border: "0.5px solid var(--border)",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--text-secondary)",
              fontFamily: "inherit",
            }}
          >
            <Icon icon="lucide:download" width={14} />
            {isBn ? "Export" : "Export"}
          </button>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "var(--brand)",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "#fff",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            <Icon icon="lucide:plus" width={14} />
            {isBn ? "নতুন যোগ করুন" : "Quick Add"}
          </button>
        </div>
      </div>

      {/* Notification pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--brand-light)",
          border: "0.5px solid var(--brand)",
          borderRadius: "20px",
          padding: "5px 12px",
          fontSize: "12px",
          color: "var(--brand)",
          marginBottom: "20px",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--brand)",
            animation: "pulse 2s infinite",
          }}
        />
        {isBn
          ? "৩টি ফি রিমাইন্ডার পাঠানো হয়েছে · বার্ষিক পরীক্ষা শুরু ২০ মে · নতুন ভর্তি: আনিকা রায়"
          : "3 fee reminders sent · Annual exams start May 20 · New admission: Anika Roy"}
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          label={isBn ? "মোট ছাত্র" : "Total Students"}
          value="১,২৪৮"
          change={isBn ? "গত টার্মের চেয়ে ১২% বেশি" : "12% from last term"}
          changeType="up"
          icon="lucide:users"
          iconColor="var(--brand)"
          iconBg="var(--brand-light)"
        />
        <StatCard
          label={isBn ? "শিক্ষক ও স্টাফ" : "Teachers & Staff"}
          value="৯৬"
          change={isBn ? "এই মাসে ৩ জন নতুন" : "3 new this month"}
          changeType="up"
          icon="lucide:graduation-cap"
          iconColor="var(--teal)"
          iconBg="var(--teal-light)"
        />
        <StatCard
          label={isBn ? "ফি সংগ্রহ" : "Fees Collected"}
          value="৳৮২L"
          change={isBn ? "৪% বকেয়া আছে" : "4% outstanding"}
          changeType="down"
          icon="lucide:landmark"
          iconColor="var(--amber)"
          iconBg="var(--amber-light)"
        />
        <StatCard
          label={isBn ? "গড় উপস্থিতি" : "Avg Attendance"}
          value="৯২.৪%"
          change={isBn ? "এই সপ্তাহে ১.২% বেশি" : "1.2% up this week"}
          changeType="up"
          icon="lucide:bar-chart-2"
          iconColor="var(--green)"
          iconBg="var(--green-light)"
        />
      </div>

      {/* Middle row — Activity + Events */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        {/* Recent Activity */}
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
              {isBn ? "সাম্প্রতিক কার্যক্রম" : "Recent Activity"}
            </span>
            <span
              style={{ fontSize: "12px", color: "var(--brand)", cursor: "pointer" }}
            >
              {isBn ? "সব দেখুন →" : "View all →"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {activities.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "8px 0",
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: item.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon icon={item.icon} width={14} style={{ color: item.iconColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isBn ? item.text : item.textEn}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {isBn ? item.time : item.timeEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
              {isBn ? "আসন্ন ইভেন্ট" : "Upcoming Events"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--brand)", cursor: "pointer" }}>
              {isBn ? "ক্যালেন্ডার →" : "Calendar →"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {/* Date badge */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    background: event.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    flexDirection: "column",
                  }}
                >
                  <Icon icon="lucide:calendar" width={16} style={{ color: event.color }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isBn ? event.title : event.titleEn}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {isBn ? event.sub : event.subEn}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: event.color,
                    background: event.bg,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    flexShrink: 0,
                  }}
                >
                  {isBn ? event.date : event.dateEn}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row — Top Students + Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}
      >
        {/* Top Students */}
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
              {isBn ? "শীর্ষ ছাত্র" : "Top Students"}
            </span>
            <Badge variant="info">{isBn ? "এই টার্ম" : "This Term"}</Badge>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topStudents.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px",
                  borderRadius: "8px",
                  background: "var(--bg-secondary)",
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    width: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: i === 0 ? "var(--amber)" : "var(--text-muted)",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: s.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {s.avatar}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.class}</div>
                </div>

                {/* Score */}
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)" }}>
                  {s.score}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Overview */}
        <Card>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "14px" }}>
            {isBn ? "দ্রুত পরিসংখ্যান" : "Quick Overview"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                label: isBn ? "আজকের উপস্থিতি" : "Today's Attendance",
                value: "92%",
                icon: "lucide:calendar-check",
                color: "var(--green)",
                bg: "var(--green-light)",
                bar: 92,
              },
              {
                label: isBn ? "ফি সংগ্রহ" : "Fee Collection",
                value: "82%",
                icon: "lucide:landmark",
                color: "var(--brand)",
                bg: "var(--brand-light)",
                bar: 82,
              },
              {
                label: isBn ? "অ্যাসাইনমেন্ট জমা" : "Assignment Submission",
                value: "89%",
                icon: "lucide:file-check",
                color: "var(--teal)",
                bg: "var(--teal-light)",
                bar: 89,
              },
              {
                label: isBn ? "পরীক্ষার প্রস্তুতি" : "Exam Readiness",
                value: "74%",
                icon: "lucide:clipboard-list",
                color: "var(--amber)",
                bg: "var(--amber-light)",
                bar: 74,
              },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: item.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon icon={item.icon} width={12} style={{ color: item.color }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                    {item.value}
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "var(--border-2)",
                    borderRadius: "2px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${item.bar}%`,
                      background: item.color,
                      borderRadius: "2px",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

    </div>
  )
}
