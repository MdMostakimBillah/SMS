import { useState, useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'
import { inputCls, selectCls } from '@/lib/styles'
import { ShoppingCart, User, Package, CreditCard, Trash2 } from 'lucide-react'

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
  const [filterSource, setFilterSource] = useState('')

  const paymentLabels: Record<string, { en: string; bn: string }> = {
    cash: { en: 'Cash', bn: 'নগদ' },
    bank: { en: 'Bank', bn: 'ব্যাংক' },
    mobile: { en: 'Mobile', bn: 'মোবাইল' },
    other: { en: 'Other', bn: 'অন্যান্য' },
  }

  const isFeeCollect = (s: typeof sales[0]) => s.note?.startsWith('Fee Collect')

  const filtered = useMemo(() => {
    let list = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.soldToName.toLowerCase().includes(q) || s.soldToNameBn.includes(q) || s.id.toLowerCase().includes(q) || s.items.some((i) => i.productName.toLowerCase().includes(q) || i.productNameBn.includes(q)))
    }
    if (dateFrom) list = list.filter((s) => s.createdAt >= dateFrom)
    if (dateTo) list = list.filter((s) => s.createdAt <= dateTo + 'T23:59:59')
    if (filterPayment) list = list.filter((s) => s.paymentMethod === filterPayment)
    if (filterSource === 'fee') list = list.filter((s) => isFeeCollect(s))
    if (filterSource === 'store') list = list.filter((s) => !isFeeCollect(s))
    return list
  }, [sales, searchQuery, dateFrom, dateTo, filterPayment, filterSource])

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0)
  const totalItems = filtered.reduce((sum, s) => sum + s.items.reduce((isum, i) => isum + i.qty, 0), 0)
  const totalSales = filtered.length

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString(bn ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const SummaryCard = ({ icon: Icon, label, value, color }: { icon: typeof ShoppingCart; label: string; value: string; color: string }) => (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
        <Icon size={16} />
      </div>
      <div>
        <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{value}</div>
        <div className="text-[0.625rem] text-[var(--text-secondary)]">{label}</div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard icon={ShoppingCart} label={bn ? 'মোট বিক্রয়' : 'Total Sales'} value={bn ? toBnNum(totalSales) : String(totalSales)} color="var(--brand)" />
        <SummaryCard icon={Package} label={bn ? 'মোট পণ্য বিক্রি' : 'Items Sold'} value={bn ? toBnNum(totalItems) : String(totalItems)} color="var(--teal)" />
        <SummaryCard icon={CreditCard} label={bn ? 'মোট আয়' : 'Total Revenue'} value={bn ? `৳${toBnNum(totalRevenue)}` : `৳${totalRevenue.toLocaleString()}`} color="var(--green)" />
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
          <option value="fee">{bn ? 'ফি সংগ্রহ' : 'Fee Collect'}</option>
          <option value="store">{bn ? 'দোকান' : 'Store'}</option>
        </select>
      </div>

      {/* Sales list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-secondary)] text-[0.875rem]">
          {bn ? 'কোনো বিক্রয় পাওয়া যায়নি' : 'No sales found'}
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((s) => {
            const feeCollect = isFeeCollect(s)
            return (
              <div key={s.id} className={`p-3 rounded-xl border ${feeCollect ? 'bg-[var(--brand)]/5 border-[var(--brand)]/20' : 'bg-[var(--surface)] border-[var(--border)]'}`}>
                {/* Header: Student + Total */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)]">
                      <User size={14} className="text-[var(--text-secondary)]" />
                    </div>
                    <div>
                      <div className="font-medium text-[0.8125rem] text-[var(--text-primary)]">{bn ? s.soldToNameBn : s.soldToName}</div>
                      <div className="text-[0.6875rem] text-[var(--text-secondary)]">{s.soldToClass} — {s.soldToSection}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[0.9375rem] text-[var(--text-primary)]">{bn ? `৳${toBnNum(s.total)}` : `৳${s.total.toLocaleString()}`}</div>
                    {feeCollect && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[0.5625rem] font-bold bg-[var(--brand)]/10 text-[var(--brand)] uppercase">
                        {bn ? 'ফি সংগ্রহ' : 'FEE'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-2">
                  {s.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[0.75rem]">
                      <span className="text-[var(--text-secondary)]">
                        {bn ? item.productNameBn : item.productName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-muted)]">×{item.qty}</span>
                        <span className="font-medium text-[var(--text-primary)]">{bn ? `৳${toBnNum(item.subtotal)}` : `৳${item.subtotal.toLocaleString()}`}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6875rem] text-[var(--text-muted)]">{formatDate(s.createdAt)}</span>
                    <span className="text-[0.6875rem] text-[var(--text-muted)]">{formatTime(s.createdAt)}</span>
                    <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}
                    </span>
                  </div>
                  <button onClick={() => deleteSale(s.id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const feeCollect = isFeeCollect(s)
            return (
              <div key={s.id} className={`p-4 rounded-xl border transition-shadow hover:shadow-md ${feeCollect ? 'bg-[var(--brand)]/5 border-[var(--brand)]/20' : 'bg-[var(--surface)] border-[var(--border)]'}`}>
                {/* Top row: Student + Date + Total */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)]">
                      <User size={16} className="text-[var(--text-secondary)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[0.875rem] text-[var(--text-primary)]">{bn ? s.soldToNameBn : s.soldToName}</span>
                        {feeCollect && (
                          <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-bold bg-[var(--brand)]/10 text-[var(--brand)] uppercase tracking-wider">
                            {bn ? 'ফি সংগ্রহ' : 'Fee Collect'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[0.6875rem] text-[var(--text-secondary)]">{s.soldToClass} — {s.soldToSection}</span>
                        <span className="text-[0.5rem] text-[var(--text-muted)]">·</span>
                        <span className="text-[0.6875rem] text-[var(--text-muted)]">{formatDate(s.createdAt)} {formatTime(s.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[1.0625rem] text-[var(--text-primary)]">{bn ? `৳${toBnNum(s.total)}` : `৳${s.total.toLocaleString()}`}</div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">
                      {s.items.length} {bn ? 'পণ্য' : 'items'} · {s.items.reduce((isum, i) => isum + i.qty, 0)} {bn ? 'পিস' : 'pcs'}
                    </div>
                  </div>
                </div>

                {/* Items grid */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {s.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <Package size={12} className="text-[var(--text-muted)]" />
                      <span className="text-[0.75rem] text-[var(--text-primary)] font-medium">{bn ? item.productNameBn : item.productName}</span>
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">×{item.qty}</span>
                      <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{bn ? `৳${toBnNum(item.subtotal)}` : `৳${item.subtotal.toLocaleString()}`}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)]">
                  <span className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                    {paymentLabels[s.paymentMethod]?.[bn ? 'bn' : 'en']}
                  </span>
                  <button onClick={() => deleteSale(s.id)} className="flex items-center gap-1 text-[0.6875rem] text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer">
                    <Trash2 size={12} />
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
