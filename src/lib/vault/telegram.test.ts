import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { telegramGetMe, telegramSendBackup, sendBundleToTelegram } from './telegram'
import { extractBackupFromZip } from './zipHelper'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('telegramGetMe', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('returns bot info on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ ok: true, result: { id: 1, username: 'my_bot', first_name: 'My Bot' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await telegramGetMe('123:abc')
    expect(res.success).toBe(true)
    expect(res.bot?.username).toBe('my_bot')
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.telegram.org/bot123:abc/getMe')
  })

  it('surfaces Telegram API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse({ ok: false, description: 'Unauthorized' }),
    ))
    const res = await telegramGetMe('bad-token')
    expect(res.success).toBe(false)
    expect(res.error).toBe('Unauthorized')
  })

  it('fails gracefully when offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')))
    const res = await telegramGetMe('123:abc')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/internet/i)
  })

  it('rejects an empty token without calling the network', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = await telegramGetMe('   ')
    expect(res.success).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('telegramSendBackup', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('posts the document as multipart form data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ ok: true, result: { message_id: 42 } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await telegramSendBackup({
      botToken: '123:abc',
      chatId: '-100123',
      filename: 'backup.json',
      content: '{"a":1}',
      caption: 'hello',
    })

    expect(res.success).toBe(true)
    expect(res.messageId).toBe(42)
    expect(res.size).toBe('7 B')
    expect(res.sha256).toMatch(/^[0-9a-f]{64}$/)

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://api.telegram.org/bot123:abc/sendDocument')
    expect(init.method).toBe('POST')
    const form = init.body as FormData
    expect(form.get('chat_id')).toBe('-100123')
    expect(form.get('caption')).toBe('hello')
    const doc = form.get('document') as File
    expect(doc.name).toBe('backup.json')
  })

  it('requires token and chat id', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = await telegramSendBackup({ botToken: '', chatId: '', filename: 'b.json', content: '{}' })
    expect(res.success).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('sendBundleToTelegram', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends a pretty-printed bundle with institution metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ ok: true, result: { message_id: 7 } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const bundle = {
      metadata: {
        app: 'EduTech SMS',
        version: '2.0.0',
        slug: 'demo',
        exportedAt: '2026-10-27T00:00:00.000Z',
        counts: { classes: 5, teachers: 10, students: 100, exams: 2, departments: 3, subjects: 20 },
      },
      stores: { 'edutech-classes_demo': { state: { classes: [] }, version: 0 } },
    }

    const res = await sendBundleToTelegram({
      botToken: 't',
      chatId: 'c',
      bundle,
      institutionName: 'Demo School',
    })

    expect(res.success).toBe(true)
    const form = fetchMock.mock.calls[0][1].body as FormData
    const doc = form.get('document') as File
    expect(doc.name).toMatch(/^edutech_backup_demo_\d{4}-\d{2}-\d{2}\.zip$/)
    const zipText = await extractBackupFromZip(doc)
    expect(JSON.parse(zipText)).toEqual(bundle) // round-trips losslessly from inside zip
    const caption = form.get('caption') as string
    expect(caption).toContain('Demo School')
    expect(caption).toContain('100 students')
  })
})
