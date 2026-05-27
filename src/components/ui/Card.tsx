interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        border: "0.5px solid var(--border)",
        borderRadius: "12px",
        padding: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
