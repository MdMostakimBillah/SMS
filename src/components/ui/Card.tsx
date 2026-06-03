import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function Card({ children, style, className, ...rest }: CardProps) {
  const classes = `card ${className ? className : ''} reveal`.trim()
  return (
    <div
      className={classes}
      {...rest}
      style={{
        background: 'var(--bg-primary)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
