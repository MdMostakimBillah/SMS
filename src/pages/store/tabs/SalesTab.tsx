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

  const getReceiptNo = (note: string) => {
    const match = note?.match(/RCP-\w+/)
    return match ? match[0] : ''
  }

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

      {/* Table view */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[var(--text-secondary)] text-[0.875rem] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50">
          {bn ? 'কোনো বিক্রয় পাওয়া যায়নি' : 'No sales found'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                <th className="text-left py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'তারিখ' : 'Date'}</th>
                <th className="text-left py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রসিদ' : 'Receipt'}</th>
                <th className="text-left py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'শিক্ষার্থী' : 'Student'}</th>
                <th className="text-left py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পণ্য' : 'Items'}</th>
                <th className="text-left py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পেমেন্ট' : 'Payment'}</th>
                <th className="text-right py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'মোট' : 'Total'}</th>
                <th className="text-right py-2.5 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const receipt = getReceiptNo(s.note)
                const fromFee = isFeeCollect(s)
                return (
                  <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]">
                    <td className="py-2.5 px-3 text-[0.8125rem] text-[var(--text-muted)]">{bn ? toBnNum(idx + 1) : idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="text-[0.8125rem]">{formatDate(s.createdAt)}</div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)]">{formatTime(s.createdAt)}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        {receipt && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--brand)]/8 text-[var(--brand)] text-[0.625rem] font-mono font-medium">
                            {receipt}
                          </span>
                        )}
                        {fromFee && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--teal)]/10 text-[var(--teal)] text-[0.5625rem] font-bold uppercase">
                            {bn ? 'ফি' : 'FEE'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-[0.8125rem] font-medium">{bn ? s.soldToNameBn : s.soldToName}</div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? `শ্রেণি ${s.soldToClass}` : `Class ${s.soldToClass}`}{s.soldToSection ? ` — ${s.soldToSection}` : ''}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {s.items.map((item, i) => (
                          <span key={i} className="text-[0.625rem] bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded whitespace-nowrap">
                            {bn ? item.productNameBn : item.productName} ×{item.qty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[0.8125rem] text-[var(--text-secondary)]">
                      {paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[0.875rem]">৳{bn ? toBnNum(s.total) : s.total.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button onClick={() => { if (confirm(bn ? 'এই বিক্রয় মুছে ফেলতে চান?' : 'Delete this sale?')) deleteSale(s.id) }}
                        className="text-[0.6875rem] text-red-500 cursor-pointer hover:underline">
                        {bn ? 'মুছুন' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
