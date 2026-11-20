import React from 'react'
import type { PaymentMethodType } from '@/store/institutionPaymentStore'

import bkashLogo from '@/assets/gateways/bkash.svg'
import nagadLogo from '@/assets/gateways/nagad.png'
import rocketLogo from '@/assets/gateways/rocket.png'
import upayLogo from '@/assets/gateways/upay.png'
import bankLogo from '@/assets/gateways/bank.svg'

export interface PaymentMethodLogoProps {
  method: PaymentMethodType | string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  className?: string
  showText?: boolean
  textClassName?: string
  variant?: 'card' | 'badge' | 'icon-only' | 'raw'
}

export const GATEWAY_ASSETS: Record<
  string,
  {
    src: string
    name: string
    nameBn: string
    color: string
    bgLight: string
  }
> = {
  bkash: {
    src: bkashLogo,
    name: 'bKash',
    nameBn: 'বিকাশ',
    color: '#D12053',
    bgLight: 'rgba(209, 32, 83, 0.08)',
  },
  nagad: {
    src: nagadLogo,
    name: 'Nagad',
    nameBn: 'নগদ',
    color: '#F7941D',
    bgLight: 'rgba(247, 148, 29, 0.08)',
  },
  rocket: {
    src: rocketLogo,
    name: 'Rocket',
    nameBn: 'রকেট',
    color: '#8C3494',
    bgLight: 'rgba(140, 52, 148, 0.08)',
  },
  upay: {
    src: upayLogo,
    name: 'Upay',
    nameBn: 'উপায়',
    color: '#005696',
    bgLight: 'rgba(0, 86, 150, 0.08)',
  },
  bank: {
    src: bankLogo,
    name: 'Bank Transfer',
    nameBn: 'ব্যাংক ট্রান্সফার',
    color: '#059669',
    bgLight: 'rgba(5, 150, 105, 0.08)',
  },
}

export const PaymentMethodLogo: React.FC<PaymentMethodLogoProps> = ({
  method,
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
  variant = 'icon-only',
}) => {
  const norm = (method || 'bkash').toLowerCase()
  const info = GATEWAY_ASSETS[norm] || GATEWAY_ASSETS.bank

  const dim = getDimensions(size)

  if (variant === 'raw') {
    return (
      <img
        src={info.src}
        alt={info.name}
        className={`object-contain ${className}`}
        style={{ height: `${dim.height}px`, maxWidth: `${dim.width * 2}px` }}
        loading="lazy"
      />
    )
  }

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.75rem] font-bold shadow-2xs border ${className}`}
        style={{
          backgroundColor: info.bgLight,
          color: info.color,
          borderColor: `${info.color}35`,
        }}
      >
        <div
          className="bg-white rounded-md p-0.5 flex items-center justify-center shrink-0 shadow-2xs"
          style={{ width: `${dim.height + 4}px`, height: `${dim.height}px` }}
        >
          <img
            src={info.src}
            alt={info.name}
            className="w-full h-full object-contain"
          />
        </div>
        {showText && <span className={textClassName}>{info.name}</span>}
      </span>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl bg-white border border-[var(--border)] p-2 shadow-xs transition-transform duration-200 hover:scale-105 ${className}`}
        style={{ width: `${dim.width}px`, height: `${dim.height}px` }}
      >
        <img
          src={info.src}
          alt={info.name}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    )
  }

  // Default: 'icon-only' with clean white background container for high contrast & elegance
  const container = (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-white border border-[var(--border)]/70 shadow-2xs p-1 shrink-0 overflow-hidden ${className}`}
      style={{
        width: `${dim.width}px`,
        height: `${dim.height}px`,
      }}
    >
      <img
        src={info.src}
        alt={info.name}
        className="max-h-full max-w-full object-contain select-none"
      />
    </div>
  )

  if (showText) {
    return (
      <div className="inline-flex items-center gap-2">
        {container}
        <span className={`font-bold text-[0.875rem] text-[var(--text-primary)] ${textClassName}`}>
          {info.name}
        </span>
      </div>
    )
  }

  return container
}

function getDimensions(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number): { width: number; height: number } {
  if (typeof size === 'number') {
    return { width: Math.round(size * 1.4), height: size }
  }
  switch (size) {
    case 'xs':
      return { width: 28, height: 18 }
    case 'sm':
      return { width: 38, height: 24 }
    case 'md':
      return { width: 56, height: 34 }
    case 'lg':
      return { width: 76, height: 44 }
    case 'xl':
      return { width: 96, height: 54 }
    default:
      return { width: 56, height: 34 }
  }
}
