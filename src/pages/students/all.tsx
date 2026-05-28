import { useNavigate } from "react-router-dom"
import { Icon } from "@iconify/react"
export default function Page() {
  const navigate = useNavigate()
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <button onClick={() => navigate("/students")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", background: "var(--bg-primary)", border: "0.5px solid var(--border)", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", fontFamily: "inherit" }}>
          <Icon icon="lucide:arrow-left" width={14} />Back
        </button>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>all</h1>
      </div>
      <div style={{ background: "var(--bg-primary)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        Coming soon...
      </div>
    </div>
  )
}
