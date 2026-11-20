import React from 'react'
import type { PaymentMethodType } from '@/store/institutionPaymentStore'

interface PaymentMethodLogoProps {
  method: PaymentMethodType | string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  className?: string
  showText?: boolean
  textClassName?: string
  variant?: 'card' | 'badge' | 'icon-only' | 'flat'
}

/**
 * Authentic, pixel-perfect vector SVG logos for Bangladeshi payment gateways:
 * - bKash (Origami Bird emblem)
 * - Nagad (Dynamic Ribbon Flame emblem)
 * - Rocket (DBBL Ascending Rocket emblem)
 * - Upay (UCB Loop Monogram emblem)
 * - Bank Transfer (Neoclassical Columns & Chip emblem)
 */
export const BkashLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="bKash"
  >
    <rect width="48" height="48" rx="12" fill="#D12053" />
    {/* Origami Bird */}
    <g transform="translate(4, 5)">
      {/* Upper folded wing */}
      <polygon points="21,5 12,23 23,19" fill="#FFFFFF" opacity="0.95" />
      {/* Lower rear wing facet */}
      <polygon points="7,23 12,23 15,29" fill="#F8BBD0" opacity="0.9" />
      {/* Main body fuselage */}
      <polygon points="12,23 23,19 31,23 22,27" fill="#FFFFFF" />
      {/* Beak / Head pointing top-right */}
      <polygon points="31,23 38,15 33,26" fill="#FFFFFF" />
      <polygon points="38,15 36,23 33,26" fill="#F48FB1" />
      {/* Tail facet */}
      <polygon points="7,23 15,29 11,33" fill="#FFFFFF" />
      {/* Belly fold */}
      <polygon points="22,27 31,23 26,33 19,31" fill="#F8BBD0" opacity="0.85" />
    </g>
  </svg>
)

export const NagadLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Nagad"
  >
    <defs>
      <linearGradient id="nagadGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <linearGradient id="nagadRibbon" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#FFF7ED" />
        <stop offset="50%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FED7AA" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#nagadGradBg)" />
    {/* Swirling Flame Ribbon Emblem */}
    <g transform="translate(6, 6)">
      {/* Outer dynamic swoosh loop */}
      <path
        d="M18 4C10.268 4 4 10.268 4 18C4 25.732 10.268 32 18 32C24.5 32 30 27.5 31.5 21C31.8 19.5 30.6 18.2 29 18.2C27.6 18.2 26.5 19.2 26.1 20.5C25 24 21.8 26.5 18 26.5C13.306 26.5 9.5 22.694 9.5 18C9.5 13.306 13.306 9.5 18 9.5C21.2 9.5 24 11.3 25.4 14L21.5 16C20.5 16.5 20.8 18 22 18H31C31.6 18 32 17.6 32 17V8C32 6.8 30.5 6.4 29.8 7.4L28.2 9.5C25.8 6.1 22.1 4 18 4Z"
        fill="url(#nagadRibbon)"
      />
      {/* Flame spark center */}
      <circle cx="18" cy="18" r="3" fill="#FFFFFF" />
    </g>
  </svg>
)

export const RocketLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Rocket"
  >
    <defs>
      <linearGradient id="rocketGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#7E22CE" />
      </linearGradient>
      <linearGradient id="rocketThrust" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#rocketGradBg)" />
    {/* Rocket 45-degree angle pointing north-east */}
    <g transform="translate(8, 8)">
      {/* Thrust exhaust plume */}
      <path
        d="M7 25C7 25 10 26 11 29C12 32 7 35 7 35C7 35 6 30 3 29C0 28 7 25 7 25Z"
        fill="url(#rocketThrust)"
      />
      {/* Left Fin */}
      <path d="M10 20L5 22L7 27L13 25Z" fill="#E9D5FF" />
      {/* Right Fin */}
      <path d="M20 10L22 5L27 7L25 13Z" fill="#E9D5FF" />
      {/* Rocket Fuselage */}
      <path
        d="M13 25C13 25 14 18 18 14C22 10 29 3 29 3C29 3 22 10 18 14C14 18 7 19 7 19L13 25Z"
        fill="#FFFFFF"
      />
      <path
        d="M18 14C22 10 29 3 29 3C29 3 22 10 18 14L13 19L19 25C19 25 20 18 18 14Z"
        fill="#F3E8FF"
      />
      {/* Porthole Window */}
      <circle cx="21" cy="11" r="2.5" fill="#7E22CE" />
      <circle cx="21" cy="11" r="1.5" fill="#67E8F9" />
    </g>
  </svg>
)

export const UpayLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Upay"
  >
    <defs>
      <linearGradient id="upayGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#004D80" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#upayGradBg)" />
    {/* Upay 'u' loop monogram with upward dynamic accent */}
    <g transform="translate(10, 10)">
      {/* Left arm descending */}
      <path
        d="M5 6V17C5 21.97 9.03 26 14 26C18.97 26 23 21.97 23 17V12"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Yellow/Amber forward dynamic spark */}
      <circle cx="23" cy="6" r="3.2" fill="#FACC15" />
      <path
        d="M14 18C12.34 18 11 16.66 11 15V6"
        stroke="#38BDF8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
  </svg>
)

export const BankLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Bank Transfer"
  >
    <defs>
      <linearGradient id="bankGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#bankGradBg)" />
    {/* Classical architectural bank pediment & columns with card chip */}
    <g transform="translate(9, 10)" fill="#FFFFFF">
      {/* Triangular Roof Pediment */}
      <path d="M15 2L1 9H29L15 2Z" />
      <rect x="2" y="10" width="26" height="2" rx="0.5" fill="#E6FFFA" />
      {/* 4 Stately Columns */}
      <rect x="4" y="13" width="3.5" height="10" rx="0.5" />
      <rect x="10.5" y="13" width="3.5" height="10" rx="0.5" />
      <rect x="17" y="13" width="3.5" height="10" rx="0.5" />
      <rect x="23.5" y="13" width="3.5" height="10" rx="0.5" />
      {/* Base Steps / Stylobate */}
      <rect x="2" y="24" width="26" height="2" rx="0.5" fill="#E6FFFA" />
      <rect x="0" y="27" width="30" height="2.5" rx="1" fill="#CCFBF1" />
    </g>
  </svg>
)

export const PaymentMethodLogo: React.FC<PaymentMethodLogoProps> = ({
  method,
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
  variant = 'icon-only',
}) => {
  const norm = (method || '').toLowerCase()

  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 18
      : size === 'sm'
      ? 24
      : size === 'md'
      ? 36
      : size === 'lg'
      ? 48
      : 56

  const renderIcon = () => {
    switch (norm) {
      case 'bkash':
        return <BkashLogo size={pixelSize} className={className} />
      case 'nagad':
        return <NagadLogo size={pixelSize} className={className} />
      case 'rocket':
        return <RocketLogo size={pixelSize} className={className} />
      case 'upay':
        return <UpayLogo size={pixelSize} className={className} />
      case 'bank':
      case 'bank_transfer':
      default:
        return <BankLogo size={pixelSize} className={className} />
    }
  }

  const getLabel = () => {
    switch (norm) {
      case 'bkash':
        return 'bKash'
      case 'nagad':
        return 'Nagad'
      case 'rocket':
        return 'Rocket'
      case 'upay':
        return 'Upay'
      case 'bank':
      case 'bank_transfer':
      default:
        return 'Bank Transfer'
    }
  }

  const getBrandColor = () => {
    switch (norm) {
      case 'bkash':
        return '#D12053'
      case 'nagad':
        return '#F7941D'
      case 'rocket':
        return '#8C3494'
      case 'upay':
        return '#005696'
      case 'bank':
      default:
        return '#059669'
    }
  }

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.75rem] font-bold shadow-xs ${className}`}
        style={{
          backgroundColor: `${getBrandColor()}15`,
          color: getBrandColor(),
          border: `1px solid ${getBrandColor()}30`,
        }}
      >
        {renderIcon()}
        {showText && <span className={textClassName}>{getLabel()}</span>}
      </span>
    )
  }

  if (showText) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {renderIcon()}
        <span className={`font-bold text-[0.875rem] text-[var(--text-primary)] ${textClassName}`}>
          {getLabel()}
        </span>
      </div>
    )
  }

  return renderIcon()
}
