export const DEFAULT_PROVIDER_URLS_MAP = {
  bulksmsbd: 'https://bulksmsbd.net/api/smsapi',
  smsnetbd: 'https://api.sms.net.bd/sendsms',
  greenweb: 'https://api.greenweb.com.bd/api.php',
  mimsms: 'https://api.mimsms.com/api/SmsSending/SMS',
  sslwireless: 'https://smsplus.sslwireless.com/api/v3/send-sms',
} as const

export function calculateSmsSegments(message: string): number {
  const chars = Array.from(message).length
  const isUnicode = /[^\x20-\x7E\r\n]/.test(message)
  if (chars === 0) return 1
  const single = isUnicode ? 70 : 160
  const multi = isUnicode ? 67 : 153
  return chars <= single ? 1 : Math.ceil(chars / multi)
}
