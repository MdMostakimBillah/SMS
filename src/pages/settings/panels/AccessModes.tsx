import { useState, useEffect } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useSuperAdminStore, type InstitutionAccessModes } from '@/store/superAdminStore'
import { Link, Globe, ArrowUpRight, Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function AccessModesPanel({ isBn, onBack }: Props) {
  const { user } = useAuth()
  const storeInstitutions = useSuperAdminStore((s) => s.institutions)
  const updateStoreInstitution = useSuperAdminStore((s) => s.updateInstitution)

  const currentInst = storeInstitutions.find((i) => i.subdomain === user?.subdomain) || null

  const [modes, setModes] = useState<InstitutionAccessModes>({
    pathBased: true,
    subdomainBased: true,
    customDomain: '',
  })
  const [customDomainInput, setCustomDomainInput] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (currentInst?.accessModes) {
      setModes(currentInst.accessModes)
      setCustomDomainInput(currentInst.accessModes?.customDomain || '')
    }
  }, [currentInst])

  const handleSave = () => {
    if (!currentInst) return
    const updated: InstitutionAccessModes = { ...modes, customDomain: customDomainInput.trim() }
    updateStoreInstitution(currentInst.id, { accessModes: updated })
    setModes(updated)
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const baseUrl = window.location.origin
  const slug = currentInst?.slug || ''
  const subdomain = currentInst?.subdomain || ''
  const pathUrl = `${baseUrl}/i/${slug}`
  const subdomainUrl = `https://${subdomain}.smsappbd.vercel.app`

  return (
    <SettingsPanel title="Access Modes" titleBn="অ্যাক্সেস মোড" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        {/* Current Active Mode Banner */}
        <div className="p-3 rounded-xl bg-[var(--brand-light)]/50 border border-[var(--brand)]/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span className="text-[0.75rem] font-semibold text-[var(--brand)]">
              {isBn ? 'বর্তমানে সক্রিয়: পাথ-বেসড' : 'Currently Active: Path-based'}
            </span>
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-1 ml-4">
            {isBn ? 'আপনার স্কুল এখন পাথ URL দিয়ে প্রবেশযোগ্য' : 'Your school is accessible via path URL'}
          </div>
        </div>

        {/* Path-based */}
        <div className={`p-4 rounded-xl border transition-all ${modes.pathBased ? 'border-[var(--brand)]/30 bg-[var(--brand-light)]/30' : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modes.pathBased ? 'bg-[var(--brand)]/10' : 'bg-[var(--bg-primary)]'}`}>
                <Link size={16} className={modes.pathBased ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'পাথ-বেসড' : 'Path-based'}
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-[var(--brand)]/10 text-[0.5625rem] font-semibold text-[var(--brand)]">
                    {isBn ? 'সক্রিয়' : 'ACTIVE'}
                  </span>
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'URL পাথ দিয়ে প্রবেশ' : 'Access via URL path'}
                </div>
              </div>
            </div>
            <button
              disabled
              className="relative w-11 h-6 rounded-full bg-[var(--brand)] cursor-not-allowed border-none opacity-60"
            >
              <div className="absolute top-0.5 left-[22px] w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] mt-2">
            <code className="text-[0.75rem] text-[var(--text-primary)] truncate flex-1 font-mono">{pathUrl}</code>
            <button onClick={() => handleCopy(pathUrl, 'path')} className="text-[var(--text-muted)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-none p-1 rounded-lg hover:bg-[var(--brand-light)] transition-colors">
              {copiedField === 'path' ? <CheckCircle size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Subdomain - Coming Soon */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] opacity-70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-primary)]">
                <Globe size={16} className="text-[var(--text-muted)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'সাবডোমেইন' : 'Subdomain'}
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-[0.5625rem] font-semibold text-amber-600">
                    {isBn ? 'শীঘ্রই আসছে' : 'COMING SOON'}
                  </span>
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'সাবডোমেইন দিয়ে প্রবেশ' : 'Access via subdomain'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)]">
              <Clock size={12} />
              <span>{isBn ? 'পরবর্তী আপডেট' : 'Next update'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] mt-2">
            <code className="text-[0.75rem] text-[var(--text-muted)] truncate flex-1 font-mono">{subdomainUrl}</code>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[0.6875rem] text-amber-600">
            <AlertCircle size={12} />
            <span>{isBn ? 'সার্ভিস চালু হলে এই ফিচার সক্রিয় হবে' : 'Will be enabled when service goes live'}</span>
          </div>
        </div>

        {/* Custom Domain - Coming Soon */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] opacity-70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-primary)]">
                <ArrowUpRight size={16} className="text-[var(--text-muted)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {isBn ? 'কাস্টম ডোমেইন' : 'Custom Domain'}
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-[0.5625rem] font-semibold text-amber-600">
                    {isBn ? 'শীঘ্রই আসছে' : 'COMING SOON'}
                  </span>
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'নিজের ডোমেইন ব্যবহার করুন' : 'Use your own domain'}
                </div>
              </div>
            </div>
          </div>
          <input
            type="text"
            disabled
            placeholder={isBn ? 'abcschool.com' : 'abcschool.com'}
            className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-muted)] placeholder:text-[var(--text-muted)] mt-2 cursor-not-allowed"
          />
          <div className="flex items-center gap-1.5 mt-2 text-[0.6875rem] text-amber-600">
            <AlertCircle size={12} />
            <span>{isBn ? 'সার্ভিস চালু হলে কাস্টম ডোমেইন সেটআপ করতে পারবেন' : 'Custom domain setup available after service launch'}</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full h-10 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
        </button>
      </div>
    </SettingsPanel>
  )
}
