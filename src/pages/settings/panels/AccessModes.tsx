import { useState, useEffect } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useSuperAdminStore, type InstitutionAccessModes } from '@/store/superAdminStore'
import { Link, Globe, ArrowUpRight, Copy, CheckCircle, Server } from 'lucide-react'

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
  const customUrl = customDomainInput.trim() ? `https://${customDomainInput.trim()}` : ''

  return (
    <SettingsPanel title="Access Modes" titleBn="অ্যাক্সেস মোড" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        {/* Path-based */}
        <div className={`p-4 rounded-xl border transition-all ${modes.pathBased ? 'border-[var(--brand)]/30 bg-[var(--brand-light)]/30' : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modes.pathBased ? 'bg-[var(--brand)]/10' : 'bg-[var(--bg-primary)]'}`}>
                <Link size={16} className={modes.pathBased ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
              </div>
              <div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'পাথ-বেসড' : 'Path-based'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'URL পাথ দিয়ে প্রবেশ' : 'Access via URL path'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setModes((p) => ({ ...p, pathBased: !p.pathBased }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer border-none ${modes.pathBased ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${modes.pathBased ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          {modes.pathBased && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] mt-2">
              <code className="text-[0.75rem] text-[var(--text-primary)] truncate flex-1 font-mono">{pathUrl}</code>
              <button onClick={() => handleCopy(pathUrl, 'path')} className="text-[var(--text-muted)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-none p-1 rounded-lg hover:bg-[var(--brand-light)] transition-colors">
                {copiedField === 'path' ? <CheckCircle size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Subdomain */}
        <div className={`p-4 rounded-xl border transition-all ${modes.subdomainBased ? 'border-[var(--brand)]/30 bg-[var(--brand-light)]/30' : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modes.subdomainBased ? 'bg-[var(--brand)]/10' : 'bg-[var(--bg-primary)]'}`}>
                <Globe size={16} className={modes.subdomainBased ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'} />
              </div>
              <div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'সাবডোমেইন' : 'Subdomain'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'সাবডোমেইন দিয়ে প্রবেশ' : 'Access via subdomain'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setModes((p) => ({ ...p, subdomainBased: !p.subdomainBased }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer border-none ${modes.subdomainBased ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${modes.subdomainBased ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          {modes.subdomainBased && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] mt-2">
              <code className="text-[0.75rem] text-[var(--text-primary)] truncate flex-1 font-mono">{subdomainUrl}</code>
              <button onClick={() => handleCopy(subdomainUrl, 'subdomain')} className="text-[var(--text-muted)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-none p-1 rounded-lg hover:bg-[var(--brand-light)] transition-colors">
                {copiedField === 'subdomain' ? <CheckCircle size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Custom Domain */}
        <div className={`p-4 rounded-xl border transition-all ${customDomainInput ? 'border-[var(--green)]/30 bg-green-500/5' : 'border-[var(--border)] bg-[var(--bg-secondary)]'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${customDomainInput ? 'bg-green-500/10' : 'bg-[var(--bg-primary)]'}`}>
                <ArrowUpRight size={16} className={customDomainInput ? 'text-[var(--green)]' : 'text-[var(--text-muted)]'} />
              </div>
              <div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                  {isBn ? 'কাস্টম ডোমেইন' : 'Custom Domain'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)]">
                  {isBn ? 'নিজের ডোমেইন ব্যবহার করুন' : 'Use your own domain'}
                </div>
              </div>
            </div>
            {customDomainInput && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-[0.625rem] font-semibold text-[var(--green)]">
                Active
              </span>
            )}
          </div>
          <input
            type="text"
            value={customDomainInput}
            onChange={(e) => setCustomDomainInput(e.target.value)}
            placeholder="abcschool.com"
            className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)] mt-2"
          />
          {customDomainInput && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] mt-2">
              <code className="text-[0.75rem] text-[var(--text-primary)] truncate flex-1 font-mono">{customUrl}</code>
              <button onClick={() => handleCopy(customUrl, 'custom')} className="text-[var(--text-muted)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-none p-1 rounded-lg hover:bg-[var(--brand-light)] transition-colors">
                {copiedField === 'custom' ? <CheckCircle size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
              </button>
            </div>
          )}
          {customDomainInput && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Server size={12} className="text-blue-600" />
                <span className="text-[0.6875rem] font-semibold text-blue-700">
                  {isBn ? 'DNS কনফিগারেশন' : 'DNS Configuration'}
                </span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[0.6875rem] space-y-1">
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Type</span><span className="font-mono font-semibold text-[var(--text-primary)]">CNAME</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Name</span><span className="font-mono font-semibold text-[var(--text-primary)]">@</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Value</span><span className="font-mono font-semibold text-[var(--text-primary)]">cname.vercel-dns.com</span></div>
              </div>
            </div>
          )}
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
