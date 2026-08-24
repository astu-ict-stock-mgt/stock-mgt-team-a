import { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, KpiCard, Badge, Button, Icons } from '../components/ui'
import { chartData } from '../data/sampleData'
import { useApp } from '../context/AppContext'

interface DashboardProps {
  loading?: boolean
}



const typeConfig = {
  received: { label: 'Received', badge: 'success' as const, icon: '↓' },
  issued: { label: 'Issued', badge: 'default' as const, icon: '↑' },
  transferred: { label: 'Transfer', badge: 'primary' as const, icon: '⇄' },
  adjusted: { label: 'Adjusted', badge: 'warning' as const, icon: '≈' },
}

const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF']

export default function Dashboard({ loading }: DashboardProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const { stockMovements, notifications, inventoryItems } = useApp()
  const recentActivity = stockMovements.slice(0, 5)
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockCount = inventoryItems.filter(i => i.status === 'low-stock' || i.qty <= i.minQty).length
  const todayTransactions = stockMovements.filter(m => m.date.startsWith('2025-08-07')).length

  const kpis = [
    { title: 'Total Inventory Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: '4.2%', changeDir: 'up' as const, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, iconBg: 'bg-[#EEF2FF]', iconColor: 'text-[#4F46E5]' },
    { title: 'Low Stock Alerts', value: lowStockCount.toString(), change: '1 new', changeDir: 'down' as const, icon: Icons.alert, iconBg: 'bg-[#FFFBEB]', iconColor: 'text-[#D97706]' },
    { title: 'Pending Approvals', value: '5', change: '2 urgent', changeDir: 'neutral' as const, icon: Icons.stocktake, iconBg: 'bg-[#F0FDF4]', iconColor: 'text-[#16A34A]' },
    { title: "Today's Transactions", value: todayTransactions.toString(), change: '6 received', changeDir: 'up' as const, icon: Icons.transfer, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#7C3AED]' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={i} loading={loading} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Stock Movement Trend */}
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
              <AreaChart data={chartData.stockMovement} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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

        {/* Category Breakdown */}
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
                  <Pie data={chartData.categoryBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}>
                    {chartData.categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={activeIndex === null || activeIndex === index ? 1 : 0.5} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {chartData.categoryBreakdown.slice(0, 4).map((c, i) => (
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

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Activity */}
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
              recentActivity.map(tx => {
                const config = typeConfig[tx.type as keyof typeof typeConfig] || { label: tx.type, badge: 'default' as const, icon: '•' }
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                      ${tx.type === 'received' ? 'bg-[#F0FDF4] text-[#16A34A]' : tx.type === 'issued' ? 'bg-[#F1F5F9] text-[#64748B]' : tx.type.startsWith('transfer') ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#FFFBEB] text-[#D97706]'}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1E293B] font-medium truncate">{tx.item}</p>
                      <p className="text-xs text-[#94A3B8]">{tx.qty} {tx.unit} · {tx.user} · {tx.warehouse}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={config.badge}>{config.label}</Badge>
                      <span className="text-xs text-[#94A3B8] w-16 text-right">{tx.date.slice(11)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Alerts & Notifications */}
        <Card padding={false}>
          <div className="flex items-center justify-between p-5 pb-4 border-b border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A]">Alerts</h3>
            <span className="w-5 h-5 bg-[#DC2626] rounded-full flex items-center justify-center text-white text-xs font-bold">{notifications.filter(n => !n.read).length}</span>
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
              notifications.filter(n => !n.read).map(n => (
                <div key={n.id} className="p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.type === 'danger' ? 'bg-[#DC2626]' : n.type === 'warning' ? 'bg-[#D97706]' : 'bg-[#4F46E5]'}`} />
                    <div>
                      <p className="text-xs font-semibold text-[#1E293B]">{n.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-[#94A3B8] mt-1.5">{n.time}</p>
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
