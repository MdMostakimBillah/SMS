import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { Mail, CheckCircle, Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { backupApi } from '@/lib/api'

interface Props {
  isBn: boolean
  onBack: () => void
}

const COMMON_DOMAINS = ['proton.me', 'protonmail.com', 'outlook.com', 'gmail.com']

export function BackupEmailPanel({ isBn, onBack }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [email, setEmail] = useState(settings.backupEmail)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleAppendDomain = (domain: string) => {
    const atIndex = email.indexOf('@')
    const prefix = atIndex !== -1 ? email.slice(0, atIndex) : email
    setEmail(`${prefix.trim()}@${domain}`)
  }

  const handleSave = () => {
    if (!email) return
    updateSettings({ backupEmail: email })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestPing = async () => {
    if (!isEmailValid) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await backupApi.testEmail({ email: email.trim().toLowerCase() })
      setTestResult(res.message || (isBn ? 'টেস্ট সফল হয়েছে!' : 'Test successful!'))
    } catch (err: any) {
      setTestResult(err?.message || (isBn ? 'টেস্ট ব্যর্থ হয়েছে' : 'Test failed'))
    } finally {
      setTesting(false)
    }
  }

  return (
    <SettingsPanel title="Backup Email" titleBn="ব্যাকআপ ইমেইল" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'ব্যাকআপ ইমেইল ঠিকানার মাধ্যমে অ্যাকাউন্ট পুনরুদ্ধার এবং সিস্টেম ব্যাকআপ লিংক পান (প্রোটন মেইল, আউটলুক সমর্থিত)।'
            : 'Receive recovery links and system backup notifications via a backup address (Proton Mail, Outlook, etc. supported).'}
        </p>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Mail size={12} />
              {isBn ? 'ব্যাকআপ ইমেইল' : 'Backup Email'}
            </span>
            <span className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles size={11} className="text-[var(--brand)]" />
              <span>Proton Mail / Outlook / Gmail</span>
            </span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setTestResult(null)
            }}
            placeholder="admin@proton.me"
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
          />

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[0.6875rem] text-[var(--text-muted)] mr-1">
              {isBn ? 'দ্রুত যোগ করুন:' : 'Quick:'}
            </span>
            {COMMON_DOMAINS.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => handleAppendDomain(domain)}
                className="text-[0.6875rem] px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
              >
                @{domain}
              </button>
            ))}
          </div>
        </div>

        {testResult && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[0.75rem] flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTestPing}
            disabled={testing || !isEmailValid}
            className="flex-1 h-10 rounded-xl text-[0.75rem] font-semibold border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{testing ? (isBn ? 'টেস্ট হচ্ছে...' : 'Testing...') : (isBn ? 'টেস্ট পিং' : 'Test Ping')}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!email}
            className="flex-1 h-10 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 text-white transition-all shadow-sm"
            style={{ background: saved ? 'var(--green)' : 'var(--brand)' }}
          >
            {saved ? (
              <><CheckCircle size={14} />{isBn ? 'সংরক্ষিত!' : 'Saved!'}</>
            ) : (
              isBn ? 'সংরক্ষণ করুন' : 'Save Changes'
            )}
          </button>
        </div>
      </div>
    </SettingsPanel>
  )
}
