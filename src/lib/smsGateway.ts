/**
 * Shared Bangladesh Bulk SMS Helpers & Provider Presets
 * ====================================================
 * All live HTTP calls run strictly server-side (`/api/sms/*`) so provider
 * API keys are encrypted in PostgreSQL and never exposed to browser clients.
 */

export type BdSmsProviderType =
  | 'bulksmsbd'
  | 'smsnetbd'
  | 'greenweb'
  | 'mimsms'
  | 'sslwireless'
  | 'sim_gateway'
  | 'http_api'
  | 'custom'

export interface SMSGatewayOptions {
  providerName: string
  providerType: BdSmsProviderType
  apiUrl: string
  senderId: string
  username?: string
  isActive: boolean
  hasApiKey?: boolean
  maskedApiKey?: string
  hasPassword?: boolean
  /** Write-only fields submitted in forms; never persisted or returned by API. */
  apiKey?: string
  password?: string
}

export interface SendSMSResult {
  success: boolean
  messageId: string
  status: 'sent' | 'delivered' | 'failed'
  segmentsUsed?: number
  providerResponse?: string
  error?: string
}

export interface BdSmsProviderPreset {
  type: BdSmsProviderType
  name: string
  nameBn: string
  defaultApiUrl: string
  sampleRateBdt: string
  supportsBalanceCheck: boolean
  requiresUsername: boolean
  hint: string
  hintBn: string
}

export const BD_SMS_PROVIDER_PRESETS: BdSmsProviderPreset[] = [
  {
    type: 'bulksmsbd',
    name: 'BulkSMSBD (Recommended)',
    nameBn: 'BulkSMSBD (সুপারিশকৃত)',
    defaultApiUrl: 'https://bulksmsbd.net/api/smsapi',
    sampleRateBdt: '~৳0.28–0.35 (Non-Masking) / ~৳0.48–0.55 (Masking)',
    supportsBalanceCheck: true,
    requiresUsername: false,
    hint: 'Supports JSON bulk & instant Non-Masking setup with live getBalanceApi.',
    hintBn: 'তাৎক্ষণিক Non-Masking সেটআপ, বাংলা Unicode ও লাইভ ব্যালেন্স চেক সুবিধা।',
  },
  {
    type: 'smsnetbd',
    name: 'Alpha Net (sms.net.bd)',
    nameBn: 'আলফা নেট (sms.net.bd)',
    defaultApiUrl: 'https://api.sms.net.bd/sendsms',
    sampleRateBdt: '~৳0.25–0.35 (Tiered BD)',
    supportsBalanceCheck: true,
    requiresUsername: false,
    hint: 'Reliable transactional & OTP gateway via api.sms.net.bd.',
    hintBn: 'নির্ভরযোগ্য ট্রানজেকশনাল ও OTP এসএমএস গেটওয়ে।',
  },
  {
    type: 'greenweb',
    name: 'GreenWeb BD',
    nameBn: 'গ্রীনওয়েব বাংলাদেশ',
    defaultApiUrl: 'https://api.greenweb.com.bd/api.php',
    sampleRateBdt: '~৳0.28–0.32 (Non-Masking)',
    supportsBalanceCheck: true,
    requiresUsername: false,
    hint: 'Popular school SMS gateway with token auth & live g_api balance check.',
    hintBn: 'শিক্ষাপ্রতিষ্ঠানে বহুল ব্যবহৃত বাংলাদেশি বাল্ক এসএমএস গেটওয়ে।',
  },
  {
    type: 'mimsms',
    name: 'MiMSMS (V2 REST)',
    nameBn: 'MiMSMS (V2 API)',
    defaultApiUrl: 'https://api.mimsms.com/api/SmsSending/SMS',
    sampleRateBdt: '~৳0.25–0.30 (Volume Pack)',
    supportsBalanceCheck: true,
    requiresUsername: true,
    hint: 'Requires registered MiMSMS email (Username) + API Key.',
    hintBn: 'নিবন্ধিত MiMSMS ইমেইল ও API Key প্রয়োজন।',
  },
  {
    type: 'sslwireless',
    name: 'SSL Wireless (SMSPlus v3)',
    nameBn: 'SSL Wireless (SMSPlus v3)',
    defaultApiUrl: 'https://smsplus.sslwireless.com/api/v3/send-sms',
    sampleRateBdt: 'Enterprise Corporate Slabs',
    supportsBalanceCheck: true,
    requiresUsername: false,
    hint: 'Enterprise high-TPS banking gateway with csms_id reconciliation.',
    hintBn: 'এন্টারপ্রাইজ ও ব্যাংকিং মানের হাই-স্পিড কর্পোরেট গেটওয়ে।',
  },
  {
    type: 'custom',
    name: 'Custom HTTPS / GSM SIM Bridge',
    nameBn: 'কাস্টম HTTPS / লোকাল সিম গেটওয়ে',
    defaultApiUrl: '',
    sampleRateBdt: 'Self-hosted / Custom SIM',
    supportsBalanceCheck: false,
    requiresUsername: false,
    hint: 'Send JSON POST { phone, message, senderId } to your custom bridge endpoint.',
    hintBn: 'নিজস্ব HTTP/GSM সিম গেটওয়ে সার্ভারে JSON POST রিকোয়েস্ট পাঠান।',
  },
]

export function getProviderPreset(type: BdSmsProviderType): BdSmsProviderPreset {
  return BD_SMS_PROVIDER_PRESETS.find((p) => p.type === type) || BD_SMS_PROVIDER_PRESETS[0]
}

/** Normalizes mobile numbers to Bangladesh `8801XXXXXXXXX` format. */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+880')) return cleaned.slice(1)
  if (cleaned.startsWith('880')) return cleaned
  if (cleaned.startsWith('01') && cleaned.length === 11) return `88${cleaned}`
  return cleaned.replace(/^\+/, '')
}

/** Validates standard Bangladesh operator numbers (`013`–`019`). */
export function isValidBdPhone(raw: string): boolean {
  return /^8801[3-9]\d{8}$/.test(normalizePhoneNumber(raw))
}

/** Formats phone number cleanly for tables/audit views (e.g., `01711-000000`). */
export function formatPhoneDisplay(raw: string): string {
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('880')) digits = digits.slice(2)
  if (digits.length === 11) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return raw
}

/** Detects Bangla or any non-ASCII Unicode characters requiring UCS-2 SMS encoding. */
export function isBanglaOrUnicode(text: string): boolean {
  return /[^\x20-\x7E\r\n]/.test(text)
}

/**
 * Exact BTRC / GSM SMS credit segmentation:
 * - English (GSM-7): 160 chars single part, 153 chars/part multi-part
 * - Bangla (Unicode): 70 chars single part, 67 chars/part multi-part
 */
export function calculateSmsSegments(message: string): {
  isUnicode: boolean
  chars: number
  singleLimit: number
  multiLimit: number
  segments: number
} {
  const chars = Array.from(message).length
  const isUnicode = isBanglaOrUnicode(message)
  const singleLimit = isUnicode ? 70 : 160
  const multiLimit = isUnicode ? 67 : 153
  const segments = chars === 0 ? 1 : chars <= singleLimit ? 1 : Math.ceil(chars / multiLimit)
  return { isUnicode, chars, singleLimit, multiLimit, segments }
}
