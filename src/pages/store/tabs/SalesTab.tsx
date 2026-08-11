import { useState, useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { inputCls, selectCls } from '@/lib/styles'
import { ShoppingBag, Receipt } from 'lucide-react'

interface Props {
  isMobile: boolean
  searchQuery: string
}

export const SalesTab = ({ isMobile: _isMobile, searchQuery }: Props) => {
  const bn = useBn()
  const sales = useStoreStore((s) => s.sales)
  const deleteSale = useStoreStore((s) => s.deleteSale)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [filterSource, setFilterSource] = useState('')

  const paymentLabels: Record<string, { en: string; bn: string }> = {
    cash: { en: 'Cash', bn: 'নগদ' },
    bank: { en: 'Bank', bn: 'ব্যাংক' },
    mobile: { en: 'Mobile', bn: 'মোবাইল' },
    other: { en: 'Other', bn: 'অন্যান্য' },
  }

  const isFeeCollect = (s: typeof sales[number]) => s.note?.includes('Fee Collect')

  const filtered = useMemo(() => {
    let list = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.soldToName.toLowerCase().includes(q) || s.soldToNameBn.includes(q) || s.soldToClass.includes(q) || s.id.toLowerCase().includes(q) || s.items.some((i) => i.productName.toLowerCase().includes(q) || i.productNameBn.includes(q)))
    }
    if (dateFrom) list = list.filter((s) => s.createdAt >= dateFrom)
    if (dateTo) list = list.filter((s) => s.createdAt <= dateTo + 'T23:59:59')
    if (filterPayment) list = list.filter((s) => s.paymentMethod === filterPayment)
    if (filterSource === 'feecollect') list = list.filter((s) => isFeeCollect(s))
    if (filterSource === 'direct') list = list.filter((s) => !isFeeCollect(s))
    return list
  }, [sales, searchQuery, dateFrom, dateTo, filterPayment, filterSource])

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0)
  const feeCollectCount = filtered.filter((s) => isFeeCollect(s)).length
  const directCount = filtered.length - feeCollectCount

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString(bn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: bn ? 'মোট বিক্রয়' : 'Total Sales', value: bn ? toBnNum(filtered.length) : String(filtered.length), icon: <Receipt size={14} />, color: 'var(--brand)' },
          { label: bn ? 'মোট আয়' : 'Total Revenue', value: bn ? `৳${toBnNum(totalRevenue)}` : `৳${totalRevenue.toLocaleString()}`, icon: <ShoppingBag size={14} />, color: 'var(--green)' },
          { label: bn ? 'ফি কালেক্ট' : 'Fee Collect', value: bn ? toBnNum(feeCollectCount) : String(feeCollectCount), icon: <Receipt size={14} />, color: 'var(--teal)' },
          { label: bn ? 'সরাসরি বিক্রয়' : 'Direct Sale', value: bn ? toBnNum(directCount) : String(directCount), icon: <ShoppingBag size={14} />, color: 'var(--amber)' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 p-3 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
            <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[1rem] text-[var(--text-primary)] leading-tight">{s.value}</div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputCls} w-auto`} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputCls} w-auto`} />
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className={`${selectCls} w-auto min-w-[7rem]`}>
          <option value="">{bn ? 'সব পেমেন্ট' : 'All Payments'}</option>
          <option value="cash">{bn ? 'নগদ' : 'Cash'}</option>
          <option value="bank">{bn ? 'ব্যাংক' : 'Bank'}</option>
          <option value="mobile">{bn ? 'মোবাইল' : 'Mobile'}</option>
          <option value="other">{bn ? 'অন্যান্য' : 'Other'}</option>
        </select>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={`${selectCls} w-auto min-w-[8rem]`}>
          <option value="">{bn ? 'সব উৎস' : 'All Sources'}</option>
          <option value="feecollect">{bn ? 'ফি কালেক্ট' : 'Fee Collect'}</option>
          <option value="direct">{bn ? 'সরাসরি' : 'Direct'}</option>
        </select>
      </div>

      {/* Sales list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[var(--text-secondary)] text-[0.875rem]">
          {bn ? 'কোনো বিক্রয় পাওয়া যায়নি' : 'No sales found'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const fromFee = isFeeCollect(s)
            return (
              <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] overflow-hidden hover:shadow-md transition-shadow">
                {/* Header row */}
                <div className="flex items-center gap-3 p-4 pb-3">
                  {/* Student avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[0.75rem] font-bold" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                    {getInitials(s.soldToNameBn || s.soldToName)}
                  </div>
                  {/* Student info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.875rem] font-semibold text-[var(--text-primary)] truncate">{bn ? s.soldToNameBn : s.soldToName}</span>
                      {fromFee && (
                        <span className="px-1.5 py-0.5 rounded text-[0.5625rem] font-bold bg-[var(--teal)]/10 text-[var(--teal)] uppercase tracking-wider">
                          {bn ? 'ফি কালেক্ট' : 'FEE COLLECT'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? `শ্রেণি ${s.soldToClass}` : `Class ${s.soldToClass}`}</span>
                      <span className="text-[0.5rem] text-[var(--text-muted)]">·</span>
                      <span className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? `সেকশন ${s.soldToSection}` : `Section ${s.soldToSection}`}</span>
                      <span className="text-[0.5rem] text-[var(--text-muted)]">·</span>
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">{formatDate(s.createdAt)} {formatTime(s.createdAt)}</span>
                    </div>
                  </div>
                  {/* Amount + delete */}
                  <div className="text-right shrink-0">
                    <div className="text-[1rem] font-bold text-[var(--text-primary)]">৳{bn ? toBnNum(s.total) : s.total.toLocaleString()}</div>
                    <div className="text-[0.625rem] text-[var(--text-secondary)]">{paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 pb-3">
                  <div className="bg-[var(--bg-secondary)]/60 rounded-lg p-2.5 space-y-1.5">
                    {s.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[0.75rem]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[var(--text-secondary)]">{bn ? item.productNameBn : item.productName}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[var(--text-muted)]">{bn ? toBnNum(item.qty) : item.qty} × ৳{bn ? toBnNum(item.unitPrice) : item.unitPrice}</span>
                          <span className="font-semibold text-[var(--text-primary)] w-16 text-right">৳{bn ? toBnNum(item.subtotal) : item.subtotal.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30">
                  <span className="text-[0.6875rem] text-[var(--text-muted)]">
                    {s.items.reduce((sum, i) => sum + i.qty, 0)} {bn ? 'টি পণ্য' : 'items'}
                    {s.note && <span className="ml-1.5">· {s.note}</span>}
                  </span>
                  <button onClick={() => { if (confirm(bn ? 'এই বিক্রয় মুছে ফেলতে চান?' : 'Delete this sale?')) deleteSale(s.id) }}
                    className="text-[0.6875rem] text-red-500 cursor-pointer hover:underline">
                    {bn ? 'মুছুন' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
