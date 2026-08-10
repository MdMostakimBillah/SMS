import { useMemo } from 'react'
import { useBn } from '@/hooks/useBn'
import { useStoreStore } from '@/store/storeStore'
import { toBnNum } from '@/lib/i18n'

interface Props {
  isMobile: boolean
}

export const ReportsTab = ({ isMobile }: Props) => {
  const bn = useBn()
  const products = useStoreStore((s) => s.products)
  const sales = useStoreStore((s) => s.sales)

  const stats = useMemo(() => {
    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.isActive).length
    const lowStockItems = products.filter((p) => p.isActive && p.stock <= p.minStock)
    const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0)
    const totalRetailValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr))
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)

    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const monthSales = sales.filter((s) => s.createdAt >= monthStart)
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0)

    const yearStart = `${now.getFullYear()}-01-01`
    const yearSales = sales.filter((s) => s.createdAt >= yearStart)
    const yearRevenue = yearSales.reduce((sum, s) => sum + s.total, 0)

    const totalSalesCount = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)

    return { totalProducts, activeProducts, lowStockItems, totalStockValue, totalRetailValue, todaySales: todaySales.length, todayRevenue, monthSales: monthSales.length, monthRevenue, yearSales: yearSales.length, yearRevenue, totalSalesCount, totalRevenue }
  }, [products, sales])

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, bank: 0, mobile: 0, other: 0 }
    sales.forEach((s) => { map[s.paymentMethod] = (map[s.paymentMethod] || 0) + s.total })
    return map
  }, [sales])

  const paymentLabels: Record<string, { en: string; bn: string; color: string }> = {
    cash: { en: 'Cash', bn: 'নগদ', color: 'text-green-600' },
    bank: { en: 'Bank', bn: 'ব্যাংক', color: 'text-blue-600' },
    mobile: { en: 'Mobile', bn: 'মোবাইল', color: 'text-purple-600' },
    other: { en: 'Other', bn: 'অন্যান্য', color: 'text-gray-600' },
  }

  const Card = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <div className={`p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]`}>
      <div className="text-[0.75rem] text-[var(--text-secondary)] mb-1">{label}</div>
      <div className={`text-[1.125rem] font-bold ${color || 'text-[var(--text-primary)]'}`}>{value}</div>
      {sub && <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{sub}</div>}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'}>
        <Card label={bn ? 'মোট পণ্য' : 'Total Products'} value={bn ? toBnNum(stats.totalProducts) : String(stats.totalProducts)} sub={`${stats.activeProducts} ${bn ? 'সক্রিয়' : 'active'}`} />
        <Card label={bn ? 'স্টক মূল্য (ক্রয়)' : 'Stock Value (Cost)'} value={bn ? `৳${toBnNum(stats.totalStockValue)}` : `৳${stats.totalStockValue}`} />
        <Card label={bn ? 'স্টক মূল্য (বিক্রয়)' : 'Stock Value (Retail)'} value={bn ? `৳${toBnNum(stats.totalRetailValue)}` : `৳${stats.totalRetailValue}`} />
        <Card label={bn ? 'সর্বনিম্ন স্টক পণ্য' : 'Low Stock Items'} value={bn ? toBnNum(stats.lowStockItems.length) : String(stats.lowStockItems.length)} color={stats.lowStockItems.length > 0 ? 'text-red-500' : 'text-green-600'} />
      </div>

      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'}>
        <Card label={bn ? 'আজকের বিক্রয়' : "Today's Sales"} value={bn ? `৳${toBnNum(stats.todayRevenue)}` : `৳${stats.todayRevenue}`} sub={`${stats.todaySales} ${bn ? 'টি' : 'items'}`} />
        <Card label={bn ? 'মাসিক বিক্রয়' : 'Monthly Sales'} value={bn ? `৳${toBnNum(stats.monthRevenue)}` : `৳${stats.monthRevenue}`} sub={`${stats.monthSales} ${bn ? 'টি' : 'items'}`} />
        <Card label={bn ? 'বার্ষিক বিক্রয়' : 'Yearly Sales'} value={bn ? `৳${toBnNum(stats.yearRevenue)}` : `৳${stats.yearRevenue}`} sub={`${stats.yearSales} ${bn ? 'টি' : 'items'}`} />
        <Card label={bn ? 'সর্বকালের মোট' : 'All-Time Total'} value={bn ? `৳${toBnNum(stats.totalRevenue)}` : `৳${stats.totalRevenue}`} sub={`${stats.totalSalesCount} ${bn ? 'টি বিক্রয়' : 'sales'}`} />
      </div>

      <div>
        <h4 className="text-[0.8125rem] font-semibold text-[var(--text-primary)] mb-3">
          {bn ? 'পেমেন্ট পদ্ধতি ভিত্তিক' : 'Payment Breakdown'}
        </h4>
        <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'}>
          {Object.entries(paymentBreakdown).map(([method, amount]) => (
            <div key={method} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-[0.75rem] text-[var(--text-secondary)]">{paymentLabels[method]?.[bn ? 'bn' : 'en']}</div>
              <div className={`text-[1rem] font-bold ${paymentLabels[method]?.color}`}>
                {bn ? `৳${toBnNum(amount)}` : `৳${amount}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {stats.lowStockItems.length > 0 && (
        <div>
          <h4 className="text-[0.8125rem] font-semibold text-[var(--text-primary)] mb-3">
            {bn ? '⚠ সর্বনিম্ন স্টক পণ্য' : '⚠ Low Stock Alert'}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পণ্য' : 'Product'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'সর্বনিম্ন' : 'Min Stock'}</th>
                  <th className="text-right py-2 px-3 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'পুরণ প্রয়োজন' : 'Need Restock'}</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 px-3 text-[0.8125rem]">{bn ? p.nameBn : p.name}</td>
                    <td className="py-2 px-3 text-right text-[0.8125rem] text-red-500 font-semibold">{bn ? toBnNum(p.stock) : p.stock}</td>
                    <td className="py-2 px-3 text-right text-[0.8125rem]">{bn ? toBnNum(p.minStock) : p.minStock}</td>
                    <td className="py-2 px-3 text-right text-[0.8125rem] font-semibold">{bn ? toBnNum(p.minStock - p.stock) : p.minStock - p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
