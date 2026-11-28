import React, { useState, useMemo } from 'react'
import { Send, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { calculateSmsSegments } from '@/lib/smsGateway'
import type { InstitutionSmsRow } from './InstitutionsSmsTab'

interface Props {
  isBn: boolean
  institutions: InstitutionSmsRow[]
  gatewayConfigured: boolean
  onBroadcast: (data: {
    recipients?: string[]
    schoolIds?: string[]
    allSchools?: boolean
    message: string
    triggerType?: 'broadcast' | 'test'
  }) => Promise<{
    success: boolean
    sentCount?: number
    failedCount?: number
    skippedCount?: number
    error?: string
  }>
}

export const BroadcastSmsTab = React.memo(function BroadcastSmsTab({
  isBn,
  institutions,
  gatewayConfigured,
  onBroadcast,
}: Props) {
  const [targetMode, setTargetMode] = useState<'all_schools' | 'custom_numbers'>('all_schools')
  const [customNumbers, setCustomNumbers] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const segInfo = useMemo(() => calculateSmsSegments(message), [message])
  const schoolsWithPhone = useMemo(
    () => institutions.filter((s) => Boolean(s.phone && s.phone.trim().length >= 10)),
    [institutions]
  )

  const parsedRecipients = useMemo(
    () =>
      customNumbers
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 6),
    [customNumbers]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setStatusMsg(null)

    const res = await onBroadcast(
      targetMode === 'all_schools'
        ? { allSchools: true, message: message.trim(), triggerType: 'broadcast' }
        : { recipients: parsedRecipients, message: message.trim(), triggerType: 'broadcast' }
    )
    setSending(false)

    if (res.success || (res.sentCount && res.sentCount > 0)) {
      setStatusMsg({
        ok: true,
        text: isBn
          ? `সফলভাবে পাঠানো হয়েছে: ${res.sentCount || 0}টি, ব্যর্থ: ${res.failedCount || 0}টি`
          : `Dispatched: ${res.sentCount || 0} sent, ${res.failedCount || 0} failed${res.skippedCount ? `, ${res.skippedCount} skipped (no phone)` : ''}`,
      })
      if (res.success) setMessage('')
    } else {
      setStatusMsg({
        ok: false,
        text: res.error || (isBn ? 'ব্রডকাস্ট SMS পাঠাতে ব্যর্থ হয়েছে' : 'Bulk broadcast failed'),
      })
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-[var(--border)] space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'সুপার অ্যাডমিন বাল্ক SMS ব্রডকাস্ট' : 'Super Admin Bulk SMS Broadcast'}
          </h2>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {isBn
              ? 'সক্রিয় বাংলাদেশ বাল্ক SMS গেটওয়ের মাধ্যমে একসাথে সকল প্রতিষ্ঠান বা নির্দিষ্ট নম্বরে বার্তা পাঠান'
              : 'Send real bulk SMS to all registered institutions or custom Bangladesh recipient numbers'}
          </p>
        </div>
        {!gatewayConfigured && (
          <span className="px-3 py-1 rounded-full text-[0.6875rem] font-semibold bg-amber-500/10 text-amber-500">
            {isBn ? 'প্রথমে গেটওয়ে সক্রিয় করুন' : 'Configure & Activate Gateway First'}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTargetMode('all_schools')}
            className={`px-4 py-2 rounded-xl text-[0.75rem] font-semibold border cursor-pointer transition-colors ${
              targetMode === 'all_schools'
                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            {isBn
              ? `সকল প্রতিষ্ঠান (${schoolsWithPhone.length}/${institutions.length}টি নম্বরসহ)`
              : `All Institutions (${schoolsWithPhone.length}/${institutions.length} with phone)`}
          </button>
          <button
            type="button"
            onClick={() => setTargetMode('custom_numbers')}
            className={`px-4 py-2 rounded-xl text-[0.75rem] font-semibold border cursor-pointer transition-colors ${
              targetMode === 'custom_numbers'
                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            {isBn ? 'কাস্টম মোবাইল নম্বর তালিকা' : 'Custom Recipient Numbers'}
          </button>
        </div>

        {targetMode === 'custom_numbers' && (
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
              {isBn ? 'মোবাইল নম্বরসমূহ (কমা বা নতুন লাইনে আলাদা করুন)' : 'Mobile Numbers (comma, space, or newline separated)'}
            </label>
            <textarea
              value={customNumbers}
              onChange={(e) => setCustomNumbers(e.target.value)}
              rows={3}
              placeholder="01711000000, 01812000000&#10;8801913000000"
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] font-mono text-[var(--text-primary)] outline-none"
            />
            <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
              {isBn ? 'সনাক্তকৃত নম্বর:' : 'Detected recipients:'}{' '}
              <strong className="text-[var(--text-primary)]">{parsedRecipients.length}</strong>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[0.75rem] font-medium text-[var(--text-muted)]">
              {isBn ? 'বার্তার বিবরণ' : 'SMS Message Content'}
            </label>
            <span className="text-[0.6875rem] text-cyan-500 font-mono">
              {segInfo.isUnicode ? 'Bangla/Unicode' : 'GSM-7 ASCII'} · {segInfo.chars} {isBn ? 'অক্ষর' : 'chars'} ·{' '}
              <strong>{segInfo.segments} SMS</strong>
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={
              isBn
                ? 'বাংলায় বা ইংরেজিতে বার্তা লিখুন (বাংলা: ৭০ অক্ষর / ১ SMS, ইংরেজি: ১৬০ অক্ষর / ১ SMS)'
                : 'Write message in Bangla or English (Bangla Unicode: 70 chars/SMS, English: 160 chars/SMS)'
            }
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
            required
          />
        </div>

        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-2 text-[0.6875rem] text-[var(--text-secondary)]">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <span>
            {isBn
              ? 'বিটিআরসি নিয়মাবলি: প্রোমোশনাল বাল্ক SMS সকাল ৯:০০ থেকে রাত ৯:০০ এর মধ্যে পাঠানো উত্তম।'
              : 'BTRC guideline: Promotional bulk campaigns in Bangladesh operate best between 09:00 AM and 09:00 PM BDT.'}
          </span>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-[0.75rem] flex items-center gap-2 ${
              statusMsg.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            {statusMsg.ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={
            sending ||
            !message.trim() ||
            (targetMode === 'all_schools' ? schoolsWithPhone.length === 0 : parsedRecipients.length === 0)
          }
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50 border-none cursor-pointer transition-all"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          <span>{sending ? (isBn ? 'পাঠানো হচ্ছে...' : 'Broadcasting...') : isBn ? 'বাল্ক SMS পাঠান' : 'Send Bulk SMS'}</span>
        </button>
      </form>
    </div>
  )
})
