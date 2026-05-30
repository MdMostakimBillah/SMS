import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  change?: string
  changeType?: "up" | "down"
  icon: ReactNode
  iconBg?: string
}

export default function StatCard({
  label,
  value,
  change,
  changeType = "up",
  icon,
  iconBg = "var(--brand-light)",
}: StatCardProps) {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        border: "0.5px solid var(--border)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginTop: "4px",
          }}
        >
          {label}
        </div>
      </div>

      {/* Change */}
      {change && (
        <div
          style={{
            fontSize: "12px",
            color: changeType === "up" ? "var(--green)" : "var(--red)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {changeType === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {change}
        </div>
      )}
    </div>
  )
}
