import React, { useState, useEffect } from 'react'
import { ShieldCheck, Send, RefreshCw, CheckCircle, XCircle, Check, Wallet, Info } from 'lucide-react'
import {
  BD_SMS_PROVIDER_PRESETS,
  getProviderPreset,
  type BdSmsProviderType,
  type SMSGatewayOptions,
} from '@/lib/smsGateway'
import type { SendSMSResult } from '@/store/smsStore'

interface Props {
  isBn: boolean
  gatewayConfig: SMSGatewayOptions
  onSaveGateway: (cfg: Partial<SMSGatewayOptions> & { clearApiKey?: boolean }) => Promise<{
    success: boolean
    error?: string
  }>
  onCheckProviderBalance: () => Promise<{
    success: boolean
    balanceText?: string
    balanceNumeric?: number | null
    error?: string
  }>
  onSendTestSMS: (params: {
    institutionId: string
    institutionName: string
    phone: string
    message: string
    type: 'test'
  }) => Promise<SendSMSResult>
}

export const ProviderGatewayTab = React.memo(function ProviderGatewayTab({
  isBn,
  gatewayConfig,
  onSaveGateway,
  onCheckProviderBalance,
  onSendTestSMS,
}: Props) {
  const [form, setForm] = useState<SMSGatewayOptions>({ ...gatewayConfig })
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState('')
  const [saveError, setSaveError] = useState('')

  const [checkingBalance, setCheckingBalance] = useState(false)
  const [balanceInfo, setBalanceInfo] = useState<{ success: boolean; text: string } | null>(null)

  const [testPhone, setTestPhone] = useState('')
  const [testMsg, setTestMsg] = useState('EduTech SMS gateway test: connection verified.')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    setForm((prev) => ({ ...prev, ...gatewayConfig }))
  }, [gatewayConfig])

  const preset = getProviderPreset(form.providerType)

  const handleProviderChange = (nextType: BdSmsProviderType) => {
    const nextPreset = getProviderPreset(nextType)
    setForm((prev) => ({
      ...prev,
      providerType: nextType,
      providerName: nextPreset.name,
      apiUrl: nextPreset.defaultApiUrl || prev.apiUrl,
    }))
    setSavedNotice('')
    setSaveError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedNotice('')
    setSaveError('')
    const res = await onSaveGateway({
      providerName: form.providerName,
      providerType: form.providerType,
      apiUrl: form.apiUrl,
      senderId: form.senderId,
      username: form.username,
      isActive: form.isActive,
      ...(apiKeyInput.trim() ? { apiKey: apiKeyInput.trim() } : {}),
    })
    setSaving(false)
    if (res.success) {
      setApiKeyInput('')
      setSavedNotice(isBn ? 'গেটওয়ে সেটিংস ও API কী এনক্রিপ্ট করে সংরক্ষিত হয়েছে!' : 'Gateway settings & encrypted credentials saved!')
      setTimeout(() => setSavedNotice(''), 3500)
    } else {
      setSaveError(res.error || 'Failed to save gateway configuration')
    }
  }

  const handleCheckBalance = async () => {
    setCheckingBalance(true)
    setBalanceInfo(null)
    const res = await onCheckProviderBalance()
    setCheckingBalance(false)
    if (res.success) {
      setBalanceInfo({
        success: true,
        text: isBn
          ? `লাইভ ব্যালেন্স: ${res.balanceText}`
          : `Live Provider Balance: ${res.balanceText}`,
      })
    } else {
      setBalanceInfo({
        success: false,
        text: res.error || (isBn ? 'ব্যালেন্স যাচাই ব্যর্থ হয়েছে' : 'Balance lookup failed'),
      })
    }
  }

  const handleSendTest = async () => {
    if (!testPhone.trim()) return
    setTestSending(true)
    setTestResult(null)
    const res = await onSendTestSMS({
      institutionId: 'super-admin-test',
      institutionName: 'Super Admin Gateway Test',
      phone: testPhone,
      message: testMsg,
      type: 'test',
    })
    setTestSending(false)
    setTestResult({
      success: res.success,
      message: res.success
        ? isBn
          ? 'সফলভাবে টেস্ট SMS পাঠানো হয়েছে!'
          : 'Test SMS sent through Bangladesh provider!'
        : res.error || (isBn ? 'SMS পাঠাতে ব্যর্থ হয়েছে' : 'Failed to deliver test SMS'),
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 glass rounded-2xl p-6 border border-[var(--border)] space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'বাংলাদেশ বাল্ক এসএমএস প্রোভাইডার গেটওয়ে' : 'Bangladesh Bulk SMS Provider Gateway'}
            </h2>
            <p className="text-[0.75rem] text-[var(--text-muted)]">
              {isBn
                ? 'সকল API কল সার্ভার-সাইড থেকে চলে এবং API কী AES-256-GCM দ্বারা এনক্রিপ্ট থাকে'
                : 'Requests dispatch strictly server-side with AES-256-GCM encrypted credentials'}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded accent-emerald-500"
            />
            <span
              className={`px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${
                form.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}
            >
              {form.isActive ? (isBn ? '● গেটওয়ে চালু' : '● Gateway Active') : isBn ? '● নিষ্ক্রিয়' : '● Inactive'}
            </span>
          </label>
        </div>

        {/* Recommended Provider Preset Strip */}
        <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
          <div className="text-[0.6875rem] font-semibold text-[var(--text-secondary)]">
            {isBn ? 'বাংলাদেশের অনুমোদিত (BTRC) বাল্ক SMS প্রোভাইডার নির্বাচন করুন:' : 'Select Bangladesh BTRC Bulk SMS Provider:'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BD_SMS_PROVIDER_PRESETS.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() => handleProviderChange(p.type)}
                className={`text-[0.6875rem] px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                  form.providerType === p.type
                    ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isBn ? p.nameBn : p.name}
              </button>
            ))}
          </div>
          <div className="flex items-start gap-2 text-[0.6875rem] text-[var(--text-muted)] pt-0.5">
            <Info size={13} className="shrink-0 mt-0.5 text-cyan-500" />
            <span>
              <strong>{preset.sampleRateBdt}</strong> — {isBn ? preset.hintBn : preset.hint}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                {isBn ? 'প্রোভাইডার নাম' : 'Provider Label'}
              </label>
              <input
                type="text"
                value={form.providerName}
                onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                {isBn ? 'সেন্ডার আইডি / মাস্কিং (SID)' : 'Sender ID / Masking (SID)'}
              </label>
              <input
                type="text"
                value={form.senderId || ''}
                onChange={(e) => setForm({ ...form, senderId: e.target.value })}
                placeholder="e.g. 8809617600000 or EDUTECH"
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
              />
            </div>
          </div>

          {preset.requiresUsername && (
            <div>
              <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
                {isBn ? 'অ্যাকাউন্ট ইউজারনেম / ইমেইল' : 'Account Username / Email'}
              </label>
              <input
                type="text"
                value={form.username || ''}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="account@yourdomain.com"
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
              {isBn ? 'API এন্ডপয়েন্ট URL' : 'API Endpoint URL'}
            </label>
            <input
              type="text"
              value={form.apiUrl || ''}
              onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
              placeholder={preset.defaultApiUrl || 'https://...'}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
              {isBn ? 'API কী / সিক্রেট টোকেন' : 'API Key / Token'}{' '}
              {form.hasApiKey && (
                <span className="ml-1 text-emerald-500 font-mono">
                  ({isBn ? 'সংরক্ষিত:' : 'Saved:'} {form.maskedApiKey || '••••'})
                </span>
              )}
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={
                form.hasApiKey
                  ? isBn
                    ? 'পরিবর্তন না করতে চাইলে খালি রাখুন'
                    : 'Leave blank to keep existing encrypted key'
                  : isBn
                    ? 'প্রোভাইডার প্যানেল থেকে API কী দিন'
                    : 'Paste API key / token from your BD provider panel'
              }
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
            />
          </div>

          {saveError && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[0.75rem]">
              {saveError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck size={16} />
              <span>{saving ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Gateway Settings'}</span>
            </button>

            {preset.supportsBalanceCheck && (
              <button
                type="button"
                onClick={handleCheckBalance}
                disabled={checkingBalance}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[0.75rem] font-semibold bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border)] cursor-pointer disabled:opacity-50"
              >
                <Wallet size={14} />
                <span>{checkingBalance ? (isBn ? 'যাচাই হচ্ছে...' : 'Checking...') : isBn ? 'প্রোভাইডার ব্যালেন্স দেখুন' : 'Check Provider Balance'}</span>
              </button>
            )}

            {savedNotice && (
              <span className="text-[0.75rem] font-medium text-emerald-500 flex items-center gap-1">
                <Check size={14} />
                {savedNotice}
              </span>
            )}
          </div>

          {balanceInfo && (
            <div
              className={`p-3 rounded-xl border text-[0.75rem] ${
                balanceInfo.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}
            >
              {balanceInfo.text}
            </div>
          )}
        </form>
      </div>

      {/* Live Test SMS Card */}
      <div className="glass rounded-2xl p-6 border border-[var(--border)] space-y-4">
        <div>
          <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Send size={16} className="text-cyan-500" />
            {isBn ? 'লাইভ টেস্ট এসএমএস পাঠান' : 'Live Test SMS'}
          </h2>
          <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
            {isBn ? 'প্রকৃত সংযোগ পরীক্ষা করতে একটি মোবাইল নম্বরে টেস্ট এসএমএস পাঠান' : 'Verify real Bangladesh provider connectivity before bulk distribution'}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
              {isBn ? 'মোবাইল নম্বর' : 'Mobile Number'}
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-muted)] mb-1">
              {isBn ? 'টেস্ট বার্তা' : 'Test Message'}
            </label>
            <textarea
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSendTest}
            disabled={testSending || !testPhone.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[0.8125rem] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-all border-none cursor-pointer"
          >
            {testSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            <span>{testSending ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : isBn ? 'টেস্ট এসএমএস পাঠান' : 'Send Test SMS'}</span>
          </button>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-[0.75rem] flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
            >
              {testResult.success ? <CheckCircle size={15} className="shrink-0 mt-0.5" /> : <XCircle size={15} className="shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
