import { useState, useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { inputCls, selectCls } from '@/lib/styles'

interface Props {
  isMobile: boolean
  searchQuery: string
}

export const SalesTab = ({ isMobile, searchQuery }: Props) => {
  const bn = useBn()
  const sales = useStoreStore((s) => s.sales)
  const deleteSale = useStoreStore((s) => s.deleteSale)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterPayment, setFilterPayment] = useState('')

  const paymentLabels: Record<string, { en: string; bn: string }> = {
    cash: { en: 'Cash', bn: 'নগদ' },
    bank: { en: 'Bank', bn: 'ব্যাংক' },
    mobile: { en: 'Mobile', bn: 'মোবাইল' },
    other: { en: 'Other', bn: 'অন্যান্য' },
  }

  const filtered = useMemo(() => {
    let list = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.soldToName.toLowerCase().includes(q) || s.soldToNameBn.includes(q) || s.id.toLowerCase().includes(q))
    }
    if (dateFrom) list = list.filter((s) => s.createdAt >= dateFrom)
    if (dateTo) list = list.filter((s) => s.createdAt <= dateTo + 'T23:59:59')
    if (filterPayment) list = list.filter((s) => s.paymentMethod === filterPayment)
    return list
  }, [sales, searchQuery, dateFrom, dateTo, filterPayment])

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString(bn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap gap-2 mb-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputCls} w-auto`} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputCls} w-auto`} />
        <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className={`${selectCls} w-auto min-w-[7rem]`}>
          <option value="">{bn ? 'সব পেমেন্ট' : 'All Payments'}</option>
          <option value="cash">{bn ? 'নগদ' : 'Cash'}</option>
          <option value="bank">{bn ? 'ব্যাংক' : 'Bank'}</option>
          <option value="mobile">{bn ? 'মোবাইল' : 'Mobile'}</option>
          <option value="other">{bn ? 'অন্যান্য' : 'Other'}</option>
        </select>
      </div>

      <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] mb-3">
        <span className="text-[0.8125rem] text-[var(--text-secondary)]">{bn ? 'মোট আয়: ' : 'Total Revenue: '}</span>
        <span className="text-[0.9375rem] font-semibold text-green-600">{bn ? `৳${toBnNum(totalRevenue)}` : `৳${totalRevenue}`}</span>
        <span className="text-[0.75rem] text-[var(--text-secondary)] ml-2">({bn ? `${toBnNum(filtered.length)} টি বিক্রয়` : `${filtered.length} sales`})</span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-[0.875rem]">
          {bn ? 'কোনো বিক্রয় পাওয়া যায়নি' : 'No sales found'}
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-medium text-[0.8125rem]">{bn ? s.soldToNameBn : s.soldToName}</div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)]">{s.soldToClass} — {s.soldToSection}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[0.8125rem]">{bn ? `৳${toBnNum(s.total)}` : `৳${s.total}`}</div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)]">{formatDate(s.createdAt)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {s.items.map((item, i) => (
                  <span key={i} className="text-[0.6875rem] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                    {bn ? item.productNameBn : item.productName} ×{item.qty}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border)]">
                <span className="text-[0.6875rem] text-[var(--text-secondary)]">
                  {paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}
                </span>
                <button onClick={() => deleteSale(s.id)} className="text-[0.6875rem] text-red-500 cursor-pointer hover:underline">{bn ? 'মুছুন' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'তারিখ' : 'Date'}</th>
                <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ছাত্র/ছাত্রী' : 'Student'}</th>
                <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পণ্য' : 'Items'}</th>
                <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পেমেন্ট' : 'Payment'}</th>
                <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'মোট' : 'Total'}</th>
                <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)]">
                  <td className="py-2.5 px-3">
                    <div className="text-[0.8125rem]">{formatDate(s.createdAt)}</div>
                    <div className="text-[0.6875rem] text-[var(--text-secondary)]">{formatTime(s.createdAt)}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-[0.8125rem]">{bn ? s.soldToNameBn : s.soldToName}</div>
                    <div className="text-[0.6875rem] text-[var(--text-secondary)]">{s.soldToClass} — {s.soldToSection}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {s.items.map((item, i) => (
                        <span key={i} className="text-[0.6875rem] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                          {bn ? item.productNameBn : item.productName} ×{item.qty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[0.8125rem]">
                    {paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[0.8125rem]">{bn ? `৳${toBnNum(s.total)}` : `৳${s.total}`}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button onClick={() => deleteSale(s.id)} className="text-[0.75rem] text-red-500 cursor-pointer hover:underline">{bn ? 'মুছুন' : 'Delete'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
