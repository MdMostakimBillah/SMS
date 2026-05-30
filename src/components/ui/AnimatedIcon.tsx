import React from 'react'

interface Props { children?: React.ReactNode; className?: string }

export default function AnimatedIcon({ children, className }: Props) {
  return (
    <div className={`icon-animated ${className || ''}`.trim()}>
      <div className="icon-anim-svg" style={{ width: 22, height: 22 }}>{children}</div>
    </div>
  )
}
