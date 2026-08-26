import { useState, useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, KpiCard, Badge, Button, Icons } from '../components/ui'
import { useApp } from '../context/AppContext'

interface DashboardProps {
  loading?: boolean
}

const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF']

export default function Dashboard({ loading }: DashboardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { stockMovements, notifications, inventoryItems, stockCards, categories, requisitions, transfers } = useApp()

  const lowStockCount = inventoryItems.filter(i => stockCards.some(sc => sc.itemId === i.id && sc.availableQty <= i.minimumStock)).length
  const todayTransactions = stockMovements.filter(m => m.createdAt.startsWith(new Date().toISOString().split('T')[0])).length
  const totalValue = stockCards.reduce((sum, sc) => sum + (sc.availableQty * (sc.averageCost || 0)), 0)
  const pendingApprovals = requisitions.filter(r => r.status === 'SUBMITTED').length + transfers.filter(t => t.status === 'SUBMITTED').length

  const chartData = useMemo(() => {
    const movementByDate: Record<string, { received: number; issued: number }> = {}
    stockMovements.forEach(m => {
      const date = m.createdAt.split('T')[0]
      if (!movementByDate[date]) movementByDate[date] = { received: 0, issued: 0 }
      if (['RECEIPT', 'TRANSFER_IN', 'RETURN'].includes(m.transactionType)) {
        movementByDate[date].received += m.quantity
      } else if (['ISSUE', 'TRANSFER_OUT', 'DISPOSAL'].includes(m.transactionType)) {
        movementByDate[date].issued += m.quantity
      }
    })
    const sortedDates = Object.keys(movementByDate).sort().slice(-30)
    return sortedDates.map(date => ({
      date: date.slice(5),
      received: movementByDate[date].received,
      issued: movementByDate[date].issued,
    }))
  }, [stockMovements])

  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {}
    stockCards.forEach(sc => {
      const item = inventoryItems.find(i => i.id === sc.itemId)
      const catName = categories.find(c => c.id === item?.categoryId)?.name || 'Unknown'
      catMap[catName] = (catMap[catName] || 0) + sc.availableQty * (sc.averageCost || 0)
    })
    return Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) }))
  }, [stockCards, inventoryItems, categories])

  const kpis = [
    { title: 'Total Inventory Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
    { title: 'Low Stock Alerts', value: lowStockCount.toString(), icon: Icons.alert, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: 'Pending Approvals', value: pendingApprovals.toString(), icon: Icons.stocktake, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: "Today's Transactions", value: todayTransactions.toString(), icon: Icons.transfer, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7C3AED]' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} loading={loading} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2" padding={false}>
          <div className="p-5 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Stock Movement Trend</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Last 30 days — received vs. issued</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />Received</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C7D2FE]" />Issued</span>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="h-52 px-5 pb-5 flex items-end gap-3">
              {[60, 80, 50, 90, 70, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col gap-1 justify-end">
                  <div className="skeleton w-full" style={{ height: h * 0.6 + 'px' }} />
                  <div className="skeleton w-full" style={{ height: h * 0.4 + 'px' }} />
                </div>
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: 'none', fontSize: 12 }} />
                <Area type="monotone" dataKey="received" stroke="#4F46E5" strokeWidth={2} fill="#4F46E5" fillOpacity={0.1} />
                <Area type="monotone" dataKey="issued" stroke="#A5B4FC" strokeWidth={2} fill="#A5B4FC" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card padding={false}>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-[#0F172A]">Inventory by Category</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">By stock value</p>
          </div>
          {loading ? (
            <div className="flex flex-col items-center gap-3 p-5 pt-0">
              <div className="skeleton w-28 h-28 rounded-full" />
              <div className="w-full space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-3 w-full" />)}
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}>
                    {categoryData.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={activeIndex === null || activeIndex === index ? 1 : 0.5} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-[#64748B]">{c.name}</span>
                    </div>
                    <span className="text-xs font-medium text-[#334155] font-mono">${c.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2" padding={false}>
          <div className="flex items-center justify-between p-5 pb-0 mb-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">Recent Activity</h3>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="skeleton w-7 h-7 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 w-48" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                  <div className="skeleton h-4 w-16 rounded-full" />
                </div>
              ))
            ) : (
              stockMovements.slice(0, 5).map(tx => {
                const isReceipt = ['RECEIPT', 'TRANSFER_IN', 'RETURN'].includes(tx.transactionType)
                const isIssue = ['ISSUE', 'TRANSFER_OUT', 'DISPOSAL'].includes(tx.transactionType)
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                      ${isReceipt ? 'bg-[#F0FDF4] text-[#16A34A]' : isIssue ? 'bg-[#F1F5F9] text-[#64748B]' : tx.transactionType === 'ADJUSTMENT' ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#EEF2FF] text-[#4F46E5]'}`}>
                      {isReceipt ? '↓' : isIssue ? '↑' : '⇄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1E293B] font-medium truncate">{tx.referenceNumber || tx.transactionType}</p>
                      <p className="text-xs text-[#94A3B8]">{tx.quantity} units · {tx.balanceAfter} after</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={isReceipt ? 'success' : isIssue ? 'default' : 'primary'}>{tx.transactionType}</Badge>
                      <span className="text-xs text-[#94A3B8] w-16 text-right">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card padding={false}>
          <div className="flex items-center justify-between p-5 pb-4 border-b border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A]">Alerts</h3>
            <span className="w-5 h-5 bg-[#DC2626] rounded-full flex items-center justify-center text-white text-xs font-bold">{notifications.filter(n => !n.isRead).length}</span>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 space-y-1.5">
                  <div className="skeleton h-3.5 w-32" />
                  <div className="skeleton h-3 w-full" />
                </div>
              ))
            ) : (
              notifications.filter(n => !n.isRead).slice(0, 5).map(n => (
                <div key={n.id} className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.type === 'DISPOSAL_CANDIDATE' ? 'bg-[#DC2626]' : n.type === 'LOW_STOCK' || n.type === 'EXPIRY_WARNING' ? 'bg-[#D97706]' : 'bg-[#4F46E5]'}`} />
                    <div>
                      <p className="text-xs font-semibold text-[#1E293B]">{n.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-[#94A3B8] mt-1.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
