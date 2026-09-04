import React from 'react'
import { ArrowRight } from 'lucide-react'

interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  buttonText?: string
  onButtonClick?: () => void
  actionIcon?: React.ComponentType<{ size?: number; className?: string }>
}

export function EmptyState({
  icon,
  title,
  description,
  buttonText,
  onButtonClick,
  actionIcon,
}: EmptyStateProps) {
  const IconComponent = actionIcon || icon

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-6 flex-shrink-0">
        <IconComponent size={24} className="text-[var(--text-muted)]" />
      </div>

      <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h2>
      <p className="text-[var(--text-secondary)] mb-6">
        {description}
      </p>

      {buttonText && (
        <button
          onClick={onButtonClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[0.875rem] font-medium bg-[var(--brand)] text-white hover:shadow-md transition-all"
        >
          {buttonText}
          <ArrowRight size={14} className="ml-1" />
        </button>
      )}
    </div>
  )
}