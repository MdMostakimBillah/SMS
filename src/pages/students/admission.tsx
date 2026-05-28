import { useNavigate } from "react-router-dom"
import { Icon } from "@iconify/react"
import { useAppStore } from "@/store/appStore"

export default function StudentAdmission() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const isBn = language === "bn"

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <button
          onClick={() => navigate("/students")}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "6px 12px", borderRadius: "8px",
            background: "var(--bg-primary)",
            border: "0.5px solid var(--border)",
            cursor: "pointer", fontSize: "13px",
            color: "var(--text-secondary)", fontFamily: "inherit",
          }}
        >
          <Icon icon="lucide:arrow-left" width={14} />
          {isBn ? "ফিরে যান" : "Back"}
        </button>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>
          {isBn ? "নতুন ভর্তি" : "New Admission"}
        </h1>
      </div>
      <div style={{
        background: "var(--bg-primary)", border: "0.5px solid var(--border)",
        borderRadius: "12px", padding: "40px", textAlign: "center",
        color: "var(--text-muted)",
      }}>
        <Icon icon="lucide:user-plus" width={40} style={{ marginBottom: "12px", opacity: 0.4 }} />
        <div style={{ fontSize: "16px", fontWeight: 500 }}>
          {isBn ? "ভর্তি ফর্ম শীঘ্রই আসছে" : "Admission form coming soon"}
        </div>
      </div>
    </div>
  )
}
