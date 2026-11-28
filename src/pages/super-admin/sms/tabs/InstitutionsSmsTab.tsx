import React from 'react'
import { Building2, Search, Plus, AlertTriangle, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import type { InstitutionSMSBalance } from '@/store/smsStore'

export interface InstitutionSmsRow {
  id: string
  name: string
  nameBn?: string
  email?: string
  phone?: string
  subdomain: string
  eiin?: string
  status?: string
}

interface Props {
  isBn: boolean
  search: string
  onSearchChange: (val: string) => void
  institutions: InstitutionSmsRow[]
  balances: Record<string, InstitutionSMSBalance>
  onOpenAllocate: (instId?: string) => void
  onOpenBulkDistribute: () => void
}

export const InstitutionsSmsTab = React.memo(function InstitutionsSmsTab({
  isBn,
  search,
  onSearchChange,
  institutions,
  balances,
  onOpenAllocate,
  onOpenBulkDistribute,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[14rem] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isBn ? 'প্রতিষ্ঠান খুঁজুন (নাম, EIIN, সাবডোমেইন)...' : 'Search institutions (Name, EIIN, slug)...'}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenBulkDistribute}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.75rem] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 transition-all border-none cursor-pointer"
          >
            <Sparkles size={14} />
            <span>{isBn ? 'সব প্রতিষ্ঠানে বিতরণ' : 'Distribute to All'}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAllocate('')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
          >
            <Plus size={14} />
            <span>{isBn ? 'নতুন বরাদ্দ যোগ করুন' : 'Allocate SMS'}</span>
          </button>
        </div>
      </div>

      {institutions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[var(--text-muted)] border border-[var(--border)]">
          <Building2 size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-[0.875rem]">{isBn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি' : 'No institutions found'}</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{isBn ? 'প্রতিষ্ঠান' : 'Institution'}</th>
                  <th className="py-3 px-4">{isBn ? 'সাবডোমেইন / EIIN' : 'Subdomain / EIIN'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'মোট বরাদ্দ' : 'Allocated'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'ব্যবহৃত' : 'Used'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'অবশিষ্ট ব্যালেন্স' : 'Remaining Balance'}</th>
                  <th className="py-3 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {institutions.map((inst) => {
                  const bal = balances[inst.id] || { allocated: 0, used: 0, remaining: 0 }
                  const percentRemaining = bal.allocated > 0 ? (bal.remaining / bal.allocated) * 100 : 0
                  const isLow = bal.remaining < 200 && bal.allocated > 0 && bal.remaining > 0
                  const isZero = bal.remaining === 0

                  return (
                    <tr key={inst.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {isBn ? inst.nameBn || inst.name : inst.name}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)]">{inst.email || inst.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[0.75rem] text-[var(--text-secondary)]">{inst.subdomain}</div>
                        {inst.eiin && <div className="text-[0.6875rem] text-[var(--text-muted)]">EIIN: {inst.eiin}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                        {bal.allocated.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                        {bal.used.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={`font-bold ${isZero ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {bal.remaining.toLocaleString()} <span className="text-[0.6875rem] font-normal text-[var(--text-muted)]">SMS</span>
                        </div>
                        {bal.allocated > 0 && (
                          <div className="w-24 ml-auto h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${isZero ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, percentRemaining))}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isZero ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-red-500/10 text-red-500">
                            <XCircle size={10} />
                            {isBn ? 'ব্যালেন্স শূন্য' : 'No Balance'}
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-amber-500/10 text-amber-500">
                            <AlertTriangle size={10} />
                            {isBn ? 'ব্যালেন্স কম' : 'Low Balance'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-emerald-500/10 text-emerald-500">
                            <CheckCircle size={10} />
                            {isBn ? 'সক্রিয়' : 'Healthy'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenAllocate(inst.id)}
                          className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--brand-light)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all border border-[var(--brand)]/20 cursor-pointer"
                        >
                          {isBn ? 'রিচার্জ / বরাদ্দ' : 'Allocate'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
})
