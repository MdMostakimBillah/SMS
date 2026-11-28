import React from 'react'
import { ShoppingCart } from 'lucide-react'
import type { SMSPurchaseRecord } from '@/store/smsStore'

interface Props {
  isBn: boolean
  purchases: SMSPurchaseRecord[]
  onOpenBuyModal: () => void
}

export const PurchasesSmsTab = React.memo(function PurchasesSmsTab({
  isBn,
  purchases,
  onOpenBuyModal,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'বিডি প্রোভাইডার থেকে বাল্ক এসএমএস ক্রয়ের ইতিহাস' : 'Bulk SMS Provider Purchase History'}
          </h2>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {isBn ? 'সুপার অ্যাডমিন কর্তৃক মূল সরবরাহকারীর কাছ থেকে ক্রয়কৃত পুল' : 'Master credit inventory purchased from Bangladesh bulk SMS providers'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenBuyModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
        >
          <ShoppingCart size={15} />
          <span>{isBn ? 'নতুন ক্রয় যোগ করুন' : 'Record Purchase'}</span>
        </button>
      </div>

      {purchases.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[var(--text-muted)] border border-[var(--border)]">
          <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-[0.875rem] font-medium">
            {isBn ? 'এখনো কোনো বাল্ক SMS ক্রয় রেকর্ড করা হয়নি' : 'No bulk SMS purchases recorded yet'}
          </p>
          <p className="text-[0.75rem] mt-1">
            {isBn
              ? 'মাস্টার পুলে ক্রেডিট যোগ করতে "নতুন ক্রয় যোগ করুন" বাটনে ক্লিক করুন।'
              : 'Click "Record Purchase" to add credits from your Bangladesh SMS provider.'}
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[0.8125rem]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">{isBn ? 'অর্ডার আইডি / তারিখ' : 'Order ID / Date'}</th>
                  <th className="py-3 px-4">{isBn ? 'প্রোভাইডার' : 'Provider'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'পরিমাণ' : 'Quantity'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'প্রতি SMS রেট' : 'Unit Price'}</th>
                  <th className="py-3 px-4 text-right">{isBn ? 'মোট মূল্য' : 'Total BDT'}</th>
                  <th className="py-3 px-4">{isBn ? 'ইনভয়েস / রেফারেন্স' : 'Ref / Invoice'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-[var(--text-primary)]">{p.id.slice(0, 12)}</div>
                      <div className="text-[0.6875rem] text-[var(--text-muted)]">
                        {new Date(p.purchasedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{p.provider}</td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-500">{p.quantity.toLocaleString()} SMS</td>
                    <td className="py-3 px-4 text-right text-[var(--text-muted)]">{p.unitPrice.toFixed(3)} ৳</td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                      {p.totalCost.toLocaleString()} ৳
                    </td>
                    <td className="py-3 px-4 font-mono text-[0.75rem] text-[var(--text-secondary)]">{p.refId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
})
