import { randomBytes } from 'node:crypto'
import { sealSecret, unsealSecret } from './secretCrypto.js'

export type BdSmsProviderType =
  | 'bulksmsbd'
  | 'smsnetbd'
  | 'greenweb'
  | 'mimsms'
  | 'sslwireless'
  | 'custom'
  | 'sim_gateway'
  | 'http_api'

export interface StoredSmsGatewayConfig {
  providerName: string
  providerType: BdSmsProviderType
  apiUrl: string
  senderId: string
  username: string
  isActive: boolean
  apiKey: string
  password: string
}

export interface MaskedSmsGatewayConfig {
  providerName: string
  providerType: BdSmsProviderType
  apiUrl: string
  senderId: string
  username: string
  isActive: boolean
  hasApiKey: boolean
  maskedApiKey: string
  hasPassword: boolean
}

export interface DispatchOutcome {
  success: boolean
  status: 'delivered' | 'sent' | 'failed'
  providerMessageId?: string
  providerResponse?: string
  error?: string
}

export interface ProviderBalanceOutcome {
  success: boolean
  provider: string
  balanceText?: string
  balanceNumeric?: number | null
  currency?: string
  error?: string
}

export interface SmsSegmentInfo {
  isUnicode: boolean
  chars: number
  segments: number
}

const GATEWAY_CRYPTO_CONTEXT = 'super_admin_sms_gateway:aes-256-gcm:v1'
const GATEWAY_CRYPTO_AAD = 'system_config:super_admin_sms_gateway:v1'
const REQUEST_TIMEOUT_MS = 12_000

export const DEFAULT_PROVIDER_URLS: Record<BdSmsProviderType, { sendUrl: string; balanceUrl: string }> = {
  bulksmsbd: {
    sendUrl: 'https://bulksmsbd.net/api/smsapi',
    balanceUrl: 'https://bulksmsbd.net/api/getBalanceApi',
  },
  smsnetbd: {
    sendUrl: 'https://api.sms.net.bd/sendsms',
    balanceUrl: 'https://api.sms.net.bd/user/balance/',
  },
  greenweb: {
    sendUrl: 'https://api.greenweb.com.bd/api.php',
    balanceUrl: 'https://api.greenweb.com.bd/g_api.php',
  },
  mimsms: {
    sendUrl: 'https://api.mimsms.com/api/SmsSending/SMS',
    balanceUrl: 'https://api.mimsms.com/api/V2/BalanceCheck',
  },
  sslwireless: {
    sendUrl: 'https://smsplus.sslwireless.com/api/v3/send-sms',
    balanceUrl: 'https://smsplus.sslwireless.com/api/v3/balance',
  },
  custom: { sendUrl: '', balanceUrl: '' },
  sim_gateway: { sendUrl: '', balanceUrl: '' },
  http_api: { sendUrl: '', balanceUrl: '' },
}

export const DEFAULT_SMS_GATEWAY_CONFIG: StoredSmsGatewayConfig = {
  providerName: 'BulkSMSBD (Bangladesh)',
  providerType: 'bulksmsbd',
  apiUrl: DEFAULT_PROVIDER_URLS.bulksmsbd.sendUrl,
  senderId: '',
  username: '',
  isActive: false,
  apiKey: '',
  password: '',
}

export function resolveGatewayMasterKey(jwtSecret: string): string {
  return (process.env.SMS_GATEWAY_ENCRYPTION_KEY || '').trim() || jwtSecret
}

export function maskSecretValue(secret: string): string {
  const s = secret.trim()
  if (!s) return ''
  if (s.length <= 4) return '••••'
  return `••••${s.slice(-4)}`
}

export function normalizeBdPhone(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+880')) return cleaned.slice(1)
  if (cleaned.startsWith('880')) return cleaned
  if (cleaned.startsWith('01') && cleaned.length === 11) return `88${cleaned}`
  return cleaned.replace(/^\+/, '')
}

export function isValidBdPhone(normalized: string): boolean {
  return /^8801[3-9]\d{8}$/.test(normalized)
}

export function isBanglaOrUnicode(text: string): boolean {
  // Printable ASCII / basic GSM newline characters -> non-Unicode; Bangla or symbols -> UCS-2
  return /[^\x20-\x7E\r\n]/.test(text)
}

export function calculateSmsSegments(message: string): SmsSegmentInfo {
  const chars = Array.from(message).length
  const isUnicode = isBanglaOrUnicode(message)
  if (chars === 0) {
    return { isUnicode, chars: 0, segments: 1 }
  }
  const singleLimit = isUnicode ? 70 : 160
  const multiLimit = isUnicode ? 67 : 153
  const segments = chars <= singleLimit ? 1 : Math.ceil(chars / multiLimit)
  return { isUnicode, chars, segments }
}

export function validateProviderEndpointUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Invalid SMS API endpoint URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('SMS API endpoint must use HTTP or HTTPS')
  }
  const host = parsed.hostname.toLowerCase()
  // Reject cloud instance metadata SSRF targets
  if (host === '169.254.169.254' || host === 'metadata.google.internal' || host === '0.0.0.0') {
    throw new Error('Restricted endpoint host')
  }
  return parsed.toString()
}

export function sealGatewayConfigForDb(config: StoredSmsGatewayConfig, jwtSecret: string): string {
  const key = resolveGatewayMasterKey(jwtSecret)
  const payload = {
    v: 1,
    providerName: config.providerName.trim(),
    providerType: config.providerType,
    apiUrl: config.apiUrl.trim(),
    senderId: config.senderId.trim(),
    username: config.username.trim(),
    isActive: Boolean(config.isActive),
    apiKeyEnc: config.apiKey
      ? sealSecret(config.apiKey, key, GATEWAY_CRYPTO_CONTEXT, GATEWAY_CRYPTO_AAD)
      : '',
    passwordEnc: config.password
      ? sealSecret(config.password, key, GATEWAY_CRYPTO_CONTEXT, GATEWAY_CRYPTO_AAD)
      : '',
  }
  return JSON.stringify(payload)
}

export function unsealGatewayConfigFromDb(raw: string | null | undefined, jwtSecret: string): StoredSmsGatewayConfig {
  if (!raw) return { ...DEFAULT_SMS_GATEWAY_CONFIG }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const key = resolveGatewayMasterKey(jwtSecret)

    let apiKey = ''
    if (typeof parsed.apiKeyEnc === 'string' && parsed.apiKeyEnc) {
      const res = unsealSecret(parsed.apiKeyEnc, key, GATEWAY_CRYPTO_CONTEXT, GATEWAY_CRYPTO_AAD)
      apiKey = res.value || ''
    } else if (typeof parsed.apiKey === 'string') {
      apiKey = parsed.apiKey
    }

    let password = ''
    if (typeof parsed.passwordEnc === 'string' && parsed.passwordEnc) {
      const res = unsealSecret(parsed.passwordEnc, key, GATEWAY_CRYPTO_CONTEXT, GATEWAY_CRYPTO_AAD)
      password = res.value || ''
    } else if (typeof parsed.password === 'string') {
      password = parsed.password
    }

    const pType = (typeof parsed.providerType === 'string' ? parsed.providerType : 'bulksmsbd') as BdSmsProviderType
    const fallbackUrl = DEFAULT_PROVIDER_URLS[pType]?.sendUrl || ''

    return {
      providerName: typeof parsed.providerName === 'string' && parsed.providerName.trim()
        ? parsed.providerName.trim()
        : DEFAULT_SMS_GATEWAY_CONFIG.providerName,
      providerType: pType in DEFAULT_PROVIDER_URLS ? pType : 'bulksmsbd',
      apiUrl: typeof parsed.apiUrl === 'string' && parsed.apiUrl.trim() ? parsed.apiUrl.trim() : fallbackUrl,
      senderId: typeof parsed.senderId === 'string' ? parsed.senderId.trim() : '',
      username: typeof parsed.username === 'string' ? parsed.username.trim() : '',
      isActive: Boolean(parsed.isActive),
      apiKey,
      password,
    }
  } catch {
    return { ...DEFAULT_SMS_GATEWAY_CONFIG }
  }
}

export function maskGatewayConfig(config: StoredSmsGatewayConfig): MaskedSmsGatewayConfig {
  return {
    providerName: config.providerName,
    providerType: config.providerType,
    apiUrl: config.apiUrl,
    senderId: config.senderId,
    username: config.username,
    isActive: config.isActive,
    hasApiKey: Boolean(config.apiKey),
    maskedApiKey: maskSecretValue(config.apiKey),
    hasPassword: Boolean(config.password),
  }
}

function safeJsonParse(raw: string): Record<string, unknown> | unknown[] | null {
  try {
    return JSON.parse(raw) as Record<string, unknown> | unknown[]
  } catch {
    return null
  }
}

function truncateSafe(raw: string, maxLen = 220): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

export type FetchLike = typeof fetch

/**
 * Send one SMS message via the configured Bangladesh Bulk SMS provider.
 * Fails closed when disabled or missing API credentials — never spoofs delivery.
 */
export async function sendThroughBdProvider(
  params: { phone: string; message: string; config: StoredSmsGatewayConfig },
  fetchImpl: FetchLike = fetch
): Promise<DispatchOutcome> {
  const { config, message } = params
  const normalizedPhone = normalizeBdPhone(params.phone)

  if (!normalizedPhone || normalizedPhone.length < 10) {
    return { success: false, status: 'failed', error: 'Invalid recipient mobile number' }
  }
  if (!config.isActive) {
    return { success: false, status: 'failed', error: 'SMS gateway is disabled. Activate it in Super Admin settings.' }
  }

  const providerType = config.providerType
  const sendUrl = config.apiUrl.trim() || DEFAULT_PROVIDER_URLS[providerType]?.sendUrl || ''
  if (!sendUrl) {
    return { success: false, status: 'failed', error: 'SMS gateway API endpoint URL is not configured' }
  }
  validateProviderEndpointUrl(sendUrl)

  if (providerType !== 'custom' && providerType !== 'sim_gateway' && !config.apiKey.trim()) {
    return { success: false, status: 'failed', error: `API key / token is required for ${config.providerName}` }
  }

  const { isUnicode } = calculateSmsSegments(message)
  const localRef = `ET-${Date.now()}-${randomBytes(3).toString('hex')}`

  try {
    let res: Response

    if (providerType === 'bulksmsbd') {
      const form = new URLSearchParams({
        api_key: config.apiKey,
        senderid: config.senderId || '',
        number: normalizedPhone,
        message,
        type: isUnicode ? 'unicode' : 'text',
      })
      res = await fetchImpl(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const text = await res.text()
      const parsed = safeJsonParse(text)
      if (parsed && !Array.isArray(parsed)) {
        const code = Number(parsed.response_code)
        if (code === 202 || parsed.success_message) {
          return {
            success: true,
            status: 'delivered',
            providerMessageId: parsed.message_id ? String(parsed.message_id) : localRef,
            providerResponse: truncateSafe(String(parsed.success_message || 'Submitted (BulkSMSBD 202)')),
          }
        }
        return {
          success: false,
          status: 'failed',
          error: `BulkSMSBD error (${parsed.response_code ?? res.status}): ${String(parsed.error_message || truncateSafe(text))}`,
          providerResponse: truncateSafe(text),
        }
      }
      if (!res.ok) {
        return { success: false, status: 'failed', error: `BulkSMSBD HTTP ${res.status}: ${truncateSafe(text)}` }
      }
      return { success: true, status: 'sent', providerMessageId: localRef, providerResponse: truncateSafe(text) }
    }

    if (providerType === 'smsnetbd') {
      const form = new URLSearchParams({
        api_key: config.apiKey,
        msg: message,
        to: normalizedPhone,
        ...(config.senderId ? { sender_id: config.senderId } : {}),
      })
      res = await fetchImpl(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const text = await res.text()
      const parsed = safeJsonParse(text)
      if (parsed && !Array.isArray(parsed)) {
        if (Number(parsed.error) === 0) {
          const dataObj = (parsed.data && typeof parsed.data === 'object' ? parsed.data : {}) as Record<string, unknown>
          return {
            success: true,
            status: 'delivered',
            providerMessageId: dataObj.request_id ? String(dataObj.request_id) : localRef,
            providerResponse: truncateSafe(String(parsed.msg || 'Submitted (Alpha Net)')),
          }
        }
        return {
          success: false,
          status: 'failed',
          error: `Alpha Net error (${String(parsed.error)}): ${String(parsed.msg || truncateSafe(text))}`,
          providerResponse: truncateSafe(text),
        }
      }
      return res.ok
        ? { success: true, status: 'sent', providerMessageId: localRef, providerResponse: truncateSafe(text) }
        : { success: false, status: 'failed', error: `Alpha Net HTTP ${res.status}: ${truncateSafe(text)}` }
    }

    if (providerType === 'greenweb') {
      const form = new URLSearchParams({
        token: config.apiKey,
        to: normalizedPhone,
        message,
        json: '1',
      })
      res = await fetchImpl(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const text = await res.text()
      const parsed = safeJsonParse(text)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0] as Record<string, unknown>
        const st = String(first.status || '').toUpperCase()
        if (st === 'SENT' || st === 'OK') {
          return {
            success: true,
            status: 'delivered',
            providerMessageId: localRef,
            providerResponse: truncateSafe(String(first.statusmsg || 'SENT')),
          }
        }
        return {
          success: false,
          status: 'failed',
          error: `GreenWeb error: ${String(first.statusmsg || truncateSafe(text))}`,
          providerResponse: truncateSafe(text),
        }
      }
      if (res.ok && /^ok[:\s]/i.test(text.trim())) {
        return { success: true, status: 'delivered', providerMessageId: localRef, providerResponse: truncateSafe(text) }
      }
      return { success: false, status: 'failed', error: `GreenWeb error (${res.status}): ${truncateSafe(text)}` }
    }

    if (providerType === 'mimsms') {
      res = await fetchImpl(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserName: config.username,
          Apikey: config.apiKey,
          MobileNumber: normalizedPhone,
          CampaignId: 'null',
          SenderName: config.senderId || 'EduTech',
          TransactionType: 'T',
          Message: message,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const text = await res.text()
      const parsed = safeJsonParse(text)
      if (parsed && !Array.isArray(parsed)) {
        const statusCode = String(parsed.statusCode ?? '')
        const statusText = String(parsed.status || '').toLowerCase()
        if (statusCode === '200' || statusText === 'success' || String(parsed.Status ?? '') === '0') {
          return {
            success: true,
            status: 'delivered',
            providerMessageId: parsed.trxnId ? String(parsed.trxnId) : localRef,
            providerResponse: truncateSafe(String(parsed.responseResult || 'Success (MiMSMS)')),
          }
        }
        return {
          success: false,
          status: 'failed',
          error: `MiMSMS error: ${String(parsed.responseResult || truncateSafe(text))}`,
          providerResponse: truncateSafe(text),
        }
      }
      return res.ok
        ? { success: true, status: 'sent', providerMessageId: localRef, providerResponse: truncateSafe(text) }
        : { success: false, status: 'failed', error: `MiMSMS HTTP ${res.status}: ${truncateSafe(text)}` }
    }

    if (providerType === 'sslwireless') {
      res = await fetchImpl(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_token: config.apiKey,
          sid: config.senderId || 'EduTech',
          msisdn: normalizedPhone,
          sms: message,
          csms_id: localRef,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      const text = await res.text()
      const parsed = safeJsonParse(text)
      if (parsed && !Array.isArray(parsed)) {
        const ok =
          Number(parsed.status_code) === 200 ||
          String(parsed.status || '').toUpperCase() === 'SUCCESS'
        if (ok) {
          const infoArr = Array.isArray(parsed.smsinfo) ? parsed.smsinfo : []
          const refId =
            infoArr.length > 0 && infoArr[0] && typeof infoArr[0] === 'object'
              ? String((infoArr[0] as Record<string, unknown>).reference_id || localRef)
              : localRef
          return {
            success: true,
            status: 'delivered',
            providerMessageId: refId,
            providerResponse: truncateSafe(String(parsed.status || 'SUCCESS')),
          }
        }
        return {
          success: false,
          status: 'failed',
          error: `SSL Wireless error: ${String(parsed.error_message || truncateSafe(text))}`,
          providerResponse: truncateSafe(text),
        }
      }
      return res.ok
        ? { success: true, status: 'sent', providerMessageId: localRef, providerResponse: truncateSafe(text) }
        : { success: false, status: 'failed', error: `SSL Wireless HTTP ${res.status}: ${truncateSafe(text)}` }
    }

    // Standard JSON HTTP Webhook / SIM Bridge
    res = await fetchImpl(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        message,
        senderId: config.senderId || 'EduTech',
        apiKey: config.apiKey || undefined,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const text = await res.text()
    if (res.ok) {
      return { success: true, status: 'delivered', providerMessageId: localRef, providerResponse: truncateSafe(text || 'OK') }
    }
    return { success: false, status: 'failed', error: `Gateway HTTP ${res.status}: ${truncateSafe(text)}` }
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    return {
      success: false,
      status: 'failed',
      error: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'Gateway request timed out' : (e?.message || 'Gateway request failed'),
    }
  }
}

/**
 * Query real-time account balance from the active Bangladesh Bulk SMS provider.
 */
export async function fetchBdProviderBalance(
  config: StoredSmsGatewayConfig,
  fetchImpl: FetchLike = fetch
): Promise<ProviderBalanceOutcome> {
  const providerType = config.providerType
  const balanceUrl = DEFAULT_PROVIDER_URLS[providerType]?.balanceUrl
  if (!balanceUrl) {
    return {
      success: false,
      provider: config.providerName,
      error: 'Live balance API is not available for custom HTTP endpoints',
    }
  }
  if (!config.apiKey.trim()) {
    return {
      success: false,
      provider: config.providerName,
      error: 'Provider API key is not configured yet',
    }
  }

  try {
    let url = balanceUrl
    if (providerType === 'bulksmsbd') {
      url = `${balanceUrl}?api_key=${encodeURIComponent(config.apiKey)}`
    } else if (providerType === 'smsnetbd') {
      url = `${balanceUrl}?api_key=${encodeURIComponent(config.apiKey)}`
    } else if (providerType === 'greenweb') {
      url = `${balanceUrl}?token=${encodeURIComponent(config.apiKey)}&balance&json`
    } else if (providerType === 'mimsms') {
      url = `${balanceUrl}?userName=${encodeURIComponent(config.username)}&apiKey=${encodeURIComponent(config.apiKey)}`
    } else if (providerType === 'sslwireless') {
      url = `${balanceUrl}?api_token=${encodeURIComponent(config.apiKey)}`
    }

    const res = await fetchImpl(url, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const text = await res.text()
    const parsed = safeJsonParse(text)

    if (!res.ok) {
      return {
        success: false,
        provider: config.providerName,
        error: `Provider HTTP ${res.status}: ${truncateSafe(text)}`,
      }
    }

    if (parsed && !Array.isArray(parsed)) {
      if (providerType === 'smsnetbd' && Number(parsed.error) !== 0 && parsed.error !== undefined) {
        return { success: false, provider: config.providerName, error: String(parsed.msg || 'Balance lookup failed') }
      }
      const dataObj = parsed.data && typeof parsed.data === 'object' ? (parsed.data as Record<string, unknown>) : parsed
      const rawBal = dataObj.balance ?? parsed.balance ?? parsed.responseResult ?? parsed.msg
      const numeric = rawBal !== undefined && !Number.isNaN(Number(rawBal)) ? Number(rawBal) : null
      return {
        success: true,
        provider: config.providerName,
        balanceText: rawBal !== undefined ? String(rawBal) : truncateSafe(text),
        balanceNumeric: numeric,
        currency: 'BDT / Credits',
      }
    }

    const numeric = !Number.isNaN(Number(text.trim())) ? Number(text.trim()) : null
    return {
      success: true,
      provider: config.providerName,
      balanceText: truncateSafe(text),
      balanceNumeric: numeric,
      currency: 'BDT / Credits',
    }
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    return {
      success: false,
      provider: config.providerName,
      error: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'Balance check timed out' : (e?.message || 'Network error'),
    }
  }
}
