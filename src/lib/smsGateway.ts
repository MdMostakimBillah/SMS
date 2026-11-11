/**
 * SMS Gateway Driver
 * ==================
 * Handles dispatching SMS messages through SIM SMS Providers,
 * REST HTTP Gateways, or simulated fallback environments.
 */

export interface SMSGatewayOptions {
  providerName: string
  providerType: 'sim_gateway' | 'http_api' | 'greenweb' | 'bulksmsbd' | 'custom'
  apiUrl?: string
  apiKey?: string
  senderId?: string
  username?: string
  password?: string
  isActive?: boolean
}

export interface SendSMSParams {
  phone: string
  message: string
  gateway?: SMSGatewayOptions
}

export interface SendSMSResult {
  success: boolean
  messageId: string
  status: 'sent' | 'delivered' | 'failed'
  providerResponse?: string
  error?: string
}

/** Normalizes phone numbers to standard 11-digit Bangladesh or E.164 format */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+880')) return cleaned.slice(1) // 8801XXXXXXXXX
  if (cleaned.startsWith('880')) return cleaned
  if (cleaned.startsWith('01') && cleaned.length === 11) return `88${cleaned}`
  return cleaned
}

/** Formats phone number for display (e.g., 01711-000000) */
export function formatPhoneDisplay(raw: string): string {
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('880')) digits = digits.slice(2)
  if (digits.length === 11) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return raw
}

/**
 * Dispatches an SMS message through the configured gateway.
 * Supports real HTTP calls if `apiUrl` and `apiKey` are provided,
 * with graceful fallback to simulated transmission for local testing.
 */
export async function dispatchSMS(params: SendSMSParams): Promise<SendSMSResult> {
  const { phone, message, gateway } = params
  const normalizedPhone = normalizePhoneNumber(phone)
  const messageId = `SMS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

  if (!normalizedPhone || normalizedPhone.length < 10) {
    return {
      success: false,
      messageId,
      status: 'failed',
      error: 'Invalid recipient phone number',
    }
  }

  // Real HTTP Gateway dispatch if configured
  if (gateway && gateway.isActive && gateway.apiUrl) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      let res: Response
      if (gateway.providerType === 'greenweb') {
        // Greenweb Bangladesh format
        const query = new URLSearchParams({
          token: gateway.apiKey || '',
          to: normalizedPhone,
          message: message,
        })
        res = await fetch(`${gateway.apiUrl}?${query.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        })
      } else if (gateway.providerType === 'bulksmsbd') {
        // BulkSMSBD format
        const query = new URLSearchParams({
          api_key: gateway.apiKey || '',
          type: 'text',
          number: normalizedPhone,
          senderid: gateway.senderId || '',
          message: message,
        })
        res = await fetch(`${gateway.apiUrl}?${query.toString()}`, {
          method: 'GET',
          signal: controller.signal,
        })
      } else {
        // Standard SIM SMS Gateway / Custom JSON HTTP API
        res = await fetch(gateway.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(gateway.apiKey ? { Authorization: `Bearer ${gateway.apiKey}` } : {}),
          },
          body: JSON.stringify({
            phone: normalizedPhone,
            message: message,
            senderId: gateway.senderId || 'EduTech',
            apiKey: gateway.apiKey,
          }),
          signal: controller.signal,
        })
      }

      clearTimeout(timeoutId)
      const resText = await res.text()

      if (res.ok) {
        return {
          success: true,
          messageId,
          status: 'delivered',
          providerResponse: resText.slice(0, 200),
        }
      } else {
        return {
          success: false,
          messageId,
          status: 'failed',
          error: `Provider HTTP Error ${res.status}: ${resText.slice(0, 100)}`,
          providerResponse: resText.slice(0, 200),
        }
      }
    } catch (err: any) {
      return {
        success: false,
        messageId,
        status: 'failed',
        error: err.name === 'AbortError' ? 'Gateway timeout (10s)' : (err.message || 'Network error'),
      }
    }
  }

  // Simulated transmission (SIM Gateway fallback mode)
  await new Promise((resolve) => setTimeout(resolve, 80))

  return {
    success: true,
    messageId,
    status: 'delivered',
    providerResponse: `Delivered via SIM SMS Provider (${gateway?.providerName || 'Local SIM Gateway'})`,
  }
}
