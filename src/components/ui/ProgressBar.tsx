interface Props {
  value: number
  color?: string
}

export default function ProgressBar({ value, color = 'var(--primary)' }: Props) {
  return (
    <div className="progress-wrap">
      <div className="progress-bar" style={{ borderRadius: 10 }}>
        <div
          className="progress-fill"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.06))` }}
        />
      </div>
    </div>
  )
}
