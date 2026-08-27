import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, KpiCard } from '../../components/ui'
import { useApp } from '../../context/AppContext'

export default function AccountantDashboard() {
  const { stockCards, inventoryItems, categories, stockMovements } = useApp()

  const totalValue = stockCards.reduce((sum, sc) => sum + (sc.availableQty * (sc.averageCost || 0)), 0)
  const totalItems = stockCards.reduce((sum, sc) => sum + sc.availableQty, 0)
  const categoryValue = useMemo(() => {
    const catMap: Record<string, number> = {}
    stockCards.forEach(sc => {
      const item = inventoryItems.find(i => i.id === sc.itemId)
      const catName = categories.find(c => c.id === item?.categoryId)?.name || 'Unknown'
      catMap[catName] = (catMap[catName] || 0) + sc.availableQty * (sc.averageCost || 0)
    })
    return Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)
  }, [stockCards, inventoryItems, categories])

  const valueOverTime = useMemo(() => {
    const byDate: Record<string, number> = {}
    let running = 0
    stockMovements.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(m => {
      const date = m.createdAt.split('T')[0]
      if (!byDate[date]) byDate[date] = running
      if (['RECEIPT', 'TRANSFER_IN', 'RETURN'].includes(m.transactionType)) running += m.quantity
      else if (['ISSUE', 'TRANSFER_OUT', 'DISPOSAL'].includes(m.transactionType)) running -= m.quantity
      byDate[date] = running
    })
    return Object.entries(byDate).slice(-30).map(([date, value]) => ({ date: date.slice(5), value: Math.round(value) }))
  }, [stockMovements])

  const kpis = [
    { title: 'Total Stock Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
    { title: 'Total Units', value: totalItems.toLocaleString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: 'Categories', value: categoryValue.length.toString(), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7C3AED]' },
    { title: 'Avg Cost/Unit', value: totalItems > 0 ? `$${(totalValue / totalItems).toFixed(2)}` : '$0', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card padding={false}>
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold text-[#0F172A]">Stock Value Trend</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">Last 30 days</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={valueOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
              <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} fill="#4F46E5" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card padding={false}>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Value by Category</h3>
          </div>
          <div className="divide-y divide-[#F8FAFC] px-5">
            {categoryValue.slice(0, 6).map((c, i) => (
              <div key={i} className="py-2 flex items-center justify-between">
                <span className="text-xs text-[#64748B]">{c.name}</span>
                <span className="text-xs font-mono font-bold">${c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
