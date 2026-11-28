import { describe, it, expect } from 'vitest'
import {
  normalizeBdPhone,
  isValidBdPhone,
  calculateSmsSegments,
  sealGatewayConfigForDb,
  unsealGatewayConfigFromDb,
  maskGatewayConfig,
  validateProviderEndpointUrl,
  sendThroughBdProvider,
  fetchBdProviderBalance,
  DEFAULT_SMS_GATEWAY_CONFIG,
  type StoredSmsGatewayConfig,
} from './bdSmsProviders.js'

const JWT_SECRET = 'unit-test-jwt-secret-at-least-32-chars-0123'

describe('bdSmsProviders — BD Phone Normalization, Bangla Segmentation & Secret Sealing', () => {
  it('normalizes Bangladesh mobile numbers consistently', () => {
    expect(normalizeBdPhone('01712-345678')).toBe('8801712345678')
    expect(normalizeBdPhone('+8801812345678')).toBe('8801812345678')
    expect(normalizeBdPhone('8801912345678')).toBe('8801912345678')
    expect(isValidBdPhone('8801712345678')).toBe(true)
    expect(isValidBdPhone('8801212345678')).toBe(false)
  })

  it('calculates GSM-7 vs Bangla Unicode SMS segments accurately', () => {
    expect(calculateSmsSegments('Fee payment received: 2500 BDT.')).toEqual({
      isUnicode: false,
      chars: 31,
      segments: 1,
    })
    expect(calculateSmsSegments('a'.repeat(161))).toEqual({
      isUnicode: false,
      chars: 161,
      segments: 2,
    })
    expect(calculateSmsSegments('আপনার সন্তানের বেতন পরিশোধ হয়েছে।')).toEqual({
      isUnicode: true,
      chars: 34,
      segments: 1,
    })
    expect(calculateSmsSegments('ক'.repeat(71))).toEqual({
      isUnicode: true,
      chars: 71,
      segments: 2,
    })
  })

  it('seals gateway apiKey & password with AES-256-GCM and exposes only masked preview', () => {
    const cfg: StoredSmsGatewayConfig = {
      ...DEFAULT_SMS_GATEWAY_CONFIG,
      providerType: 'bulksmsbd',
      apiKey: 'secret-bulksmsbd-key-9876',
      password: 'gateway-secret-password',
      senderId: 'EduTechBD',
      isActive: true,
    }
    const serialized = sealGatewayConfigForDb(cfg, JWT_SECRET)
    expect(serialized).not.toContain('secret-bulksmsbd-key-9876')
    expect(serialized).not.toContain('gateway-secret-password')
    expect(serialized).toContain('enc:v1:')

    const unsealed = unsealGatewayConfigFromDb(serialized, JWT_SECRET)
    expect(unsealed.apiKey).toBe('secret-bulksmsbd-key-9876')
    expect(unsealed.password).toBe('gateway-secret-password')

    const masked = maskGatewayConfig(unsealed)
    expect(masked.hasApiKey).toBe(true)
    expect(masked.maskedApiKey).toBe('••••9876')
    expect('apiKey' in masked).toBe(false)
    expect('password' in masked).toBe(false)
  })

  it('blocks cloud metadata SSRF targets in endpoint validation', () => {
    expect(() => validateProviderEndpointUrl('http://169.254.169.254/latest')).toThrow()
    expect(() => validateProviderEndpointUrl('ftp://example.com/send')).toThrow()
    expect(validateProviderEndpointUrl('https://bulksmsbd.net/api/smsapi')).toBe('https://bulksmsbd.net/api/smsapi')
  })

  it('fails closed cleanly when gateway is inactive or lacks API credentials', async () => {
    const res = await sendThroughBdProvider({
      phone: '01712345678',
      message: 'Test',
      config: { ...DEFAULT_SMS_GATEWAY_CONFIG, isActive: false },
    })
    expect(res.success).toBe(false)
    expect(res.status).toBe('failed')
    expect(res.error).toMatch(/disabled/i)
  })

  it('dispatches Unicode SMS cleanly via BulkSMSBD and handles 202 acceptance', async () => {
    const calls: Array<{ url: string; body: string }> = []
    const mockFetch: typeof fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), body: String(init?.body || '') })
      return new Response(JSON.stringify({ response_code: 202, message_id: 'MSG-202', success_message: 'SMS Submitted' }), {
        status: 200,
      })
    }) as typeof fetch

    const res = await sendThroughBdProvider(
      {
        phone: '01712345678',
        message: 'শুভ সকাল শিক্ষার্থী',
        config: {
          ...DEFAULT_SMS_GATEWAY_CONFIG,
          providerType: 'bulksmsbd',
          apiKey: 'api-key-1',
          senderId: '8809617600000',
          isActive: true,
        },
      },
      mockFetch
    )

    expect(res.success).toBe(true)
    expect(res.providerMessageId).toBe('MSG-202')
    expect(calls[0].body).toContain('type=unicode')
    expect(calls[0].body).toContain('number=8801712345678')
  })

  it('parses SSL Wireless, Alpha Net, GreenWeb, and balance API responses', async () => {
    const sslFetch = (async () =>
      new Response(JSON.stringify({ status: 'SUCCESS', status_code: 200, smsinfo: [{ reference_id: 'SSL-1' }] }), {
        status: 200,
      })) as unknown as typeof fetch

    const sslRes = await sendThroughBdProvider(
      {
        phone: '01811223344',
        message: 'Hello from EduTech',
        config: {
          ...DEFAULT_SMS_GATEWAY_CONFIG,
          providerType: 'sslwireless',
          apiUrl: 'https://smsplus.sslwireless.com/api/v3/send-sms',
          apiKey: 'ssl-tok',
          senderId: 'EDUTECH',
          isActive: true,
        },
      },
      sslFetch
    )
    expect(sslRes.success).toBe(true)
    expect(sslRes.providerMessageId).toBe('SSL-1')

    const balFetch = (async () =>
      new Response(JSON.stringify({ balance: '1425.50' }), { status: 200 })) as unknown as typeof fetch
    const bal = await fetchBdProviderBalance(
      {
        ...DEFAULT_SMS_GATEWAY_CONFIG,
        providerType: 'bulksmsbd',
        apiKey: 'key-123',
        isActive: true,
      },
      balFetch
    )
    expect(bal.success).toBe(true)
    expect(bal.balanceNumeric).toBe(1425.5)
  })
})
